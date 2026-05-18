from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.budgets import BudgetStatus, BudgetUpsert
from app.services.budget_service import budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.post("")
def upsert_budget(payload: BudgetUpsert, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return budget_service.upsert(db, user.id, payload)


@router.get("/status", response_model=list[BudgetStatus])
def budget_status(month: date, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return budget_service.status(db, user.id, month)

