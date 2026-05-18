from datetime import date

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.entities import Transaction
from app.schemas.transactions import TransactionCreate, TransactionUpdate


class TransactionService:
    def create(self, db: Session, user_id: str, payload: TransactionCreate) -> Transaction:
        transaction = Transaction(user_id=user_id, **payload.model_dump())
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

    def list(
        self,
        db: Session,
        user_id: str,
        bank: str | None = None,
        source: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[Transaction]:
        query: Select[tuple[Transaction]] = select(Transaction).where(Transaction.user_id == user_id)
        if bank:
            query = query.where(Transaction.bank == bank)
        if source:
            query = query.where(Transaction.source == source)
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        return list(db.scalars(query.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())))

    def update(self, db: Session, user_id: str, transaction_id: str, payload: TransactionUpdate) -> Transaction:
        transaction = db.scalar(
            select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
        )
        if not transaction:
            raise ValueError("Transaction not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(transaction, field, value)
        db.commit()
        db.refresh(transaction)
        return transaction


transaction_service = TransactionService()

