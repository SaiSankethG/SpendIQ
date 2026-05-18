from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Transaction, TransactionType
from app.schemas.analytics import AnalyticsSummary, ChartPoint


class AnalyticsService:
    def summary(
        self,
        db: Session,
        user_id: str,
        bank: str = "HDFC",
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> AnalyticsSummary:
        base = [
            Transaction.user_id == user_id,
            Transaction.bank == bank,
            Transaction.is_ignored.is_(False),
        ]
        if start_date:
            base.append(Transaction.transaction_date >= start_date)
        if end_date:
            base.append(Transaction.transaction_date <= end_date)

        total_debit = self._sum(db, [*base, Transaction.type == TransactionType.debit])
        total_credit = self._sum(db, [*base, Transaction.type == TransactionType.credit])
        category_breakdown = self._group(db, base, Transaction.category, TransactionType.debit)
        top_merchants = self._group(db, base, Transaction.merchant, TransactionType.debit, limit=8)
        trend = self._trend(db, base)

        return AnalyticsSummary(
            total_debit=total_debit,
            total_credit=total_credit,
            net_flow=total_credit - total_debit,
            top_category=category_breakdown[0].label if category_breakdown else None,
            top_merchant=top_merchants[0].label if top_merchants else None,
            category_breakdown=category_breakdown,
            spending_trend=trend,
            top_merchants=top_merchants,
            credit_debit_ratio=[
                ChartPoint(label="Debit", value=total_debit),
                ChartPoint(label="Credit", value=total_credit),
            ],
        )

    def _sum(self, db: Session, where: list) -> float:
        value = db.scalar(select(func.coalesce(func.sum(Transaction.amount), 0)).where(*where))
        return float(value or 0)

    def _group(self, db: Session, base: list, column, tx_type: TransactionType, limit: int = 10) -> list[ChartPoint]:
        rows = db.execute(
            select(column, func.coalesce(func.sum(Transaction.amount), 0).label("total"))
            .where(*base, Transaction.type == tx_type)
            .group_by(column)
            .order_by(func.sum(Transaction.amount).desc())
            .limit(limit)
        ).all()
        return [ChartPoint(label=str(label), value=float(total)) for label, total in rows]

    def _trend(self, db: Session, base: list) -> list[ChartPoint]:
        month_expr = func.to_char(Transaction.transaction_date, "YYYY-MM")
        rows = db.execute(
            select(month_expr, func.coalesce(func.sum(Transaction.amount), 0))
            .where(*base, Transaction.type == TransactionType.debit)
            .group_by(month_expr)
            .order_by(month_expr)
        ).all()
        return [ChartPoint(label=str(label), value=float(total)) for label, total in rows]


analytics_service = AnalyticsService()

