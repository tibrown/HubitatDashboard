# Pre-Dev Research: Retrofit 2 + OkHttp SSE

**Date:** 2026-04-16
**Requested by:** api-dev
**For tasks:** 17003, 17004
**Sources:**
- https://square.github.io/retrofit/ (2026-04-16)
- https://square.github.io/okhttp/changelogs/changelog/ (2026-04-16)
- https://square.github.io/okhttp/ (2026-04-16)

---

## 1. Current Stable Versions

| Artifact | Version | Notes |
|---|---|---|
| `com.squareup.retrofit2:retrofit` | `2.11.0` | Latest stable |
| `com.squareup.retrofit2:converter-gson` | `2.11.0` | Matches Retrofit version |
| `com.squareup.okhttp3:okhttp` | `5.3.2` | Latest stable (5.x went stable 2025-07-02) |
| `com.squareup.okhttp3:okhttp-sse` | `4.12.0` | Use 4.x for EventSource API; see note below |
| `com.squareup.okhttp3:logging-interceptor` | `5.3.2` | Optional, matches okhttp version |

> ⚠️ **OkHttp 5.x vs 4.x for SSE**: OkHttp 5.x is now stable (5.0.0 released 2025-07-02, 5.3.2 is latest). The `okhttp-sse` artifact with `EventSource`/`EventSourceListener` API is from the 4.x series (`4.12.0`). For Hubitat SSE, **recommend using OkHttp 5.x with manual ResponseBody streaming** (see Section 4), which avoids the 4.x/5.x artifact mismatch. Alternatively, use OkHttp `4.12.0` + `okhttp-sse:4.12.0` if you prefer the EventSource callback API.

---

## 2. Gradle Setup (app/build.gradle.kts)

```kotlin
dependencies {
    // Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")

    // OkHttp 5.x (choose ONE of the two SSE approaches)
    implementation("com.squareup.okhttp3:okhttp:5.3.2")
    implementation("com.squareup.okhttp3:logging-interceptor:5.3.2")

    // --- OR use OkHttp 4.x + okhttp-sse for EventSource API ---
    // implementation("com.squareup.okhttp3:okhttp:4.12.0")
    // implementation("com.squareup.okhttp3:okhttp-sse:4.12.0")
}
```

---

## 3. Retrofit Interface Definition

```kotlin
interface HubitatApiService {

    // GET all devices
    @GET("apps/api/{appId}/devices")
    suspend fun getAllDevices(
        @Path("appId") appId: String,
        @Query("access_token") token: String
    ): Response<List<DeviceDto>>

    // GET device detail
    @GET("apps/api/{appId}/devices/{deviceId}")
    suspend fun getDevice(
        @Path("appId") appId: String,
        @Path("deviceId") deviceId: String,
        @Query("access_token") token: String
    ): Response<DeviceDto>

    // POST command to device
    @POST("apps/api/{appId}/devices/{deviceId}/{command}")
    suspend fun sendCommand(
        @Path("appId") appId: String,
        @Path("deviceId") deviceId: String,
        @Path("command") command: String,
        @Query("access_token") token: String,
        @Body body: Map<String, Any> = emptyMap()
    ): Response<CommandResponse>

    // POST command with secondary argument (e.g., setLevel/75)
    @POST("apps/api/{appId}/devices/{deviceId}/{command}/{arg}")
    suspend fun sendCommandWithArg(
        @Path("appId") appId: String,
        @Path("deviceId") deviceId: String,
        @Path("command") command: String,
        @Path("arg") arg: String,
        @Query("access_token") token: String
    ): Response<CommandResponse>
}
```

> **Hubitat Maker API format:** `POST /apps/api/{appId}/devices/{deviceId}/{command}?access_token={token}`
> Content-Type for POST with body: `application/json`. Commands without a body (e.g., `on`, `off`) can be sent with empty body or no body — use `@POST` with no `@Body` parameter in that case.

---

## 4. Retrofit + Hilt Module

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(2, TimeUnit.SECONDS)    // 2s timeout for ConnectionResolver probe
            .readTimeout(0, TimeUnit.SECONDS)        // 0 = no timeout (needed for SSE streaming)
            .writeTimeout(10, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        settingsRepository: SettingsRepository
    ): Retrofit {
        // Base URL will be updated at runtime via ConnectionResolver
        // Use a placeholder; rebuild Retrofit or use dynamic base URL pattern
        return Retrofit.Builder()
            .baseUrl("http://localhost/")  // overridden per-call via @Url or dynamic client
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideHubitatApiService(retrofit: Retrofit): HubitatApiService {
        return retrofit.create(HubitatApiService::class.java)
    }
}
```

> **Dynamic base URL pattern** for ConnectionResolver: Use `@Url` annotation on the Retrofit interface method to override the base URL per call. Alternatively, inject the OkHttpClient and build a new Retrofit instance when the resolved URL changes (store in SettingsRepository).

---

## 5. OkHttp SSE — Recommended Approach: Manual ResponseBody Streaming

This approach uses OkHttp 5.x and does NOT require the `okhttp-sse` artifact. It parses `data:` lines directly from the response stream, converting them to a Kotlin `Flow`.

```kotlin
class SseClient @Inject constructor(
    private val okHttpClient: OkHttpClient
) {

    fun observeEvents(url: String, accessToken: String): Flow<String> = callbackFlow {
        val request = Request.Builder()
            .url("$url?access_token=$accessToken")
            .header("Accept", "text/event-stream")
            .header("Cache-Control", "no-cache")
            .build()

        val call = okHttpClient.newCall(request)

        call.enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                close(e)
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    close(IOException("SSE connection failed: ${response.code}"))
                    return
                }
                val source = response.body?.source() ?: run {
                    close(IOException("Empty SSE body"))
                    return
                }
                try {
                    while (!source.exhausted() && isActive) {
                        val line = source.readUtf8Line() ?: break
                        when {
                            line.startsWith("data:") -> {
                                val data = line.removePrefix("data:").trim()
                                if (data.isNotEmpty()) trySend(data)
                            }
                            line.startsWith("event:") -> { /* handle event type if needed */ }
                            line.isBlank() -> { /* end of SSE event block */ }
                        }
                    }
                } catch (e: IOException) {
                    if (isActive) close(e)
                } finally {
                    source.close()
                    response.close()
                }
            }
        })

        awaitClose { call.cancel() }
    }
}
```

> **`isActive`** checks the coroutine scope state so the loop exits cleanly when the scope is cancelled. `awaitClose { call.cancel() }` cancels the OkHttp call when the collector cancels.

---

## 6. Alternative: OkHttp 4.x EventSource API (okhttp-sse)

If using OkHttp `4.12.0` + `okhttp-sse:4.12.0`:

```kotlin
fun observeEventsWithEventSource(url: String): Flow<String> = callbackFlow {
    val request = Request.Builder()
        .url(url)
        .header("Accept", "text/event-stream")
        .build()

    val factory = ServerSentEvents.createFactory(okHttpClient)
    val listener = object : EventSourceListener() {
        override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
            trySend(data)
        }
        override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
            close(t ?: IOException("SSE failure"))
        }
        override fun onClosed(eventSource: EventSource) {
            close()
        }
    }

    val eventSource = factory.newEventSource(request, listener)

    awaitClose { eventSource.cancel() }
}
```

> **Auto-reconnect:** OkHttp's `EventSource` does NOT auto-reconnect. Implement exponential backoff manually if needed:
```kotlin
suspend fun observeWithBackoff(url: String): Flow<String> = flow {
    var delayMs = 1_000L
    while (true) {
        try {
            observeEvents(url).collect { emit(it) }
            delayMs = 1_000L  // reset on clean close
        } catch (e: IOException) {
            delay(delayMs)
            delayMs = (delayMs * 2).coerceAtMost(30_000L)
        }
    }
}
```

---

## 7. Cancellation Pattern

```kotlin
// In ViewModel:
private var sseJob: Job? = null

fun startLiveUpdates(baseUrl: String, token: String) {
    sseJob?.cancel()
    sseJob = viewModelScope.launch {
        sseClient.observeEvents(baseUrl, token)
            .catch { e -> /* handle error, update UI state */ }
            .collect { eventJson ->
                // parse and update state
            }
    }
}

override fun onCleared() {
    super.onCleared()
    sseJob?.cancel()
}
```

---

## 8. Hubitat Maker API — Content-Type Notes

- **GET requests:** no body, `access_token` as query param
- **POST commands:** `Content-Type: application/json`, body can be empty `{}` or contain params (e.g., `{"level": 75}` for `setLevel`)
- **SSE stream:** `GET /apps/api/{appId}/devices/events?access_token={token}` — accept `text/event-stream`
- Each SSE `data:` line is a JSON object: `{"name":"switch","value":"on","deviceId":123,...}`

---

## Summary

Use Retrofit `2.11.0` + OkHttp `5.3.2`. For SSE, use the manual `ResponseBody` streaming approach wrapped in `callbackFlow` — no extra artifact needed. Define Retrofit interfaces with `suspend` functions returning `Response<T>`. Provide via `@Module + @InstallIn(SingletonComponent::class)`. Use `@Url` annotation or dynamic Retrofit instance for base URL switching (ConnectionResolver pattern).
