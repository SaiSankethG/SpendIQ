import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { watchGmail } from "../api/client";

const PUSH_STATUS_KEY = "expense_tracker_push_enabled";

type PushNotificationControlProps = {
  layout?: "button" | "settings";
};

function readPushEnabled() {
  return localStorage.getItem(PUSH_STATUS_KEY) === "true";
}

export function PushNotificationControl({ layout = "button" }: PushNotificationControlProps) {
  const [enabled, setEnabled] = useState(readPushEnabled);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function disablePush() {
    localStorage.removeItem(PUSH_STATUS_KEY);
    setEnabled(false);
    setMessage("");
  }

  async function togglePush() {
    if (loading) return;

    if (enabled) {
      disablePush();
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await watchGmail();
      localStorage.setItem(PUSH_STATUS_KEY, "true");
      setEnabled(true);
      setMessage(result.status === "watch_enabled" ? "Push is active" : `Push status: ${result.status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable push");
    } finally {
      setLoading(false);
    }
  }

  if (layout === "settings") {
    return (
      <div className="push-settings-control">
        <button className={enabled ? "switch is-on" : "switch"} onClick={togglePush} aria-pressed={enabled} disabled={loading}>
          <span />
        </button>
        <strong>{enabled ? "On" : loading ? "Enabling" : "Off"}</strong>
        {message && <span>{message}</span>}
      </div>
    );
  }

  const Icon = enabled ? BellRing : Bell;

  return (
    <div className="push-header-control">
      <button className={enabled ? "push-button is-on" : "push-button"} onClick={togglePush} disabled={loading}>
        <Icon size={18} />
        <span>{enabled ? "Disable push" : loading ? "Enabling push" : "Enable push"}</span>
      </button>
      {message && <span>{message}</span>}
    </div>
  );
}
