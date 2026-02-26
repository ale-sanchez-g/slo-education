import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

const PAGES = [
  { name: 'home', path: '/index.html' },
  { name: 'error-budget-calculator', path: '/error-budget-calculator.html' },
  { name: 'incident-management', path: '/incident-management.html' },
  { name: 'privacy-policy', path: '/privacy-policy.html' },
];

/**
 * Checks that no element on the page causes horizontal overflow beyond the viewport.
 * Returns the scrollWidth and clientWidth of the document element.
 */
async function getPageOverflow(page: any) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
}

/**
 * Finds elements that overflow horizontally beyond the viewport.
 */
async function findOverflowingElements(page: any) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const overflowing: string[] = [];

    document.querySelectorAll('*').forEach((el: Element) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 1) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className ? `.${String(el.className).trim().replace(/\s+/g, '.')}` : '';
        const id = el.id ? `#${el.id}` : '';
        overflowing.push(`${tag}${id}${cls}`);
      }
    });

    return overflowing;
  });
}

// ─── Mobile overflow tests ────────────────────────────────────────────────────

test.describe('Mobile - No horizontal overflow', () => {
  for (const { name, path } of PAGES) {
    test(`${name} page has no horizontal overflow on mobile`, async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const { scrollWidth, clientWidth } = await getPageOverflow(page);
      expect(
        scrollWidth,
        `Page "${name}" scrollWidth (${scrollWidth}) exceeds clientWidth (${clientWidth}) on mobile`
      ).toBeLessThanOrEqual(clientWidth);
    });
  }
});

// ─── Desktop overflow tests ───────────────────────────────────────────────────

test.describe('Desktop - No horizontal overflow', () => {
  for (const { name, path } of PAGES) {
    test(`${name} page has no horizontal overflow on desktop`, async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const { scrollWidth, clientWidth } = await getPageOverflow(page);
      expect(
        scrollWidth,
        `Page "${name}" scrollWidth (${scrollWidth}) exceeds clientWidth (${clientWidth}) on desktop`
      ).toBeLessThanOrEqual(clientWidth);
    });
  }
});

// ─── pre element text-wrapping tests ─────────────────────────────────────────

test.describe('Mobile - pre element text wrapping', () => {
  test('framework-tree pre element wraps text and does not overflow on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/error-budget-calculator.html');
    await page.waitForLoadState('networkidle');

    const preEl = page.locator('.framework-tree pre');
    await expect(preEl).toBeVisible();

    const overflow = await preEl.evaluate((el: HTMLElement) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      whiteSpace: window.getComputedStyle(el).whiteSpace,
      wordBreak: window.getComputedStyle(el).wordBreak,
    }));

    // white-space must be pre-wrap (not plain "pre") so the browser can wrap
    expect(
      overflow.whiteSpace,
      'pre element should have white-space: pre-wrap to allow wrapping'
    ).toMatch(/pre-wrap|pre-line/);

    // The element itself must not overflow its container
    expect(
      overflow.scrollWidth,
      `pre element scrollWidth (${overflow.scrollWidth}) exceeds clientWidth (${overflow.clientWidth})`
    ).toBeLessThanOrEqual(overflow.clientWidth + 1); // +1 for sub-pixel rounding
  });

  test('formula elements do not overflow on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/error-budget-calculator.html');
    await page.waitForLoadState('networkidle');

    const formulas = page.locator('.formula');
    const count = await formulas.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const overflow = await formulas.nth(i).evaluate((el: HTMLElement) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(
        overflow.scrollWidth,
        `formula[${i}] scrollWidth (${overflow.scrollWidth}) exceeds clientWidth (${overflow.clientWidth})`
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    }
  });
});

// ─── Visual layout regression screenshots ────────────────────────────────────

test.describe('Visual snapshots - Mobile', () => {
  for (const { name, path } of PAGES) {
    test(`${name} page renders correctly on mobile`, async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Dismiss cookie banner if present so it doesn't occlude content
      const acceptBtn = page.locator('#cookie-accept');
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();
      }
      await expect(page).toHaveScreenshot(`${name}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});

test.describe('Visual snapshots - Desktop', () => {
  for (const { name, path } of PAGES) {
    test(`${name} page renders correctly on desktop`, async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Dismiss cookie banner if present so it doesn't occlude content
      const acceptBtn = page.locator('#cookie-accept');
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();
      }
      await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
