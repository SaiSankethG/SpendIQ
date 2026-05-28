import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Banknote,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { getSettings, patchImportSettings, patchNotificationSettings, patchSettings, watchGmail } from "../api/client";
import { PushNotificationControl } from "../components/PushNotificationControl";
import type { UserSettings } from "../types";

function relativeTime(value?: string | null) {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" className="setting-row" onClick={onToggle}>
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <span className={value ? "setting-pill on" : "setting-pill off"}>
        {value ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        {value ? "On" : "Off"}
      </span>
    </button>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    getSettings().then(setSettings).catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"));
  }, []);

  const activeBanks = useMemo(() => settings?.banks.filter((bank) => bank.connected) ?? [], [settings]);

  async function savePatch(payload: Partial<UserSettings>, optimistic?: (current: UserSettings) => UserSettings) {
    if (!settings) return;
    const previous = settings;
    const next = optimistic ? optimistic(settings) : { ...settings, ...payload };
    setSettings(next);
    setSaving(true);
    setError("");
    try {
      await patchSettings(payload);
      setToast("Settings saved");
      window.setTimeout(() => setToast(""), 1500);
    } catch (err) {
      setSettings(previous);
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleImport(field: keyof Pick<UserSettings, "auto_import" | "duplicate_protection" | "auto_categorization">) {
    if (!settings) return;
    const payload = { [field]: !settings[field] } as Partial<UserSettings>;
    const previous = settings;
    setSettings({ ...settings, ...payload });
    setSaving(true);
    try {
      await patchImportSettings(payload);
      setToast("Settings saved");
      window.setTimeout(() => setToast(""), 1500);
    } catch (err) {
      setSettings(previous);
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotification(field: keyof Pick<UserSettings, "push_notifications" | "email_alerts" | "sync_failure_alerts" | "weekly_reports" | "budget_alerts">) {
    if (!settings) return;
    const payload = { [field]: !settings[field] } as Partial<UserSettings>;
    const previous = settings;
    setSettings({ ...settings, ...payload });
    setSaving(true);
    try {
      await patchNotificationSettings(payload);
      setToast("Settings saved");
      window.setTimeout(() => setToast(""), 1500);
    } catch (err) {
      setSettings(previous);
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function runManualSync() {
    setSyncing(true);
    setError("");
    try {
      await watchGmail();
      setToast("Manual Gmail sync started");
      window.setTimeout(() => setToast(""), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (!settings) {
    return (
      <section className="page settings-page">
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </section>
    );
  }

  return (
    <section className="page settings-page">
      <motion.div className="settings-hero glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <span className="eyebrow">Configuration center</span>
          <h1>Settings</h1>
          <p>Manage the essentials: sync, bank connections, alerts, and privacy.</p>
        </div>
        <div className="settings-hero-actions">
          <span className="status-badge success"><ShieldCheck size={14} /> Connected securely</span>
          <span className="status-badge"><LockKeyhole size={14} /> Read-only Gmail scope</span>
          <button type="button" onClick={runManualSync} disabled={syncing}>
            {syncing ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
            {syncing ? "Syncing" : "Manual sync"}
          </button>
        </div>
      </motion.div>

      {error ? <div className="status error"><CircleAlert size={16} /> {error}</div> : null}
      {toast ? <div className="status success"><CheckCircle2 size={16} /> {toast}</div> : null}

      <div className="settings-grid">
        <motion.article className="settings-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Account & security</span>
              <h2>Connection status</h2>
            </div>
            <span className="status-badge success"><CheckCircle2 size={14} /> Session active</span>
          </div>
          <div className="settings-summary">
            <div><span>Connected email</span><strong>{settings.connected_email ?? "Not available"}</strong></div>
            <div><span>Login provider</span><strong>{settings.login_provider ?? "Google"}</strong></div>
            <div><span>Last sync</span><strong>{relativeTime(settings.last_sync_at)}</strong></div>
            <div><span>Encrypted</span><strong>{settings.data_encryption_enabled ? "Enabled" : "Disabled"}</strong></div>
          </div>
          <div className="security-note">
            <KeyRound size={18} />
            <p>Gmail access is read-only. The app only reads alert emails for transaction parsing.</p>
          </div>
        </motion.article>

        <motion.article className="settings-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Gmail integration</span>
              <h2>Sync status</h2>
            </div>
            <span className="status-badge success"><span className="pulse" /> Connected</span>
          </div>
          <div className="sync-panel">
            <div className="sync-orb">
              <Banknote size={18} />
            </div>
            <div>
              <strong>{settings.gmail_sync_enabled ? "Automatic Gmail import is on" : "Automatic Gmail import is off"}</strong>
              <span>Last synced {relativeTime(settings.last_sync_at)}.</span>
            </div>
          </div>
          <div className="split-actions">
            <button type="button" onClick={() => savePatch({ gmail_sync_enabled: !settings.gmail_sync_enabled }, (current) => ({ ...current, gmail_sync_enabled: !current.gmail_sync_enabled }))}>
              {settings.gmail_sync_enabled ? "Disable sync" : "Enable sync"}
            </button>
            <PushNotificationControl layout="settings" />
          </div>
        </motion.article>

        <motion.article className="settings-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bank configuration</span>
              <h2>Connected banks</h2>
            </div>
            <span className="status-badge"><Banknote size={14} /> {activeBanks.length} connected</span>
          </div>
          <div className="bank-list">
            {settings.banks.map((bank) => (
              <div key={bank.bank_name} className={bank.connected ? "bank-card active" : "bank-card"}>
                <div className="bank-avatar">◉</div>
                <div className="bank-copy">
                  <strong>{bank.bank_name}</strong>
                  <span>{bank.connected ? "Sync enabled" : "Not connected"}</span>
                </div>
                <div className="bank-stats">
                  <span>{bank.statement_count} statements</span>
                  <span>{bank.last_sync ? relativeTime(bank.last_sync) : "No import yet"}</span>
                </div>
                <span className={bank.connected ? "status-badge success" : "status-badge"}>{bank.connected ? "Active" : "Dormant"}</span>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article className="settings-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Import settings</span>
              <h2>Automation controls</h2>
            </div>
          </div>
          <div className="field-stack">
            <label>
              Auto-import frequency
              <select value={settings.import_frequency} onChange={(event) => savePatch({ import_frequency: event.target.value })}>
                <option value="instant">Instant</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>
            </label>
            <SettingRow label="Auto import" description="Continuously import new Gmail alerts." value={settings.auto_import} onToggle={() => toggleImport("auto_import")} />
            <SettingRow label="Duplicate protection" description="Prevent duplicate transactions." value={settings.duplicate_protection} onToggle={() => toggleImport("duplicate_protection")} />
            <SettingRow label="Auto categorization" description="Classify transactions automatically." value={settings.auto_categorization} onToggle={() => toggleImport("auto_categorization")} />
          </div>
        </motion.article>

        <motion.article className="settings-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Notifications</span>
              <h2>Alert preferences</h2>
            </div>
            <span className="status-badge"><Bell size={14} /> Alerts</span>
          </div>
          <div className="field-stack">
            <SettingRow label="Push notifications" description="Show sync and budget alerts." value={settings.push_notifications} onToggle={() => toggleNotification("push_notifications")} />
            <SettingRow label="Email alerts" description="Send email summaries and notices." value={settings.email_alerts} onToggle={() => toggleNotification("email_alerts")} />
            <SettingRow label="Sync failure alerts" description="Warn when Gmail sync needs attention." value={settings.sync_failure_alerts} onToggle={() => toggleNotification("sync_failure_alerts")} />
            <SettingRow label="Weekly reports" description="Receive a weekly digest." value={settings.weekly_reports} onToggle={() => toggleNotification("weekly_reports")} />
            <SettingRow label="Budget alerts" description="Notify when budgets are crossed." value={settings.budget_alerts} onToggle={() => toggleNotification("budget_alerts")} />
          </div>
        </motion.article>
      </div>
    </section>
  );
}
