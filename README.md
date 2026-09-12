# pi-dashboard

Telegram Mini App control dashboard for the pi agent (project: `pi-agent`).

- **Stack:** Vite + React (build step accepted by [ADR 0001] in pi-agent).
- **Hosting:** GitHub Pages project page → `tupkung.github.io/pi-dashboard/`
- **Data:** `data/snapshot.json` pushed by the Telegram bridge extension
  via the GitHub Contents API; fetched at runtime from
  `raw.githubusercontent.com` so data pushes never trigger a rebuild.
- **Actions:** `WebApp.sendData` → bridge `web_app_data` → agent.
  No backend of its own.

## Dev

```sh
npm install
npm run dev       # http://localhost:5173/pi-dashboard/
npm run build
```

[ADR 0001]: https://github.com/tupkung/pi-agent/blob/main/docs/adr/0001-react-build-step-pi-dashboard.md
