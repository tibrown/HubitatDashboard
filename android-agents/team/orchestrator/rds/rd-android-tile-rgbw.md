# RD-17011: Implement RGBW Tile

## Owner
frontend-dev

## Summary
The RGBW tile controls color bulbs. It includes an on/off toggle, brightness slider, and a color picker that maps to Hubitat's `setColor` command.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## File to Create

`app/src/main/java/com/timshubet/hubitatdashboard/ui/tiles/RGBWTile.kt`

### Layout (collapsed card view)
- Round color swatch showing current color (from `hue`, `saturation`, `level` attributes).
- Label text + on/off state label.
- Tap card: expands inline (or opens BottomSheet) to full color picker.

### Expanded / BottomSheet
- `Slider` for brightness (level 0–100), sends `setLevel`.
- HSB color wheel or hue bar + saturation bar (custom Composable using Canvas).
  - If `godaddy/color-picker-android` is not practical, implement a simple hue `Slider` (0–360) + saturation `Slider` (0–100) as two stacked sliders. Full wheel is ideal but not required.
- On color change: send `onCommand("setColor", "{hue:H,saturation:S,level:L}")`.
- Toggle button: on/off.
- CT (color temperature) mode switch if `colorTemperature` attribute present.

### State sources
`device.attributes["switch"]`, `device.attributes["hue"]`, `device.attributes["saturation"]`, `device.attributes["level"]`, `device.attributes["colorTemperature"]`.

### Hubitat setColor format
`setColor` takes a Groovy map string: `[hue:30, saturation:100, level:80]` — send as `"[hue:$h, saturation:$s, level:$l]"`.

## Done Criteria
1. Color swatch shows a color corresponding to current hue+saturation.
2. Brightness slider sends `setLevel` with 0–100 value.
3. Color picker sends `setColor` with correct Hubitat map format.
4. Toggle button sends `on`/`off` command.
5. Tile renders without crash when `device == null`.
