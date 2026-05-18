export type Transaction = {
  id: string;
  bank: string;
  source: "gmail" | "pdf";
  amount: number;
  type: "debit" | "credit";
  merchant: string;
  category: string;
  transaction_date: string;
  reference_id: string | null;
  raw_text: string;
  is_ignored: boolean;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type AnalyticsSummary = {
  total_debit: number;
  total_credit: number;
  net_flow: number;
  top_category: string | null;
  top_merchant: string | null;
  category_breakdown: ChartPoint[];
  spending_trend: ChartPoint[];
  top_merchants: ChartPoint[];
  credit_debit_ratio: ChartPoint[];
};

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  default_bank: string;
};

export type BudgetStatus = {
  category: string;
  month: string;
  budget: number;
  actual: number;
  remaining: number;
  used_percent: number;
};

