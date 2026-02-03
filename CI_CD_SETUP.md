# GitHub Actions CI/CD Setup Guide

## Overview

This repository includes automated Playwright testing via GitHub Actions. Every push to `main` or `feature/*` branches, and every pull request to `main`, triggers the test suite automatically.

## How It Works

### Playwright Web Server Integration

The key to running tests in CI is the `webServer` configuration in [playwright.config.js](playwright.config.js):

```javascript
webServer: {
  command: 'npx http-server . -p 5500 -s',
  url: 'http://127.0.0.1:5500/index.html',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

This configuration:
- **Automatically starts** a web server before tests run
- **Waits** for the server to be ready (checks the URL)
- **Runs** all tests against the server
- **Shuts down** the server after tests complete
- **Reuses** existing server during local development (saves time)

### GitHub Actions Workflow

The workflow file [.github/workflows/playwright-tests.yml](.github/workflows/playwright-tests.yml) runs:

```yaml
- Install Node.js
- Install npm dependencies  
- Install Playwright browsers
- Run tests (Playwright handles server automatically)
- Upload test reports and screenshots
```

## Running Tests Locally

### Option 1: Let Playwright Handle the Server (Recommended)

```bash
npm install
npx playwright install
npm test
```

Playwright will automatically start and stop the server for you!

### Option 2: Manual Server Control

If you want to run the server separately:

```bash
# Terminal 1 - Start server
npm start

# Terminal 2 - Run tests
npm test
```

### Option 3: CI Simulation

```bash
# Runs exactly like GitHub Actions
CI=1 npm test
```

## Test Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the web server on port 5500 |
| `npm test` | Run all tests (auto-starts server) |
| `npm run test:ui` | Interactive UI mode for debugging |
| `npm run test:headed` | Run tests with visible browser |
| `npm run test:debug` | Step-by-step debugging mode |
| `npm run test:report` | View the last test report |
| `npm run test:ci` | Alternative CI approach using start-server-and-test |

## Environment Variables

- `BASE_URL` - Override the test URL (default: `http://127.0.0.1:5500`)
- `CI` - Set to `true` in GitHub Actions (enables retries, single worker)

Example:
```bash
BASE_URL=http://localhost:3000 npm test
```

## Viewing Test Results in GitHub Actions

1. Go to **Actions** tab in your repository
2. Click on any workflow run
3. Scroll to **Artifacts** section at the bottom
4. Download:
   - `playwright-report` - Interactive HTML test report
   - `test-screenshots` - Screenshots from tests (if any failed)

## Troubleshooting CI

### Tests fail locally but pass in CI (or vice versa)

```bash
# Run tests exactly like CI does
CI=1 npx playwright test --project=chromium
```

### Server won't start in CI

Check the workflow logs for:
- Port 5500 already in use
- Missing dependencies
- Timeout issues (increase `timeout` in playwright.config.js)

### Tests are flaky

- Increase timeout values in tests
- Add explicit waits for dynamic content
- Use `test.describe.serial()` for dependent tests

### Want to test on specific browsers only

```bash
# Chromium only
npx playwright test --project=chromium

# Multiple browsers
npx playwright test --project=chromium --project=firefox
```

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         GitHub Actions (CI)                 │
├─────────────────────────────────────────────┤
│  1. Checkout code                           │
│  2. Install Node.js + dependencies          │
│  3. Install Playwright browsers             │
│  4. Run: npm test                           │
│     ├─ Playwright reads config              │
│     ├─ Starts http-server (port 5500)       │
│     ├─ Waits for server ready               │
│     ├─ Executes test suite                  │
│     └─ Stops server                         │
│  5. Upload artifacts (reports, screenshots) │
└─────────────────────────────────────────────┘
```

## Best Practices

1. **Always run tests locally** before pushing
2. **Check artifacts** if CI tests fail
3. **Keep dependencies updated** (`npm update`)
4. **Monitor CI run time** (current timeout: 60 minutes)
5. **Use browser-specific tests** only when needed

## Updating Playwright

```bash
# Update Playwright
npm install -D @playwright/test@latest

# Update browsers
npx playwright install

# Verify
npm test
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Test README](tests/README.md) - Detailed test documentation
- [CTA Test Report](CTA_TEST_REPORT.md) - Initial test results
