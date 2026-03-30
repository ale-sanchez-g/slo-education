import { test, expect } from '@playwright/test';

test.describe('AI SLO & Error Budget Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-slo-error-budget');
    await page.waitForLoadState('networkidle');
  });

  test('should load the AI SLO page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/AI SLOs/);

    const heading = page.locator('h2').first();
    await expect(heading).toContainText('AI SLOs');
  });

  test('should have navigation to other pages', async ({ page }) => {
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();

    const calculatorLink = page.locator('a[href="/error-budget-calculator"]').first();
    await expect(calculatorLink).toBeVisible();
  });

  test('should display all main sections', async ({ page }) => {
    await expect(page.locator('text=Why AI Systems Require a Different Approach')).toBeVisible();
    await expect(page.locator('text=AI Service Level Indicators')).toBeVisible();
    await expect(page.locator('text=Error Budgets for AI Systems')).toBeVisible();
    await expect(page.locator('text=Interactive AI SLO Builder')).toBeVisible();
    await expect(page.locator('text=Alerting Strategies for AI Systems')).toBeVisible();
    await expect(page.locator('text=Detecting')).toBeVisible();
    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible();
  });

  test('should display comparison grid between traditional and AI systems', async ({ page }) => {
    const comparisonGrid = page.locator('.comparison-grid');
    await expect(comparisonGrid).toBeVisible();

    await expect(comparisonGrid.locator('.traditional')).toBeVisible();
    await expect(comparisonGrid.locator('.ai-ml')).toBeVisible();
  });

  test('should display insight banner', async ({ page }) => {
    const banner = page.locator('.insight-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('good enough');
  });

  test('should display all six SLI cards', async ({ page }) => {
    const sliGrid = page.locator('.sli-grid');
    await expect(sliGrid).toBeVisible();

    const sliCards = sliGrid.locator('.sli-card');
    await expect(sliCards).toHaveCount(6);
  });

  test('should display SLI tags on each card', async ({ page }) => {
    const sliTags = page.locator('.sli-tag');
    const count = await sliTags.count();
    expect(count).toBeGreaterThan(10);
  });

  test('should display error budget principles', async ({ page }) => {
    const principleList = page.locator('.principle-list');
    await expect(principleList).toBeVisible();

    const principles = principleList.locator('.principle-item');
    await expect(principles).toHaveCount(5);
  });

  test('should display error budget state cards', async ({ page }) => {
    const healthy = page.locator('.state-card.healthy');
    const warning = page.locator('.state-card.warning');
    const critical = page.locator('.state-card.critical');

    await expect(healthy).toBeVisible();
    await expect(warning).toBeVisible();
    await expect(critical).toBeVisible();
  });

  test('should display three alerting layers', async ({ page }) => {
    const layers = page.locator('.layer-card');
    await expect(layers).toHaveCount(3);
  });

  test('should display burn rate table', async ({ page }) => {
    const table = page.locator('.burn-rate-table');
    await expect(table).toBeVisible();

    await expect(table.locator('th:has-text("Alert Type")')).toBeVisible();
    await expect(table.locator('th:has-text("Burn Rate")')).toBeVisible();
    await expect(table.locator('th:has-text("Urgency")')).toBeVisible();
  });

  test('should display drift types section', async ({ page }) => {
    const driftTypes = page.locator('.drift-types');
    await expect(driftTypes).toBeVisible();

    const driftCards = driftTypes.locator('.drift-card');
    await expect(driftCards).toHaveCount(3);
  });

  test('should display drift response playbook steps', async ({ page }) => {
    const playbook = page.locator('.drift-response-playbook');
    await expect(playbook).toBeVisible();

    const steps = playbook.locator('.playbook-step');
    await expect(steps).toHaveCount(5);
  });

  test('should display FAQ section with multiple items', async ({ page }) => {
    const faq = page.locator('.faq');
    await expect(faq).toBeVisible();

    const items = faq.locator('.faq-item');
    await expect(items).toHaveCount(8);
  });

  test('should display resources section', async ({ page }) => {
    const resourcesSection = page.locator('#resources-section');
    await expect(resourcesSection).toBeVisible();
  });

  test.describe('AI SLO Builder', () => {
    test('should require use case selection', async ({ page }) => {
      const buildBtn = page.locator('#build-slo');

      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('use case');
        await dialog.accept();
      });

      await buildBtn.click();
    });

    test('should require quality target when use case selected', async ({ page }) => {
      await page.locator('#ai-use-case').selectOption('chatbot');
      await page.locator('#quality-target').fill('');

      const buildBtn = page.locator('#build-slo');
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('quality');
        await dialog.accept();
      });

      await buildBtn.click();
    });

    test('should require latency target', async ({ page }) => {
      await page.locator('#ai-use-case').selectOption('chatbot');
      await page.locator('#quality-target').fill('85');
      await page.locator('#latency-target').fill('');

      const buildBtn = page.locator('#build-slo');
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('latency');
        await dialog.accept();
      });

      await buildBtn.click();
    });

    test('should generate SLO definition with valid inputs', async ({ page }) => {
      await page.locator('#ai-use-case').selectOption('chatbot');
      await page.locator('#quality-target').fill('90');
      await page.locator('#latency-target').fill('2000');

      await page.locator('#build-slo').click();
      await page.waitForTimeout(500);

      const result = page.locator('#slo-result');
      await expect(result).toBeVisible();

      const summary = page.locator('#slo-summary');
      await expect(summary).toContainText('90%');
    });

    test('should display error budget cards after generation', async ({ page }) => {
      await page.locator('#ai-use-case').selectOption('recommendation');
      await page.locator('#quality-target').fill('95');
      await page.locator('#latency-target').fill('200');

      await page.locator('#build-slo').click();
      await page.waitForTimeout(500);

      const budgets = page.locator('#slo-error-budgets');
      await expect(budgets).toBeVisible();

      const cards = budgets.locator('.budget-card');
      await expect(cards).toHaveCount(3);
    });

    test('should display alerting thresholds after generation', async ({ page }) => {
      await page.locator('#ai-use-case').selectOption('search');
      await page.locator('#quality-target').fill('88');
      await page.locator('#latency-target').fill('1000');

      await page.locator('#build-slo').click();
      await page.waitForTimeout(500);

      const alerting = page.locator('#slo-alerting');
      await expect(alerting).toBeVisible();
      await expect(alerting).toContainText('P0');
    });

    test('should display recommendations after generation', async ({ page }) => {
      await page.locator('#ai-use-case').selectOption('classification');
      await page.locator('#quality-target').fill('95');
      await page.locator('#latency-target').fill('300');

      await page.locator('#build-slo').click();
      await page.waitForTimeout(500);

      const recs = page.locator('#slo-recommendations');
      await expect(recs).toBeVisible();

      const items = recs.locator('li');
      await expect(items.first()).toBeVisible();
    });

    test('should include safety SLO when user-facing is selected', async ({ page }) => {
      await page.locator('#ai-use-case').selectOption('chatbot');
      await page.locator('#quality-target').fill('85');
      await page.locator('#latency-target').fill('2000');
      await page.locator('#safety-required').selectOption('yes');

      await page.locator('#build-slo').click();
      await page.waitForTimeout(500);

      const summary = page.locator('#slo-summary');
      await expect(summary).toContainText('0.1%');
    });

    test('should pre-fill defaults when use case is changed', async ({ page }) => {
      const qualityEl = page.locator('#quality-target');
      const latencyEl = page.locator('#latency-target');

      // Clear first
      await qualityEl.fill('');
      await latencyEl.fill('');

      await page.locator('#ai-use-case').selectOption('chatbot');
      await page.waitForTimeout(200);

      const qualityVal = await qualityEl.inputValue();
      const latencyVal = await latencyEl.inputValue();

      expect(qualityVal).not.toBe('');
      expect(latencyVal).not.toBe('');
    });

    test('should support all use case options', async ({ page }) => {
      const select = page.locator('#ai-use-case');
      const options = await select.locator('option').allTextContents();

      expect(options.length).toBeGreaterThanOrEqual(7);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const heading = page.locator('h2').first();
      await expect(heading).toBeVisible();

      const calculator = page.locator('.calculator-card');
      await expect(calculator).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const nav = page.locator('.navbar');
      await expect(nav).toBeVisible();

      const sliGrid = page.locator('.sli-grid');
      await expect(sliGrid).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper semantic structure', async ({ page }) => {
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });

    test('should have ARIA attributes on SLO result', async ({ page }) => {
      const resultEl = page.locator('#slo-result');
      expect(await resultEl.getAttribute('aria-live')).toBe('polite');
      expect(await resultEl.getAttribute('aria-atomic')).toBe('true');
    });

    test('should have focusable build button', async ({ page }) => {
      const buildBtn = page.locator('#build-slo');
      await buildBtn.focus();
      await expect(buildBtn).toBeFocused();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from home page to AI SLO page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const aiSloLink = page.locator('a[href="/ai-slo-error-budget"]').first();
      await aiSloLink.click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/ai-slo-error-budget/);
      await expect(page.locator('h2').first()).toContainText('AI SLOs');
    });

    test('should highlight AI SLOs link as active in nav', async ({ page }) => {
      const activeLink = page.locator('.nav-links a.active');
      await expect(activeLink).toBeVisible();
      await expect(activeLink).toContainText('AI SLOs');
    });
  });

  test.describe('AI SLO link in all pages nav', () => {
    const pages = [
      { name: 'home', path: '/' },
      { name: 'calculator', path: '/error-budget-calculator' },
      { name: 'incident-management', path: '/incident-management' },
    ];

    for (const { name, path } of pages) {
      test(`${name} page has AI SLOs nav link`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const link = page.locator('a[href="/ai-slo-error-budget"]').first();
        await expect(link).toBeVisible();
      });
    }
  });
});
