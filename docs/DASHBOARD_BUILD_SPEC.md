# Hubitat Dashboard — Comprehensive Build Specification

> **Purpose**: This document is the authoritative reference an AI agent or developer can use to construct a detailed implementation plan for a new, web-based Hubitat Elevation dashboard. It synthesises knowledge from the live HubitatWork project, all local documentation, and the official Hubitat documentation ecosystem.

---

## Table of Contents

1. [Project Vision & Goals](#1-project-vision--goals)
2. [Source Analysis Summary](#2-source-analysis-summary)
3. [Architecture Overview](#3-architecture-overview)
4. [Data Layer — Hubitat Maker API](#4-data-layer--hubitat-maker-api)
5. [Real-Time Event Strategy](#5-real-time-event-strategy)
6. [Device & Capability Model](#6-device--capability-model)
7. [Room & System Organisation](#7-room--system-organisation)
8. [Tile Design System](#8-tile-design-system)
9. [System Status & Hub Variables](#9-system-status--hub-variables)
10. [Security & Access Control](#10-security--access-control)
11. [UI/UX Design Principles](#11-uiux-design-principles)
12. [Recommended Tech Stack](#12-recommended-tech-stack)
13. [Feature Inventory & Prioritisation](#13-feature-inventory--prioritisation)
14. [Implementation Phases](#14-implementation-phases)
15. [Configuration & Settings Model](#15-configuration--settings-model)
16. [Key Design Decisions & Rationale](#16-key-design-decisions--rationale)

---

## 1. Project Vision & Goals

Build a **self-hosted, web-based dashboard** for Hubitat Elevation that:

- Works in any modern browser (desktop, tablet, wall-mounted tablet, phone)
- Communicates exclusively via the **Hubitat Maker API** — no Hubitat apps to install beyond Maker API itself
- Updates device states in **real time** without polling
- Is **room-aware** and organises tiles by the rooms and categories already established in the HubitatWork system
- Surfaces **system-level status** (Hub Mode, HSM state, Connector Switches, Hub Variables) prominently
- Offers **PIN-protected** sensitive actions (alarm arming, HSM control, mode change)
- Is **fully configurable** without code — layout, tile content, and visibility are user-defined
- Looks significantly better than the stock Hubitat Dashboard with clear typography, colour-coded states, and intuitive iconography

---

## 2. Source Analysis Summary

### 2.1 HubitatWork Project — What Exists

The live system consists of **140 devices** spread across **18 named rooms** and driven by **14 custom automation apps**:

| App | Domain |
|---|---|
| SecurityAlarmManager | Alarm triggering, sirens, audible alerts |
| NightSecurityManager | After-dark perimeter + motion security |
| LightsAutomationManager | Motion-driven and scheduled lighting |
| DoorWindowMonitor | Door/window open alerts |
| EnvironmentalControlManager | Greenhouse, office temp/humidity control |
| EmergencyHelpManager | Shower help button, visual/audio alerts |
| MotionPresenceManager | Presence/arrival grace period |
| CameraPrivacyManager | Indoor camera auto-on/off |
| PerimeterSecurityManager | Gate, shock sensor, Ring Person alerts |
| RingPersonDetectionManager | Ring doorbell person events |
| ModeManager | Hub mode transitions |
| ChristmasControl | Seasonal light scheduling |
| NightSecurityManager | Sequence/rule based night security |
| SpecialAutomationsManager | Miscellaneous automations |

### 2.2 Key Device Categories in Use

| Category | Count | Tile Type Needed |
|---|---|---|
| Connector Switch (state flags) | 42 | Toggle / Status indicator |
| Generic Zigbee/Z-Wave Outlet | 22 | Switch tile |
| Motion Sensor | 10+ | Sensor status tile |
| Contact Sensor | 12+ | Open/Closed tile |
| Temperature/Humidity | 5+ | Sensor readout tile |
| RGB/RGBW Bulb | 4 | Colour picker + dimmer tile |
| Dimmer/Switch (Sengled floods) | 10+ | Dimmer tile |
| Power Meter Plug | 5 | Energy/power tile |
| Lock | 0 physical, pattern known | Lock tile |
| Thermostat | Pattern known | Thermostat tile |
| Alarm/Siren | Known capability | Alarm tile |

### 2.3 What the Official Hubitat Dashboard Does Well (keep these)

- Grid-based layout with configurable column/row counts
- Per-user access tokens with QR codes
- PIN protection for HSM and Mode changes
- Cloud and LAN access URLs
- Real-time updates via WebSocket under normal conditions
- Dashboard builder auto-populated from capability groups
- Tile history (recent events) per device

### 2.4 What Third-Party Dashboards Do Better (implement these)

| Source | Best Idea |
|---|---|
| SharpTools.io | Drag-and-drop tile placement; hero tiles with large state display; rule-based tile colouring |
| HD+ | Native-feeling on tablet; gesture controls; full-screen mode; dynamic tile backgrounds |
| ActionTiles | Clean visual hierarchy; multi-panel layouts; easy wall-mount mode |
| Community CSS guides | Custom per-tile theming; hide headers for kiosk mode |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (SPA)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Dashboard  │  │ Config / Edit│  │  System Status Bar │  │
│  │  View Layer │  │     Mode     │  │  (Mode, HSM, Vars) │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬──────────┘  │
│         │                │                    │              │
│  ┌──────▼────────────────▼────────────────────▼──────────┐  │
│  │              State Management (Zustand / Redux)        │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────▼───────────────────────────┐  │
│  │              API Client / WebSocket Layer             │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │  HTTP + WebSocket (or SSE proxy)
┌─────────────────────────────▼───────────────────────────────┐
│              Thin Node/Bun Backend (optional proxy)          │
│  - Stores config JSON (layout, settings, dashboards)         │
│  - Forwards Maker API token (keeps it out of the browser)    │
│  - Receives Maker API postURL webhooks → SSE broadcast       │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│              Hubitat Hub (Maker API)                         │
│  Devices · Rooms · Hub Variables · Modes · HSM              │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Thin backend is required** to:
   - Keep the Maker API access token server-side only (security)
   - Act as a webhook receiver for `postURL` events and rebroadcast via SSE or WebSocket to all open browser tabs
   - Persist dashboard layout/config as JSON files without a full database
   
2. **SPA frontend** (React or Vue 3) for fast tile rendering and offline-capable layout editing

3. **No Hubitat-side code** beyond Maker API — zero Hubitat app installs needed beyond what already exists

---

## 4. Data Layer — Hubitat Maker API

### 4.1 Base URL Format

```
http://[HUB_IP]/apps/api/[APP_ID]/[endpoint]?access_token=[TOKEN]
```

All API calls are made from the backend proxy, never directly from the browser.

### 4.2 Endpoints to Use

| Endpoint | When Used |
|---|---|
| `GET /devices` | Initial load — build device list with IDs, names, labels |
| `GET /devices/all` | Initial load — get full capabilities, attributes, commands |
| `GET /devices/[id]` | On-demand refresh for a single device |
| `GET /devices/[id]/[command]` | Send a command (on, off, lock, etc.) |
| `GET /devices/[id]/[command]/[value]` | Send a command with parameter (setLevel, setColorTemperature, etc.) |
| `GET /devices/[id]/events` | Tile history view |
| `GET /rooms` | Room metadata for room-based layout |
| `GET /hubvariables` | Load all exposed hub variables |
| `GET /hubvariables/[name]/[value]` | Set a hub variable value |
| `GET /modes` | Get/display current hub mode |
| `GET /modes/[id]` | Change hub mode |
| `GET /hsm` | Get HSM status |
| `GET /hsm/[value]` | Set HSM state (armAway, armHome, disarm) |
| `POST /postURL/[url]` | Register webhook for real-time events |

### 4.3 Device Data Model (from `/devices/all`)

```json
{
  "id": "123",
  "name": "Sengled Element Classic",
  "label": "Bedroom Light",
  "type": "Sengled Element Classic",
  "capabilities": ["Switch", "SwitchLevel", "Refresh"],
  "attributes": { "switch": "off", "level": 0 },
  "commands": [{"command": "on"}, {"command": "off"}, {"command": "setLevel"}]
}
```

The dashboard uses `capabilities` to determine the **tile template** and `attributes` to render **current state**.

### 4.4 Hub Variable Model

```json
{ "name": "AlarmsEnabled", "value": "false", "type": "string" }
```

Hub variables prefixed with known system names (see Section 9) should be surfaced in a dedicated System Status panel.

---

## 5. Real-Time Event Strategy

### 5.1 Recommended Approach: Webhook → SSE

1. Dashboard backend registers a `postURL` with Maker API pointing to its own `/webhook` endpoint
2. Maker API POSTs every device event to that URL in real time
3. Backend rebroadcasts the event as **Server-Sent Events (SSE)** to all connected browser clients
4. Frontend subscribes to the SSE stream and updates only the affected tile(s)

**Webhook payload format:**
```json
{
  "content": {
    "name": "switch",
    "value": "on",
    "displayName": "Bedroom Light",
    "deviceId": "115",
    "descriptionText": "Bedroom Light switch is on",
    "unit": null,
    "data": null
  }
}
```

### 5.2 Fallback: Polling

If the backend is not available or the webhook cannot be registered (cloud-only access):
- Poll `GET /devices/[id]` for visible tiles every N seconds (configurable, default 30s)
- Poll system endpoints (modes, HSM, hub variables) every 60 seconds
- Clearly indicate "polling mode" vs "live mode" in the UI

### 5.3 Why Not Hubitat's Native WebSocket?

Hubitat's dashboard uses a private internal WebSocket that is not exposed by Maker API. The `postURL` webhook pattern is the correct public integration point.

---

## 6. Device & Capability Model

### 6.1 Capability → Tile Template Mapping

| Capability | Tile Template | Key Attributes | Commands |
|---|---|---|---|
| `Switch` | Switch Toggle | `switch` (on/off) | `on()`, `off()` |
| `SwitchLevel` | Dimmer Slider | `level` (0-100) | `setLevel(n)` |
| `ColorControl` | Color Picker + Dimmer | `hue`, `saturation`, `color`, `RGB` | `setColor(map)`, `setHue`, `setSaturation` |
| `ColorTemperature` | CT Slider | `colorTemperature` | `setColorTemperature(K)` |
| `MotionSensor` | Status Badge | `motion` (active/inactive) | — |
| `ContactSensor` | Open/Closed Badge | `contact` (open/closed) | — |
| `TemperatureMeasurement` | Readout | `temperature` | — |
| `RelativeHumidityMeasurement` | Readout | `humidity` | — |
| `Lock` | Lock Toggle | `lock` (locked/unlocked) | `lock()`, `unlock()` |
| `Thermostat` | Thermostat Card | `thermostatMode`, `temperature`, `heatingSetpoint`, `coolingSetpoint` | `setHeatingSetpoint`, `setCoolingSetpoint`, `setThermostatMode` |
| `EnergyMeter` / `PowerMeter` | Energy Readout | `energy` (kWh), `power` (W) | — |
| `Alarm` | Alarm Control | `alarm` | `siren()`, `strobe()`, `both()`, `off()` |
| `PresenceSensor` | Presence Badge | `presence` | — |
| `WaterSensor` | Water Alert | `water` (wet/dry) | — |
| `SmokeDetector` | Smoke Alert | `smoke` | — |
| `DoorControl` / `GarageDoorControl` | Door Control | `door` | `open()`, `close()` |
| `WindowBlind` / `WindowShade` | Shade Slider | `position`, `windowShade` | `setPosition(n)` |
| `FanControl` | Fan Speed | `speed` | `setSpeed(s)` |
| `Battery` | Battery Level | `battery` | — |
| `Variable` (Connector Switch) | Status Flag | `switch` (on/off) | `on()`, `off()` |

### 6.2 Tile Template Priority

When a device has multiple capabilities, the most specific template wins:

1. `Thermostat` > everything
2. `ColorControl` > `SwitchLevel` > `Switch`
3. `Lock` > `Switch`
4. `DoorControl` > `ContactSensor`
5. `GarageDoorControl` > `ContactSensor`
6. `WindowBlind` > `WindowShade` > `Switch`

User can always override the auto-selected template.

### 6.3 Composite Tiles

Some tiles should aggregate multiple attributes from one device:

- **RGBW Bulb Tile**: Switch toggle + level slider + CT slider + colour picker (all in one card, expandable)
- **Thermostat Tile**: Large temperature readout + mode selector + setpoint +/- controls
- **Power Plug Tile**: Switch toggle + current watts + cumulative kWh

---

## 7. Room & System Organisation

### 7.1 Rooms from the Live System

The following rooms are confirmed in the HubitatWork device table and should appear as navigable sections:

| Room | Primary Device Types |
|---|---|
| Living | Contact sensors (windows/door), outlets, presence sensor, motion, camera |
| Dining Room | Motion, outlets, contact sensor, RGBW strip |
| Kitchen | Outlet/repeater, light strip |
| Bedroom | Light (dimmer), motion (dog sensor), contact sensor |
| Office | Lights (floods + bulbs), fans, outlets, desk motion, sensors |
| Lania | Outlets, temperature sensor, light strip, contact sensor |
| Carport | Motion sensors, flood lights, outlets, camera repeater |
| Woodshed | Motion sensor, contact sensor, flood light |
| Concrete Shed | Outlet, motion, contact sensor |
| BirdHouse | Contact sensors, RGBW bulb, motion sensor |
| Chicken Pen | Motion, outlet (heater), virtual switch |
| Greenhouse | Fan outlet, motion, temperature |
| Guest Room | Lights |
| RV | Component switches, motion sensor |
| Shower | Virtual contact switch, motion sensor |
| SideYard | Gate sensor, skeeter switch |
| CourtYard | Outlet |
| ZMIsc (System) | Connector switches, mode device, virtual states |

### 7.2 Dashboard Layout Strategy

**Primary layout: Room Grid**
- Left sidebar or top nav: room list
- Main area: tiles for the selected room
- Persistent top bar: System Status (Mode, HSM, key flags)

**Alternative layout: Category Grid**
- Groups tiles by capability category: Lights, Security, Climate, Power, Presence
- Useful for tablet wall-mounts

**Custom layout:**
- User places tiles freely on a configurable grid
- Drag-and-drop repositioning and resizing
- Save multiple named dashboards (e.g., "Main Panel", "Security Overview", "Climate")

### 7.3 System Status Bar (Always Visible)

Fixed header/footer strip showing:
- **Hub Mode** (current mode name, click to change — PIN protected)
- **HSM Status** (Armed Away / Armed Home / Disarmed — click to change — PIN protected)
- **Active Alerts** badge (count of tripped sensors)
- **AlarmsEnabled** state
- **Silent** mode flag
- **Traveling** flag
- **Live / Polling** indicator

---

## 8. Tile Design System

### 8.1 Tile Anatomy

```
┌─────────────────────────────┐
│ 🔆  Bedroom Light      [···]│  ← Label + 3-dot menu
│                             │
│    ●  OFF                   │  ← State (large, colour-coded)
│                             │
│  [  OFF  ] ────────  [ON ]  │  ← Primary control
│                             │
│  ▁▁▁▁▂▂▃▃▄▄▅▅▆▆▇▇ 45%     │  ← Secondary control (if dimmer)
└─────────────────────────────┘
```

### 8.2 State Colour Scheme

| State | Colour | Use Case |
|---|---|---|
| ON / Active / Open / Unlocked | Amber / Yellow | Lights on, door open, unlocked |
| OFF / Inactive / Closed / Locked | Dark grey / Slate | Default idle state |
| Alert / Detected / Alarm | Red | Motion active, smoke, water, alarm |
| OK / Clear | Green | Water dry, smoke clear, all secure |
| Warning | Orange | Battery low, temperature threshold, door left open |
| Unknown | Grey | Lost connection, no data |
| Armed Away | Deep red | HSM armed away |
| Armed Home | Orange | HSM armed home |
| Disarmed | Green | HSM disarmed |

### 8.3 Tile Sizes

| Size | Grid Units | Use Case |
|---|---|---|
| Small | 1×1 | Single-state sensor (motion, contact, presence) |
| Standard | 2×1 | Switch, simple dimmer |
| Wide | 2×2 | Thermostat, colour bulb, energy meter |
| Hero | 4×2 | System status (HSM, mode), camera thumbnail |
| Full Width | 12×1 | Room separator header |

### 8.4 Tile Types — Complete List

1. **Switch Tile** — on/off toggle, colour coded by state, label, last-changed timestamp
2. **Dimmer Tile** — on/off + level slider (0-100%), brightness percentage shown
3. **RGBW Tile** — on/off + level + colour temperature slider + colour picker (collapsed by default)
4. **Sensor Badge** — motion, contact, water, smoke, presence — large icon, state text, last-changed
5. **Temperature Tile** — large readout with unit (°F/°C), trend arrow if history available
6. **Humidity Tile** — readout + comfort level indicator
7. **Thermostat Tile** — current temp, setpoint, mode selector, +/- controls
8. **Lock Tile** — locked/unlocked with icon, tap to toggle (PIN protected)
9. **Door/Garage Tile** — open/close/opening/closing animation, control buttons
10. **Shade/Blind Tile** — position slider, open/close buttons
11. **Fan Tile** — speed selector (off/low/medium/high/auto)
12. **Energy Tile** — current watts + kWh total + cost (if rate configured)
13. **Alarm Tile** — siren/strobe/both/off controls (PIN protected)
14. **Variable/Flag Tile** — Connector Switch as a status flag or toggle
15. **Hub Variable Tile** — display/edit a hub variable value (number, string, bool)
16. **Mode Tile** — current hub mode, tap to select a different mode (PIN optional)
17. **HSM Tile** — current HSM state, tap to arm/disarm (PIN required)
18. **Clock Tile** — current time/date, configurable format
19. **Weather Tile** — (future) external weather integration
20. **Camera Tile** — snapshot image from a camera URL
21. **History Tile** — event list for a device
22. **Group Tile** — controls multiple devices at once (all lights in a room)

### 8.5 Visual Feedback Patterns

- **Optimistic UI**: Tile immediately shows new state on user action; reverts if API call fails
- **Loading spinner**: Brief spinner overlay during API call
- **Error state**: Red border + error icon on tile if command failed or device unreachable
- **Stale data indicator**: Subtle dimming of tile if last update > configurable threshold

---

## 9. System Status & Hub Variables

### 9.1 Connector Switches to Surface

These should appear in a dedicated **System Panel** or the always-visible status bar:

**Security & Alarms**
- `AlarmsEnabled` — master alarm toggle
- `AudibleAlarmsOn` — audible vs silent alarm
- `Silent` — system-wide silent mode
- `HighAlert` — elevated security mode
- `AlarmTrigger` — read-only active indicator
- `AlarmStop` — emergency stop button

**Presence & Modes**
- `Traveling` — away from home
- `OnPTO` — vacation mode
- `Holiday` — holiday mode
- `SummerTime` — seasonal mode
- `ChristmasTrees` — seasonal decoration flag

**Security Pause/Override**
- `PauseDRDoorAlarm` — pause dining room door alert
- `PauseBDAlarm` — pause backdoor alarm
- `SilentCarport` — suppress carport notifications
- `PauseCarportBeam` — suppress carport beam alerts

**Emergency**
- `StopShowerHelp` — cancel shower emergency
- `IndoorCamsSwitch` — camera privacy toggle

### 9.2 Hub Variables to Expose (Read-Only Display)

| Variable | Dashboard Widget |
|---|---|
| `AlarmActive` | Alert badge in status bar |
| `EchoMessage` | Last Alexa TTS message |
| `AlertMessage` | Last alert text |
| `FloodTimeout` | Config panel only |
| `DoorOpenThreshold` | Config panel only |
| `GreenhouseFanOnTemp` | Greenhouse climate tile |
| `FreezeAlertThreshold` | Environmental alert config |

### 9.3 Mode Display

- Hub Modes are fetched from `GET /modes`
- Current mode highlighted in the status bar
- Mode picker available on click (PIN-optional)
- Common modes in this system: Day, Night, Away, Home

### 9.4 HSM Status Values

| Value | Display |
|---|---|
| `armedAway` | 🔴 Armed Away |
| `armedHome` | 🟠 Armed Home |
| `armedNight` | 🟠 Armed Night |
| `disarmed` | 🟢 Disarmed |
| `allDisarmed` | 🟢 All Disarmed |

HSM set values: `armAway`, `armHome`, `armNight`, `disarm`

---

## 10. Security & Access Control

### 10.1 Access Token Security

- The Maker API `access_token` **must never** be sent to the browser
- All Maker API calls go through the thin backend proxy
- Backend authenticates dashboard users separately (simple shared secret or user login)
- The backend's config file stores the token, not the browser's localStorage

### 10.2 PIN Protection

Configurable PIN requirement for:
- HSM state changes (recommended: always required)
- Hub Mode changes (optional)
- Lock commands (recommended: always required)
- Alarm trigger/stop commands (recommended: always required)
- Connector Switch toggles for security switches (optional per switch)

PIN is entered in a modal overlay; valid for a configurable session duration (e.g., 5 minutes).

### 10.3 Dashboard Access URLs

Following the Hubitat pattern:
- **Local URL**: `http://[dashboard-host]:3000/` — LAN only
- **Remote URL**: can be served behind a reverse proxy (nginx, Cloudflare tunnel) for remote access
- **Read-only mode**: config option that prevents any commands being sent, suitable for display-only wall panels

### 10.4 Per-User Dashboards

- Multiple named dashboard layouts can be saved
- Each layout can be assigned a short URL or QR code
- No per-user authentication required for simple household use; optional for multi-family

---

## 11. UI/UX Design Principles

### 11.1 Design Goals

1. **Glanceable**: The most important states (HSM, mode, active alerts) are readable from 3 metres
2. **Touch-first**: All interactive elements are minimum 44×44px touch targets
3. **Kiosk-friendly**: Full-screen mode hides browser chrome; optional auto-hide UI controls
4. **Dark mode default**: Dark background reduces eye strain on wall-mounted tablets; light mode available
5. **No hidden information**: State is always visible; never require a tap to see current value
6. **Fast**: First meaningful paint under 2 seconds on local network; tiles update within 200ms of event

### 11.2 Layout Modes

| Mode | Description | Best For |
|---|---|---|
| **Room View** | Sidebar room list + tile grid | Desktop, large tablets |
| **Tab View** | Room tabs at top, tiles below | Phone, small tablets |
| **Kiosk View** | Full-screen, no chrome, no edit controls | Wall-mounted panels |
| **Compact View** | Small tiles, maximum density | Overview / status monitor |
| **Category View** | Tiles grouped by function, not room | Climate control, Security panels |

### 11.3 Responsive Breakpoints

| Breakpoint | Columns | Behaviour |
|---|---|---|
| < 480px (phone) | 2 | Small tiles, tab navigation |
| 480–768px (tablet portrait) | 3–4 | Tab or sidebar navigation |
| 768–1280px (tablet landscape) | 6 | Full sidebar |
| > 1280px (desktop) | 8–12 | Full layout, drag-and-drop editing |

### 11.4 Editing Experience

- **Edit Mode** toggle (lock icon in top bar) — switches between view and edit
- In edit mode: tiles show resize handles and drag handle
- Drag-and-drop repositioning on the grid
- Tile settings panel (click gear icon) for per-tile config
- "Add Tile" panel: searchable device list → select capability/template → place on grid
- Layout auto-saves on every change (debounced 1s)
- "Reset to default" option restores room-based auto layout

### 11.5 Accessibility

- Colour is never the only indicator of state (always paired with icon + text)
- All controls keyboard-accessible
- ARIA labels on all interactive elements
- High contrast mode available

---

## 12. Recommended Tech Stack

### 12.1 Frontend

| Component | Recommendation | Rationale |
|---|---|---|
| Framework | **React 18** or **Vue 3** | Both excellent; React has broader ecosystem for drag-and-drop and animation |
| Build tool | **Vite** | Fast HMR, small bundles |
| State management | **Zustand** (React) or **Pinia** (Vue) | Lightweight, no boilerplate |
| Drag-and-drop grid | **react-grid-layout** (React) or **vue-grid-layout** (Vue) | Proven, resizable grid |
| Icons | **Lucide** or **Phosphor Icons** | Clean, consistent, tree-shakeable |
| Colour picker | **react-colorful** | Tiny, accessible |
| Sliders | **@radix-ui/react-slider** or **vue-slider-component** | Accessible, styleable |
| CSS | **Tailwind CSS** + component variants | Utility-first, dark mode built in |
| Routing | **React Router v6** / **Vue Router 4** | Named dashboard routes |

### 12.2 Backend (Thin Proxy)

| Component | Recommendation | Rationale |
|---|---|---|
| Runtime | **Node.js 20+** or **Bun** | Fast, minimal, good SSE support |
| Framework | **Fastify** or **Hono** | Low overhead, SSE support |
| Config storage | **JSON files** (+ optional SQLite via `better-sqlite3`) | Simple, no database needed for MVP |
| Process manager | **PM2** or **systemd** | Keep alive on Raspberry Pi / NAS |

### 12.3 Deployment Target

- **Raspberry Pi 4+** or **NAS (Synology, QNAP)** — runs on the same LAN as the hub
- Docker container (Dockerfile + docker-compose) for easy setup
- No cloud services required; optionally expose via Cloudflare Tunnel for remote access

### 12.4 Development Tools

- TypeScript throughout (frontend + backend)
- ESLint + Prettier
- Vitest for unit tests
- Playwright for E2E tests (mocking Maker API responses)

---

## 13. Feature Inventory & Prioritisation

### Phase 1 — MVP (Core Functionality)

| Feature | Priority |
|---|---|
| Maker API connection config (hub IP, token) | P0 |
| Fetch all devices on load | P0 |
| Room-based tile layout (auto from Maker API rooms) | P0 |
| Switch tile (on/off) | P0 |
| Dimmer tile (on/off + level) | P0 |
| Sensor badge tile (motion, contact, presence) | P0 |
| Temperature / humidity readout tile | P0 |
| Webhook receiver → SSE broadcast | P0 |
| Real-time state updates via SSE | P0 |
| System status bar (Mode + HSM) | P0 |
| HSM arm/disarm control | P0 |
| Hub mode display and change | P0 |
| Polling fallback mode | P0 |
| Dark / light theme toggle | P0 |
| Responsive layout (phone, tablet, desktop) | P0 |

### Phase 2 — Enhanced Tiles & Layout

| Feature | Priority |
|---|---|
| RGBW colour picker tile | P1 |
| Thermostat control tile | P1 |
| Energy / power meter tile | P1 |
| Lock tile (with PIN) | P1 |
| Door / garage control tile | P1 |
| Variable / flag tile (Connector Switches) | P1 |
| Hub Variable display tile | P1 |
| Drag-and-drop grid editor | P1 |
| Custom tile sizes (1×1 to 4×2) | P1 |
| Multiple saved dashboard layouts | P1 |
| PIN protection for sensitive actions | P1 |
| Tile history (recent events) popup | P1 |
| Room navigation (sidebar + tab modes) | P1 |
| System status panel (all Connector Switches) | P1 |

### Phase 3 — Polish & Advanced

| Feature | Priority |
|---|---|
| Kiosk / full-screen wall-mount mode | P2 |
| Per-tile colour theme overrides | P2 |
| Tile condition-based styling (e.g., red if temp > threshold) | P2 |
| Group tile (control multiple devices at once) | P2 |
| Fan speed tile | P2 |
| Window shade / blind tile | P2 |
| Alarm tile (siren/strobe controls) | P2 |
| Camera snapshot tile | P2 |
| QR code generator for sharing dashboard URLs | P2 |
| Battery level overlay on all tiles | P2 |
| Read-only / display-only mode | P2 |
| Clock tile | P2 |
| Per-user dashboard assignment | P3 |
| Weather tile (Open-Meteo API) | P3 |
| Dashboard activity log / audit trail | P3 |
| Mobile app wrapper (Capacitor) | P3 |

---

## 14. Implementation Phases

### Phase 1: Foundation (Target: working MVP)

**Goal**: Connect to hub, display all devices in a room layout, toggle switches, see live updates.

**Tasks:**
1. Scaffold project (Vite + React/Vue + TypeScript + Tailwind)
2. Scaffold backend (Fastify + TypeScript)
3. Implement Maker API client (all endpoints listed in Section 4.2)
4. Implement config UI: enter hub IP + access token, verify connection
5. Fetch `/devices/all` and `/rooms` on startup; build internal device/room model
6. Implement Switch tile component
7. Implement Dimmer tile component
8. Implement Sensor badge tile (motion, contact, presence)
9. Implement Temperature + Humidity readout tile
10. Implement Room View layout (sidebar + tile grid, auto-assigned from Maker API rooms)
11. Implement SSE webhook receiver on backend; register `postURL` with Maker API
12. Implement SSE client in frontend; wire to tile state updates
13. Implement System Status bar (Mode + HSM display)
14. Implement HSM control (arm/disarm) + Mode selector
15. Implement dark/light theme
16. Implement polling fallback with live/polling indicator
17. Basic responsive layout
18. Docker + docker-compose for deployment

**Deliverable**: A fully functional dashboard accessible from a browser on the LAN.

---

### Phase 2: Layout Editor & Rich Tiles

**Goal**: User can customise layout; all major device types are supported.

**Tasks:**
1. Add react-grid-layout (or equivalent); replace static grid with drag-and-drop
2. Edit mode toggle (lock/unlock icon)
3. Tile placement: "Add Tile" panel with device search
4. Per-tile config panel: label override, template override, size
5. Save/load layouts as JSON (persisted in backend config store)
6. Multiple named dashboards with switcher
7. RGBW Tile (colour picker + CT slider + level + toggle)
8. Thermostat Tile (full control card)
9. Energy/Power Tile
10. Lock Tile + PIN modal
11. Door/Garage Tile
12. Connector Switch / Variable tile
13. Hub Variable tile
14. Tile history popup (calls `/devices/[id]/events`)
15. PIN protection system (session-based, configurable timeout)
16. System Status panel (all Connector Switches from Section 9.1)
17. Room tab/sidebar navigation polish
18. Battery level badge overlay

---

### Phase 3: Polish, Kiosk, Advanced Features

**Goal**: Dashboard is production-quality for permanent wall installation and power users.

**Tasks:**
1. Kiosk mode (full-screen, hide chrome, wake on touch)
2. Per-tile conditional styling rules
3. Group tile (multi-device control)
4. Fan speed tile
5. Window shade/blind tile
6. Alarm control tile (with PIN)
7. Camera snapshot tile
8. QR code dashboard sharing
9. Read-only mode (display-only panel)
10. Clock tile (12/24hr, date format options)
11. Accessibility audit (ARIA, keyboard navigation, contrast)
12. Performance audit (tile render budget < 16ms)
13. Playwright E2E test suite (mocked Maker API)
14. Comprehensive README and setup guide

---

## 15. Configuration & Settings Model

### 15.1 Hub Connection Config

```json
{
  "hub": {
    "localIP": "192.168.1.x",
    "makerApiPort": 80,
    "makerApiAppId": "123",
    "accessToken": "[STORED SERVER-SIDE ONLY]",
    "cloudEnabled": false,
    "webhookReceiverURL": "http://[dashboard-host]:3000/webhook"
  }
}
```

### 15.2 Dashboard Layout Config

```json
{
  "dashboards": [
    {
      "id": "main",
      "name": "Main Panel",
      "theme": "dark",
      "gridColumns": 8,
      "tiles": [
        {
          "id": "tile-1",
          "deviceId": "115",
          "template": "dimmer",
          "label": "Bedroom Light",
          "x": 0, "y": 0, "w": 2, "h": 1,
          "options": { "showLevel": true }
        }
      ]
    }
  ]
}
```

### 15.3 System Config

```json
{
  "system": {
    "pinEnabled": true,
    "pinCode": "[HASHED]",
    "pinSessionMinutes": 5,
    "pinRequiredFor": ["hsm", "lock", "alarm", "mode"],
    "pollingIntervalSeconds": 30,
    "staleDataThresholdMinutes": 5,
    "temperatureUnit": "F",
    "clockFormat": "12h",
    "dateFormat": "MM/DD/YYYY"
  }
}
```

### 15.4 Connector Switch Visibility Config

```json
{
  "systemSwitches": {
    "statusBarSwitches": ["AlarmsEnabled", "Silent", "Traveling", "HighAlert"],
    "systemPanelSwitches": [
      "AlarmsEnabled", "AudibleAlarmsOn", "Silent", "HighAlert",
      "Traveling", "OnPTO", "Holiday", "SummerTime",
      "PauseDRDoorAlarm", "PauseBDAlarm", "IndoorCamsSwitch"
    ]
  }
}
```

---

## 16. Key Design Decisions & Rationale

### 16.1 Why a Thin Backend?

The Maker API access token is equivalent to a password. Embedding it in browser JavaScript (even obfuscated) would allow anyone on the network to extract it from DevTools. A backend proxy:
- Keeps the token secure
- Centralises webhook reception
- Enables server-side config persistence without a database
- Allows a future auth layer to be added without changing the frontend

### 16.2 Why SSE Instead of WebSocket for Browser Push?

- SSE is simpler to implement and more reliable over HTTP/1.1 proxies
- Automatic reconnection is built into the browser's EventSource API
- The Maker API webhook delivers events via HTTP POST — a backend SSE broadcast is the natural bridge
- WebSocket adds complexity without benefit for this unidirectional (hub → dashboard) event flow

### 16.3 Why Not Use Hubitat's Built-In Dashboard API Directly?

The built-in dashboard uses a private, undocumented WebSocket protocol tied to the dashboard app. It is not publicly supported for third-party use and could break on hub firmware updates. **Maker API is the documented, stable integration point.**

### 16.4 Why Auto-Layout by Room?

The HubitatWork device table shows 18 rooms with 140 devices. Starting with room-based auto-layout means the dashboard is immediately useful with zero configuration. Users can then customise from that sensible baseline.

### 16.5 Why Connector Switches Need Special Treatment?

42 of 140 devices (30%) are Connector Switches — they are not physical devices but system state flags and cross-app communication triggers. A naive tile grid would show them mixed with physical devices, creating confusion. They should be:
- Surfaced in a dedicated System Status panel
- Optionally pinnable to the status bar
- Visually distinct from physical device tiles (pill badge vs switch card)

### 16.6 Optimistic UI for Switches

Waiting for the Maker API round-trip (~100–300ms) and then a webhook event (~50–200ms) before showing the new state would make the dashboard feel sluggish. Optimistic updates (immediately show new state, revert on error) are standard practice in home automation dashboards and dramatically improve perceived performance.

### 16.7 PIN Implementation

A time-limited session PIN (not per-action) balances security and usability. A 5-minute session means the user enters the PIN once for a series of security changes, not repeatedly for each tap.

---

## Appendix A — Hubitat Capability Quick Reference (Dashboard-Relevant Subset)

| Capability | Attribute | Values | Dashboard Relevance |
|---|---|---|---|
| Switch | switch | on / off | Primary control for all switchable devices |
| SwitchLevel | level | 0–100 % | Dimming |
| ColorControl | hue, saturation, RGB | various | RGBW bulb control |
| ColorTemperature | colorTemperature | °K | White bulb warmth |
| MotionSensor | motion | active / inactive | Security, automation status |
| ContactSensor | contact | open / closed | Doors, windows, freezer |
| TemperatureMeasurement | temperature | °F / °C | Climate monitoring |
| RelativeHumidityMeasurement | humidity | %rh | Climate monitoring |
| Lock | lock | locked / unlocked | Security |
| Thermostat | thermostatMode, temperature, heatingSetpoint, coolingSetpoint | various | Climate control |
| EnergyMeter | energy | kWh | Power monitoring |
| PowerMeter | power | W | Power monitoring |
| Battery | battery | 0–100 % | Device health |
| PresenceSensor | presence | present / not present | Occupancy |
| WaterSensor | water | wet / dry | Leak detection |
| SmokeDetector | smoke | clear / detected | Safety |
| Alarm | alarm | off / siren / strobe / both | Emergency |
| DoorControl | door | open / closed / opening / closing | Garage / entry |
| WindowShade | position, windowShade | % / various | Automation |
| FanControl | speed | off / low / medium / high / auto | Climate |
| LocationMode | mode | (hub-defined names) | Mode tile |
| Variable | variable | string | Connector switches, hub vars |

---

## Appendix B — Reference Links

| Resource | URL |
|---|---|
| Official Maker API docs | https://docs2.hubitat.com/en/apps/maker-api |
| Official Dashboard docs | https://docs2.hubitat.com/en/apps/hubitat-dashboard |
| Hubitat Capability List | https://docs2.hubitat.com/en/developer/driver/capability-list |
| HSM Interface Reference | https://docs2.hubitat.com/en/developer/interfaces/hubitat-safety-monitor-interface |
| SharpTools (reference) | https://sharptools.io/ |
| Community CSS tips | https://community.hubitat.com/t/pantry-css-tips-and-tricks-for-dashboards/20128 |
| Community Dashboard Tile Map | https://community.hubitat.com/t/dashboard-tile-map/111 |
| HubitatWork Repo | C:\Projects\gitrepos\HubitatWork\ |
| Local API Reference | C:\Projects\gitrepos\HubitatWork\Docs\04-API-Reference\Maker-API.md |
| Local Capability Reference | C:\Projects\gitrepos\HubitatWork\Docs\05-Capabilities\Capability-Quick-Reference.md |
| Local Device Table | C:\Projects\gitrepos\HubitatWork\wiki-export\Docs-devices-table.md |
| Local Hub Variables Reference | C:\Projects\gitrepos\HubitatWork\wiki-export\Docs-Hub-Variables-Reference.md |

---

*Document synthesised from: HubitatWork project source + wiki export, Hubitat official documentation (docs2.hubitat.com), community dashboard references (SharpTools, HD+, ActionTiles, Community CSS guide), and the Hubitat Maker API specification.*

*Last updated: April 2026*
