import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock3,
  Layers3,
  LogOut,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { getProfileSecurity } from "../api/client";
import type { ProfileSecurity, UserProfile } from "../types";

function getInitials(profile: UserProfile) {
  const source = profile.name || profile.email || "User";
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ProfilePage({ profile, onLogout }: { profile: UserProfile; onLogout: () => void }) {
  const [security, setSecurity] = useState<ProfileSecurity | null>(null);

  useEffect(() => {
    getProfileSecurity().then(setSecurity).catch(() => setSecurity(null));
  }, []);

  return (
    <section className="page profile-page">
      <motion.div className="profile-hero glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar-wrap">
          {profile.avatar_url ? <img className="profile-avatar" src={profile.avatar_url} alt="" /> : <div className="profile-avatar fallback">{getInitials(profile)}</div>}
          <div className="profile-hero-copy">
            <span className="eyebrow">Account management</span>
            <h1>{profile.name ?? "Finance user"}</h1>
            <p>{profile.email}</p>
            <div className="status-line">
              <span className="status-badge success"><BadgeCheck size={14} /> Verified account</span>
              <span className="status-badge"><ShieldCheck size={14} /> Account healthy</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="profile-grid">
        <motion.article className="panel glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Security center</span>
              <h2>Login and session trust</h2>
            </div>
          </div>
          <div className="security-list">
            <div className="security-item"><UserCircle2 size={16} /><span>Provider</span><strong>{security?.provider ?? "Google"}</strong></div>
            <div className="security-item"><Clock3 size={16} /><span>Last sync</span><strong>{security?.last_sync_at ? new Date(security.last_sync_at).toLocaleString() : "Recently"}</strong></div>
            <div className="security-item"><Layers3 size={16} /><span>Recent logins</span><strong>{security?.recent_logins ?? 1}</strong></div>
          </div>
        </motion.article>

        <motion.article className="panel glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Connected services</span>
              <h2>External integrations</h2>
            </div>
          </div>
          <div className="service-card">
            <div>
              <strong>Google Gmail</strong>
              <span>Read-only transaction parsing</span>
            </div>
            <button type="button">Reconnect</button>
          </div>
          <div className="service-card">
            <div>
              <strong>{profile.default_bank} bank</strong>
              <span>Transaction sync enabled</span>
            </div>
            <button type="button">Refresh token</button>
          </div>
        </motion.article>

        <motion.article className="panel glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Account</span>
              <h2>Basic details</h2>
            </div>
          </div>
          <div className="preference-stack">
            <div className="preference-row"><span>Default bank</span><strong>{profile.default_bank}</strong></div>
            <div className="preference-row"><span>Workspace</span><strong>Personal workspace</strong></div>
          </div>
        </motion.article>

        <motion.article className="panel glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Actions</span>
              <h2>Logout</h2>
            </div>
          </div>
          <button type="button" className="secondary" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </motion.article>
      </div>
    </section>
  );
}
