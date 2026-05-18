from datetime import datetime
from tempfile import SpooledTemporaryFile

import pdfplumber

from app.schemas.transactions import TransactionCreate
from app.services.category_service import category_service


class PDFService:
    def parse_hdfc_statement(self, file: SpooledTemporaryFile, password: str | None) -> list[TransactionCreate]:
        transactions: list[TransactionCreate] = []
        with pdfplumber.open(file, password=password) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                if not tables:
                    continue
                for table in tables:
                    transactions.extend(self._parse_table(table))
        if not transactions:
            raise ValueError("No structured transaction table found. OCR/scanned PDFs are not supported.")
        return transactions

    def _parse_table(self, table: list[list[str | None]]) -> list[TransactionCreate]:
        results: list[TransactionCreate] = []
        headers = [self._clean(cell).lower() for cell in table[0]]
        for row in table[1:]:
            values = dict(zip(headers, [self._clean(cell) for cell in row], strict=False))
            date_text = values.get("date") or values.get("transaction date") or values.get("txn date")
            description = values.get("description") or values.get("narration") or ""
            debit = self._amount(values.get("debit") or values.get("withdrawal"))
            credit = self._amount(values.get("credit") or values.get("deposit"))
            if not date_text or (debit is None and credit is None):
                continue
            amount = debit if debit is not None else credit
            tx_type = "debit" if debit is not None else "credit"
            merchant = description[:80] or "Statement Transaction"
            results.append(
                TransactionCreate(
                    bank="HDFC",
                    source="pdf",
                    amount=amount,
                    type=tx_type,
                    merchant=merchant,
                    category=category_service.suggest(merchant, description),
                    transaction_date=self._date(date_text),
                    reference_id=None,
                    raw_text=" | ".join(str(cell or "") for cell in row),
                )
            )
        return results

    def _clean(self, value: str | None) -> str:
        return " ".join((value or "").split())

    def _amount(self, value: str | None) -> float | None:
        clean = (value or "").replace(",", "").strip()
        if not clean:
            return None
        try:
            return float(clean)
        except ValueError:
            return None

    def _date(self, value: str):
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                pass
        raise ValueError(f"Unsupported date format: {value}")


pdf_service = PDFService()

