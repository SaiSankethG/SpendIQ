import { MailCheck, ShieldCheck } from "lucide-react";
import { PushNotificationControl } from "../components/PushNotificationControl";

export function SettingsPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Sync, bank, and category-rule configuration.</p>
        </div>
      </div>
      <section className="settings-list">
        <article>
          <MailCheck size={20} />
          <div>
            <strong>Automatic Gmail import</strong>
            <span>Import new HDFC Gmail alerts automatically when they arrive.</span>
          </div>
          <PushNotificationControl layout="settings" />
        </article>
        <article>
          <ShieldCheck size={20} />
          <div>
            <strong>Gmail permission</strong>
            <span>Read-only access is used. The app cannot send, delete, or modify emails.</span>
          </div>
        </article>
        <article>
          <strong>Bank</strong>
          <span>HDFC is enabled for the first version. Additional banks can be added through parser modules.</span>
        </article>
      </section>
    </section>
  );
}
