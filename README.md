# HubitatDashboard

A local web-based dashboard for Hubitat Elevation home automation.

📁 **All documentation is in the [`docs/`](./docs/) folder:**

| File | Description |
|---|---|
| [`docs/ANALYSIS.md`](./docs/ANALYSIS.md) | Comprehensive project analysis, architecture overview, and startup guide |
| [`docs/README.md`](./docs/README.md) | Quick-start setup guide |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | Full build plan and group/device mapping |
| [`docs/DASHBOARD_BUILD_SPEC.md`](./docs/DASHBOARD_BUILD_SPEC.md) | API reference and architecture specification |

## TL;DR

```bash
cp backend/config.json.example backend/config.json
# edit backend/config.json with your hub IP and Maker API token
npm install && npm run dev
# → http://localhost:5173
```

See [`docs/ANALYSIS.md`](./docs/ANALYSIS.md) for the full guide.
