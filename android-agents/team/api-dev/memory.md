# Memory - api-dev

_Decisions, constraints, and context worth keeping between sessions._

---

## Research Delivered: Hilt Android DI — 2026-04-16

**Report:** team/research/output/predev-hilt-android-2026-04-16.md
**For tasks:** 17002, 17003, 17004, 17005
**Summary:** Use Hilt `2.57.1` with KSP. All repositories should be `@Singleton`-scoped and provided via `@Module + @InstallIn(SingletonComponent::class)`. Use `@Binds` in abstract modules to bind interface implementations.
**Key finding:** Split `@Binds` (abstract class) and `@Provides` (object) into separate modules. Use `@ApplicationContext` to inject Context. `@HiltViewModel` handles ViewModel scoping automatically.
**Action:** Inject repositories via constructor injection (`@Inject constructor`). Provide OkHttpClient, Retrofit, DataStore in a `NetworkModule` object with `@Provides @Singleton`.

---

## Research Delivered: Retrofit + OkHttp SSE — 2026-04-16

**Report:** team/research/output/predev-retrofit-okhttp-sse-2026-04-16.md
**For tasks:** 17003, 17004
**Summary:** Use Retrofit `2.11.0` + OkHttp `5.3.2`. For Hubitat SSE, use manual `ResponseBody` streaming wrapped in `callbackFlow` — no extra artifact needed with OkHttp 5.x.
**Key finding:** SSE streaming requires `readTimeout(0)` on OkHttpClient (infinite read timeout). Use `awaitClose { call.cancel() }` so the OkHttp call is cancelled when the coroutine scope is cancelled. Each SSE `data:` line from Hubitat is a JSON string.
**Action:**
```kotlin
// Gradle:
implementation("com.squareup.retrofit2:retrofit:2.11.0")
implementation("com.squareup.retrofit2:converter-gson:2.11.0")
implementation("com.squareup.okhttp3:okhttp:5.3.2")
implementation("com.squareup.okhttp3:logging-interceptor:5.3.2")

// OkHttpClient for SSE (use a separate client with no read timeout):
OkHttpClient.Builder().readTimeout(0, TimeUnit.SECONDS).build()

// Hubitat POST command URL pattern:
// POST /apps/api/{appId}/devices/{deviceId}/{command}?access_token={token}
// SSE URL: GET /apps/api/{appId}/devices/events?access_token={token}
```

---

## Research Delivered: DataStore + EncryptedSharedPreferences — 2026-04-16

**Report:** team/research/output/predev-datastore-encryptedprefs-2026-04-16.md
**For tasks:** 17003, 17014
**Summary:** Use `datastore-preferences:1.2.1` for non-sensitive settings (hub IP/URL, connection mode). Use `security-crypto:1.1.0-alpha06` + `MasterKey.AES256_GCM` for PIN hash and access token in EncryptedSharedPreferences.
**Key finding:** Never create more than one DataStore instance per file — Hilt `@Singleton` enforces this. Access token and PIN bcrypt hash go in EncryptedSharedPreferences; everything else in DataStore.
**Action:**
```kotlin
// Gradle:
implementation("androidx.datastore:datastore-preferences:1.2.1")
implementation("androidx.security:security-crypto:1.1.0-alpha06")

// DataStore key definitions:
val HUB_LOCAL_IP  = stringPreferencesKey("hub_local_ip")
val HUB_CLOUD_URL = stringPreferencesKey("hub_cloud_url")
val APP_ID        = stringPreferencesKey("app_id")

// EncryptedSharedPreferences for PIN hash:
val masterKey = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
EncryptedSharedPreferences.create(context, "secure_prefs", masterKey,
    PrefKeyEncryptionScheme.AES256_SIV, PrefValueEncryptionScheme.AES256_GCM)
```

---

## Research Delivered: BCrypt on Android — 2026-04-16

**Report:** team/research/output/predev-bcrypt-android-2026-04-16.md
**For tasks:** 17005
**Summary:** Use `at.favre.lib:bcrypt:0.10.2`. Hash PIN with cost 10. Pure Java — no ProGuard rules needed. MUST run on `Dispatchers.IO`.
**Key finding:** `BCrypt.verifyer().verify(pin.toCharArray(), storedHash).verified` returns the Boolean result. Always use `withContext(Dispatchers.IO)` — bcrypt at cost 10 takes ~50-150ms.
**Action:**
```kotlin
// Gradle:
implementation("at.favre.lib:bcrypt:0.10.2")

// Hash (on Dispatchers.IO):
BCrypt.withDefaults().hashToString(10, pin.toCharArray())

// Verify (on Dispatchers.IO):
BCrypt.verifyer().verify(pin.toCharArray(), storedHash).verified
```

---

Research pre-flight complete. All reports are in team/research/output/. Check your memory.md for handoff notes before starting any task.

---

## Task 17004 Complete — 2026-04-16

Files created:
- `data/api/HubitatApiService.kt` — Retrofit interface with all 10 Maker API endpoints: getAllDevices, getDevice, sendCommand, sendCommandWithValue, getHsmStatus, setHsmMode, getModes, setMode, getHubVariables, setHubVariable. Also contains `HsmStatusResponse` data class.
- `data/api/SseClient.kt` — `@Singleton`, opens `GET <baseUrl>/sse?access_token=<token>` via manual OkHttp ResponseBody streaming (no okhttp-sse artifact). Reconnects with exponential backoff (1s→2s→4s…→30s max), re-resolving URL via `ConnectionResolver` on each retry. `MutableSharedFlow<SSEEvent>` with 64-slot buffer. Parses Hubitat SSE JSON format `{deviceId, name, value}`.
- `di/ApiModule.kt` — `@InstallIn(SingletonComponent::class)` object; provides singleton `Retrofit` (placeholder base URL `http://localhost/`, GsonConverterFactory) and singleton `HubitatApiService`. Dynamic base URL pattern documented in file header comment.

Key implementation note for task 17005 (DeviceRepository): Retrofit is initialized with `http://localhost/` placeholder. Use `retrofit.newBuilder().baseUrl("$resolvedUrl/").build()` to create a per-call instance with the real hub URL before invoking API methods.

---

## Task 17003 Complete — 2026-04-16

Files created/updated:
- `data/repository/SettingsRepository.kt` — wraps `@Named("encrypted")` SharedPreferences, exposes all 8 keys (localHubIp, makerAppId, makerToken, cloudHubUrl, connectionMode, pinHash, groupOrder, themeOverride) with typed getters and individual setters, plus `saveAll()` and `isConfigured()`.
- `data/repository/ConnectionResolver.kt` — `@Singleton`, `resolveBaseUrl()` returns correct base URL for LOCAL/CLOUD/AUTO; AUTO probes local with 2s connect+read timeout via `okHttpClient.newBuilder()`, falls back to cloud on failure. `buildSseUrl(baseUrl)` appends SSE path + token.
- `di/NetworkModule.kt` — `@InstallIn(SingletonComponent::class)` object; provides singleton `OkHttpClient` (with BASIC logging) and `@Named("encrypted")` EncryptedSharedPreferences using `MasterKey.AES256_GCM`.
- `viewmodel/SettingsViewModel.kt` — now injects `SettingsRepository` and `ConnectionResolver`; `init` pre-populates UI state from saved settings; `save()` calls `settingsRepository.saveAll()`; `testConnection()` calls `connectionResolver.resolveBaseUrl()` and shows result.

No raw PIN stored — PIN hash wiring deferred to task 17005.


## Task 17002 Complete — 2026-04-16

All 11 Kotlin data model files created in `app/src/main/java/com/timshubet/hubitatdashboard/data/model/`:
- `DeviceState.kt` (uses `com.google.gson.JsonElement` for attributes map)
- `SSEEvent.kt`
- `TileType.kt` (16 values: SWITCH, DIMMER, RGBW, CONTACT, MOTION, TEMPERATURE, POWER_METER, BUTTON, LOCK, CONNECTOR, HUB_VARIABLE, HSM, MODE, RING_DETECTION, PRESENCE, BATTERY)
- `TileConfig.kt`
- `GroupConfig.kt`
- `ConnectionType.kt`
- `HsmMode.kt` (companion `fromApiValue`)
- `HubMode.kt`
- `HubVariable.kt`
- `ConnectionMode.kt` (companion `fromString`) — needed by task 17003
- `ConnectionStatus.kt` — needed by task 17005

---

## Task 17005 Complete — 2026-04-16

Files created/updated:
- `data/repository/DeviceRepository.kt` — `@Singleton`; merges REST + SSE into `StateFlow<Map<String, DeviceState>>`; exposes `hsmStatus`, `modes`, `hubVariables`, `connectionStatus`; `refresh()` fetches all REST data then calls `sseClient.connect()`; `collectSseEvents()` updates device attributes map on each SSE event; `sendCommand/setHsmMode/setMode/setHubVariable` each resolve a fresh Retrofit service via `retrofit.newBuilder().baseUrl(resolvedUrl)` before calling the API.
- `data/repository/PinRepository.kt` — `@Singleton`; `setPin()` and `verifyPin()` both wrapped in `withContext(Dispatchers.IO)`; uses `BCrypt.withDefaults().hashToString(12, ...)` to hash and `BCrypt.verifyer().verify(...).verified` to check; no raw PIN stored.
- `di/RepositoryModule.kt` — placeholder file documenting that `DeviceRepository` and `PinRepository` are self-provided via `@Inject constructor` — no `@Provides` bindings needed.
- `viewmodel/SettingsViewModel.kt` — updated to inject `PinRepository`; `save()` now calls `pinRepository.setPin(state.pin)` when a non-empty PIN is provided.
- Removed `data/repository/.gitkeep`.

Key pattern: Dynamic base URL in `DeviceRepository.resolvedService()` — call `retrofit.newBuilder().baseUrl(resolvedUrl).addConverterFactory(GsonConverterFactory.create()).build().create(HubitatApiService::class.java)` before each API call batch (same pattern documented in task 17004 notes).

