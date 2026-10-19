/**
 * Certification Module - SLO Foundation knowledge check and shareable certificate
 * Features:
 * - 20 questions drawn at random from a larger pool, with shuffled options
 * - Pass mark of 80%, unlimited retakes
 * - Certificate rendered on a canvas so it can be downloaded as a PNG
 * - Share to LinkedIn (profile + post), X, or copy the post text
 * - Runs entirely in the browser: the name and result are never sent anywhere
 */

(function () {
    'use strict';

    var SITE_URL = 'https://slo-education.com.au';
    var CERT_PAGE_URL = SITE_URL + '/certification';
    var CERT_NAME = 'SLO Foundation Certificate';
    var ISSUER = 'SLO Education Hub';
    var QUESTIONS_PER_ATTEMPT = 20;
    var PASS_MARK = 0.8;
    var STORAGE_KEY = 'slo-education-foundation-cert';

    /**
     * Sources the questions are checked against. Each question quotes the
     * passage that supports its answer, verbatim, with " … " marking a gap.
     * Blog posts, including this site's own, are opinions and never a source.
     */
    var SOURCES = {
        sreFundamentals: {
            title: 'Google Cloud: SRE fundamentals: SLIs, SLAs and SLOs',
            url: 'https://cloud.google.com/blog/products/devops-sre/sre-fundamentals-slis-slas-and-slos'
        },
        settingSlos: {
            title: 'Google Cloud: Learn how to set SLOs',
            url: 'https://cloud.google.com/blog/products/management-tools/practical-guide-to-setting-slos'
        },
        goodSlos: {
            title: 'Google Cloud: How we build good SLOs at Google',
            url: 'https://cloud.google.com/blog/products/gcp/building-good-slos-cre-life-lessons'
        },
        incidentImpact: {
            title: 'Google Cloud: Shrinking the impact of production incidents using SRE principles',
            url: 'https://cloud.google.com/blog/products/devops-sre/shrinking-the-impact-of-production-incidents-using-sre-principles-cre-life-lessons'
        },
        mitigation: {
            title: 'Google Cloud: How Google SREs use Gemini CLI to solve real-world outages',
            url: 'https://cloud.google.com/blog/topics/developers-practitioners/how-google-sres-use-gemini-cli-to-solve-real-world-outages'
        },
        mlops: {
            title: 'Google Cloud: Applying SRE principles to your MLOps pipelines',
            url: 'https://cloud.google.com/blog/products/devops-sre/applying-sre-principles-to-your-mlops-pipelines'
        },
        incidentCommander: {
            title: 'PagerDuty Incident Response: Incident Commander training',
            url: 'https://github.com/PagerDuty/incident-response-docs/blob/master/docs/training/incident_commander.md'
        },
        severityLevels: {
            title: 'PagerDuty Incident Response: Severity Levels',
            url: 'https://github.com/PagerDuty/incident-response-docs/blob/master/docs/before/severity_levels.md'
        }
    };

    function cite(ref, quote) {
        return { title: ref.title, url: ref.url, quote: quote };
    }

    /**
     * Question pool. The first option is always the correct one; options are
     * shuffled at render time. `study` points back to the page that teaches it,
     * and `source` to the public reference that confirms the answer.
     */
    var POOL = [
        {
            q: 'What does a Service Level Indicator (SLI) do?',
            options: [
                'Measures a specific aspect of service behaviour, such as request success rate',
                'Sets the contractual penalty if the service is down',
                'Lists the people who are on call this week',
                'Defines how long a post-incident review should take'
            ],
            why: 'An SLI is the measurement. The SLO is the target set against it, and a penalty belongs to an SLA.',
            study: { text: 'Introduction to SLIs and SLOs', href: '/#what-are-slos' },
            source: cite(SOURCES.sreFundamentals, 'We also have a direct measurement of a service’s behavior: the frequency of successful probes of our system. This is a Service-Level Indicator (SLI).')
        },
        {
            q: '"99.9% of requests succeed over a 30-day rolling window" is an example of which concept?',
            options: [
                'A Service Level Objective (SLO)',
                'A Service Level Indicator (SLI)',
                'A Critical User Journey (CUJ)',
                'A runbook'
            ],
            why: 'It states a target for a measure over a window, which is an SLO.',
            study: { text: 'Introduction to SLIs and SLOs', href: '/#what-are-slos' },
            source: cite(SOURCES.settingSlos, 'Service-level objectives are a target of service-level indicators during a specified time window.')
        },
        {
            q: 'Which is the correct order of the reliability pipeline?',
            options: [
                'CUJ → SLI → SLO → Error Budget',
                'SLO → CUJ → Error Budget → SLI',
                'Error Budget → SLO → SLI → CUJ',
                'SLI → Error Budget → CUJ → SLO'
            ],
            why: 'Start from what users need (CUJ), measure it (SLI), set a target (SLO), then the target creates a budget.',
            study: { text: 'CUJ → SLI → SLO → Error Budget', href: '/cuj-sli-slo-error-budget' },
            source: cite(SOURCES.settingSlos, 'Step 1: List out critical user journeys and order them by business impact … Step 2: Determine which metrics to use as SLIs to most accurately track the user experience … Step 3: Determine SLO target goals and SLO measurement period')
        },
        {
            q: 'What is a Critical User Journey (CUJ)?',
            options: [
                'A sequence of steps a user takes to accomplish a key goal',
                'A list of the servers that handle the most traffic',
                'The slowest request recorded in a month',
                'An incident that affects all users'
            ],
            why: 'CUJs describe what users must be able to do, which keeps SLIs tied to user experience.',
            study: { text: 'CUJ → SLI → SLO → Error Budget', href: '/cuj-sli-slo-error-budget' },
            source: cite(SOURCES.settingSlos, 'A critical user journey describes a set of interactions a user has with a service to achieve some end result.')
        },
        {
            q: 'Which of these is the best CUJ for a flight booking service?',
            options: [
                'User can search and book a flight',
                'User can use the app',
                'User can sort results by price',
                'The database cluster stays online'
            ],
            why: '"Use the app" is too broad, "sort by price" is too narrow, and a database is not a user goal.',
            study: { text: 'How to identify CUJs', href: '/cuj-sli-slo-error-budget' },
            source: cite(SOURCES.settingSlos, 'The first step in SLO creation is listing critical user journeys for this business. A critical user journey describes a set of interactions a user has with a service to achieve some end result.')
        },
        {
            q: 'Which principle makes a good SLI?',
            options: [
                'It measures what users experience, not just what is easy to instrument',
                'It is expressed as a raw count so it is easy to graph',
                'It is chosen by the team that is easiest to measure',
                'It never changes, even when user needs do'
            ],
            why: 'Good SLIs track the user experience. They are also ratio-based, bounded and actionable.',
            study: { text: 'Good SLI design principles', href: '/cuj-sli-slo-error-budget' },
            source: cite(SOURCES.settingSlos, 'The next step is to figure out which metrics to use as SLIs that will most accurately track the user experience.')
        },
        {
            q: 'Why are SLIs usually expressed as a ratio, such as good events divided by total events?',
            options: [
                'It keeps every SLI in the same unit and 0–100% range, so targets stay consistent and easy to understand',
                'Ratios are cheaper to store than counts',
                'Ratios can never go below the SLO',
                'Monitoring tools can only graph percentages'
            ],
            why: 'Good events divided by valid events gives a uniform percentage, so every SLO shares the same unit and range.',
            study: { text: 'Good SLI design principles', href: '/cuj-sli-slo-error-budget' },
            source: cite(SOURCES.goodSlos, 'This keeps SLOs consistent and easy to understand, because they all have the same unit and the same range.')
        },
        {
            q: 'What is an error budget?',
            options: [
                'The amount of unreliability a service can have while still meeting its SLO',
                'The money set aside to fix bugs each quarter',
                'The number of engineers assigned to incidents',
                'The maximum number of alerts a team may receive'
            ],
            why: 'The budget is the inverse of the SLO target: 100% minus the target. It answers "how much failure can we afford?"',
            study: { text: 'Error Budget Calculator', href: '/error-budget-calculator' },
            source: cite(SOURCES.goodSlos, 'the inverse of your SLO target is your error budget, and if your SLO target is 100% that means you have no error budget!')
        },
        {
            q: 'Over a 30-day window, how much downtime does a 99.9% availability SLO allow?',
            options: [
                'About 43.2 minutes',
                'About 7.2 hours',
                'About 4.3 minutes',
                'About 8.76 hours'
            ],
            why: 'The budget is the inverse of the target: 0.1% of 43,200 minutes is 43.2 minutes. 8.76 hours is the same target over a whole year.',
            study: { text: 'Error Budget Calculator', href: '/error-budget-calculator' },
            source: cite(SOURCES.goodSlos, 'the inverse of your SLO target is your error budget')
        },
        {
            q: 'Over a 30-day window, roughly how much downtime does a 99.99% SLO allow?',
            options: [
                'About 4.3 minutes',
                'About 43.2 minutes',
                'About 26 seconds',
                'About 7.2 hours'
            ],
            why: '0.01% of 43,200 minutes is 4.32 minutes. Each extra nine divides the budget by ten.',
            study: { text: 'SLO reference table', href: '/error-budget-calculator' },
            source: cite(SOURCES.goodSlos, 'the inverse of your SLO target is your error budget')
        },
        {
            q: 'What does a burn rate of 1× mean?',
            options: [
                'The error budget is being used at exactly the pace that would use all of it by the end of the window',
                '1% of the error budget has been used',
                'The service has had one incident in this window',
                'The budget has run out and releases must stop'
            ],
            why: 'Burn rate compares how fast the budget is being spent with that baseline pace. At 2× the budget is gone halfway through the window. The share of the budget used is a different number.',
            study: { text: 'Burn rate', href: '/error-budget-calculator' },
            source: cite(SOURCES.settingSlos, 'Here, we set a burn rate alert that will notify us when we burn our error budget at 2x the baseline rate, where the baseline is the error rate that, if consistent throughout the compliance period, would exactly use up the allotted error budget.')
        },
        {
            q: 'A team has nearly exhausted its error budget. What does the error budget approach recommend?',
            options: [
                'Slow risky changes and focus on stability until the budget recovers',
                'Ship faster to make up for lost time',
                'Raise the SLO target so the budget looks larger',
                'Stop measuring until next month'
            ],
            why: 'An endangered SLO is defended by releasing more slowly and putting reliability work ahead of features.',
            study: { text: 'Using error budgets for deployment decisions', href: '/error-budget-calculator' },
            source: cite(SOURCES.goodSlos, 'Your business needs to be able to defend an endangered SLO by reducing the frequency of outages, or reducing the impact of outages when they occur. Some ways to do this might include: slowing down the rate at which you release new versions, or by implementing reliability improvements instead of features.')
        },
        {
            q: 'A service with a 99.9% SLO has run at 100% for a year, and the team has never spent its error budget. What does that most likely indicate?',
            options: [
                'The team is spending more on reliability than it needs to, budget that could fund releases and experiments',
                'The SLO is set perfectly',
                'The team can safely skip incident reviews',
                'Users are noticeably happier than they would be at 99.9%'
            ],
            why: 'Above the SLO, users become increasingly indifferent to extra reliability. The unspent budget could pay for releases, experiments and stress tests.',
            study: { text: 'Best practices for error budgets', href: '/error-budget-calculator' },
            source: cite(SOURCES.incidentImpact, 'If you’re too far above your SLO, though, it indicates that you are spending more on reliability than you need to.')
        },
        {
            q: 'As Google SREs use the terms, what is the difference between MTTM and MTTR?',
            options: [
                'MTTM measures how fast user impact is stopped; MTTR (repair) measures how long the full fix takes',
                'They are two names for the same metric',
                'MTTM measures how fast a problem is detected; MTTR measures how fast someone is paged',
                'MTTR measures the time between incidents'
            ],
            why: 'Mitigation stops the pain, often before anyone knows why it broke. Repair is the full fix. MTTR is also used for "recovery" and "restore", so say which one you mean.',
            study: { text: 'Incident management', href: '/incident-management' },
            source: cite(SOURCES.mitigation, 'Unlike Mean Time to Repair (MTTR), which focuses on the full fix, MTTM is about speed: how fast can we stop the pain?')
        },
        {
            q: 'During an active incident, what should the team do first?',
            options: [
                'Restore service to users, then investigate the root cause',
                'Find the root cause before touching anything',
                'Assign blame so the right person fixes it',
                'Wait for the monthly review'
            ],
            why: 'Mitigation first: users care about service being restored, and the "why" can follow.',
            study: { text: 'Best practices for incident response', href: '/incident-management' },
            source: cite(SOURCES.mitigation, 'Our first priority isn\'t to fix the code—it\'s to mitigate the impact on users.')
        },
        {
            q: 'Which role leads an incident response and makes the decisions?',
            options: [
                'Incident Commander',
                'Communications Lead',
                'Technical Lead',
                'Product Owner'
            ],
            why: 'The Incident Commander coordinates and decides. Others drive remediation and update stakeholders.',
            study: { text: 'Establish clear roles', href: '/incident-management' },
            source: cite(SOURCES.incidentCommander, 'The Incident Commander is the decision maker during a major incident; Delegating tasks and listening to input from subject matter experts in order to bring the incident to resolution.')
        },
        {
            q: 'What is the purpose of a blameless post-mortem?',
            options: [
                'To learn how systems and processes failed, not to find who is at fault',
                'To record which engineer caused the outage',
                'To satisfy a compliance checklist and nothing more',
                'To decide who is on call next'
            ],
            why: 'Blamelessness keeps people honest about what happened, which is what makes fixes possible.',
            study: { text: 'Incident management', href: '/incident-management' },
            source: cite(SOURCES.incidentImpact, 'If a person’s actions initiated a production incident, or worsened an existing one, we should not blame the person. Rather we should seek to make improvements in the system to positively influence the person’s actions during the next emergency.')
        },
        {
            q: 'During an incident, the team cannot agree whether it is the highest or the second-highest severity. What does PagerDuty’s incident response guidance recommend?',
            options: [
                'Treat it as the higher severity now and review the level in the post-mortem',
                'Pause the response until everyone agrees on the level',
                'Choose the lower severity to avoid alarming customers',
                'Let the most senior engineer decide once the incident is over'
            ],
            why: 'Mid-incident is not the time to debate severity. Assume the higher level, respond, and correct the classification afterwards.',
            study: { text: 'Severity level reference', href: '/incident-management' },
            source: cite(SOURCES.severityLevels, 'If you are unsure which level an incident is (e.g. not sure if SEV-2 or SEV-1), treat it as the higher one. During an incident is not the time to discuss or litigate severities, just assume the highest and review during a postmortem.')
        },
        {
            q: 'Why does Google recommend a data freshness SLO for machine learning pipelines?',
            options: [
                'Stale data can lead to lower-quality inferences and worse outcomes for users',
                'Fresh data makes the model respond faster',
                'A freshness SLO replaces the need for an availability SLO',
                'Models must be retrained every day by law'
            ],
            why: 'Freshness measures how recently the model got the data it uses to produce an inference. Stale data lowers the quality of what users get.',
            study: { text: 'AI service level indicators', href: '/ai-slo-error-budget' },
            source: cite(SOURCES.mlops, 'Understanding freshness provides an important measure of an ML system’s health, as data that becomes stale may lead to lower-quality inferences and sub-optimal outcomes for the user.')
        },
        {
            q: 'A team wants an SLI for the answer quality of its AI assistant. Which form follows the standard SLI equation?',
            options: [
                'Responses that meet the quality bar ÷ all valid responses evaluated, as a percentage',
                'The average quality score across all responses',
                'The number of bad responses this month',
                'The model’s benchmark score at launch'
            ],
            why: 'An SLI is the number of good events divided by valid events, as a percentage. For quality, a good event is a response that meets the bar.',
            study: { text: 'AI service level indicators', href: '/ai-slo-error-budget' },
            source: cite(SOURCES.settingSlos, 'The SLI equation is the number of good events divided by the total number of valid events, multiplied by 100 to keep it a uniform percentage.')
        },
        {
            q: 'A service has one SLO for availability and another for latency. How do their error budgets relate?',
            options: [
                'Each SLO has its own budget, so a latency problem does not use up the availability budget',
                'They share one combined budget',
                'Only the stricter SLO has a budget',
                'Latency SLOs do not have error budgets'
            ],
            why: 'Each SLO has its own target, and the budget is the inverse of the target, so each SLO has its own budget. Tracking them separately shows which one is failing.',
            study: { text: 'Separate budgets per SLI dimension', href: '/ai-slo-error-budget' },
            source: cite(SOURCES.goodSlos, 'Each SLO will likely have different availability and latency targets. … the inverse of your SLO target is your error budget')
        },
        {
            q: 'An AI quality SLO is 90%. What is the error budget?',
            options: [
                '10% of responses may fall below the quality bar',
                '90% of responses may fall below the quality bar',
                '100 failed responses per month',
                'There is no budget for quality SLOs'
            ],
            why: 'Budget = 100% minus the SLO target, the same as for any other SLO.',
            study: { text: 'Error budgets for AI systems', href: '/ai-slo-error-budget' },
            source: cite(SOURCES.goodSlos, 'the inverse of your SLO target is your error budget')
        },
        {
            q: 'Why does Google’s SLO guidance favour a rolling window (for example, the last 30 days) over a calendar month?',
            options: [
                'Rolling windows are more closely aligned with what users experience',
                'Rolling windows make the SLO easier to meet',
                'Calendar windows cannot be used for SLOs',
                'Rolling windows never need any data to be stored'
            ],
            why: 'Rolling windows are more closely aligned with user experience. Calendar windows are still valid when you want monitoring to match business targets and planning.',
            study: { text: 'Which window?', href: '/error-budget-calculator' },
            source: cite(SOURCES.settingSlos, 'Rolling windows are more closely aligned with user experience, but you can use calendar windows if you want your monitoring to align with your business targets and planning.')
        },
        {
            q: 'An AI feature’s quality SLO starts failing right after a new model version ships. What is the best first response?',
            options: [
                'Roll back to the previous model version to stop the impact, then investigate',
                'Fine-tune the new model in production until quality recovers',
                'Lower the quality target until the budget recovers',
                'Run more A/B experiments on live users to find a fix'
            ],
            why: 'Mitigate first. Rollback is one of the standard mitigations, and it stops the impact before anyone knows the root cause.',
            study: { text: 'Error budget states & actions', href: '/ai-slo-error-budget' },
            source: cite(SOURCES.mitigation, 'Our first priority isn\'t to fix the code—it\'s to mitigate the impact on users. Thanks to the extensive work on Generic Mitigations by Google SREs, we have a defined, closed, set of standard classes of mitigations (e.g., drain traffic, rollback, restart, add capacity).')
        },
        {
            q: 'Where should an SLO target come from?',
            options: [
                'What users need from the journey, validated against real traffic',
                'The highest number the team can imagine',
                'Whatever the monitoring tool defaults to',
                'The number competitors advertise'
            ],
            why: 'Start from what users accept today, measured on real traffic, and adjust from there. A target of 100% is impossible and rarely necessary.',
            study: { text: 'Three steps, in order', href: '/#get-started' },
            source: cite(SOURCES.settingSlos, 'Normally, when choosing an SLO, it’s best to start from historical trends and assume if enough people are happy with the service now, you’re probably doing OK.')
        }
    ];

    // ---------------------------------------------------------------- helpers

    function shuffle(list) {
        var a = list.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            if (key === 'text') { node.textContent = attrs[key]; }
            else if (key === 'class') { node.className = attrs[key]; }
            else { node.setAttribute(key, attrs[key]); }
        });
        (children || []).forEach(function (child) { node.appendChild(child); });
        return node;
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function formatDate(d) {
        return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    /** Small non-cryptographic hash, only used to make credential IDs look distinct. */
    function shortHash(text) {
        var h = 2166136261;
        for (var i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6);
    }

    function credentialId(name, date) {
        var stamp = String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate());
        return 'SLO-F-' + stamp + '-' + shortHash(name.toLowerCase() + stamp + Math.random());
    }

    function safeStorage(action, value) {
        try {
            if (action === 'get') { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)); }
            if (action === 'set') { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
        } catch (e) { /* storage blocked: the page still works without it */ }
        return null;
    }

    // ------------------------------------------------------------------ state

    var state = { attempt: [], index: 0, answers: [], result: null };

    var root = document.getElementById('exam-root');
    if (!root) { return; }

    // ------------------------------------------------------------------- exam

    function startExam() {
        state.attempt = shuffle(POOL).slice(0, QUESTIONS_PER_ATTEMPT).map(function (item) {
            return {
                item: item,
                options: shuffle(item.options.map(function (text, i) { return { text: text, correct: i === 0 }; }))
            };
        });
        state.index = 0;
        state.answers = [];
        renderQuestion();
    }

    function renderIntro() {
        var saved = safeStorage('get');
        root.innerHTML = '';
        root.appendChild(el('div', { class: 'exam-intro' }, [
            el('h3', { text: 'Ready when you are' }),
            el('ul', { class: 'exam-facts' }, [
                el('li', { text: QUESTIONS_PER_ATTEMPT + ' multiple-choice questions, drawn at random from a larger pool' }),
                el('li', { text: 'Pass mark: ' + Math.round(PASS_MARK * 100) + '% (' + Math.ceil(QUESTIONS_PER_ATTEMPT * PASS_MARK) + ' correct)' }),
                el('li', { text: 'No time limit, unlimited retakes, and it is free' }),
                el('li', { text: 'Everything is covered by the pages on this site' })
            ]),
            saved && saved.passedOn ? el('p', { class: 'exam-note', text: 'You passed on ' + saved.passedOn + '. You can take it again any time to get a fresh certificate.' }) : el('span'),
            el('button', { type: 'button', class: 'cta-button', id: 'start-exam', text: 'Start the knowledge check' })
        ]));
        document.getElementById('start-exam').addEventListener('click', startExam);
    }

    function renderQuestion() {
        var current = state.attempt[state.index];
        var total = state.attempt.length;
        root.innerHTML = '';

        var progress = el('div', { class: 'exam-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(state.index) }, [
            el('div', { class: 'exam-progress-bar' })
        ]);
        progress.firstChild.style.width = Math.round((state.index / total) * 100) + '%';

        var fieldset = el('fieldset', { class: 'exam-question' }, [
            el('legend', { text: current.item.q })
        ]);
        current.options.forEach(function (opt, i) {
            var id = 'q' + state.index + '-o' + i;
            var input = el('input', { type: 'radio', name: 'answer', id: id, value: String(i) });
            if (opt.correct) { input.setAttribute('data-correct', 'true'); }
            fieldset.appendChild(el('label', { class: 'exam-option', for: id }, [
                input,
                el('span', { text: opt.text })
            ]));
        });

        var next = el('button', { type: 'button', class: 'cta-button', id: 'next-question', text: state.index === total - 1 ? 'Finish' : 'Next question', disabled: 'disabled' });
        fieldset.addEventListener('change', function () { next.removeAttribute('disabled'); });
        next.addEventListener('click', function () {
            var chosen = fieldset.querySelector('input:checked');
            if (!chosen) { return; }
            state.answers.push(Number(chosen.value));
            state.index += 1;
            if (state.index >= total) { finishExam(); } else { renderQuestion(); }
        });

        root.appendChild(el('p', { class: 'exam-counter', text: 'Question ' + (state.index + 1) + ' of ' + total }));
        root.appendChild(progress);
        root.appendChild(fieldset);
        root.appendChild(next);

        var legend = fieldset.querySelector('legend');
        legend.setAttribute('tabindex', '-1');
        legend.focus({ preventScroll: true });
    }

    function finishExam() {
        var wrong = [];
        var score = 0;
        state.attempt.forEach(function (entry, i) {
            if (entry.options[state.answers[i]].correct) { score += 1; }
            else { wrong.push(entry); }
        });
        var pct = Math.round((score / state.attempt.length) * 100);
        state.result = { score: score, total: state.attempt.length, pct: pct, passed: score / state.attempt.length >= PASS_MARK, wrong: wrong };
        renderResult();
    }

    function renderResult() {
        var r = state.result;
        root.innerHTML = '';
        var box = el('div', { class: 'exam-result ' + (r.passed ? 'passed' : 'failed') });
        box.appendChild(el('p', { class: 'exam-score', text: r.score + ' / ' + r.total + ' (' + r.pct + '%)' }));
        box.appendChild(el('h3', { text: r.passed ? 'You passed' : 'Not quite yet' }));
        box.appendChild(el('p', { text: r.passed
            ? 'Add the name you want printed on your certificate. It stays in your browser and is not uploaded anywhere.'
            : 'You need ' + Math.ceil(r.total * PASS_MARK) + ' correct to pass. Review the topics below, then retake. Questions and answer order change each attempt.' }));

        if (r.passed) {
            var input = el('input', { type: 'text', id: 'cert-name', class: 'cert-name-input', maxlength: '60', autocomplete: 'name', placeholder: 'Your full name' });
            var saved = safeStorage('get');
            if (saved && saved.name) { input.value = saved.name; }
            var btn = el('button', { type: 'button', class: 'cta-button', id: 'make-certificate', text: 'Create my certificate' });
            btn.addEventListener('click', function () {
                var name = input.value.replace(/\s+/g, ' ').trim();
                if (!name) { input.focus(); input.setAttribute('aria-invalid', 'true'); return; }
                input.removeAttribute('aria-invalid');
                renderCertificate(name);
            });
            box.appendChild(el('label', { for: 'cert-name', class: 'cert-name-label', text: 'Name on certificate' }));
            box.appendChild(input);
            box.appendChild(btn);
        }

        if (r.wrong.length) {
            var seen = {};
            var list = el('ul', { class: 'exam-review' });
            r.wrong.forEach(function (entry) {
                var key = entry.item.study.href + entry.item.study.text;
                if (seen[key]) { return; }
                seen[key] = true;
                list.appendChild(el('li', {}, [
                    el('strong', { text: entry.item.q }),
                    el('span', { text: ' ' + entry.item.why + ' ' }),
                    el('a', { href: entry.item.study.href, text: 'Study: ' + entry.item.study.text }),
                    el('span', { class: 'exam-source' }, [
                        document.createTextNode('Source: '),
                        el('a', { href: entry.item.source.url, target: '_blank', rel: 'noopener noreferrer', text: entry.item.source.title })
                    ])
                ]));
            });
            box.appendChild(el('h4', { text: 'Questions to revisit' }));
            box.appendChild(list);
        }

        var retake = el('button', { type: 'button', class: 'hero-link exam-retake', text: r.passed ? 'Retake the check' : 'Retake the check' });
        retake.addEventListener('click', startExam);
        box.appendChild(retake);
        root.appendChild(box);
        box.setAttribute('tabindex', '-1');
        box.focus({ preventScroll: false });
    }

    // ------------------------------------------------------------ certificate

    function drawCertificate(canvas, name, dateText, id) {
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;
        var cs = getComputedStyle(document.documentElement);
        function token(n, fallback) { return (cs.getPropertyValue(n) || '').trim() || fallback; }
        var primary = token('--color-primary', '#1B4332');
        var mid = token('--color-primary-mid', '#2D6A4F');
        var accent = token('--color-accent', '#52B788');
        var light = token('--color-accent-light', '#95D5B2');
        var muted = token('--color-text-muted', '#5A5A6E');
        var font = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);

        var band = ctx.createLinearGradient(0, 0, W, 0);
        band.addColorStop(0, primary); band.addColorStop(0.6, mid); band.addColorStop(1, accent);
        ctx.fillStyle = band;
        ctx.fillRect(0, 0, W, 28);
        ctx.fillRect(0, H - 28, W, 28);

        ctx.strokeStyle = light;
        ctx.lineWidth = 3;
        ctx.strokeRect(48, 64, W - 96, H - 128);

        ctx.textAlign = 'center';
        ctx.fillStyle = mid;
        ctx.font = '600 22px ' + font;
        ctx.fillText('SLO EDUCATION HUB', W / 2, 240);

        ctx.fillStyle = primary;
        ctx.font = '700 58px ' + font;
        ctx.fillText('Certificate of Completion', W / 2, 328);

        ctx.fillStyle = muted;
        ctx.font = '400 24px ' + font;
        ctx.fillText('This certifies that', W / 2, 410);

        // Shrink long names so they always fit inside the frame.
        var size = 68;
        ctx.fillStyle = primary;
        do { ctx.font = '700 ' + size + 'px ' + font; size -= 2; } while (ctx.measureText(name).width > W - 240 && size > 28);
        ctx.fillText(name, W / 2, 502);

        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(W / 2 - 260, 530); ctx.lineTo(W / 2 + 260, 530); ctx.stroke();

        ctx.fillStyle = muted;
        ctx.font = '400 24px ' + font;
        ctx.fillText('has passed the knowledge check for the', W / 2, 588);

        ctx.fillStyle = mid;
        ctx.font = '700 44px ' + font;
        ctx.fillText(CERT_NAME, W / 2, 656);

        ctx.fillStyle = muted;
        ctx.font = '400 20px ' + font;
        ctx.fillText('SLIs, SLOs, error budgets, incident management and AI SLOs', W / 2, 700);

        ctx.textAlign = 'left';
        ctx.font = '600 18px ' + font;
        ctx.fillStyle = primary;
        ctx.fillText('Issued', 120, 870);
        ctx.fillText('Credential ID', 120, 914);
        ctx.fillStyle = muted;
        ctx.font = '400 18px ' + font;
        ctx.fillText(dateText, 260, 870);
        ctx.fillText(id, 260, 914);

        ctx.textAlign = 'right';
        ctx.fillStyle = primary;
        ctx.font = '600 18px ' + font;
        ctx.fillText('slo-education.com.au', W - 120, 870);
        ctx.fillStyle = muted;
        ctx.font = '400 15px ' + font;
        ctx.fillText('Self-paced online knowledge check. Not a proctored exam.', W - 120, 914);
    }

    function postText(name) {
        return 'I just passed the ' + CERT_NAME + ' from SLO Education Hub, covering SLIs, SLOs, error budgets, ' +
            'incident management and AI SLOs. It is free to take: ' + CERT_PAGE_URL + ' #SRE #SLO #Reliability';
    }

    function renderCertificate(name) {
        var now = new Date();
        var dateText = formatDate(now);
        var id = credentialId(name, now);
        safeStorage('set', { name: name, passedOn: dateText, id: id });

        root.innerHTML = '';
        var canvas = el('canvas', { width: '1600', height: '1130', id: 'certificate-canvas', role: 'img', 'aria-label': 'Certificate of completion for ' + name });
        drawCertificate(canvas, name, dateText, id);
        // Re-draw once fonts are ready so the PNG uses Inter rather than a fallback.
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { drawCertificate(canvas, name, dateText, id); });
        }

        var actions = el('div', { class: 'cert-actions' });

        var download = el('button', { type: 'button', class: 'cta-button', id: 'download-cert', text: 'Download PNG' });
        download.addEventListener('click', function () {
            canvas.toBlob(function (blob) {
                if (!blob) { return; }
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'slo-foundation-certificate-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            }, 'image/png');
        });
        actions.appendChild(download);

        var liProfile = 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME' +
            '&name=' + encodeURIComponent(CERT_NAME) +
            '&organizationName=' + encodeURIComponent(ISSUER) +
            '&issueYear=' + now.getFullYear() +
            '&issueMonth=' + (now.getMonth() + 1) +
            '&certUrl=' + encodeURIComponent(CERT_PAGE_URL) +
            '&certId=' + encodeURIComponent(id);
        actions.appendChild(el('a', { class: 'share-btn', id: 'share-linkedin-profile', href: liProfile, target: '_blank', rel: 'noopener noreferrer', text: 'Add to LinkedIn profile' }));

        actions.appendChild(el('a', { class: 'share-btn', id: 'share-linkedin-post', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(CERT_PAGE_URL), target: '_blank', rel: 'noopener noreferrer', text: 'Share on LinkedIn' }));
        actions.appendChild(el('a', { class: 'share-btn', id: 'share-x', href: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(postText(name)), target: '_blank', rel: 'noopener noreferrer', text: 'Share on X' }));

        var copy = el('button', { type: 'button', class: 'share-btn', id: 'copy-post', text: 'Copy post text' });
        copy.addEventListener('click', function () {
            var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy post text'; }, 2000); };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(postText(name)).then(done, function () { copy.textContent = 'Copy failed'; });
            } else { copy.textContent = 'Copy not supported'; }
        });
        actions.appendChild(copy);

        var wrap = el('div', { class: 'cert-result' }, [
            el('h3', { text: 'Your certificate' }),
            el('p', { class: 'exam-note', text: 'Credential ID ' + id + '. Download the image first, then attach it to your post. Social sites cannot attach it for you.' }),
            el('div', { class: 'cert-canvas-wrap' }, [canvas]),
            actions
        ]);
        var back = el('button', { type: 'button', class: 'hero-link exam-retake', text: 'Back to start' });
        back.addEventListener('click', renderIntro);
        wrap.appendChild(back);
        root.appendChild(wrap);
    }

    renderIntro();
})();
