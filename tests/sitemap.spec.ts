import { test, expect } from '@playwright/test';

const SITE_DOMAIN = 'https://slo-education.com.au';

const EXPECTED_URLS = [
  `${SITE_DOMAIN}/`,
  `${SITE_DOMAIN}/cuj-sli-slo-error-budget.html`,
  `${SITE_DOMAIN}/error-budget-calculator.html`,
  `${SITE_DOMAIN}/incident-management.html`,
  `${SITE_DOMAIN}/privacy-policy.html`,
];

test.describe('Sitemap and Robots.txt', () => {
  test('sitemap.xml should be accessible and return valid XML', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/^(application|text)\/xml\b/i);
  });

  test('sitemap.xml should contain all expected page URLs', async ({ page }) => {
    await page.goto('/sitemap.xml');
    const content = await page.content();

    for (const url of EXPECTED_URLS) {
      expect(content).toContain(url);
    }
  });

  test('sitemap.xml should use the correct XML namespace', async ({ page }) => {
    await page.goto('/sitemap.xml');
    const content = await page.content();

    expect(content).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
  });

  test('robots.txt should be accessible and served as plain text', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/text\/plain/i);
  });

  test('robots.txt should allow all user agents and reference the sitemap', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    const content = await response?.text();

    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');
    expect(content).toContain(`${SITE_DOMAIN}/sitemap.xml`);
  });
});
