package com.timshubet.hubitatdashboard.ui.tiles

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.timshubet.hubitatdashboard.data.model.DeviceState
import com.timshubet.hubitatdashboard.data.model.TileConfig
import com.timshubet.hubitatdashboard.ui.theme.TileTokens
import com.timshubet.hubitatdashboard.ui.tiles.common.TilePill
import com.timshubet.hubitatdashboard.ui.tiles.common.TilePillSkeleton
import com.timshubet.hubitatdashboard.ui.tiles.common.TileShell

@Composable
fun LockTile(
    tile: TileConfig,
    device: DeviceState?,
    onCommand: (deviceId: String, command: String, value: String?) -> Unit,
    modifier: Modifier = Modifier
) {
    val deviceId = tile.deviceId ?: return
    val isLocked = device?.attributes?.get("lock") == "locked"
    var showPin by remember { mutableStateOf(false) }
    var isInvalidPin by remember { mutableStateOf(false) }

    TileShell(title = tile.label, modifier = modifier) {
        TilePill(
            label = if (isLocked) "Locked" else "Unlocked",
            isOn = isLocked,
            icon = if (isLocked) Icons.Filled.Lock else Icons.Filled.LockOpen,
            onClick = { showPin = true; isInvalidPin = false },
            onColor = if (isLocked) TileTokens.GreenOn else TileTokens.RedAlert
        )
    }

    if (showPin) {
        PinDialog(
            title = if (isLocked) "Unlock ${tile.label}" else "Lock ${tile.label}",
            isInvalidPin = isInvalidPin,
            onConfirm = { _ ->
                onCommand(deviceId, if (isLocked) "unlock" else "lock", null)
                showPin = false
            },
            onDismiss = { showPin = false }
        )
    }
}
