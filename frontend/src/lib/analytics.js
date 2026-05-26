// Minimal analytics shim for Edu OS. These are intentional no-ops so content
// pages can call trackEvent without coupling to any vendor; wire a provider
// here later if needed.
export function initAnalytics() {}

export function trackEvent() {}
