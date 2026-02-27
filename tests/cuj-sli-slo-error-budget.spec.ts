import { test, expect } from '@playwright/test';

test.describe('CUJ → SLI → SLO → Error Budget Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cuj-sli-slo-error-budget.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load & Structure', () => {
    test('should load the page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/CUJ.*SLI.*SLO.*Error Budget.*SLO Education Hub/);
    });

    test('should have proper semantic structure', async ({ page }) => {
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });

    test('should display the hero section with correct heading', async ({ page }) => {
      const heading = page.locator('.hero h2');
      await expect(heading).toBeVisible();
      await expect(heading).toContainText('CUJ');
      await expect(heading).toContainText('SLI');
      await expect(heading).toContainText('SLO');
      await expect(heading).toContainText('Error Budget');
    });

    test('should have navigation links', async ({ page }) => {
      const navLinks = page.locator('.nav-links');
      await expect(navLinks).toBeVisible();
    });

    test('should have a link back to home in navigation', async ({ page }) => {
      const homeLink = page.locator('.nav-links a:has-text("Home")');
      await expect(homeLink).toBeVisible();
    });
  });

  test.describe('Flow Diagram Section', () => {
    test('should display the flow overview section', async ({ page }) => {
      const section = page.locator('#flow-overview');
      await expect(section).toBeVisible();
    });

    test('should show all four pipeline steps', async ({ page }) => {
      const steps = page.locator('.flow-step');
      await expect(steps).toHaveCount(4);
    });

    test('should display CUJ step in the flow', async ({ page }) => {
      const cujLabel = page.locator('.flow-step .flow-label:has-text("CUJ")');
      await expect(cujLabel).toBeVisible();
    });

    test('should display SLI step in the flow', async ({ page }) => {
      const sliLabel = page.locator('.flow-step .flow-label:has-text("SLI")');
      await expect(sliLabel).toBeVisible();
    });

    test('should display SLO step in the flow', async ({ page }) => {
      const sloLabel = page.locator('.flow-step .flow-label:has-text("SLO")');
      await expect(sloLabel).toBeVisible();
    });

    test('should display Error Budget step in the flow', async ({ page }) => {
      const budgetLabel = page.locator('.flow-step .flow-label:has-text("Error Budget")');
      await expect(budgetLabel).toBeVisible();
    });
  });

  test.describe('CUJ Educational Section', () => {
    test('should display the CUJ section', async ({ page }) => {
      const section = page.locator('#what-is-cuj');
      await expect(section).toBeVisible();
    });

    test('should show CUJ cards with content', async ({ page }) => {
      const cujCards = page.locator('.cuj-card');
      await expect(cujCards).toHaveCount(3);
    });
  });

  test.describe('Interactive Demo', () => {
    test('should display the interactive demo section', async ({ page }) => {
      const section = page.locator('#interactive-demo');
      await expect(section).toBeVisible();
    });

    test('should display three journey cards', async ({ page }) => {
      const journeyCards = page.locator('.journey-card');
      await expect(journeyCards).toHaveCount(3);
    });

    test('should show Flight Booking journey card', async ({ page }) => {
      const bookingCard = page.locator('.journey-card[data-journey="booking"]');
      await expect(bookingCard).toBeVisible();
      await expect(bookingCard).toContainText('Flight Booking');
    });

    test('should show Airport Check-in journey card', async ({ page }) => {
      const checkinCard = page.locator('.journey-card[data-journey="checkin"]');
      await expect(checkinCard).toBeVisible();
      await expect(checkinCard).toContainText('Airport Check-in');
    });

    test('should show Flight Operations journey card', async ({ page }) => {
      const opsCard = page.locator('.journey-card[data-journey="operations"]');
      await expect(opsCard).toBeVisible();
      await expect(opsCard).toContainText('Flight Operations');
    });

    test('should auto-select Flight Booking journey on load', async ({ page }) => {
      const bookingCard = page.locator('.journey-card[data-journey="booking"]');
      await expect(bookingCard).toHaveClass(/active/);
      await expect(bookingCard).toHaveAttribute('aria-pressed', 'true');
    });

    test('should display SLI name after auto-selecting booking', async ({ page }) => {
      const sliName = page.locator('#sli-name');
      await expect(sliName).toContainText('Booking Success Rate');
    });

    test('should display SLI value for booking journey', async ({ page }) => {
      const sliValue = page.locator('#sli-value');
      await expect(sliValue).toContainText('99.2%');
    });

    test('should display SLO target badge for booking journey', async ({ page }) => {
      const sloBadge = page.locator('#slo-target-badge');
      await expect(sloBadge).toContainText('99.5%');
    });

    test('should display SLO status for booking journey', async ({ page }) => {
      // Booking SLI (99.2%) is below SLO (99.5%), so it should show breached
      const sloStatus = page.locator('#slo-status');
      await expect(sloStatus).toBeVisible();
      await expect(sloStatus).toContainText('SLO');
    });

    test('should display budget percentage after journey selection', async ({ page }) => {
      const budgetPercentage = page.locator('#budget-percentage');
      await expect(budgetPercentage).toContainText('100.0%');
    });

    test('should display budget hours for booking journey', async ({ page }) => {
      const budgetHours = page.locator('#budget-hours');
      await expect(budgetHours).toContainText('3.65h');
    });

    test('should display decision text after journey selection', async ({ page }) => {
      const decisionText = page.locator('#decision-text');
      await expect(decisionText).not.toContainText('Select a journey');
    });

    test('should display budget bar after journey selection', async ({ page }) => {
      const budgetBar = page.locator('#budget-bar');
      await expect(budgetBar).toBeVisible();
    });
  });

  test.describe('Journey Switching', () => {
    test('should switch to Check-in journey when card is clicked', async ({ page }) => {
      const checkinCard = page.locator('.journey-card[data-journey="checkin"]');
      await checkinCard.click();

      await expect(checkinCard).toHaveClass(/active/);
      await expect(checkinCard).toHaveAttribute('aria-pressed', 'true');

      const sliName = page.locator('#sli-name');
      await expect(sliName).toContainText('Check-in Completion Rate');
    });

    test('should switch to Flight Operations journey when card is clicked', async ({ page }) => {
      const opsCard = page.locator('.journey-card[data-journey="operations"]');
      await opsCard.click();

      await expect(opsCard).toHaveClass(/active/);

      const sliName = page.locator('#sli-name');
      await expect(sliName).toContainText('Real-time Update Delivery Rate');
    });

    test('should update SLO target when switching journeys', async ({ page }) => {
      // Start with booking (99.5%)
      const sloBadge = page.locator('#slo-target-badge');
      await expect(sloBadge).toContainText('99.5%');

      // Switch to check-in (99.9%)
      const checkinCard = page.locator('.journey-card[data-journey="checkin"]');
      await checkinCard.click();
      await expect(sloBadge).toContainText('99.9%');

      // Switch to operations (99.95%)
      const opsCard = page.locator('.journey-card[data-journey="operations"]');
      await opsCard.click();
      await expect(sloBadge).toContainText('99.95%');
    });

    test('should deactivate previous card when switching journeys', async ({ page }) => {
      // Booking is active by default
      const bookingCard = page.locator('.journey-card[data-journey="booking"]');
      const checkinCard = page.locator('.journey-card[data-journey="checkin"]');

      // Switch to check-in
      await checkinCard.click();

      // Booking should no longer be active
      await expect(bookingCard).not.toHaveClass(/active/);
      await expect(bookingCard).toHaveAttribute('aria-pressed', 'false');
    });

    test('should update budget hours when switching journeys', async ({ page }) => {
      // Booking has 3.65h budget
      const budgetHours = page.locator('#budget-hours');
      await expect(budgetHours).toContainText('3.65h');

      // Check-in has 0.73h = 43.8 min
      const checkinCard = page.locator('.journey-card[data-journey="checkin"]');
      await checkinCard.click();
      await expect(budgetHours).toContainText('min');
    });
  });

  test.describe('Simulate Incident Interaction', () => {
    test('should have Simulate Incident button enabled after journey selection', async ({ page }) => {
      const simulateBtn = page.locator('#simulate-incident');
      await expect(simulateBtn).toBeVisible();
      await expect(simulateBtn).not.toBeDisabled();
    });

    test('should reduce budget when Simulate Incident is clicked', async ({ page }) => {
      const budgetPercentage = page.locator('#budget-percentage');
      await expect(budgetPercentage).toContainText('100.0%');

      const simulateBtn = page.locator('#simulate-incident');
      await simulateBtn.click();
      await page.waitForTimeout(300);

      // Budget should be less than 100%
      const percentageText = await budgetPercentage.textContent();
      const value = parseFloat(percentageText || '100');
      expect(value).toBeLessThan(100);
    });

    test('should disable Simulate Incident when budget is exhausted', async ({ page }) => {
      const simulateBtn = page.locator('#simulate-incident');

      // Click 7 times (15% each time = 105% spent, exhausted)
      for (let i = 0; i < 7; i++) {
        const isDisabled = await simulateBtn.isDisabled();
        if (isDisabled) break;
        await simulateBtn.click();
        await page.waitForTimeout(100);
      }

      // Button should be disabled once budget is exhausted
      await expect(simulateBtn).toBeDisabled();
    });

    test('should reset budget when Reset Budget button is clicked', async ({ page }) => {
      const simulateBtn = page.locator('#simulate-incident');
      const resetBtn = page.locator('#reset-budget');
      const budgetPercentage = page.locator('#budget-percentage');

      // Spend some budget
      await simulateBtn.click();
      await page.waitForTimeout(300);

      const afterSpend = await budgetPercentage.textContent();
      const spentValue = parseFloat(afterSpend || '100');
      expect(spentValue).toBeLessThan(100);

      // Reset
      await resetBtn.click();
      await page.waitForTimeout(300);

      await expect(budgetPercentage).toContainText('100.0%');
    });

    test('should update decision text as budget is spent', async ({ page }) => {
      const decisionText = page.locator('#decision-text');
      const simulateBtn = page.locator('#simulate-incident');

      // Initial decision (100% = healthy)
      const initialText = await decisionText.textContent();
      expect(initialText).toContain('deploy freely');

      // Exhaust budget by clicking multiple times
      for (let i = 0; i < 7; i++) {
        const isDisabled = await simulateBtn.isDisabled();
        if (isDisabled) break;
        await simulateBtn.click();
        await page.waitForTimeout(100);
      }

      // Decision should change as budget is exhausted
      const exhaustedText = await decisionText.textContent();
      expect(exhaustedText).not.toBe(initialText);
    });
  });

  test.describe('Educational Content Sections', () => {
    test('should display the SLI educational section', async ({ page }) => {
      const section = page.locator('#about-sli');
      await expect(section).toBeVisible();
    });

    test('should display four SLI type cards', async ({ page }) => {
      const sliTypes = page.locator('.sli-type-card');
      await expect(sliTypes).toHaveCount(4);
    });

    test('should display the SLO educational section', async ({ page }) => {
      const section = page.locator('#about-slo');
      await expect(section).toBeVisible();
    });

    test('should display the Error Budget educational section', async ({ page }) => {
      const section = page.locator('#about-error-budget');
      await expect(section).toBeVisible();
    });

    test('should display four budget usage cards', async ({ page }) => {
      const budgetCards = page.locator('.budget-use-card');
      await expect(budgetCards).toHaveCount(4);
    });

    test('should display the pipeline steps section', async ({ page }) => {
      const section = page.locator('#putting-together');
      await expect(section).toBeVisible();
    });

    test('should show five pipeline steps', async ({ page }) => {
      const pipelineSteps = page.locator('.pipeline-step');
      await expect(pipelineSteps).toHaveCount(5);
    });

    test('should display the quick reference table', async ({ page }) => {
      const section = page.locator('#quick-reference');
      await expect(section).toBeVisible();

      const table = section.locator('table');
      await expect(table).toBeVisible();
    });

    test('should display the further reading section', async ({ page }) => {
      const section = page.locator('#further-reading');
      await expect(section).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('journey cards should have aria-pressed attributes', async ({ page }) => {
      const cards = page.locator('.journey-card');
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        const ariaPressed = await card.getAttribute('aria-pressed');
        expect(['true', 'false']).toContain(ariaPressed);
      }
    });

    test('journey card group should have aria-label', async ({ page }) => {
      const group = page.locator('.journey-cards[role="group"]');
      await expect(group).toHaveAttribute('aria-label');
    });

    test('budget progress bar should have ARIA role and attributes', async ({ page }) => {
      // First select a journey to activate
      const budgetWrapper = page.locator('#step-budget .budget-bar-wrapper');
      await expect(budgetWrapper).toHaveAttribute('role', 'progressbar');
      await expect(budgetWrapper).toHaveAttribute('aria-label');
    });

    test('SLI progress bar should have ARIA role and attributes', async ({ page }) => {
      const sliWrapper = page.locator('#step-sli .sli-bar-wrapper');
      await expect(sliWrapper).toHaveAttribute('role', 'progressbar');
      await expect(sliWrapper).toHaveAttribute('aria-label');
    });

    test('journey cards should be keyboard activatable with Enter key', async ({ page }) => {
      const checkinCard = page.locator('.journey-card[data-journey="checkin"]');
      await checkinCard.focus();
      await page.keyboard.press('Enter');

      await expect(checkinCard).toHaveClass(/active/);
    });

    test('journey cards should be keyboard activatable with Space key', async ({ page }) => {
      const opsCard = page.locator('.journey-card[data-journey="operations"]');
      await opsCard.focus();
      await page.keyboard.press('Space');

      await expect(opsCard).toHaveClass(/active/);
    });
  });

  test.describe('Navigation', () => {
    test('should have the CUJ → SLI → SLO link highlighted as active in nav', async ({ page }) => {
      const cujLink = page.locator('.nav-links a[href="cuj-sli-slo-error-budget.html"]');
      await expect(cujLink).toHaveClass(/active/);
    });

    test('should navigate to home page when Home is clicked', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const homeLink = page.locator('.nav-links a:has-text("Home")');
      await homeLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/(index\.html)?$/);
    });

    test('should navigate to calculator page when Calculator is clicked', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const calcLink = page.locator('.nav-links a:has-text("Calculator")');
      await calcLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/error-budget-calculator\.html/);
    });

    test('should navigate to incident management when clicked', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const incidentLink = page.locator('.nav-links a:has-text("Incident Management")');
      await incidentLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/incident-management\.html/);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/cuj-sli-slo-error-budget.html');
      await page.waitForLoadState('networkidle');
    });

    test('should display hamburger menu on mobile', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      await expect(hamburger).toBeVisible();
    });

    test('should display journey cards on mobile', async ({ page }) => {
      const journeyCards = page.locator('.journey-card');
      await expect(journeyCards.first()).toBeVisible();
    });

    test('should display interactive demo on mobile', async ({ page }) => {
      const demo = page.locator('#interactive-demo');
      await expect(demo).toBeVisible();
    });

    test('simulate incident button should work on mobile', async ({ page }) => {
      const simulateBtn = page.locator('#simulate-incident');
      await expect(simulateBtn).toBeVisible();
      await expect(simulateBtn).not.toBeDisabled();

      await simulateBtn.click();
      await page.waitForTimeout(300);

      const budgetPercentage = page.locator('#budget-percentage');
      const value = parseFloat((await budgetPercentage.textContent()) || '100');
      expect(value).toBeLessThan(100);
    });
  });
});
