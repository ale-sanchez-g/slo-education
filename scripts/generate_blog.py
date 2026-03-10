#!/usr/bin/env python3
"""
generate_blog.py — Weekly blog post generator for SLO Education Hub.

Uses the Gemini API to produce a 200-500 word educational article on SRE /
Observability topics, then:
  1. Writes the post as a standalone HTML file under blog/
  2. Inserts a card into blog/index.html
  3. Adds the new URL to sitemap.xml

Usage (called by the GitHub Actions weekly-blog workflow):
  python scripts/generate_blog.py

Required environment variable:
  GEMINI_API_KEY — Google Gemini API key stored in GitHub Secrets
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import date, timezone, datetime
from pathlib import Path
import xml.etree.ElementTree as ET

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = REPO_ROOT / "blog"
SITEMAP_PATH = REPO_ROOT / "sitemap.xml"
BLOG_INDEX_PATH = BLOG_DIR / "index.html"
SITE_BASE_URL = "https://slo-education.com.au"
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

# Pool of SRE/Observability topics rotated by ISO week number so each run
# produces a distinct topic without state management.
TOPICS = [
    "What is an SLO and why does it matter for reliability?",
    "Understanding error budgets: balancing reliability and innovation",
    "Service Level Indicators (SLIs): choosing the right metrics",
    "Incident management best practices for on-call teams",
    "Observability vs monitoring: key differences explained",
    "Introduction to distributed tracing for SRE teams",
    "How to write effective post-incident reviews (PIRs)",
    "Toil reduction: automating away operational burden",
    "Golden signals: latency, traffic, errors, and saturation",
    "SLO alerting: alert on burn rate, not raw error rate",
    "Chaos engineering: building confidence in reliability",
    "Platform engineering and its relationship with SRE",
    "Service mesh and observability: what you need to know",
    "Capacity planning with error budgets",
    "On-call culture: building sustainable practices",
    "AIOps and machine learning in incident detection",
    "Cost of reliability: quantifying downtime impact",
    "Progressive delivery and feature flags for reliability",
    "Continuous verification in CI/CD pipelines",
    "Multi-cloud observability strategies",
    "OpenTelemetry: the open standard for observability",
    "Runbook automation for faster incident resolution",
    "SRE team topologies and how to structure reliability work",
    "Database reliability engineering essentials",
    "Security SLOs: measuring and improving security posture",
    "Network reliability and how to measure it",
    "Kubernetes observability: monitoring containerised workloads",
    "Synthetic monitoring: proactively detect user-facing issues",
    "Real user monitoring (RUM) vs synthetic monitoring",
    "Building a reliability culture across engineering teams",
    "Service catalogues and their role in incident response",
    "Error budget policies: when to stop shipping features",
    "Serverless observability challenges and solutions",
    "Measuring and improving Mean Time To Recovery (MTTR)",
    "Dependency risk: how third-party services affect your SLOs",
    "Grafana and Prometheus: open-source observability stack",
    "Datadog, New Relic, Honeycomb: choosing an observability tool",
    "FinOps meets SRE: cost and reliability trade-offs",
    "Reliability testing: load, stress, and soak testing",
    "Lessons from major internet outages",
    "Structured logging best practices for SRE",
    "Dashboards that drive action, not just awareness",
    "Reliability requirements in software architecture reviews",
    "SLOs for machine-learning and AI systems",
    "Managing technical debt through an SRE lens",
    "SRE career paths: from practitioner to principal",
    "Incident command systems borrowed from emergency services",
    "Communication during incidents: templates and tips",
    "Using SLOs in vendor contracts and SLAs",
    "Getting started with SRE in a small engineering team",
    "Weekly SRE and Observability news round-up",
]


# ──────────────────────────────────────────────────────────────────────────────
# Gemini prompt
# ──────────────────────────────────────────────────────────────────────────────

def build_prompt(topic: str) -> str:
    return f"""You are an expert technical writer for a Site Reliability Engineering (SRE)
education website called "SLO Education Hub" (https://slo-education.com.au).

Write a high-quality, educational blog post about: **{topic}**

Requirements:
- Length: 250–500 words (body text only, excluding the title)
- Audience: software engineers and IT professionals who are new to SRE concepts
- Tone: clear, practical, and encouraging — avoid jargon without explanation
- Include at least 3 hyperlinks to reputable external resources (Google SRE Book,
  CNCF, OpenTelemetry docs, Atlassian blog, etc.) using Markdown link syntax
- Reference at least one related page on the SLO Education Hub site:
    * https://slo-education.com.au/cuj-sli-slo-error-budget.html  (CUJ → SLI → SLO)
    * https://slo-education.com.au/error-budget-calculator.html   (Error Budget Calculator)
    * https://slo-education.com.au/incident-management.html       (Incident Management)
- Do NOT use first-person ("I", "we") — write in second or third person
- Do NOT include a meta section, frontmatter, or JSON
- Output format: return a JSON object with EXACTLY these keys:
  {{
    "title": "<concise, engaging article title (max 80 chars)>",
    "description": "<meta description, 120-160 chars, keyword-rich>",
    "keywords": "<comma-separated list of 5-8 relevant keywords>",
    "tags": ["<tag1>", "<tag2>", "<tag3>"],
    "body_html": "<the full article body as valid HTML — use <h2>, <h3>, <p>, <ul>/<li>, and <a href> tags only>"
  }}

Return only the JSON object, with no additional text or markdown fences."""


# ──────────────────────────────────────────────────────────────────────────────
# Gemini API call
# ──────────────────────────────────────────────────────────────────────────────

def call_gemini(api_key: str, prompt: str) -> dict:
    """Call the Gemini API and return the parsed JSON response from the model."""
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }).encode("utf-8")

    url = f"{GEMINI_API_URL}?key={api_key}"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API HTTP {exc.code}: {body}") from exc

    try:
        text = raw["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Unexpected Gemini response structure: {raw}") from exc


# ──────────────────────────────────────────────────────────────────────────────
# HTML generation helpers
# ──────────────────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """Convert a title string to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text[:80]


def render_post_html(
    title: str,
    description: str,
    keywords: str,
    tags: list,
    body_html: str,
    pub_date: str,
    slug: str,
) -> str:
    """Return the full HTML for an individual blog post page."""
    tags_html = "".join(
        f'<span class="blog-post-tag">{t}</span>' for t in tags
    )
    canonical = f"{SITE_BASE_URL}/blog/{slug}.html"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{description}">
    <meta name="keywords" content="{keywords}">
    <meta property="og:title" content="{title} - SLO Education Hub">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical}">
    <meta property="article:published_time" content="{pub_date}">
    <title>{title} - SLO Education Hub</title>
    <link rel="stylesheet" href="../style/styles.css">
    <link rel="stylesheet" href="../style/blog.css">
    <link rel="icon" href="../favicon.svg" type="image/svg+xml">
    <link rel="canonical" href="{canonical}">
</head>
<body>
    <!-- Cookie Consent Banner -->
    <div id="cookie-consent-banner" class="cookie-banner" style="display: none;">
        <div class="cookie-banner-content">
            <p>
                <strong>We value your privacy</strong><br>
                We use cookies and analytics tools to improve your experience and understand how you use our site.
                By clicking "Accept", you consent to the use of Google Analytics.
                <a href="../privacy-policy.html" style="color: #fff; text-decoration: underline;">Learn more</a>
            </p>
            <div class="cookie-banner-buttons">
                <button id="cookie-accept" class="cookie-btn cookie-accept">Accept</button>
                <button id="cookie-decline" class="cookie-btn cookie-decline">Decline</button>
            </div>
        </div>
    </div>

    <header>
        <nav class="navbar">
            <div class="container">
                <h1 class="logo"><a href="../index.html">SLO Education</a></h1>
                <ul class="nav-links"></ul>
            </div>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h2>{title}</h2>
                <p class="hero-subtitle">{description}</p>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <a href="index.html" class="blog-back-link">&larr; Back to Blog</a>
                <div class="blog-post-meta">
                    <span>{pub_date}</span>
                    {tags_html}
                </div>
                <article class="blog-post-content">
                    {body_html}
                </article>
            </div>
        </section>

        <div id="resources-section"></div>
    </main>

    <footer></footer>

    <!-- Cookie Consent & Analytics Script -->
    <script>
        const CONSENT_KEY = 'slo-education-analytics-consent';
        const consentBanner = document.getElementById('cookie-consent-banner');
        const acceptBtn = document.getElementById('cookie-accept');
        const declineBtn = document.getElementById('cookie-decline');

        function checkConsent() {{
            const consent = localStorage.getItem(CONSENT_KEY);
            if (consent === null) {{
                consentBanner.style.display = 'block';
            }} else if (consent === 'accepted') {{
                initializeAnalytics();
            }}
        }}

        function initializeAnalytics() {{
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=G-0XTFS0T3Y0';
            document.head.appendChild(script);
            window.dataLayer = window.dataLayer || [];
            window.gtag = function(){{ dataLayer.push(arguments); }};
            window.gtag('js', new Date());
            window.gtag('config', 'G-0XTFS0T3Y0', {{ 'anonymize_ip': true }});
        }}

        acceptBtn.addEventListener('click', function() {{
            localStorage.setItem(CONSENT_KEY, 'accepted');
            consentBanner.style.display = 'none';
            initializeAnalytics();
        }});

        declineBtn.addEventListener('click', function() {{
            localStorage.setItem(CONSENT_KEY, 'declined');
            consentBanner.style.display = 'none';
        }});

        checkConsent();
    </script>

    <script src="../scripts/menu.js"></script>
    <script src="../scripts/resources.js" defer></script>
    <script src="../scripts/footer.js" defer></script>
</body>
</html>
"""


# ──────────────────────────────────────────────────────────────────────────────
# Blog index update
# ──────────────────────────────────────────────────────────────────────────────

def build_card_html(title: str, description: str, tags: list, pub_date: str, slug: str) -> str:
    """Return the HTML for one blog card in blog/index.html."""
    tags_html = "".join(f'<span class="blog-card-tag">{t}</span>' for t in tags)
    return (
        f'<div class="blog-card">\n'
        f'  <div class="blog-card-meta"><span>{pub_date}</span>{tags_html}</div>\n'
        f'  <h3><a href="{slug}.html">{title}</a></h3>\n'
        f'  <p>{description}</p>\n'
        f'  <a href="{slug}.html" class="read-more">Read more &rarr;</a>\n'
        f'</div>'
    )


def update_blog_index(card_html: str) -> None:
    """Insert the new card at the top of #blog-posts in blog/index.html."""
    content = BLOG_INDEX_PATH.read_text(encoding="utf-8")

    # Remove the "no posts yet" placeholder on first post
    content = content.replace(
        '<p class="blog-empty">No posts yet — check back soon!</p>', ""
    )

    # Insert the new card at the very beginning of #blog-posts div
    marker = '<div id="blog-posts" class="blog-grid">'
    if marker not in content:
        print("WARNING: could not find blog-posts marker in blog/index.html", file=sys.stderr)
        return

    content = content.replace(
        marker,
        f"{marker}\n                    {card_html}",
    )
    BLOG_INDEX_PATH.write_text(content, encoding="utf-8")


# ──────────────────────────────────────────────────────────────────────────────
# Sitemap update
# ──────────────────────────────────────────────────────────────────────────────

def update_sitemap(slug: str, pub_date: str) -> None:
    """Add blog index and the new post URL to sitemap.xml if not already present."""
    ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"

    existing_locs = {url.find(f"{{{ns}}}loc").text for url in root.findall(f"{{{ns}}}url")}

    def add_url(loc: str, changefreq: str, priority: str, lastmod: str = None) -> None:
        if loc in existing_locs:
            return
        url_el = ET.SubElement(root, f"{{{ns}}}url")
        ET.SubElement(url_el, f"{{{ns}}}loc").text = loc
        if lastmod:
            ET.SubElement(url_el, f"{{{ns}}}lastmod").text = lastmod
        ET.SubElement(url_el, f"{{{ns}}}changefreq").text = changefreq
        ET.SubElement(url_el, f"{{{ns}}}priority").text = priority

    add_url(f"{SITE_BASE_URL}/blog/", "weekly", "0.8")
    add_url(f"{SITE_BASE_URL}/blog/{slug}.html", "monthly", "0.7", pub_date)

    # Write back with XML declaration and proper indentation
    ET.indent(tree, space="  ")
    tree.write(SITEMAP_PATH, encoding="unicode", xml_declaration=True)

    # Ensure the file ends with a newline
    content = SITEMAP_PATH.read_text(encoding="utf-8")
    if not content.endswith("\n"):
        SITEMAP_PATH.write_text(content + "\n", encoding="utf-8")


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        sys.exit("ERROR: GEMINI_API_KEY environment variable is not set.")

    # Pick topic by ISO week number for deterministic rotation
    today = date.today()
    iso_week = today.isocalendar()[1]
    topic = TOPICS[iso_week % len(TOPICS)]
    print(f"Generating post for week {iso_week}: {topic}")

    prompt = build_prompt(topic)
    print("Calling Gemini API…")
    data = call_gemini(api_key, prompt)

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    keywords = data.get("keywords", "").strip()
    tags = data.get("tags", [])
    body_html = data.get("body_html", "").strip()

    if not title or not body_html:
        sys.exit(f"ERROR: Gemini response missing required fields: {data}")

    pub_date = today.isoformat()
    slug = f"{pub_date}-{slugify(title)}"

    # 1. Write individual post HTML
    BLOG_DIR.mkdir(exist_ok=True)
    post_path = BLOG_DIR / f"{slug}.html"
    post_html = render_post_html(title, description, keywords, tags, body_html, pub_date, slug)
    post_path.write_text(post_html, encoding="utf-8")
    print(f"Written: {post_path}")

    # 2. Update blog/index.html
    card_html = build_card_html(title, description, tags, pub_date, slug)
    update_blog_index(card_html)
    print(f"Updated: {BLOG_INDEX_PATH}")

    # 3. Update sitemap.xml
    update_sitemap(slug, pub_date)
    print(f"Updated: {SITEMAP_PATH}")

    print("Done.")


if __name__ == "__main__":
    main()
