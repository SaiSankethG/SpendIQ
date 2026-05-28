from datetime import datetime
from pydantic import BaseModel


class BankConnectionRead(BaseModel):
    bank_name: str
    connected: bool
    status: str
    sync_health: str
    statement_count: int
    last_sync: datetime | None = None

    model_config = {"from_attributes": True}


class SettingsRead(BaseModel):
    gmail_sync_enabled: bool
    auto_import: bool
    import_frequency: str
    duplicate_protection: bool
    auto_categorization: bool
    push_notifications: bool
    email_alerts: bool
    sync_failure_alerts: bool
    weekly_reports: bool
    budget_alerts: bool
    ai_categorization: bool
    smart_insights: bool
    merchant_detection: bool
    theme: str
    accent_color: str
    compact_mode: bool
    animations_enabled: bool
    notification_enabled: bool
    data_encryption_enabled: bool
    gmail_readonly_scope: bool
    banks: list[BankConnectionRead]
    connected_email: str | None = None
    login_provider: str | None = None
    last_sync_at: datetime | None = None
    session_status: str | None = None


class SettingsUpdate(BaseModel):
    gmail_sync_enabled: bool | None = None
    auto_import: bool | None = None
    import_frequency: str | None = None
    duplicate_protection: bool | None = None
    auto_categorization: bool | None = None
    push_notifications: bool | None = None
    email_alerts: bool | None = None
    sync_failure_alerts: bool | None = None
    weekly_reports: bool | None = None
    budget_alerts: bool | None = None
    ai_categorization: bool | None = None
    smart_insights: bool | None = None
    merchant_detection: bool | None = None
    theme: str | None = None
    accent_color: str | None = None
    compact_mode: bool | None = None
    animations_enabled: bool | None = None

