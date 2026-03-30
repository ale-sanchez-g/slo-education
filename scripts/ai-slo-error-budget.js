/**
 * AI SLO & Error Budget Page - Interactive SLO Builder
 * Helps users define SLOs, error budgets, and alerting thresholds
 * for AI/ML systems.
 */

(function () {
    'use strict';

    // Per-use-case recommended defaults and context
    var USE_CASE_CONFIG = {
        chatbot: {
            label: 'Conversational Chatbot / Assistant',
            qualitySuggestion: 85,
            latencySuggestion: 2000,
            notes: 'Chatbots benefit from streaming responses to reduce perceived latency. Quality is highly subjective — use a mix of user feedback and LLM-as-judge evaluation.',
            recommendations: [
                'Enable streaming (SSE/WebSockets) to surface time-to-first-token SLI',
                'Instrument user satisfaction: thumbs-up/down on each turn',
                'Set a safety budget separately — even 0.1% harmful responses can erode trust',
                'Use 28-day rolling windows to smooth out topic-cluster variation'
            ]
        },
        recommendation: {
            label: 'Recommendation Engine',
            qualitySuggestion: 90,
            latencySuggestion: 200,
            notes: 'Recommendation engines are latency-sensitive and quality can be measured objectively via click-through rate (CTR) or downstream conversion events.',
            recommendations: [
                'Use CTR or purchase conversion as your quality SLI proxy',
                'Alert on sudden drops in recommendation diversity (sign of model staleness)',
                'Maintain a holdout A/B group to detect drift without full rollback',
                'Set separate freshness SLO: catalogue changes should appear in recs within 1 hour'
            ]
        },
        'content-generation': {
            label: 'Content Generation',
            qualitySuggestion: 80,
            latencySuggestion: 5000,
            notes: 'Content generation tasks (text, code, images) have high latency and highly subjective quality. Focus on output completeness and safety over strict quality scoring.',
            recommendations: [
                'Define a "completion rate" SLI: did the model produce a full, usable output?',
                'Track revision/regeneration rate as a quality proxy (users asking for rewrites)',
                'Set aggressive safety SLOs — generated content reaches end users directly',
                'Consider cost-per-completion as an SLI for budget management'
            ]
        },
        search: {
            label: 'AI-Powered Search / RAG',
            qualitySuggestion: 88,
            latencySuggestion: 1000,
            notes: 'RAG systems have two failure modes: retrieval failures (wrong context) and generation failures (bad synthesis). Track them independently.',
            recommendations: [
                'Track retrieval precision@k as a separate SLI from generation quality',
                'Set a freshness SLO on your vector index (e.g., documents indexed within 1 hour)',
                'Alert on context hit rate drop — indicates retrieval system degradation',
                'Monitor hallucination rate: are answers grounded in retrieved context?'
            ]
        },
        classification: {
            label: 'Classification / Tagging',
            qualitySuggestion: 95,
            latencySuggestion: 300,
            notes: 'Classification tasks are more deterministic and allow objective measurement. Higher quality targets are achievable. Focus on precision vs. recall trade-offs.',
            recommendations: [
                'Track precision and recall separately — your SLO should reflect business priority',
                'Use a curated gold-standard test set for continuous offline evaluation',
                'Alert on class distribution drift in predictions (sign of model staleness)',
                'Set a confidence-score threshold SLI: only count predictions above 0.8 confidence'
            ]
        },
        summarisation: {
            label: 'Summarisation',
            qualitySuggestion: 82,
            latencySuggestion: 3000,
            notes: 'Summarisation quality is measured by coverage (did it capture key points?) and conciseness. ROUGE scores provide an automated proxy.',
            recommendations: [
                'Use ROUGE-L or BERTScore as automated quality proxy metrics',
                'Track summary length ratio — extreme compression or expansion indicates drift',
                'Alert when "user expanded full article" rate increases (proxy for bad summaries)',
                'Instrument hallucination: are facts in the summary supported by the source?'
            ]
        },
        translation: {
            label: 'Translation',
            qualitySuggestion: 92,
            latencySuggestion: 1500,
            notes: 'Translation quality can be measured objectively with BLEU scores and human post-edit distance. Higher quality targets are achievable compared to open-ended generation.',
            recommendations: [
                'Track BLEU score against a reference translation set for continuous monitoring',
                'Alert on post-edit distance increase (human editors making more corrections)',
                'Set language-pair-specific SLOs — performance varies significantly across pairs',
                'Monitor for language detection failures as a separate availability SLI'
            ]
        }
    };

    /**
     * Calculate error budget values from an SLO target percentage.
     * windowDays: measurement window in days.
     */
    function calcErrorBudget(sloTarget, windowDays) {
        var errorRate = (100 - sloTarget) / 100;
        var totalMinutes = windowDays * 24 * 60;
        var budgetMinutes = errorRate * totalMinutes;
        var budgetRequests = Math.round(errorRate * 10000); // per 10,000 requests
        return {
            errorRate: errorRate,
            errorPercent: (100 - sloTarget).toFixed(2),
            budgetMinutes: budgetMinutes.toFixed(0),
            budgetRequests: budgetRequests
        };
    }

    /**
     * Render the SLO result into the DOM.
     */
    function renderSLOResult(config) {
        var useCaseData = USE_CASE_CONFIG[config.useCase] || {};
        var qualityBudget = calcErrorBudget(config.qualityTarget, config.windowDays);

        // ── SLO Summary ──────────────────────────────────────────────────────
        var summaryHtml = [
            '<h5>SLO Definitions</h5>',
            '<div class="slo-definition-item">',
            '  <span class="slo-def-label">Use Case</span>',
            '  <span class="slo-def-value">' + (useCaseData.label || config.useCase) + '</span>',
            '</div>',
            '<div class="slo-definition-item">',
            '  <span class="slo-def-label">Quality SLO</span>',
            '  <span class="slo-def-value">' + config.qualityTarget + '% of responses meet quality bar</span>',
            '</div>',
            '<div class="slo-definition-item">',
            '  <span class="slo-def-label">Latency SLO</span>',
            '  <span class="slo-def-value">' + config.latencyPercentile + ' &lt; ' + config.latencyTarget + 'ms</span>',
            '</div>',
            '<div class="slo-definition-item">',
            '  <span class="slo-def-label">Measurement Window</span>',
            '  <span class="slo-def-value">' + config.windowDays + '-day rolling window</span>',
            '</div>',
            config.safetyRequired ? [
                '<div class="slo-definition-item">',
                '  <span class="slo-def-label">Safety SLO</span>',
                '  <span class="slo-def-value">&lt; 0.1% policy violation rate</span>',
                '</div>'
            ].join('') : ''
        ].join('');

        document.getElementById('slo-summary').innerHTML = summaryHtml;

        // ── Error Budget Cards ───────────────────────────────────────────────
        var budgetsHtml = [
            '<div class="budget-card">',
            '  <div class="budget-card-title">Quality Error Budget</div>',
            '  <div class="budget-card-value">' + qualityBudget.errorPercent + '%</div>',
            '  <div class="budget-card-unit">of responses can be below quality bar</div>',
            '</div>',
            '<div class="budget-card">',
            '  <div class="budget-card-title">Budget in Minutes</div>',
            '  <div class="budget-card-value">' + Number(qualityBudget.budgetMinutes).toLocaleString() + '</div>',
            '  <div class="budget-card-unit">minutes of quality failure per ' + config.windowDays + ' days</div>',
            '</div>',
            '<div class="budget-card">',
            '  <div class="budget-card-title">Per 10k Requests</div>',
            '  <div class="budget-card-value">' + qualityBudget.budgetRequests.toLocaleString() + '</div>',
            '  <div class="budget-card-unit">requests allowed below quality bar</div>',
            '</div>'
        ].join('');

        document.getElementById('slo-error-budgets').innerHTML = budgetsHtml;

        // ── Alerting Thresholds ──────────────────────────────────────────────
        var fastBurnThreshold = (100 - config.qualityTarget) * 14.4;
        var slowBurnThreshold = (100 - config.qualityTarget) * 3;

        var alertingHtml = [
            '<h5>Recommended Alerting Thresholds</h5>',
            '<div class="alert-threshold-item">',
            '  <div class="alert-dot critical"></div>',
            '  <div class="alert-threshold-text"><strong>P0 – Page immediately</strong> if quality error rate exceeds ',
            fastBurnThreshold.toFixed(2) + '% over 1 hour (14.4× burn rate, exhausts budget in 2 days)</div>',
            '</div>',
            '<div class="alert-threshold-item">',
            '  <div class="alert-dot warning"></div>',
            '  <div class="alert-threshold-text"><strong>P1 – Page now</strong> if quality error rate exceeds ',
            (fastBurnThreshold / 2.4).toFixed(2) + '% over 6 hours (6× burn rate, exhausts budget in ~5 days)</div>',
            '</div>',
            '<div class="alert-threshold-item">',
            '  <div class="alert-dot warning"></div>',
            '  <div class="alert-threshold-text"><strong>P2 – Ticket</strong> if 7-day rolling quality score drops below ',
            (config.qualityTarget - 3).toFixed(1) + '% (approaching SLO boundary)</div>',
            '</div>',
            '<div class="alert-threshold-item">',
            '  <div class="alert-dot info"></div>',
            '  <div class="alert-threshold-text"><strong>Latency Alert</strong> if ' + config.latencyPercentile + ' exceeds ' + Math.round(config.latencyTarget * 1.5) + 'ms (1.5× target) for 10 consecutive minutes</div>',
            '</div>',
            config.safetyRequired ? [
                '<div class="alert-threshold-item">',
                '  <div class="alert-dot critical"></div>',
                '  <div class="alert-threshold-text"><strong>Safety – Page immediately</strong> if policy violation rate exceeds 0.1% in any 5-minute window</div>',
                '</div>'
            ].join('') : ''
        ].join('');

        document.getElementById('slo-alerting').innerHTML = alertingHtml;

        // ── Recommendations ──────────────────────────────────────────────────
        var recs = (useCaseData.recommendations || [
            'Establish a curated evaluation set and run it on every model deployment',
            'Use proxy metrics (user feedback, task completion) for continuous quality monitoring',
            'Track error budget burn rate daily to catch gradual degradation early',
            'Gate model updates on offline eval results before production deployment'
        ]).map(function (r) { return '<li>' + r + '</li>'; }).join('');

        var noteHtml = useCaseData.notes
            ? '<p style="margin-bottom:0.75rem; color:#555; font-size:0.9rem;">' + useCaseData.notes + '</p>'
            : '';

        document.getElementById('slo-recommendations').innerHTML = [
            '<h5>Recommendations for ' + (useCaseData.label || config.useCase) + '</h5>',
            noteHtml,
            '<ul>' + recs + '</ul>'
        ].join('');

        // Show the result panel
        var resultEl = document.getElementById('slo-result');
        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Validate inputs and trigger SLO generation.
     */
    function handleBuildSLO() {
        var useCase = document.getElementById('ai-use-case').value;
        var qualityStr = document.getElementById('quality-target').value;
        var latencyStr = document.getElementById('latency-target').value;
        var latencyPercentile = document.getElementById('latency-percentile').value;
        var safetyRequired = document.getElementById('safety-required').value === 'yes';
        var windowDays = parseInt(document.getElementById('window-days').value, 10);

        if (!useCase) {
            alert('Please select an AI use case.');
            return;
        }

        var qualityTarget = parseFloat(qualityStr);
        if (!qualityStr || isNaN(qualityTarget) || qualityTarget < 50 || qualityTarget > 99.9) {
            alert('Please enter a quality SLO target between 50 and 99.9.');
            return;
        }

        var latencyTarget = parseInt(latencyStr, 10);
        if (!latencyStr || isNaN(latencyTarget) || latencyTarget < 100 || latencyTarget > 30000) {
            alert('Please enter a latency target between 100ms and 30,000ms.');
            return;
        }

        renderSLOResult({
            useCase: useCase,
            qualityTarget: qualityTarget,
            latencyTarget: latencyTarget,
            latencyPercentile: latencyPercentile,
            safetyRequired: safetyRequired,
            windowDays: windowDays
        });
    }

    /**
     * Pre-fill inputs when a use case is selected.
     */
    function handleUseCaseChange() {
        var useCase = document.getElementById('ai-use-case').value;
        if (!useCase) return;

        var config = USE_CASE_CONFIG[useCase];
        if (!config) return;

        var qualityEl = document.getElementById('quality-target');
        var latencyEl = document.getElementById('latency-target');

        if (!qualityEl.value) {
            qualityEl.value = config.qualitySuggestion;
        }
        if (!latencyEl.value) {
            latencyEl.value = config.latencySuggestion;
        }
    }

    /**
     * Wire up event listeners once the DOM is ready.
     */
    function init() {
        var buildBtn = document.getElementById('build-slo');
        if (buildBtn) {
            buildBtn.addEventListener('click', handleBuildSLO);
        }

        var useCaseSelect = document.getElementById('ai-use-case');
        if (useCaseSelect) {
            useCaseSelect.addEventListener('change', handleUseCaseChange);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { calcErrorBudget, renderSLOResult, handleBuildSLO };
    }
})();
