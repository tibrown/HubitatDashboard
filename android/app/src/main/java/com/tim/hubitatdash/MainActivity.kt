package com.tim.hubitatdash

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.core.content.ContextCompat
import com.tim.hubitatdash.data.repository.SettingsRepository
import com.tim.hubitatdash.ui.shell.MainScreen
import com.tim.hubitatdash.ui.theme.HubitatDashboardTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var settingsRepository: SettingsRepository

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* user responded; they can also adjust later in Settings */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val darkTheme = when (settingsRepository.getDarkMode()) {
                "dark" -> true
                "light" -> false
                else -> isSystemInDarkTheme()
            }
            HubitatDashboardTheme(darkTheme = darkTheme) {
                MainScreen(
                    isConfigured = settingsRepository.isConfigured(),
                    isDarkTheme = darkTheme,
                    onThemeToggle = {
                        val next = when (settingsRepository.getDarkMode()) {
                            "system" -> "dark"
                            "dark" -> "light"
                            else -> "system"
                        }
                        settingsRepository.setDarkMode(next)
                        recreate()
                    }
                )
            }
        }
    }

    override fun onStart() {
        super.onStart()
        requestAppPermissions()
    }

    private fun requestAppPermissions() {
        val permissions = buildList {
            add(Manifest.permission.ACCESS_FINE_LOCATION)
            add(Manifest.permission.ACCESS_COARSE_LOCATION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        val notGranted = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (notGranted.isNotEmpty()) {
            permissionLauncher.launch(notGranted.toTypedArray())
        }
    }
}

