// Error budgets are calculated over a rolling 30-day window
// Formula: Budget Minutes = (Error Rate / 100) × (30 × 24 × 60)
const WINDOW_DAYS = 30;

// Calculate SLO metrics dynamically from a percentage value
function calculateSLOData(percentage) {
    const errorRate = 100 - percentage;
    const minutesPerWindow = (errorRate / 100) * (WINDOW_DAYS * 24 * 60);
    const hoursPerWindow = minutesPerWindow / 60;
    return { percentage, errorRate, minutesPerWindow, hoursPerWindow };
}

// Burn rate compares how fast the budget is being spent with the pace that
// would use exactly all of it by the end of the window: 1× ends on target.
// Formula: Burn Rate = Budget Used ÷ Window Elapsed
function calculateBurn(budgetMinutes, downtimeMinutes, daysElapsed) {
    const budgetUsed = downtimeMinutes / budgetMinutes;
    const windowElapsed = daysElapsed / WINDOW_DAYS;
    const burnRate = budgetUsed / windowElapsed;
    return { budgetUsed, windowElapsed, burnRate, exhaustionDay: WINDOW_DAYS / burnRate };
}

// Display budgets under a minute in seconds, otherwise in minutes
function formatBudget(minutes) {
    if (minutes < 1) {
        return parseFloat((minutes * 60).toPrecision(3)) + ' sec';
    }
    return parseFloat(minutes.toPrecision(3)) + ' min';
}

// Initialize calculator
document.addEventListener('DOMContentLoaded', function() {
    const sloInput = document.getElementById('slo-target');
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const downtimeMinutes = document.getElementById('downtime-minutes');
    const downtimeMinutesUnit = document.getElementById('downtime-minutes-unit');
    const downtimeHours = document.getElementById('downtime-hours');
    const failureRate = document.getElementById('failure-rate');
    const actualDowntimeInput = document.getElementById('actual-downtime');
    const daysElapsedInput = document.getElementById('days-elapsed');
    const calculateBurnBtn = document.getElementById('calculate-burn');
    const burnRateResult = document.getElementById('burn-rate-result');
    const burnRatePlaceholder = document.getElementById('burn-rate-placeholder');
    const burnRateValue = document.getElementById('burn-rate-value');
    const burnRateDetail = document.getElementById('burn-rate-detail');
    const burnRateStatus = document.getElementById('burn-rate-status');

    // Update calculator as the user types a new SLO value
    sloInput.addEventListener('input', updateCalculator);

    // Calculate burn rate when button is clicked
    calculateBurnBtn.addEventListener('click', calculateBurnRate);

    // Allow Enter key to trigger calculation from either burn rate input
    [actualDowntimeInput, daysElapsedInput].forEach(function(input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateBurnRate();
            }
        });
    });

    // Initialize with default value
    updateCalculator();

    function updateCalculator() {
        const inputVal = sloInput.value.trim();
        const percentage = parseFloat(inputVal);

        if (!inputVal || isNaN(percentage) || percentage <= 0 || percentage >= 100) {
            return;
        }

        const data = calculateSLOData(percentage);

        // Update progress bar
        progressBar.style.width = data.percentage + '%';
        progressPercentage.textContent = data.percentage + '%';

        // Update ARIA attribute for accessibility
        const progressBarWrapper = progressBar.parentElement;
        if (progressBarWrapper.hasAttribute('aria-valuenow')) {
            progressBarWrapper.setAttribute('aria-valuenow', data.percentage);
        }

        // Display downtime in seconds when less than 1 minute, otherwise in minutes
        if (data.minutesPerWindow < 1) {
            const seconds = data.minutesPerWindow * 60;
            downtimeMinutes.textContent = seconds.toFixed(1);
            downtimeMinutesUnit.textContent = 'sec / 30 days';
        } else {
            downtimeMinutes.textContent = data.minutesPerWindow.toFixed(1);
            downtimeMinutesUnit.textContent = 'min / 30 days';
        }

        downtimeHours.textContent = parseFloat(data.hoursPerWindow.toPrecision(4)).toString();
        failureRate.textContent = parseFloat(data.errorRate.toPrecision(4)).toString() + '%';

        // Hide burn rate result when SLO changes
        burnRateResult.style.display = 'none';
        if (burnRatePlaceholder) burnRatePlaceholder.style.display = 'block';
        actualDowntimeInput.value = '';
    }

    function calculateBurnRate() {
        const sloVal = parseFloat(sloInput.value.trim());
        if (!sloInput.value.trim() || isNaN(sloVal) || sloVal <= 0 || sloVal >= 100) {
            alert('Please enter a valid SLO target between 0 and 100 (e.g. 99.9)');
            return;
        }

        const data = calculateSLOData(sloVal);
        const actualDowntime = parseFloat(actualDowntimeInput.value);
        const daysElapsed = parseFloat(daysElapsedInput.value);

        if (!actualDowntimeInput.value.trim() || isNaN(actualDowntime) || actualDowntime < 0) {
            alert('Please enter a valid downtime value (0 or greater)');
            return;
        }

        if (!daysElapsedInput.value.trim() || isNaN(daysElapsed) || daysElapsed <= 0 || daysElapsed > WINDOW_DAYS) {
            alert('Please enter the days elapsed in the window (more than 0, up to ' + WINDOW_DAYS + ')');
            return;
        }

        const burn = calculateBurn(data.minutesPerWindow, actualDowntime, daysElapsed);

        // Update display
        burnRateValue.textContent = burn.burnRate.toFixed(burn.burnRate < 10 ? 2 : 0) + '×';
        burnRateDetail.textContent = (burn.budgetUsed * 100).toFixed(1) + '% of the ' +
            formatBudget(data.minutesPerWindow) + ' budget used, ' +
            (burn.windowElapsed * 100).toFixed(1) + '% of the window elapsed';

        // Determine status and styling
        const runsOutBy = 'At this pace the budget runs out around day ' + Math.round(burn.exhaustionDay) + '.';
        let statusText = '';
        let statusClass = '';

        if (burn.budgetUsed >= 1) {
            statusText = '🚨 Budget Exhausted - The SLO is missed for this window. Restrict or stop releases until the service is back within its SLO.';
            statusClass = 'critical';
            burnRateValue.style.color = 'var(--color-risk)';
        } else if (burn.burnRate >= 2) {
            statusText = '🔴 Fast Burn - ' + runsOutBy + ' Alert-worthy: slow risky releases and find the cause.';
            statusClass = 'fast';
            burnRateValue.style.color = 'var(--color-risk)';
        } else if (burn.burnRate > 1) {
            statusText = '⚠️ Above Pace - ' + runsOutBy + ' Find out what is consuming it.';
            statusClass = 'medium';
            burnRateValue.style.color = 'var(--color-caution)';
        } else {
            statusText = '✅ On Pace - The budget lasts the window. Spend it on releases and experiments.';
            statusClass = 'slow';
            burnRateValue.style.color = 'var(--color-success)';
        }

        burnRateStatus.textContent = statusText;
        burnRateStatus.className = 'burn-rate-status ' + statusClass;

        // Show result, hide placeholder
        burnRateResult.style.display = 'block';
        if (burnRatePlaceholder) burnRatePlaceholder.style.display = 'none';

        // Smooth scroll to result
        burnRateResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
