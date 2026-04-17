# Skill: test_plan

Use this to design and write a Playwright-based test suite for a feature.

> **⚠️ CLI only — no MCP browser tools.**
> All Playwright usage is via the command line. You write `.spec.ts` test files and run them with
> `npx playwright test`. Do NOT use any Playwright MCP server, browser automation MCP tools,
> or direct `page.*` calls outside of `.spec.ts` files. If no `node_modules` exist yet, run
> `npm install` (or `npm install -D @playwright/test`) before running tests.

---

## Phase 1: Plan — Design test cases

1. Read the RD for the feature.
2. List every user-visible behavior and API contract to validate.
3. For each behavior, write one test case in the table below:
   - **Type**: `e2e` (full browser flow) | `api` (Playwright request fixture) | `component`
   - **Scenario**: what the user or system does
   - **Expected**: the observable outcome
4. Group tests: happy path → edge cases → error paths → security.
5. Save the plan to `output/test-plan-<slug>.md` before writing any code.

### Test plan table format

```markdown
| ID    | Type | Scenario                          | Expected                     | Status |
|-------|------|-----------------------------------|------------------------------|--------|
| TC-01 | e2e  | User submits valid login form     | Redirected to dashboard      | -      |
| TC-02 | e2e  | User submits wrong password       | Error message shown           | -      |
| TC-03 | api  | POST /api/login with valid body   | 200 + JWT token in response  | -      |
| TC-04 | api  | POST /api/login without body      | 400 validation error         | -      |
```

Status values: `-` (not run) | `PASS` | `FAIL` | `BLOCKED`

---

## Phase 2: Write — Code the Playwright tests

Save tests to `output/tests/<slug>.spec.ts`.

### File structure

```ts
import { test, expect } from '@playwright/test';

test.describe('<Feature Name>', () => {
  test.beforeEach(async ({ page }) => {
    // shared setup: navigate, seed data, etc.
  });

  // E2E test
  test('TC-01: user submits valid login form', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  // API test (no browser — uses request fixture)
  test('TC-03: POST /api/login returns JWT on valid body', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: 'user@example.com', password: 'correct-password' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
  });

  // Error path
  test('TC-04: POST /api/login returns 400 when body missing', async ({ request }) => {
    const response = await request.post('/api/login', { data: {} });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('code');
  });
});
```

### Common Playwright patterns

```ts
// Assert element visible
await expect(page.getByRole('alert')).toBeVisible();

// Wait for navigation after action
await Promise.all([
  page.waitForURL('/dashboard'),
  page.getByRole('button', { name: 'Submit' }).click(),
]);

// Mock an API response
await page.route('**/api/data', route =>
  route.fulfill({ status: 200, json: { items: [] } })
);

// Keyboard navigation check
await page.keyboard.press('Tab');
await expect(page.locator(':focus')).toBeVisible();
```

---

## Phase 3: Execute — Run tests from the CLI

All test execution is via the CLI. Never use browser automation MCP tools.

```bash
# Run a single spec
npx playwright test output/tests/<slug>.spec.ts

# Run all tests
npx playwright test

# Generate HTML report (opens in browser)
npx playwright test --reporter=html
npx playwright show-report

# Debug a failing test (opens browser, pauses on failure)
npx playwright test --headed --debug output/tests/<slug>.spec.ts

# Run tests matching a name pattern
npx playwright test --grep "TC-01"
```

1. Run the suite. For each test record PASS | FAIL | BLOCKED in the plan table.
2. For FAIL: copy the exact error message and note the artifact paths:
   - Screenshot: `test-results/<test-name>/test-failed-1.png`
   - Trace: `test-results/<test-name>/trace.zip`
   - View trace: `npx playwright show-trace test-results/<test-name>/trace.zip`
3. File a bug report for every FAIL using `skill_bug_report.md`.
4. Update the test plan file with results.

---

## Phase 4: Iterate — Refine after fixes

1. After a bug fix is deployed, re-run only the failing test(s) first.
2. Then run the full suite to catch regressions.
3. Update test cases if the RD changed during the fix.
4. If a test was wrong (not the code), fix the test and document why.
5. Archive the passing test plan with the run date in the filename.

## Checklist before marking done

- [ ] Every RD requirement maps to at least one test case
- [ ] Happy path, edge case, and at least one error path covered
- [ ] All tests run via CLI: `npx playwright test output/tests/<slug>.spec.ts` exits cleanly
- [ ] Bug reports filed for every FAIL
- [ ] Test plan table updated with final status column
