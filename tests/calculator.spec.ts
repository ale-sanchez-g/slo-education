import { test, expect } from '@playwright/test';

test.describe('Error Budget Calculator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/error-budget-calculator');
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
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();
  });

  test('should display calculator with default SLO selected', async ({ page }) => {
    const sloInput = page.locator('#slo-target');
    await expect(sloInput).toBeVisible();
    
    // Check default value is 99.9%
    const inputValue = await sloInput.inputValue();
    expect(inputValue).toBe('99.9');
  });

  test('should display metrics for default SLO', async ({ page }) => {
    // Check downtime minutes
    const downtimeMinutes = page.locator('#downtime-minutes');
    await expect(downtimeMinutes).toContainText('43.2');
    await expect(page.locator('#downtime-minutes-unit')).toContainText('30 days');
    
    // Check downtime hours
    const downtimeHours = page.locator('#downtime-hours');
    await expect(downtimeHours).toBeVisible();
    
    // Check failure rate
    const failureRate = page.locator('#failure-rate');
    await expect(failureRate).toContainText('0.1%');
  });

  test('should update metrics when SLO target changes', async ({ page }) => {
    const sloInput = page.locator('#slo-target');
    
    // Change to 99%
    await sloInput.fill('99');
    await page.waitForTimeout(500);
    
    // Check updated values
    const downtimeMinutes = page.locator('#downtime-minutes');
    await expect(downtimeMinutes).toContainText('432');
    
    const failureRate = page.locator('#failure-rate');
    await expect(failureRate).toContainText('1');
  });

  test('should calculate burn rate correctly', async ({ page }) => {
    // Use default 99.9% SLO (43.2 minutes budget per 30 days)
    const actualDowntimeInput = page.locator('#actual-downtime');
    const daysElapsedInput = page.locator('#days-elapsed');
    const calculateBtn = page.locator('#calculate-burn');
    
    // 5 minutes of downtime by day 10
    await actualDowntimeInput.fill('5');
    await daysElapsedInput.fill('10');
    await calculateBtn.click();
    
    // Wait for result
    await page.waitForTimeout(500);
    
    // Check burn rate result is displayed
    const burnRateResult = page.locator('#burn-rate-result');
    await expect(burnRateResult).toBeVisible();
    
    // Budget used 5/43.2 = 11.6%, window elapsed 10/30 = 33.3%, burn rate ≈ 0.35×
    const burnRateValue = page.locator('#burn-rate-value');
    await expect(burnRateValue).toContainText('0.35×');
    await expect(page.locator('#burn-rate-detail')).toContainText('11.6% of the 43.2 min budget used');
    
    // Under 1× the budget lasts the window
    const burnRateStatus = page.locator('#burn-rate-status');
    await expect(burnRateStatus).toContainText('On Pace');
  });

  test('should display correct burn rate status for different rates', async ({ page }) => {
    const actualDowntimeInput = page.locator('#actual-downtime');
    const calculateBtn = page.locator('#calculate-burn');
    const burnRateStatus = page.locator('#burn-rate-status');
    
    const daysElapsedInput = page.locator('#days-elapsed');
    const burnRateValue = page.locator('#burn-rate-value');

    // On pace (≤ 1×): 2 min by day 30 → 0.05×
    await actualDowntimeInput.fill('2');
    await daysElapsedInput.fill('30');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateStatus).toContainText('On Pace');
    
    // Above pace (1×–2×): 30 min by day 15 → 1.39×
    await actualDowntimeInput.fill('30');
    await daysElapsedInput.fill('15');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateValue).toContainText('1.39×');
    await expect(burnRateStatus).toContainText('Above Pace');
    await expect(burnRateStatus).toContainText('around day 22');
    
    // Fast burn (≥ 2×): 10 min by day 2 → 3.47×
    await actualDowntimeInput.fill('10');
    await daysElapsedInput.fill('2');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateValue).toContainText('3.47×');
    await expect(burnRateStatus).toContainText('Fast Burn');
    await expect(burnRateStatus).toContainText('around day 9');
    
    // Exhausted: 50 min by day 25 is more than the 43.2 min budget
    await actualDowntimeInput.fill('50');
    await daysElapsedInput.fill('25');
    await calculateBtn.click();
    await page.waitForTimeout(500);
    await expect(burnRateStatus).toContainText('Budget Exhausted');
  });

  test('should require days elapsed to calculate burn rate', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('#actual-downtime').fill('5');
    await page.locator('#calculate-burn').click();
    await page.waitForTimeout(300);

    expect(dialogMessage).toContain('days elapsed');
    await expect(page.locator('#burn-rate-result')).toBeHidden();
  });

  test('should have progress bar that updates with SLO', async ({ page }) => {
    const progressBar = page.locator('#progress-bar');
    const progressPercentage = page.locator('#progress-percentage');
    const sloInput = page.locator('#slo-target');
    
    // Check default progress bar
    await expect(progressBar).toBeVisible();
    await expect(progressPercentage).toContainText('99.9%');
    
    // Change SLO and check progress bar updates
    await sloInput.fill('99');
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
    
    // Check SLO input works on mobile
    const sloInput = page.locator('#slo-target');
    await expect(sloInput).toBeVisible();
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
    const calculatorLink = page.locator('a[href="/error-budget-calculator"]').first();
    await calculatorLink.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify we're on calculator page
    await expect(page).toHaveURL(/\/error-budget-calculator/);
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
    
    // Enter values and press Enter
    await actualDowntimeInput.fill('5');
    await page.locator('#days-elapsed').fill('10');
    await actualDowntimeInput.press('Enter');
    
    // Wait for result
    await page.waitForTimeout(500);
    
    // Check result is displayed
    const burnRateResult = page.locator('#burn-rate-result');
    await expect(burnRateResult).toBeVisible();
  });
});
