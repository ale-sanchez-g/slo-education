import { test, expect } from '@playwright/test';

test.describe('Responsive Menu Functionality', () => {
  test.describe('Desktop View', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should display navigation links horizontally on desktop', async ({ page }) => {
      const navLinks = page.locator('.nav-links');
      
      await expect(navLinks).toBeVisible();
      
      // Check that links are displayed in a row (flex)
      const display = await navLinks.evaluate((el) => 
        window.getComputedStyle(el).display
      );
      expect(display).toBe('flex');
    });

    test('should not display hamburger menu on desktop', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      
      // Hamburger should exist but not be visible on desktop
      const isVisible = await hamburger.evaluate((el) => 
        window.getComputedStyle(el).display !== 'none'
      );
      expect(isVisible).toBe(false);
    });

    test('should have all navigation links on home page', async ({ page }) => {
      const navLinks = page.locator('.nav-links a');

      await expect(navLinks).toHaveCount(5);

      // Verify all expected links
      await expect(navLinks.nth(0)).toHaveText('About');
      await expect(navLinks.nth(1)).toHaveText('What are SLOs?');
      await expect(navLinks.nth(2)).toHaveText('Calculator');
      await expect(navLinks.nth(3)).toHaveText('Incident Management');
      await expect(navLinks.nth(4)).toHaveText('Privacy');
    });

    test('should have consistent navigation on calculator page', async ({ page }) => {
      await page.goto('/error-budget-calculator.html');
      await page.waitForLoadState('networkidle');
      
      const navLinks = page.locator('.nav-links a');
      
      await expect(navLinks).toHaveCount(6);
      await expect(navLinks.nth(0)).toHaveText('Home');
      await expect(navLinks.nth(1)).toHaveText('About');
      await expect(navLinks.nth(2)).toHaveText('What are SLOs?');
      await expect(navLinks.nth(3)).toHaveText('Calculator');
      await expect(navLinks.nth(4)).toHaveText('Incident Management');
      await expect(navLinks.nth(5)).toHaveText('Privacy');
    });

    test('should have consistent navigation on incident management page', async ({ page }) => {
      await page.goto('/incident-management.html');
      await page.waitForLoadState('networkidle');
      
      const navLinks = page.locator('.nav-links a');
      
      await expect(navLinks).toHaveCount(6);
      await expect(navLinks.nth(0)).toHaveText('Home');
    });

    test('should highlight active page link', async ({ page }) => {
      await page.goto('/error-budget-calculator.html');
      await page.waitForLoadState('networkidle');
      
      const calculatorLink = page.locator('.nav-links a:has-text("Calculator")');
      
      // Check if the active class is applied
      await expect(calculatorLink).toHaveClass(/active/);
    });
  });

  test.describe('Mobile View', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should display hamburger menu on mobile', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      
      await expect(hamburger).toBeVisible();
    });

    test('should have hamburger button with proper ARIA attributes', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      
      await expect(hamburger).toHaveAttribute('aria-label', 'Toggle navigation menu');
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    test('should hide navigation links initially on mobile', async ({ page }) => {
      const navLinks = page.locator('.nav-links');
      
      // Check if nav-links is positioned off-screen
      const right = await navLinks.evaluate((el) => 
        window.getComputedStyle(el).right
      );
      
      // Should be positioned off-screen (negative value or -100%)
      expect(right).toContain('-');
    });

    test('should open menu when hamburger is clicked', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      // Click hamburger
      await hamburger.click();
      
      // Menu should be visible
      await expect(navLinks).toHaveClass(/active/);
      await expect(hamburger).toHaveClass(/active/);
      await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should close menu when hamburger is clicked again', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      // Open menu
      await hamburger.click();
      await expect(navLinks).toHaveClass(/active/);
      
      // Close menu
      await hamburger.click();
      await expect(navLinks).not.toHaveClass(/active/);
      await expect(hamburger).not.toHaveClass(/active/);
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    test('should close menu when a link is clicked', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      // Open menu
      await hamburger.click();
      await expect(navLinks).toHaveClass(/active/);
      
      // Click a link
      const aboutLink = navLinks.locator('a:has-text("About")');
      await aboutLink.click();
      
      // Menu should close
      await expect(navLinks).not.toHaveClass(/active/);
    });

    test('should close menu when Escape key is pressed', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      // Open menu
      await hamburger.click();
      await expect(navLinks).toHaveClass(/active/);
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Menu should close
      await expect(navLinks).not.toHaveClass(/active/);
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    test('should have animated hamburger icon', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const firstLine = hamburger.locator('.hamburger-line').nth(0);
      
      // Click to open
      await hamburger.click();
      
      // Check if hamburger has active class (which triggers animation)
      await expect(hamburger).toHaveClass(/active/);
      
      // Verify transform is applied to first line
      const transform = await firstLine.evaluate((el) => 
        window.getComputedStyle(el).transform
      );
      
      // Transform should not be 'none' when active
      expect(transform).not.toBe('none');
    });

    test('should work on all pages - calculator', async ({ page }) => {
      await page.goto('/error-budget-calculator.html');
      await page.waitForLoadState('networkidle');
      
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      await expect(hamburger).toBeVisible();
      
      await hamburger.click();
      await expect(navLinks).toHaveClass(/active/);
    });

    test('should work on all pages - incident management', async ({ page }) => {
      await page.goto('/incident-management.html');
      await page.waitForLoadState('networkidle');
      
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      await expect(hamburger).toBeVisible();
      
      await hamburger.click();
      await expect(navLinks).toHaveClass(/active/);
    });
  });

  test.describe('Tablet View', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should display hamburger menu on tablet at breakpoint', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      
      // At exactly 768px, it should still show hamburger (max-width: 768px)
      await expect(hamburger).toBeVisible();
    });

    test('should open and close menu on tablet', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      await hamburger.click();
      await expect(navLinks).toHaveClass(/active/);
      
      await hamburger.click();
      await expect(navLinks).not.toHaveClass(/active/);
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should reset menu state when resizing from mobile to desktop', async ({ page }) => {
      // Start mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      // Open menu on mobile
      await hamburger.click();
      await expect(navLinks).toHaveClass(/active/);
      
      // Resize to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Menu should be reset (wait for it to not have active class)
      await expect(navLinks).not.toHaveClass(/active/, { timeout: 1000 });
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('hamburger button should be keyboard accessible', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      
      // Tab to the hamburger button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs depending on other elements
      
      // Try to focus the hamburger directly
      await hamburger.focus();
      
      // Verify it's focused
      const isFocused = await hamburger.evaluate((el) => 
        document.activeElement === el
      );
      expect(isFocused).toBe(true);
    });

    test('should be able to activate hamburger with Enter key', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      await hamburger.focus();
      await page.keyboard.press('Enter');
      
      await expect(navLinks).toHaveClass(/active/);
    });

    test('should be able to activate hamburger with Space key', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      const navLinks = page.locator('.nav-links');
      
      await hamburger.focus();
      await page.keyboard.press('Space');
      
      await expect(navLinks).toHaveClass(/active/);
    });

    test('navigation links should be keyboard accessible', async ({ page }) => {
      const hamburger = page.locator('.hamburger');
      
      // Open menu
      await hamburger.click();
      
      // Tab to first link
      await page.keyboard.press('Tab');
      
      // Verify a link can be focused
      const firstLink = page.locator('.nav-links a').first();
      await firstLink.focus();
      
      const isFocused = await firstLink.evaluate((el) => 
        document.activeElement === el
      );
      expect(isFocused).toBe(true);
    });
  });

  test.describe('Navigation Consistency', () => {
    test('should maintain consistent menu structure across pages', async ({ page }) => {
      // Check home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      let navLinks = page.locator('.nav-links');
      await expect(navLinks).toBeVisible();
      
      // Check calculator page
      await page.goto('/error-budget-calculator.html');
      await page.waitForLoadState('networkidle');
      navLinks = page.locator('.nav-links');
      await expect(navLinks).toBeVisible();
      
      // Check incident management page
      await page.goto('/incident-management.html');
      await page.waitForLoadState('networkidle');
      navLinks = page.locator('.nav-links');
      await expect(navLinks).toBeVisible();
    });
  });
});
