DEFAULT_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Food": ["ZOMATO", "SWIGGY", "RESTAURANT", "CAFE", "FOOD"],
    "Travel": ["UBER", "OLA", "RAPIDO", "IRCTC", "METRO"],
    "Bills": ["AIRTEL", "JIO", "ELECTRICITY", "BILL", "BROADBAND"],
    "Shopping": ["AMAZON", "FLIPKART", "MYNTRA", "AJIO"],
    "Entertainment": ["NETFLIX", "PRIME", "HOTSTAR", "BOOKMYSHOW"],
    "Health": ["PHARMACY", "APOLLO", "MEDICAL", "HOSPITAL"],
}


class CategoryService:
    def suggest(self, merchant: str, description: str = "") -> str:
        haystack = f"{merchant} {description}".upper()
        for category, keywords in DEFAULT_CATEGORY_KEYWORDS.items():
            if any(keyword in haystack for keyword in keywords):
                return category
        return "Uncategorized"


category_service = CategoryService()

