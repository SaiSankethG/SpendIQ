from calendar import monthrange
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import Budget, Transaction, TransactionType
from app.schemas.budgets import BudgetStatus, BudgetUpsert


class BudgetService:
    def upsert(self, db: Session, user_id: str, payload: BudgetUpsert) -> Budget:
        month = payload.month.replace(day=1)
        budget = db.scalar(
            select(Budget).where(Budget.user_id == user_id, Budget.category == payload.category, Budget.month == month)
        )
        if budget:
            budget.amount = payload.amount
        else:
            budget = Budget(user_id=user_id, category=payload.category, month=month, amount=payload.amount)
            db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    def status(self, db: Session, user_id: str, month: date) -> list[BudgetStatus]:
        start = month.replace(day=1)
        end = month.replace(day=monthrange(month.year, month.month)[1])
        budgets = db.scalars(select(Budget).where(Budget.user_id == user_id, Budget.month == start)).all()
        results: list[BudgetStatus] = []
        for budget in budgets:
            actual = sum(
                float(t.amount)
                for t in db.scalars(
                    select(Transaction).where(
                        Transaction.user_id == user_id,
                        Transaction.category == budget.category,
                        Transaction.type == TransactionType.debit,
                        Transaction.transaction_date >= start,
                        Transaction.transaction_date <= end,
                    )
                )
            )
            budget_amount = float(budget.amount)
            results.append(
                BudgetStatus(
                    category=budget.category,
                    month=start,
                    budget=budget_amount,
                    actual=actual,
                    remaining=budget_amount - actual,
                    used_percent=round((actual / budget_amount) * 100, 2) if budget_amount else 0,
                )
            )
        return results


budget_service = BudgetService()

