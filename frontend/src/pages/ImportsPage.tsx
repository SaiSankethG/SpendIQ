import { useState } from "react";
import { FileUp, Play } from "lucide-react";
import { previewPdf, syncGmail } from "../api/client";
import { PushNotificationControl } from "../components/PushNotificationControl";

export function ImportsPage() {
  const [mode, setMode] = useState<"last_n" | "date_range">("last_n");
  const [lastN, setLastN] = useState(100);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function runSync() {
    if (mode === "last_n" && (!Number.isInteger(lastN) || lastN < 1 || lastN > 1000)) {
      setStatus("Last N emails must be between 1 and 1000.");
      return;
    }
    const result = await syncGmail({
      bank: "HDFC",
      mode,
      last_n: mode === "last_n" ? lastN : undefined,
      start_date: mode === "date_range" ? startDate : undefined,
      end_date: mode === "date_range" ? endDate : undefined,
    });
    const parseSkipped = result.parse_skipped ?? 0;
    const duplicateSkipped = result.duplicate_skipped ?? 0;
    setStatus(
      `Fetched ${result.fetched}, created ${result.created}, skipped ${result.skipped} (${parseSkipped} did not match parser, ${duplicateSkipped} duplicates).`
    );
  }

  async function onPdf(file: File | undefined) {
    if (!file) return;
    const result = await previewPdf(file, password);
    setStatus(`PDF preview parsed ${result.count} structured transactions.`);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Imports</h1>
          <p>Gmail is the primary source. PDF statements are optional backfills.</p>
        </div>
      </div>

      <section className="split">
        <div className="panel">
          <h2>Gmail Transactions</h2>
          <p className="muted">HDFC UPI alerts containing “U have made a UPI tranx” are imported.</p>
          <div className="segmented">
            <button className={mode === "last_n" ? "active" : ""} onClick={() => setMode("last_n")}>Last N</button>
            <button className={mode === "date_range" ? "active" : ""} onClick={() => setMode("date_range")}>Date Range</button>
          </div>
          {mode === "last_n" ? (
            <label>
              Last N emails
              <input type="number" min={1} max={1000} value={lastN} onChange={(event) => setLastN(Number(event.target.value))} />
            </label>
          ) : (
            <div className="inline-fields">
              <label>
                Start
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label>
                End
                <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </div>
          )}
          <div className="actions">
            <button className="primary" onClick={runSync}>
              <Play size={18} />
              Manual Sync
            </button>
            <PushNotificationControl />
          </div>
        </div>

        <div className="panel">
          <h2>Bank Statement</h2>
          <p className="muted">Only structured-table PDFs are supported. Scanned/OCR statements are rejected.</p>
          <label>
            PDF password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="file-drop">
            <FileUp size={24} />
            <span>Select HDFC statement PDF</span>
            <input type="file" accept="application/pdf" onChange={(event) => onPdf(event.target.files?.[0])} />
          </label>
        </div>
      </section>
      {status && <p className="status">{status}</p>}
    </section>
  );
}
