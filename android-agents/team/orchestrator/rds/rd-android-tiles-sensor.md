# RD-17012: Implement Sensor Tiles (Read-Only)

## Owner
frontend-dev

## Summary
Seven read-only sensor tile types: contact, motion, temperature, power-meter, presence, battery, and ring-detection.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

`app/src/main/java/com/timshubet/hubitatdashboard/ui/tiles/`

### `ContactTile.kt`
- Icon: door/window icon. State: "open" (red, open icon) or "closed" (green, closed icon).
- State source: `device.attributes["contact"]`.

### `MotionTile.kt`
- Icon: person/motion icon. State: "active" (amber, motion icon) or "inactive" (gray, still icon).
- State source: `device.attributes["motion"]`.

### `TemperatureTile.kt`
- Icon: thermometer. Displays numeric temp value + unit (°F).
- State source: `device.attributes["temperature"]`.
- Also shows `device.attributes["humidity"]` if present (e.g. "72°F / 45%").

### `PowerMeterTile.kt`
- Icon: lightning bolt. Displays watts (e.g. "120 W").
- If `energy` attribute present, shows kWh on second line.
- State source: `device.attributes["power"]`, `device.attributes["energy"]`.
- Switch control: if `device.attributes["switch"]` present, show a small toggle to turn on/off.

### `PresenceTile.kt`
- Icon: person-circle. State: "present" (green, filled) or "not present" (gray, outline).
- State source: `device.attributes["presence"]`.

### `BatteryTile.kt`
- Icon: battery (level-appropriate: full/three-quarter/half/quarter/empty).
- Displays percentage value.
- Color: green ≥50%, amber 20–49%, red <20%.
- State source: `device.attributes["battery"]`.

### `RingDetectionTile.kt`
- Icon: bell (ring icon).
- Shows hub variable name and last-ring timestamp from `device.attributes["lastUpdate"]` or hub variable value.
- If `hubVarName` is set on the tile, displays the hub variable value (from `viewModel.hubVariables`).
- Motion sub-state badge: active/inactive from `device.attributes["motion"]` if present.

## Done Criteria
1. All 7 tile files exist and compile.
2. `ContactTile` shows red when `contact == "open"`, green when `"closed"`.
3. `TemperatureTile` displays numeric value with °F unit.
4. `BatteryTile` changes icon and color at the correct thresholds.
5. All tiles render without crash when `device == null`.
