package com.timshubet.hubitatdashboard.data.repository

import android.content.SharedPreferences
import com.timshubet.hubitatdashboard.data.model.ConnectionMode
import javax.inject.Inject
import javax.inject.Named

class SettingsRepository @Inject constructor(
    @Named("encrypted") private val prefs: SharedPreferences
) {
    companion object {
        const val KEY_LOCAL_HUB_IP = "local_hub_ip"
        const val KEY_MAKER_APP_ID = "maker_app_id"
        const val KEY_MAKER_TOKEN = "maker_token"
        const val KEY_CLOUD_HUB_ID = "cloud_hub_id"
        const val KEY_CONNECTION_MODE = "connection_mode"
        const val KEY_PIN_HASH = "pin_hash"
        const val KEY_GROUP_ORDER = "group_order"
        const val KEY_THEME_OVERRIDE = "theme_override"
    }

    val localHubIp: String get() = prefs.getString(KEY_LOCAL_HUB_IP, "") ?: ""
    val makerAppId: String get() = prefs.getString(KEY_MAKER_APP_ID, "") ?: ""
    val makerToken: String get() = prefs.getString(KEY_MAKER_TOKEN, "") ?: ""
    val cloudHubId: String get() = prefs.getString(KEY_CLOUD_HUB_ID, "") ?: ""
    val connectionMode: ConnectionMode get() = ConnectionMode.fromString(prefs.getString(KEY_CONNECTION_MODE, null))
    val pinHash: String get() = prefs.getString(KEY_PIN_HASH, "") ?: ""
    val groupOrder: String get() = prefs.getString(KEY_GROUP_ORDER, "") ?: ""
    val themeOverride: String get() = prefs.getString(KEY_THEME_OVERRIDE, "system") ?: "system"

    fun setLocalHubIp(value: String) = prefs.edit().putString(KEY_LOCAL_HUB_IP, value).apply()
    fun setMakerAppId(value: String) = prefs.edit().putString(KEY_MAKER_APP_ID, value).apply()
    fun setMakerToken(value: String) = prefs.edit().putString(KEY_MAKER_TOKEN, value).apply()
    fun setCloudHubId(value: String) = prefs.edit().putString(KEY_CLOUD_HUB_ID, value).apply()
    fun setConnectionMode(mode: ConnectionMode) = prefs.edit().putString(KEY_CONNECTION_MODE, mode.name).apply()
    fun setPinHash(hash: String) = prefs.edit().putString(KEY_PIN_HASH, hash).apply()
    fun setGroupOrder(json: String) = prefs.edit().putString(KEY_GROUP_ORDER, json).apply()
    fun setThemeOverride(value: String) = prefs.edit().putString(KEY_THEME_OVERRIDE, value).apply()

    fun getDarkMode(): String = themeOverride
    fun setDarkMode(value: String) = setThemeOverride(value)

    fun isConfigured(): Boolean = localHubIp.isNotBlank() || cloudHubId.isNotBlank()

    fun saveAll(
        localHubIp: String,
        makerAppId: String,
        makerToken: String,
        cloudHubId: String,
        connectionMode: ConnectionMode
    ) {
        prefs.edit()
            .putString(KEY_LOCAL_HUB_IP, localHubIp)
            .putString(KEY_MAKER_APP_ID, makerAppId)
            .putString(KEY_MAKER_TOKEN, makerToken)
            .putString(KEY_CLOUD_HUB_ID, cloudHubId)
            .putString(KEY_CONNECTION_MODE, connectionMode.name)
            .apply()
    }
}
