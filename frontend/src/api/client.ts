import type { AnalyticsSummary, BudgetStatus, Transaction, UserProfile } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("expense_tracker_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("expense_tracker_token");
    window.location.href = "/";
    throw new Error("Session expired. Redirecting to login.");
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail ?? "Request failed");
  }
  return response.json();
}

export async function devLogin(email: string, name: string) {
  return request<{ access_token: string; user: UserProfile }>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
}

export async function getGoogleOAuthUrl() {
  return request<{ authorization_url: string; state: string }>("/auth/google/login");
}

export function redirectToGoogleOAuth() {
  getGoogleOAuthUrl().then((data) => {
    window.location.href = data.authorization_url;
  });
}

export async function getProfile() {
  return request<UserProfile>("/profile");
}

export async function getAnalytics(params: URLSearchParams) {
  return request<AnalyticsSummary>(`/analytics/summary?${params.toString()}`);
}

export async function getTransactions(params: URLSearchParams) {
  return request<Transaction[]>(`/transactions?${params.toString()}`);
}

export async function updateTransaction(id: string, patch: Partial<Transaction>) {
  return request<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function syncGmail(payload: { bank: string; mode: "last_n" | "date_range"; last_n?: number; start_date?: string; end_date?: string }) {
  return request<{ fetched: number; created: number; skipped: number; parse_skipped?: number; duplicate_skipped?: number }>("/gmail/sync", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function watchGmail() {
  return request<{ status: string }>("/gmail/watch", { method: "POST" });
}

export async function getBudgetStatus(month: string) {
  return request<BudgetStatus[]>(`/budgets/status?month=${month}`);
}

export async function upsertBudget(payload: { category: string; month: string; amount: number }) {
  return request("/budgets", { method: "POST", body: JSON.stringify(payload) });
}

export async function previewPdf(file: File, password: string) {
  const form = new FormData();
  form.append("file", file);
  if (password) form.append("password", password);
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/imports/pdf/preview`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!response.ok) throw new Error((await response.json()).detail ?? "PDF preview failed");
  return response.json();
}
