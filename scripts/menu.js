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
                { text: 'About', href: '#about' },
                { text: 'What are SLOs?', href: '#what-are-slos' },
                { text: 'Calculator', href: 'error-budget-calculator.html' },
                { text: 'Incident Management', href: 'incident-management.html' },
                { text: 'Privacy', href: 'privacy-policy.html' }
            ]
        },
        other: {
            links: [
                { text: 'Home', href: 'index.html' },
                { text: 'About', href: 'index.html#about' },
                { text: 'What are SLOs?', href: 'index.html#what-are-slos' },
                { text: 'Calculator', href: 'error-budget-calculator.html' },
                { text: 'Incident Management', href: 'incident-management.html' },
                { text: 'Privacy', href: 'privacy-policy.html' }
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
        
        // Create and insert hamburger button
        createHamburgerButton(navbar);
        
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
        if (path.includes('incident-management')) return 'incident-management';
        return 'home';
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
        const currentFilename = currentPathname.split('/').pop() || 'index.html';
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (!href) return;
            
            // Extract filename from href
            const hrefFilename = href.split('/').pop().split('#')[0];
            
            // Check if link matches current page
            if (currentPage === 'home' && href.startsWith('#')) {
                // On home page, highlight internal links
                if (window.location.hash === href) {
                    link.classList.add('active');
                }
            } else if (hrefFilename && hrefFilename === currentFilename) {
                // Exact filename match
                link.classList.add('active');
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
