import { test, expect } from '@playwright/test';

test.describe('Incident Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/incident-management.html');
    await page.waitForLoadState('networkidle');
  });

  test('should load the incident management page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Incident Management/);

    // Check main heading
    const heading = page.locator('h2').first();
    await expect(heading).toContainText('Incident Management Guide');
  });

  test('should have navigation to other pages', async ({ page }) => {
    // Check home link
    const homeLink = page.locator('a[href="index.html"]').first();
    await expect(homeLink).toBeVisible();

    // Check calculator link
    const calculatorLink = page.locator('a[href="error-budget-calculator.html"]').first();
    await expect(calculatorLink).toBeVisible();
  });

  test('should display all main sections', async ({ page }) => {
    // Check theory section
    await expect(page.locator('text=Incident Management Theory & Best Practices')).toBeVisible();

    // Check severity calculator section
    await expect(page.locator('text=Interactive Incident Severity Calculator')).toBeVisible();

    // Check tools section
    await expect(page.locator('text=Incident Management Tools in the Market')).toBeVisible();

    // Check CUJ mapping section
    await expect(page.locator('text=Critical User Journey (CUJ) Mapping Playbook')).toBeVisible();

    // Check FAQ section
    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible();
  });

  test.describe('Severity Calculator', () => {
    test('should require all inputs to calculate severity', async ({ page }) => {
      const calculateBtn = page.locator('#calculate-severity');

      // Try to calculate without selecting anything
      await calculateBtn.click();

      // Should show alert (we can listen for dialog)
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Please select all three criteria');
        await dialog.accept();
      });
    });

    test('should calculate P0 severity for critical inputs', async ({ page }) => {
      const userImpact = page.locator('#user-impact');
      const serviceState = page.locator('#service-state');
      const businessImpact = page.locator('#business-impact');
      const calculateBtn = page.locator('#calculate-severity');

      // Select all critical options
      await userImpact.selectOption('all');
      await serviceState.selectOption('down');
      await businessImpact.selectOption('critical');

      await calculateBtn.click();
      await page.waitForTimeout(500);

      // Check result is displayed
      const resultDiv = page.locator('#severity-result');
      await expect(resultDiv).toBeVisible();

      // Check P0 badge is shown
      const severityBadge = page.locator('#severity-badge');
      await expect(severityBadge).toContainText('P0');

      // Check title mentions critical
      const severityTitle = page.locator('#severity-title');
      await expect(severityTitle).toContainText('Critical');
    });

    test('should calculate P3 severity for low impact inputs', async ({ page }) => {
      const userImpact = page.locator('#user-impact');
      const serviceState = page.locator('#service-state');
      const businessImpact = page.locator('#business-impact');
      const calculateBtn = page.locator('#calculate-severity');

      // Select all low impact options
      await userImpact.selectOption('single');
      await serviceState.selectOption('minor');
      await businessImpact.selectOption('low');

      await calculateBtn.click();
      await page.waitForTimeout(500);

      // Check P3 badge is shown
      const severityBadge = page.locator('#severity-badge');
      await expect(severityBadge).toContainText('P3');

      // Check title mentions low
      const severityTitle = page.locator('#severity-title');
      await expect(severityTitle).toContainText('Low');
    });

    test('should display severity reference table', async ({ page }) => {
      const severityTable = page.locator('.severity-table');
      await expect(severityTable).toBeVisible();

      // Check all severity levels are listed
      await expect(severityTable.locator('text=P0')).toBeVisible();
      await expect(severityTable.locator('text=P1')).toBeVisible();
      await expect(severityTable.locator('text=P2')).toBeVisible();
      await expect(severityTable.locator('text=P3')).toBeVisible();
    });

    test('should display recommended actions for calculated severity', async ({ page }) => {
      const userImpact = page.locator('#user-impact');
      const serviceState = page.locator('#service-state');
      const businessImpact = page.locator('#business-impact');
      const calculateBtn = page.locator('#calculate-severity');

      await userImpact.selectOption('major');
      await serviceState.selectOption('degraded');
      await businessImpact.selectOption('high');

      await calculateBtn.click();
      await page.waitForTimeout(500);

      // Check actions are displayed
      const actionsList = page.locator('#severity-actions-list');
      await expect(actionsList).toBeVisible();

      // Check at least one action is listed
      const actions = actionsList.locator('li');
      await expect(actions.first()).toBeVisible();
    });
  });

  test.describe('Tool Comparison Filters', () => {
    test('should display tools table', async ({ page }) => {
      const toolsTable = page.locator('#tools-table');
      await expect(toolsTable).toBeVisible();

      // Check some well-known tools are listed
      await expect(toolsTable.locator('text=PagerDuty')).toBeVisible();
      await expect(toolsTable.locator('text=Opsgenie')).toBeVisible();
    });

    test('should filter tools by alerting feature', async ({ page }) => {
      const filterBtn = page.locator('[data-filter="alerting"]');
      await filterBtn.click();
      await page.waitForTimeout(300);

      // Check active state
      await expect(filterBtn).toHaveClass(/active/);

      // Check that tools with alerting feature are visible
      const pagerDutyRow = page.locator('tr:has-text("PagerDuty")');
      await expect(pagerDutyRow).toBeVisible();
    });

    test('should filter tools by on-call feature', async ({ page }) => {
      const filterBtn = page.locator('[data-filter="oncall"]');
      await filterBtn.click();
      await page.waitForTimeout(300);

      // Check active state
      await expect(filterBtn).toHaveClass(/active/);
    });

    test('should filter tools by automation feature', async ({ page }) => {
      const filterBtn = page.locator('[data-filter="automation"]');
      await filterBtn.click();
      await page.waitForTimeout(300);

      // Check active state
      await expect(filterBtn).toHaveClass(/active/);
    });

    test('should show all tools when "All Tools" is selected', async ({ page }) => {
      // First apply a filter
      await page.locator('[data-filter="alerting"]').click();
      await page.waitForTimeout(300);

      // Then click "All Tools"
      const allToolsBtn = page.locator('[data-filter="all"]');
      await allToolsBtn.click();
      await page.waitForTimeout(300);

      // Check active state
      await expect(allToolsBtn).toHaveClass(/active/);
    });
  });

  test.describe('CUJ Mapper Tool', () => {
    test('should require service name to generate report', async ({ page }) => {
      const mapBtn = page.locator('#map-cuj');

      // Try to map without entering service
      await mapBtn.click();

      // Should show alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('affected service');
        await dialog.accept();
      });
    });

    test('should require at least one CUJ to be selected', async ({ page }) => {
      const serviceInput = page.locator('#affected-service');
      const mapBtn = page.locator('#map-cuj');

      // Enter service but don't select any CUJs
      await serviceInput.fill('Payment API');
      await mapBtn.click();

      // Should show alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('select at least one');
        await dialog.accept();
      });
    });

    test('should require valid impact percentage', async ({ page }) => {
      const serviceInput = page.locator('#affected-service');
      const cujCheckbox = page.locator('[data-cuj="purchase"]');
      const mapBtn = page.locator('#map-cuj');

      // Enter service and select CUJ but no percentage
      await serviceInput.fill('Payment API');
      await cujCheckbox.check();
      await mapBtn.click();

      // Should show alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('impact percentage');
        await dialog.accept();
      });
    });

    test('should generate impact report with valid inputs', async ({ page }) => {
      const serviceInput = page.locator('#affected-service');
      const cujCheckbox = page.locator('[data-cuj="purchase"]');
      const impactInput = page.locator('#impact-percentage');
      const mapBtn = page.locator('#map-cuj');

      // Fill all required fields
      await serviceInput.fill('Payment API');
      await cujCheckbox.check();
      await impactInput.fill('75');

      await mapBtn.click();
      await page.waitForTimeout(500);

      // Check result is displayed
      const resultDiv = page.locator('#cuj-result');
      await expect(resultDiv).toBeVisible();

      // Check summary contains service name
      const summary = page.locator('#cuj-summary');
      await expect(summary).toContainText('Payment API');

      // Check recommendations are shown
      const recommendations = page.locator('#cuj-recommendations');
      await expect(recommendations).toBeVisible();
    });

    test('should allow multiple CUJ selection', async ({ page }) => {
      const serviceInput = page.locator('#affected-service');
      const purchaseCuj = page.locator('[data-cuj="purchase"]');
      const loginCuj = page.locator('[data-cuj="login"]');
      const impactInput = page.locator('#impact-percentage');
      const mapBtn = page.locator('#map-cuj');

      // Select multiple CUJs
      await serviceInput.fill('Database Service');
      await purchaseCuj.check();
      await loginCuj.check();
      await impactInput.fill('50');

      await mapBtn.click();
      await page.waitForTimeout(500);

      // Check result shows multiple CUJs
      const summary = page.locator('#cuj-summary');
      await expect(summary).toBeVisible();
    });

    test('should display all CUJ checkboxes', async ({ page }) => {
      // Check all CUJ options are available
      await expect(page.locator('[data-cuj="signup"]')).toBeVisible();
      await expect(page.locator('[data-cuj="login"]')).toBeVisible();
      await expect(page.locator('[data-cuj="purchase"]')).toBeVisible();
      await expect(page.locator('[data-cuj="content"]')).toBeVisible();
      await expect(page.locator('[data-cuj="search"]')).toBeVisible();
      await expect(page.locator('[data-cuj="profile"]')).toBeVisible();
    });
  });

  test.describe('Educational Content', () => {
    test('should display theory cards', async ({ page }) => {
      const theoryGrid = page.locator('.theory-grid');
      await expect(theoryGrid).toBeVisible();

      // Check theory cards are present
      await expect(page.locator('text=What is an Incident?')).toBeVisible();
      await expect(page.locator('text=Core Principles')).toBeVisible();
      await expect(page.locator('text=Incident Lifecycle')).toBeVisible();
    });

    test('should display best practices section', async ({ page }) => {
      await expect(page.locator('text=Best Practices for Incident Response')).toBeVisible();

      // Check some best practices are listed
      await expect(page.locator('text=Establish Clear Roles')).toBeVisible();
      await expect(page.locator('text=Blameless Post-Mortems')).toBeVisible();
    });

    test('should display CUJ playbook steps', async ({ page }) => {
      // Check playbook is present
      await expect(page.locator('text=Step-by-Step CUJ Mapping Playbook')).toBeVisible();

      // Check steps are numbered
      const steps = page.locator('.playbook-step');
      await expect(steps.first()).toBeVisible();
    });

    test('should display FAQ section', async ({ page }) => {
      const faqSection = page.locator('.faq');
      await expect(faqSection).toBeVisible();

      // Check some FAQs are present
      await expect(page.locator('text=difference between P0 and P1')).toBeVisible();
      await expect(page.locator('text=post-mortem')).toBeVisible();
    });

    test('should display resources section', async ({ page }) => {
      await expect(page.locator('text=Additional Resources')).toBeVisible();

      // Check resource cards
      const resourcesGrid = page.locator('.resources-grid');
      await expect(resourcesGrid).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check main sections are still visible
      const heading = page.locator('h2').first();
      await expect(heading).toBeVisible();

      // Check calculator is accessible
      const calculator = page.locator('.calculator-card').first();
      await expect(calculator).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check layout adapts
      const nav = page.locator('.navbar');
      await expect(nav).toBeVisible();

      const calculator = page.locator('.calculator-card').first();
      await expect(calculator).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
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

    test('should have ARIA attributes on interactive elements', async ({ page }) => {
      const severityResult = page.locator('#severity-result');

      // Check ARIA live region
      const ariaLive = await severityResult.getAttribute('aria-live');
      expect(ariaLive).toBe('polite');

      const ariaAtomic = await severityResult.getAttribute('aria-atomic');
      expect(ariaAtomic).toBe('true');
    });

    test('should support keyboard navigation on buttons', async ({ page }) => {
      const calculateBtn = page.locator('#calculate-severity');

      // Tab to button
      await page.keyboard.press('Tab');

      // Check button can be focused
      await calculateBtn.focus();
      await expect(calculateBtn).toBeFocused();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from home page to incident management', async ({ page }) => {
      // Start at home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click incident management link in navigation
      const incidentLink = page.locator('a[href="incident-management.html"]').first();
      await incidentLink.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Verify we're on incident management page
      await expect(page).toHaveURL(/incident-management.html/);
      await expect(page.locator('h2').first()).toContainText('Incident Management');
    });

    test('should navigate from calculator to incident management', async ({ page }) => {
      // Start at calculator page
      await page.goto('/error-budget-calculator.html');
      await page.waitForLoadState('networkidle');

      // Click incident management link
      const incidentLink = page.locator('a[href="incident-management.html"]').first();
      await incidentLink.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Verify navigation
      await expect(page).toHaveURL(/incident-management.html/);
    });
  });

  test.describe('External Links', () => {
    test('should have external resource links with proper attributes', async ({ page }) => {
      // Check external links have target="_blank" and rel="noopener noreferrer"
      const externalLinks = page.locator('a[target="_blank"]');
      const count = await externalLinks.count();

      expect(count).toBeGreaterThan(0);

      // Check first external link has proper rel attribute
      const firstLink = externalLinks.first();
      const rel = await firstLink.getAttribute('rel');
      expect(rel).toContain('noopener noreferrer');
    });
  });

  test.describe('Tables', () => {
    test('should display severity reference table with all columns', async ({ page }) => {
      const table = page.locator('.severity-table');

      // Check table headers
      await expect(table.locator('th:has-text("Level")')).toBeVisible();
      await expect(table.locator('th:has-text("Description")')).toBeVisible();
      await expect(table.locator('th:has-text("User Impact")')).toBeVisible();
      await expect(table.locator('th:has-text("Response Time")')).toBeVisible();
    });

    test('should display tools comparison table with all columns', async ({ page }) => {
      const table = page.locator('.tools-table');

      // Check table headers
      await expect(table.locator('th:has-text("Tool")')).toBeVisible();
      await expect(table.locator('th:has-text("Best For")')).toBeVisible();
      await expect(table.locator('th:has-text("Key Features")')).toBeVisible();
      await expect(table.locator('th:has-text("Pricing")')).toBeVisible();
    });
  });
});
