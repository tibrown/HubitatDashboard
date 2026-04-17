# Android Dashboard QA Report

**Date:** 2025-07-16  
**Reviewer:** qa-tester (task 17015)  
**Project:** C:\Projects\gitrepos\HubitatDashboard\android

---

## Summary

**Overall: PASS with fixes applied**  
- All 52 required files are present  
- 3 `Text()` placeholder bugs found and fixed in `TileCard.kt`  
- 1 critical wiring bug found and fixed in `GroupScreen.kt` (hsmStatus/modes not passed to TileCard)  
- All 7 critical logic checks pass  
- Build environment (JDK) not available on this machine — compile verification skipped  

---

## Files Verified

### Data Layer
| File | Status |
|------|--------|
| `data/model/DeviceState.kt` | ✅ Present |
| `data/model/TileType.kt` | ✅ Present — 16 values confirmed |
| `data/model/TileConfig.kt` | ✅ Present |
| `data/model/GroupConfig.kt` | ✅ Present |
| `data/model/groups.kt` | ✅ Present — 14 groups confirmed |
| `data/model/HsmMode.kt` | ✅ Present |
| `data/model/HubMode.kt` | ✅ Present |
| `data/model/HubVariable.kt` | ✅ Present |
| `data/model/ConnectionMode.kt` | ✅ Present |
| `data/model/ConnectionStatus.kt` | ✅ Present |
| `data/model/SSEEvent.kt` | ✅ Present (bonus — required by SseClient) |
| `data/model/ConnectionType.kt` | ✅ Present (bonus — required by ConnectionResolver) |
| `data/repository/SettingsRepository.kt` | ✅ Present — `getDarkMode()`/`setDarkMode()` confirmed |
| `data/repository/ConnectionResolver.kt` | ✅ Present |
| `data/repository/DeviceRepository.kt` | ✅ Present |
| `data/repository/PinRepository.kt` | ✅ Present |
| `data/api/HubitatApiService.kt` | ✅ Present |
| `data/api/SseClient.kt` | ✅ Present |

### DI
| File | Status |
|------|--------|
| `di/NetworkModule.kt` | ✅ Present |
| `di/ApiModule.kt` | ✅ Present |
| `di/RepositoryModule.kt` | ✅ Present |

### ViewModels
| File | Status |
|------|--------|
| `viewmodel/DeviceViewModel.kt` | ✅ Present |
| `viewmodel/SettingsViewModel.kt` | ✅ Present |

### UI Shell
| File | Status |
|------|--------|
| `ui/shell/MainScreen.kt` | ✅ Present |
| `ui/shell/NavGraph.kt` | ✅ Present |
| `ui/shell/HubitatTopBar.kt` | ✅ Present |
| `ui/shell/GroupBottomNav.kt` | ✅ Present |
| `ui/shell/GroupDrawer.kt` | ✅ Present |
| `ui/shell/SystemStatusRow.kt` | ✅ Present |

### UI Group
| File | Status |
|------|--------|
| `ui/group/GroupScreen.kt` | ✅ Present |
| `ui/group/TileCard.kt` | ✅ Present |

### UI Tiles (17 files)
| File | Status |
|------|--------|
| `ui/tiles/SwitchTile.kt` | ✅ Present |
| `ui/tiles/ConnectorTile.kt` | ✅ Present |
| `ui/tiles/DimmerTile.kt` | ✅ Present |
| `ui/tiles/RGBWTile.kt` | ✅ Present |
| `ui/tiles/ContactTile.kt` | ✅ Present |
| `ui/tiles/MotionTile.kt` | ✅ Present |
| `ui/tiles/TemperatureTile.kt` | ✅ Present |
| `ui/tiles/PowerMeterTile.kt` | ✅ Present |
| `ui/tiles/PresenceTile.kt` | ✅ Present |
| `ui/tiles/BatteryTile.kt` | ✅ Present |
| `ui/tiles/RingDetectionTile.kt` | ✅ Present |
| `ui/tiles/PinDialog.kt` | ✅ Present |
| `ui/tiles/ButtonTile.kt` | ✅ Present |
| `ui/tiles/LockTile.kt` | ✅ Present |
| `ui/tiles/HubVariableTile.kt` | ✅ Present |
| `ui/tiles/HsmTile.kt` | ✅ Present |
| `ui/tiles/ModeTile.kt` | ✅ Present |

### Settings
| File | Status |
|------|--------|
| `ui/settings/SettingsScreen.kt` | ✅ Present |
| `ui/settings/SettingsUiState.kt` | ✅ Present |

### Theme
| File | Status |
|------|--------|
| `ui/theme/Theme.kt` | ✅ Present |

### App Entry
| File | Status |
|------|--------|
| `HubitatApp.kt` | ✅ Present — `@HiltAndroidApp` confirmed |
| `MainActivity.kt` | ✅ Present — reads `getDarkMode()`, applies to `HubitatDashboardTheme` |
| `AndroidManifest.xml` | ✅ Present |

### Build Files
| File | Status |
|------|--------|
| `app/build.gradle.kts` | ✅ Present |
| `build.gradle.kts` | ✅ Present |
| `settings.gradle.kts` | ✅ Present |
| `gradle/libs.versions.toml` | ✅ Present |

### Docs
| File | Status |
|------|--------|
| `README.md` | ✅ Present |

---

## TileCard Coverage

All 16 `TileType` values are wired in the `when` block after fixes. No `Text()` placeholders remain.

| TileType | Status | Composable |
|----------|--------|------------|
| `SWITCH` | ✅ Wired (fixed) | `SwitchTile(tile, device, onCommand)` |
| `CONNECTOR` | ✅ Wired (fixed) | `ConnectorTile(tile, device, onCommand)` |
| `DIMMER` | ✅ Wired (fixed) | `DimmerTile(tile, device, onCommand)` |
| `RGBW` | ✅ Wired | `RGBWTile(tile, device, onCommand)` |
| `CONTACT` | ✅ Wired | `ContactTile(tile, device)` |
| `MOTION` | ✅ Wired | `MotionTile(tile, device)` |
| `TEMPERATURE` | ✅ Wired | `TemperatureTile(tile, device)` |
| `POWER_METER` | ✅ Wired | `PowerMeterTile(tile, device, onCommand)` |
| `BUTTON` | ✅ Wired | `ButtonTile(tile, device, onCommand)` |
| `LOCK` | ✅ Wired | `LockTile(tile, device, onCommand)` |
| `HUB_VARIABLE` | ✅ Wired | `HubVariableTile(tile, hubVariables, onSetVariable)` |
| `HSM` | ✅ Wired | `HsmTile(tile, hsmStatus, onSetHsmMode)` |
| `MODE` | ✅ Wired | `ModeTile(tile, modes, onSetMode)` |
| `RING_DETECTION` | ✅ Wired | `RingDetectionTile(tile, device, hubVariables)` |
| `PRESENCE` | ✅ Wired | `PresenceTile(tile, device)` |
| `BATTERY` | ✅ Wired | `BatteryTile(tile, device)` |

---

## Critical Logic Checks

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | **ConnectionResolver.kt** — AUTO mode HEAD probe with 2s timeout, falls back to cloud | ✅ PASS | `OkHttpClient` rebuilt with `connectTimeout(2, SECONDS)` + `readTimeout(2, SECONDS)`; `.head().build()` used; fall-through sets `ConnectionType.CLOUD` |
| 2 | **SseClient.kt** — uses manual `readUtf8Line()` loop (not `okhttp-sse`) | ✅ PASS | `source.readUtf8Line()` loop on `response.body?.source()`; no SSE library import |
| 3 | **DeviceRepository.kt** — dynamic Retrofit base URL (not hardcoded) | ✅ PASS | `resolvedService()` calls `connectionResolver.resolveBaseUrl()` and rebuilds Retrofit for every call |
| 4 | **PinRepository.kt** — PIN stored as bcrypt hash only | ✅ PASS | `BCrypt.withDefaults().hashToString(12, ...)` stored via `settingsRepository.setPinHash(hash)`; raw PIN never persisted |
| 5 | **AndroidManifest.xml** — `usesCleartextTraffic="true"` present | ✅ PASS | Line 15: `android:usesCleartextTraffic="true"` |
| 6 | **SettingsRepository.kt** — `getDarkMode()`/`setDarkMode()` exist | ✅ PASS | Lines 40–41: thin wrappers over `themeOverride`/`setThemeOverride` |
| 7 | **GroupScreen.kt** — empty-state present, hubVariables/hsmStatus/modes passed to TileCard | ✅ PASS (after fix) | Empty-state was present; hsmStatus and modes were missing — **fixed** |

---

## Issues Found & Fixed

### Fix 1 — `TileCard.kt`: SWITCH and CONNECTOR had `Text()` placeholders
**File:** `ui/group/TileCard.kt`  
**Before:**
```kotlin
TileType.SWITCH, TileType.CONNECTOR -> Text(tile.label)
```
**After:**
```kotlin
TileType.SWITCH -> SwitchTile(tile, device, onCommand)
TileType.CONNECTOR -> ConnectorTile(tile, device, onCommand)
```
Also added missing `ConnectorTile`, `DimmerTile`, `SwitchTile` imports and removed unused `Text` import.

### Fix 2 — `TileCard.kt`: DIMMER had `Text()` placeholder
**File:** `ui/group/TileCard.kt`  
**Before:**
```kotlin
TileType.DIMMER -> Text(tile.label)
```
**After:**
```kotlin
TileType.DIMMER -> DimmerTile(tile, device, onCommand)
```

### Fix 3 — `GroupScreen.kt`: hsmStatus, modes, onSetHsmMode, onSetMode, onSetVariable not passed to TileCard
**File:** `ui/group/GroupScreen.kt`  
**Problem:** HSM and MODE tiles would silently fall back to default empty lambdas. PIN-protected operations (setHsmMode, setMode) would be no-ops.  
**Fix:** Added `collectAsState()` for `viewModel.hsmStatus` and `viewModel.modes`, and passed all five missing parameters to `TileCard(...)`.

---

## Issues Found & NOT Fixed (manual action needed)

### Warning 1 — Build environment not available
JDK was not found in `$PATH` or `$JAVA_HOME` on the QA machine. The `./gradlew assembleDebug` build could not be executed. A human developer must run:
```
./gradlew assembleDebug
```
and confirm it produces a `.apk` with 0 errors before submission.

### Minor Note — `groups.kt` line 15: suspect tile type
`TileConfig(deviceId = "1225", label = "Greenhouse Motion", tileType = TileType.TEMPERATURE)` — this device is named "Motion" but uses `TEMPERATURE` type. Likely a copy-paste oversight in the data. Not a code bug — the data is live device configuration — but worth confirming with the developer.

---

## Verdict

**✅ READY FOR BUILD**

All files present, all 16 tile types correctly wired, all 7 critical logic checks pass.  
Three placeholder bugs and one wiring bug were found and fixed.  
Only remaining action: a human developer should run `./gradlew assembleDebug` to confirm the Kotlin compiler accepts all changes.
