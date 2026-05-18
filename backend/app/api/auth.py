from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path

import google_auth_oauthlib.flow
import requests
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.entities import OAuthToken, User
from app.schemas.users import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
]


class DevLoginRequest(BaseModel):
    email: str
    name: str = "Expense Tracker User"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


def _load_google_client_config(settings) -> dict:
    if settings.google_client_secrets_file:
        credentials_path = Path(settings.google_client_secrets_file).expanduser()
        if not credentials_path.is_absolute():
            credentials_path = Path.cwd() / credentials_path
        if not credentials_path.exists():
            raise HTTPException(status_code=500, detail="Google OAuth credentials file was not found")

        with credentials_path.open(encoding="utf-8") as credentials_file:
            client_config = json.load(credentials_file)
    elif settings.google_client_id and settings.google_client_secret:
        client_config = {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_redirect_uri],
            }
        }
    else:
        raise HTTPException(status_code=500, detail="Google OAuth credentials not configured")

    client_type = "web" if "web" in client_config else "installed" if "installed" in client_config else None
    if not client_type:
        raise HTTPException(status_code=500, detail="Google OAuth credentials file must contain a web or installed client")

    redirect_uris = client_config[client_type].setdefault("redirect_uris", [])
    if settings.google_redirect_uri not in redirect_uris:
        redirect_uris.append(settings.google_redirect_uri)
    return client_config


def get_oauth_flow(settings):
    """Create OAuth flow for Google authentication."""
    return google_auth_oauthlib.flow.Flow.from_client_config(
        _load_google_client_config(settings),
        scopes=SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )


@router.post("/dev-login")
def dev_login(payload: DevLoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """Development login without OAuth (for testing)."""
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if not user:
        user = User(email=payload.email, name=payload.name)
        db.add(user)
        db.commit()
        db.refresh(user)
    return AuthResponse(access_token=create_access_token(user.id), token_type="bearer", user=UserRead.model_validate(user))


@router.get("/google/login")
def google_login(settings=Depends(get_settings)):
    """Redirect user to Google OAuth consent screen."""
    flow = get_oauth_flow(settings)
    authorization_url, state = flow.authorization_url(access_type="offline", prompt="consent")
    
    # In production, store state in session/cache to verify on callback
    return {"authorization_url": authorization_url, "state": state}


def _allow_local_http_oauth(settings) -> None:
    if settings.environment == "development" and settings.google_redirect_uri.startswith(("http://localhost", "http://127.0.0.1")):
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


@router.get("/google/callback")
def google_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
    settings=Depends(get_settings),
):
    """Handle Google OAuth callback."""
    try:
        _allow_local_http_oauth(settings)
        flow = get_oauth_flow(settings)
        flow.fetch_token(authorization_response=str(request.url))

        credentials = flow.credentials

        # Get user info from Google
        user_info_response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {credentials.token}"})
        user_info = user_info_response.json()

        email = user_info.get("email")
        name = user_info.get("name", "Expense Tracker User")

        # Create or get user
        user = db.query(User).filter(User.email == email).one_or_none()
        if not user:
            user = User(email=email, name=name)
            db.add(user)
            db.flush()

        # Store OAuth tokens
        oauth_token = db.query(OAuthToken).filter(OAuthToken.user_id == user.id).one_or_none()
        expires_at = datetime.fromtimestamp(credentials.expiry.timestamp(), tz=timezone.utc) if credentials.expiry else datetime.now(timezone.utc) + timedelta(hours=1)

        if oauth_token:
            oauth_token.access_token = credentials.token
            oauth_token.refresh_token = credentials.refresh_token or oauth_token.refresh_token
            oauth_token.expires_at = expires_at
        else:
            oauth_token = OAuthToken(
                user_id=user.id,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                expires_at=expires_at,
                scopes=" ".join(SCOPES),
            )
            db.add(oauth_token)

        db.commit()
        db.refresh(user)

        # Generate app JWT token and redirect to frontend
        app_token = create_access_token(user.id)
        frontend_redirect = f"{settings.frontend_base_url}/dashboard?token={app_token}"
        return RedirectResponse(url=frontend_redirect)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")
