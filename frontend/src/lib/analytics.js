// Privacy-first analytics (Plausible by default — cookieless, no consent
// banner needed). Disabled until VITE_PLAUSIBLE_DOMAIN is set, so dev and
// un-configured deploys send nothing. For a self-hosted instance (Plausible
// or Umami-compatible), point VITE_PLAUSIBLE_SRC at your script.
const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const SRC = import.meta.env.VITE_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js';

let initialized = false;

export function initAnalytics() {
  if (initialized || !DOMAIN || typeof document === 'undefined') return;
  initialized = true;

  // Queue events fired before the script finishes loading.
  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = DOMAIN;
  script.src = SRC;
  document.head.appendChild(script);
}

// Track a custom event (no-op until analytics is configured).
export function trackEvent(name, props) {
  if (!DOMAIN || typeof window === 'undefined' || !window.plausible) return;
  window.plausible(name, props ? { props } : undefined);
}
