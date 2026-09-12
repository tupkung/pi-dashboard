import { useEffect, useState } from "react";

const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
const BUILD = "v3-link";
const platform = tg?.platform ?? "no-api";
const inApp = !!tg?.initData;
// Deterministic strip colors (no theme vars) — remotely diagnosable.
const STRIP = tg ? (inApp ? "#22c55e" : "#f59e0b") : "#ef4444";
const BOT = "tupkung_dev_agent_bot";

const SNAPSHOT_URL =
  "https://raw.githubusercontent.com/tupkung/pi-dashboard/main/data/snapshot.json";

const ACTIONS = [
  { id: "summarize", label: "📊 Summarize latest session" },
  { id: "knowledge", label: "📝 Knowledge housekeeping" },
  { id: "reload", label: "🔄 Reload runtime" },
  { id: "abort", label: "⛔ Abort (confirm)", confirm: true },
];

const viaChat = (id) => `https://t.me/${BOT}?start=dashboard_${id}`;

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
    if (a.confirm && !window.confirm("Abort the running turn?")) return;
    if (!tg || !inApp) {
      openViaChat(a.id);
      return;
    }
    try {
      tg.sendData(JSON.stringify({ type: "pi-dashboard", action: a.id }));
      setSent(a.id);
      setTimeout(() => setSent(""), 5000);
    } catch (e) {
      setSendErr(`sendData failed — falling back to chat link.`);
      openViaChat(a.id);
    }
  };

  const openViaChat = (id) => {
    const url = viaChat(id);
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, "_blank");
  };

  if (err) return <div className="center">⚠ snapshot unavailable: {err}</div>;
  if (!snap) return <div className="center">loading… {BUILD}</div>;

  const busy = snap.status?.state === "busy";

  return (
    <main>
      <div className="strip" style={{ background: STRIP }} aria-hidden="true" />
      <header>
        <h1>
          pi {busy ? "🔴 busy" : "🟢 idle"}
        </h1>
        <p className="sub">
          {snap.status?.model ?? "unknown model"} · {BUILD} · ctx: {platform}
          {inApp ? "✓" : "✗"}
        </p>
      </header>

      {!inApp && (
        <div className="warn" role="alert">
          ⚠ Not in a Mini App session (platform: {platform}) — buttons will route
          through the chat instead.
        </div>
      )}
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
        <p className="dim fallback-links">
          via chat:{" "}
          {ACTIONS.map((a, i) => (
            <span key={a.id}>
              {i > 0 && " · "}
              <a href={viaChat(a.id)} onClick={(e) => { e.preventDefault(); openViaChat(a.id); }}>
                {a.id} ↗
              </a>
            </span>
          ))}
        </p>
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
