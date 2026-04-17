# Pre-Dev Research: Hilt Android DI

**Date:** 2026-04-16
**Requested by:** architect, api-dev
**For tasks:** 17001, 17002, 17003, 17004, 17005
**Sources:**
- https://developer.android.com/training/dependency-injection/hilt-android (2026-04-16)

---

## 1. Current Stable Version

**Hilt version: `2.57.1`** (shown on official docs as of 2026-04-16)

All required artifacts:
| Artifact | Version |
|---|---|
| `com.google.dagger:hilt-android` | `2.57.1` |
| `com.google.dagger:hilt-android-compiler` (ksp) | `2.57.1` |
| `androidx.hilt:hilt-navigation-compose` | `1.2.0` |

---

## 2. Gradle Setup

### settings.gradle.kts / build.gradle.kts (root)
```kotlin
// Root build.gradle.kts
plugins {
    id("com.google.dagger.hilt.android") version "2.57.1" apply false
    id("com.google.devtools.ksp") version "2.0.21-1.0.28" apply false
}
```

### app/build.gradle.kts
```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}

android {
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.57.1")
    ksp("com.google.dagger:hilt-android-compiler:2.57.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
}
```

> ⚠️ Use KSP (not KAPT). Hilt's official docs show KSP as the preferred processor for Kotlin projects as of 2.x.

---

## 3. Annotation Sequence — Bootstrap

### Application class
```kotlin
@HiltAndroidApp
class HubitatApp : Application()
```

### Activity
```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { /* Compose UI */ }
    }
}
```

### ViewModel
```kotlin
@HiltViewModel
class DeviceViewModel @Inject constructor(
    private val deviceRepository: DeviceRepository
) : ViewModel() {
    // ...
}
```

Obtain in Compose:
```kotlin
@Composable
fun DeviceScreen(viewModel: DeviceViewModel = hiltViewModel()) {
    // ...
}
```
> `hiltViewModel()` requires `androidx.hilt:hilt-navigation-compose:1.2.0`.

---

## 4. Hilt Module — @Module + @InstallIn + @Provides

### Providing external/3rd-party types with @Provides
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl("http://placeholder/")  // set at runtime via ConnectionResolver
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return PreferenceDataStoreFactory.create(
            produceFile = { context.preferencesDataStoreFile("user_prefs") }
        )
    }
}
```

### Providing Context with @ApplicationContext
```kotlin
@Provides
@Singleton
fun provideSettingsRepository(
    @ApplicationContext context: Context,
    dataStore: DataStore<Preferences>
): SettingsRepository {
    return SettingsRepositoryImpl(context, dataStore)
}
```

---

## 5. Interface Binding with @Binds

Use `@Binds` (abstract function in abstract module) when you want Hilt to bind an implementation to its interface. The implementation must be `@Inject`-constructable.

```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindDeviceRepository(
        impl: DeviceRepositoryImpl
    ): DeviceRepository

    @Binds
    @Singleton
    abstract fun bindSettingsRepository(
        impl: SettingsRepositoryImpl
    ): SettingsRepository
}
```

> ⚠️ `@Binds` requires the class to be `abstract`. You **cannot** mix `@Binds` and `@Provides` in the same `object` — split into an `abstract class` for `@Binds` and a separate `object` for `@Provides`.

---

## 6. Scoping Rules

| Annotation | Scope | Lifetime | Use for |
|---|---|---|---|
| `@Singleton` | `SingletonComponent` | Application lifetime | OkHttpClient, Retrofit, DataStore, Repositories |
| `@ActivityRetainedScoped` | `ActivityRetainedComponent` | Survives rotation, dies with Activity | Shared state across fragments |
| `@ViewModelScoped` | `ViewModelComponent` | ViewModel lifetime | Use cases scoped to one ViewModel |

**Recommendation for this project:**
- `@Singleton`: OkHttpClient, Retrofit, DataStore, SettingsRepository, DeviceRepository, HubitatApiService
- `@HiltViewModel` (implicitly `@ViewModelScoped`): DeviceViewModel, SettingsViewModel

---

## 7. Constructor Injection for Repository in ViewModel

```kotlin
class DeviceRepositoryImpl @Inject constructor(
    private val apiService: HubitatApiService,
    private val settingsRepository: SettingsRepository
) : DeviceRepository {
    // ...
}

@HiltViewModel
class DeviceViewModel @Inject constructor(
    private val deviceRepository: DeviceRepository  // injected as interface
) : ViewModel() {
    // ...
}
```

---

## 8. AGP / Compose Compatibility

- Hilt 2.57.1 is compatible with **AGP 8.x** — no known breaking issues.
- Hilt 2.x requires **KSP** (recommended) or KAPT. KSP is faster and the preferred approach.
- KSP version must match the Kotlin version: for Kotlin 2.0.21, use KSP `2.0.21-1.0.28`.
- No compatibility issues with Compose BOM `2026.03.00`.

---

## Summary

Use Hilt `2.57.1` with KSP. Apply `@HiltAndroidApp` on Application, `@AndroidEntryPoint` on Activity, `@HiltViewModel` on ViewModels. Use `@Module + @InstallIn(SingletonComponent::class) + @Provides + @Singleton` for network/data dependencies, `@Binds` in abstract modules for interface-to-implementation binding. Use `hiltViewModel()` composable for ViewModel injection in Compose.
