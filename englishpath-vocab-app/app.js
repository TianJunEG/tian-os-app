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
  recordResult,
  summarize,
  vocabularyWordBank,
  TIERS,
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
  progress: 'vb.progress', // only written when Premium
};
const app = document.getElementById('app');

// ---- entitlement + lead (stubs) -------------------------------------------
const isPremium = () => localStorage.getItem(K.unlocked) === '1';

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

// ---- level ----------------------------------------------------------------
function getLevel() {
  const v = localStorage.getItem(K.level);
  return LEVELS.some((l) => l.id === v) ? v : 'P6';
}
function setLevel(v) {
  localStorage.setItem(K.level, v);
}
function bankForLevel(level) {
  const b = vocabularyWordBank.filter((w) => (w.level || 'P6') === level);
  return b.length ? b : vocabularyWordBank.filter((w) => (w.level || 'P6') === 'P6');
}
function levelHasWords(level) {
  return vocabularyWordBank.some((w) => (w.level || 'P6') === level);
}

// ---- progress (only persisted for Premium) --------------------------------
function loadProgress() {
  if (!isPremium()) return initState(); // free = always fresh, nothing saved
  try {
    const raw = localStorage.getItem(K.progress);
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
    localStorage.setItem(K.progress, JSON.stringify(s));
  } catch (_) {}
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
let level = getLevel();
let state = loadProgress();
let session = null;

function bank() {
  return bankForLevel(level);
}

// ---- views ----------------------------------------------------------------
function levelToggle() {
  return `<div class="seg">${LEVELS.map(
    (l) =>
      `<button class="seg-btn ${l.id === level ? 'on' : ''}" data-level="${l.id}">${l.label}${
        levelHasWords(l.id) ? '' : ' <span class="soon">soon</span>'
      }</button>`
  ).join('')}</div>`;
}

function renderHome() {
  state = loadProgress();
  const s = summarize(state, { bank: bank() });
  const { counts, examReadiness } = s;
  const premium = isPremium();
  const wordCount = bank().length;

  const premiumBlock = premium
    ? `
      <div class="stats">
        <div class="stat"><div class="n">${counts.introduced}</div><div class="l">Words learned</div></div>
        <div class="stat"><div class="n">${counts.mastered}</div><div class="l">Mastered</div></div>
        <div class="stat"><div class="n">${counts.dueNow}</div><div class="l">Due to review</div></div>
      </div>
      <div class="card">
        <h3>Exam-section readiness</h3>
        ${readinessRow('vocab_mcq', 'Vocabulary MCQ', examReadiness)}
        ${readinessRow('vocab_cloze', 'Vocabulary Cloze', examReadiness)}
      </div>`
    : `
      <div class="card locked">
        <span class="lockpill">🔒 Premium</span>
        <h3 style="margin-top:8px">Track your progress &amp; ace the paper</h3>
        <ul class="benefits">
          <li>✓ Save your progress across every session</li>
          <li>✓ Spaced review brings words back right before you forget</li>
          <li>✓ Targets your weak words automatically</li>
          <li>✓ Unlocks all ${wordCount} words + a parent readiness report</li>
        </ul>
        <button class="btn" data-unlock>Unlock progress — ${PRICE} →</button>
        <p class="hint mt">Free to practise · your progress is only saved with Premium.</p>
      </div>`;

  app.innerHTML = `
    <div class="row" style="margin-bottom:12px">
      <h1 style="margin:0">Vocabulary Builder</h1>
      ${levelToggle()}
    </div>
    <p class="sub">The words the ${level === 'P5' ? 'Primary 5' : 'Primary 6'} English paper actually tests — learned step by step.</p>

    <div class="card">
      <div class="row">
        <div>
          <div class="eyebrow">Free practice</div>
          <h2 style="margin-top:4px">A 10-question session</h2>
        </div>
        <button class="btn" data-go="practice">Start practice →</button>
      </div>
    </div>

    ${premiumBlock}

    <div class="card">
      <h3>How each word is built up</h3>
      <ol class="ladder">
        ${TIERS.map((t) => `<li><span class="num">${t.tier}</span><span><b>${t.name}.</b> <span class="muted">${t.summary}</span></span></li>`).join('')}
      </ol>
    </div>

    ${premium ? '<button class="btn ghost" data-reset>↺ Reset my progress</button>' : ''}
  `;

  app.querySelector('[data-go="practice"]').onclick = startSession;
  app.querySelectorAll('[data-level]').forEach((b) => {
    b.onclick = () => {
      level = b.getAttribute('data-level');
      setLevel(level);
      renderHome();
    };
  });
  const unlock = app.querySelector('[data-unlock]');
  if (unlock) unlock.onclick = () => openPaywall('home');
  const reset = app.querySelector('[data-reset]');
  if (reset)
    reset.onclick = () => {
      if (confirm('Reset your saved progress?')) {
        localStorage.removeItem(K.progress);
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

function startSession() {
  if (!levelHasWords(level)) {
    level = 'P6';
    setLevel(level);
  }
  const tasks = buildSession(state, { size: 10, bank: bank() });
  session = { tasks, idx: 0, answered: false, log: [] };
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

  const head = `
    <button class="btn ghost" data-home>← Home</button>
    <div class="sessionbar">
      <span class="mono">Question ${session.idx + 1} of ${session.tasks.length}</span>
      <span>${t.mode === 'review' ? '<span class="tag gold">Review</span> ' : ''}<span class="tag">${tier ? tier.name : ''}</span></span>
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
  const premium = isPremium();

  const convert = premium
    ? ''
    : `
      <div class="card locked center">
        <span class="lockpill">🔒 Don't lose this</span>
        <h3 style="margin-top:8px">Your progress isn't being saved</h3>
        <p class="muted">On the free version, this session disappears when you leave. Unlock Premium to keep your progress, bring these words back with spaced review, and target your weak words.</p>
        <button class="btn mt" data-unlock>Save my progress — ${PRICE} →</button>
      </div>`;

  app.innerHTML = `
    <div class="card center">
      <div class="eyebrow">Session score</div>
      <div class="score">${correct}<small> / ${total}</small></div>
      <p class="muted" style="margin:2px 0 0">${pct}% correct</p>
    </div>
    ${convert}
    <div class="card">
      <h3>This session</h3>
      <ul class="reslist">
        ${session.log
          .map(
            (e) => `<li><span><span class="w">${esc(e.word)}</span> <span class="lbl">· ${esc(e.label)}</span></span>
              <span>${e.kind === 'teach' ? '<span class="lbl" style="color:var(--gold)">learned</span>' : e.correct ? '✓' : '✗'}</span></li>`
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
        <li>✓ All ${bank().length} ${level} words + parent readiness report</li>
        <li>✓ Switch freely between Primary 5 and Primary 6</li>
      </ul>
      <form data-form>
        <label class="fld"><span>Parent email</span>
          <input type="email" name="email" required placeholder="you@email.com" autocomplete="email" /></label>
        <label class="fld"><span>Child's level</span>
          <select name="level">${LEVELS.map((l) => `<option value="${l.id}" ${l.id === level ? 'selected' : ''}>${l.label}</option>`).join('')}</select></label>
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
    level = lead.level;
    setLevel(level);
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

// ---- boot -----------------------------------------------------------------
consumePaymentReturn(); // grant Premium if returning from a successful checkout
renderHome();
