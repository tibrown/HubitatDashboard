# RD-17004: Implement HubitatApiService and SseClient

## Owner
api-dev

## Summary
Retrofit interface for all Hubitat Maker API REST calls, plus an OkHttp-based SSE client that streams real-time device state changes.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

### `data/api/HubitatApiService.kt`
Retrofit `interface` with the following endpoints (all paths are relative to the resolved base URL from `ConnectionResolver`):

| Method | Path | Returns |
|---|---|---|
| GET | `devices/all?access_token={token}` | `List<DeviceState>` |
| GET | `devices/{id}?access_token={token}` | `DeviceState` |
| GET | `devices/{id}/{command}?access_token={token}` | `Response<Unit>` |
| GET | `devices/{id}/{command}/{value}?access_token={token}` | `Response<Unit>` |
| GET | `hsm?access_token={token}` | `HsmStatusResponse` |
| GET | `hsm/{mode}?access_token={token}` | `Response<Unit>` |
| GET | `modes?access_token={token}` | `List<HubMode>` |
| GET | `modes/{id}?access_token={token}` | `Response<Unit>` |
| GET | `hubvariables?access_token={token}` | `List<HubVariable>` |
| POST | `hubvariables/{name}?access_token={token}` | `Response<Unit>` (body: `{"value": ...}`) |

Also add `data class HsmStatusResponse(val hsm: String)`.

### `data/api/SseClient.kt`
```
class SseClient @Inject constructor(
    private val connectionResolver: ConnectionResolver,
    private val settingsRepository: SettingsRepository
) {
    val events: SharedFlow<SSEEvent>
    fun connect()
    fun disconnect()
}
```
- Opens `GET <baseUrl>/sse?access_token=<token>` as an OkHttp `EventSource`.
- Parses each `data:` line as `SSEEvent` (JSON: `{deviceId, attribute, value}`).
- On error: exponential backoff (1 s → 2 s → 4 s → 8 s → 30 s max), re-resolve URL via `ConnectionResolver` on each retry.
- `disconnect()` cancels the `EventSource` and resets backoff.

### `di/ApiModule.kt` (Hilt)
Provides: `Retrofit` singleton (GsonConverterFactory), `HubitatApiService`, `SseClient`.
Note: Retrofit base URL is a placeholder (`http://localhost/`) — actual URL is injected per-call by the repository.

## Done Criteria
1. `HubitatApiService` compiles with all 10 endpoint methods.
2. `SseClient.events` emits `SSEEvent` objects when connected to a live hub (or mock server).
3. `SseClient` reconnects after a simulated network drop with backoff delays.
4. Hilt provides `HubitatApiService` and `SseClient` without unresolved bindings.
