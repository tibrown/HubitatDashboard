# HubitatDashboard — Implementation Plan for Raava

> **Context for Raava:** This is the complete implementation plan for a local web-based Hubitat Elevation home automation dashboard. Read `DASHBOARD_BUILD_SPEC.md` in this same folder for full API/architecture reference. Build everything described here from scratch in this folder (`C:\Projects\gitrepos\HubitatDashboard\`).

---

## Project Goal

Build a **local LAN web app** that lets the homeowner control and monitor all 140 Hubitat Elevation devices in their home.

Key requirements:
- Devices are **grouped by the automation app that controls them** (14 groups — see mapping below)
- Virtual/Connector switches shared across multiple apps appear **only in a dedicated System group**
- **Real-time state updates** via Hubitat Maker API webhook → Server-Sent Events (SSE) → browser
- **Secure backend proxy** keeps the Maker API token out of the browser
- **PIN protection** for security-sensitive actions (HSM arm/disarm, lock, mode change)
- **Optimistic UI** — tiles update instantly on command; revert on error
- Deployable via Docker on a Raspberry Pi or NAS

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State management | Zustand |
| Icons | Lucide-react |
| Routing | React Router DOM |
| Backend | Node.js 20 + Fastify + TypeScript |
| Auth | bcrypt PIN hash in config.json |
| Real-time | SSE (server-sent events) |
| Deployment | Docker + docker-compose |

---

## Project Structure

```
HubitatDashboard/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Fastify entry point
│   │   ├── config.ts          # Load/validate config.json
│   │   ├── cache.ts           # In-memory device state cache (Map<id, DeviceState>)
│   │   ├── proxy.ts           # Maker API proxy routes (Fastify plugin)
│   │   ├── webhook.ts         # Hubitat event webhook receiver + SSE endpoint
│   │   └── sse.ts             # SSE broadcast manager
│   ├── config.json.example    # Template (hub IP, token, port, pinHash)
│   ├── config.json            # (gitignored) real credentials
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx            # Router + shell layout
│   │   ├── types.ts           # Shared TypeScript types
│   │   ├── components/
│   │   │   ├── tiles/         # One component per capability type (see Tiles section)
│   │   │   ├── GroupPage.tsx  # Generic group page — reads config, renders correct tiles
│   │   │   ├── SystemBar.tsx  # Always-visible bar: HSM state, mode, connector switch badges
│   │   │   ├── Sidebar.tsx    # Navigation sidebar (group list with device count badges)
│   │   │   └── PinModal.tsx   # 4-digit PIN overlay for security commands
│   │   ├── store/
│   │   │   └── deviceStore.ts # Zustand store: device states + command actions
│   │   ├── hooks/
│   │   │   ├── useSSE.ts      # Connect to /api/events, update store; fallback to 30s polling
│   │   │   └── useCommand.ts  # Optimistic dispatch: snapshot → update → API call → revert on error
│   │   └── config/
│   │       └── groups.ts      # Static mapping: group name → list of { deviceId, tileType, label }
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── .gitignore                 # Must include config.json, node_modules/, dist/
├── DASHBOARD_BUILD_SPEC.md    # Full API/architecture reference (already exists)
└── IMPLEMENTATION_PLAN.md     # This file
```

---

## App-to-Group Mapping (14 Groups)

These groups define the sidebar navigation and group pages. Devices in each group are rendered as tiles matching their capability type.

| Group Route | Display Name | Source App | Devices Included |
|---|---|---|---|
| `/group/environment` | Environment | EnvironmentalControlManager | Greenhouse fan, greenhouse heater, office heater, office fans, mosquito killer (Skeeters), water valve, greenhouse temp/humidity sensor |
| `/group/security-alarm` | Security Alarm | SecurityAlarmManager | 3× Sirens (switch/outlet), PanicButton (button), AlarmTrigger (connector → System), AlarmStop (connector → System), AlarmsEnabled (connector → System), AudibleAlarmsOn (connector → System) |
| `/group/night-security` | Night Security | NightSecurityManager | All perimeter contact sensors (in Night context), all flood lights, Silent (connector → System), HighAlert (connector → System), Traveling (connector → System) |
| `/group/lights` | Lights | LightsAutomationManager | All flood lights (dimmer/switch), desk bulb (dimmer), RGBW light strips, generic outlet switches, NightLights (connector → System), EmergencyLightsOn (connector → System), OnPTO (connector → System), Holiday (connector → System) |
| `/group/doors-windows` | Doors & Windows | DoorWindowMonitor | Front door contact, dining door contact, French doors contacts, lanai contact, she-shed contact, woodshed contact, concrete-shed contact, freezer contact, safe contact, LR window contacts, PauseDRDoorAlarm (connector → System), PauseBDAlarm (connector → System) |
| `/group/presence-motion` | Presence & Motion | MotionPresenceManager | Carport motion, front-door motion, side-yard motion, RV motion, office motion, rear-carport motion, Tim's iPhone presence, spouse presence, ArriveGracePeriodSwitch (connector → System) |
| `/group/perimeter` | Perimeter | PerimeterSecurityManager | Front gate contact, rear gate contact, side-yard gate contact, shock sensor, carport beam motion, RPDFrontDoor (switch), RPDBackDoor (switch), RPDBirdHouse (switch), RPDGarden (switch), RPDCPen (switch), RPDRearGate (switch), SilentCarport (connector → System), RearGateActive (connector → System) |
| `/group/emergency` | Emergency | EmergencyHelpManager | Shower help button, desk button, key fob (button), visual-alert flood lights, StopShowerHelp (connector → System), Silent (connector → System) |
| `/group/cameras` | Cameras | CameraPrivacyManager | Indoor camera power outlets (switch), outdoor camera power outlets (switch), manual override switch, IndoorCamsSwitch (connector → System), Traveling (connector → System) |
| `/group/ring-detections` | Ring Detections | RingPersonDetectionManager | RPD* virtual switches (6 locations), LRP* hub variables (last-seen timestamps — displayed as "last seen X ago"), EchoMessage hub variable |
| `/group/seasonal` | Seasonal | ChristmasControl | ChristmasTrees switch, Christmas light outlet switches, ChristmasTrees (connector → System) |
| `/group/hub-mode` | Hub Mode | ModeManager | Hub mode display/selector (Morning/Day/Evening/Night/Away), Night auto-control switch |
| `/group/power-monitor` | Power Monitor | MainsPowerMonitor + SilentCheck | UPS power source sensor (read-only), On Mains status switch, Ignore Mains switch, RingModeOnOff switch (Ring armed/disarmed status) |
| `/group/system` | System | All apps (shared) | All Connector Switches (see list below), key Hub Variables, HSM tile, current hub mode tile |

### System Group — Connector Switches (appear here ONLY, not duplicated in other groups)

```
AlarmsEnabled       AudibleAlarmsOn    Silent              HighAlert
Traveling           OnPTO              Holiday             SummerTime
ChristmasTrees      PauseDRDoorAlarm   PauseBDAlarm        IndoorCamsSwitch
StopShowerHelp      AlarmTrigger       AlarmStop           NightLights
EmergencyLightsOn   ArriveGracePeriodSwitch                SilentCarport
RearGateActive      RingModeOnOff
```

---

## Backend API Routes

All routes served by Fastify on `config.backendPort` (default 3001). The Vite dev server proxies `/api` to this port.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/devices` | Returns all devices with current state (proxied from Maker API, merged with cache) |
| `GET` | `/api/devices/:id` | Single device current state |
| `PUT` | `/api/devices/:id/:command/:value?` | Send a command (e.g., `on`, `off`, `setLevel/75`, `push/1`) |
| `GET` | `/api/hsm` | Current HSM status |
| `PUT` | `/api/hsm/:armMode` | Change HSM state (requires PIN in body) |
| `GET` | `/api/modes` | List all modes + current mode |
| `PUT` | `/api/modes/:id` | Change hub mode (requires PIN in body) |
| `GET` | `/api/hubvariables` | All hub variables with current values |
| `PUT` | `/api/hubvariables/:name` | Update a hub variable value |
| `POST` | `/api/webhook` | Receives Hubitat device events (webhook push from Maker API) |
| `GET` | `/api/events` | SSE endpoint — streams device events to browser |

### config.json Schema

```json
{
  "hubIP": "192.168.1.xxx",
  "makerAppId": "123",
  "accessToken": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "backendPort": 3001,
  "pinHash": "<bcrypt hash of 4-digit dashboard PIN>",
  "postUrl": "http://<THIS_SERVER_IP>:3001/api/webhook"
}
```

`config.json` must be in `.gitignore`. The `postUrl` value must be registered in Hubitat Maker API settings so the hub sends events to the backend.

---

## Tile Components (16 types)

Each tile receives `{ deviceId, label }` props and reads live state from the Zustand store.

| Component | Capabilities Handled | Controls |
|---|---|---|
| `SwitchTile` | `switch` | On/off toggle button, colored indicator |
| `DimmerTile` | `switchLevel` + `switch` | On/off toggle + level slider (0–100, debounced) |
| `RGBWTile` | `colorControl` + `colorTemperature` | On/off + hue/saturation sliders + color-temp slider |
| `ContactTile` | `contactSensor` | Read-only open (red) / closed (green) badge |
| `MotionTile` | `motionSensor` | Read-only active (amber) / inactive (grey) badge |
| `TemperatureTile` | `temperatureMeasurement` | Read-only °F value; optional humidity if available |
| `PowerMeterTile` | `powerMeter` | Read-only watts; optional switch toggle if also has switch |
| `ButtonTile` | `pushableButton` | Push button; brief "pressed" animation feedback |
| `LockTile` | `lock` | Lock/unlock buttons + PIN modal |
| `ConnectorSwitchTile` | `switch` (virtual/connector) | Compact badge ON (colored) / OFF (grey); tap to toggle |
| `HubVariableTile` | hub variable | Display value; click to edit inline (number or string) |
| `HSMTile` | HSM special | Shows armedAway/armedHome/armedNight/disarmed; buttons to change; PIN modal |
| `ModeTile` | mode special | Shows current mode; dropdown to change; PIN modal |
| `RingDetectionTile` | `switch` + timestamp hubVar | RPD state + "last seen X ago" from LRP* hub variable |
| `PresenceTile` | `presenceSensor` | Present (green) / not-present (grey); person label |
| `PinModal` | (overlay) | 4-digit number-pad overlay; verifies against backend `/api/hsm` or `/api/modes` |

---

## Data Flow

### Real-time events (Hubitat → Browser)

```
Hubitat Hub fires device event
  → POST /api/webhook  (Maker API postURL config)
     → backend: parse { deviceId, name, value }
     → update in-memory cache
     → SSE broadcast: { deviceId, attribute, value }
        → browser: useSSE hook receives event
        → Zustand store: setDevice(deviceId, { [attribute]: value })
        → tiles auto-re-render
```

### Command (Browser → Hubitat)

```
User taps tile (e.g., turn on switch #42)
  → useCommand hook:
     1. Snapshot current Zustand state for deviceId
     2. Optimistically update store: { switch: "on" }
     3. PUT /api/devices/42/on
        → backend proxy → Maker API
     4a. Success: Maker API will send webhook confirming new state → ignore
     4b. Error: revert Zustand to snapshot, show error toast
```

### SSE reconnection / polling fallback

```
SSE connects on app load
If SSE errors or loses connection:
  → fall back to polling GET /api/devices every 30 seconds
  → reconnect SSE when tab becomes visible again (Page Visibility API)
```

---

## Implementation Phases

Work through these in order. Each phase builds on the last.

### Phase 1 — Project Scaffold
- [ ] Create monorepo root `package.json` with workspaces: `["frontend", "backend"]`
- [ ] Create `.gitignore` (exclude `config.json`, `node_modules/`, `dist/`, `*.local`)
- [ ] Init `frontend/` with `npm create vite@latest . -- --template react-ts`
- [ ] Install frontend deps: `tailwindcss postcss autoprefixer zustand lucide-react react-router-dom`
- [ ] Init Tailwind: `npx tailwindcss init -p` + configure `content` paths
- [ ] Init `backend/` with `package.json`
- [ ] Install backend deps: `fastify @fastify/cors @fastify/formbody node-fetch bcryptjs @types/bcryptjs typescript tsx`
- [ ] Create `backend/tsconfig.json`
- [ ] Create `backend/config.json.example`
- [ ] Create `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`

### Phase 2 — Backend Core
- [ ] `backend/src/config.ts` — load and validate `config.json`; export typed `Config` object
- [ ] `backend/src/cache.ts` — `Map<string, DeviceState>` cache; `getDevice()`, `setDevice()`, `getAllDevices()`
- [ ] `backend/src/sse.ts` — SSE client set; `addClient()`, `removeClient()`, `broadcast(event)`
- [ ] `backend/src/proxy.ts` — all Maker API proxy routes as a Fastify plugin (see routes table above)
- [ ] `backend/src/webhook.ts` — `POST /api/webhook` receiver; `GET /api/events` SSE stream
- [ ] `backend/src/server.ts` — register CORS, plugins, start server on `config.backendPort`

### Phase 3 — Frontend Core
- [ ] `frontend/src/types.ts` — `DeviceState`, `GroupConfig`, `TileConfig`, `SSEEvent` types
- [ ] `frontend/src/store/deviceStore.ts` — Zustand store with `setDevice`, `setAllDevices`, `applyEvent`
- [ ] `frontend/src/hooks/useSSE.ts` — SSE client + polling fallback + reconnect logic
- [ ] `frontend/src/hooks/useCommand.ts` — optimistic dispatch with snapshot/revert
- [ ] `frontend/src/App.tsx` — React Router with routes for each group (`/group/:groupId`)
- [ ] `frontend/src/components/Sidebar.tsx` — group list nav; highlights active; device count badges
- [ ] `frontend/src/components/SystemBar.tsx` — persistent top bar: HSM, mode, key connector switch badges
- [ ] `frontend/src/components/GroupPage.tsx` — reads `groups.ts` config, renders tile grid for active group

### Phase 4 — Tile Components
Build all 16 tile components listed above. Each should:
- Accept `{ deviceId: string, label: string }` props
- Read state from `useStore(state => state.devices[deviceId])`
- Use `useCommand` for any state-changing action
- Show a loading spinner / disabled state during command in-flight
- Handle missing/unknown device state gracefully (skeleton or "unavailable" badge)

### Phase 5 — Group Config + Pages
- [ ] `frontend/src/config/groups.ts` — static device-ID → tile-type mapping for all 14 groups
  - Use device IDs from `C:\Projects\gitrepos\HubitatWork\wiki-export\Docs-devices-table.md`
  - Reference hub variable names from `C:\Projects\gitrepos\HubitatWork\wiki-export\Docs-Hub-Variables-Reference.md`
- [ ] Wire all 14 group routes in `App.tsx`
- [ ] Fully populate `SystemBar.tsx` with all connector switch badges

### Phase 6 — Polish
- [ ] Global toast/notification system (error messages from failed commands, SSE status)
- [ ] Responsive layout: 1-col mobile, 2–3 col tablet, 4+ col desktop
- [ ] Dark mode: Tailwind `dark:` classes + `prefers-color-scheme` detection + manual toggle in sidebar
- [ ] `README.md` with: prerequisites, config.json setup, Maker API webhook setup, dev startup, Docker deploy

---

## Key Source Files to Read Before Coding

| File | Why |
|---|---|
| `DASHBOARD_BUILD_SPEC.md` | Full API reference, Maker API endpoints, event format, design system, best practices |
| `C:\Projects\gitrepos\HubitatWork\wiki-export\Docs-devices-table.md` | Complete list of 140 devices with IDs, labels, capabilities, rooms |
| `C:\Projects\gitrepos\HubitatWork\wiki-export\Docs-Hub-Variables-Reference.md` | All 42 connector switches and 35+ hub variables with their purpose and app ownership |
| `C:\Projects\gitrepos\HubitatWork\wiki-export\Docs-Platform-Overview.md` | Maker API webhook format and event payload structure |

---

## Important Constraints

1. **`config.json` must be gitignored** — it contains the Maker API access token. Only `config.json.example` is committed.
2. **No direct Maker API calls from the browser** — all requests go through the backend proxy at `/api/`.
3. **Connector switches are in System group ONLY** — they are not duplicated in app group pages. The 22 shared/multi-app connector switches listed in the System Group section above must only appear under `/group/system`.
4. **Optimistic UI is required** — the UI must not wait for the webhook confirmation to update. Update immediately, revert on error.
5. **SSE is primary, polling is fallback** — prefer SSE; poll at 30s intervals only when SSE is disconnected.
6. **Device-to-group mapping is static** — `config/groups.ts` uses hardcoded device IDs from the devices table. No dynamic discovery required.
7. **PIN is bcrypt-verified server-side** — the plain PIN never leaves the frontend unencrypted. Backend verifies against the hash in `config.json`.
