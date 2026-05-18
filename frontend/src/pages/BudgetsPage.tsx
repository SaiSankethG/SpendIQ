import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getBudgetStatus, upsertBudget } from "../api/client";
import type { BudgetStatus } from "../types";

const categories = ["Food", "Travel", "Bills", "Shopping", "Entertainment", "Health"];

export function BudgetsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState(10000);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);

  async function load() {
    setBudgets(await getBudgetStatus(month));
  }

  async function save() {
    await upsertBudget({ category, month, amount });
    await load();
  }

  useEffect(() => {
    load().catch(() => setBudgets([]));
  }, [month]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Budgets</h1>
          <p>Set monthly category budgets and track spend against them.</p>
        </div>
      </div>

      <div className="toolbar">
        <label>
          Month
          <input type="month" value={month.slice(0, 7)} onChange={(event) => setMonth(`${event.target.value}-01`)} />
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Budget
          <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        </label>
        <button className="primary" onClick={save}>
          <Plus size={18} />
          Save
        </button>
      </div>

      <div className="budget-list">
        {budgets.map((budget) => (
          <article className="budget-row" key={budget.category}>
            <div>
              <strong>{budget.category}</strong>
              <span>₹{budget.actual.toFixed(2)} of ₹{budget.budget.toFixed(2)}</span>
            </div>
            <progress value={budget.used_percent} max={100} />
            <span>{budget.used_percent}%</span>
          </article>
        ))}
      </div>
    </section>
  );
}

