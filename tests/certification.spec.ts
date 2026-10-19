import { test, expect, Page } from '@playwright/test';

/** Answer every question, choosing the correct option when `correct` is true. */
async function answerAll(page: Page, correct: boolean) {
  await page.locator('#start-exam').click();
  for (let i = 0; i < 20; i++) {
    const target = correct
      ? page.locator('.exam-option input[data-correct="true"]')
      : page.locator('.exam-option input:not([data-correct="true"])').first();
    await target.check();
    await page.locator('#next-question').click();
  }
}

test.describe('Certification page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/certification');
    await page.waitForLoadState('networkidle');
  });

  test('loads with title, heading and nav link', async ({ page }) => {
    await expect(page).toHaveTitle(/Certification/);
    await expect(page.locator('h2').first()).toContainText('SLOs');
    await expect(page.locator('.nav-links a[href="/certification"]')).toBeVisible();
  });

  test('shows the free Foundation tier and the coming-soon membership tier', async ({ page }) => {
    await expect(page.locator('.tier-available')).toContainText('Free');
    await expect(page.locator('.tier-soon')).toContainText('Coming soon');
    await expect(page.locator('.tier-soon')).toContainText('workshops');
  });

  test('the next button is disabled until an answer is chosen', async ({ page }) => {
    await page.locator('#start-exam').click();
    await expect(page.locator('#next-question')).toBeDisabled();
    await page.locator('.exam-option input').first().check();
    await expect(page.locator('#next-question')).toBeEnabled();
  });

  test('failing attempt shows the score, study links and no certificate', async ({ page }) => {
    await answerAll(page, false);
    await expect(page.locator('.exam-result.failed')).toBeVisible();
    await expect(page.locator('.exam-score')).toContainText('/ 20');
    await expect(page.locator('.exam-review a').first()).toBeVisible();
    await expect(page.locator('#make-certificate')).toHaveCount(0);
  });

  test('passing attempt requires a name, then renders a certificate with share options', async ({ page }) => {
    await answerAll(page, true);
    await expect(page.locator('.exam-result.passed')).toContainText('20 / 20');

    await page.locator('#make-certificate').click();
    await expect(page.locator('#certificate-canvas')).toHaveCount(0);

    await page.locator('#cert-name').fill('Ada Lovelace');
    await page.locator('#make-certificate').click();
    await expect(page.locator('#certificate-canvas')).toBeVisible();

    const profile = await page.locator('#share-linkedin-profile').getAttribute('href');
    expect(profile).toContain('linkedin.com/profile/add');
    expect(profile).toContain('organizationName=SLO%20Education%20Hub');
    expect(profile).toMatch(/certId=SLO-F-\d{8}-[A-Z0-9]{6}/);

    expect(await page.locator('#share-x').getAttribute('href')).toContain('twitter.com/intent/tweet');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#download-cert').click(),
    ]);
    expect(download.suggestedFilename()).toBe('slo-foundation-certificate-ada-lovelace.png');
  });

  test('has no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/certification');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
