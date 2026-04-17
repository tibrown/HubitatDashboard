package com.timshubet.hubitatdashboard.data.model

data class GroupConfig(
    val id: String,
    val displayName: String,
    val iconName: String,
    val tiles: List<TileConfig>
)
