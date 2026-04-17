# Skill: responsive_layout

Use this when building or auditing a layout for responsiveness across breakpoints.

> **⚠️ CLI only — no MCP browser tools.**
> Write `.spec.ts` test files and run them with `npx playwright test`.
> Do NOT use any Playwright MCP server or browser automation MCP tools.

## Phase 1: Plan — Define breakpoints and layout behavior

Breakpoints to target (minimum set):

| Name    | Width  | Typical device       |
|---------|--------|----------------------|
| Mobile  | 375px  | iPhone SE / Android  |
| Tablet  | 768px  | iPad portrait        |
| Desktop | 1280px | Laptop               |
| Wide    | 1440px | External monitor     |

Before building:
1. Identify which layout regions change between breakpoints (nav collapses, sidebar hides, columns stack).
2. Note any content that should be hidden or reordered on mobile.
3. Check if any images or media need different aspect ratios.

---

## Phase 2: Build — Implement mobile-first

1. Start with the mobile (375px) layout. Expand with `min-width` media queries.
2. Use CSS Grid or Flexbox for layout — avoid fixed pixel widths on containers.
3. Use relative units: `rem` for spacing/type, `%` or `fr` for layout, `min()` / `max()` / `clamp()` for fluid sizing.
4. Ensure images have `max-width: 100%` and `height: auto`.
5. Touch targets: minimum `44×44px` for all interactive elements on mobile.
6. Minimum font size: `14px` on mobile (prefer `16px` for body text).

---

## Phase 3: Test — Playwright viewport tests

```ts
import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile',  width: 375,  height: 812  },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1280, height: 800  },
  { name: 'wide',    width: 1440, height: 900  },
];

for (const bp of BREAKPOINTS) {
  test(`layout is correct at ${bp.name} (${bp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto('/page-to-test');

    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Key elements are visible
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();

    // Take a visual snapshot for review
    await page.screenshot({
      path: `output/screenshots/layout-${bp.name}.png`,
      fullPage: true,
    });
  });
}

test('mobile nav opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const hamburger = page.getByRole('button', { name: /menu/i });
  await expect(hamburger).toBeVisible();
  await hamburger.click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await hamburger.click();
  await expect(page.getByRole('navigation')).not.toBeVisible();
});
```

Run:
```bash
npx playwright test output/tests/responsive.spec.ts --reporter=html
```

Screenshots land in `output/screenshots/layout-<breakpoint>.png` for visual review.

---

## Phase 4: Iterate — Fix overflow and reflow issues

Common issues and fixes:

| Issue | Fix |
|-------|-----|
| Horizontal scrollbar at mobile | Find element with `width > 100vw`; use `overflow-x: hidden` on root as last resort |
| Flex children not wrapping | Add `flex-wrap: wrap` or `min-width: 0` on children |
| Fixed-width element overflows | Replace `width: 300px` with `max-width: 300px; width: 100%` |
| Images overflow | Ensure `img { max-width: 100%; height: auto }` |
| Text too small on mobile | Use `clamp(14px, 4vw, 18px)` or a minimum rem size |
| Touch target too small | Increase padding, not just font size |

After each fix, re-run the Playwright viewport tests and verify no new screenshots differ unexpectedly.

