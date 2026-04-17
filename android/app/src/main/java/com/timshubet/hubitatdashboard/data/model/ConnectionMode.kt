package com.timshubet.hubitatdashboard.data.model

enum class ConnectionMode {
    LOCAL,
    CLOUD,
    AUTO;

    companion object {
        fun fromString(value: String?): ConnectionMode =
            entries.find { it.name == value } ?: AUTO
    }
}
