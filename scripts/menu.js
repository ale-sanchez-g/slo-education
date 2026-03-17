/**
 * Menu Module - Provides consistent navigation across all pages with responsive design
 * Features:
 * - Consistent navigation structure
 * - Responsive hamburger menu on mobile
 * - Smooth transitions
 * - Keyboard accessible
 */

(function() {
    'use strict';

    // Navigation configuration - centralized menu structure
    const NAV_CONFIG = {
        home: {
            links: [
                { text: 'Calculator', href: '/error-budget-calculator' },
                { text: 'CUJ \u2192 SLI \u2192 SLO', href: '/cuj-sli-slo-error-budget' },
                { text: 'Incident Management', href: '/incident-management' },
                { text: 'Blog', href: '/blog/' },
                { text: 'SRE Games', href: 'https://cafe.slo-education.com.au/', target: '_blank' },
                { text: 'Privacy', href: '/privacy-policy' }
            ]
        },
        other: {
            links: [
                { text: 'Home', href: '/' },
                { text: 'Calculator', href: '/error-budget-calculator' },
                { text: 'CUJ \u2192 SLI \u2192 SLO', href: '/cuj-sli-slo-error-budget' },
                { text: 'Incident Management', href: '/incident-management' },
                { text: 'Blog', href: '/blog/' },
                { text: 'SRE Games', href: 'https://cafe.slo-education.com.au/', target: '_blank' },
                { text: 'Privacy', href: '/privacy-policy' }
            ]
        },
        blog: {
            links: [
                { text: 'Home', href: '/' },
                { text: 'Calculator', href: '/error-budget-calculator' },
                { text: 'CUJ \u2192 SLI \u2192 SLO', href: '/cuj-sli-slo-error-budget' },
                { text: 'Incident Management', href: '/incident-management' },
                { text: 'Blog', href: '/blog/' },
                { text: 'SRE Games', href: 'https://cafe.slo-education.com.au/', target: '_blank' },
                { text: 'Privacy', href: '/privacy-policy' }
            ]
        }
    };

    /**
     * Initialize the responsive menu
     */
    function initializeMenu() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            console.warn('Menu module: navbar not found');
            return;
        }

        // Determine which page we're on
        const currentPage = getCurrentPage();

        // Render nav links from centralized config
        renderNavLinks(currentPage);

        // Create and insert hamburger button
        createHamburgerButton(navbar);
        
        // Ensure nav-links starts in clean state
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.classList.remove('active');
        }
        
        // Setup menu toggle functionality
        setupMenuToggle();
        
        // Handle window resize
        handleWindowResize();
        
        // Add active state to current page link
        highlightCurrentPage(currentPage);
    }

    /**
     * Determine the current page
     */
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('error-budget-calculator')) return 'calculator';
        if (path.includes('cuj-sli-slo-error-budget')) return 'cuj-sli-slo-error-budget';
        if (path.includes('incident-management')) return 'incident-management';
        if (path.includes('privacy-policy')) return 'privacy-policy';
        if (path.includes('/blog/')) return 'blog';
        return 'home';
    }

    /**
     * Render navigation links into the .nav-links element from NAV_CONFIG
     */
    function renderNavLinks(currentPage) {
        const navList = document.querySelector('.nav-links');
        if (!navList) return;

        var config;
        if (currentPage === 'home') {
            config = NAV_CONFIG.home;
        } else if (currentPage === 'blog') {
            config = NAV_CONFIG.blog;
        } else {
            config = NAV_CONFIG.other;
        }

        navList.innerHTML = config.links.map(function(link) {
            var attrs = link.target ? ' target="' + link.target + '" rel="noopener noreferrer"' : '';
            return '<li><a href="' + link.href + '"' + attrs + '>' + link.text + '</a></li>';
        }).join('');
    }

    /**
     * Create hamburger button for mobile menu
     */
    function createHamburgerButton(navbar) {
        const container = navbar.querySelector('.container');
        if (!container) return;

        // Check if hamburger already exists
        if (container.querySelector('.hamburger')) return;

        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.setAttribute('aria-label', 'Toggle navigation menu');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;

        // Insert hamburger at the end of container (CSS order will position it correctly)
        container.appendChild(hamburger);
    }

    /**
     * Setup menu toggle functionality
     */
    function setupMenuToggle() {
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        
        if (!hamburger || !navLinks) return;

        hamburger.addEventListener('click', function() {
            // Only toggle if hamburger is visible (mobile)
            const hamburgerComputedStyle = window.getComputedStyle(hamburger);
            if (hamburgerComputedStyle.display === 'none') return;
            
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            
            // Toggle menu
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            // Update aria-expanded
            hamburger.setAttribute('aria-expanded', !isExpanded);
            
            // Toggle body scroll when menu is open on mobile
            if (window.innerWidth <= 768) {
                document.body.style.overflow = !isExpanded ? 'hidden' : '';
            }
        });

        // Close menu when clicking on a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const target = event.target;
            if (!hamburger.contains(target) && !navLinks.contains(target)) {
                if (hamburger.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                }
            }
        });

        // Handle escape key to close menu
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                hamburger.focus();
            }
        });
    }

    /**
     * Handle window resize to manage menu state
     */
    function handleWindowResize() {
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                const hamburger = document.querySelector('.hamburger');
                const navLinks = document.querySelector('.nav-links');
                
                // Reset menu state on desktop
                if (window.innerWidth > 768) {
                    if (hamburger) {
                        hamburger.classList.remove('active');
                        hamburger.setAttribute('aria-expanded', 'false');
                    }
                    if (navLinks) {
                        navLinks.classList.remove('active');
                    }
                    document.body.style.overflow = '';
                } else {
                    // Ensure proper state on mobile based on menu visibility
                    if (navLinks && navLinks.classList.contains('active')) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            }, 250);
        });
    }

    /**
     * Highlight the current page in navigation
     */
    function highlightCurrentPage(currentPage) {
        const navLinks = document.querySelectorAll('.nav-links a');
        const currentPathname = window.location.pathname;

        navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            if (!href) return;

            // Handle pure hash links on the home page
            if (href.startsWith('#')) {
                if (currentPage === 'home' && window.location.hash === href) {
                    link.classList.add('active');
                }
                return;
            }

            // Resolve the href to an absolute path to avoid false matches
            // e.g. ../index.html vs index.html when both filenames are index.html
            try {
                const resolved = new URL(href, window.location.href);
                // Strip trailing slash for normalised comparison
                const normalisePath = function(p) {
                    return p.replace(/\/$/, '') || '/';
                };
                if (normalisePath(resolved.pathname) === normalisePath(currentPathname)) {
                    link.classList.add('active');
                }
            } catch (e) {
                // Fallback: skip unresolvable hrefs
            }
        });
    }

    // Initialize menu when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMenu);
    } else {
        initializeMenu();
    }

    // Export for testing purposes
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { initializeMenu, getCurrentPage };
    }
})();
