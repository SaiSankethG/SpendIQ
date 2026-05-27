from datetime import date
import unittest

from app.parsers.hdfc import HDFCEmailParser


class HDFCEmailParserTests(unittest.TestCase):
    def setUp(self) -> None:
        self.parser = HDFCEmailParser()

    def test_parses_debit_upi_alert(self) -> None:
        text = (
            "From: HDFC Bank InstaAlerts <alerts@hdfcbank.bank.in>\n"
            "Subject: Account update for your HDFC Bank A/c\n"
            "Dear Customer, you have made a UPI transaction of INR 1,250.00 "
            "to ABC STORE. Ref No: UPI12345"
        )

        self.assertTrue(self.parser.can_parse(text))
        parsed = self.parser.parse(text, date(2026, 5, 24))
        self.assertEqual(parsed.type, "debit")
        self.assertEqual(parsed.amount, 1250.0)
        self.assertEqual(parsed.merchant, "ABC STORE")
        self.assertEqual(parsed.reference_id, "UPI12345")

    def test_parses_credit_alert(self) -> None:
        text = (
            "From: HDFC Bank InstaAlerts <alerts@hdfcbank.bank.in>\n"
            "Subject: Account update for your HDFC Bank A/c\n"
            "Dear Customer, your A/c XX1234 is credited with INR 5,000.00 "
            "from ACME PAYMENTS. Ref No: CR98765"
        )

        self.assertTrue(self.parser.can_parse(text))
        parsed = self.parser.parse(text, date(2026, 5, 24))
        self.assertEqual(parsed.type, "credit")
        self.assertEqual(parsed.amount, 5000.0)
        self.assertEqual(parsed.merchant, "ACME PAYMENTS")
        self.assertEqual(parsed.reference_id, "CR98765")

    def test_ignores_non_hdfc_alerts(self) -> None:
        text = (
            "From: random@example.com\n"
            "Subject: Payment received\n"
            "Your account has been credited with INR 5,000.00 from ACME PAYMENTS."
        )

        self.assertFalse(self.parser.can_parse(text))


if __name__ == "__main__":
    unittest.main()
