# Pre-Dev Research: BCrypt on Android (at.favre.lib:bcrypt)

**Date:** 2026-04-16
**Requested by:** api-dev
**For tasks:** 17005
**Sources:**
- https://github.com/patrickfav/bcrypt (README, 2026-04-16)

---

## 1. Gradle Dependency

```kotlin
// app/build.gradle.kts
dependencies {
    implementation("at.favre.lib:bcrypt:0.10.2")
}
```

**Maven Central coordinate:** `at.favre.lib:bcrypt`
**Latest version:** `0.10.2` (released 2022-03-06 per Maven Central)
**Maven Central:** https://mvnrepository.com/artifact/at.favre.lib/bcrypt

> ⚠️ Version `0.10.2` has been the latest stable for several years. Check Maven Central for any newer version before pinning: https://mvnrepository.com/artifact/at.favre.lib/bcrypt

---

## 2. Hash a PIN

```kotlin
import at.favre.lib.crypto.bcrypt.BCrypt

// Hash with cost factor 10 (recommended for PIN — see Section 5)
val hash: String = BCrypt.withDefaults().hashToString(10, pin.toCharArray())
// Example output: "$2a$10$US00g/uMhoSBm.HiuieBjeMtoN69SN.GE25fCpldebzkryUyopws6"
```

**Alternative APIs:**
```kotlin
// Returns char[] (preferred for security — can be wiped)
val hashChars: CharArray = BCrypt.withDefaults().hashToChar(10, pin.toCharArray())

// Returns byte[]
val hashBytes: ByteArray = BCrypt.withDefaults().hash(10, pin.toCharArray())
```

> **Cost factor guide:** 12 is recommended for user passwords. For a short PIN (4-6 digits), use **10** — the intentional delay (~100ms on modern devices) is still sufficient to deter brute force while keeping UX responsive. Cost 12 (~400ms) is acceptable if UX allows.

---

## 3. Verify a PIN

```kotlin
import at.favre.lib.crypto.bcrypt.BCrypt

val result: BCrypt.Result = BCrypt.verifyer().verify(
    pin.toCharArray(),   // candidate PIN
    storedHash           // stored bcrypt hash string (from EncryptedSharedPreferences)
)

if (result.verified) {
    // PIN is correct
} else {
    // PIN is wrong
}
```

**The `BCrypt.Result` object exposes:**
| Property | Type | Description |
|---|---|---|
| `result.verified` | `Boolean` | `true` if PIN matches hash |
| `result.validFormat` | `Boolean` | `true` if hash string is a valid bcrypt format |
| `result.details` | `BCrypt.Result.Details` | Enum with details: `VERIFIED`, `NOT_VERIFIED`, `INVALID_CREDENTIALS`, `UNKNOWN_VERSION`, etc. |

---

## 4. Version Support

```kotlin
// Default: $2a$ version (most compatible)
val hash = BCrypt.withDefaults().hashToString(10, pin.toCharArray())

// PHP-compatible: $2y$ version
val hashY = BCrypt.with(BCrypt.Version.VERSION_2Y).hashToString(10, pin.toCharArray())

// $2b$ version
val hashB = BCrypt.with(BCrypt.Version.VERSION_2B).hashToString(10, pin.toCharArray())
```

For this project, use `BCrypt.withDefaults()` which produces `$2a$` — the most universally accepted format.

---

## 5. Android Compatibility

**Why it works on Android:**
- Compiled to Java 7 bytecode — compatible with all Android API levels including minSdk 26.
- **Pure Java implementation** — no JNI, no native libraries, no .so files.
- No Android-specific dependencies. Works identically on Android and JVM.
- Uses only `java.security.SecureRandom` for salt generation (available on all Android versions).

**R8/ProGuard:**
- No ProGuard/R8 keep rules required. The library has no reflection, no dynamic class loading.
- R8 full-mode (AGP 8.x default) is safe with this library.

---

## 6. Long Password Handling

BCrypt truncates passwords at 72 bytes (Blowfish limitation). For a 4-6 digit PIN this is never a concern. If the PIN could be longer (unlikely), the library throws by default:

```kotlin
// Default: throws if password > 72 bytes. For short PINs, this never triggers.
// If needed, truncate explicitly:
val hash = BCrypt.with(LongPasswordStrategies.truncate(BCrypt.Version.VERSION_2A))
    .hashToString(10, longPin.toCharArray())
```

---

## 7. Background Thread — MUST use Dispatchers.IO

BCrypt hashing is **intentionally CPU-intensive**. Always run on `Dispatchers.IO`:

```kotlin
// In PinRepository (called from ViewModel)
suspend fun hashPin(pin: String): String = withContext(Dispatchers.IO) {
    BCrypt.withDefaults().hashToString(10, pin.toCharArray())
}

suspend fun verifyPin(pin: String): Boolean = withContext(Dispatchers.IO) {
    val storedHash = encryptedPrefs.getString(KEY_PIN_HASH, null) ?: return@withContext false
    BCrypt.verifyer().verify(pin.toCharArray(), storedHash).verified
}
```

```kotlin
// In ViewModel:
fun verifyAndUnlock(pin: String) {
    viewModelScope.launch {
        val isCorrect = pinRepository.verifyPin(pin)
        _pinState.value = if (isCorrect) PinState.Unlocked else PinState.WrongPin
    }
}
```

> **Never call bcrypt on the main thread.** With cost 10, hashing takes ~50-150ms on a modern device. This will cause frame drops (>16ms = jank) if run on the UI thread.

---

## 8. Alternative: org.mindrot:jbcrypt

`org.mindrot:jbcrypt:0.4` is an older, simpler library. API differences:
| Feature | `at.favre.lib:bcrypt` | `org.mindrot:jbcrypt` |
|---|---|---|
| Hash | `BCrypt.withDefaults().hashToString(cost, pw)` | `BCrypt.hashpw(pw, BCrypt.gensalt(cost))` |
| Verify | `BCrypt.verifyer().verify(pw, hash).verified` | `BCrypt.checkpw(pw, hash)` (boolean) |
| Version support | $2a$, $2b$, $2y$ | $2a$ only |
| Long password handling | Configurable | Silently truncates |
| Java target | Java 7 | Java 5 |

**Use `at.favre.lib:bcrypt`** — it is safer (explicit version, configurable long-password strategy, result details object) and better maintained.

---

## Summary

Add `implementation("at.favre.lib:bcrypt:0.10.2")` to `app/build.gradle.kts`. Hash: `BCrypt.withDefaults().hashToString(10, pin.toCharArray())`. Verify: `BCrypt.verifyer().verify(pin.toCharArray(), storedHash).verified`. Store the hash in `EncryptedSharedPreferences`. Always call on `Dispatchers.IO`. No ProGuard rules needed. Works on all Android API levels including minSdk 26.
