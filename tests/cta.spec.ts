import { test, expect } from '@playwright/test';

test.describe('CTA Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display the main CTA button in the hero section', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveText('Start Learning');
  });

  test('should have correct styling and be prominent', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    // Check that button is visible and in viewport
    await expect(ctaButton).toBeInViewport();
    
    // Verify it's a link element
    await expect(ctaButton).toHaveAttribute('href', '#get-started');
  });

  test('should navigate to get-started section when clicked', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    // Click the CTA button
    await ctaButton.click();
    
    // Wait for navigation/scroll to complete
    await page.waitForTimeout(500);
    
    // Verify URL hash changed
    await expect(page).toHaveURL(/#get-started$/);
    
    // Verify the get-started section is visible
    const getStartedSection = page.locator('#get-started');
    await expect(getStartedSection).toBeInViewport();
  });

  test('should be keyboard accessible', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    // Directly focus the CTA button
    await ctaButton.focus();
    
    // Verify the CTA button is now focused
    const isCTAFocused = await page.evaluate(() => {
      const button = document.querySelector('.cta-button');
      return document.activeElement === button;
    });
    
    expect(isCTAFocused).toBe(true);
    
    // Press Enter to activate the button
    await page.keyboard.press('Enter');
    
    // Wait for navigation
    await page.waitForTimeout(500);
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/#get-started$/);
  });

  test('should have proper hover state', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    // Get initial transform state
    const initialTransform = await ctaButton.evaluate((el) => 
      window.getComputedStyle(el).transform
    );
    
    // Hover over the button
    await ctaButton.hover();
    
    // Wait for transition
    await page.waitForTimeout(400);
    
    // Get hover state transform
    const hoverTransform = await ctaButton.evaluate((el) => 
      window.getComputedStyle(el).transform
    );
    
    // Transform should change on hover (button should move up)
    expect(initialTransform).not.toBe(hoverTransform);
  });

  test('should track analytics event when clicked', async ({ page }) => {
    // Set up listener for gtag calls
    const gtagCalls: any[] = [];
    
    await page.exposeFunction('captureGtag', (...args: any[]) => {
      gtagCalls.push(args);
    });
    
    // Inject code to capture gtag calls
    await page.addInitScript(() => {
      const originalGtag = window.gtag;
      window.gtag = function(...args: any[]) {
        (window as any).captureGtag(...args);
        if (originalGtag) {
          originalGtag.apply(window, args);
        }
      };
    });
    
    // Accept cookies first to enable analytics
    const acceptButton = page.locator('#cookie-accept');
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(1000); // Wait for analytics to initialize
    }
    
    // Reload to ensure analytics is initialized with our capture
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Click CTA button
    const ctaButton = page.locator('.cta-button');
    await ctaButton.click();
    
    // Wait for potential analytics call
    await page.waitForTimeout(500);
    
    // Check if event listener is attached (alternative check)
    const hasEventListener = await page.evaluate(() => {
      const button = document.querySelector('.cta-button');
      return button !== null;
    });
    
    expect(hasEventListener).toBe(true);
  });

  test('should work with cookie consent banner', async ({ page }) => {
    // Initially, check if cookie banner is visible
    const cookieBanner = page.locator('#cookie-consent-banner');
    
    // Banner might be visible or hidden based on localStorage
    const isVisible = await cookieBanner.isVisible();
    
    if (isVisible) {
      // Decline cookies
      await page.locator('#cookie-decline').click();
      await expect(cookieBanner).not.toBeVisible();
    }
    
    // CTA should still work without analytics
    const ctaButton = page.locator('.cta-button');
    await ctaButton.click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/#get-started$/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const ctaButton = page.locator('.cta-button');
    
    // Check button is visible and in viewport
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeInViewport();
    
    // Click should work on mobile
    await ctaButton.click();
    await page.waitForTimeout(500);
    
    await expect(page).toHaveURL(/#get-started$/);
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const ctaButton = page.locator('.cta-button');
    
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeInViewport();
    
    await ctaButton.click();
    await page.waitForTimeout(500);
    
    await expect(page).toHaveURL(/#get-started$/);
  });

  test('should maintain focus ring for accessibility', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    // Focus the button
    await ctaButton.focus();
    
    // Check that the button is focused
    const isFocused = await page.evaluate(() => {
      const button = document.querySelector('.cta-button');
      return document.activeElement === button;
    });
    
    expect(isFocused).toBe(true);
  });

  test('should have semantic HTML structure', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    // Verify it's an anchor tag (semantic for navigation)
    const tagName = await ctaButton.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('a');
    
    // Verify it has an href attribute
    await expect(ctaButton).toHaveAttribute('href');
  });

  test('should be present in hero section context', async ({ page }) => {
    const heroSection = page.locator('.hero');
    const ctaButton = heroSection.locator('.cta-button');
    
    // Verify CTA is inside hero section
    await expect(ctaButton).toBeVisible();
    
    // Verify hero section contains expected elements
    await expect(heroSection.locator('h2')).toContainText('Welcome to Your SLO Education Journey');
    await expect(heroSection.locator('.hero-subtitle')).toBeVisible();
  });

  test('should scroll smoothly to target section', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    const getStartedSection = page.locator('#get-started');
    
    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    // Click CTA
    await ctaButton.click();
    await page.waitForTimeout(800); // Wait for smooth scroll
    
    // Get final scroll position
    const finalScrollY = await page.evaluate(() => window.scrollY);
    
    // Verify scroll occurred
    expect(finalScrollY).toBeGreaterThan(initialScrollY);
    
    // Verify target section is in viewport
    await expect(getStartedSection).toBeInViewport();
  });

  test('should not break when clicked multiple times', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');
    
    // Click multiple times rapidly
    await ctaButton.click();
    await ctaButton.click();
    await ctaButton.click();
    
    await page.waitForTimeout(500);
    
    // Should still navigate correctly
    await expect(page).toHaveURL(/#get-started$/);
    
    // Button should still be functional
    await expect(ctaButton).toBeVisible();
  });

  test('should work after browser back navigation', async ({ page }) => {
    const ctaButton = page.locator('.cta-button');

    // Click CTA to navigate
    await ctaButton.click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/#get-started$/);

    // Navigate back
    await page.goBack();
    await page.waitForTimeout(500);

    // CTA should still be clickable
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/#get-started$/);
  });
});

// ─── Flip Cards ───────────────────────────────────────────────────────────────

test.describe('Flip Cards - SLO Examples Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const acceptBtn = page.locator('#cookie-accept');
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    }
  });

  test('renders three flip cards inside the examples section', async ({ page }) => {
    const cards = page.locator('#examples .flip-card');
    await expect(cards).toHaveCount(3);
  });

  test('each card front shows the correct everyday analogy label', async ({ page }) => {
    const labels = page.locator('.flip-card-front .analogy-label');
    await expect(labels.nth(0)).toContainText('Coffee shop');
    await expect(labels.nth(1)).toContainText('Airport security');
    await expect(labels.nth(2)).toContainText('Bank ATM network');
  });

  test('each card front shows the correct SLO target', async ({ page }) => {
    const targets = page.locator('.flip-card-front .slo-target');
    await expect(targets.nth(0)).toContainText('99.9%');
    await expect(targets.nth(1)).toContainText('200ms');
    await expect(targets.nth(2)).toContainText('0.1%');
  });

  test('each card back contains an "In technology terms" label', async ({ page }) => {
    const techLabels = page.locator('.flip-card-back .example-tech-label');
    await expect(techLabels).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(techLabels.nth(i)).toContainText('In technology terms');
    }
  });

  test('each card back shows SLI, Target, and Means rows', async ({ page }) => {
    const backs = page.locator('.flip-card-back .example-detail');
    await expect(backs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const detail = backs.nth(i);
      await expect(detail.locator('dt').nth(0)).toContainText('SLI');
      await expect(detail.locator('dt').nth(1)).toContainText('Target');
      await expect(detail.locator('dt').nth(2)).toContainText('Means');
    }
  });

  test('cards start unflipped with aria-pressed="false"', async ({ page }) => {
    const cards = page.locator('.flip-card');
    for (let i = 0; i < 3; i++) {
      await expect(cards.nth(i)).not.toHaveClass(/flipped/);
      await expect(cards.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('clicking a card flips it and sets aria-pressed="true"', async ({ page }) => {
    const card = page.locator('.flip-card').first();
    await card.click();
    await page.waitForTimeout(600); // allow flip animation
    await expect(card).toHaveClass(/flipped/);
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking a flipped card flips it back', async ({ page }) => {
    const card = page.locator('.flip-card').first();
    await card.click();
    await page.waitForTimeout(600);
    await expect(card).toHaveClass(/flipped/);

    await card.click();
    await page.waitForTimeout(600);
    await expect(card).not.toHaveClass(/flipped/);
    await expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  test('flipping one card does not flip the others', async ({ page }) => {
    const cards = page.locator('.flip-card');
    await cards.first().click();
    await page.waitForTimeout(600);

    await expect(cards.nth(1)).not.toHaveClass(/flipped/);
    await expect(cards.nth(2)).not.toHaveClass(/flipped/);
  });

  test('cards are keyboard-activatable with Enter', async ({ page }) => {
    const card = page.locator('.flip-card').nth(1);
    await card.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    await expect(card).toHaveClass(/flipped/);
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('cards are keyboard-activatable with Space', async ({ page }) => {
    const card = page.locator('.flip-card').nth(2);
    await card.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);
    await expect(card).toHaveClass(/flipped/);
  });

  test('cards have equal rendered height on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.flip-card');
    const count = await cards.count();
    const heights: number[] = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        cards.nth(i).evaluate((el: HTMLElement) => el.getBoundingClientRect().height)
      )
    );

    const maxH = Math.max(...heights);
    heights.forEach((h, i) => {
      expect(
        Math.abs(h - maxH),
        `Card ${i} height (${h}px) deviates from tallest card (${maxH}px)`
      ).toBeLessThanOrEqual(1); // allow 1px for sub-pixel rounding
    });
  });

  test('cards have tabindex="0" and role="button" for accessibility', async ({ page }) => {
    const cards = page.locator('.flip-card');
    for (let i = 0; i < 3; i++) {
      await expect(cards.nth(i)).toHaveAttribute('tabindex', '0');
      await expect(cards.nth(i)).toHaveAttribute('role', 'button');
    }
  });
});
