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
     * Question pool. The first option is always the correct one; options are
     * shuffled at render time. `study` points back to the page that teaches it.
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
            why: 'An SLI is the measurement. The SLO is the target set against it.',
            study: { text: 'Introduction to SLIs and SLOs', href: '/#what-are-slos' }
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
            study: { text: 'Introduction to SLIs and SLOs', href: '/#what-are-slos' }
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
            study: { text: 'CUJ → SLI → SLO → Error Budget', href: '/cuj-sli-slo-error-budget' }
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
            study: { text: 'CUJ → SLI → SLO → Error Budget', href: '/cuj-sli-slo-error-budget' }
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
            study: { text: 'How to identify CUJs', href: '/cuj-sli-slo-error-budget' }
        },
        {
            q: 'Which principle makes a good SLI?',
            options: [
                'It measures what users experience, not just what is easy to instrument',
                'It is expressed as a raw count so it is easy to graph',
                'It is chosen by the team that is easiest to measure',
                'It never changes, even when user needs do'
            ],
            why: 'Good SLIs are user-focused, ratio-based, bounded and actionable.',
            study: { text: 'Good SLI design principles', href: '/cuj-sli-slo-error-budget' }
        },
        {
            q: 'Why are SLIs usually expressed as a ratio, such as good events divided by total events?',
            options: [
                'A ratio has a clear 0–100% range and stays comparable as traffic changes',
                'Ratios are cheaper to store than counts',
                'Ratios can never go below the SLO',
                'Monitoring tools can only graph percentages'
            ],
            why: 'A bounded ratio is comparable day to day and maps directly onto an SLO percentage.',
            study: { text: 'Good SLI design principles', href: '/cuj-sli-slo-error-budget' }
        },
        {
            q: 'What is an error budget?',
            options: [
                'The amount of unreliability a service can have while still meeting its SLO',
                'The money set aside to fix bugs each quarter',
                'The number of engineers assigned to incidents',
                'The maximum number of alerts a team may receive'
            ],
            why: 'Budget = 100% minus the SLO target. It answers "how much failure can we afford?"',
            study: { text: 'Error Budget Calculator', href: '/error-budget-calculator' }
        },
        {
            q: 'A service has a 99.9% availability SLO over a month. Roughly how much downtime does that allow?',
            options: [
                'About 43.8 minutes',
                'About 7.3 hours',
                'About 4.4 minutes',
                'About 8.76 hours'
            ],
            why: '0.1% of a 730-hour month is about 43.8 minutes. 7.3 hours is a 99% SLO.',
            study: { text: 'Error Budget Calculator', href: '/error-budget-calculator' }
        },
        {
            q: 'Roughly how much downtime per month does a 99.99% SLO allow?',
            options: [
                'About 4.4 minutes',
                'About 43.8 minutes',
                'About 26 seconds',
                'About 7.3 hours'
            ],
            why: 'Each extra nine cuts the budget by a factor of ten: 99.9% is ~43.8 min, 99.99% is ~4.4 min.',
            study: { text: 'SLO reference table', href: '/error-budget-calculator' }
        },
        {
            q: 'A 99.9% SLO gives a monthly budget of 43.8 minutes. After 21.9 minutes of downtime, how much of the budget has been consumed?',
            options: [
                '50%',
                '21.9%',
                '2%',
                '99.9%'
            ],
            why: 'Burn = downtime / budget = 21.9 / 43.8 = 50%.',
            study: { text: 'Burn rate', href: '/error-budget-calculator' }
        },
        {
            q: 'A team has nearly exhausted its error budget. What does the error budget approach recommend?',
            options: [
                'Slow risky changes and focus on stability until the budget recovers',
                'Ship faster to make up for lost time',
                'Raise the SLO target so the budget looks larger',
                'Stop measuring until next month'
            ],
            why: 'The budget turns reliability into a decision rule: healthy budget means deploy freely, exhausted means stabilise.',
            study: { text: 'Using error budgets for deployment decisions', href: '/error-budget-calculator' }
        },
        {
            q: 'A team never uses any of its error budget and runs at 100% for a year. What does the site suggest this means?',
            options: [
                'They may be leaving productivity on the table by being too cautious',
                'Their SLO is perfectly set',
                'They can safely skip incident reviews',
                'Their users are happier than any other team’s'
            ],
            why: 'The budget exists to be spent on change. Saving all of it usually means the SLO is too strict or releases too slow.',
            study: { text: 'Best practices for error budgets', href: '/error-budget-calculator' }
        },
        {
            q: 'What does MTTR measure?',
            options: [
                'The average time taken to recover from an incident',
                'The maximum time a team may spend on one ticket',
                'The time between two deployments',
                'The average time before an alert is created'
            ],
            why: 'MTTR is Mean Time To Recovery. MTTD (detection) covers how fast you notice.',
            study: { text: 'Incident management', href: '/incident-management' }
        },
        {
            q: 'During an active incident, what should the team do first?',
            options: [
                'Restore service to users, then investigate the root cause',
                'Find the root cause before touching anything',
                'Assign blame so the right person fixes it',
                'Wait for the monthly review'
            ],
            why: 'Mitigation first: users care about service being restored, the "why" can follow.',
            study: { text: 'Best practices for incident response', href: '/incident-management' }
        },
        {
            q: 'Which role leads an incident response and makes the decisions?',
            options: [
                'Incident Commander',
                'Communications Lead',
                'Technical Lead',
                'Product Owner'
            ],
            why: 'The Incident Commander coordinates and decides. The Technical Lead drives remediation and the Communications Lead updates stakeholders.',
            study: { text: 'Establish clear roles', href: '/incident-management' }
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
            study: { text: 'Incident management', href: '/incident-management' }
        },
        {
            q: 'An incident has complete service outage, all users affected and revenue at risk. Which severity fits best?',
            options: [
                'P0 (critical)',
                'P1 (high)',
                'P2 (medium)',
                'P3 (low)'
            ],
            why: 'P0 is for all or most users unable to use core features, with an immediate 24/7 response.',
            study: { text: 'Severity level reference', href: '/incident-management' }
        },
        {
            q: 'Why do AI systems need a different approach to SLOs than traditional services?',
            options: [
                'Outputs are probabilistic, so "good enough" is a spectrum rather than success or failure',
                'AI systems do not have latency',
                'AI systems cannot be monitored',
                'AI systems must always be 100% accurate'
            ],
            why: 'You define what "good enough" means, measure how often you achieve it, and budget for the rest.',
            study: { text: 'AI SLOs & error budgets', href: '/ai-slo-error-budget' }
        },
        {
            q: 'Which is an AI-specific SLI dimension beyond availability and latency?',
            options: [
                'Quality or accuracy of responses',
                'Number of GPUs purchased',
                'Size of the training team',
                'Colour of the user interface'
            ],
            why: 'AI services add quality, safety, freshness and cost on top of the traditional SLIs.',
            study: { text: 'AI service level indicators', href: '/ai-slo-error-budget' }
        },
        {
            q: 'For an AI feature, why should quality, latency and safety each have their own error budget?',
            options: [
                'A quality regression should not silently consume the latency budget',
                'It makes the dashboard look more complete',
                'Regulators require exactly three budgets',
                'Separate budgets are cheaper to calculate'
            ],
            why: 'Independent budgets show which dimension is failing so the right action is taken.',
            study: { text: 'Error budgets for AI systems', href: '/ai-slo-error-budget' }
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
            study: { text: 'Error budgets for AI systems', href: '/ai-slo-error-budget' }
        },
        {
            q: 'Why does the site recommend a rolling window, such as 28 days, for AI quality SLOs?',
            options: [
                'Quality can shift with model updates or data drift, and a rolling window captures the trend',
                'Rolling windows never need to be reset',
                'Rolling windows make the SLO easier to meet',
                'AI vendors only publish 28-day reports'
            ],
            why: 'Rolling windows reflect recent behaviour, which matters when quality changes without code changes.',
            study: { text: 'Error budgets for AI systems', href: '/ai-slo-error-budget' }
        },
        {
            q: 'An AI error budget is breached (under 10% remaining). What does the site recommend?',
            options: [
                'Freeze model deployments and consider rolling back to the last stable model',
                'Run more A/B experiments to find a fix',
                'Lower the quality bar until the budget recovers',
                'Ignore it until the next measurement window'
            ],
            why: 'A breached budget means quality has fallen below acceptable levels, so changes stop until it is restored.',
            study: { text: 'Error budget states & actions', href: '/ai-slo-error-budget' }
        },
        {
            q: 'Where should an SLO target come from?',
            options: [
                'What users need from the journey, validated against real traffic',
                'The highest number the team can imagine',
                'Whatever the monitoring tool defaults to',
                'The number competitors advertise'
            ],
            why: '100% is neither achievable nor useful. Targets should be defensible and revised once real traffic tells you if they were right.',
            study: { text: 'Three steps, in order', href: '/#get-started' }
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
                    el('a', { href: entry.item.study.href, text: 'Study: ' + entry.item.study.text })
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
