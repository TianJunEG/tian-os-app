// Single source of truth for per-account client caches that must never leak
// across accounts on a shared browser. Both AuthContext (register/login/logout)
// and the api.js 401 handler (forced logout) sweep these on every auth boundary.
//
// We sweep both the bare keys and any per-user namespaced variants
// (e.g. `tian_times_tables_facts_<id>`) by prefix.
export const CLIENT_CACHE_PREFIXES = [
  'tian_times_tables_facts',
  'tianos.mathpath.domainProgress.v1',
  'tianos.workspaceId',
  'tianos.role',
  'spellingBadgesSeen',
  'comicsAutoNarrate',
];

export const clearClientCaches = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && CLIENT_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch (_) {
    // best-effort defensive cleanup
  }
};
