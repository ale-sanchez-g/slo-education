import { test, expect } from '@playwright/test';

// Pages that include the centralised resources module
const PAGES_WITH_RESOURCES = [
  { name: 'home', path: '/' },
  { name: 'error-budget-calculator', path: '/error-budget-calculator' },
  { name: 'incident-management', path: '/incident-management' },
  { name: 'cuj-sli-slo-error-budget', path: '/cuj-sli-slo-error-budget' },
];

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ─── Renders on every relevant page ──────────────────────────────────────────

test.describe('Resources Module – renders on all pages', () => {
  for (const { name, path } of PAGES_WITH_RESOURCES) {
    test(`${name} page has a visible Resources section`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const section = page.locator('#resources-section');
      await expect(section).toBeVisible();

      const heading = section.locator('h2');
      await expect(heading).toHaveText('Resources');
    });
  }
});

// ─── Content consistency across pages ────────────────────────────────────────

test.describe('Resources Module – content consistency', () => {
  for (const { name, path } of PAGES_WITH_RESOURCES) {
    test(`${name} page resources section has three category cards`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const cards = page.locator('#resources-section .resource-card');
      await expect(cards).toHaveCount(3);

      await expect(cards.nth(0).locator('h4')).toContainText('Documentation');
      await expect(cards.nth(1).locator('h4')).toContainText('Community');
      await expect(cards.nth(2).locator('h4')).toContainText('Tools');
    });
  }
});

// ─── Per-page link checks ─────────────────────────────────────────────────────

test.describe('Resources Module – per-page link checks', () => {
  for (const { name, path } of PAGES_WITH_RESOURCES) {
    test(`${name} page resources section contains expected links`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const section = page.locator('#resources-section');

      // Documentation links present on every page
      await expect(section.locator('a[href="https://sre.google/sre-book/table-of-contents/"]')).toBeVisible();
      await expect(section.locator('a[href="https://sre.google/workbook/table-of-contents/"]')).toBeVisible();

      // Community link present on every page
      await expect(section.locator('a[href="https://discord.gg/YdG26M8P"]')).toBeVisible();

      // Tools links present on every page
      await expect(section.locator('a[href="https://github.com/slok/sloth"]')).toBeVisible();
      await expect(section.locator('a[href="/error-budget-calculator"]')).toBeVisible();
    });
  }
});

// ─── External links security attributes ──────────────────────────────────────

test.describe('Resources Module – external link security attributes', () => {
  for (const { name, path } of PAGES_WITH_RESOURCES) {
    test(`${name} page external links have target="_blank" and rel="noopener noreferrer"`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const externalLinks = page.locator('#resources-section a[target="_blank"]');
      const count = await externalLinks.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const rel = await externalLinks.nth(i).getAttribute('rel');
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');
      }
    });
  }
});

// ─── Placement relative to footer ────────────────────────────────────────────

test.describe('Resources Module – placement above footer', () => {
  for (const { name, path } of PAGES_WITH_RESOURCES) {
    test(`${name} page resources section appears before the footer`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const resourcesBox = await page.locator('#resources-section').boundingBox();
      const footerBox = await page.locator('footer').boundingBox();

      expect(resourcesBox).not.toBeNull();
      expect(footerBox).not.toBeNull();
      expect(resourcesBox!.y).toBeLessThan(footerBox!.y);
    });
  }
});

// ─── Grid layout ─────────────────────────────────────────────────────────────

test.describe('Resources Module – grid layout', () => {
  test('resources grid has correct CSS class on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('#resources-section .resources-grid');
    await expect(grid).toBeVisible();
  });

  test('resources grid collapses to single column on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('#resources-section .resources-grid');
    await expect(grid).toBeVisible();

    const columns = await grid.evaluate((el) =>
      window.getComputedStyle(el as HTMLElement).gridTemplateColumns
    );

    // On mobile (375px) all cards should stack in a single column
    const columnCount = columns.trim().split(' ').length;
    expect(columnCount).toBe(1);
  });
});

// ─── Privacy policy page must NOT contain the resources module ────────────────

test.describe('Resources Module – excluded pages', () => {
  test('privacy-policy page does not include the resources section', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.waitForLoadState('networkidle');

    const section = page.locator('#resources-section');
    await expect(section).toHaveCount(0);
  });
});