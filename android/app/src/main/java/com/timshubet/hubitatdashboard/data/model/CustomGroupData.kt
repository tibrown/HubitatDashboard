package com.timshubet.hubitatdashboard.data.model

data class CustomGroupData(
    val id: String,
    val displayName: String,
    val iconName: String,
    val parentId: String? = null
)
