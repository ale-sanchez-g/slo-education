/**
 * Resources Module - Provides a consistent resources section across all pages
 * Features:
 * - Centralized resources structure rendered from a single source
 * - Loaded with the `defer` attribute so it never blocks page rendering;
 *   the browser downloads and executes this script after the HTML has been
 *   fully parsed (lazy-loaded, non-blocking)
 */

(function () {
    'use strict';

    /** Centralised resource data relevant to the SLO Education landing page. */
    var RESOURCES = [
        {
            icon: '<svg class="resource-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
            title: 'Documentation',
            items: [
                { text: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/', external: true },
                { text: 'SRE Workbook', url: 'https://sre.google/workbook/table-of-contents/', external: true }
            ]
        },
        {
            icon: '<svg class="resource-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/></svg>',
            title: 'Community',
            items: [
                { text: 'SRE Discord Community', url: 'https://discord.gg/YdG26M8P', external: true },
            ]
        },
        {
            icon: '<svg class="resource-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5a3.5 3.5 0 0 0 4.6 4.6L21 12l-9 9-3-3 9-9z"/><path d="M6 6l3 3"/><path d="M3.5 10.5l4-4"/></svg>',
            title: 'Tools',
            items: [
                { text: 'OPM - Open Prompt Manager', url: 'https://opm-dx1.com', external: true },
                { text: 'Error Budget Calculator', url: '/error-budget-calculator', external: false, rootRelative: false }
            ]
        }
    ];

    /** Return a prefix for root-relative internal links based on the current URL path. */
    function getRootPrefix() {
        return window.location.pathname.includes('/blog/') ? '../' : '';
    }

    /** Build the resources section HTML and inject it into the #resources-section element. */
    function renderResources() {
        var container = document.getElementById('resources-section');
        if (!container) { return; }

        var rootPrefix = getRootPrefix();
        var html = [
            '<section class="section">',
            '  <div class="container">',
            '    <p class="section-label">04 &mdash; Reference</p>',
            '    <h2>Resources</h2>',
            '    <p class="section-intro">Primary sources and tools worth keeping open while you work. External links open in a new tab.</p>',
            '    <div class="resources-grid">'
        ];

        RESOURCES.forEach(function (category) {
            html.push('      <div class="resource-card">');
            html.push('        <h4>' + category.icon + ' ' + category.title + '</h4>');
            html.push('        <ul>');
            category.items.forEach(function (item) {
                if (item.external) {
                    html.push(
                        '          <li><a href="' + item.url +
                        '" target="_blank" rel="noopener noreferrer">' + item.text + '</a></li>'
                    );
                } else {
                    var href = item.rootRelative ? rootPrefix + item.url : item.url;
                    html.push('          <li><a href="' + href + '">' + item.text + '</a></li>');
                }
            });
            html.push('        </ul>');
            html.push('      </div>');
        });

        html.push('    </div>');
        html.push('  </div>');
        html.push('</section>');

        container.innerHTML = html.join('\n');
    }

    // Run after the DOM is ready (script is loaded with `defer`, so the DOM
    // will already be parsed by the time this executes in most browsers, but
    // the check below keeps behaviour consistent across all environments)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderResources);
    } else {
        renderResources();
    }

    // Export for testing purposes
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { renderResources, RESOURCES: RESOURCES };
    }
})();
