package com.timshubet.hubitatdashboard.data.model

data class SSEEvent(
    val deviceId: String,
    val attribute: String,
    val value: String?
)
