// ELPath · Comprehension Cloze — adaptive engine.
// ----------------------------------------------------------------------------
// The practice unit is a whole passage (15 blanks). This layer tracks, per
// passage: attempts, best/last score, a Leitner box for spaced re-surfacing, and
// cumulative per-skill accuracy (grammar / collocation / content). It drives:
//   • selectNextPassageId — what to practise next (unseen → due → least-recent)
//   • skillReadiness       — how ready you are on each skill (the readiness rows)
//   • summarize            — the home-screen counters
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

// Record one graded attempt. `result` is the shape returned by gradePassage:
//   { score, total, bySkill: { <skill>: { correct, total } } }
export function recordAttempt(state, passageId, result, now = Date.now()) {
  if (!state || !passageId || !result) return state;
  const passages = { ...(state.passages || {}) };
  const prev = passages[passageId] || { attempts: 0, bestScore: 0, box: 1, bySkill: emptySkill() };
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

  passages[passageId] = {
    attempts: (prev.attempts || 0) + 1,
    bestScore: Math.max(prev.bestScore || 0, score),
    lastScore: score,
    lastTotal: total,
    lastPct: pct,
    lastAt: now,
    box,
    bySkill,
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
