import type { UserProfile } from "../types";

export function ProfilePage({ profile, onLogout }: { profile: UserProfile; onLogout: () => void }) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Google account and personal defaults.</p>
        </div>
      </div>
      <section className="profile-panel">
        <div className="avatar">{profile.name?.[0] ?? profile.email[0]}</div>
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
          <span>Default bank: {profile.default_bank}</span>
        </div>
      </section>
      <section className="profile-actions" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--color-border)" }}>
        <button className="secondary" onClick={onLogout} style={{ color: "#e74c3c" }}>
          Logout
        </button>
      </section>
    </section>
  );
}

