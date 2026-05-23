// app.js — screen controller. Wires the engine into a small single-page flow:
// pick curriculum → home → placement → drill (with hint/reveal scaffolding) → results → progress.

import * as C from './curriculum.js';
import * as Diag from './diagnostic.js';
import * as S from './session.js';
import * as Store from './storage.js';

const app = document.getElementById('app');
const rungIndicator = document.getElementById('rung-indicator');

const state = {
  screen: 'home',
  progress: Store.loadProgress(),
  session: null,
  drillPhase: 'input', // 'input' | 'feedback'
  lastResult: null,
  lastScore: null,
  hint: null,
  diag: null,
  placement: null,
};

const activeId = () => state.progress.activeCurriculumId;
const cp = () => Store.curriculumProgress(state.progress, activeId(), C.firstSkillId(activeId()));
const totalSkills = () => C.activeSkills().length;
const masteredCount = () => Object.values(cp().mastery).filter((m) => m.mastered).length;

function solvedDisplay(p) {
  return p.display.trim().endsWith('=') ? `${p.display} ${p.answer}` : p.display;
}

// Enter-key handling for screens without a text input (feedback "continue").
let activeKeyHandler = null;
function setEnterHandler(fn) {
  if (activeKeyHandler) window.removeEventListener('keydown', activeKeyHandler);
  activeKeyHandler = fn ? (e) => { if (e.key === 'Enter') { e.preventDefault(); fn(); } } : null;
  if (activeKeyHandler) window.addEventListener('keydown', activeKeyHandler);
}

function go(screen) { state.screen = screen; render(); }
function paint(html) { app.innerHTML = html; }

function render() {
  setEnterHandler(null);
  updateRung();
  ({
    pick: renderPick,
    home: renderHome,
    diagnostic: renderDiagnostic,
    drill: renderDrill,
    results: renderResults,
    progress: renderProgress,
  }[state.screen] || renderHome)();
  window.scrollTo({ top: 0 });
}

function updateRung() {
  if (!activeId()) { rungIndicator.hidden = true; return; }
  const p = cp();
  if (p.placed || Object.keys(p.mastery).length) {
    rungIndicator.hidden = false;
    rungIndicator.innerHTML = `Current rung: <b>${C.skillLabel(p.currentSkillId)}</b>`;
  } else {
    rungIndicator.hidden = true;
  }
}

// ---- shared answer entry (input + on-screen keypad) ----
function answerEntryHTML() {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((n) => `<button class="key" data-k="${n}">${n}</button>`).join('');
  return `
    <input id="answer" class="answer" inputmode="numeric" autocomplete="off" placeholder="?" aria-label="Your answer" />
    <div class="keypad">
      ${digits}
      <button class="key clear" data-k="back" aria-label="Backspace">⌫</button>
      <button class="key" data-k="0">0</button>
      <button class="key enter" data-k="enter">Enter</button>
    </div>`;
}

function wireAnswerEntry(onSubmit) {
  const input = document.getElementById('answer');
  if (!input) return;
  input.focus();
  input.addEventListener('input', () => { input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(input.value); } });
  app.querySelectorAll('.key').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.k;
      if (k === 'enter') { onSubmit(input.value); return; }
      if (k === 'back') input.value = input.value.slice(0, -1);
      else if (input.value.length < 4) input.value += k;
      input.focus();
    });
  });
}

function parentNoteHTML() {
  return `<div class="parent-note"><b>For parents:</b> Sit alongside for the first few sessions and let the software lead. MathPath only moves up a level when answers are both accurate and quick, so a "not yet" just means a little more practice — never failure. Hints appear automatically after a wrong answer.</div>`;
}

// ---- Curriculum picker ----
function renderPick() {
  const items = C.listCurricula().map((c) => `
    <button class="btn btn-block curpick" data-id="${c.id}">
      <div style="font-weight:700">${c.label}</div>
      <div class="muted" style="font-size:13px">${c.country} · ${c.framework}</div>
    </button>`).join('');
  paint(`
    <section class="card stack">
      <h1>Choose a curriculum</h1>
      <p class="muted">MathPath maps practice to a country's syllabus — including the Singapore MOE syllabus. Pick where to start; you can switch any time.</p>
      ${items}
    </section>`);
  app.querySelectorAll('.curpick').forEach((b) => { b.onclick = () => selectCurriculum(b.dataset.id); });
}

function selectCurriculum(id) {
  state.progress.activeCurriculumId = id;
  C.setActiveCurriculum(id);
  Store.curriculumProgress(state.progress, id, C.firstSkillId(id));
  Store.saveProgress(state.progress);
  go('home');
}

// ---- Home ----
function renderHome() {
  const p = cp();
  const cur = C.getActiveCurriculum();
  if (!p.placed) {
    paint(`
      <section class="card stack">
        <div class="muted">${cur.country} · ${cur.framework}</div>
        <h1>${cur.label}</h1>
        <p class="muted">Practice that finds what your child needs, then drills it to mastery — climbing the syllabus with built-in hints when they get stuck.</p>
        <button class="btn btn-primary btn-block" id="go-diag">Take the quick placement check</button>
        <button class="btn btn-ghost btn-block" id="go-start">Skip — start at the first topic</button>
        <button class="btn btn-ghost btn-block" id="switch">Switch curriculum</button>
      </section>
      ${parentNoteHTML()}`);
    document.getElementById('go-diag').onclick = startDiagnostic;
    document.getElementById('go-start').onclick = () => startDrill(p.currentSkillId);
    document.getElementById('switch').onclick = () => go('pick');
    return;
  }
  const skill = C.getSkill(p.currentSkillId);
  paint(`
    <section class="card stack">
      <div class="row between">
        <div class="muted">${cur.label}</div>
        <span class="badge ok">${masteredCount()} / ${totalSkills()} mastered</span>
      </div>
      <h1>Ready to practise?</h1>
      <div>
        <div class="muted">You're on</div>
        <h2>${C.skillLabel(p.currentSkillId)}</h2>
        <div class="example">e.g. ${skill.example}</div>
      </div>
      <button class="btn btn-primary btn-block" id="go-start">Start practice (${C.QUESTIONS_PER_SESSION} questions)</button>
      <div class="row">
        <button class="btn grow" id="go-progress">View progress</button>
        <button class="btn btn-ghost" id="go-diag">Retake placement</button>
      </div>
      <button class="btn btn-ghost btn-block" id="switch">Switch curriculum</button>
    </section>
    ${parentNoteHTML()}`);
  document.getElementById('go-start').onclick = () => startDrill(p.currentSkillId);
  document.getElementById('go-progress').onclick = () => go('progress');
  document.getElementById('go-diag').onclick = startDiagnostic;
  document.getElementById('switch').onclick = () => go('pick');
}

// ---- Placement diagnostic ----
function startDiagnostic() {
  state.diag = { probes: Diag.buildProbes(), idx: 0, results: [], consec: 0 };
  state.placement = null;
  go('diagnostic');
}

function renderDiagnostic() {
  const d = state.diag;
  if (state.placement) {
    const skill = C.getSkill(state.placement);
    paint(`
      <section class="card stack center">
        <h1>Placement done</h1>
        <p class="muted">Best place to start practising:</p>
        <h2>${C.skillLabel(state.placement)}</h2>
        <div class="example">e.g. ${skill.example}</div>
        <button class="btn btn-primary btn-block" id="go-start">Start practising here</button>
        <button class="btn btn-ghost" id="go-home">Back to home</button>
      </section>`);
    document.getElementById('go-start').onclick = () => startDrill(state.placement);
    document.getElementById('go-home').onclick = () => go('home');
    return;
  }
  const probe = d.probes[d.idx];
  paint(`
    <section class="card stack">
      <div class="session-head">
        <div><h2>Placement check</h2><div class="qcount">Question ${d.idx + 1}</div></div>
        <div class="qcount">Finding the right level…</div>
      </div>
      <div class="problem">${probe.problem.display}</div>
      ${answerEntryHTML()}
      <div class="feedback muted">Answer what you can. If it gets too hard, that's exactly the signal we need.</div>
    </section>`);
  wireAnswerEntry(onDiagSubmit);
}

function onDiagSubmit(value) {
  if (value === '' || value == null) return;
  const d = state.diag;
  const probe = d.probes[d.idx];
  const correct = Number(value) === probe.problem.answer;
  d.results.push({ skillId: probe.skill.id, correct });
  d.consec = correct ? 0 : d.consec + 1;
  d.idx += 1;

  const stop = d.consec >= Diag.STOP_AFTER_CONSECUTIVE_MISSES || d.idx >= d.probes.length;
  if (stop) {
    const placement = Diag.placementFromResults(d.results);
    const p = cp();
    Store.markMastered(p, Diag.provenSkillIds(d.results));
    p.placed = true;
    p.currentSkillId = placement;
    Store.saveProgress(state.progress);
    state.placement = placement;
  }
  render();
}

// ---- Drill ----
function startDrill(skillId) {
  state.session = S.createSession(skillId);
  S.nextQuestion(state.session);
  state.drillPhase = 'input';
  state.lastResult = null;
  state.hint = null;
  go('drill');
}

function renderDrill() {
  const s = state.session;
  const pct = Math.round((s.answered / s.total) * 100);
  const shownQ = state.drillPhase === 'feedback' ? s.answered : Math.min(s.answered + 1, s.total);
  const head = `
    <div class="session-head">
      <div><h2>${C.skillLabel(s.skill.id)}</h2><div class="qcount">Question ${shownQ} of ${s.total}</div></div>
    </div>
    <div class="progressbar"><i style="width:${pct}%"></i></div>`;

  if (state.drillPhase === 'feedback') {
    const ok = state.lastResult.status === 'correct';
    paint(`
      <section class="card stack">
        ${head}
        <div class="problem">${solvedDisplay(s.current)}</div>
        <div class="feedback ${ok ? 'ok' : 'bad'}">${ok ? 'Correct!' : `Not quite — the answer is ${s.current.answer}.`}</div>
        <button class="btn btn-primary btn-block" id="cont">${S.isComplete(s) ? 'See results' : 'Next question'}</button>
      </section>`);
    document.getElementById('cont').onclick = onContinue;
    setEnterHandler(onContinue);
    return;
  }

  paint(`
    <section class="card stack">
      ${head}
      <div class="problem">${s.current.display}</div>
      ${answerEntryHTML()}
      ${state.hint
        ? `<div class="hint">Hint: ${state.hint}</div>`
        : '<div class="feedback muted">Type your answer, then Enter.</div>'}
    </section>`);
  wireAnswerEntry(onDrillSubmit);
}

function onDrillSubmit(value) {
  if (value === '' || value == null) return;
  const res = S.submitAnswer(state.session, value);
  if (res.status === 'retry') {
    state.hint = res.hint; // scaffolding: show a strategy hint, let them retry
    render();
    return;
  }
  state.lastResult = res; // 'correct' or 'revealed'
  state.drillPhase = 'feedback';
  render();
}

function onContinue() {
  const s = state.session;
  if (S.isComplete(s)) { finishDrill(); return; }
  S.nextQuestion(s);
  state.drillPhase = 'input';
  state.hint = null;
  render();
}

function finishDrill() {
  const score = S.scoreSession(state.session);
  Store.applySessionResult(cp(), score, C.nextSkillId(score.skillId));
  Store.saveProgress(state.progress);
  state.lastScore = score;
  go('results');
}

// ---- Results ----
function renderResults() {
  const sc = state.lastScore;
  const next = C.nextSkillId(sc.skillId);
  const accuracyPct = Math.round(sc.accuracy * 100);
  const badge = sc.mastered
    ? '<span class="badge ok">Mastered ✓</span>'
    : '<span class="badge warn">Keep practising</span>';

  let actions;
  if (sc.mastered && next) {
    actions = `<button class="btn btn-primary btn-block" id="next">Continue to ${C.skillLabel(next)}</button>
               <button class="btn btn-ghost" id="again">Practise this rung again</button>`;
  } else if (sc.mastered && !next) {
    actions = `<div class="parent-note">That's the top of this curriculum slice — every mapped topic mastered. More levels/grades can be added next.</div>
               <button class="btn btn-primary btn-block" id="again">Practise again</button>`;
  } else {
    actions = '<button class="btn btn-primary btn-block" id="again">Practise this rung again</button>';
  }

  paint(`
    <section class="card stack center">
      <h1>Session complete</h1>
      <div>${badge}</div>
      <h2>${C.skillLabel(sc.skillId)}</h2>
      <div class="stats">
        <div class="stat"><div class="num">${accuracyPct}%</div><div class="lbl">first-try correct</div></div>
        <div class="stat"><div class="num">${sc.eventually}/${sc.total}</div><div class="lbl">eventually right</div></div>
        <div class="stat"><div class="num">${sc.avgTimeSec.toFixed(1)}s</div><div class="lbl">avg time · target ${sc.timeTarget}s</div></div>
      </div>
      ${sc.mastered
        ? '<p class="muted">Fast and accurate — fluency reached. Time to move up.</p>'
        : `<p class="muted">Mastery needs ${Math.round(C.MASTERY_ACCURACY * 100)}% first-try correct${sc.speedOk ? '' : ' and a little more speed'}. Another round will get there.</p>`}
      <div class="stack">${actions}</div>
      <div class="row">
        <button class="btn btn-ghost grow" id="home">Home</button>
        <button class="btn btn-ghost grow" id="prog">Progress map</button>
      </div>
    </section>`);
  const nextBtn = document.getElementById('next');
  const againBtn = document.getElementById('again');
  if (nextBtn) nextBtn.onclick = () => startDrill(next);
  if (againBtn) againBtn.onclick = () => startDrill(sc.skillId);
  document.getElementById('home').onclick = () => go('home');
  document.getElementById('prog').onclick = () => go('progress');
}

// ---- Progress map ----
function renderProgress() {
  const cur = C.getActiveCurriculum();
  const p = cp();
  const groups = cur.groups.map((g) => {
    const rungs = C.skillsInGroup(g.id).map((skill) => {
      const m = p.mastery[skill.id];
      const isCurrent = skill.id === p.currentSkillId;
      const cls = m && m.mastered ? 'mastered' : isCurrent ? 'current' : 'todo';
      const mark = m && m.mastered ? '✓' : isCurrent ? '▶' : '·';
      const meta = m && m.mastered
        ? `best ${Math.round((m.bestAccuracy || 0) * 100)}%`
        : isCurrent ? 'current' : 'upcoming';
      const code = skill.code ? ` <span class="muted" style="font-size:12px">(${skill.code})</span>` : '';
      return `<div class="rung ${cls}">
        <span class="dot">${mark}</span>
        <span class="name">${skill.name}${code}</span>
        <span class="meta">${meta}</span>
      </div>`;
    }).join('');
    return `<div class="level-group">
      <p class="level-title">${g.name}${g.subtitle ? ` — ${g.subtitle}` : ''}</p>
      ${rungs}
    </div>`;
  }).join('');

  const pending = cur.pending && cur.pending.length
    ? `<div class="parent-note"><b>In the syllabus but not yet drillable here</b> — these need richer item types (word problems / bar models, money, measurement, shapes, charts): ${cur.pending.join('; ')}.</div>`
    : '';

  paint(`
    <section class="card stack">
      <div class="row between">
        <h1>Progress · ${cur.label}</h1>
        <span class="badge ok">${masteredCount()} / ${totalSkills()} mastered</span>
      </div>
      ${groups}
      <div class="parent-note"><b>How levels work:</b> like Kumon, learners climb by mastery, not age. A rung turns green only when answers are accurate and quick. Green rungs below the current one were proven during the placement check.</div>
      ${pending}
      <div class="row">
        <button class="btn btn-primary grow" id="practise">Practise current rung</button>
        <button class="btn btn-ghost" id="home">Home</button>
      </div>
      <button class="btn btn-ghost" id="switch">Switch curriculum</button>
      <button class="btn btn-ghost" id="reset">Reset all progress</button>
    </section>`);
  document.getElementById('practise').onclick = () => startDrill(p.currentSkillId);
  document.getElementById('home').onclick = () => go('home');
  document.getElementById('switch').onclick = () => go('pick');
  document.getElementById('reset').onclick = () => {
    if (window.confirm('Reset all MathPath progress for this learner?')) {
      state.progress = Store.resetProgress();
      go('pick');
    }
  };
}

// ---- boot ----
const tmLink = document.getElementById('tutormatch-link');
if (tmLink) tmLink.addEventListener('click', (e) => e.preventDefault()); // cross-promo placeholder

if (activeId()) {
  C.setActiveCurriculum(activeId());
  state.screen = 'home';
} else {
  state.screen = 'pick';
}
render();
