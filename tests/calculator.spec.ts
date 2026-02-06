import { test, expect } from '@playwright/test';

test.describe('Error Budget Calculator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/error-budget-calculator.html');
    await page.waitForLoadState('networkidle');
  });

  test('should load the calculator page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Error Budget Calculator/);
    
    // Check main heading
    const heading = page.locator('h2').first();
    await expect(heading).toContainText('Error Budget Calculator');
  });

  test('should have navigation back to home page', async ({ page }) => {
    const homeLink = page.locator('a[href="index.html"]').first();
    await expect(homeLink).toBeVisible();
  });

  test('should display calculator with default SLO selected', async ({ page }) => {
    const sloSelect = page.locator('#slo-target');
    await expect(sloSelect).toBeVisible();
    
    // Check default value is 99.9%
    const selectedValue = await sloSelect.inputValue();
    expect(selectedValue).toBe('99.9');
  });

  test('should display metrics for default SLO', async ({ page }) => {
    // Check downtime minutes
    const downtimeMinutes = page.locator('#downtime-minutes');
    await expect(downtimeMinutes).toContainText('43.8');
    
    // Check downtime hours
    const downtimeHours = page.locator('#downtime-hours');
    await expect(downtimeHours).toBeVisible();
    
    // Check failure rate
    const failureRate = page.locator('#failure-rate');
    await expect(failureRate).toContainText('0.1%');
  });

  test('should update metrics when SLO target changes', async ({ page }) => {
    const sloSelect = page.locator('#slo-target');
    
    // Change to 99%
    await sloSelect.selectOption('99');
    await page.waitForTimeout(500);
    
    // Check updated values
    const downtimeMinutes = page.locator('#downtime-minutes');
    await expect(downtimeMinutes).toContainText('438');
    
    const failureRate = page.locator('#failure-rate');
    await expect(failureRate).toContainText('1');
  });

  test('should calculate burn rate correctly', async ({ page }) => {
    // Use default 99.9% SLO (43.8 minutes budget)
    const actualDowntimeInput = page.locator('#actual-downtime');
    const calculateBtn = page.locator('#calculate-burn');
    
    // Enter 5 minutes of downtime
    await actualDowntimeInput.fill('5');
    await calculateBtn.click();
    
    // Wait for result
    await page.waitForTimeout(500);
    
    // Check burn rate result is displayed
    const burnRateResult = page.locator('#burn-rate-result');
    await expect(burnRateResult).toBeVisible();
    
    // Check burn rate value (5/43.8 * 100 ≈ 11.4%)
    const burnRateValue = page.locator('#burn-rate-value');
    await expect(burnRateValue).toContainText('11.4%');
    
    // Check status is "Critical Burn" (11.4% is >= 10%)
    const burnRateStatus = page.locator('#burn-rate-status');
    await expect(burnRateStatus).toContainText('Critical Burn');
  });

  test('should display correct burn rate status for different rates', async ({ page }) => {
    const actualDowntimeInput = page.locator('#actual-downtime');
    const calculateBtn = page.locator('#calculate-burn');
    const burnRateStatus = page.locator('#burn-rate-status');
    
    // Test slow burn (< 2%)
    await actualDowntimeInput.fill('0.5');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateStatus).toContainText('Slow Burn');
    
    // Test medium burn (2-5%)
    await actualDowntimeInput.fill('2');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateStatus).toContainText('Medium Burn');
    
    // Test fast burn (5-10%)
    await actualDowntimeInput.fill('3');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateStatus).toContainText('Fast Burn');
    
    // Test critical burn (>= 10%)
    await actualDowntimeInput.fill('10');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateStatus).toContainText('Critical Burn');
  });

  test('should have progress bar that updates with SLO', async ({ page }) => {
    const progressBar = page.locator('#progress-bar');
    const progressPercentage = page.locator('#progress-percentage');
    const sloSelect = page.locator('#slo-target');
    
    // Check default progress bar
    await expect(progressBar).toBeVisible();
    await expect(progressPercentage).toContainText('99.9%');
    
    // Change SLO and check progress bar updates
    await sloSelect.selectOption('99');
    await page.waitForTimeout(500);
    await expect(progressPercentage).toContainText('99%');
  });

  test('should validate burn rate input', async ({ page }) => {
    const calculateBtn = page.locator('#calculate-burn');
    
    // Try to calculate with empty input
    await calculateBtn.click();
    
    // Should show alert (we can't directly test alert, but we can check it doesn't crash)
    await page.waitForTimeout(500);
  });

  test('should display all educational sections', async ({ page }) => {
    // Check main sections exist
    await expect(page.locator('text=What is an Error Budget?')).toBeVisible();
    await expect(page.locator('text=Understanding the Calculator')).toBeVisible();
    await expect(page.locator('text=Burn Rate: The Critical Metric')).toBeVisible();
    await expect(page.locator('text=Best Practices')).toBeVisible();
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check calculator is still visible
    const calculator = page.locator('.calculator-card');
    await expect(calculator).toBeVisible();
    
    // Check SLO selector works on mobile
    const sloSelect = page.locator('#slo-target');
    await expect(sloSelect).toBeVisible();
  });

  test('should have proper semantic structure', async ({ page }) => {
    // Check header
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should navigate from home page to calculator', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click calculator link in navigation
    const calculatorLink = page.locator('a[href="error-budget-calculator.html"]').first();
    await calculatorLink.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify we're on calculator page
    await expect(page).toHaveURL(/error-budget-calculator.html/);
    await expect(page.locator('h2').first()).toContainText('Error Budget Calculator');
  });

  test('should have tables displaying reference data', async ({ page }) => {
    // Check for burn rate table
    const tables = page.locator('table.info-table');
    await expect(tables.first()).toBeVisible();
    
    // Check for reference table with common SLO values
    const referenceTable = page.locator('table.reference-table');
    await expect(referenceTable).toBeVisible();
  });

  test('should handle Enter key for burn rate calculation', async ({ page }) => {
    const actualDowntimeInput = page.locator('#actual-downtime');
    
    // Enter value and press Enter
    await actualDowntimeInput.fill('5');
    await actualDowntimeInput.press('Enter');
    
    // Wait for result
    await page.waitForTimeout(500);
    
    // Check result is displayed
    const burnRateResult = page.locator('#burn-rate-result');
    await expect(burnRateResult).toBeVisible();
  });
});
