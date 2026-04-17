# RD-17002: Implement Kotlin Data Models

## Owner
api-dev

## Summary
Create all Kotlin data classes that mirror the web app's `types.ts`. These are the shared types used by the API service, repositories, and UI.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

`app/src/main/java/com/timshubet/hubitatdashboard/data/model/`

| File | Contents |
|---|---|
| `DeviceState.kt` | `data class DeviceState(val id: String, val label: String, val type: String, val attributes: Map<String, JsonElement?>, val commands: List<String>?)` |
| `SSEEvent.kt` | `data class SSEEvent(val deviceId: String, val attribute: String, val value: String?)` |
| `TileType.kt` | `enum class TileType` with all 15 values: SWITCH, DIMMER, RGBW, CONTACT, MOTION, TEMPERATURE, POWER_METER, BUTTON, LOCK, CONNECTOR, HUB_VARIABLE, HSM, MODE, RING_DETECTION, PRESENCE, BATTERY |
| `TileConfig.kt` | `data class TileConfig(val deviceId: String?, val label: String, val tileType: TileType, val hubVarName: String?)` |
| `GroupConfig.kt` | `data class GroupConfig(val id: String, val displayName: String, val iconName: String, val tiles: List<TileConfig>)` |
| `ConnectionType.kt` | `enum class ConnectionType { LOCAL, CLOUD, UNKNOWN }` |
| `HsmMode.kt` | `enum class HsmMode` with values: ARMED_AWAY, ARMED_HOME, ARMED_NIGHT, DISARMED, ALL_DISARMED, UNKNOWN |
| `HubMode.kt` | `data class HubMode(val id: String, val name: String, val active: Boolean)` |
| `HubVariable.kt` | `data class HubVariable(val name: String, val type: String, val value: String?)` |

## Notes
- Use `com.google.gson.JsonElement` for the flexible attribute map value type (matches Retrofit+Gson).
- All classes must be `data class` for clean `copy()` + equality semantics.
- `TileType` values must exactly match the snake-case IDs used in `groups.kt` (task 17009).

## Done Criteria
1. All 9 files exist in the correct package.
2. No compile errors (`./gradlew compileDebugKotlin`).
3. `TileType` has exactly 15 values matching the plan.
4. `DeviceState.attributes` uses `Map<String, JsonElement?>`.
