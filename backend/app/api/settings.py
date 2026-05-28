from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.entities import BankConnection, Transaction, User, UserSettings
from app.schemas.settings import SettingsRead, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


def _ensure_settings(db: Session, user_id: str) -> UserSettings:
    settings = db.scalar(select(UserSettings).where(UserSettings.user_id == user_id))
    if settings:
        return settings
    settings = UserSettings(user_id=user_id)
    db.add(settings)
    db.flush()
    return settings


def _ensure_banks(db: Session, user_id: str) -> list[BankConnection]:
    banks = db.scalars(select(BankConnection).where(BankConnection.user_id == user_id)).all()
    if banks:
        return banks
    defaults = [
        BankConnection(user_id=user_id, bank_name="HDFC", connected=True, status="active", sync_health="healthy", statement_count=24, last_sync=datetime.utcnow()),
        BankConnection(user_id=user_id, bank_name="ICICI", connected=False, status="error", sync_health="warning", statement_count=0),
        BankConnection(user_id=user_id, bank_name="SBI", connected=False, status="error", sync_health="warning", statement_count=0),
        BankConnection(user_id=user_id, bank_name="Axis", connected=False, status="error", sync_health="warning", statement_count=0),
        BankConnection(user_id=user_id, bank_name="Kotak", connected=False, status="error", sync_health="warning", statement_count=0),
    ]
    db.add_all(defaults)
    db.flush()
    return defaults


@router.get("", response_model=SettingsRead)
def get_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = _ensure_settings(db, user.id)
    banks = _ensure_banks(db, user.id)
    last_sync_at = db.scalar(
        select(Transaction.created_at).where(Transaction.user_id == user.id).order_by(Transaction.created_at.desc())
    )
    return SettingsRead(
        gmail_sync_enabled=settings.gmail_sync_enabled,
        auto_import=settings.auto_import,
        import_frequency=settings.import_frequency,
        duplicate_protection=settings.duplicate_protection,
        auto_categorization=settings.auto_categorization,
        push_notifications=settings.push_notifications,
        email_alerts=settings.email_alerts,
        sync_failure_alerts=settings.sync_failure_alerts,
        weekly_reports=settings.weekly_reports,
        budget_alerts=settings.budget_alerts,
        ai_categorization=settings.ai_categorization,
        smart_insights=settings.smart_insights,
        merchant_detection=settings.merchant_detection,
        theme=settings.theme,
        accent_color=settings.accent_color,
        compact_mode=settings.compact_mode,
        animations_enabled=settings.animations_enabled,
        notification_enabled=settings.notification_enabled,
        data_encryption_enabled=settings.data_encryption_enabled,
        gmail_readonly_scope=settings.gmail_readonly_scope,
        banks=banks,
        connected_email=user.email,
        login_provider="Google" if user.email else "Email",
        last_sync_at=last_sync_at,
        session_status="active",
    )


@router.patch("")
def patch_settings(payload: SettingsUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = _ensure_settings(db, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return {"status": "saved"}


@router.get("/imports")
def get_import_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = _ensure_settings(db, user.id)
    return {
        "autoImport": settings.auto_import,
        "importFrequency": settings.import_frequency,
        "duplicateProtection": settings.duplicate_protection,
        "autoCategorization": settings.auto_categorization,
    }


@router.patch("/imports")
def patch_import_settings(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = _ensure_settings(db, user.id)
    mapping = {
        "autoImport": "auto_import",
        "importFrequency": "import_frequency",
        "duplicateProtection": "duplicate_protection",
        "autoCategorization": "auto_categorization",
    }
    for source, target in mapping.items():
        if source in payload:
            setattr(settings, target, payload[source])
    db.commit()
    return {"status": "saved"}


@router.get("/notifications")
def get_notification_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = _ensure_settings(db, user.id)
    return {
        "pushNotifications": settings.push_notifications,
        "emailAlerts": settings.email_alerts,
        "syncFailureAlerts": settings.sync_failure_alerts,
        "weeklyReports": settings.weekly_reports,
        "budgetAlerts": settings.budget_alerts,
    }


@router.patch("/notifications")
def patch_notification_settings(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = _ensure_settings(db, user.id)
    mapping = {
        "pushNotifications": "push_notifications",
        "emailAlerts": "email_alerts",
        "syncFailureAlerts": "sync_failure_alerts",
        "weeklyReports": "weekly_reports",
        "budgetAlerts": "budget_alerts",
    }
    for source, target in mapping.items():
        if source in payload:
            setattr(settings, target, payload[source])
    db.commit()
    return {"status": "saved"}


@router.patch("/preferences")
def patch_preferences(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = _ensure_settings(db, user.id)
    mapping = {
        "theme": "theme",
        "accentColor": "accent_color",
        "compactMode": "compact_mode",
        "animationsEnabled": "animations_enabled",
    }
    for source, target in mapping.items():
        if source in payload:
            setattr(settings, target, payload[source])
    db.commit()
    return {"status": "saved"}
