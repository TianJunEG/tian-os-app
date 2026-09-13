// ELPath free-resource → BrightDesk marketing list.
// A small, optional "free study tips by email" opt-in. Renders only when
// CONFIG.MARKETING_ENDPOINT points at BrightDesk's POST /api/marketing/subscribe.
// Submissions are consent-gated (un-ticked box) and POST { email, source, consent }.
import { CONFIG } from './config.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// `source` tags where the lead came from (e.g. 'elpath' or 'elpath-brightdesk').
export function initTipsSignup(source = 'elpath') {
  const endpoint = (CONFIG.MARKETING_ENDPOINT || '').trim();
  const mount = document.getElementById('tips-signup');
  if (!endpoint || !mount) return; // opt-in feature; stays hidden unless configured

  mount.innerHTML = `
    <div class="tips-card" style="max-width:520px;margin:18px auto 0;border:1px solid var(--line,#e7e9ee);border-radius:14px;padding:16px 18px;background:var(--paper,#fff)">
      <strong style="display:block;font-size:15px;color:var(--deep,#175f40)">Free primary-English study tips</strong>
      <p style="margin:4px 0 10px;font-size:13px;color:var(--muted,#6b7585)">Occasional tips, word lists and practice ideas — straight to your inbox.</p>
      <form id="tips-form" novalidate style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="tips-email" type="email" inputmode="email" autocomplete="email" placeholder="you@email.com"
          style="flex:1 1 200px;min-width:0;font:inherit;font-size:14px;padding:9px 11px;border:1px solid var(--line,#e7e9ee);border-radius:10px;background:var(--paper,#fff);color:var(--ink,#232c39)" />
        <button id="tips-btn" type="submit"
          style="appearance:none;border:0;cursor:pointer;font:inherit;font-weight:600;background:var(--emerald,#1f8a5b);color:#fff;padding:9px 16px;border-radius:10px">Email me tips</button>
      </form>
      <label style="display:flex;gap:8px;align-items:flex-start;margin-top:9px;cursor:pointer">
        <input id="tips-consent" type="checkbox" style="margin-top:2px" />
        <span style="font-size:12px;line-height:1.4;color:var(--muted,#6b7585)">I agree to receive tips, resources and offers about education services from BrightDesk. Unsubscribe anytime.</span>
      </label>
      <p id="tips-msg" role="status" style="margin:8px 0 0;font-size:13px;min-height:1em"></p>
    </div>`;

  const form = mount.querySelector('#tips-form');
  const emailEl = mount.querySelector('#tips-email');
  const consentEl = mount.querySelector('#tips-consent');
  const btn = mount.querySelector('#tips-btn');
  const msg = mount.querySelector('#tips-msg');
  const say = (text, ok) => { msg.textContent = text; msg.style.color = ok ? 'var(--emerald,#1f8a5b)' : 'var(--err,#c8472f)'; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailEl.value.trim();
    if (!EMAIL_RE.test(email)) return say('Please enter a valid email address.', false);
    if (!consentEl.checked) return say('Please tick the box to receive emails.', false);
    btn.disabled = true; btn.textContent = 'Sending…'; say('', true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, consent: true }),
      });
      if (!res.ok) throw new Error();
      form.style.display = 'none';
      consentEl.closest('label').style.display = 'none';
      say('Thanks! Check your inbox for study tips.', true);
    } catch (_) {
      btn.disabled = false; btn.textContent = 'Email me tips';
      say('Sorry — could not subscribe just now. Please try again later.', false);
    }
  });
}
