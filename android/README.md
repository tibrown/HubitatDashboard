# Hubitat Dashboard — Android

Native Android dashboard app for [Hubitat Elevation](https://hubitat.com/) home automation hubs.

## Features
- All 16 tile types: switches, dimmers, RGBW lights, locks, thermostats, sensors, HSM, hub mode, hub variables, and more
- Real-time updates via Server-Sent Events (SSE)
- Local WiFi + cloud (remote) connection with automatic fallback
- PIN-protected controls (HSM, mode, locks)
- Material Design 3 with dynamic colour (Android 12+)
- Dark/light/system theme toggle

## Requirements
- Android 8.0+ (API 26)
- Hubitat Elevation hub with Maker API app enabled
- Maker API access token and hub IP/cloud URL

## Setup
1. Install the APK on your device (sideload — not on Play Store)
2. Open the app → tap the ⚙ gear icon → Settings
3. Enter your hub's **local IP** (e.g. `http://192.168.1.x`) and optionally **cloud URL**
4. Paste your **Maker API access token**
5. Optionally set a **4-digit PIN** for protected controls
6. Tap **Save** — the app will connect and load your devices

## Building

### Prerequisites
- JDK 17+
- Android Studio (Hedgehog or later) or Android command-line SDK tools

### Debug build
```bash
cd android
./gradlew assembleDebug
```
APK output: `app/build/outputs/apk/debug/app-debug.apk`

### Release build
Generate a signing keystore (one-time):
```bash
keytool -genkey -v -keystore hubitat.jks -alias hubitat -keyalg RSA -keysize 2048 -validity 10000
```

Add signing config to `app/build.gradle.kts`, then:
```bash
./gradlew assembleRelease
```
APK output: `app/build/outputs/apk/release/app-release.apk`

### Sideload install
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Or copy the APK to your device and open it. Enable **Install unknown apps** in Settings → Apps for your file manager / browser.

## Architecture
- **Language**: Kotlin + Jetpack Compose (Material Design 3)
- **DI**: Hilt
- **Networking**: Retrofit + OkHttp (REST + SSE streaming)
- **Storage**: EncryptedSharedPreferences (AES-256-GCM)
- **Pattern**: MVVM — ViewModels → Repositories → API/Settings

## Connection modes
| Mode | Description |
|------|-------------|
| Local | Direct HTTP to hub on your WiFi |
| Cloud | Via Hubitat cloud relay (requires hub cloud enabled) |
| Auto | Tries local first (2s timeout), falls back to cloud |
