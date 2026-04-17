# RD-17003: Implement ConnectionResolver

## Owner
api-dev

## Summary
The `ConnectionResolver` abstracts away which URL (local hub or cloud) to use. It tries local first with a 2-second timeout in Auto mode and exposes the active connection type as a `StateFlow`.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

`app/src/main/java/com/timshubet/hubitatdashboard/data/repository/ConnectionResolver.kt`
`app/src/main/java/com/timshubet/hubitatdashboard/data/repository/SettingsRepository.kt`
`app/src/main/java/com/timshubet/hubitatdashboard/di/NetworkModule.kt`

### ConnectionResolver
```
class ConnectionResolver @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val okHttpClient: OkHttpClient
) {
    val activeConnection: StateFlow<ConnectionType>
    suspend fun resolveBaseUrl(): String  // returns full base URL for API calls
    fun buildSseUrl(): String             // returns full SSE URL
}
```

**Auto mode logic:**
1. Read `localHubIp`, `makerAppId`, `makerToken`, `connectionMode` from SettingsRepository.
2. If mode = LOCAL: return `http://<localHubIp>/apps/api/<appId>`.
3. If mode = CLOUD: return cloudHubUrl.
4. If mode = AUTO: `HEAD http://<localHubIp>/apps/api/<appId>/devices/all?access_token=<token>` with 2 s OkHttp timeout. If 200 OK → LOCAL; else → CLOUD.
5. On each app resume or `ConnectivityManager` NETWORK_AVAILABLE broadcast: re-run the probe.

### SettingsRepository
Wraps `EncryptedSharedPreferences` and exposes typed fields:
- `localHubIp: String`, `makerAppId: String`, `makerToken: String`, `cloudHubUrl: String`, `connectionMode: ConnectionMode`, `pinHash: String`
- `suspend fun save(...)` and individual `setXxx` methods.

### NetworkModule (Hilt)
Provides: singleton `OkHttpClient` (2 s probe timeout), `EncryptedSharedPreferences` instance.

## Done Criteria
1. `resolveBaseUrl()` returns correct URL for each of the 3 modes.
2. Auto mode falls back to cloud when local is unreachable within 2 s.
3. `activeConnection` emits `LOCAL` or `CLOUD` (never null after first resolution).
4. `SettingsRepository` reads/writes all 6 fields without crashing on empty prefs.
5. Hilt provides `ConnectionResolver` without unresolved bindings.
