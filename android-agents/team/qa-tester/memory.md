# Memory - qa-tester

_Decisions, constraints, and context worth keeping between sessions._

## Task 17015 — QA Review (2025-07-16)

### Bugs Found & Fixed
1. `ui/group/TileCard.kt` — `TileType.SWITCH` and `TileType.CONNECTOR` both had `Text(tile.label)` placeholder
2. `ui/group/TileCard.kt` — `TileType.DIMMER` had `Text(tile.label)` placeholder  
3. `ui/group/GroupScreen.kt` — `hsmStatus`, `modes`, `onSetHsmMode`, `onSetMode`, `onSetVariable` not passed to `TileCard`; HSM/MODE tiles would have been broken

### Critical Logic — All Pass
- ConnectionResolver: HEAD probe, 2s timeout, cloud fallback ✅
- SseClient: manual `readUtf8Line()` loop (no okhttp-sse) ✅
- DeviceRepository: dynamic Retrofit base URL ✅
- PinRepository: BCrypt hash only, no raw PIN stored ✅
- Manifest: usesCleartextTraffic="true" ✅
- SettingsRepository: getDarkMode/setDarkMode ✅
- GroupScreen: empty-state + all tile params wired (after fix) ✅

### QA Report Location
`C:\Projects\gitrepos\HubitatDashboard\android-agents\team\qa-tester\output\qa-report-android.md`

### Note
Build environment (JDK) not available on QA machine — `./gradlew assembleDebug` must be run manually before release.
