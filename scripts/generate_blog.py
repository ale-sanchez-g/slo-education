#!/usr/bin/env python3
"""
generate_blog.py — Weekly blog post generator for SLO Education Hub.

Uses the Gemini API to produce a 200 to 300 word educational article on SRE /
Observability topics, then:
  1. Writes the post as a standalone HTML file under blog/
  2. Inserts a card into blog/index.html
  3. Adds the new URL to sitemap.xml

Usage (called by the GitHub Actions weekly-blog workflow):
  python scripts/generate_blog.py

Required environment variable:
  GEMINI_API_KEY — Google Gemini API key stored in GitHub Secrets
"""

import html
import json
import logging
import os
import re
import sys
from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET

try:
    from google import genai
except ImportError:
    sys.exit("ERROR: google-genai package not installed. Run: pip install google-genai")

# Configure logging for better observability
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = REPO_ROOT / "blog"
SITEMAP_PATH = REPO_ROOT / "sitemap.xml"
BLOG_INDEX_PATH = BLOG_DIR / "index.html"
SITE_BASE_URL = "https://slo-education.com.au"
GEMINI_MODEL = "gemini-2.5-flash"
AI_DISPLAY_NAME = "Gemini AI"

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
- Length: 200 to 300 words (body text only, excluding the title)
- Audience: software engineers and IT professionals who are new to SRE concepts
- Tone: clear, practical, and encouraging — avoid jargon without explanation
- Include at least 3 hyperlinks to reputable external resources (Google SRE Book,
  CNCF, OpenTelemetry docs, Atlassian blog, etc.) using Markdown link syntax
- Reference at least one related page on the SLO Education Hub site:
    * https://slo-education.com.au/cuj-sli-slo-error-budget  (CUJ → SLI → SLO)
    * https://slo-education.com.au/error-budget-calculator   (Error Budget Calculator)
    * https://slo-education.com.au/incident-management       (Incident Management)
    * https://slo-education.com.au/blog/                          (Blog index page with more articles)
- Do NOT repeat the topic in the title verbatim — create a concise, engaging title that captures the essence of the article
- Do NOT use first-person ("I", "we") — write in second or third person
- Do NOT include any prose, commentary, frontmatter, or markdown fences outside the JSON object
- Output format: return ONLY a JSON object with EXACTLY these keys:
  {{
    "title": "<concise, engaging article title (max 80 chars)",
    "description": "<meta description, 120-160 chars, keyword-rich>",
    "keywords": "<comma-separated list of 5-8 relevant keywords>",
    "tags": ["<tag1>", "<tag2>", "<tag3>"],
    "body_html": "<the full article body as XML-compatible HTML — use <h2>, <h3>, <p>, <ul>/<li>, and <a href> tags only; every & character in text or attribute values MUST be written as &amp; (e.g. 'SRE &amp; Platform Engineering'); all tags must be properly closed; do NOT use bare & anywhere>"
  }}

Return only the JSON object, with no additional text or markdown fences."""


# ──────────────────────────────────────────────────────────────────────────────
# Gemini API call
# ──────────────────────────────────────────────────────────────────────────────

def call_gemini(api_key: str, prompt: str) -> dict:
    """Call the Gemini API using the official SDK and return the parsed JSON response."""
    logger.info(f"Initializing Gemini SDK with model: {GEMINI_MODEL}")
    
    try:
        # Initialize the client with API key
        client = genai.Client(api_key=api_key)
        
        # Configure generation settings
        generation_config = genai.types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=9000,
            response_mime_type="application/json",
        )
        
        logger.info("Sending request to Gemini API...")
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=generation_config,
        )
        
        # Log response metadata for observability
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            logger.info(
                f"Token usage - Prompt: {response.usage_metadata.prompt_token_count}, "
                f"Candidates: {response.usage_metadata.candidates_token_count}, "
                f"Total: {response.usage_metadata.total_token_count}"
            )
        
        # Extract and parse the JSON response
        text = response.text
        logger.debug(f"Response received (length: {len(text)} chars)")
        
        return json.loads(text)
        
    except json.JSONDecodeError as exc:
        logger.error(f"Failed to parse JSON response: {exc}")
        logger.debug(f"Raw response text: {text[:500]}...")
        raise RuntimeError(f"Invalid JSON in Gemini response: {exc}") from exc
    
    except Exception as exc:
        logger.error(f"Gemini API call failed: {type(exc).__name__}: {exc}")
        raise RuntimeError(f"Gemini API error: {exc}") from exc


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


# Allowlist of tags and attributes permitted in model-generated body HTML.
_ALLOWED_TAGS = {"h2", "h3", "p", "ul", "ol", "li", "a", "strong", "em", "code", "pre", "blockquote"}
_ALLOWED_ATTRS = {
    "a": {"href"},
}
_SAFE_HREF_RE = re.compile(r"^(https?://|/)", re.IGNORECASE)


def _make_xml_safe(html_str: str) -> str:
    """Replace bare & (not part of a valid XML entity) with &amp; so the HTML
    fragment can be parsed by the XML-strict ElementTree parser.

    XML only defines five named entities (&amp;, &lt;, &gt;, &apos;, &quot;),
    plus numeric character references. All other '&name;' sequences are
    treated as plain text and must be escaped here.
    """
    return re.sub(
        r'&(?!(?:amp|lt|gt|apos|quot|#[0-9]+|#x[0-9a-fA-F]+);)',
        '&amp;',
        html_str,
    )


def sanitize_body_html(raw: str) -> str:
    """Strip any tags/attributes not in the allowlist from model-generated HTML.

    Uses the standard-library xml.etree.ElementTree parser for a
    dependency-free, allowlist-based sanitiser.  Because ET requires a single
    root element, the raw fragment is wrapped in a <div> before parsing and
    the wrapper is then stripped from the result.

    Bare & characters (e.g. in link text or attribute values) are pre-processed
    to &amp; so they don't cause an XML ParseError.
    """
    xml_safe = _make_xml_safe(raw)
    try:
        root = ET.fromstring(f"<div>{xml_safe}</div>")
    except ET.ParseError:
        # If the model returned truly malformed XML/HTML, fall back to plain-text.
        logger.warning("sanitize_body_html: XML parse failed even after & → &amp; fix; falling back to escaped text.")
        return html.escape(raw)

    def _clean(el: ET.Element) -> str:
        parts: list[str] = []
        tag = el.tag.lower() if isinstance(el.tag, str) else ""

        if tag not in _ALLOWED_TAGS and tag != "div":
            # Disallowed tag — keep only its text content.
            parts.append(html.escape(el.text or ""))
            for child in el:
                parts.append(_clean(child))
                parts.append(html.escape(child.tail or ""))
            return "".join(parts)

        # Build safe attribute string.
        safe_attrs = ""
        permitted = _ALLOWED_ATTRS.get(tag, set())
        for attr, val in el.attrib.items():
            attr_lower = attr.lower()
            if attr_lower not in permitted:
                continue
            if attr_lower == "href" and not _SAFE_HREF_RE.match(val):
                continue
            safe_attrs += f' {html.escape(attr_lower)}="{html.escape(val)}"'

        inner = html.escape(el.text or "")
        for child in el:
            inner += _clean(child)
            inner += html.escape(child.tail or "")

        if tag == "div":
            return inner  # strip the wrapper div itself
        return f"<{tag}{safe_attrs}>{inner}</{tag}>"

    return _clean(root)


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
    # Escape model-supplied strings used in HTML attribute contexts.
    esc_title = html.escape(title)
    esc_description = html.escape(description)
    esc_keywords = html.escape(keywords)
    tags_html = "".join(
        f'<span class="blog-post-tag">{html.escape(t)}</span>' for t in tags
    )
    canonical = f"{SITE_BASE_URL}/blog/{slug}"
    safe_body = sanitize_body_html(body_html)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{esc_description}">
    <meta name="keywords" content="{esc_keywords}">
    <meta property="og:title" content="{esc_title} - SLO Education Hub">
    <meta property="og:description" content="{esc_description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical}">
    <meta property="article:published_time" content="{pub_date}">
    <title>{esc_title} - SLO Education Hub</title>
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
                <a href="/privacy-policy" style="color: #fff; text-decoration: underline;">Learn more</a>
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
                <h1 class="logo"><a href="/">SLO Education</a></h1>
                <ul class="nav-links"></ul>
            </div>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h2>{esc_title}</h2>
                <p class="hero-subtitle">{esc_description}</p>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <a href="/blog/" class="blog-back-link">&larr; Back to Blog</a>
                <div class="blog-post-meta">
                    <span>{pub_date}</span>
                    {tags_html}
                </div>
                <article class="blog-post-content">
                    {safe_body}
                </article>
                <p class="blog-ai-notice"><strong>This article was generated with the help of {AI_DISPLAY_NAME}.</strong></p>
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
        f'  <h3><a href="/blog/{slug}">{title}</a></h3>\n'
        f'  <p>{description}</p>\n'
        f'  <a href="/blog/{slug}" class="read-more">Read more &rarr;</a>\n'
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
    add_url(f"{SITE_BASE_URL}/blog/{slug}", "monthly", "0.7", pub_date)

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
    logger.info("Starting blog post generation")
    
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        logger.error("GEMINI_API_KEY environment variable is not set")
        sys.exit("ERROR: GEMINI_API_KEY environment variable is not set.")

    # Pick topic by ISO week number for deterministic rotation
    today = date.today()
    iso_week = today.isocalendar()[1]
    topic = TOPICS[iso_week % len(TOPICS)]
    logger.info(f"Week {iso_week}: Selected topic '{topic}'")

    prompt = build_prompt(topic)
    logger.debug(f"Prompt length: {len(prompt)} characters")
    
    try:
        data = call_gemini(api_key, prompt)
    except Exception as exc:
        logger.error(f"Failed to generate content: {exc}")
        sys.exit(f"ERROR: Content generation failed: {exc}")

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    keywords = data.get("keywords", "").strip()
    tags = data.get("tags", [])
    body_html = data.get("body_html", "").strip()

    if not title or not body_html:
        logger.error(f"Gemini response missing required fields: {data.keys()}")
        sys.exit(f"ERROR: Gemini response missing required fields: {data}")

    logger.info(f"Generated post: '{title}' ({len(body_html)} chars, {len(tags)} tags)")

    pub_date = today.isoformat()
    slug = f"{pub_date}-{slugify(title)}"

    # 1. Write individual post HTML
    BLOG_DIR.mkdir(exist_ok=True)
    post_path = BLOG_DIR / f"{slug}.html"
    post_html = render_post_html(title, description, keywords, tags, body_html, pub_date, slug)
    post_path.write_text(post_html, encoding="utf-8")
    logger.info(f"Written blog post: {post_path}")

    # 2. Update blog/index.html
    card_html = build_card_html(title, description, tags, pub_date, slug)
    update_blog_index(card_html)
    logger.info(f"Updated blog index: {BLOG_INDEX_PATH}")

    # 3. Update sitemap.xml
    update_sitemap(slug, pub_date)
    logger.info(f"Updated sitemap: {SITEMAP_PATH}")

    logger.info("✓ Blog post generation complete")
    print(f"✓ Generated: {slug}.html")


if __name__ == "__main__":
    main()
