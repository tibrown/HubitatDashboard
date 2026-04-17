package com.timshubet.hubitatdashboard.ui.tiles

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.timshubet.hubitatdashboard.data.model.HubMode
import com.timshubet.hubitatdashboard.data.model.TileConfig
import com.timshubet.hubitatdashboard.ui.theme.TileTokens
import com.timshubet.hubitatdashboard.ui.tiles.common.ModeChipRow
import com.timshubet.hubitatdashboard.ui.tiles.common.TileShell

@Composable
fun ModeTile(
    tile: TileConfig,
    modes: List<HubMode>,
    onSetMode: (modeId: String, pin: String) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeMode = modes.firstOrNull { it.active }
    var pendingModeId by remember { mutableStateOf<String?>(null) }
    var showPin by remember { mutableStateOf(false) }
    var isInvalidPin by remember { mutableStateOf(false) }

    TileShell(
        title = tile.label,
        modifier = modifier,
        titleTrailing = {
            Icon(
                imageVector = Icons.Filled.Schedule,
                contentDescription = null,
                tint = TileTokens.TitleMuted,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = activeMode?.name ?: "—",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    ) {
        if (modes.isEmpty()) {
            Text("Loading…", style = MaterialTheme.typography.labelSmall, color = TileTokens.TitleMuted)
        } else {
            ModeChipRow(
                options = modes.map { it.name },
                selectedLabel = activeMode?.name,
                onSelect = { idx ->
                    pendingModeId = modes[idx].id
                    showPin = true
                    isInvalidPin = false
                }
            )
        }
    }

    if (showPin) {
        PinDialog(
            title = "Confirm PIN",
            isInvalidPin = isInvalidPin,
            onConfirm = { pin ->
                pendingModeId?.let { id ->
                    onSetMode(id, pin)
                    showPin = false
                }
            },
            onDismiss = { showPin = false }
        )
    }
}
