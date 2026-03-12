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
            icon: '📚',
            title: 'Documentation',
            items: [
                { text: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/', external: true },
                { text: 'SRE Workbook', url: 'https://sre.google/workbook/table-of-contents/', external: true }
            ]
        },
        {
            icon: '💬',
            title: 'Community',
            items: [
                { text: 'SRE Discord Community', url: 'https://discord.gg/YdG26M8P', external: true },
            ]
        },
        {
            icon: '🛠️',
            title: 'Tools',
            items: [
                { text: 'Sloth - SLO Generator', url: 'https://github.com/slok/sloth', external: true },
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
            '    <h2>Resources</h2>',
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
