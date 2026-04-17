# RD-17009: Implement GroupScreen and Groups Config

## Owner
frontend-dev

## Summary
Port the web `frontend/src/config/groups.ts` to Kotlin, and build the `GroupScreen` composable that renders a 2-column grid of tile cards for the active group.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

### `data/model/groups.kt`
Port of `frontend/src/config/groups.ts`. A top-level `val groups: List<GroupConfig>` containing all 14 static groups with all tile configurations, identical device IDs, labels, tile types, and hubVarNames.

The 14 groups (same IDs as web):
`environment`, `security-alarm`, `night-security`, `lights`, `doors-windows`, `presence-motion`, `perimeter`, `emergency`, `cameras`, `ring-detections`, `seasonal`, `hub-mode`, `power-monitor`, `system`

### `ui/group/GroupScreen.kt`
```kotlin
@Composable
fun GroupScreen(groupId: String, viewModel: DeviceViewModel, modifier: Modifier = Modifier)
```
- Looks up `groups.find { it.id == groupId }` (or shows "Group not found" if missing).
- Shows group display name as a section header.
- `LazyVerticalGrid(columns = GridCells.Fixed(2))` of tile cards.
- For each `TileConfig` in the group: calls `TileCard(tile, deviceState, onCommand)`.
- Pull-to-refresh: `PullRefreshIndicator` / `pullRefresh` modifier calls `viewModel.refresh()`.

### `ui/group/TileCard.kt`
```kotlin
@Composable
fun TileCard(tile: TileConfig, device: DeviceState?, onCommand: (String, String?) -> Unit)
```
- Material 3 `Card` with fixed height (~120dp), elevation on press.
- Routes to the correct tile Composable based on `tile.tileType`.
- If `device == null` and tile needs a device: shows a greyed-out placeholder card with label.

## Done Criteria
1. `groups.kt` contains exactly 14 `GroupConfig` objects with all tiles matching `groups.ts`.
2. `GroupScreen("lights", ...)` renders without crash and shows the correct tile count.
3. `GroupScreen("environment", ...)` renders correctly.
4. Pull-to-refresh gesture triggers `viewModel.refresh()`.
5. Unknown `groupId` shows "Group not found" text (no crash).
