# Memory - frontend-dev

_Decisions, constraints, and context worth keeping between sessions._

---

## Research Delivered: Jetpack Compose + Material 3 — 2026-04-16

**Report:** team/research/output/predev-jetpack-compose-material3-2026-04-16.md
**For tasks:** 17006, 17007, 17008, 17009, 17010, 17011, 17012, 17013, 17014
**Summary:** Use Compose BOM `2026.03.00` which gives `material3:1.4.0`. All M3 components needed for this project are stable. `SegmentedButton` (SingleChoiceSegmentedButtonRow) is stable in this BOM.
**Key finding:** `PullRefreshIndicator` from Accompanist is deprecated — use `PullToRefreshContainer` from material3 (stable in 1.3.0+, included in BOM 2026.03.00). HSB color wheel for RGBWTile requires a custom Canvas composable with `SweepGradient` + `RadialGradient`. Always apply `innerPadding` from `Scaffold` to your content composable.
**Action:**
```kotlin
// app/build.gradle.kts — BOM and all M3 artifacts:
val composeBom = platform("androidx.compose:compose-bom:2026.03.00")
implementation(composeBom)
implementation("androidx.compose.material3:material3")
implementation("androidx.compose.material:material-icons-extended")  // capped at 1.7.8, no version needed
implementation("androidx.compose.ui:ui")
implementation("androidx.compose.foundation:foundation")
debugImplementation("androidx.compose.ui:ui-tooling")
```

---

## Research Delivered: Navigation Compose — 2026-04-16

**Report:** team/research/output/predev-navigation-compose-2026-04-16.md
**For tasks:** 17007
**Summary:** Use `navigation-compose:2.9.7`. Create `NavController` with `rememberNavController()` at the app root. Use `composable("route/{arg}")` for destinations with path params.
**Key finding:** For `NavigationBar` selected state, use `navController.currentBackStackEntryAsState().value?.destination?.route`. Always pass navigate lambdas (not `NavController` itself) to leaf composables. Close `ModalNavigationDrawer` before navigating by calling `drawerState.close()` in a coroutine. To redirect to Settings on first launch, set `startDestination` dynamically based on `SettingsViewModel.hasHubConfigured`.
**Action:**
```kotlin
// app/build.gradle.kts:
implementation("androidx.navigation:navigation-compose:2.9.7")

// Back-stack popUpTo pattern for bottom nav tabs:
navController.navigate(item.route) {
    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
    launchSingleTop = true
    restoreState = true
}
```

---

## Research Delivered: DataStore + EncryptedSharedPreferences — 2026-04-16

**Report:** team/research/output/predev-datastore-encryptedprefs-2026-04-16.md
**For tasks:** 17006, 17014
**Summary:** Dark/light theme override is stored in DataStore as `booleanPreferencesKey("dark_theme")`. Read as `Flow<Boolean>`, observe in ViewModel as `StateFlow`, apply in `MaterialTheme`.
**Key finding:** Use `SharingStarted.WhileSubscribed(5_000)` when converting DataStore flows to `StateFlow` in ViewModels — this cancels collection 5s after the last subscriber disappears, preventing leaks. The UI theme state pattern is: `DataStore Flow → .stateIn(viewModelScope) → collectAsStateWithLifecycle() → MaterialTheme colorScheme`.
**Action:**
```kotlin
// app/build.gradle.kts:
implementation("androidx.datastore:datastore-preferences:1.2.1")

// Theme observation in SettingsViewModel:
val darkTheme: StateFlow<Boolean> = settingsRepository.darkTheme
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), false)

// Apply in Compose:
val isDark by settingsViewModel.darkTheme.collectAsStateWithLifecycle()
MaterialTheme(colorScheme = if (isDark) darkColorScheme() else lightColorScheme()) { ... }
```

---

## Task 17007 Completed — 2026-04-16

**Files created:**
- `viewmodel/DeviceViewModel.kt` — `@HiltViewModel` with 6 StateFlows (`devices`, `hsmStatus`, `modes`, `hubVariables`, `connectionStatus`, `activeConnection`) + `snackbarMessage` SharedFlow + 5 command methods
- `ui/shell/NavGraph.kt` — `NavRoutes` object with `SETTINGS`, `GROUP_PATTERN`, `DEFAULT_GROUP`, and `group()` helper
- `ui/shell/HubitatTopBar.kt` — Material 3 `TopAppBar` with theme toggle (sun/moon) and settings gear
- `ui/shell/GroupBottomNav.kt` — `NavigationBar` with 5 fixed tabs + "More" button; `BottomNavItem` data class and `bottomNavItems` list
- `ui/shell/GroupDrawer.kt` — `ModalDrawerSheet` with all 14 groups; `DrawerGroup` data class and `allDrawerGroups` list
- `ui/shell/MainScreen.kt` — `ModalNavigationDrawer` + `Scaffold` (TopBar + BottomBar) + `NavHost`; snackbar host wired to `DeviceViewModel.snackbarMessage`; placeholder for GroupScreen (task 17009)
- `ui/theme/Theme.kt` — `HubitatDashboardTheme` with dynamic color on Android 12+, dark/light fallback
- Updated `MainActivity.kt` — injects `SettingsRepository`, passes `isConfigured()` + theme state to `MainScreen`

**Notes for task 17008:** Add `SystemStatusRow(viewModel)` inside `MainScreen.kt` in the `Column` before the `Box` containing `NavHost`. The placeholder comment is already there.
**Notes for task 17009:** Replace the placeholder `Text` in the `GROUP_PATTERN` composable in `MainScreen.kt` with `GroupScreen(groupId, viewModel)`.


## Task 17009 Completed — 2026-04-16

**Files created:**
- `data/model/groups.kt` — top-level `val groups: List<GroupConfig>` with all 14 static groups ported from `frontend/src/config/groups.ts`. Tiles with no deviceId in TS use Kotlin default (null); tiles with `deviceId: ''` in TS use `deviceId = ""`. hub-variable and ring-detection tiles include `hubVarName` parameter.
- `ui/group/TileCard.kt` — Material 3 `Card` (height 120dp, elevation 2dp) with exhaustive `when` on all 16 `TileType` values; scaffold placeholder `Text(tile.label)` for each branch.
- `ui/group/GroupScreen.kt` — `PullToRefreshBox` wrapping a `Column` (group title header + `LazyVerticalGrid` 2 columns); calls `viewModel.refresh()` on pull, shows "Group not found" for unknown groupId.
- Updated `ui/shell/MainScreen.kt` — replaced `GROUP_PATTERN` placeholder `Text` with `GroupScreen(groupId, viewModel)`; added `GroupScreen` import; removed now-unused `Text` and `dp` imports.

**Notes for tasks 17010-17013:** Replace `Text(tile.label)` branches in `TileCard.kt` with the real tile composables as they are implemented.



**Files created:**
- `ui/settings/SettingsUiState.kt` — data class with all 11 state fields
- `ui/settings/SettingsScreen.kt` — Material 3 Scaffold with 8 form fields (local IP, maker app ID, access token with show/hide, cloud URL, connection mode segmented buttons, PIN, confirm PIN, Save + Test Connection buttons)
- `viewmodel/SettingsViewModel.kt` — `@HiltViewModel` with `@Inject constructor()` (no deps yet), full `validate()` logic, stub `save()` and `testConnection()`

**Notes for task 17003/17005:** `SettingsViewModel` uses a no-arg constructor intentionally. When `SettingsRepository` and `PinRepository` are ready, add them as constructor parameters and wire `save()` and `testConnection()` accordingly. Removed `.gitkeep` from `ui/` and `viewmodel/` directories.

---

## Task 17011 Completed — RGBWTile with colour picker

**Files created/modified:**
- `ui/tiles/RGBWTile.kt` — Color swatch (CircleShape Box) showing HSV color from hue/saturation/level attributes. Tap opens `ModalBottomSheet` with live preview swatch, hue slider (0–360°), saturation slider (0–100%), brightness slider (0–100%), and On/Off `TextButton` row. Hue and saturation sliders call `sendColor()` on `onValueChangeFinished`, which converts hue back to Hubitat 0–100 scale and sends `setColor` with map format `[hue:H, saturation:S, level:L]`. Brightness slider sends `setLevel`. Gracefully returns early when `tile.deviceId == null`; shows "—" and grey swatch when `device == null`.
- `ui/group/TileCard.kt` — Replaced `Text(tile.label)` RGBW branch with `RGBWTile(tile, device, onCommand)`; added `RGBWTile` import.

**Implementation notes:** `ColorUtils.HSLToColor` from `androidx.core:core-ktx` used for HSV→Color conversion (already a dependency). Removed unused `rememberCoroutineScope` import. `@OptIn(ExperimentalMaterial3Api::class)` required for `ModalBottomSheet` and `rememberModalBottomSheetState`.

---

## Task 17010 Completed — 2026-04-16

**Files created:**
- `ui/tiles/SwitchTile.kt` — Power icon (amber on, gray off), tap-to-toggle, `CircularProgressIndicator` while `isPending`, shows "—" status when `device == null`.
- `ui/tiles/ConnectorTile.kt` — ToggleOn/ToggleOff icon, colored dot indicator (amber on, gray off), same tap-to-toggle pattern.
- `ui/tiles/DimmerTile.kt` — BrightnessHigh/BrightnessLow icon (tap to toggle), level % label, always-visible Slider sending `setLevel` (integer string) on `onValueChangeFinished`.

**Modified:**
- `ui/group/TileCard.kt` — Split `SWITCH, CONNECTOR` combined branch into separate real composable calls; wired `DIMMER` to `DimmerTile`. `RGBW` was already wired. Remaining types keep `Text(tile.label)` placeholder for tasks 17012–17013.

**Notes for tasks 17012–17013:** Replace remaining `Text(tile.label)` branches in `TileCard.kt` with sensor/control tile composables.



**Files created/modified:**
- `ui/shell/SystemStatusRow.kt` — `LazyRow` inside a `Surface(shadowElevation=2.dp)` with HSM chip (color-coded red/amber/blue/green), Mode chip (blue), Connection chip (Local/Cloud/Reconnecting), and 6 connector switch chips (device IDs 486, 905, 1227, 1268, 1327, 1316)
- `ui/shell/MainScreen.kt` — replaced placeholder comment with `SystemStatusRow(viewModel = viewModel)`; added import

**Notes for task 17009:** Replace the placeholder `Text` in the `GROUP_PATTERN` composable in `MainScreen.kt` with `GroupScreen(groupId, viewModel)`.

## Task 17012 Completed — Sensor Tiles

**Files created:**
- `ui/tiles/ContactTile.kt` — Door icon (DoorFront/DoorBack), red when open, green when closed. State from `device.attributes["contact"]`.
- `ui/tiles/MotionTile.kt` — DirectionsRun/Person icon, amber when active, gray when inactive. State from `device.attributes["motion"]`.
- `ui/tiles/TemperatureTile.kt` — Thermostat icon, shows `"°F"`; optional humidity line. State from `device.attributes["temperature"]` + `["humidity"]`.
- `ui/tiles/PowerMeterTile.kt` — ElectricBolt icon, shows watts + optional kWh. Optional Switch toggle when `"switch"` attribute present. Pending spinner during command.
- `ui/tiles/PresenceTile.kt` — AccountCircle (filled/outlined), green when present, gray when away. State from `device.attributes["presence"]`.
- `ui/tiles/BatteryTile.kt` — Battery icon (0/2/4/6Bar/Full), green ≥50%, amber 20–49%, red <20%. State from `device.attributes["battery"]`.
- `ui/tiles/RingDetectionTile.kt` — NotificationsActive/None icon, shows hub variable value when `tile.hubVarName` set, otherwise active/inactive state from `device.attributes["motion"]`.

**Files modified:**
- `ui/group/TileCard.kt` — Added `hubVariables: List<HubVariable> = emptyList()` param; wired all 7 sensor tile types replacing `Text(tile.label)` placeholders.
- `ui/group/GroupScreen.kt` — Added `val hubVariables by viewModel.hubVariables.collectAsState()`; passes `hubVariables = hubVariables` to `TileCard`.

**All tiles render a "—" placeholder when `device == null`.**

---

## Task 17013 Completed — Control Tiles and PinDialog

**Files created:**
- `ui/tiles/PinDialog.kt` — Material 3 `AlertDialog` with 4-digit masked `OutlinedTextField` (numeric, PasswordVisualTransformation). Confirm button disabled until exactly 4 digits. Shows "Invalid PIN" `supportingText` when `isInvalidPin=true`.
- `ui/tiles/ButtonTile.kt` — TouchApp icon, tap sends `onCommand("push", "1")`. `CircularProgressIndicator` while `isPending`.
- `ui/tiles/LockTile.kt` — Lock/LockOpen icon (red/green), state from `device.attributes["lock"]`. Tap shows `PinDialog` (as intent gate); `onCommand("lock"/"unlock", null)` on confirm.
- `ui/tiles/HubVariableTile.kt` — Edit icon, shows current hub variable value from `hubVariables` list matched by `tile.hubVarName`. Tap opens `AlertDialog` with pre-filled `OutlinedTextField`; calls `onSetVariable` on save.
- `ui/tiles/HsmTile.kt` — Security icon with color from `hsmColor()` (red/amber/blue/green/gray). Tap opens mode picker (4 modes); selection shows `PinDialog`; calls `onSetHsmMode(apiValue, pin)` on confirm.
- `ui/tiles/ModeTile.kt` — Schedule icon (blue), shows active mode name. Tap opens mode list from `modes` param; selection shows `PinDialog`; calls `onSetMode(id, pin)` on confirm.

**Files modified:**
- `ui/group/TileCard.kt` — Added `hsmStatus`, `modes`, `onSetHsmMode`, `onSetMode`, `onSetVariable` params (all with defaults). Wired all 5 control tile types; added control tile imports (HsmMode, HubMode, ButtonTile, HsmTile, HubVariableTile, LockTile, ModeTile).
- `ui/group/GroupScreen.kt` — Added `val hsmStatus by viewModel.hsmStatus.collectAsState()` and `val modes by viewModel.modes.collectAsState()`; passes all new params to `TileCard`.

**Implementation notes:** PIN verification for HSM/Mode occurs in `DeviceViewModel.setHsmMode`/`setMode` via `PinRepository.verifyPin()`; invalid PIN emits snackbar. LockTile's `PinDialog` acts as an intent/confirmation gate only — PIN is not verified at the tile level for lock/unlock commands.

---

## Task 17014 Completed — Polish

**Files modified:**
- `data/repository/SettingsRepository.kt` — Added `getDarkMode()` / `setDarkMode()` as method wrappers around existing `themeOverride`/`setThemeOverride` (backing key `theme_override`, values "system"/"light"/"dark").
- `MainActivity.kt` — Replaced static `isDarkTheme` bool with preference-driven dark mode: reads `getDarkMode()`, resolves to `isSystemInDarkTheme()` for "system". `onThemeToggle` cycles system→dark→light→system, persists via `setDarkMode()`, then calls `recreate()`.
- `ui/group/GroupScreen.kt` — Added empty-state branch: when `group.tiles.isEmpty()`, shows a centred "No devices in this group" `Text` inside `PullToRefreshBox`; the existing grid is shown in the `else` branch.

**Note:** `MainScreen.kt` snackbar was already wired to `DeviceViewModel.snackbarMessage` (task 17007); no changes needed.

**Files created:**
- `README.md` (android root) — Setup, building (debug + release + sideload), architecture, connection modes table.
