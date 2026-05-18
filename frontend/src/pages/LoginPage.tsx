import { useState } from "react";
import { Mail } from "lucide-react";
import { devLogin, redirectToGoogleOAuth } from "../api/client";
import type { UserProfile } from "../types";

export function LoginPage({ onLogin }: { onLogin: (user: UserProfile) => void }) {
  const [email, setEmail] = useState("you@example.com");
  const [name, setName] = useState("Expense Tracker User");
  const [error, setError] = useState("");
  const [isDevMode, setIsDevMode] = useState(false);

  async function devLoginHandler() {
    setError("");
    try {
      const result = await devLogin(email, name);
      localStorage.setItem("expense_tracker_token", result.access_token);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  function googleLoginHandler() {
    redirectToGoogleOAuth();
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand large">
          <Mail size={28} />
          <span>Personal Expense Tracker</span>
        </div>
        <h1>Sign in with Google</h1>
        <p>
          Use the Gmail account linked to your bank alerts. Read-only Gmail access is required to find transaction emails
          and update your expense dashboard.
        </p>
        
        {!isDevMode ? (
          <>
            <button className="primary" onClick={googleLoginHandler}>
              <Mail size={18} />
              Continue with Google
            </button>
            <button 
              className="secondary" 
              onClick={() => setIsDevMode(true)}
              style={{ marginTop: "8px", fontSize: "12px", opacity: 0.6 }}
            >
              Dev Mode
            </button>
          </>
        ) : (
          <>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <button className="primary" onClick={devLoginHandler}>
              <Mail size={18} />
              Continue with Dev Login
            </button>
            <button 
              className="secondary" 
              onClick={() => setIsDevMode(false)}
              style={{ marginTop: "8px", fontSize: "12px", opacity: 0.6 }}
            >
              Back
            </button>
          </>
        )}
        
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

