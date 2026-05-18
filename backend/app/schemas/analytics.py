from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: float


class ChartPoint(BaseModel):
    label: str
    value: float


class AnalyticsSummary(BaseModel):
    total_debit: float
    total_credit: float
    net_flow: float
    top_category: str | None
    top_merchant: str | None
    category_breakdown: list[ChartPoint]
    spending_trend: list[ChartPoint]
    top_merchants: list[ChartPoint]
    credit_debit_ratio: list[ChartPoint]

