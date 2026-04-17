# RD-17010: Implement Switch, Connector, and Dimmer Tiles

## Owner
frontend-dev

## Summary
Implement the three most common interactive tile types: switch (on/off toggle), connector (same but styled as a state flag), and dimmer (toggle + level slider).

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

`app/src/main/java/com/timshubet/hubitatdashboard/ui/tiles/`

### `SwitchTile.kt`
- Shows: power icon (filled=on/amber, outline=off/gray), label, on/off label text.
- Interaction: tap anywhere on card toggles on↔off via `onCommand("on"/"off", null)`.
- State source: `device.attributes["switch"]` == "on" or "off".

### `ConnectorTile.kt`
- Same layout as SwitchTile but styled differently:
  - Icon: toggle/link icon (not power icon).
  - On=amber background tint; off=neutral gray.
  - No label showing "on"/"off" — just the connector label and a colored dot indicator.
- Interaction: tap toggles via `onCommand("on"/"off", null)`.

### `DimmerTile.kt`
- Shows: dimmer/brightness icon, label, current level (e.g. "72%").
- Tap on icon area: toggles on/off.
- Long-press or visible slider (always shown below icon): `Slider(value = level/100f)` sends `onCommand("setLevel", level.toString())` on valueChangeFinished.
- Level range: 0–100 integer.
- State sources: `device.attributes["switch"]` and `device.attributes["level"]`.

## Done Criteria
1. `SwitchTile` toggles correctly: on→off and off→on, icon changes color.
2. `ConnectorTile` renders amber dot when `switch == "on"`, gray when off.
3. `DimmerTile` slider sends `setLevel` command with correct integer string value.
4. All three tiles show a loading indicator (CircularProgressIndicator) while a command is in-flight.
5. All three render without crash when `device == null` (show greyed placeholder).
