# GitHub Copilot Instructions

## Environment

### Java
- **JAVA_HOME**: `C:\Users\gikjl\.jdk17\jdk-17.0.11+9`
- Java 17 (Eclipse Temurin) is required for the Android build.

### Android SDK
- **ANDROID_HOME**: `C:\Users\gikjl\Android\Sdk`

### Gradle
- Gradle wrapper is at: `C:\Users\gikjl\.gradle-8.11.1\bin\gradle.bat`

## Build

From the `android/` directory:

```powershell
$env:JAVA_HOME="C:\Users\gikjl\.jdk17\jdk-17.0.11+9"
$env:ANDROID_HOME="C:\Users\gikjl\Android\Sdk"
C:\Users\gikjl\.gradle-8.11.1\bin\gradle.bat assembleDebug --no-daemon --console=plain
```

## Project Structure

- `android/` — Android app (Kotlin, Jetpack Compose, Hilt)
- `backend/` — Node.js backend
- `frontend/` — React frontend
- `docker-compose.yml` — Runs backend + frontend together

## Android Architecture

- **UI**: Jetpack Compose, screens in `ui/`
- **DI**: Hilt — modules in `di/`
- **Data**: repositories in `data/repository/`, models in `data/model/`
- **ViewModels**: `DeviceViewModel`, `SettingsViewModel` in `viewmodel/`
- `GroupRepository` manages edit-mode group state persisted via SharedPreferences (file: `group_store`) using Gson.
- Static group config is in `data/model/groups.kt` (Kotlin port of `frontend/src/config/groups.ts`).
