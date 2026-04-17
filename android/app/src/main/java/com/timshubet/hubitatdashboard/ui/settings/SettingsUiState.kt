package com.timshubet.hubitatdashboard.ui.settings

data class SettingsUiState(
    val localHubIp: String = "",
    val makerAppId: String = "",
    val makerToken: String = "",
    val cloudHubId: String = "",
    val connectionModeIndex: Int = 2, // 0=Local, 1=Cloud, 2=Auto
    val pin: String = "",
    val confirmPin: String = "",
    val localHubIpError: String? = null,
    val pinError: String? = null,
    val isLoading: Boolean = false,
    val saveSuccess: Boolean = false,
    val snackbarMessage: String? = null
)
