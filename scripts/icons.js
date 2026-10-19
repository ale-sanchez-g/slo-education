// Builds the icon gallery from icons/slo-icons.svg and wires up the live customiser.
(function () {
    // Emoji each icon replaced on this site, shown as a migration reference.
    var REPLACES = {
        'user': '👤', 'plane': '✈️', 'plane-takeoff': '🛫', 'ticket': '🎫', 'wrench': '🔧', 'trend-up': '📈', 'target': '🎯', 'bolt': '⚡', 'check-circle': '✅', 'shield': '🛡️', 'chart-bars': '📊',
        'cost': '💸', 'trend-down': '📉', 'refresh': '🔄', 'clock': '🕐', 'flame': '🔥',
        'alert-triangle': '⚠️', 'alert-circle': '🔴', 'x-circle': '❌', 'siren': '🚨',
        'calculator': '🧮', 'graduation-cap': '🎓', 'rocket': '🚀', 'clipboard-check': '📋',
        'link': '🔗', 'chat': '💬', 'lightbulb': '💡', 'gear': '⚙️', 'robot': '🤖'
    };
    var HINTS = {
        'target': 'SLO target, goal', 'bolt': 'Latency, speed', 'check-circle': 'Availability, success',
        'shield': 'Reliability, protection', 'chart-bars': 'SLI, metrics', 'cost': 'Cost, FinOps',
        'database': 'Data, storage', 'trend-down': 'Drift, decline', 'trend-up': 'Improvement, growth',
        'refresh': 'Staleness, retry', 'clock': 'Time, window', 'flame': 'Burn rate',
        'alert-triangle': 'Caution, above pace', 'alert-circle': 'Risk, fast burn', 'x-circle': 'Don’t, failure',
        'info-circle': 'Note, context', 'siren': 'Page, exhausted budget', 'calculator': 'Maths, calculator',
        'graduation-cap': 'Learning, best practice', 'rocket': 'Deploy, advanced', 'clipboard-check': 'Checklist',
        'link': 'Related, references', 'chat': 'FAQ, discussion', 'lightbulb': 'Insight, tip',
        'gear': 'Traditional systems, config', 'robot': 'AI, agents', 'gauge': 'Error budget level',
        'pulse': 'Health, uptime', 'bell': 'Alerts', 'layers': 'Stack, tiers', 'server': 'Infrastructure',
        'merge': 'Release gate, merge', 'eye': 'Observability', 'book': 'Docs, guides', 'users': 'Teams, on-call',
        'flask': 'Chaos, experiments', 'sprout': 'Growth, maturity', 'award': 'Certification',
        'search': 'Investigate', 'dashboard': 'Dashboards', 'code': 'SLOs as code',
        'hourglass': 'Duration, remaining', 'ban': 'Freeze, restrict releases', 'sparkles': 'AI-generated',
        'percent': 'Targets like 99.9%', 'user': 'User, CUJ actor', 'plane': 'Flight demo', 'plane-takeoff': 'Operations demo', 'ticket': 'Booking, check-in', 'wrench': 'Fix, tooling'
    };

    var grid = document.getElementById('icon-grid');
    var count = document.getElementById('icon-count');
    var root = document.getElementById('icon-lab-root');
    var out = document.getElementById('icon-lab-output');
    var ctl = {
        size: document.getElementById('lab-size'),
        stroke: document.getElementById('lab-stroke'),
        color: document.getElementById('lab-color'),
        tile: document.getElementById('lab-tile'),
        tone: document.getElementById('lab-tone')
    };
    var useColour = false;

    function sample() {
        var tile = ctl.tile.value, tone = ctl.tone.value;
        var tileClass = tile === 'none' ? '' : 'slo-icon-tile' + (tile === 'solid' ? ' tile-solid' : '');
        return { tileClass: tileClass, tone: tone === 'default' ? '' : 'tone-' + tone };
    }

    function card(name) {
        var li = document.createElement('li');
        li.className = 'icon-card';
        var glyph = '<svg class="slo-icon" aria-hidden="true"><use href="icons/slo-icons.svg#' + name + '"></use></svg>';
        li.innerHTML =
            '<span class="icon-stage">' + glyph + '</span>' +
            '<span class="icon-sizes">' + glyph + glyph + glyph + '</span>' +
            '<code>' + name + '</code>' +
            '<small>' + (REPLACES[name] ? 'replaces ' + REPLACES[name] + ' · ' : '') + (HINTS[name] || '') + '</small>';
        return li;
    }

    function apply() {
        var s = sample();
        root.style.setProperty('--lab-size', ctl.tile.value === 'none' ? ctl.size.value + 'px' : '58%');
        root.style.setProperty('--lab-tile', ctl.size.value * 1.6 + 'px');
        root.style.setProperty('--lab-stroke', ctl.stroke.value);
        grid.querySelectorAll('.icon-stage').forEach(function (stage) {
            stage.className = 'icon-stage ' + s.tileClass + ' ' + s.tone;
            if (useColour) stage.style.setProperty('--icon-color', ctl.color.value);
            else stage.style.removeProperty('--icon-color');
        });
        var props = ['--icon-size: ' + ctl.size.value + 'px', '--icon-stroke: ' + ctl.stroke.value];
        if (useColour) props.push('--icon-color: ' + ctl.color.value);
        var cls = ['slo-icon'].concat(s.tone ? [s.tone] : []).join(' ');
        out.textContent = '<svg class="' + cls + '" style="' + props.join('; ') + '" aria-hidden="true">\n  <use href="/icons/slo-icons.svg#target"></use>\n</svg>';
    }

    ctl.color.addEventListener('input', function () { useColour = true; apply(); });
    ['size', 'stroke', 'tile', 'tone'].forEach(function (k) {
        ctl[k].addEventListener('input', function () { if (k === 'tone') useColour = false; apply(); });
    });

    fetch('icons/slo-icons.svg').then(function (r) { return r.text(); }).then(function (text) {
        var names = Array.prototype.map.call(new DOMParser().parseFromString(text, 'image/svg+xml').querySelectorAll('symbol'), function (n) { return n.id; });
        names.forEach(function (name) { grid.appendChild(card(name)); });
        count.textContent = names.length;
        apply();
    });
})();
