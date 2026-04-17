# RD-17013: Implement Control Tiles and PinDialog

## Owner
frontend-dev

## Summary
Five interactive tile types that require more complex UI: button (push), lock (PIN-protected), hub-variable (editable), hsm (arm modes, PIN-protected), mode (select active mode, PIN-protected). Plus the shared PinDialog used by the protected tiles.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

### `ui/tiles/PinDialog.kt`
```kotlin
@Composable
fun PinDialog(
    title: String,
    onConfirm: (pin: String) -> Unit,
    onDismiss: () -> Unit
)
```
- Material 3 `AlertDialog` with title, 4-digit PIN `OutlinedTextField` (numeric, masked).
- "Confirm" button disabled until exactly 4 digits entered.
- On confirm: calls `onConfirm(pin)`. The caller verifies via `PinRepository.verifyPin()`.
- Shows "Invalid PIN" error text if caller signals failure (via a `Boolean` state param).

### `ui/tiles/ButtonTile.kt`
- Icon: hand/push icon. Label. Large tap area.
- Tap: sends `onCommand("push", "1")`.
- Shows brief "Pushed!" Snackbar on success.

### `ui/tiles/LockTile.kt`
- Icon: lock/unlock icon. State: "locked" (padlock closed, red) or "unlocked" (open, green).
- Tap: shows `PinDialog`. On PIN confirm: `onCommand("lock"/"unlock", null)`.
- State source: `device.attributes["lock"]`.

### `ui/tiles/HubVariableTile.kt`
- Displays variable name and current value.
- Tap: opens inline edit dialog (simple `AlertDialog` with `OutlinedTextField` pre-filled with current value).
- On save: `viewModel.setHubVariable(name, newValue)`.

### `ui/tiles/HsmTile.kt`
- Icon: shield. Current HSM state text (armedAway / armedHome / armedNight / disarmed).
- Color: matches SystemStatusRow HSM chip colors.
- Tap: opens mode picker (4 buttons: Arm Away, Arm Home, Arm Night, Disarm). Each button shows `PinDialog`. On PIN confirm: `viewModel.setHsmMode(mode, pin)`.

### `ui/tiles/ModeTile.kt`
- Shows current hub mode name. Icon: clock.
- Tap: opens mode picker (list of available modes from `viewModel.modes`). Selection shows `PinDialog`. On PIN confirm: `viewModel.setMode(modeId, pin)`.

## Done Criteria
1. `PinDialog` shows, accepts 4 digits, calls `onConfirm` with the entered PIN.
2. `PinDialog` shows "Invalid PIN" error when caller signals invalid.
3. `LockTile` is locked (padlock closed, red) when `lock == "locked"`.
4. `HsmTile` shows correct color for each HSM state.
5. `ModeTile` lists modes from `viewModel.modes` correctly.
6. All 6 files compile without errors.
