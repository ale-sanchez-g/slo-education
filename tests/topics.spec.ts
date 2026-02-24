import { test, expect } from '@playwright/test';

test.describe('Agent SLO Fundamentals Topics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/topics/agent-slo-fundamentals.html');
    await page.waitForLoadState('networkidle');
  });

  test('should load the topics page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Agent SLO Fundamentals/);

    const heading = page.locator('h2').first();
    await expect(heading).toContainText('Agent SLO Fundamentals');
  });

  test('should display the framework section', async ({ page }) => {
    const frameworkSection = page.locator('#framework');
    await expect(frameworkSection).toBeVisible();
    await expect(frameworkSection.locator('h2')).toContainText('Framework for Defining Measurable');
  });

  test('should display all five framework steps', async ({ page }) => {
    const steps = page.locator('.framework-step');
    await expect(steps).toHaveCount(5);

    await expect(steps.nth(0)).toContainText('Identify Critical User Journeys');
    await expect(steps.nth(1)).toContainText('Service Level Indicators');
    await expect(steps.nth(2)).toContainText('Measurable SLO Targets');
    await expect(steps.nth(3)).toContainText('Error Budget');
    await expect(steps.nth(4)).toContainText('Review and Iterate');
  });

  test('should display the tools comparison section', async ({ page }) => {
    const toolsSection = page.locator('#tools');
    await expect(toolsSection).toBeVisible();
    await expect(toolsSection.locator('h2')).toContainText('Comparing SLO Tools');
  });

  test('should display the tools comparison table with expected tools', async ({ page }) => {
    const table = page.locator('.tools-table');
    await expect(table).toBeVisible();

    await expect(table).toContainText('Google Cloud Monitoring');
    await expect(table).toContainText('Datadog');
    await expect(table).toContainText('Dynatrace');
    await expect(table).toContainText('New Relic');
    await expect(table).toContainText('Prometheus');
    await expect(table).toContainText('Nobl9');
    await expect(table).toContainText('OpenSLO');
  });

  test('should display tool detail cards', async ({ page }) => {
    const toolCards = page.locator('.tool-card');
    await expect(toolCards).toHaveCount(5);
  });

  test('should display the key principles section', async ({ page }) => {
    const principlesSection = page.locator('#principles');
    await expect(principlesSection).toBeVisible();
    await expect(principlesSection.locator('h2')).toContainText('Key Principles');
  });

  test('should display the choosing a tool section', async ({ page }) => {
    const choosingSection = page.locator('#choosing');
    await expect(choosingSection).toBeVisible();
    await expect(choosingSection.locator('h2')).toContainText('How to Choose');
  });

  test('should have navigation links in header', async ({ page }) => {
    const homeLink = page.locator('nav a[href="../index.html"]').first();
    await expect(homeLink).toBeVisible();
  });

  test('should have a link to the error budget calculator', async ({ page }) => {
    const calcLink = page.locator('a[href="../error-budget-calculator.html"]').first();
    await expect(calcLink).toBeVisible();
  });

  test('should have a link to the incident management page', async ({ page }) => {
    const incLink = page.locator('a[href="../incident-management.html"]').first();
    await expect(incLink).toBeVisible();
  });

  test('should have a privacy policy link in the footer', async ({ page }) => {
    const footerPrivacyLink = page.locator('footer a[href="../privacy-policy.html"]');
    await expect(footerPrivacyLink).toBeVisible();
  });

  test('should be accessible via Topics link from home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const topicsLink = page.locator('nav a[href="topics/agent-slo-fundamentals.html"]');
    await topicsLink.click();

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/topics\/agent-slo-fundamentals\.html/);
    await expect(page.locator('h2').first()).toContainText('Agent SLO Fundamentals');
  });
});
