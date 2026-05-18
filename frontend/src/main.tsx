import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BarChart3, FileUp, Gauge, Menu, Settings, User, WalletCards } from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { ImportsPage } from "./pages/ImportsPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { getProfile } from "./api/client";
import type { UserProfile } from "./types";
import "./styles.css";

type Page = "dashboard" | "imports" | "budgets" | "settings" | "profile";

const navItems: Array<{ page: Page; label: string; icon: React.ElementType }> = [
  { page: "dashboard", label: "Dashboard", icon: Gauge },
  { page: "imports", label: "Imports", icon: FileUp },
  { page: "budgets", label: "Budgets", icon: WalletCards },
  { page: "settings", label: "Settings", icon: Settings },
  { page: "profile", label: "Profile", icon: User },
];

function pageFromPath(pathname: string): Page {
  const page = pathname.replace(/^\/+/, "").split("/")[0];
  if (page === "imports" || page === "budgets" || page === "settings" || page === "profile") return page;
  return "dashboard";
}

function App() {
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("expense_tracker_token", token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    getProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPage(pageFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(nextPage: Page) {
    setPage(nextPage);
    const nextPath = nextPage === "dashboard" ? "/dashboard" : `/${nextPage}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("expense_tracker_token");
    setProfile(null);
    navigate("dashboard");
  };

  const content = useMemo(() => {
    if (!profile) return null;
    if (page === "dashboard") return <DashboardPage />;
    if (page === "imports") return <ImportsPage />;
    if (page === "budgets") return <BudgetsPage />;
    if (page === "settings") return <SettingsPage />;
    return <ProfilePage profile={profile} onLogout={handleLogout} />;
  }, [page, profile]);

  if (loading) return <div className="loading">Loading expense workspace...</div>;
  if (!profile) return <LoginPage onLogin={setProfile} />;

  return (
    <main className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <aside className="sidebar">
        <div className="brand">
          <BarChart3 size={24} />
          <span>Expense Tracker</span>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed((current) => !current)} aria-label="Toggle sidebar">
            <Menu size={18} />
          </button>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => navigate(item.page)} title={sidebarCollapsed ? item.label : undefined}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="content">{content}</section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
