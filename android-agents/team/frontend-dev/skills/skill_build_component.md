# Skill: build_component

Use this when building a new UI component. Follows four iteration phases.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

## Phase 1: Plan — Design the component

1. Read the RD for the component. Identify:
   - What does it render?
   - What props/inputs does it accept?
   - What API data does it need?
   - What are the loading, empty, and error states?
   - What interactions does it have (clicks, form inputs, navigation)?

2. Sketch the component tree before writing code:
   - One responsibility per component.
   - If it has more than 2 distinct visual sections, split into sub-components.
   - List the Playwright test cases you will write (from the RD done criteria).

3. Confirm the API contract is ready. If not, request the API spec from api-dev before starting.

---

## Phase 2: Build — Implement the component

1. Build the component with all three states handled:
   - **Loading**: skeleton loader or spinner — never a blank screen.
   - **Empty**: descriptive message, not blank. Offer a next action if possible.
   - **Error**: user-friendly message with a retry option if applicable.

2. Apply mobile-first responsive styles (see `skill_responsive_layout.md`).

3. Add ARIA labels to all interactive elements (see `skill_accessibility.md`).

4. Keep components stateless where possible. Lift state only when two siblings share it.

5. Do not hardcode API URLs — use environment config.

---

## Phase 3: Test — Write and run Playwright tests

Save tests to `../../qa-tester/output/tests/<component-slug>.spec.ts` or local `output/tests/`.

### Component test structure

```ts
import { test, expect } from '@playwright/test';

test.describe('<ComponentName>', () => {

  test('renders loading state initially', async ({ page }) => {
    // Mock API to delay
    await page.route('**/api/data', route =>
      new Promise(resolve => setTimeout(() => resolve(route.continue()), 500))
    );
    await page.goto('/page-with-component');
    await expect(page.getByRole('status')).toBeVisible(); // spinner/skeleton
  });

  test('renders data on successful load', async ({ page }) => {
    await page.route('**/api/data', route =>
      route.fulfill({ status: 200, json: { items: [{ id: 1, name: 'Item A' }] } })
    );
    await page.goto('/page-with-component');
    await expect(page.getByText('Item A')).toBeVisible();
  });

  test('renders empty state when no data', async ({ page }) => {
    await page.route('**/api/data', route =>
      route.fulfill({ status: 200, json: { items: [] } })
    );
    await page.goto('/page-with-component');
    await expect(page.getByText(/no items/i)).toBeVisible();
  });

  test('renders error state on API failure', async ({ page }) => {
    await page.route('**/api/data', route =>
      route.fulfill({ status: 500, json: { error: 'Server error' } })
    );
    await page.goto('/page-with-component');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/page-with-component');
    // Tab to the first interactive element
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
```

Run the tests:
```bash
npx playwright test output/tests/<component-slug>.spec.ts
npx playwright test --reporter=html
```

### Component quality checklist before marking done
- [ ] Loading, empty, and error states all render correctly
- [ ] Responsive at 375px, 768px, 1280px (use `skill_responsive_layout.md`)
- [ ] ARIA labels on all interactive elements (use `skill_accessibility.md`)
- [ ] Playwright tests pass for all four states
- [ ] Keyboard navigation test passes
- [ ] No hardcoded API URLs or secrets

---

## Phase 4: Iterate — Refine from review feedback

1. Read review comments from Architect or QA in `memory.md`.
2. Address each comment specifically — do not make unrelated changes in the same pass.
3. Re-run the Playwright suite after each change:
   ```bash
   npx playwright test output/tests/<component-slug>.spec.ts
   ```
4. If a review comment changes the component API (props/events), update the RD first, then the code.
5. Once all comments are resolved, set task status back to `review`.

