import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? 'dot' : 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5500',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: process.env.CI
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ],

  webServer: {
    command: 'npx http-server . -p 5500 -s',
    url: 'http://127.0.0.1:5500/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
