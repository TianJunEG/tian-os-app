/**
 * Times-Tables Fluency Engine
 * Pure functions for weighted question generation, fact-strength tracking,
 * session scoring, and integration with the mistake-review system.
 */

// ─── constants ───────────────────────────────────────────────────────
export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const QUIZ_LENGTH = 10;
export const FLUENCY_THRESHOLD_MS = 4000; // under 4 s = "fluent" recall

export const STRENGTH = {
  NEW: 'new',
  WEAK: 'weak',
  DEVELOPING: 'developing',
  SECURE: 'secure',
};

// ─── helpers ─────────────────────────────────────────────────────────

/** Canonical key – smaller factor first so 3×7 and 7×3 share one record. */
export function factKey(a, b) {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}

/** Every unique pair where a ≤ b, within the given table list. */
export function allFactPairs(tables = TABLES) {
  const pairs = [];
  for (const a of tables) {
    for (const b of tables) {
      if (a <= b) pairs.push([a, b]);
    }
  }
  return pairs;
}

/** Build a blank factState keyed by canonical fact keys. */
export function initialFactState(tables = TABLES) {
  const state = {};
  for (const [a, b] of allFactPairs(tables)) {
    state[factKey(a, b)] = {
      key: factKey(a, b),
      a,
      b,
      strength: STRENGTH.NEW,
      correct: 0,
      incorrect: 0,
      totalMs: 0,
      attempts: 0,
      lastSeen: null,
    };
  }
  return state;
}

// ─── question generation ─────────────────────────────────────────────

/**
 * Weighted-random selection: weak / new facts appear more often.
 * Returns an array of { a, b, product } questions.
 */
export function generateQuestions(factState = {}, tables = TABLES, count = QUIZ_LENGTH) {
  const weights = {
    [STRENGTH.NEW]: 4,
    [STRENGTH.WEAK]: 3,
    [STRENGTH.DEVELOPING]: 2,
    [STRENGTH.SECURE]: 1,
  };

  const pool = allFactPairs(tables).map(([a, b]) => {
    const key = factKey(a, b);
    const rec = factState[key] || { strength: STRENGTH.NEW };
    return { a, b, weight: weights[rec.strength] || 2 };
  });

  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  const questions = [];
  const used = new Set();

  for (let i = 0; i < count && used.size < pool.length; i++) {
    let rand = Math.random() * totalWeight;
    for (const item of pool) {
      const key = factKey(item.a, item.b);
      if (used.has(key)) continue;
      rand -= item.weight;
      if (rand <= 0) {
        // Randomly swap operand order for variety
        const swap = Math.random() < 0.5;
        questions.push({
          a: swap ? item.b : item.a,
          b: swap ? item.a : item.b,
          product: item.a * item.b,
        });
        used.add(key);
        break;
      }
    }
  }
  return questions;
}

// ─── fact record update ──────────────────────────────────────────────

/** Update a single fact record after one attempt. Returns the updated record. */
export function updateFactRecord(record, { correct, timeMs }) {
  const r = { ...record };
  r.attempts += 1;
  r.lastSeen = Date.now();
  if (correct) {
    r.correct += 1;
    r.totalMs += timeMs || 0;
  } else {
    r.incorrect += 1;
  }

  // Classify strength
  if (r.correct === 0) {
    r.strength = r.attempts > 0 ? STRENGTH.WEAK : STRENGTH.NEW;
  } else {
    const avgMs = r.totalMs / r.correct;
    const accuracy = r.correct / r.attempts;
    if (accuracy >= 0.85 && avgMs <= FLUENCY_THRESHOLD_MS) {
      r.strength = STRENGTH.SECURE;
    } else if (accuracy >= 0.6) {
      r.strength = STRENGTH.DEVELOPING;
    } else {
      r.strength = STRENGTH.WEAK;
    }
  }
  return r;
}

// ─── session scoring ─────────────────────────────────────────────────

/**
 * Score a whole quiz session.
 * @param {Object} factState - current fact state
 * @param {Array}  results   - [{ a, b, correct, timeMs }]
 * @returns {{ updatedFactState, sessionStats }}
 */
export function scoreSession(factState, results = []) {
  const updated = { ...factState };
  let totalCorrect = 0;
  let totalMs = 0;

  for (const r of results) {
    const key = factKey(r.a, r.b);
    const prev = updated[key] || {
      key, a: Math.min(r.a, r.b), b: Math.max(r.a, r.b),
      strength: STRENGTH.NEW, correct: 0, incorrect: 0, totalMs: 0, attempts: 0, lastSeen: null,
    };
    updated[key] = updateFactRecord(prev, { correct: r.correct, timeMs: r.timeMs });
    if (r.correct) {
      totalCorrect++;
      totalMs += r.timeMs || 0;
    }
  }

  const accuracy = results.length ? totalCorrect / results.length : 0;
  const avgTimeMs = totalCorrect ? totalMs / totalCorrect : 0;
  const secureCount = Object.values(updated).filter((f) => f.strength === STRENGTH.SECURE).length;
  const totalFacts = Object.keys(updated).length;

  let fluencyLabel;
  if (accuracy >= 0.9 && avgTimeMs <= FLUENCY_THRESHOLD_MS) fluencyLabel = 'Fluent';
  else if (accuracy >= 0.7) fluencyLabel = 'Developing';
  else fluencyLabel = 'Emerging';

  return {
    updatedFactState: updated,
    sessionStats: {
      total: results.length,
      correct: totalCorrect,
      accuracy,
      avgTimeMs,
      fluencyLabel,
      secureCount,
      totalFacts,
    },
  };
}

// ─── mistake-review integration ──────────────────────────────────────

const TIMES_TABLE_RE = /(\d+)\s*[×x*]\s*(\d+)/i;

/** True if the mistake's questionStem looks like a times-table question. */
export function isTimesTableMistake(mistake) {
  const stem = mistake?.questionStem || mistake?.questionText || '';
  return TIMES_TABLE_RE.test(stem);
}

/**
 * Separate times-table mistakes from non-table mistakes and produce a
 * summary suitable for the grouped UI card.
 */
export function groupTimesTableMistakes(mistakes = []) {
  const tableMistakes = [];
  const nonTableMistakes = [];
  const weakFacts = new Set();

  for (const m of mistakes) {
    if (isTimesTableMistake(m)) {
      tableMistakes.push(m);
      const match = (m.questionStem || m.questionText || '').match(TIMES_TABLE_RE);
      if (match) weakFacts.add(factKey(Number(match[1]), Number(match[2])));
    } else {
      nonTableMistakes.push(m);
    }
  }

  return {
    tableMistakes,
    nonTableMistakes,
    weakFacts: [...weakFacts],
    hasTableMistakes: tableMistakes.length > 0,
    count: tableMistakes.length,
  };
}
