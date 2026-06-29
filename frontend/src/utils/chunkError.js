// Detect a failed lazy-chunk / dynamic-import load — the classic "open tab hits a
// hashed chunk that no longer exists after a deploy" error. The message wording
// differs by browser, so match all of them (the pilot runs on iPad Safari, whose
// phrasing the old Chrome-only check missed → users saw "Something went wrong"
// instead of a silent reload):
//   Chrome:  "Failed to fetch dynamically imported module: <url>"
//   Firefox: "error loading dynamically imported module: <url>"
//   Safari:  "Importing a module script failed."
//   webpack: "Loading chunk 12 failed" / ChunkLoadError
export function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return (
    error?.name === 'ChunkLoadError'
    || /failed to fetch dynamically imported module/i.test(msg)
    || /error loading dynamically imported module/i.test(msg)
    || /importing a module script failed/i.test(msg)
    || /dynamically imported module/i.test(msg)
    || /loading chunk [\d]+ failed/i.test(msg)
    || /loading css chunk/i.test(msg)
  );
}

// Reload at most once per window to fetch the fresh index + chunks, guarding
// against a reload loop (e.g. a stale service-worker index that keeps serving a
// missing chunk). Returns true if it triggered a reload, false if it already
// reloaded recently and the caller should show a manual recovery UI instead.
export function reloadOnceForChunkError(now = Date.now(), windowMs = 20000) {
  if (typeof window === 'undefined') return false;
  let recentlyReloaded = false;
  try {
    const last = Number(window.sessionStorage?.getItem('chunkReloadAt') || 0);
    recentlyReloaded = last > 0 && now - last < windowMs;
    if (!recentlyReloaded) window.sessionStorage?.setItem('chunkReloadAt', String(now));
  } catch { /* sessionStorage blocked (private mode) — best effort, reload anyway */ }
  if (recentlyReloaded) return false;
  window.location.reload();
  return true;
}
