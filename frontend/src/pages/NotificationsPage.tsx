import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCircle2, CircleAlert, CreditCard, Sparkles } from "lucide-react";
import { getTransactions } from "../api/client";
import type { Transaction } from "../types";

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function NotificationsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    getTransactions(params)
      .then(setTransactions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load notifications"));
  }, []);

  const recentTransactions = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return transactions.filter((transaction) => new Date(transaction.created_at).getTime() >= cutoff).slice(0, 8);
  }, [transactions]);

  const unreadCount = recentTransactions.length;

  return (
    <section className="page notifications-page">
      <motion.div className="page-header glass-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <span className="eyebrow">Live activity</span>
          <h1>Notifications</h1>
          <p>Recent imported transactions appear here, so the badge reflects real work instead of a static count.</p>
        </div>
        <div className="status-badge success">
          <Bell size={14} /> {unreadCount} recent
        </div>
      </motion.div>

      {error ? <div className="status error"><CircleAlert size={16} /> {error}</div> : null}

      <div className="notifications-feed">
        {recentTransactions.length ? (
          recentTransactions.map((transaction) => (
            <motion.article
              key={transaction.id}
              className="notification-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="notification-icon">
                <CreditCard size={16} />
              </div>
              <div className="notification-copy">
                <strong>{transaction.merchant}</strong>
                <span>
                  {transaction.type} of ₹{Number(transaction.amount).toFixed(2)} • {transaction.category}
                </span>
                <small>{timeAgo(transaction.created_at)} from {transaction.source.toUpperCase()}</small>
              </div>
            </motion.article>
          ))
        ) : (
          <motion.div className="empty-state glass-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={18} />
            <div>
              <strong>No new transactions yet</strong>
              <p>Once Gmail or PDF imports create transactions, they will surface here.</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="notification-summary">
        <div className="summary-card">
          <CheckCircle2 size={16} />
          <span>Badge now tracks activity from the last 24 hours.</span>
        </div>
      </div>
    </section>
  );
}
