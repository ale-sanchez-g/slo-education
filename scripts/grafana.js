// Grafana Faro loader (scripts/grafana.js)
(function () {
  if (typeof window === 'undefined' || !document || !document.head) return;
  if (window.__SLO_EDU_FARO_LOADED__) return;
  window.__SLO_EDU_FARO_LOADED__ = true;

  var COLLECTOR_URL = 'https://faro-collector-prod-au-southeast-1.grafana.net/collect/69ac052af265df10b6446755443a2ff9';
  var APP_CONFIG = {
    url: COLLECTOR_URL,
    app: { name: 'slo-education-hub', version: '1.1.0', environment: 'production' },
    sessionTracking: { samplingRate: 1, persistent: true },
  };

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = function () { if (typeof cb === 'function') cb(); };
    s.onerror = function (e) { console.warn('Failed to load script', src, e); };
    document.head.appendChild(s);
    return s;
  }

  function initializeFaro() {
    if (!window.GrafanaFaroWebSdk || typeof window.GrafanaFaroWebSdk.initializeFaro !== 'function') return;
    try {
      window.GrafanaFaroWebSdk.initializeFaro(APP_CONFIG);
    } catch (e) {
      console.warn('Faro initialize failed', e);
      return;
    }

    // load tracing instrumentation
    loadScript('https://unpkg.com/@grafana/faro-web-tracing@2/dist/bundle/faro-web-tracing.iife.js', function () {
      try {
        if (window.GrafanaFaroWebSdk && window.GrafanaFaroWebTracing && window.GrafanaFaroWebSdk.faro && window.GrafanaFaroWebSdk.faro.instrumentations) {
          window.GrafanaFaroWebSdk.faro.instrumentations.add(new window.GrafanaFaroWebTracing.TracingInstrumentation());
        }
      } catch (e) {
        console.warn('Adding tracing instrumentation failed', e);
      }
    });
  }

  // Respect site's cookie consent stored under this key (used elsewhere in site)
  var CONSENT_KEY = 'slo-education-analytics-consent';

  function shouldInit() {
    try {
      return localStorage.getItem(CONSENT_KEY) === 'accepted';
    } catch (e) {
      return false;
    }
  }

  // If consent already given, load Faro SDK and initialize
  if (shouldInit()) {
    loadScript('https://unpkg.com/@grafana/faro-web-sdk@2/dist/bundle/faro-web-sdk.iife.js', initializeFaro);
    return;
  }

  // Otherwise, wait for consent. Listen for storage events (other tabs) and clicks on accept buttons.
  function onConsentGranted() {
    if (!shouldInit()) return;
    loadScript('https://unpkg.com/@grafana/faro-web-sdk@2/dist/bundle/faro-web-sdk.iife.js', initializeFaro);
    removeListeners();
  }

  function storageListener(e) {
    if (!e) return;
    if (e.key === CONSENT_KEY && e.newValue === 'accepted') onConsentGranted();
  }

  function clickListener(e) {
    var el = e && e.target;
    if (!el) return;
    if (el.id === 'cookie-accept' || el.classList && el.classList.contains('cookie-accept')) {
      // small delay to allow other scripts to write localStorage
      setTimeout(onConsentGranted, 50);
    }
  }

  function removeListeners() {
    window.removeEventListener('storage', storageListener);
    document.removeEventListener('click', clickListener);
  }

  window.addEventListener('storage', storageListener);
  document.addEventListener('click', clickListener);

  // also provide a fallback: poll for consent for up to 60s
  var pollCount = 0;
  var pollInterval = setInterval(function () {
    pollCount += 1;
    if (shouldInit()) {
      clearInterval(pollInterval);
      onConsentGranted();
    } else if (pollCount > 600) {
      clearInterval(pollInterval);
      removeListeners();
    }
  }, 100);
})();
