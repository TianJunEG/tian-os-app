// EnglishPath · Vocabulary Builder — adaptive engine
// ----------------------------------------------------------------------------
// Decides what to put in front of the student next and tracks how well they
// know each word. Two ideas drive it:
//
//  1. The ladder (per word). A new word starts at the bottom rung ("meet the
//     word") and only climbs once the lower rungs are answered correctly. The
//     authoritative ladder for a word is the set of task types that actually
//     generate a question for it, so progression never stalls.
//
//  2. Spaced repetition (per word). Once a word has climbed the whole ladder it
//     graduates into a Leitner review schedule — correct answers push the
//     review further out (1 → 2 → 4 → 9 → 21 days), a slip pulls it back in.
//
// All functions are pure: they take state + the current time (`now`, ms) and
// return new state, so sessions are deterministic and unit-testable.

import { TASK_TYPE_BY_ID, MAX_TIER, VOCAB_EXAM_SECTIONS } from './vocabularyModel.js';
import {
  vocabularyWordBank,
  wordBankById,
} from './vocabularyWordBank.js';
import { generatableTaskTypes, generateTask, makeRng } from './vocabularyTaskGenerator.js';

const DAY_MS = 86_400_000;
// Leitner review intervals in days, indexed by box 1..5.
const BOX_INTERVAL_DAYS = [1, 2, 4, 9, 21];

export const DEFAULT_CONFIG = {
  maxActiveLearning: 6, // how many words may be mid-ladder at once
  sessionSize: 10,
};

export function initState(config = {}) {
  return { words: {}, config: { ...DEFAULT_CONFIG, ...config } };
}

function freshProgress(wordId) {
  return {
    wordId,
    introduced: false,
    taskStats: {}, // taskType -> { attempts, correct, streak }
    box: 0, // 0 = still on the ladder (not yet in spaced review)
    dueAt: null,
    lapses: 0,
    mastered: false,
    confusions: {}, // chosen wrong text -> count
    lastSeenAt: null,
  };
}

function cloneProgress(wp) {
  return {
    ...wp,
    taskStats: Object.fromEntries(Object.entries(wp.taskStats).map(([k, v]) => [k, { ...v }])),
    confusions: { ...wp.confusions },
  };
}

function cloneState(state) {
  return {
    config: { ...state.config },
    words: Object.fromEntries(Object.entries(state.words).map(([k, v]) => [k, cloneProgress(v)])),
  };
}

function entryFor(wordId, bank) {
  return bank.find((w) => w.id === wordId) || wordBankById[wordId] || null;
}

function ladderFor(entry, bank) {
  return generatableTaskTypes(entry, { bank });
}

function correctCount(wp, taskType) {
  return wp.taskStats[taskType]?.correct || 0;
}

/** Task types not yet answered correctly, in ladder order. */
function pendingTaskTypes(wp, entry, bank) {
  return ladderFor(entry, bank).filter((tt) => correctCount(wp, tt) === 0);
}

function ladderComplete(wp, entry, bank) {
  return wp.introduced && pendingTaskTypes(wp, entry, bank).length === 0;
}

/** Highest ladder tier the student has answered correctly for this word (0..MAX_TIER). */
export function highestTierPassed(wp) {
  let best = 0;
  for (const [tt, stat] of Object.entries(wp.taskStats)) {
    if (stat.correct > 0) best = Math.max(best, TASK_TYPE_BY_ID[tt]?.tier || 0);
  }
  return best;
}

function intervalForBox(box) {
  return BOX_INTERVAL_DAYS[Math.min(BOX_INTERVAL_DAYS.length, Math.max(1, box)) - 1] * DAY_MS;
}

// ---- recording results ----------------------------------------------------

/**
 * Record one answered task and return the new state.
 * `result` = { wordId, taskType, correct, chosenText? }.
 * `meet_word` (the teach card) just marks the word introduced.
 */
export function recordResult(state, result, { now = Date.now(), bank = vocabularyWordBank } = {}) {
  const { wordId, taskType, correct, chosenText } = result;
  const entry = entryFor(wordId, bank);
  if (!entry) throw new Error(`Unknown word: ${wordId}`);
  const next = cloneState(state);
  const wp = (next.words[wordId] ||= freshProgress(wordId));
  wp.introduced = true;
  wp.lastSeenAt = now;

  if (taskType === 'meet_word') {
    return next; // encounter only — not graded
  }

  const stat = (wp.taskStats[taskType] ||= { attempts: 0, correct: 0, streak: 0 });
  stat.attempts += 1;
  if (correct) {
    stat.correct += 1;
    stat.streak += 1;
  } else {
    stat.streak = 0;
    if (chosenText) wp.confusions[chosenText] = (wp.confusions[chosenText] || 0) + 1;
  }

  const wasComplete = wp.box > 0; // box is only set once the ladder is complete
  if (!wasComplete) {
    // Learning phase — check whether this answer completed the ladder.
    if (ladderComplete(wp, entry, bank)) {
      wp.box = 1;
      wp.dueAt = now + intervalForBox(1);
    }
  } else {
    // Spaced-review phase.
    if (correct) {
      wp.box = Math.min(BOX_INTERVAL_DAYS.length, wp.box + 1);
    } else {
      wp.box = Math.max(1, wp.box - 1);
      wp.lapses += 1;
    }
    wp.dueAt = now + intervalForBox(wp.box);
  }

  wp.mastered = wp.box >= BOX_INTERVAL_DAYS.length && ladderComplete(wp, entry, bank);
  return next;
}

// ---- selecting what comes next --------------------------------------------

function activeLearningWords(state, bank) {
  return Object.values(state.words).filter(
    (wp) => wp.introduced && wp.box === 0 && !ladderComplete(wp, entryFor(wp.wordId, bank), bank)
  );
}

function dueReviewWords(state, bank, now) {
  return Object.values(state.words)
    .filter((wp) => wp.box > 0 && wp.dueAt != null && wp.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}

function reviewTaskType(wp, entry, bank) {
  const ladder = ladderFor(entry, bank);
  // Prefer an exam-form task; otherwise the highest rung available.
  const examForm = ladder.filter((tt) => TASK_TYPE_BY_ID[tt].tier === MAX_TIER);
  const pool = examForm.length ? examForm : ladder.slice(-2);
  return pool[pool.length - 1] || ladder[ladder.length - 1] || null;
}

function learningPriority(a, b) {
  // 1) words with a fresh slip first, 2) lower tier first, 3) least recently seen
  const slipA = hasFreshSlip(a) ? 0 : 1;
  const slipB = hasFreshSlip(b) ? 0 : 1;
  if (slipA !== slipB) return slipA - slipB;
  const tierA = highestTierPassed(a);
  const tierB = highestTierPassed(b);
  if (tierA !== tierB) return tierA - tierB;
  return (a.lastSeenAt || 0) - (b.lastSeenAt || 0);
}

function hasFreshSlip(wp) {
  return Object.values(wp.taskStats).some((s) => s.attempts > 0 && s.streak === 0);
}

/**
 * Choose the next thing to show, as a descriptor { wordId, taskType, mode }.
 * Priority: due reviews → finish in-progress words → introduce a new word.
 * Returns null only when nothing is due and there are no words left to learn.
 */
export function selectNextDescriptor(state, { now = Date.now(), bank = vocabularyWordBank } = {}) {
  // 1) due spaced reviews
  const due = dueReviewWords(state, bank, now);
  if (due.length) {
    const wp = due[0];
    const entry = entryFor(wp.wordId, bank);
    return { wordId: wp.wordId, taskType: reviewTaskType(wp, entry, bank), mode: 'review' };
  }
  // 2) words mid-ladder
  const learning = activeLearningWords(state, bank).sort(learningPriority);
  if (learning.length) {
    const wp = learning[0];
    const entry = entryFor(wp.wordId, bank);
    const pending = pendingTaskTypes(wp, entry, bank);
    if (pending.length) return { wordId: wp.wordId, taskType: pending[0], mode: 'learn' };
  }
  // 3) introduce a new word if there is room
  if (activeLearningWords(state, bank).length < state.config.maxActiveLearning) {
    const fresh = bank.find((w) => !state.words[w.id] || !state.words[w.id].introduced);
    if (fresh) return { wordId: fresh.id, taskType: 'meet_word', mode: 'new' };
  }
  // 4) nothing due — offer the soonest upcoming review as optional practice
  const upcoming = Object.values(state.words)
    .filter((wp) => wp.box > 0 && wp.dueAt != null)
    .sort((a, b) => a.dueAt - b.dueAt)[0];
  if (upcoming) {
    const entry = entryFor(upcoming.wordId, bank);
    return { wordId: upcoming.wordId, taskType: reviewTaskType(upcoming, entry, bank), mode: 'review-ahead' };
  }
  return null;
}

/** Select and render the next task (or null). */
export function selectNextTask(state, { now = Date.now(), bank = vocabularyWordBank, rng = makeRng(now >>> 0 || 1) } = {}) {
  const desc = selectNextDescriptor(state, { now, bank });
  if (!desc) return null;
  const entry = entryFor(desc.wordId, bank);
  const task = generateTask(entry, desc.taskType, { bank, rng });
  return task ? { ...task, mode: desc.mode } : null;
}

/**
 * Plan a mixed session of distinct tasks. Reviews come first (spaced practice),
 * then in-progress words advance one rung each, then new words are introduced
 * (each as a "meet the word" card followed by its first recognition check).
 */
export function buildSession(state, { size, now = Date.now(), bank = vocabularyWordBank, rng = makeRng(now >>> 0 || 1) } = {}) {
  const limit = size || state.config.sessionSize;
  const descriptors = [];
  const usedWords = new Set();

  for (const wp of dueReviewWords(state, bank, now)) {
    if (descriptors.length >= limit) break;
    const entry = entryFor(wp.wordId, bank);
    descriptors.push({ wordId: wp.wordId, taskType: reviewTaskType(wp, entry, bank), mode: 'review' });
    usedWords.add(wp.wordId);
  }

  for (const wp of activeLearningWords(state, bank).sort(learningPriority)) {
    if (descriptors.length >= limit) break;
    if (usedWords.has(wp.wordId)) continue;
    const entry = entryFor(wp.wordId, bank);
    const pending = pendingTaskTypes(wp, entry, bank);
    if (pending.length) {
      descriptors.push({ wordId: wp.wordId, taskType: pending[0], mode: 'learn' });
      usedWords.add(wp.wordId);
    }
  }

  // New words: teach a batch first, THEN quiz them, so the first question is
  // genuine recall rather than an immediate echo of the meaning we just showed.
  const room = state.config.maxActiveLearning - activeLearningWords(state, bank).length;
  const slotsLeft = limit - descriptors.length;
  const fresh = [];
  for (const w of bank) {
    if (fresh.length >= room) break;
    if (state.words[w.id]?.introduced || usedWords.has(w.id)) continue;
    fresh.push(w);
  }
  // Each new word needs a meet card + a question, so only take as many as fit.
  const newCount = Math.min(fresh.length, Math.floor(slotsLeft / 2));
  const chosen = fresh.slice(0, newCount);
  for (const w of chosen) descriptors.push({ wordId: w.id, taskType: 'meet_word', mode: 'new' });
  for (const w of chosen) descriptors.push({ wordId: w.id, taskType: firstGradedRung(w, bank), mode: 'new' });

  return descriptors
    .slice(0, limit)
    .map((d) => {
      const entry = entryFor(d.wordId, bank);
      const task = generateTask(entry, d.taskType, { bank, rng });
      return task ? { ...task, mode: d.mode } : null;
    })
    .filter(Boolean);
}

function firstGradedRung(entry, bank) {
  return ladderFor(entry, bank)[0] || 'meaning_match';
}

// ---- weak-word focus mode --------------------------------------------------

/** Total wrong answers across every rung this word has been tried on. */
function missCount(wp) {
  let wrong = 0;
  for (const s of Object.values(wp.taskStats)) wrong += Math.max(0, s.attempts - s.correct);
  return wrong;
}

/**
 * Words the student is currently struggling with — the material for a focused
 * remediation drill. A word qualifies when it has an unresolved slip (its last
 * answer on some rung was wrong) or it lapsed in spaced review and is not yet
 * re-mastered. Getting it right again clears it, so the list shrinks as the
 * student improves rather than remembering every historical mistake forever.
 */
export function weakWords(state, { bank = vocabularyWordBank } = {}) {
  const out = [];
  for (const wp of Object.values(state.words)) {
    if (!wp.introduced) continue;
    const struggling = hasFreshSlip(wp) || (wp.lapses > 0 && !wp.mastered);
    if (!struggling) continue;
    const entry = entryFor(wp.wordId, bank);
    if (!entry) continue;
    const attempts = Object.values(wp.taskStats).reduce((n, s) => n + s.attempts, 0);
    const misses = missCount(wp) + wp.lapses;
    out.push({
      wordId: wp.wordId,
      word: entry.word,
      misses,
      lapses: wp.lapses,
      accuracy: attempts ? (attempts - missCount(wp)) / attempts : 0,
      topConfusion: topKey(wp.confusions),
      mastered: wp.mastered,
      lastSeenAt: wp.lastSeenAt || 0,
    });
  }
  // Most-missed first, then lowest accuracy, then alphabetical for stability.
  return out.sort(
    (a, b) => b.misses - a.misses || a.accuracy - b.accuracy || String(a.word).localeCompare(String(b.word))
  );
}

/** The rung this word is weakest on — most misses, else its exam-form rung. */
function weakestTaskType(wp, entry, bank) {
  const ladder = ladderFor(entry, bank);
  let worst = null;
  let worstMiss = 0;
  for (const tt of ladder) {
    const s = wp.taskStats[tt];
    if (!s || s.attempts === 0) continue;
    const miss = s.attempts - s.correct;
    if (miss > worstMiss) {
      worstMiss = miss;
      worst = tt;
    }
  }
  return worst || reviewTaskType(wp, entry, bank);
}

/**
 * Build a session made only of the student's weak words, each re-tested on the
 * rung it was weakest on. Unlike buildSession this introduces no new words — it
 * is a concentrated drill of exactly the gaps before an exam.
 *
 * Words are drilled least-recently-practised first (not most-missed first), so
 * repeated drills work through the WHOLE backlog and old tricky words aren't
 * permanently buried under a fresh batch of mistakes. Answering one correctly
 * clears it; getting it wrong pushes it to the back of the queue to come round
 * again — so nothing is lost.
 */
export function buildFocusSession(
  state,
  { size, bank = vocabularyWordBank, now = Date.now(), rng = makeRng(now >>> 0 || 1) } = {}
) {
  const limit = size || state.config.sessionSize;
  const weak = weakWords(state, { bank }).slice().sort((a, b) => a.lastSeenAt - b.lastSeenAt);
  return weak
    .slice(0, limit)
    .map((w) => {
      const entry = entryFor(w.wordId, bank);
      const wp = state.words[w.wordId];
      const task = generateTask(entry, weakestTaskType(wp, entry, bank), { bank, rng });
      return task ? { ...task, mode: 'focus' } : null;
    })
    .filter(Boolean);
}

// ---- cold-word probe -------------------------------------------------------

/**
 * A measurement task on a word the learner has NEVER been introduced to — a
 * quiet check of whether their vocabulary is genuinely growing (transfer to
 * unseen words), separate from the words they've drilled. The result is meant
 * to be logged, NOT fed back into progress (recordResult), so probing never
 * inflates "words learned" or perturbs the ladder. Returns null once every word
 * has been seen. `mode: 'probe'` and `probe: true` mark it for the caller.
 */
export function buildColdProbe(state, { bank = vocabularyWordBank, now = Date.now(), rng = makeRng(now >>> 0 || 1) } = {}) {
  const unseen = bank.filter((w) => !state.words[w.id] || !state.words[w.id].introduced);
  if (!unseen.length) return null;
  const entry = unseen[Math.floor(rng() * unseen.length)];
  const task = generateTask(entry, 'meaning_match', { bank, rng });
  return task ? { ...task, mode: 'probe', probe: true } : null;
}

// ---- progress summary ------------------------------------------------------

/** A learner-facing snapshot: counts, per-word progress and exam-section readiness. */
export function summarize(state, { bank = vocabularyWordBank, now = Date.now() } = {}) {
  const words = Object.values(state.words);
  const introduced = words.filter((w) => w.introduced);
  const mastered = introduced.filter((w) => w.mastered);
  const inReview = introduced.filter((w) => w.box > 0 && !w.mastered);
  const learning = introduced.filter((w) => w.box === 0);
  const due = dueReviewWords(state, bank, now);

  const perWord = introduced.map((wp) => {
    const entry = entryFor(wp.wordId, bank);
    const ladder = ladderFor(entry, bank);
    const done = ladder.filter((tt) => correctCount(wp, tt) > 0).length;
    return {
      wordId: wp.wordId,
      word: entry?.word,
      tier: highestTierPassed(wp),
      ladderProgress: ladder.length ? done / ladder.length : 0,
      box: wp.box,
      mastered: wp.mastered,
      dueAt: wp.dueAt,
      lapses: wp.lapses,
      topConfusion: topKey(wp.confusions),
    };
  });

  return {
    counts: {
      total: bank.length,
      introduced: introduced.length,
      learning: learning.length,
      inReview: inReview.length,
      mastered: mastered.length,
      dueNow: due.length,
    },
    examReadiness: examReadiness(state, bank),
    perWord,
  };
}

/** Estimate 0–100 readiness for each vocabulary exam section. */
export function examReadiness(state, bank = vocabularyWordBank) {
  const out = {};
  for (const section of Object.values(VOCAB_EXAM_SECTIONS)) {
    let sum = 0;
    let n = 0;
    for (const entry of bank) {
      const sectionTasks = ladderFor(entry, bank).filter((tt) => TASK_TYPE_BY_ID[tt].examSection === section);
      if (!sectionTasks.length) continue;
      n += 1;
      const wp = state.words[entry.id];
      if (!wp || !wp.introduced) continue;
      // credit = how high up this section's rungs the student has climbed
      const topTier = Math.max(
        0,
        ...sectionTasks.filter((tt) => correctCount(wp, tt) > 0).map((tt) => TASK_TYPE_BY_ID[tt].tier)
      );
      sum += Math.min(1, topTier / MAX_TIER) * (wp.mastered ? 1 : 0.9);
    }
    out[section] = n ? Math.round((sum / n) * 100) : 0;
  }
  return out;
}

function topKey(obj) {
  let best = null;
  let bestN = 0;
  for (const [k, v] of Object.entries(obj || {})) {
    if (v > bestN) {
      best = k;
      bestN = v;
    }
  }
  return best;
}
