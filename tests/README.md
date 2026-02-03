# Playwright Tests for SLO Education Hub

## Overview

Automated end-to-end tests for the SLO Education Hub CTA functionality using Playwright.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Local development server running on `http://127.0.0.1:5500`

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## GitHub Actions / CI Environment

The tests are configured to run automatically in GitHub Actions on:
- Push to `main` or `feature/*` branches
- Pull requests to `main`

### How It Works

The Playwright configuration includes a built-in web server that:
1. Automatically starts `http-server` on port 5500
2. Waits for the server to be ready
3. Runs all tests
4. Shuts down the server when complete

**No manual server setup needed in CI!** Playwright's `webServer` option handles everything automatically.

### CI Configuration

The workflow (`.github/workflows/playwright-tests.yml`):
- Runs on Ubuntu latest
- Installs Node.js 20
- Installs dependencies and Playwright browsers
- Runs tests (server starts automatically via Playwright config)
- Uploads test reports and screenshots as artifacts

### Viewing Test Results in GitHub

After a workflow run:
1. Go to the Actions tab in your repository
2. Click on the workflow run
3. Download artifacts:
   - `playwright-report` - HTML test report
   - `test-screenshots` - Screenshots from failed tests

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

## Test Coverage

### CTA Functionality Tests (`tests/cta.spec.ts`)

1. **Page Load Test**
   - Verifies page loads successfully
   - Checks title and logo

2. **Cookie Consent Tests**
   - Banner displays on first visit
   - Banner hides after accepting
   - Banner hides after declining
   - LocalStorage correctly stores user preference

3. **CTA Navigation Test**
   - "Start Learning" button navigates to #get-started section
   - URL updates correctly
   - Target section becomes visible

4. **CTA Styling Test**
   - Verifies button has correct CSS class
   - Checks cursor pointer styling

5. **Analytics Tracking Test**
   - Verifies gtag initializes after consent
   - Tracks CTA click events

6. **Navigation Links Test**
   - Tests all header navigation links
   - Verifies hash navigation works

7. **Content Display Test**
   - Checks hero section content
   - Verifies subtitle text

8. **Responsive Design Test**
   - Tests desktop viewport (1920x1080)
   - Tests mobile viewport (375x667)

## Test Results

All tests are captured with screenshots in `.playwright-mcp/` directory:
- `cta-test-after-click.png` - After CTA click
- `cta-test-after-consent.png` - After accepting cookies
- `cta-final-test-complete.png` - Full page screenshot

Detailed test report available in `CTA_TEST_REPORT.md`

## Configuration

Playwright configuration is in `playwright.config.js`:
- Base URL: `http://127.0.0.1:5500`
- Browsers: Chromium, Firefox, WebKit
- Screenshots on failure
- Trace on first retry

## CI/CD Integration

Tests are configured to run in CI environments with:
- 2 retries on failure
- Single worker for consistency
- HTML reports generated

## Troubleshooting

### Port 5500 not available
Make sure your local development server is running:
```bash
# Using Python
python -m http.server 5500

# Using Node.js http-server
npx http-server -p 5500

# Using VS Code Live Server extension
# Right-click index.html > Open with Live Server
```

### Playwright not installed
```bash
npx playwright install
```

### Tests failing randomly
- Check if server is running
- Clear browser cache: `npx playwright test --project=chromium --clear-context`
- Run with headed mode to see what's happening: `npm run test:headed`

## Writing New Tests

Add new test files in the `tests/` directory:

```typescript
import { test, expect } from '@playwright/test';

test('your test name', async ({ page }) => {
  await page.goto('/index.html');
  // Your test code here
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen)
