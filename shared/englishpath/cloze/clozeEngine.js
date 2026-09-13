// ELPath · Comprehension Cloze — adaptive engine.
// ----------------------------------------------------------------------------
// The practice unit is a whole passage (15 blanks). This layer tracks, per
// passage: attempts, best/last score, a Leitner box for spaced re-surfacing,
// cumulative per-skill accuracy (grammar / collocation / content), and — per
// blank — whether the student's last attempt on it was right (mistake
// tracking). It drives:
//   • selectNextPassageId — what to practise next (unseen → due → least-recent)
//   • skillReadiness       — how ready you are on each skill (the readiness rows)
//   • summarize            — the home-screen counters
//   • weakBlanks           — blanks currently missed, for a focus drill
//   • buildFocusPassage / recordFocusResult — assemble + grade that drill
// State is plain JSON so it persists in localStorage (see clozeStore.js) and can
// move to a server later behind the same shape.

const DAY = 24 * 60 * 60 * 1000;
export const CLOZE_INTERVALS_DAYS = [1, 2, 4, 9, 21]; // box 1..5, mirrors the vocab SRS
const MASTER_BOX = 5;
const ADVANCE_PCT = 80; // score ≥ this → box up
const RESET_PCT = 50; //   score < this → back to box 1
const SKILLS = ['grammar', 'collocation', 'content'];

export function initClozeState() {
  return { passages: {} };
}

const emptySkill = () => ({ grammar: { c: 0, t: 0 }, collocation: { c: 0, t: 0 }, content: { c: 0, t: 0 } });

const isBlankCorrect = (v) => v === 'correct';

// Fold one attempt's per-blank verdicts into a passage's blankStats: a blank
// missed this attempt gets its miss count bumped and is marked not-last-correct
// (so it shows up in weakBlanks); a blank answered right clears that flag —
// like vocab's weak-word list, getting it right again is what clears an entry,
// not time or a reset button.
function foldBlankStats(prevStats, perBlank) {
  const stats = { ...prevStats };
  for (const r of perBlank) {
    const p = stats[r.n] || { misses: 0, lastCorrect: true };
    const correct = isBlankCorrect(r.verdict);
    stats[r.n] = { misses: p.misses + (correct ? 0 : 1), lastCorrect: correct };
  }
  return stats;
}

// Record one graded attempt. `result` is the shape returned by gradePassage:
//   { score, total, bySkill: { <skill>: { correct, total } }, perBlank? }
// `perBlank` (each { n, verdict, ... }) is optional — pass it to also update
// per-blank mistake tracking; omit it and only the aggregate stats move.
export function recordAttempt(state, passageId, result, now = Date.now()) {
  if (!state || !passageId || !result) return state;
  const passages = { ...(state.passages || {}) };
  const prev = passages[passageId] || { attempts: 0, bestScore: 0, box: 1, bySkill: emptySkill(), blankStats: {} };
  const total = result.total || 0;
  const score = result.score || 0;
  const pct = total ? Math.round((score / total) * 100) : 0;

  // Leitner box: strong pass advances, weak attempt resets, middling holds.
  let box = prev.box || 1;
  if (pct >= ADVANCE_PCT) box = Math.min(MASTER_BOX, box + 1);
  else if (pct < RESET_PCT) box = 1;

  // Cumulative per-skill accuracy across attempts.
  const bySkill = emptySkill();
  for (const s of SKILLS) {
    bySkill[s] = { c: (prev.bySkill?.[s]?.c || 0), t: (prev.bySkill?.[s]?.t || 0) };
    const r = result.bySkill?.[s];
    if (r) { bySkill[s].c += r.correct || 0; bySkill[s].t += r.total || 0; }
  }

  const blankStats = Array.isArray(result.perBlank) ? foldBlankStats(prev.blankStats || {}, result.perBlank) : (prev.blankStats || {});

  passages[passageId] = {
    attempts: (prev.attempts || 0) + 1,
    bestScore: Math.max(prev.bestScore || 0, score),
    lastScore: score,
    lastTotal: total,
    lastPct: pct,
    lastAt: now,
    box,
    bySkill,
    blankStats,
  };
  return { ...state, passages };
}

function isDue(rec, now) {
  if (!rec || !rec.lastAt) return true;
  const interval = CLOZE_INTERVALS_DAYS[Math.min(rec.box, CLOZE_INTERVALS_DAYS.length) - 1] * DAY;
  return now - rec.lastAt >= interval;
}

// Choose the next passage to practise: an unseen one first (in bank order), then
// the weakest due-for-review passage, then simply the least-recently practised.
export function selectNextPassageId(state, { passages = [], now = Date.now() } = {}) {
  if (!passages.length) return null;
  const rec = (state && state.passages) || {};

  const unseen = passages.find((p) => !rec[p.id]);
  if (unseen) return unseen.id;

  const due = passages
    .filter((p) => isDue(rec[p.id], now))
    .sort((a, b) => (rec[a.id].box - rec[b.id].box) || (rec[a.id].lastAt - rec[b.id].lastAt));
  if (due.length) return due[0].id;

  // Nothing unseen or due — offer the least-recently practised for extra reps.
  return passages.slice().sort((a, b) => (rec[a.id]?.lastAt || 0) - (rec[b.id]?.lastAt || 0))[0].id;
}

// Per-skill readiness (0..100) from cumulative accuracy across all attempts.
export function skillReadiness(state) {
  const rec = (state && state.passages) || {};
  const tot = emptySkill();
  for (const id of Object.keys(rec)) {
    for (const s of SKILLS) {
      tot[s].c += rec[id].bySkill?.[s]?.c || 0;
      tot[s].t += rec[id].bySkill?.[s]?.t || 0;
    }
  }
  const out = {};
  for (const s of SKILLS) out[s] = tot[s].t ? Math.round((tot[s].c / tot[s].t) * 100) : 0;
  return out;
}

export function summarizeCloze(state, { passages = [], now = Date.now() } = {}) {
  const rec = (state && state.passages) || {};
  const total = passages.length;
  const seenIds = passages.filter((p) => rec[p.id]);
  const done = seenIds.length;
  const mastered = seenIds.filter((p) => rec[p.id].box >= MASTER_BOX).length;
  const dueNow = passages.filter((p) => !rec[p.id] || isDue(rec[p.id], now)).length;
  const bySkill = skillReadiness(state);
  const vals = SKILLS.map((s) => bySkill[s]);
  const overall = done ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  return {
    counts: { total, done, mastered, dueNow },
    readiness: { overall, bySkill },
    nextId: selectNextPassageId(state, { passages, now }),
  };
}

// ---- mistake tracking -------------------------------------------------------
// The unit of "a word you keep getting wrong" in cloze is a specific blank in a
// specific passage (its correct answer is contextual, not a standalone word).
// A blank qualifies once its last attempt was wrong; answering it right again
// — in the focus drill below or by replaying the full passage — clears it,
// mirroring the vocab module's weak-word list.

/** Blanks the student is currently missing, richest-context first. */
export function weakBlanks(state, { passages = [] } = {}) {
  const rec = (state && state.passages) || {};
  const byId = new Map(passages.map((p) => [p.id, p]));
  const out = [];
  for (const [passageId, prec] of Object.entries(rec)) {
    const passage = byId.get(passageId);
    if (!passage) continue; // bank changed since this was recorded
    for (const [nStr, bs] of Object.entries(prec.blankStats || {})) {
      if (bs.lastCorrect !== false) continue;
      const n = Number(nStr);
      const blank = passage.blanks.find((b) => b.n === n);
      if (!blank) continue;
      out.push({
        passageId,
        passageTitle: passage.title,
        n,
        misses: bs.misses,
        skill: blank.skill,
        note: blank.note,
        accept: blank.accept,
      });
    }
  }
  return out.sort((a, b) => b.misses - a.misses || a.passageTitle.localeCompare(b.passageTitle));
}

/** The paragraph containing blank `n`, with every OTHER blank in it filled in
 * (its first accepted answer) so it reads naturally — only `n` stays open. */
function extractSnippet(passage, n) {
  const para = passage.text.split('\n\n').find((p) => p.includes(`{${n}}`));
  if (!para) return null;
  return para.replace(/\{(\d+)\}/g, (m, numStr) => {
    const num = Number(numStr);
    if (num === n) return m; // keep the target blank open
    const other = passage.blanks.find((b) => b.n === num);
    return other ? other.accept[0] : m;
  });
}

/**
 * Assemble a synthetic mini-passage out of the current weak blanks' sentences,
 * renumbered 1..N so it can be graded with the normal gradePassage(). Returns
 * null when there's nothing to drill. `mapping[i]` routes the i-th synthetic
 * blank back to its real { passageId, n } so results can be folded back in.
 */
export function buildFocusPassage(state, { passages = [], limit = 10 } = {}) {
  const weak = weakBlanks(state, { passages }).slice(0, limit);
  if (!weak.length) return null;
  const byId = new Map(passages.map((p) => [p.id, p]));
  const parts = [];
  const blanks = [];
  const mapping = [];
  weak.forEach((w, i) => {
    const passage = byId.get(w.passageId);
    const snippet = passage && extractSnippet(passage, w.n);
    if (!snippet) return;
    const synN = i + 1;
    parts.push(snippet.replace(new RegExp(`\\{${w.n}\\}`), `{${synN}}`));
    blanks.push({ n: synN, accept: w.accept, skill: w.skill, note: w.note });
    mapping.push({ n: synN, passageId: w.passageId, n0: w.n });
  });
  if (!blanks.length) return null;
  return { id: 'cloze_focus', level: null, title: 'Tricky blanks', text: parts.join('\n\n'), blanks, mapping };
}

/**
 * Fold a focus-drill's grading result back onto the real passages' blankStats,
 * using the mapping buildFocusPassage attached to its synthetic passage.
 */
export function recordFocusResult(state, mapping, perBlank) {
  let next = state;
  const byN = new Map(perBlank.map((r) => [r.n, r]));
  const byPassage = new Map();
  for (const m of mapping) {
    const r = byN.get(m.n);
    if (!r) continue;
    if (!byPassage.has(m.passageId)) byPassage.set(m.passageId, []);
    byPassage.get(m.passageId).push({ n: m.n0, verdict: r.verdict });
  }
  for (const [passageId, perBlankForPassage] of byPassage) {
    const passages = { ...(next.passages || {}) };
    const prev = passages[passageId];
    if (!prev) continue;
    passages[passageId] = { ...prev, blankStats: foldBlankStats(prev.blankStats || {}, perBlankForPassage) };
    next = { ...next, passages };
  }
  return next;
}
