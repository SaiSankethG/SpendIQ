from pathlib import Path
import unittest


class GmailServiceSourceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = Path(__file__).resolve().parents[1] / "app" / "services" / "gmail_service.py"
        self.text = self.source.read_text(encoding="utf-8")

    def test_hdfc_query_is_sender_only(self) -> None:
        self.assertIn('"HDFC": "from:alerts@hdfcbank.bank.in"', self.text)
        self.assertNotIn('subject:"Account update for your HDFC Bank A/c"', self.text)

    def test_date_range_still_adds_after_before_filters(self) -> None:
        self.assertIn("after:{request.start_date.strftime('%Y/%m/%d')}", self.text)
        self.assertIn("before:{inclusive_end.strftime('%Y/%m/%d')}", self.text)


if __name__ == "__main__":
    unittest.main()
