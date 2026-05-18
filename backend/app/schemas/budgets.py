from datetime import date

from pydantic import BaseModel, Field


class BudgetUpsert(BaseModel):
    category: str
    month: date
    amount: float = Field(gt=0)


class BudgetStatus(BaseModel):
    category: str
    month: date
    budget: float
    actual: float
    remaining: float
    used_percent: float

