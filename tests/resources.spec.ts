import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/index.html' },
  { name: 'error-budget-calculator', path: '/error-budget-calculator.html' },
  { name: 'incident-management', path: '/incident-management.html' },
  { name: 'cuj-sli-slo-error-budget', path: '/cuj-sli-slo-error-budget.html' },
  { name: 'privacy-policy', path: '/privacy-policy.html' },
];

test.describe('Resources Module', () => {
  test.describe('Renders on all pages', () => {
    for (const { name, path } of PAGES) {
      test(`${name} page has a Resources section`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const section = page.locator('#resources-section');
        await expect(section).toBeVisible();

        const heading = section.locator('h2');
        await expect(heading).toHaveText('Resources');
      });
    }
  });

  test.describe('Content consistency', () => {
    for (const { name, path } of PAGES) {
      test(`${name} page resources section has all four category cards`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const cards = page.locator('#resources-section .resource-card');
        await expect(cards).toHaveCount(4);

        // Verify the four category headings
        await expect(cards.nth(0).locator('h4')).toContainText('Documentation');
        await expect(cards.nth(1).locator('h4')).toContainText('Community');
        await expect(cards.nth(2).locator('h4')).toContainText('Tools');
        await expect(cards.nth(3).locator('h4')).toContainText('Related Pages');
      });
    }
  });

  test.describe('External links have proper attributes', () => {
    test('resources section external links open in new tab with noopener', async ({ page }) => {
      await page.goto('/index.html');
      await page.waitForLoadState('networkidle');

      const externalLinks = page.locator(
        '#resources-section a[target="_blank"]'
      );
      const count = await externalLinks.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const rel = await externalLinks.nth(i).getAttribute('rel');
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');
      }
    });
  });

  test.describe('Placement on page', () => {
    for (const { name, path } of PAGES) {
      test(`${name} page resources section appears before the footer`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const resourcesBox = await page
          .locator('#resources-section')
          .boundingBox();
        const footerBox = await page.locator('footer').boundingBox();

        expect(resourcesBox).not.toBeNull();
        expect(footerBox).not.toBeNull();

        // Resources section top should be above the footer top
        expect(resourcesBox!.y).toBeLessThan(footerBox!.y);
      });
    }
  });

  test.describe('Grid layout', () => {
    test('resources grid has correct CSS class', async ({ page }) => {
      await page.goto('/index.html');
      await page.waitForLoadState('networkidle');

      const grid = page.locator('#resources-section .resources-grid');
      await expect(grid).toBeVisible();
    });

    test('resources grid collapses to single column on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/index.html');
      await page.waitForLoadState('networkidle');

      const grid = page.locator('#resources-section .resources-grid');
      const columns = await grid.evaluate((el) =>
        window.getComputedStyle(el).gridTemplateColumns
      );

      // On mobile (375px) all cards should stack in a single column
      const columnCount = columns.trim().split(' ').length;
      expect(columnCount).toBe(1);
    });
  });
});
