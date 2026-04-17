# RD-17008: Implement SystemStatusRow

## Owner
frontend-dev

## Summary
A horizontal status bar pinned below the TopAppBar showing live HSM state, Hub Mode, connection type (Local/Cloud), and connector switch chips. Mirrors the web app's `SystemBar.tsx`.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## File to Create

### `ui/shell/SystemStatusRow.kt`

```kotlin
@Composable
fun SystemStatusRow(viewModel: DeviceViewModel)
```

Layout: `LazyRow` (horizontal scroll) inside a `Surface` with a bottom border. Contains these chips in order:

| Chip | Content | Color logic |
|---|---|---|
| HSM | Shield icon + armedAway/armedHome/armedNight/disarmed/allDisarmed | armedAway=red, armedHome=amber, armedNight=blue, disarmed=green |
| Mode | Clock icon + mode name | blue |
| Connection | Wifi icon + "Local" or Wifi-off + "Cloud" or "Reconnecting" | connected=green, reconnecting=amber, polling=blue |
| Connector chips | One chip per connector in `connectorChips` list (deviceId + label) | on=amber, off=gray |

Connector chips to show (same as web `SystemBar.tsx`):
- deviceId 486 "Alarms"
- deviceId 905 "Silent"
- deviceId 1227 "High Alert"
- deviceId 1268 "Traveling"
- deviceId 1327 "PTO"
- deviceId 1316 "Holiday"

Each chip uses `SuggestionChip` or `AssistChip` from Material 3. Connector chips are tappable (navigate to system group). HSM chip taps open the HSM tile dialog (no-op if no `hsm` tile visible — just navigates to `security-alarm` group).

## Done Criteria
1. Row renders with all chips when `DeviceViewModel` has mock state.
2. HSM chip shows correct color for each of the 5 HSM states.
3. Connection chip shows "Local" when `activeConnection = LOCAL`, "Cloud" when CLOUD.
4. Connector chips show amber when switch is "on", gray when "off".
5. Row scrolls horizontally without clipping.
