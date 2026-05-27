import base64
import json
import logging
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import HTTPException
from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import GmailMessage, GmailWatch, OAuthToken, User
from app.parsers.registry import parser_registry
from app.schemas.transactions import GmailSyncRequest, TransactionCreate
from app.services.category_service import category_service
from app.services.transaction_service import transaction_service

logger = logging.getLogger(__name__)


class GmailService:
    bank_queries = {
        "HDFC": 'from:alerts@hdfcbank.bank.in subject:"Account update for your HDFC Bank A/c"',
    }

    scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.readonly",
    ]

    def build_query(self, request: GmailSyncRequest) -> str:
        parts: list[str] = []
        bank_query = self.bank_queries.get(request.bank.upper())
        if bank_query:
            parts.append(bank_query)
        if request.mode == "date_range" and request.start_date and request.end_date:
            # Gmail's before: operator is exclusive, so advance one day to include the selected end date.
            inclusive_end = request.end_date + timedelta(days=1)
            parts.append(f"after:{request.start_date.strftime('%Y/%m/%d')} before:{inclusive_end.strftime('%Y/%m/%d')}")
        return " ".join(parts)

    def _get_client_credentials(self, settings):
        if settings.google_client_id and settings.google_client_secret:
            return settings.google_client_id, settings.google_client_secret

        if settings.google_client_secrets_file:
            credentials_path = Path(settings.google_client_secrets_file).expanduser()
            if not credentials_path.is_absolute():
                credentials_path = Path.cwd() / credentials_path
            if credentials_path.exists():
                with credentials_path.open(encoding="utf-8") as f:
                    config = json.load(f)
                client_type = "web" if "web" in config else "installed" if "installed" in config else None
                if client_type:
                    client_info = config[client_type]
                    return client_info.get("client_id"), client_info.get("client_secret")

        raise ValueError("Google OAuth client_id and client_secret must be configured for Gmail sync")

    def sync(self, db: Session, user_id: str, request: GmailSyncRequest) -> dict[str, int]:
        token = db.query(OAuthToken).filter(OAuthToken.user_id == user_id).one_or_none()
        if not token:
            logger.warning("Gmail sync requested for user %s without an OAuth token", user_id)
            return {"fetched": 0, "created": 0, "skipped": 0}

        settings = get_settings()
        client_id, client_secret = self._get_client_credentials(settings)
        credentials = Credentials(
            token=token.access_token,
            refresh_token=token.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=token.scopes.split(),
        )
        gmail = build("gmail", "v1", credentials=credentials)
        query = self.build_query(request)
        max_results = request.last_n if request.mode == "last_n" else 500

        list_request = gmail.users().messages().list(userId="me", maxResults=max_results)
        if query:
            list_request = gmail.users().messages().list(userId="me", q=query, maxResults=max_results)

        logger.info("Starting Gmail sync for user %s: mode=%s max_results=%s query=%r", user_id, request.mode, max_results, query)
        try:
            response = list_request.execute()
        except RefreshError as exc:
            logger.exception("Gmail sync failed for user %s due to invalid or revoked OAuth refresh token", user_id)
            raise HTTPException(
                status_code=401,
                detail="Google authorization is no longer valid. Please reconnect your Gmail account.",
            ) from exc

        messages = response.get("messages", [])
        created = skipped = 0
        parse_skipped = 0
        duplicate_skipped = 0
        parser = parser_registry.get(request.bank)
        logger.info("Gmail sync listed %s candidate messages for user %s", len(messages), user_id)

        for message in messages:
            message_id = message["id"]
            if db.query(GmailMessage).filter_by(user_id=user_id, gmail_message_id=message_id).first():
                duplicate_skipped += 1
                skipped += 1
                continue

            try:
                detail = gmail.users().messages().get(userId="me", id=message_id, format="full").execute()
            except RefreshError as exc:
                logger.exception("Gmail sync failed while fetching message %s for user %s due to invalid or revoked OAuth refresh token", message_id, user_id)
                raise HTTPException(
                    status_code=401,
                    detail="Google authorization is no longer valid. Please reconnect your Gmail account.",
                ) from exc
            raw_text = self._extract_text(detail)
            if not parser.can_parse(raw_text):
                parse_skipped += 1
                skipped += 1
                continue

            received_date = self._received_date(detail)
            parsed = parser.parse(raw_text, received_date)
            category = category_service.suggest(parsed.merchant, raw_text)
            tx = TransactionCreate(
                bank=request.bank,
                source="gmail",
                amount=parsed.amount,
                type=parsed.type,
                merchant=parsed.merchant,
                category=category,
                transaction_date=parsed.transaction_date,
                reference_id=parsed.reference_id or message_id,
                raw_text=parsed.raw_text,
            )
            try:
                db.add(GmailMessage(user_id=user_id, gmail_message_id=message_id, bank=request.bank, raw_text=raw_text))
                transaction_service.create(db, user_id, tx)
                created += 1
            except IntegrityError:
                db.rollback()
                skipped += 1

        logger.info(
            "Gmail sync finished for user %s: fetched=%s created=%s skipped=%s parse_skipped=%s duplicate_skipped=%s",
            user_id,
            len(messages),
            created,
            skipped,
            parse_skipped,
            duplicate_skipped,
        )
        return {
            "fetched": len(messages),
            "created": created,
            "skipped": skipped,
            "parse_skipped": parse_skipped,
            "duplicate_skipped": duplicate_skipped,
        }

    def watch(self, db: Session, user_id: str) -> dict[str, str]:
        """Register this user's mailbox for Gmail watch notifications via Pub/Sub."""
        token = db.query(OAuthToken).filter(OAuthToken.user_id == user_id).one_or_none()
        if not token:
            return {"status": "not_connected"}
        
        settings = get_settings()
        if not settings.gmail_pubsub_topic:
            logger.warning("Gmail watch requested but GMAIL_PUBSUB_TOPIC is not configured")
            return {"status": "pending_cloud_setup", "detail": "GMAIL_PUBSUB_TOPIC not configured"}
        
        try:
            client_id, client_secret = self._get_client_credentials(settings)
            credentials = Credentials(
                token=token.access_token,
                refresh_token=token.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=client_id,
                client_secret=client_secret,
                scopes=token.scopes.split(),
            )
            gmail = build("gmail", "v1", credentials=credentials)
            
            # Call Gmail watch API
            watch_response = gmail.users().watch(
                userId="me",
                body={"topicName": settings.gmail_pubsub_topic}
            ).execute()
            
            # Store watch state in database
            expiration_ms = watch_response.get("expiration")
            history_id = watch_response.get("historyId", "")
            
            existing_watch = db.query(GmailWatch).filter(GmailWatch.user_id == user_id).one_or_none()
            if existing_watch:
                existing_watch.watch_expiration = datetime.fromtimestamp(int(expiration_ms) / 1000)
                existing_watch.history_id = history_id
                existing_watch.updated_at = datetime.utcnow()
            else:
                watch = GmailWatch(
                    user_id=user_id,
                    watch_expiration=datetime.fromtimestamp(int(expiration_ms) / 1000),
                    history_id=history_id,
                )
                db.add(watch)
            
            db.commit()
            logger.info("Gmail watch registered for user %s, expiration: %s", user_id, expiration_ms)
            return {"status": "watch_enabled", "expiration": expiration_ms}
            
        except RefreshError as exc:
            logger.exception("Gmail watch failed for user %s due to invalid or revoked OAuth token", user_id)
            raise HTTPException(
                status_code=401,
                detail="Google authorization is no longer valid. Please reconnect your Gmail account.",
            ) from exc
        except Exception as exc:
            logger.exception("Gmail watch registration failed for user %s", user_id)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to register Gmail watch: {str(exc)}",
            ) from exc

    def process_pubsub_message(self, db: Session, message_data: dict) -> dict[str, str]:
        """Process an incoming Pub/Sub message from Gmail watch."""
        try:
            # Pub/Sub message data is base64 encoded
            payload = message_data.get("message", {})
            data_b64 = payload.get("data", "")
            
            if not data_b64:
                logger.warning("Received Pub/Sub message with no data")
                return {"status": "ignored", "reason": "no_data"}
            
            # Decode the Gmail watch notification
            notification = json.loads(base64.b64decode(data_b64))
            user_id = notification.get("userId")
            history_id = notification.get("historyId")
            
            if not user_id:
                logger.warning("Received Pub/Sub message with no userId")
                return {"status": "ignored", "reason": "no_user_id"}
            
            # Get the user's Gmail watch record
            watch = db.query(GmailWatch).filter(GmailWatch.user_id == user_id).one_or_none()
            if not watch:
                logger.warning("Received Pub/Sub message for user %s but no watch record found", user_id)
                return {"status": "ignored", "reason": "no_watch_record"}
            
            # Update the history ID
            watch.history_id = history_id
            watch.updated_at = datetime.utcnow()
            db.commit()
            
            # Trigger a sync with the new history
            token = db.query(OAuthToken).filter(OAuthToken.user_id == user_id).one_or_none()
            if not token:
                logger.warning("Received Pub/Sub message for user %s but no OAuth token", user_id)
                return {"status": "ignored", "reason": "no_token"}
            
            settings = get_settings()
            client_id, client_secret = self._get_client_credentials(settings)
            credentials = Credentials(
                token=token.access_token,
                refresh_token=token.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=client_id,
                client_secret=client_secret,
                scopes=token.scopes.split(),
            )
            gmail = build("gmail", "v1", credentials=credentials)
            
            # Get the user's default bank from profile
            user = db.query(User).filter_by(id=user_id).one_or_none()
            bank = user.default_bank if user else "HDFC"
            
            # Fetch messages since last sync
            request = GmailSyncRequest(mode="last_n", last_n=10, bank=bank)
            sync_result = self.sync(db, user_id, request)
            
            logger.info("Processed Pub/Sub message for user %s, sync result: %s", user_id, sync_result)
            return {"status": "processed", "sync_result": sync_result}
            
        except Exception as exc:
            logger.exception("Failed to process Pub/Sub message")
            return {"status": "error", "detail": str(exc)}

    def _extract_text(self, message: dict) -> str:
        import base64

        snippets = []
        headers = message.get("payload", {}).get("headers", [])
        header_map = {header.get("name", "").lower(): header.get("value", "") for header in headers}

        from_header = header_map.get("from")
        if from_header:
            snippets.append(f"From: {from_header}")

        subject_header = header_map.get("subject")
        if subject_header:
            snippets.append(f"Subject: {subject_header}")

        snippet = message.get("snippet", "")
        if snippet:
            snippets.append(snippet)

        def collect_parts(part: dict) -> None:
            body = part.get("body", {})
            data = body.get("data")
            if data:
                snippets.append(base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore"))
            for child in part.get("parts", []):
                collect_parts(child)

        collect_parts(message.get("payload", {}))
        return "\n".join(snippets)

    def _received_date(self, message: dict) -> date:
        internal_date = message.get("internalDate")
        if internal_date:
            return datetime.fromtimestamp(int(internal_date) / 1000).date()
        return date.today()


gmail_service = GmailService()
