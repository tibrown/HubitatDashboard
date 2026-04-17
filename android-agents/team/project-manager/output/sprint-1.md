# Sprint 1 Plan — Hubitat Dashboard Android

**Date:** 2026-04-16  
**PM:** Sokka  
**Total Tasks:** 15 (IDs 17001–17015)

---

## Dependency Graph Summary

```
17001 (scaffold)
├── 17002 (data models)       ← also unblocks →  17006 (settings screen, via 17001)
│   └── 17003 (connection/settings repo)
│       └── 17004 (api service + SSE)
│           └── 17005 (device + pin repos)
│               └── 17007 (shell/nav/DeviceVM)  ← also needs 17006
│                   ├── 17008 (system status row)
│                   └── 17009 (group screen)
│                       ├── 17010 (switch/connector/dimmer tiles)
│                       ├── 17011 (rgbw tile)
│                       ├── 17012 (sensor tiles)
│                       └── 17013 (control tiles + PinDialog)
│                           └── (also 17008 feeds 17014)
│                               └── 17014 (polish)
│                                   └── 17015 (QA test plan)
```

---

## Rounds

### Round 1 — Foundation
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| architect | **17001** | Scaffold Android project (Gradle, Hilt, Manifest) | 🔴 high |

*Blocker for entire project. All other work waits.*

---

### Round 2 — Data Models + Settings UI (parallel)
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| api-dev | **17002** | Implement Kotlin data models | 🔴 high |
| frontend-dev | **17006** | Implement SettingsScreen and SettingsViewModel | 🟡 medium |

*Both unblocked after 17001. Can run in parallel.*

---

### Round 3 — Connection Layer
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| api-dev | **17003** | Implement ConnectionResolver and SettingsRepository | 🔴 high |

*Unblocked after 17002.*

---

### Round 4 — API + SSE
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| api-dev | **17004** | Implement HubitatApiService and SseClient | 🔴 high |

*Unblocked after 17003.*

---

### Round 5 — Repositories
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| api-dev | **17005** | Implement DeviceRepository and PinRepository | 🔴 high |

*Unblocked after 17004.*

---

### Round 6 — App Shell + Navigation
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| frontend-dev | **17007** | Implement app shell, navigation, and DeviceViewModel | 🟡 medium |

*Unblocked after both 17005 AND 17006.*

---

### Round 7 — Status Row + Group Screen (parallel)
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| frontend-dev | **17008** | Implement SystemStatusRow | 🟡 medium |
| frontend-dev | **17009** | Implement GroupScreen and groups.kt config | 🟡 medium |

*Both unblocked after 17007. Can run in parallel.*

---

### Round 8 — All Tile Types (parallel)
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| frontend-dev | **17010** | Implement SwitchTile, ConnectorTile, and DimmerTile | 🟡 medium |
| frontend-dev | **17011** | Implement RGBWTile with colour picker | 🟡 medium |
| frontend-dev | **17012** | Implement sensor tiles | 🟡 medium |
| frontend-dev | **17013** | Implement control tiles and PinDialog | 🟡 medium |

*All unblocked after 17009. All four can run in parallel.*

---

### Round 9 — Polish
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| frontend-dev | **17014** | Implement polish (theme, group reorder, error banner, icon, APK docs) | 🟡 medium |

*Unblocked after 17008 + 17010 + 17011 + 17012 + 17013.*

---

### Round 10 — QA
| Agent | Task | Title | Priority |
|-------|------|-------|----------|
| qa-tester | **17015** | Write QA test plan and functional validation checklist | 🟡 medium |

*Unblocked after 17014.*

---

## Research Pre-Conditions

Research agent must complete all inbox requests **before Round 1 begins**:

| File | Topics | Needed By |
|------|--------|-----------|
| req-jetpack-compose-material3.md | Compose BOM, Material3 components | architect (R1), frontend-dev (R2–R9) |
| req-hilt-android.md | Hilt DI setup | architect (R1), api-dev (R2–R5) |
| req-retrofit-okhttp-sse.md | Retrofit, OkHttp SSE | api-dev (R3–R4) |
| req-datastore-encryptedprefs.md | DataStore, EncryptedSharedPrefs | api-dev (R3), frontend-dev (R2, R9) |
| req-navigation-compose.md | Navigation Compose | frontend-dev (R6) |
| req-bcrypt-android.md | BCrypt on Android | api-dev (R5) |

---

## Notes

- frontend-dev has 9 tasks total — within the 6-task-per-sprint soft limit only because Rounds 7–8 are internally sequential (17007→17008/17009→tiles→17014).
- api-dev tasks (17002–17005) are strictly sequential by design — each builds on the last.
- architect is done after Round 1; no further tasks.
- qa-tester is blocked until the entire UI is complete (17014).
