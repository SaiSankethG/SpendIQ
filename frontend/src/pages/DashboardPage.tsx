import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RefreshCw, Save } from "lucide-react";
import { getAnalytics, getTransactions, syncGmail, updateTransaction } from "../api/client";
import { PushNotificationControl } from "../components/PushNotificationControl";
import type { AnalyticsSummary, Transaction } from "../types";

const colors = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#be123c", "#4d7c0f"];

function monthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DashboardPage() {
  const [bank, setBank] = useState("HDFC");
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    const next = new URLSearchParams({ bank, start_date: startDate, end_date: endDate });
    return next;
  }, [bank, startDate, endDate]);

  async function load() {
    setLoading(true);
    setStatus("Refreshing dashboard");
    try {
      const [summary, rows] = await Promise.all([getAnalytics(params), getTransactions(params)]);
      setAnalytics(summary);
      setTransactions(rows);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load dashboard");
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
      setStatus(`Synced ${result.created} new transactions`);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Dashboard refresh failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => setStatus(err.message));
  }, [params.toString()]);

  async function saveCategory(transaction: Transaction, category: string) {
    const updated = await updateTransaction(transaction.id, { category });
    setTransactions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    await load();
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Analytics and transactions in one workspace.</p>
        </div>
      </div>

      <div className="toolbar">
        <label>
          Bank
          <select value={bank} onChange={(event) => setBank(event.target.value)}>
            <option>HDFC</option>
          </select>
        </label>
        <label>
          From
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <div className="toolbar-actions">
          <PushNotificationControl />
          <button
            type="button"
            className="primary"
            onClick={() => refreshWithSync()}
            disabled={loading}
            aria-label="Refresh dashboard and sync Gmail"
          >
            <RefreshCw size={18} />
            <span>{loading ? "Refreshing..." : "Refresh dashboard"}</span>
          </button>
        </div>
      </div>

      <div className="metrics">
        <Metric label="Total Debit" value={analytics?.total_debit ?? 0} />
        <Metric label="Total Credit" value={analytics?.total_credit ?? 0} />
        <Metric label="Net Flow" value={analytics?.net_flow ?? 0} />
        <Metric label="Top Category" text={analytics?.top_category ?? "-"} />
      </div>

      <div className="chart-grid">
        <ChartPanel title="Spending Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics?.spending_trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Category Breakdown">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={analytics?.category_breakdown ?? []} dataKey="value" nameKey="label" outerRadius={90} label>
                {(analytics?.category_breakdown ?? []).map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Top Merchants">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics?.top_merchants ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Credit vs Debit">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics?.credit_debit_ratio ?? []}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#c2410c" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <section className="table-section">
        <div className="section-header">
          <h2>Transactions</h2>
          {status && <span>{status}</span>}
        </div>
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
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.transaction_date}</td>
                  <td>{transaction.merchant}</td>
                  <td>
                    <input
                      defaultValue={transaction.category}
                      onBlur={(event) => saveCategory(transaction, event.target.value)}
                    />
                  </td>
                  <td>{transaction.type}</td>
                  <td>₹{Number(transaction.amount).toFixed(2)}</td>
                  <td>{transaction.source}</td>
                  <td>
                    <Save size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, text }: { label: string; value?: number; text?: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{text ?? `₹${Number(value).toFixed(2)}`}</strong>
    </article>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="chart-panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
