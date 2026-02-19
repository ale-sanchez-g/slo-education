import { test, expect } from '@playwright/test';

test.describe('Privacy Policy Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/privacy-policy.html');
    await page.waitForLoadState('networkidle');
  });

  test('should load the privacy policy page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Privacy Policy/);
    
    // Check main heading
    const heading = page.locator('h2').first();
    await expect(heading).toContainText('Privacy Policy');
  });

  test('should have navigation links in header', async ({ page }) => {
    const homeLink = page.locator('a[href="index.html"]').first();
    await expect(homeLink).toBeVisible();
    
    const privacyLink = page.locator('a[href="privacy-policy.html"]').first();
    await expect(privacyLink).toBeVisible();
  });

  test('should display Australian Privacy Act compliance statement', async ({ page }) => {
    const content = page.locator('.privacy-content');
    await expect(content).toBeVisible();
    
    // Check for Australian Privacy Act mention
    await expect(content).toContainText('Australian Privacy Act');
    await expect(content).toContainText('Australian Privacy Principles');
  });

  test('should have all major sections', async ({ page }) => {
    // Check for key sections
    await expect(page.locator('h3', { hasText: 'Introduction' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Information We Collect' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'How We Use Your Information' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Cookies and Tracking Technologies' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Your Rights Under Australian Privacy Law' })).toBeVisible();
  });

  test('should have link to Google Privacy Policy', async ({ page }) => {
    const googlePrivacyLink = page.locator('a[href*="policies.google.com/privacy"]');
    await expect(googlePrivacyLink).toBeVisible();
  });

  test('should have link to OAIC website', async ({ page }) => {
    const oaicLink = page.locator('a[href*="oaic.gov.au"]');
    await expect(oaicLink).toBeVisible();
  });

  test('should have link to GitHub repository for contact', async ({ page }) => {
    const githubLink = page.locator('a[href*="github.com/ale-sanchez-g/slo-education"]');
    await expect(githubLink).toBeVisible();
  });

  test('should have privacy policy link in footer', async ({ page }) => {
    const footerPrivacyLink = page.locator('footer a[href="privacy-policy.html"]');
    await expect(footerPrivacyLink).toBeVisible();
  });

  test('should display last updated date', async ({ page }) => {
    const content = page.locator('.privacy-content');
    await expect(content).toContainText('Last Updated:');
  });

  test('should be accessible via navigation from home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click on Privacy link in navigation
    const privacyNavLink = page.locator('nav a[href="privacy-policy.html"]');
    await privacyNavLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the privacy policy page
    await expect(page).toHaveURL(/privacy-policy.html/);
    await expect(page.locator('h2').first()).toContainText('Privacy Policy');
  });

  test('should be accessible via cookie banner Learn More link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if cookie banner is visible
    const cookieBanner = page.locator('#cookie-consent-banner');
    const isVisible = await cookieBanner.isVisible();
    
    if (isVisible) {
      // Click Learn More link
      const learnMoreLink = cookieBanner.locator('a[href="privacy-policy.html"]');
      await learnMoreLink.click();
      
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the privacy policy page
      await expect(page).toHaveURL(/privacy-policy.html/);
      await expect(page.locator('h2').first()).toContainText('Privacy Policy');
    }
  });

  test('should be accessible via footer link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Dismiss cookie banner if visible
    const cookieBanner = page.locator('#cookie-consent-banner');
    if (await cookieBanner.isVisible()) {
      await page.locator('#cookie-decline').click();
      await cookieBanner.waitFor({ state: 'hidden' });
    }
    
    // Click on Privacy Policy link in footer
    const footerPrivacyLink = page.locator('footer a[href="privacy-policy.html"]');
    await footerPrivacyLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the privacy policy page
    await expect(page).toHaveURL(/privacy-policy.html/);
    await expect(page.locator('h2').first()).toContainText('Privacy Policy');
  });
});
