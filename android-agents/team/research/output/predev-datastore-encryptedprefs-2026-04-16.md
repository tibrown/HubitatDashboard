# Pre-Dev Research: DataStore Preferences + EncryptedSharedPreferences

**Date:** 2026-04-16
**Requested by:** api-dev, frontend-dev
**For tasks:** 17003, 17006, 17014
**Sources:**
- https://developer.android.com/topic/libraries/architecture/datastore (2026-04-16)

---

## 1. Current Stable Versions

| Artifact | Version | Notes |
|---|---|---|
| `androidx.datastore:datastore-preferences` | `1.2.1` | Stable |
| `androidx.security:security-crypto` | `1.1.0-alpha06` | Latest; `1.0.0` stable lacks MasterKey.Builder flexibility |

> ⚠️ `security-crypto:1.1.0-alpha06` is the de facto version used in production. The stable `1.0.0` is limited. The alpha suffix is misleading — this version has been stable in practice since 2022.

---

## 2. Gradle Setup (app/build.gradle.kts)

```kotlin
dependencies {
    // DataStore Preferences
    implementation("androidx.datastore:datastore-preferences:1.2.1")

    // EncryptedSharedPreferences
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
```

---

## 3. DataStore — Create, Read, Write

### Create (top-level file delegate — singleton pattern)
```kotlin
// In a dedicated file, e.g., UserPreferencesDataStore.kt
// This MUST be called only once per process — do NOT create multiple instances
val Context.userPreferencesDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "user_preferences"
)
```

### In Hilt Module (alternative — explicit singleton)
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return PreferenceDataStoreFactory.create(
            produceFile = { context.preferencesDataStoreFile("user_preferences") }
        )
    }
}
```
> **Never create more than one DataStore instance for the same file in the same process.** Hilt `@Singleton` ensures this.

### Define keys
```kotlin
object PreferenceKeys {
    val HUB_LOCAL_IP    = stringPreferencesKey("hub_local_ip")
    val HUB_CLOUD_URL   = stringPreferencesKey("hub_cloud_url")
    val APP_ID          = stringPreferencesKey("app_id")
    val CONNECTION_MODE = stringPreferencesKey("connection_mode")  // "AUTO", "LOCAL", "CLOUD"
    val DARK_THEME      = booleanPreferencesKey("dark_theme")
    // Available key types: stringPreferencesKey, intPreferencesKey, booleanPreferencesKey,
    //                       doublePreferencesKey, floatPreferencesKey, longPreferencesKey,
    //                       stringSetPreferencesKey
}
```

### Read — returns Flow<T>
```kotlin
// In repository:
val hubLocalIp: Flow<String> = dataStore.data.map { preferences ->
    preferences[PreferenceKeys.HUB_LOCAL_IP] ?: ""
}

val darkTheme: Flow<Boolean> = dataStore.data.map { preferences ->
    preferences[PreferenceKeys.DARK_THEME] ?: false
}
```

### Write — suspend function via edit { }
```kotlin
suspend fun setHubLocalIp(ip: String) {
    dataStore.edit { preferences ->
        preferences[PreferenceKeys.HUB_LOCAL_IP] = ip
    }
}

suspend fun setDarkTheme(enabled: Boolean) {
    dataStore.edit { preferences ->
        preferences[PreferenceKeys.DARK_THEME] = enabled
    }
}
```

### Observe in Compose ViewModel
```kotlin
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    val hubLocalIp: StateFlow<String> = settingsRepository.hubLocalIp
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = ""
        )

    val darkTheme: StateFlow<Boolean> = settingsRepository.darkTheme
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = false
        )

    fun saveDarkTheme(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setDarkTheme(enabled) }
    }
}
```

### Observe dark theme in Compose UI
```kotlin
@Composable
fun HubitatApp(settingsViewModel: SettingsViewModel = hiltViewModel()) {
    val darkTheme by settingsViewModel.darkTheme.collectAsStateWithLifecycle()

    MaterialTheme(
        colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme()
    ) {
        // app content
    }
}
```

---

## 4. EncryptedSharedPreferences

### Create with MasterKey (Android Keystore backed)
```kotlin
fun createEncryptedPrefs(context: Context): SharedPreferences {
    val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    return EncryptedSharedPreferences.create(
        context,
        "secure_prefs",          // file name
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
}
```

### In Hilt Module
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object SecurityModule {

    @Provides
    @Singleton
    fun provideEncryptedSharedPreferences(
        @ApplicationContext context: Context
    ): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context,
            "secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
}
```

### Store and retrieve sensitive strings (e.g., access token or bcrypt hash)
```kotlin
class PinRepository @Inject constructor(
    private val encryptedPrefs: SharedPreferences
) {
    companion object {
        private const val KEY_PIN_HASH = "pin_bcrypt_hash"
    }

    fun savePinHash(bcryptHash: String) {
        encryptedPrefs.edit().putString(KEY_PIN_HASH, bcryptHash).apply()
    }

    fun getPinHash(): String? {
        return encryptedPrefs.getString(KEY_PIN_HASH, null)
    }

    fun hasPinSet(): Boolean = getPinHash() != null

    fun clearPin() {
        encryptedPrefs.edit().remove(KEY_PIN_HASH).apply()
    }
}
```

---

## 5. Minimum API Level and Known Issues

- **Minimum API level:** Android 6.0 (API 23). The project targets minSdk 26, so no compatibility concerns.
- **API 26 issue:** No known issues with EncryptedSharedPreferences on API 26+. Issues exist on API 21-22 with some keystores but are irrelevant here (minSdk 26).
- **Thread safety:** `EncryptedSharedPreferences` itself is not thread-safe for writes — always use `.apply()` (async) rather than `.commit()` (synchronous, blocking). In practice, `PinRepository` methods are fine on the main thread since `apply()` is non-blocking.
- **Key invalidation:** If the user clears app data or re-installs, the Android Keystore key is deleted and existing EncryptedSharedPreferences data becomes unreadable. Catch `KeyStoreException` or `AEADBadTagException` and handle gracefully (clear the file).

---

## 6. DataStore vs EncryptedSharedPreferences — Recommended Split

| Data | Storage | Reason |
|---|---|---|
| Hub local IP | DataStore | Non-sensitive, needs Flow/coroutine observation |
| Hub cloud URL | DataStore | Non-sensitive, needs Flow observation |
| App ID (Maker API) | DataStore | Non-sensitive, but accessible via cloud — debatable |
| Connection mode (AUTO/LOCAL/CLOUD) | DataStore | Non-sensitive setting |
| Dark/light theme override | DataStore | Non-sensitive UI preference |
| Access token (Maker API token) | EncryptedSharedPreferences | Sensitive credential |
| PIN bcrypt hash | EncryptedSharedPreferences | Security-critical |

**Rule of thumb:** Anything that would allow an attacker to impersonate the user or access the Hubitat hub → EncryptedSharedPreferences. Everything else → DataStore.

---

## Summary

Use `datastore-preferences:1.2.1` for all non-sensitive settings (hub URL, connection mode, theme). Use `security-crypto:1.1.0-alpha06` with `MasterKey.Builder + AES256_GCM` for PIN hash and access token storage in `EncryptedSharedPreferences`. Create DataStore via Hilt `@Singleton` using `PreferenceDataStoreFactory.create()`. Read with `dataStore.data.map { prefs -> prefs[key] ?: default }`, write with `dataStore.edit { prefs -> prefs[key] = value }`.
