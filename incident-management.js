// Incident Management Interactive Components

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive components
    initSeverityCalculator();
    initToolFilters();
    initCUJMapper();
});

// Severity Calculator
function initSeverityCalculator() {
    const userImpactSelect = document.getElementById('user-impact');
    const serviceStateSelect = document.getElementById('service-state');
    const businessImpactSelect = document.getElementById('business-impact');
    const calculateBtn = document.getElementById('calculate-severity');
    const resultDiv = document.getElementById('severity-result');
    const severityBadge = document.getElementById('severity-badge');
    const severityTitle = document.getElementById('severity-title');
    const severityDescription = document.getElementById('severity-description');
    const severityActionsList = document.getElementById('severity-actions-list');

    calculateBtn.addEventListener('click', calculateSeverity);

    function calculateSeverity() {
        const userImpact = userImpactSelect.value;
        const serviceState = serviceStateSelect.value;
        const businessImpact = businessImpactSelect.value;

        // Validate all fields are selected
        if (!userImpact || !serviceState || !businessImpact) {
            alert('Please select all three criteria to calculate severity');
            return;
        }

        // Calculate severity based on inputs
        const severity = determineSeverity(userImpact, serviceState, businessImpact);

        // Display result
        displaySeverityResult(severity);

        // Show result div with animation
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function determineSeverity(userImpact, serviceState, businessImpact) {
        // Scoring system: lower score = higher severity
        let score = 0;

        // User Impact scoring (0-3)
        switch(userImpact) {
            case 'all': score += 0; break;
            case 'major': score += 1; break;
            case 'minor': score += 2; break;
            case 'single': score += 3; break;
        }

        // Service State scoring (0-3)
        switch(serviceState) {
            case 'down': score += 0; break;
            case 'degraded': score += 1; break;
            case 'partial': score += 2; break;
            case 'minor': score += 3; break;
        }

        // Business Impact scoring (0-3)
        switch(businessImpact) {
            case 'critical': score += 0; break;
            case 'high': score += 1; break;
            case 'medium': score += 2; break;
            case 'low': score += 3; break;
        }

        // Determine severity level based on total score
        // Score range: 0-9 (lower = more severe)
        if (score <= 2) {
            return 'P0';
        } else if (score <= 4) {
            return 'P1';
        } else if (score <= 6) {
            return 'P2';
        } else {
            return 'P3';
        }
    }

    function displaySeverityResult(severity) {
        // Update badge
        severityBadge.textContent = severity;
        severityBadge.className = 'severity-badge-large ' + severity.toLowerCase();

        // Define severity details
        const severityData = {
            'P0': {
                title: 'Critical Incident (P0)',
                description: 'This is a critical incident requiring immediate 24/7 response. All or most users are affected, and core functionality is unavailable. This has severe business impact.',
                actions: [
                    'Immediately page on-call engineer and incident commander',
                    'Establish war room / incident channel',
                    'Begin customer communications (status page update)',
                    'Escalate to executive team',
                    'Focus entirely on mitigation - stop all other work',
                    'Post detailed updates every 15-30 minutes',
                    'Mandatory post-mortem within 48 hours of resolution'
                ]
            },
            'P1': {
                title: 'High Severity Incident (P1)',
                description: 'This is a high severity incident affecting a significant portion of users. Critical features are impaired. Response required within 1 hour.',
                actions: [
                    'Page on-call engineer',
                    'Create incident channel and assemble response team',
                    'Update status page with incident notice',
                    'Notify customer success/support teams',
                    'Prioritize mitigation over root cause analysis',
                    'Provide updates every 30-60 minutes',
                    'Conduct post-mortem within 1 week'
                ]
            },
            'P2': {
                title: 'Medium Severity Incident (P2)',
                description: 'This is a medium severity incident with limited user impact. Some users are affected, but workarounds may exist. Response required within 4 hours.',
                actions: [
                    'Notify on-call engineer via standard alerting',
                    'Create tracking ticket/incident record',
                    'Assess if workaround can be communicated to affected users',
                    'Update internal status page if available',
                    'Address during business hours with normal priority',
                    'Update stakeholders at key milestones',
                    'Brief incident report recommended'
                ]
            },
            'P3': {
                title: 'Low Severity Incident (P3)',
                description: 'This is a low severity incident with minimal user impact. Issues are cosmetic or affect very few users. Can be addressed in normal workflow.',
                actions: [
                    'Log issue in tracking system',
                    'Assign to appropriate team queue',
                    'Address within 24 hours or next business day',
                    'No urgent customer communication needed',
                    'Fix as part of normal development cycle',
                    'Document resolution in ticket'
                ]
            }
        };

        const data = severityData[severity];
        severityTitle.textContent = data.title;
        severityDescription.textContent = data.description;

        // Populate actions list
        severityActionsList.innerHTML = '';
        data.actions.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action;
            severityActionsList.appendChild(li);
        });
    }
}

// Tool Comparison Table Filters
function initToolFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tableRows = document.querySelectorAll('.tools-table tbody tr');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter table rows
            tableRows.forEach(row => {
                if (filter === 'all') {
                    row.classList.remove('hidden');
                } else {
                    const rowFeatures = row.getAttribute('data-features');
                    if (rowFeatures && rowFeatures.includes(filter)) {
                        row.classList.remove('hidden');
                    } else {
                        row.classList.add('hidden');
                    }
                }
            });
        });
    });
}

// CUJ Mapper Tool
function initCUJMapper() {
    const affectedServiceInput = document.getElementById('affected-service');
    const cujCheckboxes = document.querySelectorAll('.cuj-checkbox');
    const impactPercentageInput = document.getElementById('impact-percentage');
    const mapCujBtn = document.getElementById('map-cuj');
    const cujResultDiv = document.getElementById('cuj-result');
    const cujSummaryDiv = document.getElementById('cuj-summary');
    const cujRecommendationsDiv = document.getElementById('cuj-recommendations');

    mapCujBtn.addEventListener('click', generateCUJReport);

    function generateCUJReport() {
        const affectedService = affectedServiceInput.value.trim();
        const impactPercentage = parseInt(impactPercentageInput.value);

        // Get selected CUJs
        const selectedCUJs = [];
        cujCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedCUJs.push({
                    id: checkbox.getAttribute('data-cuj'),
                    label: checkbox.parentElement.textContent.trim()
                });
            }
        });

        // Validate inputs
        if (!affectedService) {
            alert('Please enter the affected service or component');
            return;
        }

        if (selectedCUJs.length === 0) {
            alert('Please select at least one affected Critical User Journey');
            return;
        }

        if (!impactPercentage || impactPercentage < 0 || impactPercentage > 100) {
            alert('Please enter a valid impact percentage (0-100)');
            return;
        }

        // Generate report
        displayCUJReport(affectedService, selectedCUJs, impactPercentage);

        // Show result
        cujResultDiv.style.display = 'block';
        cujResultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function displayCUJReport(service, cujs, impactPercent) {
        // Generate summary
        const cujList = cujs.map(c => c.label).join(', ');
        const severity = determineCUJSeverity(cujs.length, impactPercent);

        let summaryHTML = `
            <h5 style="color: #667eea; margin-bottom: 1rem;">Incident Impact Summary</h5>
            <p><strong>Affected Service:</strong> ${service}</p>
            <p><strong>Impacted Critical User Journeys (${cujs.length}):</strong></p>
            <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                ${cujs.map(c => `<li>${c.label}</li>`).join('')}
            </ul>
            <p><strong>User Impact:</strong> Approximately ${impactPercent}% of users affected</p>
            <p><strong>Recommended Severity:</strong> <span class="severity-badge ${severity.toLowerCase()}">${severity}</span></p>
        `;

        cujSummaryDiv.innerHTML = summaryHTML;

        // Generate recommendations
        const recommendations = generateRecommendations(cujs.length, impactPercent, severity);

        let recommendationsHTML = `
            <h5>Recommended Actions</h5>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;

        cujRecommendationsDiv.innerHTML = recommendationsHTML;
    }

    function determineCUJSeverity(cujCount, impactPercent) {
        // Critical user journeys + high user impact = higher severity
        if (cujCount >= 3 && impactPercent >= 50) {
            return 'P0';
        } else if (cujCount >= 2 && impactPercent >= 25) {
            return 'P1';
        } else if (cujCount >= 1 && impactPercent >= 10) {
            return 'P2';
        } else {
            return 'P3';
        }
    }

    function generateRecommendations(cujCount, impactPercent, severity) {
        const recommendations = [];

        // Severity-based recommendations
        if (severity === 'P0') {
            recommendations.push('Immediately activate incident response - this is a critical outage');
            recommendations.push('Page on-call team and incident commander right away');
            recommendations.push('Create public status page update within 15 minutes');
            recommendations.push('Establish war room and begin regular stakeholder updates');
        } else if (severity === 'P1') {
            recommendations.push('Escalate to on-call engineer and create incident channel');
            recommendations.push('Notify customer support team of affected journeys');
            recommendations.push('Post status page update within 30 minutes');
            recommendations.push('Begin investigation with focus on quick mitigation');
        } else if (severity === 'P2') {
            recommendations.push('Create incident ticket and notify relevant team');
            recommendations.push('Investigate affected journeys and identify workarounds');
            recommendations.push('Prepare customer communication if issue persists beyond 2 hours');
            recommendations.push('Monitor closely to ensure issue does not escalate');
        } else {
            recommendations.push('Log issue in tracking system for investigation');
            recommendations.push('Assess during business hours with normal priority');
            recommendations.push('Document affected journey for future reference');
            recommendations.push('Consider if this reveals a gap in monitoring');
        }

        // CUJ-specific recommendations
        if (cujCount >= 3) {
            recommendations.push(`Multiple critical journeys affected (${cujCount}) - prioritize service restoration over root cause`);
        }

        // Impact-specific recommendations
        if (impactPercent >= 75) {
            recommendations.push(`${impactPercent}% user impact is severe - communicate proactively with all customers`);
        } else if (impactPercent >= 25) {
            recommendations.push(`${impactPercent}% of users affected - target communication to impacted user segments`);
        }

        // Post-incident recommendation
        if (severity === 'P0' || severity === 'P1') {
            recommendations.push('Schedule blameless post-mortem within 48 hours of resolution');
        }

        return recommendations;
    }
}
