from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.entities import OAuthToken, Transaction, User
from app.schemas.users import UserRead
from app.schemas.settings import BankConnectionRead

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserRead)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.get("/security")
def get_profile_security(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    token = db.scalar(select(OAuthToken).where(OAuthToken.user_id == user.id))
    last_sync = db.scalar(
        select(Transaction.created_at).where(Transaction.user_id == user.id).order_by(Transaction.created_at.desc())
    )
    return {
        "gmail_connected": token is not None,
        "provider": "Google" if token else "Email",
        "session_status": "active",
        "recent_logins": 1,
        "device_history": [
            {"device": "Current browser", "location": "This device", "status": "active"},
        ],
        "last_sync_at": last_sync,
        "read_only_scope": True,
    }
