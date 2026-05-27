from datetime import date

from pydantic import BaseModel, Field, model_validator


class TransactionBase(BaseModel):
    bank: str = "HDFC"
    source: str
    amount: float
    type: str
    merchant: str
    category: str = "Uncategorized"
    transaction_date: date
    reference_id: str | None = None
    raw_text: str


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: str
    is_ignored: bool

    model_config = {"from_attributes": True}


class TransactionUpdate(BaseModel):
    merchant: str | None = None
    category: str | None = None
    is_ignored: bool | None = None


class GmailCleanupRequest(BaseModel):
    bank: str = "HDFC"


class GmailSyncRequest(BaseModel):
    bank: str = "HDFC"
    mode: str = Field(pattern="^(last_n|date_range)$")
    last_n: int | None = Field(default=100, ge=1, le=1000)
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_scope(self):
        if self.mode == "last_n" and self.last_n is None:
            raise ValueError("last_n is required when mode is last_n")
        if self.mode == "date_range":
            if not self.start_date or not self.end_date:
                raise ValueError("start_date and end_date are required when mode is date_range")
            if self.start_date > self.end_date:
                raise ValueError("start_date must be before or equal to end_date")
        return self
