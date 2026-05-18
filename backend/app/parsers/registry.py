from app.parsers.base import BankEmailParser
from app.parsers.hdfc import HDFCEmailParser


class ParserRegistry:
    def __init__(self) -> None:
        self.parsers: dict[str, BankEmailParser] = {
            HDFCEmailParser.bank: HDFCEmailParser(),
        }

    def get(self, bank: str) -> BankEmailParser:
        parser = self.parsers.get(bank.upper())
        if not parser:
            raise ValueError(f"No parser configured for bank: {bank}")
        return parser


parser_registry = ParserRegistry()

