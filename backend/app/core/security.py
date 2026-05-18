from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import get_settings


ALGORITHM = "HS256"


def create_access_token(subject: str, expires_minutes: int = 60 * 24 * 7) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, get_settings().jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    payload = jwt.decode(token, get_settings().jwt_secret, algorithms=[ALGORITHM])
    return str(payload["sub"])

