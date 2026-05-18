from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class ParsedTransaction:
    amount: float
    type: str
    merchant: str
    transaction_date: date
    reference_id: str | None
    raw_text: str


class BankEmailParser(ABC):
    bank: str

    @abstractmethod
    def can_parse(self, text: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def parse(self, text: str, received_date: date) -> ParsedTransaction:
        raise NotImplementedError

