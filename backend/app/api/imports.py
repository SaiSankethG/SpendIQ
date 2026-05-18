from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.services.pdf_service import pdf_service
from app.services.transaction_service import transaction_service

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post("/pdf/preview")
def preview_pdf(
    file: UploadFile = File(...),
    password: str | None = Form(default=None),
    user: User = Depends(get_current_user),
):
    try:
        transactions = pdf_service.parse_hdfc_statement(file.file, password)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"user_id": user.id, "count": len(transactions), "transactions": transactions[:100]}


@router.post("/pdf/confirm")
def confirm_pdf(
    file: UploadFile = File(...),
    password: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        transactions = pdf_service.parse_hdfc_statement(file.file, password)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    created = [transaction_service.create(db, user.id, tx) for tx in transactions]
    return {"created": len(created)}

