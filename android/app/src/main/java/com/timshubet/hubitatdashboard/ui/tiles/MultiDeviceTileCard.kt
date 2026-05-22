package com.timshubet.hubitatdashboard.ui.tiles

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.timshubet.hubitatdashboard.data.model.DeviceState
import com.timshubet.hubitatdashboard.data.model.MultiTileConfig
import com.timshubet.hubitatdashboard.data.model.TileConfig

@Composable
fun MultiDeviceTileCard(
    tile: TileConfig,
    config: MultiTileConfig?,
    devices: Map<String, DeviceState>,
    onCommand: (deviceId: String, command: String, value: String?) -> Unit,
    modifier: Modifier = Modifier
) {
    if (config == null || config.deviceIds.isEmpty()) return

    val cols = config.cols.coerceIn(1, 4)
    val label = config.label?.ifBlank { null } ?: "Panel"
    val deviceIds = config.deviceIds.filter { devices.containsKey(it) }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors()
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Text(
                text = label.uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.8.sp,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(bottom = 6.dp)
            )

            val rows = deviceIds.chunked(cols)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                rows.forEach { rowDevices ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        rowDevices.forEach { deviceId ->
                            MiniDeviceCell(
                                deviceId = deviceId,
                                device = devices[deviceId]!!,
                                onCommand = onCommand,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        // Fill remaining columns so cells are even-width
                        repeat(cols - rowDevices.size) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MiniDeviceCell(
    deviceId: String,
    device: DeviceState,
    onCommand: (deviceId: String, command: String, value: String?) -> Unit,
    modifier: Modifier = Modifier
) {
    val attrs = device.attributes
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        tonalElevation = 1.dp
    ) {
        Column(
            modifier = Modifier
                .padding(6.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = device.label,
                fontSize = 10.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = MaterialTheme.colorScheme.onSurface
            )

            when {
                attrs.containsKey("switch") && attrs.containsKey("level") -> {
                    // Dimmer
                    val isOn = attrs["switch"] == "on"
                    val level = attrs["level"]?.toString()
                    val btnLabel = if (isOn && level != null) "$level%" else if (isOn) "On" else "Off"
                    Button(
                        onClick = { onCommand(deviceId, if (isOn) "off" else "on", null) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isOn) MaterialTheme.colorScheme.tertiary
                                            else MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = if (isOn) MaterialTheme.colorScheme.onTertiary
                                           else MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                        modifier = Modifier.height(24.dp)
                    ) {
                        Text(btnLabel, fontSize = 10.sp)
                    }
                }
                attrs.containsKey("switch") -> {
                    // Switch
                    val isOn = attrs["switch"] == "on"
                    Button(
                        onClick = { onCommand(deviceId, if (isOn) "off" else "on", null) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isOn) MaterialTheme.colorScheme.primary
                                            else MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = if (isOn) MaterialTheme.colorScheme.onPrimary
                                           else MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                        modifier = Modifier.height(24.dp)
                    ) {
                        Text(if (isOn) "On" else "Off", fontSize = 10.sp)
                    }
                }
                attrs.containsKey("temperature") -> {
                    Text(
                        text = attrs["temperature"]?.let { "$it°" } ?: "—",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                attrs.containsKey("contact") -> {
                    val isOpen = attrs["contact"] == "open"
                    Text(
                        text = attrs["contact"]?.let { if (isOpen) "Open" else "Closed" } ?: "—",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (isOpen) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                    )
                }
                attrs.containsKey("motion") -> {
                    val active = attrs["motion"] == "active"
                    Text(
                        text = attrs["motion"]?.let { if (active) "Active" else "Clear" } ?: "—",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (active) MaterialTheme.colorScheme.tertiary
                                else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                attrs.containsKey("presence") -> {
                    val present = attrs["presence"] == "present"
                    Text(
                        text = attrs["presence"]?.let { if (present) "Home" else "Away" } ?: "—",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (present) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                else -> {
                    Text(
                        text = attrs.values.firstOrNull()?.toString() ?: "—",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}
