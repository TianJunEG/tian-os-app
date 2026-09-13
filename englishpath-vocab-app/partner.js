// Partner / embed mode for the ELPath free-practice surfaces.
// -----------------------------------------------------------------------------
// When a page is opened with `?partner=<name>` (e.g. embedded as a free resource
// inside the BrightDesk tutoring marketplace), we:
//   • tag <html> with `is-embedded` + `partner-<name>` so CSS can adapt,
//   • show a small co-brand ribbon at the top,
//   • optionally report an anonymous "landed from partner" event for attribution.
// No extra tracking beyond the app's existing anonymous funnel. Everything still
// works with no partner param (the ribbon just doesn't appear).

const KNOWN = {
  brightdesk: { label: 'BrightDesk' },
};

// Read + sanitise the partner id from the URL (defensive: short, [a-z0-9_-]).
export function readPartner() {
  try {
    const raw = new URLSearchParams(location.search).get('partner');
    if (!raw) return null;
    const id = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
    return id || null;
  } catch (e) {
    return null;
  }
}

// Initialise embed mode. `onLand(id)` is called once if a partner is present
// (used to log an attribution event). Returns the partner id, or null.
export function initPartner({ onLand } = {}) {
  const id = readPartner();
  if (!id) return null;
  const meta = KNOWN[id] || { label: id.charAt(0).toUpperCase() + id.slice(1) };
  document.documentElement.classList.add('is-embedded', 'partner-' + id);

  const bar = document.createElement('div');
  bar.className = 'partner-ribbon';
  bar.setAttribute(
    'style',
    'display:flex;gap:8px;align-items:center;justify-content:center;text-align:center;' +
      'padding:8px 12px;font:600 12px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'color:#175f40;background:#e7f3ec;border-bottom:1px solid #cfe6d8;'
  );
  bar.textContent = 'ELPath — free practice for ' + meta.label + ' learners';
  if (document.body.firstChild) document.body.insertBefore(bar, document.body.firstChild);
  else document.body.appendChild(bar);

  if (typeof onLand === 'function') {
    try { onLand(id); } catch (e) {}
  }
  return id;
}
