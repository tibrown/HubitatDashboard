package com.timshubet.hubitatdashboard.data.model

data class TileConfig(
    val deviceId: String? = null,
    val label: String,
    val tileType: TileType,
    val hubVarName: String? = null
)
