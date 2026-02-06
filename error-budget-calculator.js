// SLO data with downtime calculations
// Using formula: Minutes Per Month = (Error Rate / 100) × (365 × 24 × 60) / 12
const sloData = {
    99: {
        percentage: 99,
        errorRate: 1.0,
        minutesPerMonth: 438.0,
        hoursPerMonth: 7.3
    },
    99.5: {
        percentage: 99.5,
        errorRate: 0.5,
        minutesPerMonth: 219.0,
        hoursPerMonth: 3.65
    },
    99.9: {
        percentage: 99.9,
        errorRate: 0.1,
        minutesPerMonth: 43.8,
        hoursPerMonth: 0.73
    },
    99.95: {
        percentage: 99.95,
        errorRate: 0.05,
        minutesPerMonth: 21.9,
        hoursPerMonth: 0.365
    },
    99.99: {
        percentage: 99.99,
        errorRate: 0.01,
        minutesPerMonth: 4.38,
        hoursPerMonth: 0.073
    }
};

// Initialize calculator
document.addEventListener('DOMContentLoaded', function() {
    const sloSelect = document.getElementById('slo-target');
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const downtimeMinutes = document.getElementById('downtime-minutes');
    const downtimeHours = document.getElementById('downtime-hours');
    const failureRate = document.getElementById('failure-rate');
    const actualDowntimeInput = document.getElementById('actual-downtime');
    const calculateBurnBtn = document.getElementById('calculate-burn');
    const burnRateResult = document.getElementById('burn-rate-result');
    const burnRateValue = document.getElementById('burn-rate-value');
    const burnRateStatus = document.getElementById('burn-rate-status');

    // Update calculator when SLO changes
    sloSelect.addEventListener('change', updateCalculator);

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
        const selectedSLO = parseFloat(sloSelect.value);
        const data = sloData[selectedSLO];

        // Update progress bar
        progressBar.style.width = data.percentage + '%';
        progressPercentage.textContent = data.percentage + '%';
        
        // Update ARIA attribute for accessibility
        const progressBarWrapper = progressBar.parentElement;
        if (progressBarWrapper.hasAttribute('aria-valuenow')) {
            progressBarWrapper.setAttribute('aria-valuenow', data.percentage);
        }

        // Update metrics
        downtimeMinutes.textContent = data.minutesPerMonth.toFixed(1);
        downtimeHours.textContent = data.hoursPerMonth.toFixed(2);
        failureRate.textContent = data.errorRate + '%';

        // Hide burn rate result when SLO changes
        burnRateResult.style.display = 'none';
        actualDowntimeInput.value = '';
    }

    function calculateBurnRate() {
        const selectedSLO = parseFloat(sloSelect.value);
        const data = sloData[selectedSLO];
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

        // Show result
        burnRateResult.style.display = 'block';

        // Smooth scroll to result
        burnRateResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
