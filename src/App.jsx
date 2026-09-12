import { useEffect, useState } from "react";

const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

// Snapshot is fetched from raw.githubusercontent.com so data pushes never
// need a Pages rebuild. CDN caching (~5 min) matches the heartbeat budget.
const SNAPSHOT_URL =
  "https://raw.githubusercontent.com/tupkung/pi-dashboard/main/data/snapshot.json";

const ACTIONS = [
  { id: "summarize", label: "📊 Summarize latest session" },
  { id: "knowledge", label: "📝 Knowledge housekeeping" },
  { id: "reload", label: "🔄 Reload runtime" },
  { id: "abort", label: "⛔ Abort (confirm)", confirm: true },
];

export default function App() {
  const [snap, setSnap] = useState(null);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState("");
  const [sendErr, setSendErr] = useState("");

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    fetch(`${SNAPSHOT_URL}?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setSnap)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const run = (a) => {
    setSendErr("");
    if (!tg) {
      setSendErr("Telegram API not loaded — close and reopen this app from the bot's ☰ menu button.");
      return;
    }
    if (a.confirm && !window.confirm("Abort the running turn?")) return;
    try {
      tg.sendData(JSON.stringify({ type: "pi-dashboard", action: a.id }));
    } catch (e) {
      setSendErr(`sendData failed: ${e?.message || e}. Reopen from the bot's ☰ menu button and try again.`);
      return;
    }
    setSent(a.id);
    setTimeout(() => setSent(""), 5000);
  };

  if (err) return <div className="center">⚠ snapshot unavailable: {err}</div>;
  if (!snap) return <div className="center">loading…</div>;

  const busy = snap.status?.state === "busy";

  return (
    <main>
      <header>
        <h1>
          pi {busy ? "🔴 busy" : "🟢 idle"}
        </h1>
        <p className="sub">
          {snap.status?.model ?? "unknown model"} · updated{" "}
          {snap.generated_at ? new Date(snap.generated_at).toLocaleString() : "?"}
          {!tg && " · ⚠ no Telegram API"}
        </p>
      </header>

      {sendErr && <div className="warn" role="alert">⚠ {sendErr}</div>}

      <section>
        <h2>Actions</h2>
        <div className="grid">
          {ACTIONS.map((a) => (
            <button key={a.id} onClick={() => run(a)} className={sent === a.id ? "ok" : ""}>
              {sent === a.id ? "✓ sent — reply arrives in this chat" : a.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Recent sessions</h2>
        <ul>
          {(snap.sessions ?? []).map((s) => (
            <li key={s.id}>
              <span className="dim">{s.messages} msg</span> {s.when}
            </li>
          ))}
          {!(snap.sessions ?? []).length && <li className="dim">none yet</li>}
        </ul>
      </section>

      <section>
        <h2>Knowledge</h2>
        <ul className="stats">
          {Object.entries(snap.knowledge ?? {}).map(([cat, n]) => (
            <li key={cat}>
              <b>{n}</b> {cat}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
