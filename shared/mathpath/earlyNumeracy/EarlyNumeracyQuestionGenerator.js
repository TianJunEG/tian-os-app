// Question generator for Early Numeracy (K2) — Strand A: Counting & Number.
//
// Every question is tap-to-answer MCQ with a visual: counting/comparison
// diagrams ({kind:'count'|'compare'}) or the apple add/subtract stem the
// lower-primary UI already renders via parseDotStem. No free-text, minimal
// reading, audio-first (the client auto-reads the prompt). See
// docs/k2-numeracy-scope.md.

import { getSkill } from './EarlyNumeracySkillGraph.js';

// ── Seeded RNG (deterministic per session+skill for reproducible tests) ──────
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rint(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FRUITS = ['🍎', '🍓', '🍊', '🍇', '🍌'];

// Build MCQ number choices around a correct numeric answer (no negatives, deduped).
function numberChoices(rng, correct, { min = 0, max = 20, span = 3 } = {}) {
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < 4 && guard < 50) {
    guard += 1;
    const delta = rint(rng, -span, span);
    const cand = correct + delta;
    if (cand >= min && cand <= max) set.add(cand);
  }
  // top up if the window was too tight
  let n = min;
  while (set.size < 4 && n <= max) { set.add(n); n += 1; }
  return shuffle(rng, [...set].slice(0, 4)).map(String);
}

function mcq({ skill, familySuffix, prompt, correct, choices, diagram, misconceptionTag }) {
  return {
    skillId: skill.id,
    questionFamilyId: `QF_${skill.id}_${familySuffix}`,
    type: 'mcq',
    prompt,
    choices,
    answer: { display: String(correct) },
    acceptedAnswers: [String(correct)],
    solutionSteps: [],
    misconceptionTag: misconceptionTag || (skill.misconceptions || [])[0] || '',
    difficulty: skill.difficulty || 1,
    workingRequired: false,
    ...(diagram ? { diagram } : {}),
  };
}

// ── Per-skill question builders ──────────────────────────────────────────────
function genCount(rng, skill, { min, max }) {
  const fruit = pick(rng, FRUITS);
  // Two flavours: count-the-objects, and what-comes-next.
  if (rng() < 0.7) {
    const n = rint(rng, min, max);
    return mcq({
      skill, familySuffix: '001',
      prompt: 'Count them. How many?',
      correct: n,
      choices: numberChoices(rng, n, { min: Math.max(0, min - 1), max: max + 2 }),
      diagram: { kind: 'count', emoji: fruit, count: n },
    });
  }
  const x = rint(rng, min, max - 1);
  return mcq({
    skill, familySuffix: '002',
    prompt: `What number comes after ${x}?`,
    correct: x + 1,
    choices: numberChoices(rng, x + 1, { min: Math.max(0, min - 1), max: max + 2, span: 2 }),
  });
}

function genNumerals(rng, skill) {
  const fruit = pick(rng, FRUITS);
  if (rng() < 0.6) {
    const n = rint(rng, 0, 10);
    return mcq({
      skill, familySuffix: '001',
      prompt: 'Which number shows how many?',
      correct: n,
      choices: numberChoices(rng, n, { min: 0, max: 10 }),
      diagram: { kind: 'count', emoji: fruit, count: n },
    });
  }
  let a = rint(rng, 0, 10);
  let b = rint(rng, 0, 10);
  if (a === b) b = (b + 1) % 11;
  const bigger = Math.max(a, b);
  return mcq({
    skill, familySuffix: '002',
    prompt: `Which number is bigger: ${a} or ${b}?`,
    correct: bigger,
    choices: shuffle(rng, [String(a), String(b)]),
    misconceptionTag: 'en/numeral-quantity-mismatch',
  });
}

function genCompare(rng, skill) {
  const [f1, f2] = shuffle(rng, FRUITS).slice(0, 2);
  let left = rint(rng, 1, 9);
  let right = rint(rng, 1, 9);
  // 1-in-4 chance of an equal ("same as") item.
  if (rng() < 0.25) right = left;
  const diagram = { kind: 'compare', left: { emoji: f1, count: left }, right: { emoji: f2, count: right } };
  if (left === right) {
    return mcq({
      skill, familySuffix: '003',
      prompt: `Are there more ${f1}, more ${f2}, or the same?`,
      correct: 'Same',
      choices: shuffle(rng, [f1, f2, 'Same']),
      diagram,
      misconceptionTag: 'en/confuses-more-fewer',
    });
  }
  const more = left > right ? f1 : f2;
  return mcq({
    skill, familySuffix: '001',
    prompt: `Which has more — ${f1} or ${f2}?`,
    correct: more,
    choices: shuffle(rng, [f1, f2, 'Same']),
    diagram,
    misconceptionTag: 'en/longer-row-is-more',
  });
}

function genBonds(rng, skill) {
  const whole = rint(rng, 4, 10);
  const part = rint(rng, 1, whole - 1);
  const other = whole - part;
  return mcq({
    skill, familySuffix: '001',
    prompt: `${whole} is made of ${part} and ___?`,
    correct: other,
    choices: numberChoices(rng, other, { min: 0, max: whole }),
    diagram: { kind: 'count', emoji: pick(rng, FRUITS), count: whole },
    misconceptionTag: 'en/part-whole-confusion',
  });
}

function genAddWithin10(rng, skill) {
  const a = rint(rng, 1, 8);
  const b = rint(rng, 1, 10 - a);
  // Prompt form "a + b = ?" so the existing apple ManipulativeDotArray renders.
  return mcq({
    skill, familySuffix: '001',
    prompt: `${a} + ${b} = ?`,
    correct: a + b,
    choices: numberChoices(rng, a + b, { min: 0, max: 10 }),
  });
}

function genSubWithin10(rng, skill) {
  const a = rint(rng, 2, 10);
  const b = rint(rng, 1, a - 1);
  return mcq({
    skill, familySuffix: '001',
    prompt: `${a} − ${b} = ?`,
    correct: a - b,
    choices: numberChoices(rng, a - b, { min: 0, max: 10 }),
  });
}

const BUILDERS = {
  EN001: (rng, skill) => genCount(rng, skill, { min: 2, max: 10 }),
  EN002: (rng, skill) => genCount(rng, skill, { min: 1, max: 10 }),
  EN003: (rng, skill) => genCount(rng, skill, { min: 11, max: 20 }),
  EN004: (rng, skill) => genNumerals(rng, skill),
  EN005: (rng, skill) => genCompare(rng, skill),
  EN006: (rng, skill) => genBonds(rng, skill),
  EN007: (rng, skill) => genAddWithin10(rng, skill),
  EN008: (rng, skill) => genSubWithin10(rng, skill),
};

export function generateEarlyNumeracyQuestionSet({ skillId, count = 6, sessionSalt = '0' } = {}) {
  const skill = getSkill(skillId);
  if (!skill) {
    const err = new Error(`Unknown early-numeracy skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const build = BUILDERS[skill.id];
  if (!build) {
    const err = new Error(`No generator for early-numeracy skill: ${skill.id}`);
    err.status = 400;
    throw err;
  }
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const rng = mulberry32(hashString(`${sessionSalt}|${skill.id}|${i}`));
    out.push(build(rng, skill));
  }
  return out;
}

// MCQ string-equality check (trims + case-insensitive for the "Same" option).
export function checkEarlyNumeracyAnswer({ question, studentResponse }) {
  const given = String(studentResponse ?? '').trim().toLowerCase();
  const accepted = (question?.acceptedAnswers || [String(question?.answer?.display ?? '')])
    .map((a) => String(a).trim().toLowerCase());
  return { correct: accepted.includes(given) };
}

export default { generateEarlyNumeracyQuestionSet, checkEarlyNumeracyAnswer };
