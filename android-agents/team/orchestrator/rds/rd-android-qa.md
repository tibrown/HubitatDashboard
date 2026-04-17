# RD-17015: QA Test Plan and Functional Validation

## Owner
qa-tester

## Summary
Write a comprehensive test plan covering all 15 tile types, dual-connection modes, PIN flows, real-time SSE updates, and sideload installation. Execute or document all test cases against the completed app.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

### `android/QA_TEST_PLAN.md`
Structured test plan with the following sections:

**1. Build Verification**
- `./gradlew assembleDebug` succeeds with 0 errors.
- APK size < 30 MB.
- Installs on Android 8.0+ device/emulator without error.

**2. Onboarding**
- Fresh install shows SettingsScreen (no hub data saved).
- Valid save navigates to MainScreen.
- Invalid IP shows validation error, does not navigate.

**3. Connection Modes**
- LOCAL mode: app connects using hub IP only.
- CLOUD mode: app connects using cloud URL only.
- AUTO mode: with local hub reachable → uses LOCAL; with local unreachable → falls back to CLOUD within 3 s.
- Connection badge in StatusRow shows correct label.

**4. Device State Display**
- All 14 groups render their tiles without crash.
- Tile states update when SSE event arrives (mock or live).
- Pull-to-refresh repopulates all device states.

**5. Tile Interactions (one test per tile type)**
- SwitchTile toggle ON → command "on" sent.
- SwitchTile toggle OFF → command "off" sent.
- DimmerTile slider → setLevel command with correct value.
- RGBWTile color picker → setColor command with correct Hubitat format.
- ContactTile shows red when open, green when closed.
- MotionTile shows amber when active, gray when inactive.
- TemperatureTile shows numeric °F value.
- PowerMeterTile shows watts.
- PresenceTile shows present/not-present.
- BatteryTile changes icon at 50% and 20% thresholds.
- RingDetectionTile shows hub variable value.
- ButtonTile sends push command.
- LockTile: tap → PinDialog → correct PIN → lock/unlock command sent.
- HsmTile: tap → mode picker → PinDialog → correct PIN → hsm command sent.
- ModeTile: tap → mode list → PinDialog → correct PIN → mode change sent.

**6. PIN Security**
- Wrong PIN shows "Invalid PIN" error.
- Correct PIN allows the protected action.
- PIN persists across app restarts.

**7. Real-Time Updates**
- SSE event updates tile state without manual refresh.
- SSE disconnection shows Reconnecting badge.
- SSE reconnection restores Connected badge.
- No-connection banner appears after 30 s disconnected.

**8. Theme**
- App follows system dark/light setting.
- Theme toggle persists after app restart.

**9. Group Reordering**
- Drag/reorder group in drawer → order persists after restart.

## Done Criteria
1. `QA_TEST_PLAN.md` exists with all 9 test sections.
2. Each test case has a clear Pass/Fail criterion.
3. All tiles from section 5 have at least one test case.
4. Build verification section is completed (actual pass/fail recorded).
