# Memory - orchestrator

_Decisions, constraints, and context worth keeping between sessions._

## Phase 1 Complete — Task Creation Summary

**Project:** android (Hubitat Dashboard Android App)
**agentsPath:** C:\Projects\gitrepos\HubitatDashboard\android-agents
**projectPath:** C:\Projects\gitrepos\HubitatDashboard\android

### Tasks created (15 total)

| ID | Title | Owner | Depends On |
|---|---|---|---|
| 17001 | Scaffold Android project (Gradle, Hilt, Manifest) | architect | [] |
| 17002 | Implement Kotlin data models | api-dev | [17001] |
| 17003 | Implement ConnectionResolver and SettingsRepository | api-dev | [17002] |
| 17004 | Implement HubitatApiService and SseClient | api-dev | [17003] |
| 17005 | Implement DeviceRepository and PinRepository | api-dev | [17004] |
| 17006 | Implement SettingsScreen and SettingsViewModel | frontend-dev | [17001] |
| 17007 | Implement app shell, navigation, and DeviceViewModel | frontend-dev | [17005, 17006] |
| 17008 | Implement SystemStatusRow | frontend-dev | [17007] |
| 17009 | Implement GroupScreen and groups.kt config | frontend-dev | [17007] |
| 17010 | Implement SwitchTile, ConnectorTile, and DimmerTile | frontend-dev | [17009] |
| 17011 | Implement RGBWTile with colour picker | frontend-dev | [17009] |
| 17012 | Implement sensor tiles | frontend-dev | [17009] |
| 17013 | Implement control tiles and PinDialog | frontend-dev | [17009] |
| 17014 | Implement polish | frontend-dev | [17008, 17010, 17011, 17012, 17013] |
| 17015 | Write QA test plan and validation checklist | qa-tester | [17014] |

### RDs written (15)
All RDs in `team/orchestrator/rds/`:
rd-android-scaffold.md, rd-android-data-models.md, rd-android-connection-resolver.md,
rd-android-api-service.md, rd-android-repositories.md, rd-android-settings.md,
rd-android-shell.md, rd-android-system-status.md, rd-android-group-screen.md,
rd-android-tiles-basic.md, rd-android-tile-rgbw.md, rd-android-tiles-sensor.md,
rd-android-tiles-control.md, rd-android-polish.md, rd-android-qa.md

### Key constraints
- App is fully self-contained — talks directly to Hubitat Maker API (no Node.js backend)
- android:usesCleartextTraffic="true" required for plain HTTP to local hub
- Package: com.timshubet.hubitatdashboard, minSdk 26, targetSdk 35
- PIN stored as bcrypt hash (jBCrypt/at.favre.lib:bcrypt) in EncryptedSharedPreferences
- ConnectionResolver: AUTO mode probes local with 2s timeout, falls back to cloud
- 14 groups from frontend/src/config/groups.ts must be ported exactly
- 15 tile types all required
- Sideload only (no Play Store)

Pre-dev research complete — all agents notified — 2026-04-16

17014 Polish complete

## Task 17015 — QA Review Complete

**Date:** 2025-07-16  
**Result:** READY FOR BUILD (with fixes applied)  

### Bugs Fixed
1. `TileCard.kt` — SWITCH and CONNECTOR had `Text()` placeholders → replaced with `SwitchTile` / `ConnectorTile`
2. `TileCard.kt` — DIMMER had `Text()` placeholder → replaced with `DimmerTile`
3. `GroupScreen.kt` — `hsmStatus`, `modes`, `onSetHsmMode`, `onSetMode`, `onSetVariable` were NOT passed to `TileCard` → fixed; HSM and MODE tiles would have been silent no-ops

### All 52 files present, all 16 tile types wired, all 7 critical logic checks pass

### Remaining manual action needed
- Run `./gradlew assembleDebug` — JDK not available on QA machine so compile was not verified
- Confirm `groups.kt` device 1225 ("Greenhouse Motion") using `TileType.TEMPERATURE` is intentional
