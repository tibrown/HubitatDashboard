# Skill: regression

Use this to run a Playwright regression suite after any significant code change.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

## Phase 1: Plan — Scope the regression

1. Identify what changed (which agent, which files, which endpoints or components).
2. Map the blast radius: which other features could this change break?
3. Select existing test specs from `output/tests/` that cover affected areas.
4. If no spec exists for an affected area, write one now using `skill_test_plan.md` before proceeding.
5. Note dependencies: if a shared fixture or helper changed, all specs using it must run.

---

## Phase 2: Execute — Run Playwright tests

```bash
# Run all tests
npx playwright test

# Run a specific spec
npx playwright test output/tests/<slug>.spec.ts

# Run tests matching a tag or grep pattern
npx playwright test --grep "@auth"

# Generate full HTML report
npx playwright test --reporter=html && npx playwright show-report

# Debug a specific failing test
npx playwright test --headed --debug output/tests/<slug>.spec.ts

# Run in CI mode (no headed, fail fast)
npx playwright test --reporter=list
```

Record each result as: `PASS` | `FAIL` | `BLOCKED`

For every `FAIL`:
- Copy the exact error message from the console.
- Note the screenshot path: `test-results/<test-name>/screenshot.png`
- Note the trace path: `test-results/<test-name>/trace.zip` (`npx playwright show-trace <path>`)

---

## Phase 3: Report — Write the regression summary

Save to `output/regression-<YYYY-MM-DD>.md`:

```markdown
# Regression Run: YYYY-MM-DD

**Trigger:** <what changed — e.g., "api-dev merged login endpoint refactor">
**Scope:** <which specs were run>
**Command:** `npx playwright test output/tests/auth.spec.ts output/tests/dashboard.spec.ts`

| Spec File          | Test Name                        | Result  | Bug   |
|--------------------|----------------------------------|---------|-------|
| auth.spec.ts       | TC-01: valid login flow          | PASS    |       |
| auth.spec.ts       | TC-02: wrong password            | FAIL    | #007  |
| dashboard.spec.ts  | TC-05: dashboard loads           | PASS    |       |

**Outcome:** FAIL — 1 regression found
**Playwright report:** `playwright-report/index.html`
**Next step:** Bug #007 assigned to api-dev via Orchestrator
```

---

## Phase 4: Iterate — Fix and re-verify

1. For each `FAIL`, file a bug report using `skill_bug_report.md`.
2. Notify the Orchestrator to create a fix task for the responsible agent.
3. After the fix is deployed:
   - Re-run only the previously failing test(s).
   - If they pass, run the full suite once more.
4. Update the regression report with re-run results and date.
5. If a test itself was wrong (not the code), fix the spec and note the correction.

## Escalation

If any **Critical** regression is found (auth broken, data loss, crash, security):
- File the bug immediately with severity: Critical.
- Notify PM to set the fix task priority to `high`.
- Block release until the regression is resolved and re-verified.

