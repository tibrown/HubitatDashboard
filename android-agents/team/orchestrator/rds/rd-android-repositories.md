# RD-17005: Implement DeviceRepository and PinRepository

## Owner
api-dev

## Summary
`DeviceRepository` is the single source of truth for all device state — it fetches from REST on startup and applies live SSE deltas. `PinRepository` handles bcrypt PIN storage and local verification.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

### `data/repository/DeviceRepository.kt`
```
class DeviceRepository @Inject constructor(
    private val apiService: HubitatApiService,
    private val sseClient: SseClient,
    private val connectionResolver: ConnectionResolver,
    private val settingsRepository: SettingsRepository
) {
    val devices: StateFlow<Map<String, DeviceState>>
    val hsmStatus: StateFlow<HsmMode>
    val modes: StateFlow<List<HubMode>>
    val hubVariables: StateFlow<List<HubVariable>>
    val connectionStatus: StateFlow<ConnectionStatus>  // CONNECTED | RECONNECTING | POLLING

    suspend fun refresh()           // full REST re-fetch
    suspend fun sendCommand(deviceId: String, command: String, value: String? = null): Result<Unit>
    suspend fun setHsmMode(mode: String): Result<Unit>
    suspend fun setMode(modeId: String): Result<Unit>
    suspend fun setHubVariable(name: String, value: String): Result<Unit>
}
```

**Startup sequence:**
1. Call `refresh()` to fill `devices`, `hsmStatus`, `modes`, `hubVariables`.
2. Call `sseClient.connect()`.
3. Collect `sseClient.events` in a coroutine; for each `SSEEvent` update `devices[deviceId].attributes[attribute] = newValue`.

`ConnectionStatus` enum: `CONNECTED` (SSE live), `RECONNECTING` (SSE dropped, retrying), `POLLING` (SSE permanently down, polling every 30 s).

### `data/repository/PinRepository.kt`
```
class PinRepository @Inject constructor(
    private val settingsRepository: SettingsRepository
) {
    fun setPin(plainPin: String)            // hashes with BCrypt.hashpw(pin, BCrypt.gensalt())
    fun verifyPin(plainPin: String): Boolean // BCrypt.checkpw(pin, storedHash)
    fun isPinSet(): Boolean
}
```
Use `at.favre.lib:bcrypt` (cost factor 10).

### `di/RepositoryModule.kt` (Hilt)
Provides `DeviceRepository` and `PinRepository` as singletons.

## Done Criteria
1. `DeviceRepository.devices` updates when an SSE event arrives (testable with a fake SseClient).
2. `sendCommand()` returns `Result.success(Unit)` on 2xx and `Result.failure(...)` on error.
3. `PinRepository.verifyPin("1234")` returns true after `setPin("1234")`.
4. `PinRepository.verifyPin("9999")` returns false when PIN is "1234".
5. No raw PIN stored anywhere (only bcrypt hash in EncryptedSharedPreferences).
