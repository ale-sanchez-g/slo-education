/**
 * CUJ → SLI → SLO → Error Budget — Interactive Demo
 * Airport-themed reliability pipeline simulator
 */
(function () {
    'use strict';

    var JOURNEYS = {
        booking: {
            name: 'Flight Booking',
            description: 'Passengers searching and booking flights online. Every failed booking is a lost customer and direct revenue impact.',
            sli: {
                name: 'Booking Success Rate',
                description: 'The percentage of booking requests that complete successfully without errors or timeouts.',
                formula: 'successful_bookings / total_booking_attempts × 100',
                value: 99.2
            },
            slo: {
                target: 99.5,
                window: '30 days',
                budgetHours: 3.65
            }
        },
        checkin: {
            name: 'Airport Check-in',
            description: 'Passengers checking in online or at self-service kiosks. Failures create long queues and missed flights.',
            sli: {
                name: 'Check-in Completion Rate',
                description: 'The percentage of check-in attempts that complete successfully without timeout or error.',
                formula: 'successful_checkins / total_checkin_attempts × 100',
                value: 99.85
            },
            slo: {
                target: 99.9,
                window: '30 days',
                budgetHours: 0.73
            }
        },
        operations: {
            name: 'Flight Operations',
            description: 'Real-time flight status and gate information for passengers and crews. Stale data causes missed gates and disrupted operations.',
            sli: {
                name: 'Real-time Update Delivery Rate',
                description: 'The percentage of flight status updates delivered to users within 30 seconds of the event.',
                formula: 'updates_delivered_within_30s / total_updates × 100',
                value: 99.97
            },
            slo: {
                target: 99.95,
                window: '30 days',
                budgetHours: 0.365
            }
        }
    };

    // Track remaining budget per journey (resets when switching)
    var budgetRemaining = {};
    Object.keys(JOURNEYS).forEach(function (key) {
        budgetRemaining[key] = JOURNEYS[key].slo.budgetHours;
    });

    var currentJourney = null;

    function formatHours(hours) {
        if (hours >= 1) {
            return hours.toFixed(2) + 'h';
        }
        return (hours * 60).toFixed(1) + ' min';
    }

    function getBudgetPercentage(journeyKey) {
        var total = JOURNEYS[journeyKey].slo.budgetHours;
        return (budgetRemaining[journeyKey] / total) * 100;
    }

    function getDecision(percentage) {
        if (percentage > 70) {
            return { status: 'healthy', text: 'Budget healthy — deploy freely and experiment with confidence.' };
        }
        if (percentage > 30) {
            return { status: 'caution', text: 'Budget shrinking — be thoughtful about risky deployments and monitor closely.' };
        }
        if (percentage > 0) {
            return { status: 'critical', text: 'Budget nearly exhausted — freeze risky deployments, focus on reliability improvements.' };
        }
        return { status: 'exhausted', text: 'Budget exhausted — stop all non-essential work, focus on SLO recovery and conduct a post-incident review.' };
    }

    function updateSLISection(journey) {
        var nameEl = document.getElementById('sli-name');
        var descEl = document.getElementById('sli-description');
        var formulaEl = document.getElementById('sli-formula');
        var barEl = document.getElementById('sli-bar');
        var valueEl = document.getElementById('sli-value');
        var barWrapper = document.querySelector('#step-sli .sli-bar-wrapper');

        if (!nameEl) return;

        nameEl.textContent = journey.sli.name;
        descEl.textContent = journey.sli.description;
        formulaEl.textContent = journey.sli.formula;
        barEl.style.width = journey.sli.value + '%';
        valueEl.textContent = journey.sli.value + '%';

        if (barWrapper) {
            barWrapper.setAttribute('aria-valuenow', Math.round(journey.sli.value));
        }

        var isHealthy = journey.sli.value >= journey.slo.target;
        barEl.className = 'sli-bar ' + (isHealthy ? 'sli-healthy' : 'sli-critical');
    }

    function updateSLOSection(journey) {
        var badgeEl = document.getElementById('slo-target-badge');
        var statusEl = document.getElementById('slo-status');
        var explanationEl = document.getElementById('slo-explanation');
        var budgetPreviewEl = document.getElementById('slo-budget-preview');

        if (!badgeEl) return;

        badgeEl.textContent = journey.slo.target + '%';

        var isMet = journey.sli.value >= journey.slo.target;
        statusEl.textContent = isMet ? '\u2705 SLO Met' : '\u274C SLO Breached';
        statusEl.className = 'slo-status ' + (isMet ? 'slo-met' : 'slo-breached');

        explanationEl.textContent = 'Target: ' + journey.slo.target + '% success rate over ' + journey.slo.window;
        budgetPreviewEl.textContent = 'Total error budget: ' + formatHours(journey.slo.budgetHours) + '/month';
    }

    function updateBudgetSection(journeyKey) {
        var journey = JOURNEYS[journeyKey];
        var remaining = budgetRemaining[journeyKey];
        var percentage = getBudgetPercentage(journeyKey);

        var barEl = document.getElementById('budget-bar');
        var percentageEl = document.getElementById('budget-percentage');
        var hoursEl = document.getElementById('budget-hours');
        var decisionEl = document.getElementById('decision-text');
        var decisionBox = document.getElementById('budget-decision');
        var barWrapper = document.querySelector('#step-budget .budget-bar-wrapper');
        var simulateBtn = document.getElementById('simulate-incident');
        var resetBtn = document.getElementById('reset-budget');

        if (!barEl) return;

        var clampedPct = Math.max(0, percentage);
        barEl.style.width = clampedPct + '%';
        percentageEl.textContent = clampedPct.toFixed(1) + '%';
        hoursEl.textContent = formatHours(Math.max(0, remaining)) + ' remaining of ' + formatHours(journey.slo.budgetHours);

        if (barWrapper) {
            barWrapper.setAttribute('aria-valuenow', Math.round(clampedPct));
        }

        // Color the bar
        barEl.className = 'budget-bar';
        if (clampedPct === 0) {
            barEl.classList.add('budget-exhausted');
        } else if (percentage <= 30) {
            barEl.classList.add('budget-critical');
        } else if (percentage <= 70) {
            barEl.classList.add('budget-caution');
        } else {
            barEl.classList.add('budget-healthy');
        }

        var decision = getDecision(percentage);
        decisionEl.textContent = decision.text;
        decisionBox.className = 'budget-decision decision-' + decision.status;

        // Enable/disable buttons
        if (simulateBtn) {
            simulateBtn.disabled = remaining <= 0;
        }
        if (resetBtn) {
            resetBtn.disabled = false;
        }
    }

    function selectJourney(journeyKey) {
        if (!JOURNEYS[journeyKey]) return;
        currentJourney = journeyKey;
        var journey = JOURNEYS[journeyKey];

        // Update card states
        document.querySelectorAll('.journey-card').forEach(function (card) {
            var isActive = card.getAttribute('data-journey') === journeyKey;
            card.classList.toggle('active', isActive);
            card.setAttribute('aria-pressed', isActive.toString());
        });

        // Update journey description
        var descEl = document.getElementById('journey-desc');
        if (descEl) {
            descEl.textContent = journey.description;
        }

        updateSLISection(journey);
        updateSLOSection(journey);
        updateBudgetSection(journeyKey);
    }

    function simulateIncident() {
        if (!currentJourney) return;
        var journey = JOURNEYS[currentJourney];
        // Each incident spends 15% of the total monthly budget
        var spend = journey.slo.budgetHours * 0.15;
        budgetRemaining[currentJourney] = Math.max(0, budgetRemaining[currentJourney] - spend);
        updateBudgetSection(currentJourney);
    }

    function resetBudget() {
        if (!currentJourney) return;
        budgetRemaining[currentJourney] = JOURNEYS[currentJourney].slo.budgetHours;
        updateBudgetSection(currentJourney);
    }

    function init() {
        // Journey card click handlers
        document.querySelectorAll('.journey-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var journeyKey = card.getAttribute('data-journey');
                selectJourney(journeyKey);
            });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });

        // Simulate incident button
        var simulateBtn = document.getElementById('simulate-incident');
        if (simulateBtn) {
            simulateBtn.addEventListener('click', simulateIncident);
        }

        // Reset budget button
        var resetBtn = document.getElementById('reset-budget');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetBudget);
        }

        // Auto-select the first journey on load
        selectJourney('booking');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
