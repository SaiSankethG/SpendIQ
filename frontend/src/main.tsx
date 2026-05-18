import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  ChevronDown,
  FileBarChart,
  FileUp,
  Gauge,
  LogOut,
  Menu,
  PieChart,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  WalletCards,
  X,
} from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { ImportsPage } from "./pages/ImportsPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { getProfile, hasAuthToken } from "./api/client";
import type { UserProfile } from "./types";
import "./styles.css";

type Page = "dashboard" | "transactions" | "analytics" | "budgets" | "imports" | "reports" | "notifications" | "settings" | "profile";

const navItems: Array<{ page: Page; label: string; icon: React.ElementType; badge?: string }> = [
  { page: "dashboard", label: "Dashboard", icon: Gauge },
  { page: "transactions", label: "Transactions", icon: ReceiptText },
  { page: "analytics", label: "Analytics", icon: PieChart },
  { page: "budgets", label: "Budgets", icon: WalletCards },
  { page: "imports", label: "Imports", icon: FileUp },
  { page: "reports", label: "Reports", icon: FileBarChart },
  { page: "notifications", label: "Notifications", icon: Bell, badge: "3" },
  { page: "settings", label: "Settings", icon: Settings },
  { page: "profile", label: "Profile", icon: User },
];

function pageFromPath(pathname: string): Page {
  const page = pathname.replace(/^\/+/, "").split("/")[0];
  if (
    page === "transactions" ||
    page === "analytics" ||
    page === "budgets" ||
    page === "imports" ||
    page === "reports" ||
    page === "notifications" ||
    page === "settings" ||
    page === "profile"
  ) {
    return page;
  }
  return "dashboard";
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

function App() {
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Handle OAuth callback redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("expense_tracker_token", token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!hasAuthToken()) {
      setProfile(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getProfile()
      .then((user) => {
        if (!cancelled) setProfile(user);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      setProfile(null);
      setLoading(false);
      setPage("dashboard");
      if (window.location.pathname !== "/") {
        window.history.replaceState({}, "", "/");
      }
    }

    window.addEventListener("expense-auth-expired", handleAuthExpired);
    return () => window.removeEventListener("expense-auth-expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPage(pageFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  function navigate(nextPage: Page) {
    if (nextPage === page) {
      setMobileMenuOpen(false);
      return;
    }

    setPage(nextPage);
    const nextPath = nextPage === "dashboard" ? "/dashboard" : `/${nextPage}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setMobileMenuOpen(false);
  }

  const handleLogout = () => {
    localStorage.removeItem("expense_tracker_token");
    setProfile(null);
    navigate("dashboard");
  };

  const content = useMemo(() => {
    if (!profile) return null;
    if (page === "dashboard" || page === "transactions" || page === "analytics" || page === "reports" || page === "notifications") {
      return <DashboardPage profile={profile} />;
    }
    if (page === "imports") return <ImportsPage />;
    if (page === "budgets") return <BudgetsPage />;
    if (page === "settings") return <SettingsPage />;
    return <ProfilePage profile={profile} onLogout={handleLogout} />;
  }, [page, profile]);

  if (loading) return <div className="loading">Loading expense workspace...</div>;
  if (!profile) return <LoginPage onLogin={setProfile} />;

  const shellClassName = [
    "app-shell",
    sidebarCollapsed ? "sidebar-collapsed" : "",
    mobileMenuOpen ? "mobile-nav-open" : "",
  ].filter(Boolean).join(" ");

  const handleNavKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(".nav-item"));
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === "ArrowDown" ? Math.min(buttons.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    buttons[nextIndex]?.focus();
    event.preventDefault();
  };

  return (
    <main className={shellClassName}>
      <button className="mobile-menu-button" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <button className="sidebar-scrim" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />

      <motion.aside className="sidebar" aria-label="Primary navigation" initial={false} layout transition={{ duration: 0.25, ease: "easeOut" }}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BarChart3 size={24} />
          </div>
          <div className="brand-copy">
            <span>SpendIQ</span>
            <small>AI finance cockpit</small>
          </div>
          <button className="sidebar-toggle desktop-toggle" onClick={() => setSidebarCollapsed((current) => !current)} aria-label="Toggle sidebar">
            <Menu size={18} />
          </button>
          <button className="sidebar-toggle mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <button className="workspace-switcher" type="button" title={sidebarCollapsed ? "Personal workspace" : undefined}>
          <span className="workspace-icon"><ShieldCheck size={17} /></span>
          <span className="workspace-copy">
            <strong>Personal workspace</strong>
            <small>{profile.default_bank ?? "HDFC"} connected</small>
          </span>
          <ChevronDown className="workspace-chevron" size={16} />
        </button>

        {/* <label className="sidebar-search" title={sidebarCollapsed ? "Search" : undefined}>
          <Search size={16} />
          <span>Search workspace</span>
        </label> */}

        <motion.nav className="sidebar-nav" onKeyDown={handleNavKeyDown} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.page;
            return (
              <motion.button
                key={item.page}
                className={isActive ? "nav-item active" : "nav-item"}
                onClick={() => navigate(item.page)}
                title={sidebarCollapsed ? item.label : undefined}
                type="button"
                aria-current={isActive ? "page" : undefined}
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {isActive ? <motion.span className="active-indicator" aria-hidden="true" layoutId="active-nav-indicator" /> : <span className="active-indicator" aria-hidden="true" />}
                <Icon className="nav-icon" size={19} />
                <AnimatePresence initial={false}>
                  {!sidebarCollapsed || mobileMenuOpen ? (
                    <motion.span className="nav-label" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}>
                      {item.label}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
                {item.badge ? <motion.span className="nav-badge" initial={false} animate={{ scale: isActive ? 1.05 : 1 }}>{item.badge}</motion.span> : null}
              </motion.button>
            );
          })}
        </motion.nav>

        {/* <motion.div className="sidebar-mini-panel" initial={false} animate={{ opacity: sidebarCollapsed && !mobileMenuOpen ? 0 : 1 }} transition={{ duration: 0.18 }}>
          <span><Sparkles size={15} /> Smart insight</span>
          <strong>Subscriptions up 12%</strong>
          <small>Review recurring spend before month end.</small>
        </motion.div> */}

        <motion.button className="quick-action" type="button" onClick={() => navigate("imports")} title={sidebarCollapsed ? "Quick import" : undefined} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <Plus size={18} />
          <span>Quick import</span>
        </motion.button>

        <footer className="sidebar-footer">
          <button className="user-card" type="button" onClick={() => navigate("profile")} title={sidebarCollapsed ? profile.name || profile.email : undefined}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span className="avatar-fallback">{getInitials(profile)}</span>}
            <span className="user-copy">
              <strong>{profile.name || "Finance user"}</strong>
              <small>Premium</small>
            </span>
          </button>
          <div className="footer-actions">
            <button type="button" onClick={() => navigate("settings")} aria-label="Settings" title="Settings"><Settings size={17} /></button>
            <button type="button" onClick={handleLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
          </div>
        </footer>
      </motion.aside>
      <section className="content">{content}</section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
