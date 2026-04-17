# Skill: bug_report

Use this to write a clear, reproducible bug report when a Playwright test fails or unexpected behavior is found.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

## Phase 1: Plan — Capture failure details

Before writing the report, collect:
- The exact Playwright error output (copy verbatim from terminal)
- Screenshot path: `test-results/<test-name>/screenshot.png`
- Trace path: `test-results/<test-name>/trace.zip`
- The failing test case ID from the test plan
- The spec file and line number where the assertion failed

Run the trace viewer to understand exactly what happened:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

## Phase 2: Write — Create the bug report

Save to `output/bug-<ID>-<short-title>.md`:

```markdown
# Bug #<ID>: <Short Title>

**Severity:** Critical | Major | Minor
**Status:** Open
**Reported:** YYYY-MM-DD
**Found in task:** #<task-id>
**Failing test:** `output/tests/<slug>.spec.ts` — TC-<ID>
**Assigned to:** <agent-name>

## Summary
One sentence describing what is broken and what should happen instead.

## Failing Playwright test

```ts
// TC-XX: <test name>
test('TC-XX: <description>', async ({ page }) => {
  await page.goto('/path');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Success')).toBeVisible(); // ← FAILS HERE
});
```

**Error output:**
```
Error: expect(locator).toBeVisible()
Locator: getByText('Success')
Expected: visible
Received: <element(s) not found>
```

## Steps to reproduce (manual)
1. Navigate to /path
2. Click Submit
3. Observe: error message appears instead of "Success"

## Expected result
"Success" message is visible after clicking Submit.

## Actual result
Error message "Something went wrong" appears. No "Success" text.

## Evidence
- Screenshot: `test-results/<test-name>/screenshot.png`
- Trace: `test-results/<test-name>/trace.zip` (run: `npx playwright show-trace <path>`)

## Notes
Any additional context, related bugs, or suspected root cause.
```

---

## Phase 3: Reproduce — Confirm it is real

Before filing, confirm the bug is not a test environment issue:
```bash
# Run just the failing test in headed mode to watch it happen
npx playwright test --headed output/tests/<slug>.spec.ts --grep "TC-XX"

# Try against a clean environment if possible
```

If the test fails consistently across 3 runs → file the bug.
If it fails intermittently → note as "flaky" and investigate the test first.

---

## Phase 4: Iterate — Track to resolution

1. Write the bug to `output/bug-<ID>-<title>.md`.
2. Notify the Orchestrator to create a fix task with a link to the bug report.
3. Update bug `Status` field as it progresses: Open → In Progress → Fixed → Verified.
4. Once fixed: re-run the failing Playwright test to verify.
   ```bash
   npx playwright test output/tests/<slug>.spec.ts --grep "TC-XX"
   ```
5. Update Status to `Verified` and close the bug.

## Severity guide

| Severity | Meaning | Action |
|----------|---------|--------|
| **Critical** | Auth broken, data loss, crash, security breach | File immediately, block release |
| **Major** | Feature non-functional, no workaround | File same session, set high priority |
| **Minor** | Cosmetic issue, workaround exists | File and defer to next sprint |

