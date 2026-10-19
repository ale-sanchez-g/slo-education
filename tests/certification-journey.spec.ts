import { test, expect, Page, Locator } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * End-to-end certification journey, run at phone, tablet and desktop sizes:
 * first visit → navigation → certification page → failed attempt → review
 * → retake and pass → certificate → download and share → return visit.
 *
 * Set JOURNEY_SHOTS=<dir> to save a screenshot of every step, a video of each
 * run and a steps.json manifest per device for visual review.
 */

const SHOTS_DIR = process.env.JOURNEY_SHOTS;
const CERT_URL = 'https://slo-education.com.au/certification';
const LEARNER = 'Sample Learner';

// Widths sit either side of the site's CSS breakpoints (480, 600 and 768px).
const DEVICES = [
  { id: 'phone-320', label: 'Small phone', width: 320, height: 568, touch: true },
  { id: 'phone-375', label: 'iPhone SE', width: 375, height: 667, touch: true },
  { id: 'phone-412', label: 'Android phone', width: 412, height: 915, touch: true },
  { id: 'phone-540', label: 'Large phone / foldable', width: 540, height: 720, touch: true },
  { id: 'tablet-768', label: 'Tablet portrait', width: 768, height: 1024, touch: true },
  { id: 'tablet-820', label: 'iPad Air portrait', width: 820, height: 1180, touch: true },
  { id: 'tablet-1024', label: 'Tablet landscape', width: 1024, height: 768, touch: true },
  { id: 'laptop-1366', label: 'Laptop', width: 1366, height: 768, touch: false },
  { id: 'desktop-1920', label: 'Desktop', width: 1920, height: 1080, touch: false },
];

// Record a video of each run only when capturing a visual review.
test.use({ video: SHOTS_DIR ? 'on' : 'off' });

// WCAG 2.2 AA minimum target size; 44px is the AAA / platform recommendation.
const MIN_TARGET = 24;
const RECOMMENDED_TARGET = 44;

async function expectNoSidewaysScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, 'page should not scroll sideways').toBeLessThanOrEqual(clientWidth);
}

/** Scroll an element to the top of the viewport without smooth scrolling. */
async function bringToTop(locator: Locator) {
  await locator.first().evaluate(el => {
    const top = el.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  });
}

for (const device of DEVICES) {
  test.describe(`Certification journey on ${device.label} (${device.width}×${device.height})`, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch,
      hasTouch: device.touch,
      deviceScaleFactor: device.touch ? 2 : 1,
    });

    test('a learner fails, reviews, passes and shares the certificate', async ({ page, context, browserName }) => {
      test.setTimeout(120_000);

      const outDir = SHOTS_DIR ? path.join(SHOTS_DIR, device.id) : '';
      if (outDir) fs.mkdirSync(outDir, { recursive: true });
      const steps: { n: number; slug: string; title: string; checks: string[]; file: string | null }[] = [];
      const targets: Record<string, number> = {};
      const findings: string[] = [];
      let navRows = 0;
      let headerHeight = 0;
      let failure: string | null = null;

      /** Run a step's checks, confirm no sideways scroll, then capture the screen. */
      const step = async (slug: string, title: string, checks: string[], body: () => Promise<void>) => {
        await test.step(title, async () => {
          await body();
          await expectNoSidewaysScroll(page);
          let file: string | null = null;
          if (outDir) {
            file = `${String(steps.length + 1).padStart(2, '0')}-${slug}.jpg`;
            await page.screenshot({ path: path.join(outDir, file), type: 'jpeg', quality: 72 });
          }
          steps.push({ n: steps.length + 1, slug, title, checks: [...checks, 'No sideways scrolling'], file });
        });
      };

      /** Record a control's rendered height and require the WCAG AA minimum on touch screens. */
      const measureTarget = async (name: string, locator: Locator) => {
        const box = await locator.first().boundingBox();
        expect(box, `${name} should be rendered`).not.toBeNull();
        const size = Math.round(Math.min(box!.width, box!.height));
        targets[name] = size;
        if (device.touch) {
          expect(size, `${name} touch target`).toBeGreaterThanOrEqual(MIN_TARGET);
        }
      };

      const answerQuestion = async (correct: boolean) => {
        const option = correct
          ? page.locator('.exam-option input[data-correct="true"]')
          : page.locator('.exam-option input:not([data-correct="true"])').first();
        await option.check();
        await page.locator('#next-question').click();
      };

      try {
        await step('first-visit', 'First visit to the home page', [
          'Home page loads with its hero',
          'Cookie consent banner asks before any analytics run',
        ], async () => {
          await page.goto('/');
          await page.waitForLoadState('networkidle');
          await expect(page.locator('.hero h2')).toBeVisible();
          await expect(page.locator('#cookie-consent-banner')).toBeVisible();
        });

        await step('home-cta', 'Home page points to the certificate', [
          'Declining cookies hides the banner and is remembered',
          'The "Get certified" section links to /certification',
        ], async () => {
          await page.locator('#cookie-decline').click();
          await expect(page.locator('#cookie-consent-banner')).toBeHidden();
          expect(await page.evaluate(() => localStorage.getItem('slo-education-analytics-consent'))).toBe('declined');
          const section = page.locator('#certification');
          await expect(section.locator('a[href="/certification"]')).toBeVisible();
          await bringToTop(section);
        });

        await step('navigation', 'Navigation shows the Certification link', [
          'Phones and portrait tablets open the menu from the hamburger button',
          'The Certification link is visible and reachable',
        ], async () => {
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          const hamburger = page.locator('.hamburger');
          if (await hamburger.isVisible()) {
            await measureTarget('Menu button', hamburger);
            await hamburger.click();
            await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
            await page.waitForTimeout(400); // menu slides in over 0.3s
          }
          await expect(page.locator('.nav-links a[href="/certification"]')).toBeInViewport();
          const header = await page.evaluate(() => ({
            rows: new Set([...document.querySelectorAll('.nav-links a')].map(a => Math.round(a.getBoundingClientRect().top))).size,
            height: Math.round(document.querySelector('header')!.getBoundingClientRect().height),
          }));
          headerHeight = header.height;
          navRows = (await hamburger.isVisible()) ? 0 : header.rows;
          if (navRows > 1) findings.push(`Desktop navigation wraps onto ${navRows} rows (header ${headerHeight}px tall)`);
        });

        await step('certification-page', 'Certification page', [
          'Following the Certification link opens /certification',
          'The page title and hero describe the certificate',
        ], async () => {
          await page.locator('.nav-links a[href="/certification"]').click();
          await expect(page).toHaveURL(/\/certification$/);
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveTitle(/Certification/);
          await expect(page.locator('.hero h2')).toHaveText('Prove what you know about SLOs');
        });

        await step('pathway', 'Pathway: free now, membership later', [
          'The Foundation tier is marked available and free',
          'Advanced certifications are marked coming soon, with workshops and membership',
        ], async () => {
          await expect(page.locator('.tier-available')).toContainText('Available now');
          await expect(page.locator('.tier-available')).toContainText('Free');
          await expect(page.locator('.tier-soon')).toContainText('Coming soon');
          await expect(page.locator('.tier-soon')).toContainText('workshops');
          await bringToTop(page.locator('#pathway'));
        });

        await step('prepare', 'What the check covers', [
          'Study cards link to the four pages the questions come from',
        ], async () => {
          const links = page.locator('#study .card-link');
          await expect(links).toHaveCount(4);
          expect(await links.evaluateAll(as => as.map(a => a.getAttribute('href')))).toEqual([
            '/cuj-sli-slo-error-budget', '/error-budget-calculator', '/incident-management', '/ai-slo-error-budget',
          ]);
          await bringToTop(page.locator('#study'));
        });

        await step('start', 'Knowledge check intro', [
          'The intro states 20 questions, an 80% pass mark and free retakes',
          'The start button meets the minimum touch target size',
        ], async () => {
          const intro = page.locator('.exam-intro');
          await expect(intro).toContainText('20 multiple-choice questions');
          await expect(intro).toContainText('Pass mark: 80% (16 correct)');
          await measureTarget('Start button', page.locator('#start-exam'));
          await bringToTop(page.locator('#take-the-check'));
        });

        await step('question-1', 'First question, answer selected', [
          'Question 1 of 20 is shown with four options',
          'Next stays disabled until an answer is chosen',
          'Answer options and the Next button meet the minimum touch target size',
        ], async () => {
          await page.locator('#start-exam').click();
          await expect(page.locator('.exam-counter')).toHaveText('Question 1 of 20');
          await expect(page.locator('.exam-option')).toHaveCount(4);
          await expect(page.locator('#next-question')).toBeDisabled();
          await page.locator('.exam-option input:not([data-correct="true"])').first().check();
          await expect(page.locator('#next-question')).toBeEnabled();
          await measureTarget('Answer option', page.locator('.exam-option'));
          await measureTarget('Next button', page.locator('#next-question'));
          await bringToTop(page.locator('#exam-root'));
        });

        await step('question-10', 'Halfway through', [
          'The counter reads Question 10 of 20',
          'The progress bar shows 45% after nine answers',
        ], async () => {
          await page.locator('#next-question').click();
          for (let i = 2; i < 10; i++) await answerQuestion(false);
          await expect(page.locator('.exam-counter')).toHaveText('Question 10 of 20');
          await expect(page.locator('.exam-progress-bar')).toHaveAttribute('style', /width: 45%/);
          await page.locator('.exam-option input:not([data-correct="true"])').first().check();
          await bringToTop(page.locator('#exam-root'));
        });

        await step('failed', 'First attempt: not passed', [
          'Answering every question wrongly scores 0 / 20 (0%)',
          'No certificate is offered on a failed attempt',
        ], async () => {
          await page.locator('#next-question').click();
          for (let i = 11; i <= 20; i++) await answerQuestion(false);
          await expect(page.locator('.exam-result.failed')).toBeVisible();
          await expect(page.locator('.exam-score')).toHaveText('0 / 20 (0%)');
          await expect(page.locator('.exam-result h3')).toHaveText('Not quite yet');
          await expect(page.locator('#make-certificate')).toHaveCount(0);
          await bringToTop(page.locator('#exam-root'));
        });

        await step('review', 'Review: what to revisit, with sources', [
          'Each missed topic links to the page that teaches it',
          'Each missed topic cites a public https source',
        ], async () => {
          const items = page.locator('.exam-review li');
          const count = await items.count();
          expect(count).toBeGreaterThan(0);
          for (let i = 0; i < count; i++) {
            await expect(items.nth(i).locator('a').first()).toHaveAttribute('href', /^\//);
            await expect(items.nth(i).locator('.exam-source a')).toHaveAttribute('href', /^https:\/\//);
          }
          await bringToTop(page.locator('.exam-review'));
        });

        await step('name-required', 'Retake passed, name required', [
          'Retaking starts again at Question 1 of 20',
          'Answering every question correctly scores 20 / 20 (100%)',
          'Creating a certificate without a name is blocked and the field is marked invalid',
          'The name field and button meet the minimum touch target size',
        ], async () => {
          await page.locator('.exam-retake').click();
          await expect(page.locator('.exam-counter')).toHaveText('Question 1 of 20');
          for (let i = 1; i <= 20; i++) await answerQuestion(true);
          await expect(page.locator('.exam-result.passed')).toBeVisible();
          await expect(page.locator('.exam-score')).toHaveText('20 / 20 (100%)');
          await page.locator('#cert-name').fill('');
          await page.locator('#make-certificate').click();
          await expect(page.locator('#cert-name')).toHaveAttribute('aria-invalid', 'true');
          await expect(page.locator('#certificate-canvas')).toHaveCount(0);
          await measureTarget('Name field', page.locator('#cert-name'));
          await measureTarget('Create certificate button', page.locator('#make-certificate'));
          await bringToTop(page.locator('#exam-root'));
        });

        let credentialId = '';
        await step('certificate', 'Certificate created', [
          'The certificate is drawn at 1600×1130 and fits the screen width',
          'The credential ID has the form SLO-F-YYYYMMDD-XXXXXX',
          'LinkedIn "Add to profile" carries the certificate name, issuer, issue date, URL and credential ID',
          'LinkedIn and X share links point at the certification page and open in a new tab',
        ], async () => {
          await page.locator('#cert-name').fill(LEARNER);
          await page.locator('#make-certificate').click();
          const canvas = page.locator('#certificate-canvas');
          await expect(canvas).toBeVisible();
          await expect(canvas).toHaveAttribute('width', '1600');
          await expect(canvas).toHaveAttribute('height', '1130');
          const box = await canvas.boundingBox();
          expect(box!.x + box!.width).toBeLessThanOrEqual(device.width);

          const note = await page.locator('.cert-result .exam-note').textContent();
          credentialId = (note ?? '').match(/SLO-F-\d{8}-[A-Z0-9]{6}/)?.[0] ?? '';
          expect(credentialId).not.toBe('');

          const now = new Date();
          const profile = new URL((await page.locator('#share-linkedin-profile').getAttribute('href'))!);
          expect(profile.origin + profile.pathname).toBe('https://www.linkedin.com/profile/add');
          expect(Object.fromEntries(profile.searchParams)).toEqual({
            startTask: 'CERTIFICATION_NAME',
            name: 'SLO Foundation Certificate',
            organizationName: 'SLO Education Hub',
            issueYear: String(now.getFullYear()),
            issueMonth: String(now.getMonth() + 1),
            certUrl: CERT_URL,
            certId: credentialId,
          });
          const post = new URL((await page.locator('#share-linkedin-post').getAttribute('href'))!);
          expect(post.searchParams.get('url')).toBe(CERT_URL);
          const tweet = new URL((await page.locator('#share-x').getAttribute('href'))!);
          expect(tweet.origin).toBe('https://twitter.com');
          expect(tweet.searchParams.get('text')).toContain(CERT_URL);
          for (const id of ['#share-linkedin-profile', '#share-linkedin-post', '#share-x']) {
            await expect(page.locator(id)).toHaveAttribute('target', '_blank');
            await expect(page.locator(id)).toHaveAttribute('rel', /noopener/);
          }
          await bringToTop(page.locator('.cert-result'));
        });

        await step('share', 'Download and copy the post', [
          'Download PNG saves slo-foundation-certificate-sample-learner.png, a valid 1600×1130 PNG',
          'Copy post text puts the post, including the certification link, on the clipboard',
          'Share buttons meet the minimum touch target size',
        ], async () => {
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('#download-cert').click(),
          ]);
          expect(download.suggestedFilename()).toBe('slo-foundation-certificate-sample-learner.png');
          const saved = outDir ? path.join(outDir, 'certificate.png') : test.info().outputPath('certificate.png');
          await download.saveAs(saved);
          const png = fs.readFileSync(saved);
          expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
          expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1600, 1130]);

          if (browserName === 'chromium') {
            await context.grantPermissions(['clipboard-read', 'clipboard-write']);
          }
          await page.locator('#copy-post').click();
          if (browserName === 'chromium') {
            await expect(page.locator('#copy-post')).toHaveText('Copied');
            const clipboard = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboard).toContain('SLO Foundation Certificate');
            expect(clipboard).toContain(CERT_URL);
          } else {
            await expect(page.locator('#copy-post')).not.toHaveText('Copy post text');
          }
          await measureTarget('Share button', page.locator('.share-btn'));
          await measureTarget('Download button', page.locator('#download-cert'));
          await bringToTop(page.locator('.cert-actions'));
        });

        await step('return-visit', 'Coming back later', [
          'After a reload the intro remembers the pass date',
        ], async () => {
          await page.reload();
          await page.waitForLoadState('networkidle');
          await expect(page.locator('.exam-intro .exam-note')).toContainText('You passed on');
          await bringToTop(page.locator('#take-the-check'));
        });

        for (const [name, size] of Object.entries(targets)) {
          if (device.touch && size < RECOMMENDED_TARGET) {
            findings.push(`${name} is ${size}px, under the ${RECOMMENDED_TARGET}px recommended touch target`);
          }
        }
      } catch (error) {
        failure = String(error);
        throw error;
      } finally {
        if (outDir) {
          fs.writeFileSync(path.join(outDir, 'steps.json'), JSON.stringify({
            device, browserName, steps, targets, navRows, headerHeight, findings,
            status: failure ? 'failed' : 'passed', failure,
          }, null, 2));
        }
      }
    });

    test.afterEach(async ({ page }) => {
      const video = page.video();
      if (!SHOTS_DIR || !video) return;
      await page.close();
      await video.saveAs(path.join(SHOTS_DIR, device.id, 'journey.webm'));
    });
  });
}
