package com.timshubet.hubitatdashboard.ui.tiles

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.timshubet.hubitatdashboard.data.model.HsmMode
import com.timshubet.hubitatdashboard.data.model.TileConfig
import com.timshubet.hubitatdashboard.ui.theme.TileTokens
import com.timshubet.hubitatdashboard.ui.tiles.common.ModeChipRow
import com.timshubet.hubitatdashboard.ui.tiles.common.TileShell

private fun hsmColor(mode: HsmMode): Color = when (mode) {
    HsmMode.ARMED_AWAY  -> TileTokens.RedAlert
    HsmMode.ARMED_HOME  -> TileTokens.OrangeHot
    HsmMode.ARMED_NIGHT -> TileTokens.BlueCold
    HsmMode.DISARMED, HsmMode.ALL_DISARMED -> TileTokens.GreenOn
    HsmMode.UNKNOWN     -> TileTokens.TitleMuted
}

private val hsmOptions = listOf(
    HsmMode.ARMED_AWAY,
    HsmMode.ARMED_HOME,
    HsmMode.ARMED_NIGHT,
    HsmMode.DISARMED
)

@Composable
fun HsmTile(
    tile: TileConfig,
    hsmStatus: HsmMode,
    onSetHsmMode: (mode: String, pin: String) -> Unit,
    modifier: Modifier = Modifier
) {
    var pendingMode by remember { mutableStateOf<String?>(null) }
    var showPin by remember { mutableStateOf(false) }
    var isInvalidPin by remember { mutableStateOf(false) }
    val color = hsmColor(hsmStatus)

    TileShell(
        title = tile.label,
        modifier = modifier,
        titleTrailing = {
            Icon(
                imageVector = Icons.Filled.Security,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = hsmStatus.displayName,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    ) {
        ModeChipRow(
            options = hsmOptions.map { it.displayName },
            selectedLabel = hsmStatus.displayName,
            onSelect = { idx ->
                pendingMode = hsmOptions[idx].apiValue
                showPin = true
                isInvalidPin = false
            },
            selectedColor = color
        )
    }

    if (showPin) {
        PinDialog(
            title = "Confirm PIN",
            isInvalidPin = isInvalidPin,
            onConfirm = { pin ->
                pendingMode?.let { mode ->
                    onSetHsmMode(mode, pin)
                    showPin = false
                }
            },
            onDismiss = { showPin = false }
        )
    }
}
