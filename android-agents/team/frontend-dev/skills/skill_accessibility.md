# Skill: accessibility

Use this to check and fix accessibility on a component or page. Target: WCAG 2.1 AA.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

## Phase 1: Plan — Identify accessibility requirements

From the RD and component design, list:
- All interactive elements (buttons, links, inputs, dialogs, menus).
- Dynamic content regions that update without page reload.
- Any color-based information that needs a text/icon alternative.
- Keyboard flows the user must complete (e.g., fill form → submit → confirm).

---

## Phase 2: Audit — Check against WCAG 2.1 AA

### Keyboard navigation
- [ ] All interactive elements are reachable via `Tab`.
- [ ] Focus order is logical (matches reading/visual order).
- [ ] Custom components (dropdowns, modals, tooltips) trap focus when open; release on close/`Escape`.
- [ ] Visible focus indicator on every focusable element (not just default browser outline).

### ARIA
- [ ] Buttons have descriptive labels (not just an icon with no `aria-label`).
- [ ] Images have `alt` text; decorative images have `alt=""`.
- [ ] Form inputs are associated with labels via `htmlFor` / `aria-labelledby`.
- [ ] Dynamic regions use `aria-live="polite"` or `aria-live="assertive"` appropriately.
- [ ] Modals use `role="dialog"` and `aria-labelledby` pointing to the heading.

### Color and contrast
- [ ] Normal text contrast ≥ 4.5:1.
- [ ] Large text (18pt+ or 14pt+ bold) contrast ≥ 3:1.
- [ ] Information is not conveyed by color alone (add icon or text label).

### Forms
- [ ] Required fields are marked with both visual indicator and `required` attribute.
- [ ] Error messages are programmatically associated with their input.
- [ ] Success/failure feedback is announced to screen readers.

---

## Phase 3: Test — Run Playwright accessibility tests

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright'; // npm install @axe-core/playwright

test.describe('Accessibility: <Component/Page>', () => {

  test('has no critical or serious axe violations', async ({ page }) => {
    await page.goto('/page-with-component');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    // Filter to critical and serious only
    const significant = results.violations.filter(v =>
      ['critical', 'serious'].includes(v.impact)
    );
    expect(significant).toEqual([]); // fail with details if any found
  });

  test('modal traps focus when open', async ({ page }) => {
    await page.goto('/page-with-modal');
    await page.getByRole('button', { name: 'Open modal' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Tab should cycle within dialog
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(await focused.textContent() ?? '');
    // Escape closes modal
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('form errors are announced', async ({ page }) => {
    await page.goto('/form-page');
    await page.getByRole('button', { name: 'Submit' }).click();
    const error = page.getByRole('alert');
    await expect(error).toBeVisible();
    // Check aria-describedby links input to error
    const input = page.getByLabel('Email');
    const describedBy = await input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
  });

  test('all interactive elements are keyboard reachable', async ({ page }) => {
    await page.goto('/page-with-component');
    // Tab through all focusable elements; none should be skipped
    const focusable = await page.locator(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();
    for (const el of focusable) {
      await expect(el).toBeVisible();
    }
  });
});
```

Run:
```bash
npm install @axe-core/playwright
npx playwright test output/tests/accessibility.spec.ts --reporter=html
```

Fix all `critical` and `serious` violations before marking done.
`moderate` and `minor` violations should be documented and tracked.

---

## Phase 4: Iterate — Fix and re-verify

1. Address `critical` violations first, then `serious`.
2. Re-run the axe test after each fix:
   ```bash
   npx playwright test --grep "axe violations"
   ```
3. For manual issues (contrast, focus order): fix the CSS/markup and re-run the relevant test.
4. If a violation cannot be fixed without a design change, document it in `memory.md` and notify the Architect.
5. All `critical` and `serious` violations must be zero before moving to `review`.

