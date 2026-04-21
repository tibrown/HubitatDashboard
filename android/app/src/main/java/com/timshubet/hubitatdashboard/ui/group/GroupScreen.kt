package com.timshubet.hubitatdashboard.ui.group

import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.timshubet.hubitatdashboard.data.model.TileType
import com.timshubet.hubitatdashboard.data.model.DeviceState
import com.timshubet.hubitatdashboard.ui.edit.DevicePickerSheet
import com.timshubet.hubitatdashboard.ui.edit.TileTypePickerSheet
import com.timshubet.hubitatdashboard.ui.edit.availableTileTypes
import com.timshubet.hubitatdashboard.ui.edit.iconForName
import com.timshubet.hubitatdashboard.ui.theme.TileTokens
import com.timshubet.hubitatdashboard.viewmodel.DeviceViewModel
import com.timshubet.hubitatdashboard.viewmodel.GroupEditViewModel
import kotlinx.coroutines.launch

private fun normalizeLabel(s: String) = s.lowercase().replace(Regex("[^a-z0-9]"), "")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroupScreen(
    groupId: String,
    viewModel: DeviceViewModel,
    groupEditViewModel: GroupEditViewModel = hiltViewModel(),
    onNavigateToGroup: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val resolvedGroups by groupEditViewModel.resolvedGroups.collectAsState()
    val customGroups by groupEditViewModel.customGroups.collectAsState()
    val isEditMode by groupEditViewModel.isEditMode.collectAsState()
    val group = resolvedGroups.find { it.id == groupId }

    // Find subgroups — derived from resolvedGroups so childGroupOrder is respected
    val childGroupIds = customGroups.filter { it.parentId == groupId }.map { it.id }.toSet()
    val childGroups = resolvedGroups.filter { it.id in childGroupIds }

    if (group == null) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Group not found: $groupId")
        }
        return
    }

    val devices by viewModel.devices.collectAsState()
    val hubVariables by viewModel.hubVariables.collectAsState()
    val hsmStatus by viewModel.hsmStatus.collectAsState()
    val modes by viewModel.modes.collectAsState()
    var isRefreshing by remember { mutableStateOf(false) }
    var showDevicePicker by remember { mutableStateOf(false) }
    var typePickTarget by remember { mutableStateOf<Pair<String, DeviceState>?>(null) }

    // Derive stable key list from group tiles
    val tileKeys by remember(group.tiles) {
        derivedStateOf { group.tiles.map { it.deviceId ?: it.tileType.name } }
    }

    // Drag-and-drop state — recreated when the tile list identity changes
    val dragState = remember(groupId) {
        DragDropState(tileKeys) { orderedKeys ->
            groupEditViewModel.setTileOrder(groupId, orderedKeys)
        }
    }
    // Keep keys in sync when tiles are added/removed
    remember(tileKeys) { dragState.updateKeys(tileKeys) }
    val scope = rememberCoroutineScope()

    if (showDevicePicker) {
        val currentDeviceIds = group.tiles.mapNotNull { tile ->
            when {
                tile.tileType == TileType.HSM  -> "__hsm__"
                tile.tileType == TileType.MODE -> "__mode__"
                tile.tileType == TileType.HUB_VARIABLE && tile.hubVarName == "Sunrise" -> "__sunrise__"
                tile.tileType == TileType.HUB_VARIABLE && tile.hubVarName == "Sunset"  -> "__sunset__"
                !tile.deviceId.isNullOrBlank() -> tile.deviceId
                else -> null
            }
        }.toSet()
        DevicePickerSheet(
            groupId = groupId,
            currentDeviceIds = currentDeviceIds,
            devices = devices,
            onDismiss = { showDevicePicker = false },
            onAdd = { deviceId, label, tileType ->
                groupEditViewModel.addDeviceToGroup(groupId, deviceId, label, tileType)
            }
        )
    }

    typePickTarget?.let { (deviceId, device) ->
        TileTypePickerSheet(
            device = device,
            currentType = group.tiles.find { it.deviceId == deviceId }?.tileType
                ?: availableTileTypes(device).firstOrNull()
                ?: return@let,
            onDismiss = { typePickTarget = null },
            onSelect = { newType ->
                groupEditViewModel.setTileTypeOverride(deviceId, newType)
            }
        )
    }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            scope.launch {
                isRefreshing = true
                viewModel.refresh()
                isRefreshing = false
            }
        },
        modifier = modifier.fillMaxSize()
    ) {
        if (group.tiles.isEmpty() && !isEditMode) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No devices in this group", style = MaterialTheme.typography.bodyLarge)
            }
        } else {
            Box(modifier = Modifier.fillMaxSize()) {
                Column {
                    Text(
                        text = group.displayName,
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                    // Use drag-state-ordered keys so reorder is reflected immediately
                    val orderedTiles = remember(dragState.keys, group.tiles) {
                        val tileMap = group.tiles.associateBy { it.deviceId ?: it.tileType.name }
                        dragState.keys.mapNotNull { tileMap[it] }
                    }
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(minSize = TileTokens.GridMinTile),
                        contentPadding = PaddingValues(TileTokens.GridGap),
                        horizontalArrangement = Arrangement.spacedBy(TileTokens.GridGap),
                        verticalArrangement = Arrangement.spacedBy(TileTokens.GridGap)
                    ) {
                        items(
                            items = orderedTiles,
                            key = { tile -> tile.deviceId ?: tile.tileType.name },
                            span = { tile ->
                                if (tile.tileType == TileType.MODE || tile.tileType == TileType.HSM) {
                                    GridItemSpan(maxLineSpan)
                                } else {
                                    GridItemSpan(1)
                                }
                            }
                        ) { tile ->
                            val tileIndex = orderedTiles.indexOf(tile)
                            val tileKey = tile.deviceId ?: tile.tileType.name
                            val isDragging = isEditMode && dragState.draggingIndex == tileIndex
                            val device = if (!tile.deviceId.isNullOrBlank()) {
                                devices[tile.deviceId]
                            } else {
                                val norm = normalizeLabel(tile.label)
                                devices.values.find { normalizeLabel(it.label) == norm }
                            }
                            Box(
                                modifier = Modifier
                                    .onGloballyPositioned { coords ->
                                        if (isEditMode) {
                                            val b = coords.boundsInWindow()
                                            dragState.bounds[tileIndex] = Rect(b.left, b.top, b.right, b.bottom)
                                        }
                                    }
                                    .graphicsLayer {
                                        if (isDragging) {
                                            translationX = dragState.dragOffset.x
                                            translationY = dragState.dragOffset.y
                                            scaleX = 1.06f
                                            scaleY = 1.06f
                                            shadowElevation = 16f
                                            alpha = 0.92f
                                        }
                                    }
                                    .then(
                                        if (isEditMode) Modifier.pointerInput(tileKey) {
                                            detectDragGesturesAfterLongPress(
                                                onDragStart = { dragState.onDragStart(tileIndex) },
                                                onDrag = { _, delta -> dragState.onDrag(delta) },
                                                onDragEnd = { dragState.onDragEnd() },
                                                onDragCancel = { dragState.onDragCancel() }
                                            )
                                        } else Modifier
                                    )
                            ) {
                                TileCard(
                                    tile = tile,
                                    device = device,
                                    onCommand = { deviceId, command, value ->
                                        viewModel.sendCommand(deviceId, command, value)
                                    },
                                    hubVariables = hubVariables,
                                    hsmStatus = hsmStatus,
                                    modes = modes,
                                    onSetHsmMode = { mode -> viewModel.setHsmMode(mode) },
                                    onSetMode = { modeId -> viewModel.setMode(modeId) },
                                    onSetVariable = { name, value -> viewModel.setHubVariable(name, value) }
                                )
                                if (isEditMode) {
                                    val removableId = when {
                                        !tile.deviceId.isNullOrBlank() -> tile.deviceId
                                        tile.tileType == TileType.HSM  -> "__hsm__"
                                        tile.tileType == TileType.MODE -> "__mode__"
                                        tile.tileType == TileType.HUB_VARIABLE && tile.hubVarName == "Sunrise" -> "__sunrise__"
                                        tile.tileType == TileType.HUB_VARIABLE && tile.hubVarName == "Sunset"  -> "__sunset__"
                                        else -> null
                                    }
                                    if (removableId != null) {
                                        IconButton(
                                            onClick = {
                                                groupEditViewModel.removeDeviceFromGroup(groupId, removableId)
                                            },
                                            modifier = Modifier
                                                .align(Alignment.TopEnd)
                                                .size(32.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.Close,
                                                contentDescription = "Remove",
                                                tint = MaterialTheme.colorScheme.error
                                            )
                                        }
                                    }
                                    // Show type-change button for real devices only
                                    if (device != null && !tile.deviceId.isNullOrBlank() &&
                                        availableTileTypes(device).size > 1
                                    ) {
                                        IconButton(
                                            onClick = { typePickTarget = tile.deviceId!! to device },
                                            modifier = Modifier
                                                .align(Alignment.BottomEnd)
                                                .size(32.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.Tune,
                                                contentDescription = "Change type",
                                                tint = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }
                                }
                            }
                        }
                        // Subgroup navigation strip at the bottom
                        if (childGroups.isNotEmpty()) {
                            item(span = { GridItemSpan(maxLineSpan) }) {
                                Column {
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                                    Text(
                                        text = "Subgroups",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(bottom = 8.dp)
                                    )
                                    childGroups.forEach { child ->
                                        Surface(
                                            shape = MaterialTheme.shapes.medium,
                                            color = MaterialTheme.colorScheme.surfaceVariant,
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(bottom = 8.dp)
                                                .clickable { onNavigateToGroup(child.id) }
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                                            ) {
                                                Icon(
                                                    imageVector = iconForName(child.iconName),
                                                    contentDescription = child.displayName,
                                                    tint = MaterialTheme.colorScheme.primary
                                                )
                                                Text(
                                                    text = child.displayName,
                                                    style = MaterialTheme.typography.bodyLarge
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (isEditMode) {
                    ExtendedFloatingActionButton(
                        onClick = { showDevicePicker = true },
                        icon = { Icon(Icons.Default.Add, contentDescription = "Add") },
                        text = { Text("Add Device") },
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(16.dp)
                    )
                }
            }
        }
    }
}
