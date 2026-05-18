from datetime import date, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TransactionSource(StrEnum):
    gmail = "gmail"
    pdf = "pdf"


class TransactionType(StrEnum):
    debit = "debit"
    credit = "credit"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    default_bank: Mapped[str] = mapped_column(String(64), default="HDFC")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    oauth_token: Mapped["OAuthToken"] = relationship(back_populates="user", uselist=False)
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")


class OAuthToken(Base):
    __tablename__ = "oauth_tokens"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    access_token: Mapped[str] = mapped_column(Text)
    refresh_token: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    scopes: Mapped[str] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="oauth_token")


class GmailMessage(Base):
    __tablename__ = "gmail_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    gmail_message_id: Mapped[str] = mapped_column(String(255), index=True)
    bank: Mapped[str] = mapped_column(String(64), default="HDFC")
    processed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    raw_text: Mapped[str] = mapped_column(Text)

    __table_args__ = (UniqueConstraint("user_id", "gmail_message_id", name="uq_user_gmail_message"),)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    bank: Mapped[str] = mapped_column(String(64), default="HDFC", index=True)
    source: Mapped[TransactionSource] = mapped_column(Enum(TransactionSource), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), index=True)
    merchant: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(128), default="Uncategorized", index=True)
    transaction_date: Mapped[date] = mapped_column(Date, index=True)
    reference_id: Mapped[str | None] = mapped_column(String(255), index=True)
    raw_text: Mapped[str] = mapped_column(Text)
    is_ignored: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(128), index=True)
    month: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))

    __table_args__ = (UniqueConstraint("user_id", "category", "month", name="uq_user_category_month_budget"),)


class CategoryRule(Base):
    __tablename__ = "category_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    merchant_pattern: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(128), index=True)

