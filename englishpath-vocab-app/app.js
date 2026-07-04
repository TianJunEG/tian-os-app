// Vocabulary Builder — standalone LEAD-GEN web app.
// ---------------------------------------------------------------------------
// Funnel: anyone can practise for free, anonymously, with NOTHING saved (a
// top-of-funnel taste of the product). The moment they want their progress
// remembered — saved mastery, spaced review, weak-word targeting, readiness
// tracking — they hit the gate: leave an email (the lead) and unlock Premium.
//
// Free  = ephemeral practice, no persistence, no login.
// Premium = saved progress + spaced repetition + full readiness, unlocked after
//           the lead/payment step.
//
// Same shared vocabulary engine as the Tian OS module — only this shell differs.
// No framework, no build step, no backend. Lead + entitlement live in
// localStorage as stubs; the two `// INTEGRATE:` comments mark where a real CRM
// and payment/license check plug in.
import {
  initState,
  buildSession,
  buildFocusSession,
  weakWords,
  recordResult,
  summarize,
  vocabularyWordBank,
  bankForLevels,
  TIERS,
  LEVEL_GROUPS,
  LEVEL_GROUP_LIST,
} from '../shared/englishpath/vocabulary/index.js';
import { CONFIG } from './config.js';

const PRICE = CONFIG.PRICE || 'S$9/mo'; // display only — real pricing comes from Stripe
const LEVELS = [
  { id: 'P6', label: 'Primary 6' },
  { id: 'P5', label: 'Primary 5' },
];

const K = {
  unlocked: 'vb.unlocked', // entitlement stub (Premium)
  lead: 'vb.lead', // captured lead (email + level)
  level: 'vb.level',
  levelGroup: 'vb.levelGroup',
  progress: 'vb.progress', // only written when Premium (namespaced by group)
  theme: 'vb.theme', // 'dark' | 'light' — absent means follow the OS setting
  session: 'vb.session', // cross-device sync: signed-in session JWT
  email: 'vb.email', // cross-device sync: the signed-in email (for display)
};
const app = document.getElementById('app');

// ---- entitlement + lead (stubs) -------------------------------------------
// Premium is currently FREE FOR EVERYONE — the Stripe paywall and email gate
// are disabled while we run open. Every learner gets saved progress, spaced
// review, weak-word focus and readiness. To re-enable the funnel later, restore
// the entitlement check: `localStorage.getItem(K.unlocked) === '1'`. The paywall
// / lead-capture / checkout code below is left dormant (never reached while this
// returns true) so re-enabling is a one-line change.
const isPremium = () => true;

function captureLead(lead) {
  const record = { ...lead, app: 'vocab-builder', at: new Date().toISOString() };
  try {
    localStorage.setItem(K.lead, JSON.stringify(record));
  } catch (_) {}
  // Send the lead to the configured endpoint (CRM / form service). Fire-and-forget.
  if (CONFIG.LEAD_ENDPOINT) {
    const body = CONFIG.WEB3FORMS_ACCESS_KEY
      ? { access_key: CONFIG.WEB3FORMS_ACCESS_KEY, subject: 'New Vocabulary Builder lead', ...record }
      : record;
    fetch(CONFIG.LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});
  } else {
    console.log('[lead captured — set CONFIG.LEAD_ENDPOINT to send it]', record);
  }
}

function grantPremium() {
  // Real enforcement needs a backend; on a static site this trusts the Stripe
  // success redirect (?unlocked=1) — fine for a freemium funnel.
  try {
    localStorage.setItem(K.unlocked, '1');
  } catch (_) {}
}

// If the customer is returning from a successful Stripe payment (?unlocked=1),
// grant Premium and clean the URL so a refresh doesn't re-trigger anything.
function consumePaymentReturn() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('unlocked') === '1') {
      grantPremium();
      params.delete('unlocked');
      const url = window.location.pathname + (params.toString() ? '?' + params : '');
      window.history.replaceState({}, '', url);
    }
  } catch (_) {}
}

// ---- progress (only persisted for Premium) --------------------------------
function loadProgress() {
  if (!isPremium()) return initState(); // free = always fresh, nothing saved
  try {
    const raw = localStorage.getItem(progressKey());
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.words) return { ...initState(p.config), words: p.words };
    }
  } catch (_) {}
  return initState();
}
function saveProgress(s) {
  if (!isPremium()) return; // free progress is intentionally not saved
  try {
    localStorage.setItem(progressKey(), JSON.stringify(s));
  } catch (_) {}
  // If the learner has signed in for cross-device save, mirror this group's
  // state up to the server (debounced) so it follows them to other devices.
  if (isSignedIn()) schedulePush(currentGroup().id, s);
}

// ---- cross-device sync (magic-link) ---------------------------------------
// Progress lives in localStorage by default (per-device). When a learner signs
// in with a magic link, we also mirror it to /api/vocab so it follows them to
// any device. localStorage stays the fast, offline-friendly source of truth;
// the server is the durable copy, reconciled last-write-wins per level group.
const apiBase = () => `${(CONFIG.API_BASE || '').replace(/\/+$/, '')}/api/vocab`;
const isSignedIn = () => !!localStorage.getItem(K.session);
const signedInEmail = () => localStorage.getItem(K.email) || '';

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${localStorage.getItem(K.session) || ''}`;
  const res = await fetch(apiBase() + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function signOut() {
  localStorage.removeItem(K.session);
  localStorage.removeItem(K.email);
}

// Request a magic sign-in link. Returns the API payload (in dev it includes a
// devLink so the flow is testable without email).
function requestMagicLink(email) {
  return api('/auth/request', { method: 'POST', body: { email } });
}

// Redeem a ?vbtoken=… magic link on load: verify it, store the session, pull
// the server's saved progress into localStorage, then clean the URL.
async function consumeMagicToken() {
  let token;
  try {
    token = new URLSearchParams(window.location.search).get('vbtoken');
  } catch (_) {
    return;
  }
  if (!token) return;
  try {
    const { token: session, email } = await api('/auth/verify', { method: 'POST', body: { token } });
    localStorage.setItem(K.session, session);
    localStorage.setItem(K.email, email);
    await reconcileOnSignIn();
  } catch (_) {
    // invalid/expired link — fall through; the UI will let them request another
  } finally {
    try {
      const params = new URLSearchParams(window.location.search);
      params.delete('vbtoken');
      window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params : ''));
    } catch (_) {}
  }
}

// Reconcile local and server progress at sign-in. Per level group: if the
// server already has progress, adopt it (it's the shared source of truth, so
// server wins — last-write-wins across devices). If the server has nothing but
// this device does, upload the local progress so it isn't stranded. This makes
// "practise locally, then sign in" carry your existing progress up.
async function reconcileOnSignIn() {
  if (!isSignedIn()) return;
  const { progress } = await api('/progress', { auth: true });
  const server = progress || {};
  for (const g of LEVEL_GROUP_LIST.map((x) => x.id)) {
    const key = `${K.progress}.${g}`;
    const serverState = server[g] && server[g].state;
    if (serverState && serverState.words) {
      try {
        localStorage.setItem(key, JSON.stringify(serverState));
      } catch (_) {}
      continue;
    }
    // Server has nothing for this group — push local up if we have real progress.
    try {
      const local = JSON.parse(localStorage.getItem(key) || 'null');
      if (local && local.words && Object.keys(local.words).length) {
        await api('/progress', { method: 'PUT', auth: true, body: { group: g, state: local } });
      }
    } catch (_) {}
  }
}

let _pushTimers = {};
function schedulePush(group, state) {
  clearTimeout(_pushTimers[group]);
  _pushTimers[group] = setTimeout(() => {
    api('/progress', { method: 'PUT', auth: true, body: { group, state } }).catch((err) => {
      // A dead session (expired/cleared) shouldn't wedge local practice.
      if (/40[13]/.test(err.message)) signOut();
    });
  }, 1200);
}

// ---- light markup ---------------------------------------------------------
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function markup(text) {
  return String(text)
    .split('\n')
    .map((line) => {
      if (line.trim() === '') return '<div style="height:6px"></div>';
      const html = esc(line)
        .replace(/_{4,}/g, '<span class="blank"></span>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<u>$1</u>');
      return `<p style="margin:0 0 6px">${html}</p>`;
    })
    .join('');
}

// ---- app state ------------------------------------------------------------
function currentGroup() {
  const saved = localStorage.getItem(K.levelGroup);
  return LEVEL_GROUP_LIST.find((g) => g.id === saved) || LEVEL_GROUPS.UPPER;
}
function setGroup(group) {
  localStorage.setItem(K.levelGroup, group.id);
  state = loadProgress();
}
function progressKey() {
  return `${K.progress}.${currentGroup().id}`;
}
let state = loadProgress();
let session = null;

function bank() {
  return bankForLevels(currentGroup().levels);
}

// ---- views ----------------------------------------------------------------
function renderHome() {
  state = loadProgress();
  const premium = isPremium();
  const group = currentGroup();
  const b = bank();
  const s = premium ? summarize(state, { bank: b }) : null;

  const weak = premium ? weakWords(state, { bank: b }) : [];
  const ctaEyebrow = premium ? (s.counts.dueNow ? 'Review due' : 'Your practice') : 'Free · no sign-up';
  const sessionLabel = group.sessionSize === 10 ? '10-question' : '6-question';
  const ctaHeading =
    premium && s.counts.dueNow
      ? `${s.counts.dueNow} word${s.counts.dueNow === 1 ? '' : 's'} to review + new`
      : `Start a ${sessionLabel} session`;

  const premiumBlock = premium
    ? `
      <div class="stats">
        <div class="stat"><div class="n">${s.counts.introduced}</div><div class="l">Words learned</div></div>
        <div class="stat"><div class="n">${s.counts.mastered}</div><div class="l">Mastered</div></div>
        <div class="stat"><div class="n">${s.counts.dueNow}</div><div class="l">Due to review</div></div>
      </div>
      ${isSignedIn()
        ? `<p class="muted center synced" style="margin:-6px 0 16px">☁️ Synced across your devices · ${esc(signedInEmail())} · <button class="linkbtn" data-signout>Sign out</button></p>`
        : `<p class="muted center" style="margin:-6px 0 16px">📱 Saved on this device. <button class="linkbtn" data-savesync>Save across devices →</button></p>`}
      ${weak.length ? `<div class="card focus">
        <div class="eyebrow warn">Your tricky words · ${weak.length}</div>
        <h3 style="margin:2px 0 8px">Words you keep getting wrong</h3>
        <div class="chips">${weak.slice(0, 8).map((w) => `<span class="chip">${esc(w.word)}</span>`).join('')}${weak.length > 8 ? `<span class="chip more">+${weak.length - 8}</span>` : ''}</div>
        <button class="btn full mt" data-focus>Drill these ${weak.length} word${weak.length === 1 ? '' : 's'} →</button>
        <p class="hint center mt">A focused session — just your weak words, no new ones.</p>
      </div>` : ''}
      <div class="card">
        <h3>Exam-section readiness</h3>
        ${readinessRow('vocab_mcq', 'Vocabulary MCQ', s.examReadiness)}
        ${group.id === 'upper' ? readinessRow('vocab_cloze', 'Vocabulary Cloze', s.examReadiness) : ''}
      </div>`
    : `
      <div class="card locked">
        <span class="lockpill">🔒 Premium</span>
        <h3 style="margin-top:8px">Make it stick &amp; ace the paper</h3>
        <ul class="benefits">
          <li>✓ Saves your progress across every session</li>
          <li>✓ Spaced review brings each word back right before you forget</li>
          <li>✓ Targets the words you get wrong</li>
          <li>✓ Unlocks the full word bank + a parent readiness report</li>
        </ul>
        <button class="btn full" data-unlock>Unlock progress — ${PRICE} →</button>
        <p class="hint center mt">Free to practise · progress is saved only with Premium.</p>
      </div>`;

  const groupToggle = LEVEL_GROUP_LIST.map((g) =>
    `<button class="btn ${g.id === group.id ? '' : 'secondary'} grp-btn" data-group="${g.id}">${g.label}</button>`
  ).join('');

  app.innerHTML = `
    <div class="hero">
      <div class="group-toggle">${groupToggle}</div>
      <h1>Master the words the exam tests</h1>
      <p class="sub">${b.length} real vocabulary words — learned step by step, in 5-minute sessions.</p>
    </div>

    ${b.length ? `<div class="card cta">
      <div class="eyebrow">${ctaEyebrow}</div>
      <h2>${ctaHeading}</h2>
      <p class="muted">Meet a few new words, then test yourself. About 5 minutes.</p>
      <button class="btn full mt" data-go="practice">${premium ? 'Continue' : 'Start practice'} →</button>
    </div>` : `<div class="card" style="text-align:center;padding:32px 22px">
      <h2 style="color:var(--ink-700)">Coming soon</h2>
      <p class="muted">We're building the ${group.label} word bank from real exam papers. Switch to Upper Primary to start practising now.</p>
    </div>`}

    ${premium ? premiumBlock : ''}

    <div class="card">
      <h3>How each word is built up</h3>
      <ol class="ladder">
        ${TIERS.map((t) => `<li><span class="num">${t.tier}</span><span><b>${t.name}.</b> <span class="muted">${t.summary}</span></span></li>`).join('')}
      </ol>
    </div>

    ${premium ? '' : premiumBlock}

    ${premium ? '<button class="btn ghost" data-reset>↺ Reset my progress</button>' : ''}
  `;

  const goBtn = app.querySelector('[data-go="practice"]');
  if (goBtn) goBtn.onclick = startSession;
  const focusBtn = app.querySelector('[data-focus]');
  if (focusBtn) focusBtn.onclick = startFocusSession;
  for (const btn of app.querySelectorAll('[data-group]')) {
    btn.onclick = () => {
      const g = LEVEL_GROUP_LIST.find((x) => x.id === btn.dataset.group);
      if (g && g.id !== group.id) { setGroup(g); renderHome(); }
    };
  }
  const unlock = app.querySelector('[data-unlock]');
  if (unlock) unlock.onclick = () => openPaywall('home');
  const saveSync = app.querySelector('[data-savesync]');
  if (saveSync) saveSync.onclick = openSyncModal;
  const signout = app.querySelector('[data-signout]');
  if (signout)
    signout.onclick = () => {
      signOut();
      renderHome();
    };
  const reset = app.querySelector('[data-reset]');
  if (reset)
    reset.onclick = () => {
      if (confirm('Reset your saved progress?')) {
        localStorage.removeItem(progressKey());
        state = initState();
        renderHome();
      }
    };
}

function readinessRow(key, label, examReadiness) {
  return `
    <div class="readiness-row">
      <div class="top"><b>${label}</b><span>${examReadiness[key] || 0}%</span></div>
      <div class="bar"><span style="width:${examReadiness[key] || 0}%"></span></div>
    </div>`;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startSession() {
  const group = currentGroup();
  const sessionBank = isPremium() ? bank() : shuffle(bank());
  const tasks = buildSession(state, { size: group.sessionSize, bank: sessionBank });
  session = { tasks, idx: 0, answered: false, log: [], focus: false };
  renderSession();
}

function startFocusSession() {
  const group = currentGroup();
  const tasks = buildFocusSession(state, { size: group.sessionSize, bank: bank() });
  if (!tasks.length) return renderHome();
  session = { tasks, idx: 0, answered: false, log: [], focus: true };
  renderSession();
}

function renderSession() {
  if (!session.tasks.length) {
    app.innerHTML = `<div class="card center"><p>You're all caught up — nothing is due right now.</p><button class="btn secondary" data-home>Back</button></div>`;
    app.querySelector('[data-home]').onclick = renderHome;
    return;
  }
  const t = session.tasks[session.idx];
  const tier = TIERS[(t.tier || 1) - 1];
  const progressUnits = session.idx + (session.answered || t.kind === 'teach' ? 1 : 0);

  // Teach cards aren't questions — label them "New word (x of y)" and number
  // only the actual questions.
  const upTo = (kind) => session.tasks.slice(0, session.idx + 1).filter((x) => (kind === 'teach' ? x.kind === 'teach' : x.kind !== 'teach')).length;
  const total = (kind) => session.tasks.filter((x) => (kind === 'teach' ? x.kind === 'teach' : x.kind !== 'teach')).length;
  const counter =
    t.kind === 'teach' ? `New word · ${upTo('teach')} of ${total('teach')}` : `Question ${upTo('q')} of ${total('q')}`;

  const head = `
    <button class="btn ghost" data-home>← Home</button>
    <div class="sessionbar">
      <span class="mono">${counter}</span>
      <span>${session.focus ? '<span class="tag warn">Focus</span> ' : t.mode === 'review' ? '<span class="tag gold">Review</span> ' : ''}${t.kind === 'teach' ? '' : `<span class="tag">${tier ? tier.name : ''}</span>`}</span>
    </div>
    <div class="bar" style="margin-bottom:18px"><span style="width:${(progressUnits / session.tasks.length) * 100}%"></span></div>`;

  if (t.kind === 'teach') {
    const c = t.card;
    app.innerHTML = `${head}
      <div class="card teach">
        <div class="eyebrow">New word</div>
        <div class="word">${esc(c.word)}</div>
        <div class="pos">${esc(c.pos || '')}</div>
        <p class="mean">${esc(c.meaning)}</p>
        ${c.example ? `<div class="ex">${markup(c.example)}</div>` : ''}
        <div class="meta">
          ${c.synonyms && c.synonyms.length ? `<p style="margin:0 0 4px"><b>Similar:</b> ${esc(c.synonyms.join(', '))}</p>` : ''}
          ${c.wordFamily ? `<p style="margin:0 0 4px"><b>Word family:</b> ${esc(c.wordFamily)}</p>` : ''}
          ${c.mnemonic ? `<p style="margin:0">💡 ${esc(c.mnemonic)}</p>` : ''}
        </div>
        <div class="spacer"><button class="btn full" data-next>Got it →</button></div>
      </div>`;
    app.querySelector('[data-home]').onclick = renderHome;
    app.querySelector('[data-next]').onclick = () => {
      state = recordResult(state, { wordId: t.wordId, taskType: 'meet_word', correct: true }, { bank: bank() });
      saveProgress(state);
      session.log.push({ kind: 'teach', word: t.word, label: t.label, correct: true });
      next();
    };
    return;
  }

  app.innerHTML = `${head}
    <div class="card">
      <div class="eyebrow">${esc(t.label)}</div>
      <p class="muted" style="margin:4px 0 0">${esc(t.instruction)}</p>
      <div class="prompt">${markup(t.prompt)}</div>
      <div class="options">
        ${t.options.map((o) => `<button class="opt" data-opt="${o.id}">${esc(o.text)}<span class="mk" data-mk="${o.id}"></span></button>`).join('')}
      </div>
      <div data-foot></div>
    </div>`;
  app.querySelector('[data-home]').onclick = renderHome;
  app.querySelectorAll('[data-opt]').forEach((btn) => {
    btn.onclick = () => answer(t, btn.getAttribute('data-opt'));
  });
}

function answer(t, optId) {
  if (session.answered) return;
  session.answered = true;
  const option = t.options.find((o) => o.id === optId);
  const correct = !!option.correct;
  state = recordResult(
    state,
    { wordId: t.wordId, taskType: t.taskType, correct, chosenText: correct ? undefined : option.text },
    { bank: bank() }
  );
  saveProgress(state);
  session.log.push({ kind: 'mcq', word: t.word, label: t.label, correct });

  app.querySelectorAll('[data-opt]').forEach((btn) => {
    const o = t.options.find((x) => x.id === btn.getAttribute('data-opt'));
    btn.disabled = true;
    if (o.correct) {
      btn.classList.add('correct');
      btn.querySelector('[data-mk]').textContent = '✓';
    } else if (btn.getAttribute('data-opt') === optId) {
      btn.classList.add('wrong');
      btn.querySelector('[data-mk]').textContent = '✗';
    } else {
      btn.classList.add('dim');
    }
  });

  const last = session.idx + 1 >= session.tasks.length;
  app.querySelector('[data-foot]').innerHTML = `
    <div class="feedback ${correct ? 'ok' : 'no'}"><span class="bulb">💡</span><span>${esc(t.rationale || '')}</span></div>
    <div class="spacer"><button class="btn full" data-next>${last ? 'See results →' : 'Next →'}</button></div>`;
  app.querySelector('[data-next]').onclick = next;
}

function next() {
  if (session.idx + 1 >= session.tasks.length) return renderResults();
  session.idx += 1;
  session.answered = false;
  renderSession();
}

function renderResults() {
  const graded = session.log.filter((e) => e.kind === 'mcq');
  const correct = graded.filter((e) => e.correct).length;
  const total = graded.length;
  const pct = total ? Math.round((correct / total) * 100) : 100;
  const newCount = session.log.filter((e) => e.kind === 'teach').length;
  const premium = isPremium();

  // What's next — the answer differs for free vs Premium.
  const next = premium
    ? `
      <div class="card center">
        <span class="lockpill" style="background:var(--emerald-tint);color:var(--emerald-deep)">✓ What's next</span>
        <h3 style="margin-top:8px">${newCount ? `${newCount} new word${newCount === 1 ? '' : 's'} added to your review` : 'Keep your streak going'}</h3>
        <p class="muted">They're saved. Come back tomorrow and spaced review will bring them back right before you'd forget — plus fresh words.</p>
      </div>`
    : `
      <div class="card locked center">
        <span class="lockpill">🔒 What's next</span>
        <h3 style="margin-top:8px">You met ${newCount} new word${newCount === 1 ? '' : 's'} — keep ${newCount === 1 ? 'it' : 'them'}</h3>
        <p class="muted">Free practice isn't saved, so these slip away when you leave. Unlock Premium to lock them in: saved progress, spaced review that brings each word back before you forget, and new words every session.</p>
        <button class="btn mt" data-unlock>Unlock progress — ${PRICE} →</button>
      </div>`;

  const newWords = session.log.filter((e) => e.kind === 'teach').map((e) => e.word);
  const questions = session.log.filter((e) => e.kind === 'mcq');

  app.innerHTML = `
    <div class="card center">
      <div class="eyebrow">Session score</div>
      <div class="score">${correct}<small> / ${total}</small></div>
      <p class="muted" style="margin:2px 0 0">${pct}% correct</p>
    </div>
    ${next}
    <div class="card">
      <h3>Words you met</h3>
      <div class="chips">${newWords.map((w) => `<span class="chip">${esc(w)}</span>`).join('') || '<span class="muted">—</span>'}</div>
      <h3 class="mt">How you did</h3>
      <ul class="reslist">
        ${questions
          .map(
            (e) => `<li><span class="w">${esc(e.word)}</span>
              <span class="${e.correct ? 'ok-mk' : 'no-mk'}">${e.correct ? '✓' : '✗'}</span></li>`
          )
          .join('')}
      </ul>
    </div>
    <div class="row">
      <button class="btn" style="flex:1" data-again>Practise again →</button>
      <button class="btn secondary" style="flex:1" data-home>Home</button>
    </div>`;
  app.querySelector('[data-again]').onclick = startSession;
  app.querySelector('[data-home]').onclick = renderHome;
  const unlock = app.querySelector('[data-unlock]');
  if (unlock) unlock.onclick = () => openPaywall('results');
}

// ---- paywall / lead capture -----------------------------------------------
function openPaywall(source) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <button class="x" data-close aria-label="Close">×</button>
      <div class="eyebrow">Unlock Premium</div>
      <h2 style="margin:4px 0 10px">Keep your progress &amp; ace the paper</h2>
      <ul class="benefits">
        <li>✓ Saved progress + spaced review across all sessions</li>
        <li>✓ Automatic weak-word targeting</li>
        <li>✓ The full Primary 5 &amp; 6 word bank</li>
        <li>✓ A parent readiness report</li>
      </ul>
      <form data-form>
        <label class="fld"><span>Parent email</span>
          <input type="email" name="email" required placeholder="you@email.com" autocomplete="email" /></label>
        <label class="fld"><span>Child's level</span>
          <select name="level">${LEVELS.map((l) => `<option value="${l.id}" ${l.id === 'P6' ? 'selected' : ''}>${l.label}</option>`).join('')}</select></label>
        <button class="btn full" type="submit">Get started — ${PRICE}</button>
        <p class="hint center mt">We'll email your access link. No spam, unsubscribe anytime.</p>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('[data-close]').onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
  overlay.querySelector('[data-form]').onsubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const lead = { email: data.get('email'), level: data.get('level'), source };
    captureLead(lead); // → the lead (sent to CONFIG.LEAD_ENDPOINT)
    if (CONFIG.STRIPE_PAYMENT_LINK) {
      // Send them to checkout. Premium unlocks when Stripe redirects back with ?unlocked=1.
      const sep = CONFIG.STRIPE_PAYMENT_LINK.includes('?') ? '&' : '?';
      window.location.href = CONFIG.STRIPE_PAYMENT_LINK + sep + 'prefilled_email=' + encodeURIComponent(lead.email || '');
      return;
    }
    grantPremium(); // demo mode (no payment link configured): unlock immediately
    overlay.querySelector('.modal').innerHTML = `
      <div class="center" style="padding:18px 6px">
        <div class="score" style="font-size:46px">🎉</div>
        <h2 style="margin:6px 0">You're in!</h2>
        <p class="muted">Premium unlocked. Your progress will now be saved as you practise.</p>
        <button class="btn mt" data-done>Start learning →</button>
      </div>`;
    overlay.querySelector('[data-done]').onclick = () => {
      close();
      state = loadProgress();
      renderHome();
    };
  };
}

// ---- cross-device sync modal ----------------------------------------------
// Passwordless: enter an email, we send a one-time sign-in link. Opening that
// link (on any device) signs in and syncs progress. No password to remember.
function openSyncModal() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <button class="x" data-close aria-label="Close">×</button>
      <div class="eyebrow">Save across devices</div>
      <h2 style="margin:4px 0 8px">Keep your progress anywhere</h2>
      <p class="muted" style="margin:0 0 14px">Enter your email and we'll send a one-tap sign-in link — no password. Your saved words then follow you to any phone, tablet or laptop.</p>
      <form data-form>
        <label class="fld"><span>Your email</span>
          <input type="email" name="email" required placeholder="you@email.com" autocomplete="email" /></label>
        <button class="btn full" type="submit">Email me a sign-in link</button>
        <p class="hint center mt" data-msg></p>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('[data-close]').onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
  overlay.querySelector('[data-form]').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const msg = e.target.querySelector('[data-msg]');
    const email = new FormData(e.target).get('email');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    msg.textContent = '';
    msg.style.color = '';
    try {
      const res = await requestMagicLink(email);
      overlay.querySelector('.modal').innerHTML = `
        <div class="center" style="padding:16px 6px">
          <div style="font-size:44px">✉️</div>
          <h2 style="margin:6px 0">Check your inbox</h2>
          <p class="muted">We sent a sign-in link to <b>${esc(email)}</b>. Open it on any device to sync your progress. The link works once and expires in 20 minutes.</p>
          ${res.devLink ? `<button class="btn mt" data-devopen>Open link now (dev)</button>` : ''}
          <button class="btn ghost mt" data-close2>Close</button>
        </div>`;
      overlay.querySelector('[data-close2]').onclick = close;
      const dev = overlay.querySelector('[data-devopen]');
      if (dev) dev.onclick = () => (window.location.href = res.devLink);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Email me a sign-in link';
      msg.textContent = err.message || 'Something went wrong. Please try again.';
      msg.style.color = 'var(--error)';
    }
  };
}

// ---- theme (dark mode) -----------------------------------------------------
// The <head> script has already applied the initial theme class (from the saved
// preference, else the OS setting) to avoid a flash. Here we just keep the
// toggle's icon in sync and let the user override + persist their choice.
function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const sync = () => {
    const dark = document.documentElement.classList.contains('dark');
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', String(dark));
  };
  btn.onclick = () => {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(K.theme, dark ? 'dark' : 'light');
    } catch (_) {}
    sync();
  };
  sync();
}

// ---- boot -----------------------------------------------------------------
initTheme();
consumePaymentReturn(); // grant Premium if returning from a successful checkout
renderHome(); // render immediately so there's no blank frame
// If arriving from a magic link, redeem it and re-render with synced progress.
consumeMagicToken().then(() => {
  state = loadProgress();
  renderHome();
});
