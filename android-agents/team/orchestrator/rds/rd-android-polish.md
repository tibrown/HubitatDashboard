# RD-17014: Polish, Theme, Group Reordering, Error States, APK, and README

## Owner
frontend-dev

## Summary
Final polish phase: dark/light theme support with manual toggle, group reorder persistence, no-connection error banner, launcher icon, and sideload documentation.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Tasks

### 1. Dark / Light Theme
- `ui/theme/Theme.kt`: define `HubitatDashboardTheme` using `MaterialTheme` with dynamic color (Android 12+) and static fallback palettes for older devices.
- Dark/light based on `isSystemInDarkTheme()` by default.
- Manual override: toggle button in `HubitatTopBar` writes `themeOverride` to DataStore ("system" | "light" | "dark").
- `MainActivity` reads `themeOverride` and passes to `HubitatDashboardTheme`.

### 2. Group Reordering
- `GroupDrawer.kt`: each group row has a drag handle (3-line icon).
- Use `androidx.compose.foundation` `reorderable` pattern (or a simple up/down button approach if reorderable library not available).
- On reorder: save the ordered list of group IDs to DataStore (`"group_order"` key as JSON array).
- On app launch: `GroupBottomNav` and `GroupDrawer` read the persisted order.

### 3. No-Connection Warning Banner
- In `MainScreen.kt`: when `viewModel.connectionStatus == RECONNECTING` for > 30 seconds, show a persistent yellow `Banner` / `Card` at the top of the content area: "Hub connection lost — reconnecting…".
- Banner dismisses automatically when connection is restored.

### 4. Custom Launcher Icon
- Create a vector drawable `ic_launcher_foreground.xml`: a stylised shield or home shape with a WiFi arc, using the Material 3 primary color.
- Update `mipmap-*` folders with the new icon (adaptive icon format for API 26+).

### 5. APK Build Documentation
- Create `android/README.md` with:
  - Prerequisites (JDK 17+, Android Studio or command-line SDK)
  - Debug build: `./gradlew assembleDebug`
  - Release keystore generation: `keytool -genkey -v -keystore hubitat.jks ...`
  - Release build: `./gradlew assembleRelease` (with signing config)
  - Sideload install: `adb install -r app-release.apk` or manual APK copy
  - Enable "Install unknown apps" on device

## Done Criteria
1. App uses correct theme (dark/light) based on system setting.
2. Theme toggle button in TopBar switches theme and persists across restarts.
3. Group order persists after reorder across app restarts.
4. No-connection banner appears when `connectionStatus == RECONNECTING` for 30+ seconds.
5. Custom launcher icon is visible on the home screen (adaptive icon).
6. `android/README.md` exists with all 5 documentation sections.
