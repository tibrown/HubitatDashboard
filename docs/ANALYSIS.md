# HubitatDashboard — Comprehensive Analysis

> **What this project is:** A fully self-hosted, local-network web dashboard for controlling and monitoring all devices in a [Hubitat Elevation](https://hubitat.com/) smart home hub. It replaces the built-in Hubitat dashboard with a faster, fully customizable React app — organized by the automation apps that drive your home, not by device type.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Startup Guide](#2-quick-startup-guide)
3. [Docker — Required or Optional?](#3-docker--required-or-optional)
4. [Architecture Deep Dive](#4-architecture-deep-dive)
5. [Frontend Design](#5-frontend-design)
6. [Backend Design](#6-backend-design)
7. [Real-Time Data Flow](#7-real-time-data-flow)
8. [Security Model](#8-security-model)
9. [Device Groups & Tile Types](#9-device-groups--tile-types)
10. [Configuration Reference](#10-configuration-reference)
11. [Extending the Dashboard](#11-extending-the-dashboard)
12. [Known Limitations & Caveats](#12-known-limitations--caveats)

---

## 1. Project Overview

### What it does

The dashboard connects to your **Hubitat Elevation hub** over your local network via the [Maker API](https://docs2.hubitat.com/apps/maker-api). It:

- **Displays** the live state of 140 devices across 14 groups
- **Controls** switches, dimmers, RGBW lights, locks, and more
- **Streams** real-time device state changes via Server-Sent Events (SSE)
- **Protects** sensitive actions (HSM arming, lock control, mode changes) behind a 4-digit PIN
- **Groups** devices by the automation app that manages them — so your "Environment" group shows only the greenhouse fan, heaters, and sensors that EnvironmentalControlManager cares about

### What it does NOT do

- It does not replace the Hubitat hub itself — it is purely a UI layer
- It does not run automations — Hubitat's Rule Machine / custom apps continue running independently
- It is not a cloud service — everything runs on your LAN; no internet connection required for normal operation
- It does not store device history — state is ephemeral (in-memory cache only)

### Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Fast dev cycle, type safety, strong ecosystem |
| Styling | Tailwind CSS v4 | Utility-first, dark mode support, no build config needed |
| State | Zustand v5 | Lightweight, no boilerplate, SSE-friendly |
| Routing | React Router v6 | SPA navigation between the 14 group pages |
| Icons | Lucide React | Consistent icon set, tree-shakeable |
| Backend | Node.js + Fastify v5 + TypeScript | High-performance, low overhead, SSE support |
| Auth | bcryptjs | PIN stored as hash, verified server-side |
| Real-time | Server-Sent Events (SSE) | One-way push from hub → backend → browser; simpler than WebSocket for this use case |
| Deployment | Docker + docker-compose | Reproducible, easy to run on Pi/NAS |

---

## 2. Quick Startup Guide

### Prerequisites

- **Node.js 20+** (check with `node --version`)
- **A Hubitat Elevation hub** on your local network with the **Maker API app** installed and enabled
- **Docker Desktop** (optional — only needed for the production Docker deployment path)

### Step 1 — Clone and install

```bash
git clone <repo-url> HubitatDashboard
cd HubitatDashboard
npm install
```

This installs dependencies for both the frontend and backend workspaces in one command (npm workspaces).

### Step 2 — Create your config file

```bash
cp backend/config.json.example backend/config.json
```

Now edit `backend/config.json`:

```json
{
  "hubIp": "192.168.1.42",
  "makerToken": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "makerAppId": "123",
  "backendPort": 3001,
  "pinHash": "$2a$10$...",
  "corsOrigin": "http://localhost:5173"
}
```

| Field | Where to find it |
|---|---|
| `hubIp` | Your hub's local IP address (Settings → Network Setup in Hubitat) |
| `makerToken` | Hubitat → Apps → Maker API → Access Token |
| `makerAppId` | The number in the Maker API URL, e.g. `http://hub/apps/api/123/...` → `123` |
| `backendPort` | Leave as `3001` unless that port is in use |
| `pinHash` | Generate in Step 3 below |
| `corsOrigin` | Dev: `http://localhost:5173` · Docker: `http://localhost` |

### Step 3 — Generate your PIN hash

The dashboard uses a 4-digit PIN to protect security-sensitive actions (arming HSM, unlocking doors, changing modes). The PIN is **never stored in plain text** — only its bcrypt hash goes in config.

```bash
node -e "require('bcryptjs').hash('1234', 10).then(console.log)"
```

Replace `1234` with your actual PIN. Copy the printed hash (starts with `$2a$10$...`) into `config.json` as `pinHash`.

### Step 4 — Configure the Hubitat webhook

The dashboard receives real-time events because Hubitat **pushes** events to the backend when devices change state. You need to tell Hubitat where to push.

1. In Hubitat: **Apps → Maker API**
2. Enable **"Allow Access via Local Network"**
3. Set the **Post URL** to:

```
http://<YOUR_PC_OR_SERVER_IP>:3001/api/webhook
```

> ⚠️ Use your actual machine's LAN IP (e.g. `192.168.1.10`), not `localhost` — the Hubitat hub needs to reach this address over your network.

### Step 5 — Run in development mode

```bash
npm run dev
```

This starts both services concurrently:
- **Frontend** (Vite dev server): http://localhost:5173
- **Backend** (Fastify): http://localhost:3001

The Vite dev server automatically proxies all `/api` requests to the backend, so the browser never directly touches port 3001.

Open **http://localhost:5173** in your browser. You should see the sidebar with all 14 groups and live device tiles.

### Troubleshooting startup

| Symptom | Fix |
|---|---|
| Backend exits immediately | Check `backend/config.json` — all 6 fields must be present and valid |
| All tiles show "unavailable" | Hub is unreachable on `hubIp` — check IP and Maker API token |
| Tiles never update in real-time | Webhook not configured in Hubitat, or firewall blocks port 3001 |
| PIN rejected | Regenerate `pinHash` — make sure no extra whitespace when pasting |

---

## 3. Docker — Required or Optional?

### Short answer

**Docker is optional for development. It is the recommended path for permanent deployment.**

### Development (no Docker needed)

Running `npm run dev` from the project root is all you need. Node.js and npm are the only requirements. Both the backend (Fastify) and frontend (Vite dev server) run as plain Node processes.

### Production deployment (Docker recommended)

For a permanent always-on deployment — e.g., on a Raspberry Pi, NAS, or home server — Docker is the cleanest option:

```bash
cp backend/config.json.example backend/config.json
# Edit config.json with your production settings
# (set corsOrigin to "http://localhost" for Docker)

docker-compose up -d
```

The dashboard is then available at **http://\<server-ip\>** (port 80). The `docker-compose.yml` brings up two containers:

| Container | Image | Port | Role |
|---|---|---|---|
| `backend` | Built from `Dockerfile.backend` | 3001 (internal) | Fastify API + SSE + webhook receiver |
| `frontend` | Built from `Dockerfile.frontend` | 80 (public) | nginx serving the React build + reverse proxy to backend |

### How the two containers communicate

```
Browser → port 80 → nginx (frontend container)
                    ├── /api/* → proxy to backend:3001
                    └── /* → serve React SPA static files
```

nginx proxies all `/api/` requests to the backend container. The browser only ever talks to port 80 — it never needs to know the backend port.

### Building the images

```bash
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Can you run just one service in Docker?

Yes. The `docker-compose.yml` defines independent services, so you can run just the backend in Docker and the frontend via Vite if needed (useful during frontend development):

```bash
docker-compose up -d backend
npm run dev --workspace=frontend
```

### Raspberry Pi notes

- Both `Dockerfile.backend` and `Dockerfile.frontend` use multi-stage builds with standard `node:20-alpine` and `nginx:alpine` — these run natively on ARM64 (Pi 4/5).
- On Pi 3 (32-bit), you may need to specify `--platform linux/arm/v7` in the Dockerfiles.
- Port 80 may require `sudo` or use `docker-compose` with `user: root` on some Pi OS configurations.

---

## 4. Architecture Deep Dive

### System diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Your Browser                        │
│  React SPA (Vite / nginx:80)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐ │
│  │ Sidebar  │ │SystemBar │ │  GroupPage (tile grid)   │ │
│  │ (14 nav) │ │ HSM/Mode │ │  SwitchTile, DimmerTile  │ │
│  └──────────┘ └──────────┘ │  ContactTile, RGBWTile…  │ │
│                             └──────────────────────────┘ │
│  Zustand store ← useSSE hook ← EventSource(/api/events) │
│  useCommand → PUT /api/devices/:id/:cmd                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP + SSE  (/api/*)
┌────────────────────▼────────────────────────────────────┐
│              Fastify Backend (port 3001)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ proxy.ts │ │webhook.ts│ │  sse.ts  │ │  cache.ts  │  │
│  │ 11 routes│ │POST /wbhk│ │broadcast │ │Map<id,dev> │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Maker API (HTTP)
┌────────────────────▼────────────────────────────────────┐
│              Hubitat Elevation Hub                       │
│  Maker API app → 140 devices → push webhook on change   │
└─────────────────────────────────────────────────────────┘
```

### Monorepo structure

```
HubitatDashboard/
├── package.json          ← npm workspaces root: ["frontend", "backend"]
├── backend/
│   ├── src/
│   │   ├── server.ts     ← Fastify entry: registers all plugins, health route, seeds cache
│   │   ├── config.ts     ← Loads & validates backend/config.json; exits on missing fields
│   │   ├── cache.ts      ← Map<string, DeviceState>; getDevice, setDevice, getAllDevices, setAllDevices
│   │   ├── proxy.ts      ← 11 Maker API proxy routes (devices, HSM, modes, hub variables, verify-pin)
│   │   ├── webhook.ts    ← POST /api/webhook (inbound from hub) + GET /api/events (SSE to browser)
│   │   └── sse.ts        ← SSE client registry; addClient, removeClient, broadcast; Fastify v5 reply.hijack()
│   ├── config.json.example
│   └── package.json      ← "type": "module", Fastify 5.8.5, bcryptjs, tsx
├── frontend/
│   ├── src/
│   │   ├── main.tsx      ← BrowserRouter, initDarkMode, bootstrap() fetch on load
│   │   ├── App.tsx       ← Sidebar + SystemBar + Routes + ToastContainer
│   │   ├── types.ts      ← DeviceState, SSEEvent, TileType, TileConfig, GroupConfig
│   │   ├── store/
│   │   │   └── deviceStore.ts  ← Zustand v5 store: devices, hsmStatus, currentMode, hubVariables,
│   │   │                          pendingCommands, connectionStatus, sidebarOpen
│   │   ├── hooks/
│   │   │   ├── useSSE.ts       ← EventSource → store.applyEvent; 30s polling fallback; visibility reconnect
│   │   │   └── useCommand.ts   ← snapshot → optimistic update → PUT → revert on error
│   │   ├── utils/
│   │   │   ├── toast.ts        ← Event-bus: showToast / onToast
│   │   │   └── darkMode.ts     ← initDarkMode, toggleDarkMode, isDarkMode
│   │   ├── config/
│   │   │   └── groups.ts       ← 14 GroupConfig objects; 140 devices with real Hubitat IDs
│   │   └── components/
│   │       ├── Sidebar.tsx          ← 14 nav items, dark mode toggle, mobile drawer
│   │       ├── SystemBar.tsx        ← HSM badge, mode badge, connection badge, 6 connector badges
│   │       ├── GroupPage.tsx        ← Reads groups.ts, renders responsive tile grid
│   │       ├── PinModal.tsx         ← Full-screen 4-digit PIN overlay, 12-key numpad, keyboard support
│   │       ├── ToastContainer.tsx   ← Fixed bottom-right, 4s auto-dismiss, error=red/info=blue
│   │       └── tiles/
│   │           ├── SwitchTile.tsx
│   │           ├── DimmerTile.tsx        ← debounced slider (400ms)
│   │           ├── RGBWTile.tsx          ← hue/sat/brightness/color-temp sliders
│   │           ├── ContactTile.tsx
│   │           ├── MotionTile.tsx
│   │           ├── TemperatureTile.tsx
│   │           ├── PowerMeterTile.tsx
│   │           ├── ButtonTile.tsx        ← 500ms press flash
│   │           ├── LockTile.tsx          ← PIN-protected
│   │           ├── ConnectorSwitchTile.tsx
│   │           ├── HubVariableTile.tsx   ← inline edit
│   │           ├── HSMTile.tsx           ← PIN-protected, arm/disarm
│   │           ├── ModeTile.tsx          ← PIN-protected, fetches /api/modes
│   │           ├── RingDetectionTile.tsx ← RPD switch + LRP* hub variable timestamp
│   │           └── PresenceTile.tsx
├── docs/                 ← All documentation (you are here)
├── Dockerfile.backend    ← Multi-stage: node:20-alpine builder + runner
├── Dockerfile.frontend   ← Multi-stage: node:20-alpine builder + nginx:alpine
├── docker-compose.yml    ← backend:3001 + frontend:80
├── nginx.conf            ← /api proxy to backend + SPA fallback
└── .gitignore            ← Excludes config.json, node_modules, dist
```

---

## 5. Frontend Design

### State management (Zustand)

All device state lives in a single Zustand store (`deviceStore.ts`). Components never fetch data directly — they subscribe to specific slices via selector hooks:

```typescript
// Reading state
const switchState = useDeviceAttribute('68', 'switch')  // → "on" | "off" | undefined
const hsmStatus = useHsmStatus()                        // → "armedAway" | "disarmed" | ...
const currentMode = useCurrentMode()                    // → "Day" | "Night" | ...
const isPending = useIsPending('68')                    // → true when command in-flight

// Writing state
const [execute] = useCommand()
execute({ deviceId: '68', command: 'on', optimisticAttribute: 'switch', optimisticValue: 'on' })
```

### Optimistic UI pattern

Every interactive tile uses `useCommand`, which:
1. **Snapshots** the current device state
2. **Immediately updates** the store (tile reflects new state before API responds)
3. **Calls** `PUT /api/devices/:id/:command`
4. On **error**: reverts the store to the snapshot + shows a toast

This means the UI never feels laggy — flipping a switch responds in under 16ms visually, even if the network round-trip takes 200ms.

### Real-time updates (SSE)

`useSSE.ts` opens an `EventSource` to `GET /api/events`. Each message is an `SSEEvent`:

```json
{ "deviceId": "68", "attribute": "switch", "value": "on", "timestamp": 1721000000000 }
```

The hook calls `store.applyEvent(event)`, which updates `state.devices[deviceId].attributes[attribute]`. Because tiles subscribe to `useDeviceAttribute(deviceId, attribute)`, they re-render automatically.

**Polling fallback:** If SSE disconnects (network blip, hub restart), the hook falls back to polling `GET /api/devices` every 30 seconds and shows a "Connection lost — polling" toast. SSE reconnects automatically when the browser tab becomes visible again (Page Visibility API).

### Responsive layout

| Viewport | Sidebar | Tile grid columns |
|---|---|---|
| Mobile (< 640px) | Hidden; hamburger → slide-in drawer | 2 columns |
| Tablet (640–1024px) | Always visible | 3 columns |
| Desktop (1024–1280px) | Always visible | 4 columns |
| Wide (> 1280px) | Always visible | 5 columns |

---

## 6. Backend Design

### Why a backend proxy?

The Maker API access token grants full control of your home. Putting it in browser JavaScript would expose it to anyone who opens DevTools. The backend keeps the token in `config.json` (gitignored, local only) and proxies requests — the browser only ever sees the `/api/` routes, never the Hubitat token.

### In-memory cache

On startup, `server.ts` calls the Maker API to fetch all 140 devices and seeds `cache.ts` (a `Map<string, DeviceState>`). Subsequent `GET /api/devices` calls return from cache (fast, no hub round-trip). The cache stays current via the webhook — every device event updates the in-memory state.

This means the backend can answer device queries even if the hub is briefly unreachable, using the last known state.

### Fastify v5 SSE pattern

Fastify v5 changed how streaming responses work. The backend uses `reply.hijack()` to take control of the raw Node.js socket:

```typescript
reply.hijack()
const raw = reply.raw
raw.write('Content-Type: text/event-stream\r\n\r\n')
addClient(clientId, reply)
// Later, on disconnect:
raw.on('close', () => removeClient(clientId))
```

---

## 7. Real-Time Data Flow

### Hub → Browser (event push)

```
Device state changes on hub (e.g., motion sensor triggers)
  │
  ▼ Hubitat fires POST to /api/webhook
  │ Body: { "content": { "deviceId": "6", "name": "motion", "value": "active", "source": "DEVICE" } }
  │
  ▼ backend/webhook.ts parses the "content" wrapper
  │ Special cases: hsmStatus events → store.hsmStatus; mode events → store.currentMode
  │
  ▼ cache.ts: setDevice("6", { attributes: { motion: "active" } })
  │
  ▼ sse.ts: broadcast({ deviceId: "6", attribute: "motion", value: "active", timestamp: ... })
  │
  ▼ Browser EventSource receives message
  │
  ▼ useSSE.ts: store.applyEvent(event)
  │
  ▼ MotionTile re-renders: shows amber "Active" badge
```

### Browser → Hub (command)

```
User clicks "On" button on SwitchTile for device 68
  │
  ▼ useCommand: snapshot state, optimistic update → tile shows "On" immediately
  │
  ▼ PUT /api/devices/68/on (to Fastify backend)
  │
  ▼ backend/proxy.ts: GET http://hub/apps/api/{appId}/devices/68/on?access_token=...
  │                   (Maker API uses GET for commands, not PUT — backend handles translation)
  │
  ▼ Hub executes command; device changes state; fires webhook back to /api/webhook
  │
  ▼ Webhook updates cache + broadcasts SSE (confirms the state the UI already showed optimistically)
```

> **Note:** The Hubitat Maker API uses `GET` requests to execute device commands (not `PUT` or `POST`). The backend proxy accepts `PUT` from the browser (REST-friendly) and translates to `GET` internally.

---

## 8. Security Model

### What's protected

| Action | Protection |
|---|---|
| View device states | None — any browser on your LAN can read the dashboard |
| Toggle switches, dimmers | None — these are low-risk actions |
| Arm/disarm HSM | 4-digit PIN (bcrypt verified server-side) |
| Lock / unlock doors | 4-digit PIN (bcrypt verified server-side) |
| Change hub mode | 4-digit PIN (bcrypt verified server-side) |
| Maker API token | Never in browser JS; lives in `backend/config.json` only |

### PIN security details

- The PIN is entered in `PinModal.tsx` (a 4-digit numpad overlay)
- The plain PIN is sent via HTTPS (or plain HTTP on LAN) in the request body
- The backend calls `bcrypt.compare(pin, config.pinHash)` — the hash never leaves the server
- Wrong PINs return `403 Forbidden`; the frontend shows an error toast and reverts state

### What this does NOT protect against

- **Any device on your LAN** can control non-PIN-protected devices by hitting the `/api/` routes directly
- This is intentional — it's a local home dashboard, not a public service
- For extra security, put the backend behind a VPN or restrict by IP at the router level

---

## 9. Device Groups & Tile Types

### The 14 groups

| Group | Route | Source App | Key Devices |
|---|---|---|---|
| Environment | `/group/environment` | EnvironmentalControlManager | Greenhouse fan/heater, office fans, mosquito killer, temp sensors |
| Security Alarm | `/group/security-alarm` | SecurityAlarmManager | HSM tile, siren connectors |
| Night Security | `/group/night-security` | NightSecurityManager | Perimeter contacts, flood lights |
| Lights | `/group/lights` | LightsAutomationManager | RGBW bulbs, flood lights, outlet switches |
| Doors & Windows | `/group/doors-windows` | DoorWindowMonitor | All door/window contacts, safe, freezer |
| Presence & Motion | `/group/presence-motion` | MotionPresenceManager | All motion sensors, phone presence switches |
| Perimeter | `/group/perimeter` | PerimeterSecurityManager | Gates, shock sensor, carport beam, RPD switches |
| Emergency | `/group/emergency` | EmergencyHelpManager | Help buttons, visual alert lights |
| Cameras | `/group/cameras` | CameraPrivacyManager | Camera power outlets |
| Ring Detections | `/group/ring-detections` | RingPersonDetectionManager | RPD switches + last-seen timestamps |
| Seasonal | `/group/seasonal` | ChristmasControl | Christmas light outlets, power meter plugs |
| Hub Mode | `/group/hub-mode` | ModeManager | Mode selector tile |
| Power Monitor | `/group/power-monitor` | MainsPowerMonitor | Mains status switches, power meter plugs |
| System | `/group/system` | All apps (shared) | All 40+ connector switches, HSM tile, mode tile |

### Connector switch rule

Connector switches (Hubitat virtual switches backed by hub variables, used for cross-app communication) appear **only in the System group**. This prevents clutter in functional group pages and provides one place to view/toggle all shared automation state.

The `SystemBar` (always-visible top bar) shows live badges for the 6 most important connectors: **Alarms**, **Silent**, **High Alert**, **Traveling**, **PTO**, **Holiday**.

### Tile types

| Tile | Use case | Interactive? |
|---|---|---|
| `SwitchTile` | On/off outlets, virtual switches | ✅ Toggle |
| `DimmerTile` | Dimmable lights | ✅ On/off + level slider |
| `RGBWTile` | Color-changing bulbs/strips | ✅ On/off + 4 sliders |
| `ContactTile` | Door/window sensors | Read-only |
| `MotionTile` | Motion sensors | Read-only |
| `TemperatureTile` | Temp (+ optional humidity) sensors | Read-only |
| `PowerMeterTile` | Smart plugs with power reporting | Read-only |
| `ButtonTile` | Pushable buttons / key fobs | ✅ Push |
| `LockTile` | Smart locks | ✅ PIN-protected |
| `ConnectorSwitchTile` | Cross-app connector switches | ✅ Toggle (compact) |
| `HubVariableTile` | Hub variables (string/number) | ✅ Inline edit |
| `HSMTile` | Hubitat Safety Monitor | ✅ PIN-protected arm/disarm |
| `ModeTile` | Hub mode (Day/Night/Away…) | ✅ PIN-protected |
| `RingDetectionTile` | Ring person-detection + last-seen time | Read-only |
| `PresenceTile` | Phone/person presence | Read-only |

---

## 10. Configuration Reference

### `backend/config.json`

```json
{
  "hubIp": "192.168.1.42",
  "makerToken": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "makerAppId": "123",
  "backendPort": 3001,
  "pinHash": "$2a$10$exampleHashHere",
  "corsOrigin": "http://localhost:5173"
}
```

| Field | Dev value | Docker value |
|---|---|---|
| `hubIp` | Hub's LAN IP | Same |
| `makerToken` | From Maker API page | Same |
| `makerAppId` | From Maker API URL | Same |
| `backendPort` | `3001` | `3001` (internal; nginx proxies) |
| `pinHash` | Generated with bcryptjs | Same |
| `corsOrigin` | `http://localhost:5173` | `http://localhost` |

### Generating a PIN hash

```bash
# Replace 1234 with your chosen PIN
node -e "require('bcryptjs').hash('1234', 10).then(console.log)"
```

### Adding or changing a device's group

Edit `frontend/src/config/groups.ts`. Each entry in a group's `tiles` array:

```typescript
{ deviceId: '68', label: 'Greenhouse Fan', tileType: 'switch' }
// For hub variable tiles:
{ label: 'Echo Message', tileType: 'hub-variable', hubVarName: 'EchoMessage' }
// For ring detection tiles:
{ deviceId: '1257', label: 'RPD Front Door', tileType: 'ring-detection', hubVarName: 'LRPFrontDoor' }
```

Device IDs come from **Hubitat → Devices** — the number in the URL when viewing a device.

---

## 11. Extending the Dashboard

### Adding a new tile type

1. Add the new type to `TileType` in `frontend/src/types.ts`
2. Create `frontend/src/components/tiles/YourTile.tsx`
3. Add the `case 'your-type':` branch in `GroupPage.tsx`'s `renderTile()` function
4. Add tile entries in `groups.ts`

### Adding a new group

1. Add a new `GroupConfig` object to `groups.ts`
2. Add a nav item to `Sidebar.tsx` (icon + label)
3. The route `/group/your-id` works automatically via the existing wildcard route

### Running Playwright tests

```bash
# Start the dev server first
npm run dev

# In a second terminal
cd frontend && npx playwright test

# To run a single spec
npx playwright test --grep "switch tile"

# To see the browser
npx playwright test --headed
```

Tests use `page.route()` mocking and do not require a real Hubitat hub.

---

## 12. Known Limitations & Caveats

| Limitation | Impact | Workaround |
|---|---|---|
| In-memory cache only | Restarting the backend clears state until next device event or page reload | Reload the page; backend re-seeds from Maker API on startup |
| Static device groups | Adding/moving a device requires editing `groups.ts` and rebuilding | Edit the file and run `npm run dev` or rebuild Docker |
| No user accounts | Any LAN device can view/control non-PIN devices | Use a VPN or firewall rule to restrict access to trusted devices |
| Maker API rate limits | Hubitat may throttle rapid commands | The optimistic UI + debounced sliders minimize unnecessary calls |
| SSE keepalive | Some reverse proxies (nginx without tuning) buffer SSE and cause delays | nginx.conf includes `proxy_buffering off` and `X-Accel-Buffering: no` |
| Device IDs are hardcoded | If you factory-reset your hub and re-add devices, IDs may change | Update `groups.ts` with the new IDs |
| No HTTPS by default | Traffic is plain HTTP on LAN | Add a self-signed cert to nginx or use a local DNS + Let's Encrypt if exposing externally |
