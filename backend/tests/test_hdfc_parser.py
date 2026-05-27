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
            "to ABC STORE.\n"
            "Transaction Details:\n"
            "a. Date: 24-05-26\n"
            "b. Sender: ABC STORE (VPA: abc@upi)\n"
            "c. UPI Reference No.: UPI12345"
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
            "from ACME PAYMENTS.\n"
            "Transaction Details:\n"
            "a. Date: 24-05-26\n"
            "b. Sender: ACME PAYMENTS (VPA: acme@upi)\n"
            "c. UPI Reference No.: CR98765"
        )

        self.assertTrue(self.parser.can_parse(text))
        parsed = self.parser.parse(text, date(2026, 5, 24))
        self.assertEqual(parsed.type, "credit")
        self.assertEqual(parsed.amount, 5000.0)
        self.assertEqual(parsed.merchant, "ACME PAYMENTS")
        self.assertEqual(parsed.reference_id, "CR98765")

    def test_parses_credit_alert_sender_line_as_merchant(self) -> None:
        text = (
            "From: HDFC Bank InstaAlerts <alerts@hdfcbank.bank.in>\n"
            "Subject: Account update for your HDFC Bank A/c\n"
            "Dear Customer,\n"
            "Greetings from HDFC Bank!\n"
            "We're writing to inform you that Rs.15.00 has been successfully credited to\n"
            "your HDFC Bank account ending in 1575.\n"
            "Transaction Details:\n"
            "a. Date: 27-05-26\n"
            "b. Sender: Girish Kumar S K (VPA: girishkumarsk123456@ybl)\n"
            "c. UPI Reference No.: 513026067002\n"
        )

        self.assertTrue(self.parser.can_parse(text))
        parsed = self.parser.parse(text, date(2026, 5, 27))
        self.assertEqual(parsed.type, "credit")
        self.assertEqual(parsed.amount, 15.0)
        self.assertEqual(parsed.merchant, "GIRISH KUMAR S K")
        self.assertEqual(parsed.reference_id, "513026067002")

    def test_ignores_non_hdfc_alerts(self) -> None:
        text = (
            "From: random@example.com\n"
            "Subject: Payment received\n"
            "Your account has been credited with INR 5,000.00 from ACME PAYMENTS."
        )

        self.assertFalse(self.parser.can_parse(text))

    def test_ignores_hdfc_messages_without_transaction_details(self) -> None:
        text = (
            "From: HDFC Bank InstaAlerts <alerts@hdfcbank.bank.in>\n"
            "Subject: Account update for your HDFC Bank A/c\n"
            "Dear Customer, your account was credited with INR 45.00 from US."
        )

        self.assertFalse(self.parser.can_parse(text))


if __name__ == "__main__":
    unittest.main()
