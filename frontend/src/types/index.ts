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

export type BankConnection = {
  bank_name: string;
  connected: boolean;
  status: string;
  sync_health: string;
  statement_count: number;
  last_sync: string | null;
};

export type UserSettings = {
  gmail_sync_enabled: boolean;
  auto_import: boolean;
  import_frequency: "instant" | "hourly" | "daily" | string;
  duplicate_protection: boolean;
  auto_categorization: boolean;
  push_notifications: boolean;
  email_alerts: boolean;
  sync_failure_alerts: boolean;
  weekly_reports: boolean;
  budget_alerts: boolean;
  ai_categorization: boolean;
  smart_insights: boolean;
  merchant_detection: boolean;
  theme: "light" | "dark" | "system" | string;
  accent_color: string;
  compact_mode: boolean;
  animations_enabled: boolean;
  notification_enabled: boolean;
  data_encryption_enabled: boolean;
  gmail_readonly_scope: boolean;
  banks: BankConnection[];
  connected_email: string | null;
  login_provider: string | null;
  last_sync_at: string | null;
  session_status: string | null;
};

export type ProfileSecurity = {
  gmail_connected: boolean;
  provider: string;
  session_status: string;
  recent_logins: number;
  device_history: Array<{ device: string; location: string; status: string }>;
  last_sync_at: string | null;
  read_only_scope: boolean;
};

export type BudgetStatus = {
  category: string;
  month: string;
  budget: number;
  actual: number;
  remaining: number;
  used_percent: number;
};
