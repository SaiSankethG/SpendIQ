from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.transactions import GmailSyncRequest
from app.services.gmail_service import gmail_service

router = APIRouter(prefix="/gmail", tags=["gmail"])


@router.post("/sync")
def sync_gmail(payload: GmailSyncRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return gmail_service.sync(db, user.id, payload)


@router.post("/watch")
def watch_gmail(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return gmail_service.watch(db, user.id)


@router.post("/webhook")
def gmail_webhook(payload: dict, db: Session = Depends(get_db)):
    """
    Webhook endpoint for Google Pub/Sub push delivery.
    This receives notifications when new emails arrive.
    """
    return gmail_service.process_pubsub_message(db, payload)

