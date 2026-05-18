import re
from datetime import date

from app.parsers.base import BankEmailParser, ParsedTransaction


class HDFCEmailParser(BankEmailParser):
    bank = "HDFC"
    hdfc_upi_phrases = (
        "u have made a upi tranx",
        "you have made a upi transaction",
        "upi transaction",
    )
    amount_pattern = re.compile(r"(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)", re.IGNORECASE)
    merchant_pattern = re.compile(r"\bto\s+([A-Z0-9 ._&-]+?)(?:\.|,|\n|$)", re.IGNORECASE)
    reference_pattern = re.compile(r"(?:ref(?:erence)?|upi ref|txn)\s*(?:no\.?|id)?[:\s-]*([A-Z0-9]+)", re.IGNORECASE)

    def can_parse(self, text: str) -> bool:
        normalized = text.lower()
        return any(phrase in normalized for phrase in self.hdfc_upi_phrases) and bool(self.amount_pattern.search(text))

    def parse(self, text: str, received_date: date) -> ParsedTransaction:
        amount_match = self.amount_pattern.search(text)
        if not amount_match:
            raise ValueError("Could not parse HDFC transaction amount")

        merchant_match = self.merchant_pattern.search(text)
        merchant = merchant_match.group(1).strip(" .,-") if merchant_match else "Unknown Merchant"

        reference_match = self.reference_pattern.search(text)
        reference_id = reference_match.group(1) if reference_match else None

        return ParsedTransaction(
            amount=float(amount_match.group(1).replace(",", "")),
            type="debit",
            merchant=merchant.upper(),
            transaction_date=received_date,
            reference_id=reference_id,
            raw_text=text,
        )
