# Memory - research

_Decisions, constraints, and context worth keeping between sessions._

---

## Pre-dev Research Complete — 2026-04-16

Topics researched:
- Jetpack Compose + Material 3 (for architect tasks #17001; frontend-dev tasks #17006–17014)
- Hilt Android DI (for architect #17001; api-dev tasks #17002–17005)
- Retrofit + OkHttp SSE (for api-dev tasks #17003, #17004)
- DataStore Preferences + EncryptedSharedPreferences (for api-dev #17003, #17014; frontend-dev #17006, #17014)
- Navigation Compose (for frontend-dev task #17007)
- BCrypt on Android (for api-dev task #17005)

No deduplication performed — all 6 topics were distinct.

Key version pins confirmed from official sources:
| Library | Version |
|---|---|
| Compose BOM | `2026.03.00` |
| material3 | `1.4.0` (via BOM) |
| material-icons-extended | `1.7.8` (via BOM, capped) |
| Hilt | `2.57.1` |
| hilt-navigation-compose | `1.2.0` |
| Retrofit | `2.11.0` |
| OkHttp | `5.3.2` |
| datastore-preferences | `1.2.1` |
| security-crypto | `1.1.0-alpha06` |
| navigation-compose | `2.9.7` |
| at.favre.lib:bcrypt | `0.10.2` |

Notable findings:
- `SegmentedButton` is stable in material3 1.4.0 — no experimental opt-in needed.
- HSB color wheel (for RGBWTile) requires custom Canvas — no library component available.
- OkHttp 5.x is now stable (since 2025-07-02). SSE done via manual ResponseBody streaming.
- Accomp​anist PullRefreshIndicator is deprecated — use M3 `PullToRefreshContainer`.
- BCrypt must always run on `Dispatchers.IO`.
- EncryptedSharedPreferences: minSdk 23 required; project minSdk 26 is fine.

All active agents notified:
- architect/memory.md ✅
- api-dev/memory.md ✅
- frontend-dev/memory.md ✅

All inbox files marked done.

