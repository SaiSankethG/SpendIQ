from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.users import UserRead

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserRead)
def get_profile(user: User = Depends(get_current_user)):
    return user
