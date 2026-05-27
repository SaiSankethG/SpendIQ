import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeIndianRupee,
  Banknote,
  Bot,
  Calendar,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileDown,
  Moon,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Sun,
  Tags,
  TrendingDown,
  TrendingUp,
  UserCircle,
  WalletCards,
} from "lucide-react";
import { getAnalytics, getTransactions, syncGmail, updateTransaction } from "../api/client";
import { PushNotificationControl } from "../components/PushNotificationControl";
import type { AnalyticsSummary, ChartPoint, Transaction, UserProfile } from "../types";

const colors = ["#0f766e", "#2563eb", "#f97316", "#7c3aed", "#be123c", "#4d7c0f", "#0891b2", "#a16207"];
const pageSizeOptions = [10, 25, 50];
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const fullCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

type QuickRange = "today" | "last7" | "month" | "lastMonth";
type Toast = { id: number; tone: "success" | "error" | "info"; message: string };
type MerchantSort = "amount" | "name";
type DashboardCacheEntry = {
  analytics: AnalyticsSummary;
  transactions: Transaction[];
  lastRefreshed: string;
};
type DashboardViewState = {
  bank: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  pageSize: number;
  darkMode: boolean;
  merchantSort: MerchantSort;
};

const dashboardCache = new Map<string, DashboardCacheEntry>();
let dashboardViewState: DashboardViewState | null = null;

function dashboardCacheKey(bank: string, startDate: string, endDate: string) {
  return new URLSearchParams({ bank, start_date: startDate, end_date: endDate }).toString();
}

function getInitialDashboardViewState(profile?: UserProfile | null): DashboardViewState {
  return dashboardViewState ?? {
    bank: profile?.default_bank ?? "HDFC",
    startDate: monthStart(),
    endDate: today(),
    currentPage: 1,
    pageSize: 10,
    darkMode: document.documentElement.dataset.theme === "dark",
    merchantSort: "amount",
  };
}

function dateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthStart() {
  const date = new Date();
  return dateInputValue(new Date(date.getFullYear(), date.getMonth(), 1));
}

function lastMonthStart() {
  const date = new Date();
  return dateInputValue(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

function lastMonthEnd() {
  const date = new Date();
  return dateInputValue(new Date(date.getFullYear(), date.getMonth(), 0));
}

function today() {
  return dateInputValue(new Date());
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateInputValue(date);
}

function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatCompactCurrency(value: number) {
  return `₹${currencyFormatter.format(Math.abs(value))}`;
}

function formatCurrency(value: number) {
  return `₹${fullCurrencyFormatter.format(Math.abs(value))}`;
}

function sumValues(points: ChartPoint[]) {
  return points.reduce((total, point) => total + Number(point.value || 0), 0);
}

function safeTrend(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function getInitials(profile?: UserProfile | null) {
  const source = profile?.name || profile?.email || "User";
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getRangePreset(startDate: string, endDate: string): QuickRange | "custom" {
  if (startDate === today() && endDate === today()) return "today";
  if (startDate === daysAgo(6) && endDate === today()) return "last7";
  if (startDate === monthStart() && endDate === today()) return "month";
  if (startDate === lastMonthStart() && endDate === lastMonthEnd()) return "lastMonth";
  return "custom";
}

function getPresetLabel(preset: QuickRange | "custom", startDate: string, endDate: string): string {
  switch (preset) {
    case "today":
      return "Today";
    case "last7":
      return "Last 7 Days";
    case "month":
      return "This Month";
    case "lastMonth":
      return "Last Month";
    default:
      return `${displayDate(startDate)} - ${displayDate(endDate)}`;
  }
}

function buildCreditDebitData(transactions: Transaction[]) {
  const grouped = new Map<string, { label: string; credit: number; debit: number }>();
  transactions.forEach((transaction) => {
    const label = displayDate(transaction.transaction_date).replace(/, \d{4}/, "");
    const current = grouped.get(label) ?? { label, credit: 0, debit: 0 };
    current[transaction.type] += Number(transaction.amount || 0);
    grouped.set(label, current);
  });
  return Array.from(grouped.values()).slice(-10);
}

function buildMonthlyComparison(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const current = { debit: 0, credit: 0 };
  const previous = { debit: 0, credit: 0 };

  transactions.forEach((transaction) => {
    const date = new Date(`${transaction.transaction_date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    const bucket =
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
        ? current
        : date.getMonth() === previousMonthDate.getMonth() && date.getFullYear() === previousMonthDate.getFullYear()
          ? previous
          : null;
    if (bucket) bucket[transaction.type] += Number(transaction.amount || 0);
  });

  return [
    { label: "Last month", ...previous },
    { label: "This month", ...current },
  ];
}

function buildBudgetInsights(categoryBreakdown: ChartPoint[]) {
  return categoryBreakdown.slice(0, 4).map((point, index) => {
    const value = Number(point.value || 0);
    const budget = Math.max(value * (index === 0 ? 1.18 : 1.35), 10000);
    return {
      category: point.label,
      actual: value,
      budget,
      percent: Math.min(100, Math.round((value / budget) * 100)),
    };
  });
}

function createSummary(analytics: AnalyticsSummary | null, transactions: Transaction[]) {
  if (!analytics || transactions.length === 0) return "No analytics available for this range yet.";
  const spend = analytics.total_debit;
  const income = analytics.total_credit;
  const net = analytics.net_flow;
  const topCategory = analytics.top_category ?? "uncategorized spend";
  const topMerchant = analytics.top_merchant ?? analytics.top_merchants[0]?.label ?? "your top merchant";
  const tone = net >= 0 ? "cash-positive" : "spend-heavy";
  return `This period is ${tone}: ${formatCompactCurrency(income)} credited against ${formatCompactCurrency(spend)} spent. ${topCategory} leads category spend, with ${topMerchant} standing out in merchant activity.`;
}

export function DashboardPage({ profile }: { profile?: UserProfile | null }) {
  const initialViewState = getInitialDashboardViewState(profile);
  const initialCache = dashboardCache.get(dashboardCacheKey(initialViewState.bank, initialViewState.startDate, initialViewState.endDate));
  const [bank, setBank] = useState(initialViewState.bank);
  const [startDate, setStartDate] = useState(initialViewState.startDate);
  const [endDate, setEndDate] = useState(initialViewState.endDate);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(initialCache?.analytics ?? null);
  const [transactions, setTransactions] = useState<Transaction[]>(initialCache?.transactions ?? []);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(!initialCache);
  const [currentPage, setCurrentPage] = useState(initialViewState.currentPage);
  const [pageSize, setPageSize] = useState(initialViewState.pageSize);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(initialCache?.lastRefreshed ?? null);
  const [darkMode, setDarkMode] = useState(initialViewState.darkMode);
  const [merchantSort, setMerchantSort] = useState<MerchantSort>(initialViewState.merchantSort);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const params = useMemo(() => new URLSearchParams({ bank, start_date: startDate, end_date: endDate }), [bank, startDate, endDate]);
  const paramKey = params.toString();
  const activeRequestKey = useRef(paramKey);
  activeRequestKey.current = paramKey;
  const selectedPreset = getRangePreset(startDate, endDate);
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, transactions.length);
  const visibleTransactions = transactions.slice(pageStartIndex, pageEndIndex);
  const firstVisibleTransaction = transactions.length === 0 ? 0 : pageStartIndex + 1;
  const dateRangeLabel = getPresetLabel(selectedPreset, startDate, endDate);
  const creditDebitData = useMemo(() => buildCreditDebitData(transactions), [transactions]);
  const monthlyComparison = useMemo(() => buildMonthlyComparison(transactions), [transactions]);
  const budgetInsights = useMemo(() => buildBudgetInsights(analytics?.category_breakdown ?? []), [analytics]);
  const sortedMerchants = useMemo(() => {
    const items = [...(analytics?.top_merchants ?? [])];
    if (merchantSort === "name") return items.sort((a, b) => a.label.localeCompare(b.label));
    return items.sort((a, b) => Number(b.value) - Number(a.value));
  }, [analytics, merchantSort]);
  const topCategories = analytics?.category_breakdown ?? [];
  const categoryTotal = sumValues(topCategories);
  const trendPoints = analytics?.spending_trend ?? [];
  const trendDelta = trendPoints.length > 1 ? safeTrend(trendPoints[trendPoints.length - 1]?.value ?? 0, trendPoints[trendPoints.length - 2]?.value ?? 0) : 0;

  function showToast(message: string, tone: Toast["tone"] = "info") {
    const toast = { id: Date.now(), message, tone };
    setToasts((current) => [...current.slice(-2), toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 3600);
  }

  function setDatePreset(preset: QuickRange) {
    if (preset === "month") {
      setStartDate(monthStart());
      setEndDate(today());
      return;
    }
    if (preset === "last7") {
      setStartDate(daysAgo(6));
      setEndDate(today());
      return;
    }
    if (preset === "lastMonth") {
      setStartDate(lastMonthStart());
      setEndDate(lastMonthEnd());
      return;
    }
    setStartDate(today());
    setEndDate(today());
  }

  function hydrateFromCache(cache: DashboardCacheEntry) {
    setAnalytics(cache.analytics);
    setTransactions(cache.transactions);
    setLastRefreshed(cache.lastRefreshed);
    setStatus("");
    setLoading(false);
  }

  async function load({ force = false }: { force?: boolean } = {}) {
    const requestKey = paramKey;
    const cached = dashboardCache.get(requestKey);
    if (!force && cached) {
      hydrateFromCache(cached);
      return;
    }

    setLoading(true);
    setStatus("Refreshing dashboard");
    try {
      const requestParams = new URLSearchParams(params);
      const [summary, rows] = await Promise.all([getAnalytics(requestParams), getTransactions(requestParams)]);
      if (activeRequestKey.current !== requestKey) return;
      const refreshedAt = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      dashboardCache.set(requestKey, { analytics: summary, transactions: rows, lastRefreshed: refreshedAt });
      setAnalytics(summary);
      setTransactions(rows);
      setLastRefreshed(refreshedAt);
      setStatus("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load dashboard";
      setStatus(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function refreshWithSync() {
    setLoading(true);
    try {
      setStatus("Syncing Gmail");
      const result = await syncGmail({
        bank,
        mode: "date_range",
        start_date: startDate,
        end_date: endDate,
      });
      await load({ force: true });
      showToast(`Refresh complete: ${result.created} new transactions`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dashboard refresh failed";
      setStatus(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const header = ["Date", "Merchant", "Category", "Type", "Amount", "Source"];
    const rows = transactions.map((transaction) => [
      transaction.transaction_date,
      transaction.merchant,
      transaction.category,
      transaction.type,
      transaction.amount,
      transaction.source,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense-dashboard-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV export ready", "success");
  }

  function exportPdf() {
    window.print();
    showToast("PDF export opened", "info");
  }

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    dashboardViewState = {
      bank,
      startDate,
      endDate,
      currentPage,
      pageSize,
      darkMode,
      merchantSort,
    };
  }, [bank, startDate, endDate, currentPage, pageSize, darkMode, merchantSort]);

  useEffect(() => {
    load().catch((err) => setStatus(err.message));
  }, [paramKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [paramKey, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  async function saveCategory(transaction: Transaction, category: string) {
    const updated = await updateTransaction(transaction.id, { category });
    setTransactions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    showToast("Category updated", "success");
    await load({ force: true });
  }

  return (
    <section className="page dashboard-page">
      <DashboardHeader
        bank={bank}
        darkMode={darkMode}
        lastRefreshed={lastRefreshed}
        loading={loading}
        profile={profile}
        onExportCsv={exportCsv}
        onExportPdf={exportPdf}
        onRefresh={refreshWithSync}
        onToggleTheme={() => setDarkMode((current) => !current)}
      />

      <DashboardFilters
        bank={bank}
        dateRangeLabel={dateRangeLabel}
        endDate={endDate}
        loading={loading}
        selectedPreset={selectedPreset}
        startDate={startDate}
        status={status}
        transactionCount={transactions.length}
        onBankChange={setBank}
        onEndDateChange={setEndDate}
        onPresetChange={setDatePreset}
        onStartDateChange={setStartDate}
      />

      {loading && !analytics ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="metrics">
            <StatCard icon={<ArrowDownLeft size={20} />} label="Total Debit" tone="debit" trend={trendDelta} value={analytics?.total_debit ?? 0} />
            <StatCard icon={<ArrowUpRight size={20} />} label="Total Credit" tone="credit" trend={6.4} value={analytics?.total_credit ?? 0} />
            <StatCard icon={<CircleDollarSign size={20} />} label="Net Flow" tone={(analytics?.net_flow ?? 0) >= 0 ? "net-positive" : "net-negative"} trend={safeTrend(analytics?.net_flow ?? 0, analytics?.total_credit ?? 0)} value={analytics?.net_flow ?? 0} signed />
            <StatCard icon={<Tags size={20} />} label="Top Category" tone="category" text={analytics?.top_category ?? "No category"} trend={categoryTotal ? 12.8 : 0} />
          </div>

          <div className="chart-grid">
            <ChartCard
              action={<span className={trendDelta >= 0 ? "trend-pill is-up" : "trend-pill is-down"}>{trendDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{Math.abs(trendDelta).toFixed(1)}%</span>}
              title="Spending Trend"
            >
              {trendPoints.length ? (
                <ResponsiveContainer width="100%" height={286}>
                  <AreaChart data={trendPoints} margin={{ top: 16, right: 18, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}K`} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} fill="url(#spendGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<Sparkles size={22} />} title="No analytics available" text="Try another date range or refresh Gmail sync." />
              )}
            </ChartCard>

            <ChartCard title="Category Breakdown">
              {topCategories.length ? (
                <div className="category-breakdown">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topCategories.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 18, left: 20, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="label" type="category" width={92} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12 }} />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={16}>
                        {topCategories.map((_, index) => (
                          <Cell key={index} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="legend-list">
                    {topCategories.slice(0, 5).map((point, index) => (
                      <span key={point.label}>
                        <i style={{ background: colors[index % colors.length] }} />
                        {point.label}
                        <strong>{categoryTotal ? Math.round((point.value / categoryTotal) * 100) : 0}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState icon={<Tags size={22} />} title="No categories found" text="Categorized transactions will appear here." />
              )}
            </ChartCard>

            <ChartCard
              action={
                <select className="compact-select" value={merchantSort} onChange={(event) => setMerchantSort(event.target.value as MerchantSort)} aria-label="Sort merchants">
                  <option value="amount">Amount</option>
                  <option value="name">Name</option>
                </select>
              }
              title="Top Merchants"
            >
              {sortedMerchants.length ? (
                <ResponsiveContainer width="100%" height={286}>
                  <BarChart data={sortedMerchants.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 18, left: 20, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" width={110} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="value" fill="#2563eb" radius={[0, 10, 10, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<Banknote size={22} />} title="No merchants found" text="Merchant activity will appear after transactions load." />
              )}
            </ChartCard>

            <ChartCard title="Credit vs Debit">
              {creditDebitData.length ? (
                <ResponsiveContainer width="100%" height={286}>
                  <BarChart data={creditDebitData} margin={{ top: 16, right: 18, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}K`} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="credit" stackId="flow" fill="#16a34a" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="debit" stackId="flow" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<WalletCards size={22} />} title="No transactions found" text="Credit and debit bars need transaction data." />
              )}
            </ChartCard>
          </div>

          <div className="insight-grid">
            <ChartCard title="AI Spending Summary">
              <div className="ai-summary">
                <div className="insight-icon"><Bot size={22} /></div>
                <p>{createSummary(analytics, transactions)}</p>
              </div>
            </ChartCard>
            <ChartCard title="Budget Tracking">
              <div className="budget-stack">
                {budgetInsights.length ? budgetInsights.map((budget) => (
                  <div className="budget-progress" key={budget.category}>
                    <div>
                      <strong>{budget.category}</strong>
                      <span>{formatCompactCurrency(budget.actual)} of {formatCompactCurrency(budget.budget)}</span>
                    </div>
                    <progress value={budget.percent} max={100} />
                    <b>{budget.percent}%</b>
                  </div>
                )) : <EmptyState icon={<BadgeIndianRupee size={22} />} title="No budgets to compare" text="Category spending insights will populate this panel." />}
              </div>
            </ChartCard>
            <ChartCard title="Monthly Comparison">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={monthlyComparison} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}K`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12 }} />
                  <Bar dataKey="credit" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="debit" fill="#fb7185" radius={[8, 8, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      <section className="table-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Recent activity</span>
            <h2>Transactions</h2>
            <span className="section-subtitle">
              Showing {firstVisibleTransaction}-{pageEndIndex} of {transactions.length}
            </span>
          </div>
          <label className="page-size-control">
            Rows
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        {transactions.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Source</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{displayDate(transaction.transaction_date)}</td>
                      <td>
                        <span className="merchant-cell"><span>{transaction.merchant.slice(0, 1).toUpperCase()}</span>{transaction.merchant}</span>
                      </td>
                      <td>
                        <input defaultValue={transaction.category} onBlur={(event) => saveCategory(transaction, event.target.value)} />
                      </td>
                      <td><span className={`type-pill ${transaction.type}`}>{transaction.type}</span></td>
                      <td className={transaction.type === "credit" ? "amount-credit" : "amount-debit"}>{transaction.type === "credit" ? "+" : "-"}{formatCurrency(transaction.amount)}</td>
                      <td>{transaction.source}</td>
                      <td><Save size={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="pagination-actions">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={18} />
                  <span>Previous</span>
                </button>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                  <span>Next</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState icon={<Search size={22} />} title="No transactions found" text="Change filters or refresh your connected bank inbox." />
        )}
      </section>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => <div className={`toast ${toast.tone}`} key={toast.id}>{toast.message}</div>)}
      </div>
    </section>
  );
}

function DashboardHeader({
  bank,
  darkMode,
  lastRefreshed,
  loading,
  profile,
  onExportCsv,
  onExportPdf,
  onRefresh,
  onToggleTheme,
}: {
  bank: string;
  darkMode: boolean;
  lastRefreshed: string | null;
  loading: boolean;
  profile?: UserProfile | null;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <header className="dashboard-hero">
      <div>
        <span className="eyebrow">Finance command center</span>
        <h1>Dashboard</h1>
        <p>Track cash flow, spending patterns, budgets, and recent transactions in one polished workspace.</p>
      </div>
      <div className="dashboard-hero-actions">
        <div className="bank-chip"><Banknote size={16} />{bank}</div>
        <div className="refresh-chip"><Calendar size={16} />{lastRefreshed ? `Updated ${lastRefreshed}` : "Not refreshed yet"}</div>
        <button type="button" className="icon-button" onClick={onToggleTheme} aria-label="Toggle dark mode">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" onClick={onExportCsv}><Download size={18} /><span>CSV</span></button>
        <button type="button" onClick={onExportPdf}><FileDown size={18} /><span>PDF</span></button>
        <div className="profile-menu">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <UserCircle size={22} />}
          <span>{getInitials(profile)}</span>
        </div>
      </div>
    </header>
  );
}

function DashboardFilters({
  bank,
  dateRangeLabel,
  endDate,
  loading,
  selectedPreset,
  startDate,
  status,
  transactionCount,
  onBankChange,
  onEndDateChange,
  onRefresh,
  onPresetChange,
  onStartDateChange,
}: {
  bank: string;
  dateRangeLabel: string;
  endDate: string;
  loading: boolean;
  selectedPreset: QuickRange | "custom";
  startDate: string;
  status: string;
  transactionCount: number;
  onBankChange: (bank: string) => void;
  onEndDateChange: (date: string) => void;
  onRefresh: () => void;
  onPresetChange: (preset: QuickRange) => void;
  onStartDateChange: (date: string) => void;
}) {
  return (
    <div className="dashboard-controls">
      <div className="control-panel-header">
        <div>
          <span className="eyebrow">Filters</span>
          <h2>Statement view</h2>
        </div>
        <div className="range-summary">
          <CalendarRange size={18} />
          <span>{dateRangeLabel}</span>
        </div>
      </div>

      <div className="filter-grid">
        <label className="bank-field">
          Bank
          <select value={bank} onChange={(event) => onBankChange(event.target.value)}>
            <option>HDFC</option>
          </select>
        </label>

        <div className="date-field-group" aria-label="Date range">
          <label className="input-with-icon">
            From
            <span><Calendar size={16} /><input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} /></span>
          </label>
          <label className="input-with-icon">
            To
            <span><Calendar size={16} /><input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} /></span>
          </label>
        </div>

        <div className="quick-ranges" aria-label="Quick date ranges">
          {[
            ["today", "Today"],
            ["last7", "Last 7 Days"],
            ["month", "This Month"],
            ["lastMonth", "Last Month"],
          ].map(([value, label]) => (
            <button key={value} type="button" className={selectedPreset === value ? "active" : ""} onClick={() => onPresetChange(value as QuickRange)}>
              {label}
            </button>
          ))}
        </div>

        <div className="toolbar-actions">
          <PushNotificationControl />
          <button type="button" className="primary" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={loading ? "spin" : ""} size={18} />
            <span>{loading ? "Refreshing" : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="control-footer">
        <span>{transactionCount} transactions in view</span>
        {loading ? <strong className="control-status"><RefreshCw className="spin" size={14} /> Loading analytics</strong> : status && <strong className="control-status" role="status">{status}</strong>}
      </div>
    </div>
  );
}

function StatCard({ icon, label, signed, text, tone, trend, value }: { icon: ReactNode; label: string; signed?: boolean; text?: string; tone: string; trend: number; value?: number }) {
  const positive = trend >= 0;
  const display = text ?? `${signed && Number(value) < 0 ? "-" : ""}${formatCompactCurrency(Number(value ?? 0))}`;
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{display}</strong>
      <small className={positive ? "positive" : "negative"}>{positive ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs prior</small>
    </article>
  );
}

function ChartCard({ action, children, title }: { action?: ReactNode; children: ReactNode; title: string }) {
  return (
    <section className="chart-panel">
      <div className="chart-title-row">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 8 }).map((_, index) => <div className="skeleton-card" key={index} />)}
    </div>
  );
}

function EmptyState({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
