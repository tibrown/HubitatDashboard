# RD-17001: Scaffold Android Project

## Owner
architect

## Summary
Create the complete Android project structure inside `android/` with all Gradle build files, Hilt DI wiring, AndroidManifest, and package skeleton. This is the foundation all other tasks depend on.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

| File | Purpose |
|---|---|
| `settings.gradle.kts` | Root settings: pluginManagement, include(":app") |
| `build.gradle.kts` | Root build: version catalog or common plugin declarations |
| `gradle.properties` | androidxCore, jetpackCompose flags |
| `app/build.gradle.kts` | App module: applicationId, minSdk 26, targetSdk 35, Compose BOM, Hilt, all deps |
| `app/src/main/AndroidManifest.xml` | Package, INTERNET, ACCESS_NETWORK_STATE, usesCleartextTraffic=true, MainActivity |
| `app/src/main/java/com/timshubet/hubitatdashboard/HubitatApp.kt` | `@HiltAndroidApp` Application class |
| `app/src/main/java/com/timshubet/hubitatdashboard/MainActivity.kt` | `@AndroidEntryPoint`, sets Compose content to MainScreen |
| `app/src/main/res/values/themes.xml` | Material3 base theme |
| `app/src/main/res/mipmap-*/ic_launcher*` | Placeholder launcher icons (any color; icon polish is task 17014) |

## Dependencies (app/build.gradle.kts must include)
- Compose BOM (latest stable, e.g. 2024.x)
- `androidx.compose.material3:material3`
- `androidx.activity:activity-compose`
- `androidx.navigation:navigation-compose`
- `com.google.dagger:hilt-android` + `hilt-compiler`
- `androidx.hilt:hilt-navigation-compose`
- `com.squareup.retrofit2:retrofit` + `converter-gson`
- `com.squareup.okhttp3:okhttp` + `logging-interceptor`
- `androidx.datastore:datastore-preferences`
- `androidx.security:security-crypto` (EncryptedSharedPreferences)
- `at.favre.lib:bcrypt` (jBCrypt replacement — pure Java bcrypt)
- `io.coil-kt:coil-compose` (icon loading)
- `androidx.compose.material:material-icons-extended`

## Done Criteria
1. `./gradlew assembleDebug` runs from `android/` and produces `app-debug.apk` without errors.
2. `HubitatApp`, `MainActivity` compile with Hilt annotations.
3. All dependency versions are pinned (no `+` wildcards).
4. `AndroidManifest.xml` includes INTERNET, ACCESS_NETWORK_STATE, usesCleartextTraffic=true.
5. Package structure folders exist: `ui/`, `viewmodel/`, `data/`, `di/`.
