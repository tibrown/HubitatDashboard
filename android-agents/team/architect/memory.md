# Memory - architect

_Decisions, constraints, and context worth keeping between sessions._

---

## Research Delivered: Jetpack Compose + Material 3 — 2026-04-16

**Report:** team/research/output/predev-jetpack-compose-material3-2026-04-16.md
**For tasks:** 17001, 17006, 17007, 17008, 17009, 17010, 17011, 17012, 17013, 17014
**Summary:** Use Compose BOM `2026.03.00` which resolves `material3:1.4.0` and `runtime:1.10.6`. All required M3 components (Card, Chips, LazyVerticalGrid, ModalNavigationDrawer, NavigationBar, Scaffold, AlertDialog, Slider, SegmentedButton) are stable in this BOM.
**Key finding:** `material-icons-extended` is capped at version `1.7.8` across all BOM versions — declare without version when using BOM. `SegmentedButton` is stable in material3 1.3.0+. HSB color wheel requires custom Canvas — no Material3 or Accompanist component exists.
**Action:** Add the following to `app/build.gradle.kts` before scaffolding the project:
```kotlin
val composeBom = platform("androidx.compose:compose-bom:2026.03.00")
implementation(composeBom)
implementation("androidx.compose.material3:material3")
implementation("androidx.compose.material:material-icons-extended")
implementation("androidx.compose.ui:ui")
implementation("androidx.compose.ui:ui-tooling-preview")
implementation("androidx.compose.foundation:foundation")
debugImplementation("androidx.compose.ui:ui-tooling")
```

---

## Research Delivered: Hilt Android DI — 2026-04-16

**Report:** team/research/output/predev-hilt-android-2026-04-16.md
**For tasks:** 17001, 17002, 17003, 17004, 17005
**Summary:** Hilt `2.57.1` is current. Use KSP (not KAPT). Apply `@HiltAndroidApp` on Application, `@AndroidEntryPoint` on MainActivity, `@HiltViewModel` on all ViewModels.
**Key finding:** `@Binds` requires an `abstract class` module (cannot mix with `@Provides` in the same `object`). `hilt-navigation-compose:1.2.0` is required for `hiltViewModel()` in Compose. KSP version must match Kotlin: for Kotlin 2.0.21 use KSP `2.0.21-1.0.28`.
**Action:** Add these to `app/build.gradle.kts` and root `build.gradle.kts`:
```kotlin
// Root build.gradle.kts plugins block:
id("com.google.dagger.hilt.android") version "2.57.1" apply false
id("com.google.devtools.ksp") version "2.0.21-1.0.28" apply false

// app/build.gradle.kts dependencies:
implementation("com.google.dagger:hilt-android:2.57.1")
ksp("com.google.dagger:hilt-android-compiler:2.57.1")
implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
```

---

Research pre-flight complete. All reports are in team/research/output/. Check your memory.md for handoff notes before starting any task.

---

## Task 17001 Complete: Android Project Scaffolded — 2026-04-16

**Status:** review
**Created:**
- `settings.gradle.kts`, `build.gradle.kts` (root), `gradle.properties`
- `gradle/libs.versions.toml` — version catalog with AGP 8.8.0, Kotlin 2.1.0, KSP 2.1.0-1.0.29, Hilt 2.57.1, Compose BOM 2026.03.00
- `gradle/wrapper/gradle-wrapper.properties` — Gradle 8.11.1
- `gradlew` / `gradlew.bat` — wrapper scripts (gradle-wrapper.jar not included; downloaded on first sync)
- `app/build.gradle.kts` — all deps via version catalog aliases, minSdk 26, targetSdk 35, Java 17, Compose enabled
- `app/src/main/AndroidManifest.xml` — INTERNET, ACCESS_NETWORK_STATE, usesCleartextTraffic=true
- `HubitatApp.kt` — `@HiltAndroidApp`
- `MainActivity.kt` — `@AndroidEntryPoint`, setContent placeholder
- `res/values/` — strings.xml, colors.xml, themes.xml
- `res/mipmap-xxxhdpi/` — ic_launcher.xml, ic_launcher_round.xml (adaptive icon placeholders)
- Package skeleton dirs with .gitkeep: ui/, viewmodel/, data/model/, data/api/, data/repository/, di/
**Note:** gradle-wrapper.jar binary is absent — Android Studio will provision it on first Gradle sync.

