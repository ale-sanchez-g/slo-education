# v1.1.2 — Footer design and content consolidation

## What's new

### Unified multi-column footer

Replaced the single-line copyright footer on all pages with a structured 4-column grid layout containing four sections:

- **Brand / tagline** — SLO Education logo and description
- **Quick Links** — internal navigation to all site pages
- **Resources** — external links (Google SRE Book, Discord Community, Sloth Tool)
- **Legal** — Privacy Policy and MIT License

Responsive breakpoints collapse the grid to 2 columns at ≤ 768 px and 1 column at ≤ 480 px. Link hover transitions use the site's `#667eea` accent colour.

### Footer JavaScript module

All footer markup is now maintained in a single place: `scripts/footer.js`. The module follows the same IIFE pattern as `scripts/menu.js` and dynamically renders the footer into the `<footer>` placeholder on `DOMContentLoaded`. It is loaded with the `defer` attribute on every page so it never blocks page rendering.

### HTML cleanup

- All 5 pages (`index.html`, `cuj-sli-slo-error-budget.html`, `error-budget-calculator.html`, `incident-management.html`, `privacy-policy.html`) reduced from a 37-line duplicated footer block to a single `<footer></footer>` placeholder plus one `<script>` tag.
- Removed inline `style="color: #667eea; text-decoration: none;"` attributes from footer anchor elements.

---

# v1.1.1 — Reliability pipeline page and docs

## What's new

### New educational content

Added a new page `cuj-sli-slo-error-budget.html` featuring an interactive demo, deep dives on CUJ and SLI concepts, a reliability pipeline walkthrough (CUJ → SLI → SLO → Error Budget), further reading, cookie consent, and analytics integration.

### Styling and consistency improvements

Removed custom hero classes (`calculator-hero`, `incident-hero`) from `error-budget-calculator.html` and `incident-management.html` for a consistent hero section across pages. [1] [2]

### Documentation updates

Updated `knowledge/slo-education-site-analysis.md` to include a timestamp and a `BEFORE` section header for clearer historical context.

---

# v1.1.0 — Interactive SLO Examples

## What's new

### Interactive Flip Card Examples Section

A new **SLO Examples in Practice** section has been added to the home page, sitting between the core concepts and the Get Started steps. It introduces three real-world SLOs — availability, latency, and error rate — using a teach-by-analogy format.

#### How it works

Each card leads with a familiar everyday scenario on the front face. Clicking or pressing **Enter / Space** flips the card with a smooth 3D CSS transform to reveal the technical detail on the back: SLI, Target, and plain-English meaning.

| Card | Analogy | SLO Target |
|------|---------|------------|
| Availability | Coffee shop order wait ≤ 2 min | 99.9% requests succeed |
| Latency | Airport security queue ≤ 5 min | p95 response < 200 ms |
| Error Rate | ATM network uptime | < 0.1% failed transactions |

#### Accessibility & UX

- Keyboard navigable (`tabindex="0"`, `role="button"`, `aria-pressed` reflects flip state)
- All cards render at equal height regardless of content length
- `prefers-reduced-motion` respected — animation is skipped, faces swap instantly

### Content fix

The *Service Level Objectives* concept card previously contained a circular definition (SLO was defined using SLI before SLI was introduced). The definition has been rewritten so SLIs are established first.

### Site analysis knowledge doc

A new `knowledge/` directory contains a structured multi-perspective analysis of the site (Educator, SRE Expert, Student) with consensus improvement ratings, used to inform these changes.

---

## Test coverage

**Functional tests** (`cta.spec.ts`) — 12 new tests covering:
- Card count, front analogy labels and SLO targets
- Back "In technology terms" labels and SLI / Target / Means rows
- Click and keyboard (Enter / Space) toggle behaviour
- `aria-pressed` state management
- Equal-height assertion across all three cards
- Independent flipping (one flip does not affect siblings)
- `tabindex` and `role` attribute checks

**Visual regression tests** (`visual.spec.ts`) — 3 new section-level screenshots:
- `examples-desktop-front` — all cards showing analogy side
- `examples-desktop-flipped` — first card flipped, others intact
- `examples-mobile-front` — mobile stacked layout

Home page full-page snapshots (`home-desktop`, `home-mobile`) regenerated to reflect the new section.

---

## Version bump

`package.json`, `package-lock.json`, and the Grafana Faro app config (`scripts/grafana.js`) updated: `1.0.0` → `1.1.0`.
