// Calculate SLO metrics dynamically from a percentage value
// Formula: Minutes Per Month = (Error Rate / 100) × (365 × 24 × 60) / 12
function calculateSLOData(percentage) {
    const errorRate = 100 - percentage;
    const minutesPerMonth = (errorRate / 100) * (365 * 24 * 60 / 12);
    const hoursPerMonth = minutesPerMonth / 60;
    return { percentage, errorRate, minutesPerMonth, hoursPerMonth };
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
    const calculateBurnBtn = document.getElementById('calculate-burn');
    const burnRateResult = document.getElementById('burn-rate-result');
    const burnRatePlaceholder = document.getElementById('burn-rate-placeholder');
    const burnRateValue = document.getElementById('burn-rate-value');
    const burnRateStatus = document.getElementById('burn-rate-status');

    // Update calculator as the user types a new SLO value
    sloInput.addEventListener('input', updateCalculator);

    // Calculate burn rate when button is clicked
    calculateBurnBtn.addEventListener('click', calculateBurnRate);

    // Allow Enter key to trigger calculation
    actualDowntimeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateBurnRate();
        }
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
        if (data.minutesPerMonth < 1) {
            const seconds = data.minutesPerMonth * 60;
            downtimeMinutes.textContent = seconds.toFixed(1);
            downtimeMinutesUnit.textContent = 'sec / mo';
        } else {
            downtimeMinutes.textContent = data.minutesPerMonth.toFixed(1);
            downtimeMinutesUnit.textContent = 'min / mo';
        }

        downtimeHours.textContent = data.hoursPerMonth.toFixed(4).replace(/\.?0+$/, '') || '0';
        failureRate.textContent = parseFloat(data.errorRate.toPrecision(6)) + '%';

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

        if (!actualDowntimeInput.value.trim() || isNaN(actualDowntime) || actualDowntime < 0) {
            alert('Please enter a valid downtime value (0 or greater)');
            return;
        }

        // Calculate burn rate
        const burnRate = (actualDowntime / data.minutesPerMonth) * 100;

        // Update display
        burnRateValue.textContent = burnRate.toFixed(1) + '%';

        // Determine status and styling
        let statusText = '';
        let statusClass = '';

        if (burnRate < 2) {
            statusText = '✅ Slow Burn (Healthy) - Safe to deploy and experiment';
            statusClass = 'slow';
            burnRateValue.style.color = '#28a745';
        } else if (burnRate >= 2 && burnRate < 5) {
            statusText = '⚠️ Medium Burn (Caution) - Be thoughtful about deployments';
            statusClass = 'medium';
            burnRateValue.style.color = '#ffc107';
        } else if (burnRate >= 5 && burnRate < 10) {
            statusText = '🔴 Fast Burn (Alert) - Minimize risky changes';
            statusClass = 'fast';
            burnRateValue.style.color = '#fd7e14';
        } else {
            statusText = '🚨 Critical Burn (Emergency) - Focus on stability only';
            statusClass = 'critical';
            burnRateValue.style.color = '#dc3545';
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
