import re
from datetime import date

from app.parsers.base import BankEmailParser, ParsedTransaction


class HDFCEmailParser(BankEmailParser):
    bank = "HDFC"
    sender_phrase = "alerts@hdfcbank.bank.in"
    subject_phrase = "account update for your hdfc bank a/c"
    debit_phrases = (
        "u have made a upi tranx",
        "you have made a upi transaction",
        "upi transaction",
        "debited",
        "debit",
    )
    credit_phrases = (
        "credited",
        "credit card",
        "credit of",
        "amount credited",
        "credit",
    )
    amount_pattern = re.compile(r"(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)", re.IGNORECASE)
    debit_merchant_pattern = re.compile(r"\bto\s+([A-Z0-9 ._&-]+?)(?:\.|,|\n|$)", re.IGNORECASE)
    credit_merchant_pattern = re.compile(r"\bfrom\s+([A-Z0-9 ._&-]+?)(?:\.|,|\n|$)", re.IGNORECASE)
    reference_pattern = re.compile(r"(?:ref(?:erence)?|upi ref|txn)\s*(?:no\.?|id)?[:\s-]*([A-Z0-9]+)", re.IGNORECASE)
    debit_amount_pattern = re.compile(r"(?:debited|paid|sent|spent|transferred)", re.IGNORECASE)
    credit_amount_pattern = re.compile(r"(?:credited|received|deposited)", re.IGNORECASE)

    def _extract_amount(self, text: str) -> float:
        # Prefer the first explicit currency amount in the message.
        match = self.amount_pattern.search(text)
        if match and match.group(1).strip():
            return float(match.group(1).replace(",", ""))

        # Some HDFC templates mention the amount in slightly different positions;
        # fall back to the first numeric token after an amount-related keyword.
        keyword = self.credit_amount_pattern if self._is_credit(text) else self.debit_amount_pattern
        keyword_match = keyword.search(text)
        if keyword_match:
            tail = text[keyword_match.end() :]
            tail_match = re.search(r"(?:rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)", tail, re.IGNORECASE)
            if tail_match and tail_match.group(1).strip():
                return float(tail_match.group(1).replace(",", ""))

        raise ValueError("Could not parse HDFC transaction amount")

    def _is_credit(self, text: str) -> bool:
        normalized = text.lower()
        return any(phrase in normalized for phrase in self.credit_phrases)

    def can_parse(self, text: str) -> bool:
        normalized = text.lower()
        is_hdfc_alert = self.sender_phrase in normalized or self.subject_phrase in normalized
        has_amount = bool(self.amount_pattern.search(text))
        has_debit_signal = any(phrase in normalized for phrase in self.debit_phrases)
        has_credit_signal = any(phrase in normalized for phrase in self.credit_phrases)
        return is_hdfc_alert and has_amount and (has_debit_signal or has_credit_signal)

    def parse(self, text: str, received_date: date) -> ParsedTransaction:
        tx_type = "credit" if self._is_credit(text) else "debit"
        amount = self._extract_amount(text)

        merchant_match = self.credit_merchant_pattern.search(text) if tx_type == "credit" else self.debit_merchant_pattern.search(text)
        merchant = merchant_match.group(1).strip(" .,-") if merchant_match else "Unknown Merchant"

        reference_match = self.reference_pattern.search(text)
        reference_id = reference_match.group(1) if reference_match else None

        return ParsedTransaction(
            amount=amount,
            type=tx_type,
            merchant=merchant.upper(),
            transaction_date=received_date,
            reference_id=reference_id,
            raw_text=text,
        )
