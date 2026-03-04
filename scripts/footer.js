/**
 * Footer Module - Provides consistent footer across all pages
 * Features:
 * - Centralized footer structure rendered from a single source
 * - Loaded with the `defer` attribute so it never blocks page rendering;
 *   the browser downloads and executes this script after the HTML has been
 *   fully parsed (lazy-loaded, non-blocking)
 */

(function () {
    'use strict';

    /** Build the footer inner HTML and inject it into the <footer> element. */
    function renderFooter() {
        var footerEl = document.querySelector('footer');
        if (!footerEl) { return; }

        footerEl.innerHTML = [
            '<div class="container">',
            '  <div class="footer-grid">',
            '    <div class="footer-section footer-brand">',
            '      <h3 class="footer-logo">SLO Education</h3>',
            '      <p class="footer-tagline">A central hub for teams to join the SLO education journey.</p>',
            '    </div>',
            '    <div class="footer-section">',
            '      <h4>Quick Links</h4>',
            '      <ul>',
            '        <li><a href="index.html">Home</a></li>',
            '        <li><a href="cuj-sli-slo-error-budget.html">CUJ, SLI &amp; SLO</a></li>',
            '        <li><a href="error-budget-calculator.html">Error Budget Calculator</a></li>',
            '        <li><a href="incident-management.html">Incident Management</a></li>',
            '      </ul>',
            '    </div>',
            '    <div class="footer-section">',
            '      <h4>Resources</h4>',
            '      <ul>',
            '        <li><a href="https://sre.google/sre-book/table-of-contents/" target="_blank" rel="noopener noreferrer">Google SRE Book</a></li>',
            '        <li><a href="https://discord.gg/YdG26M8P" target="_blank" rel="noopener noreferrer">Discord Community</a></li>',
            '        <li><a href="https://github.com/slok/sloth" target="_blank" rel="noopener noreferrer">Sloth Tool</a></li>',
            '      </ul>',
            '    </div>',
            '    <div class="footer-section">',
            '      <h4>Legal</h4>',
            '      <ul>',
            '        <li><a href="privacy-policy.html">Privacy Policy</a></li>',
            '        <li><a href="LICENSE">MIT License</a></li>',
            '      </ul>',
            '    </div>',
            '  </div>',
            '  <div class="footer-bottom">',
            '    <p>&copy; 2026 SLO Education Hub. Licensed under <a href="LICENSE">MIT</a>.</p>',
            '  </div>',
            '</div>'
        ].join('\n');
    }

    // Run after the DOM is ready (script is loaded with `defer`, so the DOM
    // will already be parsed by the time this executes in most browsers, but
    // the check below keeps behaviour consistent across all environments)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFooter);
    } else {
        renderFooter();
    }

    // Export for testing purposes
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { renderFooter };
    }
})();
