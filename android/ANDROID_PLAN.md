# Hubitat Android Dashboard — Implementation Plan

## Problem Statement
Build a native Android phone app that replicates all functional capability of the existing web-based HubitatDashboard (React + Fastify), using Android best-practice technology and a touch-first phone UI. The app is fully self-contained — it talks directly to the Hubitat Maker API and does not require the Node.js backend to be running.

---

## Recommended Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | **Kotlin** | Google's official Android language; null-safe, concise |
| UI | **Jetpack Compose + Material Design 3** | Google's modern declarative UI; Material You components are best practice for phone UIs |
| Architecture | **MVVM + ViewModel + StateFlow** | Google Architecture Guidelines; lifecycle-safe state |
| DI | **Hilt** | Google's recommended DI for Android; less boilerplate than manual DI |
| Networking | **Retrofit + OkHttp** | Industry standard Android HTTP; OkHttp handles SSE streaming direct to hub |
| Navigation | **Navigation Compose** | Official Compose navigation library |
| Local storage | **EncryptedSharedPreferences + DataStore** | Access token secured by Android Keystore; config in DataStore |
| Real-time | **OkHttp SSE (EventSource)** | Direct to Hubitat Maker API `/sse` endpoint |
| Color picker | Custom HSB Composable (or `godaddy/color-picker-android`) | For RGBW tile color selection |
| Security | **jBCrypt + Android Keystore** | PIN hashed locally; token stored in EncryptedSharedPreferences |
| Min SDK | **26 (Android 8.0)** | Covers 95%+ of active devices |

---

## Architecture Overview

```
android/app/src/main/java/com/timshubet/hubitatdashboard/
├── ui/
│   ├── settings/        ← First-launch config screen
│   ├── shell/           ← App shell: TopBar + BottomNav + NavHost
│   ├── group/           ← GroupScreen (scrollable tile grid per group)
│   └── tiles/           ← 15 Composable tile types
├── viewmodel/
│   ├── DeviceViewModel  ← SSE state, device commands
│   └── SettingsViewModel
├── data/
│   ├── api/             ← Retrofit service + OkHttp SSE client
│   ├── model/           ← Kotlin data classes mirroring web types.ts
│   └── repository/      ← Single source of truth + ConnectionResolver
└── di/                  ← Hilt modules
```

---

## Sideload Distribution (No Play Store)

The app is built as a standalone APK for direct installation. No Google Play account or store review is needed.

### Build outputs
- **Debug APK** — `./gradlew assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`
  Quick build; signed with a debug key; installs fine via sideload.
- **Release APK** — `./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk`
  Signed with a local keystore (generated once, stored outside the repo).

### Install method
1. Copy APK to phone (USB, local network share, or `adb install app-debug.apk`)
2. On the phone: **Settings → Apps → Special app access → Install unknown apps** → allow your file manager or ADB
3. Tap the APK file to install

### Gradle / build config notes
- `applicationId = "com.timshubet.hubitatdashboard"`
- Permissions: `INTERNET`, `ACCESS_NETWORK_STATE`
- `minSdk 26`, `targetSdk 35`
- `android:usesCleartextTraffic="true"` in manifest (required for plain HTTP to local hub)

---

## Direct Hubitat Maker API

The Android app is **fully self-contained**. All calls go directly to the Hubitat Maker API over local WiFi or via the Hubitat cloud — no intermediate server required.

### Endpoints used

| Purpose | Endpoint |
|---|---|
| All devices | `GET /apps/api/{appId}/devices/all?access_token={token}` |
| Single device | `GET /apps/api/{appId}/devices/{id}?access_token={token}` |
| Send command | `GET /apps/api/{appId}/devices/{id}/{command}[/{value}]?access_token={token}` |
| HSM status | `GET /apps/api/{appId}/hsm?access_token={token}` |
| Arm/disarm | `GET /apps/api/{appId}/hsm/{mode}?access_token={token}` |
| All modes | `GET /apps/api/{appId}/modes?access_token={token}` |
| Set mode | `GET /apps/api/{appId}/modes/{id}?access_token={token}` |
| Hub variables | `GET /apps/api/{appId}/hubvariables?access_token={token}` |
| Set variable | `POST /apps/api/{appId}/hubvariables/{name}?access_token={token}` (body: `{value}`) |
| Real-time SSE | `GET /apps/api/{appId}/sse?access_token={token}` |

---

## Dual Connection (Local + Cloud)

### Config stored in EncryptedSharedPreferences / DataStore
- `localHubIp` — Hub local IP (e.g. `192.168.1.42`)
- `cloudHubUrl` — Hubitat cloud URL (e.g. `https://cloud.hubitat.com/api/{hubId}/apps/{appId}`)
- `makerAppId` — Maker API app ID (used to build local URL)
- `makerToken` — Access token (stored encrypted)
- `connectionMode` — `local` | `cloud` | `auto` (default: `auto`)
- `pinHash` — bcrypt hash of the user's 4-digit PIN

### Connection Mode
| Mode | Behaviour |
|---|---|
| **Local** | Always use hub local IP (home WiFi only) |
| **Cloud** | Always use Hubitat cloud URL (works from anywhere) |
| **Auto** *(recommended default)* | Try local first with a 2 s timeout; silently fall back to cloud on failure. Re-checks local on each app resume or network-change event. |

`ConnectionResolver` sits in the repository layer — everything above it receives a resolved base URL and is unaware of which path was chosen. The System Status Row shows a **Local** or **Cloud** badge so the user always knows the active path.

### PIN Security
- User sets 4-digit PIN on first launch (or in Settings)
- PIN stored as a bcrypt hash via `jBCrypt` in EncryptedSharedPreferences
- Protected actions (HSM arm/disarm, mode change, lock) prompt a PIN Dialog and compare locally — no network round-trip needed

---

## UI Design (Phone-First)

- **Bottom Navigation Bar** — top 5 most-used groups as icon tabs; remaining groups in a Navigation Drawer ("More")
- **System Status Row** — pinned below TopBar: HSM badge, Mode badge, Local/Cloud connection badge, scrollable Connector switch chips
- **Tile Grid** — 2-column `LazyVerticalGrid` of Material 3 Cards; each card shows icon, label, current state
- **Dark / Light Theme** — follows system setting automatically; manual override stored in DataStore
- **Pull-to-refresh** — forces full device list re-fetch on any group screen
- **PIN Dialog** — Material 3 AlertDialog with 4-digit numeric input
- **Snackbar** — command success / error feedback

---

## Device Groups (14 groups, mirrors `frontend/src/config/groups.ts`)

`environment` · `security-alarm` · `night-security` · `lights` · `doors-windows` · `presence-motion` · `perimeter` · `emergency` · `cameras` · `ring-detections` · `seasonal` · `hub-mode` · `power-monitor` · `system`

Bottom Nav shows the 5 most commonly used; Navigation Drawer lists all 14.
Custom groups can be added via a bottom sheet (mirrors web `CreateGroupModal`).

---

## Tile Types (all 15)

| Tile | Interaction | Protected |
|---|---|---|
| switch | Toggle on/off | — |
| dimmer | Toggle + level slider (0–100) | — |
| rgbw | Toggle + brightness + colour picker | — |
| contact | Open/Closed badge | Read-only |
| motion | Active/Inactive badge | Read-only |
| temperature | °F / °C readout | Read-only |
| power-meter | Watts / kWh readout | Read-only |
| button | Tap to push | — |
| lock | Lock / Unlock | PIN |
| connector | Toggle on/off (state flag) | — |
| hub-variable | Display + inline edit | — |
| hsm | Arm Away / Home / Night / Disarm | PIN |
| mode | Select active hub mode | PIN |
| ring-detection | Last-ring timestamp + motion badge | Read-only |
| presence | Present / Not-Present badge | Read-only |
| battery | Percentage + level icon | Read-only |

---

## Implementation Phases

### Phase 1 — Project Scaffold
- Create Android project in `android/` subfolder: package `com.timshubet.hubitatdashboard`
- Add Gradle dependencies: Compose BOM, Material 3, Hilt, Retrofit, OkHttp, Navigation Compose, DataStore, EncryptedSharedPreferences, jBCrypt, Coil (icons)
- Set up Hilt `@HiltAndroidApp` application class
- Configure `AndroidManifest.xml`: `INTERNET`, `ACCESS_NETWORK_STATE`, `usesCleartextTraffic`

### Phase 2 — Settings & Config
- `SettingsScreen` Composable: Local Hub IP, Cloud Hub URL, Access Token (masked), Connection Mode selector (Local / Cloud / Auto), PIN setup
- `SettingsViewModel` backed by EncryptedSharedPreferences + DataStore
- Onboarding flow: redirect to Settings on first launch if no hub URL is saved
- "Test Connection" button that exercises whichever mode is selected

### Phase 3 — Data Layer
- Kotlin data models: `DeviceState`, `TileConfig`, `GroupConfig`, `SSEEvent`, `ConnectionType`
- `ConnectionResolver`: resolves base URL per mode; Auto path probes local with 2 s timeout then falls back to cloud; exposes `activeConnection: StateFlow<ConnectionType>`
- `HubitatApiService` (Retrofit): URL injected by `ConnectionResolver`
- `SseClient` (OkHttp `EventSource`): connects via `ConnectionResolver`; exponential backoff reconnect
- `DeviceRepository`: merges initial REST fetch + live SSE deltas into `StateFlow<Map<String, DeviceState>>`
- `PinRepository`: stores and compares bcrypt hash locally

### Phase 4 — App Shell & Navigation
- `MainScreen`: Compose `Scaffold` with `TopAppBar`, `BottomNavigationBar`, `ModalNavigationDrawer`
- `SystemStatusRow`: HSM chip, Mode chip, Local/Cloud connection chip, scrollable Connector chips
- `NavHost` routing to each group by ID
- `DeviceViewModel`: manages device state map, SSE lifecycle, command dispatch

### Phase 5 — Group Screen & Tiles
- `GroupScreen(groupId)`: `LazyVerticalGrid` of tile cards sourced from `groups.kt` (port of `groups.ts`)
- Implement all 15 tile `@Composable` functions in `ui/tiles/`
- `PinDialog`: reusable 4-digit entry dialog
- `CreateGroupBottomSheet`: add custom group with name and icon

### Phase 6 — Real-Time & Commands
- SSE connection started in `DeviceViewModel.init`; reconnects on error with backoff
- `sendCommand()`: fires Retrofit PUT; applies optimistic local state update immediately; rolls back on error
- Snackbar notifications for command results

### Phase 7 — Polish & Delivery
- Auto dark/light theme; manual toggle persisted in DataStore
- Group reordering via drag handle in Navigation Drawer
- "No connection" warning banner when SSE has been down > 30 s
- Custom launcher icon
- Build signed release APK: `./gradlew assembleRelease`
- Document keystore setup and sideload install steps in `android/README.md`

---

## Project File Layout (after Phase 1)

```
android/
├── ANDROID_PLAN.md          ← this file
├── README.md                ← sideload install + build instructions
├── app/
│   ├── build.gradle.kts
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/timshubet/hubitatdashboard/
│   │       ├── HubitatApp.kt          (Hilt app)
│   │       ├── MainActivity.kt
│   │       ├── ui/
│   │       ├── viewmodel/
│   │       ├── data/
│   │       └── di/
│   └── src/main/res/
├── build.gradle.kts
└── settings.gradle.kts
```
