# RD-17006: Implement SettingsScreen and SettingsViewModel

## Owner
frontend-dev

## Summary
The Settings screen is shown on first launch (when no hub URL is saved) and accessible via TopBar. It lets the user configure the hub connection and set their PIN.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

### `ui/settings/SettingsScreen.kt`
Material 3 `Scaffold` with `TopAppBar("Settings")`. Form fields:

| Field | Type | Notes |
|---|---|---|
| Local Hub IP | `OutlinedTextField` | Placeholder: `192.168.1.42`. Keyboard: `KeyboardType.Uri` |
| Maker App ID | `OutlinedTextField` | Numeric keyboard |
| Access Token | `OutlinedTextField` | `visualTransformation = PasswordVisualTransformation()` with show/hide toggle |
| Cloud Hub URL | `OutlinedTextField` | Placeholder: `https://cloud.hubitat.com/api/.../apps/...` |
| Connection Mode | `SingleChoiceSegmentedButtonRow` | Three options: Local / Cloud / Auto (Auto selected by default) |
| PIN | `OutlinedTextField` (4 digits) | `keyboardType = Number`, masked |
| Confirm PIN | `OutlinedTextField` | Must match PIN |
| Save button | `Button` | Validates non-empty IP/token, PINs match, then saves and navigates to main |
| Test Connection | `OutlinedButton` | Calls `SettingsViewModel.testConnection()`, shows result Snackbar |

### `viewmodel/SettingsViewModel.kt`
- Exposes `uiState: StateFlow<SettingsUiState>` (all field values + loading + error).
- `save(...)`: writes to `SettingsRepository`, hashes PIN via `PinRepository`, navigates out.
- `testConnection()`: calls `ConnectionResolver.resolveBaseUrl()` then `GET devices/all`, emits success/failure to Snackbar.

## Done Criteria
1. Screen renders all 8 form elements without crash.
2. Save with empty Local IP shows a validation error (does not navigate away).
3. Save with mismatched PINs shows "PINs do not match" error.
4. After a valid save, fields persist when screen is reopened.
5. Test Connection button shows "Connected" Snackbar on success and an error message on failure.
6. Onboarding: if `localHubIp` and `cloudHubUrl` are both empty, app navigates to SettingsScreen on startup before MainScreen.
