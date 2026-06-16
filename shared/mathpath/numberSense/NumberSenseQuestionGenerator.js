import { getSkill } from './NumberSenseSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './NumberSenseQuestionFamilies.js';

// MathPath — Whole Numbers / Number Sense question generator.
//
// Rebuilt for question quality (see MATHPATH_QUESTION_QUALITY_AUDIT.md). The old
// file was a stub: every one of the 46 generators returned "Compute: a + b"
// with operands ≤ 25. This version has one real builder per skill (NS001–NS023)
// producing level-appropriate counting, place value, comparing, ordering,
// patterns, rounding, estimation and (P6) negative-number questions, with
// misconception distractors and genuine worked solutions.
//
// Answers come in three shapes — a number, a comparison symbol (<, >, =), or an
// ordered list — and checkNumberSenseAnswer normalises all three.

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────────────
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function makeRng(seedStr) {
  let a = hashSeed(seedStr);
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rint(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
function pick(rng, arr) { return arr[rint(rng, 0, arr.length - 1)]; }
function round10(x) { return Math.round(x / 10) * 10; }
function round100(x) { return Math.round(x / 100) * 100; }
function round1000(x) { return Math.round(x / 1000) * 1000; }
function cmpSym(a, b) { return a > b ? '>' : a < b ? '<' : '='; }

// ── Question envelope builders ───────────────────────────────────────────────
function shortAnswer({ family, prompt, answerDisplay, acceptedAnswers, solutionSteps, misconceptionTag, difficulty, mode, diagram }) {
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'short_answer',
    prompt,
    choices: [],
    answer: { display: answerDisplay, value: answerDisplay },
    acceptedAnswers: acceptedAnswers && acceptedAnswers.length ? acceptedAnswers : [answerDisplay],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
    ...(diagram ? { diagram } : {}),
  };
}
function mcqFrom({ family, prompt, answerDisplay, choices, distractors, solutionSteps, misconceptionTag, difficulty, mode, rng, diagram }) {
  let opts;
  if (choices && choices.length) {
    opts = [...new Set(choices.map(String))];
  } else {
    const seen = new Set([answerDisplay]);
    opts = [answerDisplay];
    for (const d of (distractors || []).map(String)) {
      if (!seen.has(d)) { seen.add(d); opts.push(d); }
    }
    const n = Number(String(answerDisplay).replace(/,/g, ''));
    if (Number.isFinite(n)) {
      const deltas = [1, -1, 2, -2, 10, -10, 100, -100, 5, -5];
      for (let i = 0; opts.length < 4 && i < deltas.length; i++) {
        const v = n + deltas[i];
        // Keep non-negative answers' options non-negative (the negative-number
        // skills have n < 0, so they still get negative options).
        if (n >= 0 && v < 0) continue;
        const cand = String(v);
        if (!seen.has(cand)) { seen.add(cand); opts.push(cand); }
      }
    }
    opts = opts.slice(0, 4);
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = rint(rng, 0, i);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'mcq',
    prompt,
    choices: opts,
    answer: { display: answerDisplay, value: answerDisplay },
    acceptedAnswers: [answerDisplay],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
    ...(diagram ? { diagram } : {}),
  };
}

function placeName(power) {
  return ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'][power];
}
// Build a place-value question for an n-digit number; returns {prompt, value, digit, steps, distractors}.
function pvQuestion(rng, minDigits, maxDigits) {
  const digits = rint(rng, minDigits, maxDigits);
  let s = String(rint(rng, 1, 9));
  for (let i = 1; i < digits; i++) s += String(rint(rng, 0, 9));
  const N = Number(s);
  const power = rint(rng, 0, digits - 1);
  const digit = Number(String(N)[digits - 1 - power]);
  const value = digit * 10 ** power;
  return {
    prompt: `In the number ${N.toLocaleString('en-US')}, what is the value of the digit in the ${placeName(power)} place?`,
    value, digit,
    steps: [`The ${placeName(power)} digit is ${digit}.`, `Its value is ${digit} × ${(10 ** power).toLocaleString('en-US')} = ${value.toLocaleString('en-US')}.`],
    distractors: [digit, digit * 10 ** (power + 1 <= digits - 1 ? power + 1 : Math.max(0, power - 1)), value === digit ? value + 1 : digit],
  };
}

const NS = (n) => `NS${String(n).padStart(3, '0')}`;

// ── Per-skill builders ───────────────────────────────────────────────────────
const BUILDERS = {
  [NS(1)]: (rng) => { const n = rint(rng, 1, 18); const a = n + 1; return { prompt: `What number comes just after ${n}?`, answer: a, tag: 'count/skip-number', steps: [`Count on one from ${n}: ${a}.`], distractors: [n, a + 1, n - 1] }; },
  [NS(2)]: (rng) => { const n = rint(rng, 10, 98); const a = n + 1; return { prompt: `What number comes just after ${n}?`, answer: a, tag: 'count/decade-boundary', steps: [`Count on one from ${n}: ${a}.`], distractors: [n, a + 1, n + 10] }; },
  [NS(3)]: (rng) => { const step = pick(rng, [2, 5, 10]); const start = step * rint(rng, 1, 5); const seq = [0, 1, 2, 3].map((i) => start + i * step); const a = start + 4 * step; return { prompt: `Skip count: ${seq.join(', ')}, ___`, answer: a, tag: 'count/lose-step', steps: [`The numbers go up by ${step}.`, `${seq[3]} + ${step} = ${a}.`], distractors: [a + step, a - step, seq[3] + 1] }; },
  [NS(4)]: (rng) => { const n = rint(rng, 100, 998); const a = n + 1; return { prompt: `What number comes just after ${n}?`, answer: a, tag: 'count/hundred-boundary', steps: [`Count on one from ${n}: ${a}.`], distractors: [n, a + 1, n + 100] }; },

  [NS(5)]: (rng) => { const q = pvQuestion(rng, 2, 2); return { prompt: q.prompt, answer: q.value, tag: 'pv/digit-vs-value', steps: q.steps, distractors: q.distractors }; },
  [NS(6)]: (rng) => { const q = pvQuestion(rng, 3, 3); return { prompt: q.prompt, answer: q.value, tag: 'pv/zero-placeholder', steps: q.steps, distractors: q.distractors }; },
  [NS(7)]: (rng) => { const q = pvQuestion(rng, 4, 5); return { prompt: q.prompt, answer: q.value, tag: 'pv/grouping', steps: q.steps, distractors: q.distractors }; },
  [NS(8)]: (rng) => { const q = pvQuestion(rng, 6, 6); return { prompt: q.prompt, answer: q.value, tag: 'pv/place-name', steps: q.steps, distractors: q.distractors }; },

  [NS(9)]: (rng) => { const a = rint(rng, 10, 99), b = rint(rng, 10, 99); return { prompt: `Compare the numbers. Write <, > or =:  ${a} ___ ${b}`, answer: cmpSym(a, b), tag: 'compare/leading-digit', steps: [`Compare place by place: ${a} ${cmpSym(a, b)} ${b}.`], choices: ['<', '>', '='] }; },
  [NS(10)]: (rng) => { const a = rint(rng, 1000, 99999), b = rint(rng, 1000, 99999); return { prompt: `Compare the numbers. Write <, > or =:  ${a.toLocaleString('en-US')} ___ ${b.toLocaleString('en-US')}`, answer: cmpSym(a, b), tag: 'compare/length-not-value', steps: [`Compare from the highest place value: ${a.toLocaleString('en-US')} ${cmpSym(a, b)} ${b.toLocaleString('en-US')}.`], choices: ['<', '>', '='] }; },

  [NS(11)]: (rng) => { const arr = uniqueInts(rng, 4, 10, 99); const sorted = [...arr].sort((x, y) => x - y); return { prompt: `Arrange these numbers from smallest to largest: ${arr.join(', ')}`, answer: sorted.join(', '), tag: 'order/local-not-global', steps: [`Smallest to largest: ${sorted.join(', ')}.`], choices: orderChoices(rng, sorted, arr) }; },
  [NS(12)]: (rng) => { const arr = uniqueInts(rng, 4, 1000, 99999); const sorted = [...arr].sort((x, y) => x - y); return { prompt: `Arrange these numbers from smallest to largest: ${arr.map((n) => n.toLocaleString('en-US')).join(', ')}`, answer: sorted.join(', '), tag: 'order/by-length', steps: [`Compare by place value. Smallest to largest: ${sorted.join(', ')}.`], choices: orderChoices(rng, sorted, arr) }; },

  [NS(13)]: (rng) => { const step = pick(rng, [2, 3, 5, 10]); const start = rint(rng, 1, 9); const seq = [0, 1, 2, 3].map((i) => start + i * step); const a = start + 4 * step; return { prompt: `What is the next number? ${seq.join(', ')}, ___`, answer: a, tag: 'pattern/step-drift', steps: [`The pattern increases by ${step}.`, `${seq[3]} + ${step} = ${a}.`], distractors: [a + step, a - step, seq[3] + 1] }; },
  [NS(14)]: (rng) => { const d = pick(rng, [3, 4, 6, 7, 9, 11]); const up = rng() < 0.6; const start = up ? rint(rng, 2, 20) : rint(rng, 60, 99); const seq = [0, 1, 2, 3].map((i) => start + (up ? 1 : -1) * i * d); const a = start + (up ? 1 : -1) * 4 * d; return { prompt: `Find the next number in the pattern: ${seq.join(', ')}, ___`, answer: a, tag: 'pattern/op-confusion', steps: [`Each term ${up ? 'increases' : 'decreases'} by ${d}.`, `${seq[3]} ${up ? '+' : '−'} ${d} = ${a}.`], distractors: [start + (up ? -1 : 1) * 4 * d, a + d, a - d] }; },
  [NS(15)]: (rng) => { const a1 = rint(rng, 2, 9), d = rint(rng, 2, 6), n = rint(rng, 6, 10); const a = a1 + (n - 1) * d; return { prompt: `A sequence starts ${a1}, ${a1 + d}, ${a1 + 2 * d}, ${a1 + 3 * d}, … (it goes up by ${d} each time). What is the ${ordinal(n)} term?`, answer: a, tag: 'pattern/assume-linear', steps: [`Term ${n} = ${a1} + (${n} − 1) × ${d}.`, `= ${a1} + ${(n - 1) * d} = ${a}.`], distractors: [a1 + n * d, a - d, a1 * n] }; },

  [NS(16)]: (rng) => { const toHundred = rng() < 0.5; const n = rint(rng, 12, toHundred ? 989 : 99); const a = toHundred ? round100(n) : round10(n); return { prompt: `Round ${n} to the nearest ${toHundred ? 100 : 10}.`, answer: a, tag: 'round/wrong-digit', steps: [`Look at the ${toHundred ? 'tens' : 'ones'} digit of ${n}.`, `${n} rounds to ${a}.`], distractors: [toHundred ? round100(n) + 100 : round10(n) + 10, toHundred ? Math.floor(n / 100) * 100 : Math.floor(n / 10) * 10, toHundred ? Math.ceil(n / 100) * 100 : Math.ceil(n / 10) * 10].filter((x) => x !== a) }; },
  [NS(17)]: (rng) => { const n = rint(rng, 1200, 98999); const a = round1000(n); return { prompt: `Round ${n.toLocaleString('en-US')} to the nearest 1000.`, answer: a, tag: 'round/no-cascade', steps: [`Look at the hundreds digit of ${n.toLocaleString('en-US')}.`, `It rounds to ${a.toLocaleString('en-US')}.`], distractors: [a + 1000, Math.floor(n / 1000) * 1000, Math.ceil(n / 1000) * 1000].filter((x) => x !== a) }; },

  [NS(18)]: (rng) => { const a = rint(rng, 120, 880), b = rint(rng, 120, 880); const est = round100(a) + round100(b); return { prompt: `Estimate ${a} + ${b} by first rounding each number to the nearest 100.`, answer: est, tag: 'estimate/exact-not-estimate', steps: [`${a} ≈ ${round100(a)}, ${b} ≈ ${round100(b)}.`, `${round100(a)} + ${round100(b)} = ${est}.`], distractors: [a + b, round100(a) + round100(b) + 100, round10(a) + round10(b)].filter((x) => x !== est) }; },
  [NS(19)]: (rng) => { const a = rint(rng, 18, 89), b = rint(rng, 18, 89); const est = round10(a) * round10(b); return { prompt: `Estimate ${a} × ${b} by first rounding each number to the nearest 10.`, answer: est, tag: 'estimate/round-one', steps: [`${a} ≈ ${round10(a)}, ${b} ≈ ${round10(b)}.`, `${round10(a)} × ${round10(b)} = ${est}.`], distractors: [a * b, round10(a) * b, est + round10(a)].filter((x) => x !== est) }; },
  [NS(20)]: (rng) => { const a = rint(rng, 320, 880), b = rint(rng, 120, 300); const est = round100(a) - round100(b); return { prompt: `Estimate ${a} − ${b} by first rounding each number to the nearest 100.`, answer: est, tag: 'estimate/ignore-check', steps: [`${a} ≈ ${round100(a)}, ${b} ≈ ${round100(b)}.`, `${round100(a)} − ${round100(b)} = ${est}.`], distractors: [a - b, est + 100, est - 100].filter((x) => x !== est && x > 0) }; },

  [NS(21)]: (rng) => { const start = rint(rng, 0, 4), steps = rint(rng, start + 1, start + 6); const a = start - steps; return { prompt: `On a number line, what number is ${steps} steps to the left of ${start}?`, answer: a, tag: 'neg/magnitude-order', steps: [`Moving left subtracts: ${start} − ${steps} = ${a}.`], distractors: [start + steps, -start - steps, steps - start], diagram: { kind: 'number-line', from: -10, to: 5, mark: a } }; },
  [NS(22)]: (rng) => { const a = rint(rng, -9, 9), b = rint(rng, -9, 9); return { prompt: `Compare the integers. Write <, > or =:  ${a} ___ ${b}`, answer: cmpSym(a, b), tag: 'neg/order-like-positive', steps: [`On a number line, numbers further left are smaller: ${a} ${cmpSym(a, b)} ${b}.`], choices: ['<', '>', '='] }; },
  [NS(23)]: (rng) => { const startT = rint(rng, -3, 8), drop = rint(rng, startT + 4, startT + 12); const a = startT - drop; return { prompt: `The temperature was ${startT}°C. It fell by ${drop}°C. What is the new temperature (in °C)?`, answer: a, tag: 'neg/direction', steps: [`A fall subtracts: ${startT} − ${drop} = ${a}.`, `The new temperature is ${a}°C.`], distractors: [startT + drop, drop - startT, -startT - drop] }; },
};

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function uniqueInts(rng, count, min, max) {
  const set = new Set();
  while (set.size < count) set.add(rint(rng, min, max));
  return [...set];
}
// One correct ordering plus up to three distinct wrong orderings of the same set.
function orderChoices(rng, sorted, original) {
  const want = sorted.join(', ');
  const out = new Set([want]);
  const candidates = [
    [...sorted].reverse().join(', '),
    original.join(', '),
    [...sorted.slice(1), sorted[0]].join(', '),
    [sorted[1], sorted[0], ...sorted.slice(2)].join(', '),
  ];
  for (const c of candidates) { if (out.size >= 4) break; out.add(c); }
  return [...out];
}

function runBuilder(skillId, rng, variant) {
  const build = BUILDERS[skillId];
  return build ? build(rng, variant) : null;
}

// ── 46 generatorKind wrappers ────────────────────────────────────────────────
function makePractice(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return shortAnswer({
      family, prompt: q.prompt, answerDisplay: String(q.answer),
      acceptedAnswers: [String(q.answer)], solutionSteps: q.steps,
      misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', diagram: q.diagram,
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return mcqFrom({
      family, prompt: q.prompt, answerDisplay: String(q.answer),
      choices: q.choices, distractors: q.distractors, solutionSteps: q.steps,
      misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng, diagram: q.diagram,
    });
  };
}

const KIND_TO_SKILL = {
  nsNsCountTo20: NS(1), nsNsCountTo100: NS(2), nsNsCountSkip: NS(3), nsNsCountTo1000: NS(4),
  nsNsPvTensOnes: NS(5), nsNsPv3Digit: NS(6), nsNsPv45Digit: NS(7), nsNsPv6Digit: NS(8),
  nsNsCompareTo100: NS(9), nsNsCompareLarge: NS(10), nsNsOrderTo100: NS(11), nsNsOrderLarge: NS(12),
  nsNsPatternSkip: NS(13), nsNsPatternArithmetic: NS(14), nsNsPatternComplex: NS(15),
  nsNsRound10100: NS(16), nsNsRound1000: NS(17),
  nsNsEstimateSums: NS(18), nsNsEstimateProducts: NS(19), nsNsEstimateCheck: NS(20),
  nsNsNegIntro: NS(21), nsNsNegCompareOrder: NS(22), nsNsNegContext: NS(23),
};

const GENERATORS = {};
for (const [kind, skillId] of Object.entries(KIND_TO_SKILL)) {
  GENERATORS[kind] = makePractice(skillId);
  GENERATORS[`${kind}MCQ`] = makeMCQ(skillId);
}

export function generateNumberSenseQuestionSet({ skillId, count = 6, mode = 'practice' }) {
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return [];
  const questions = [];
  let variant = 0;
  for (let i = 0; i < count; i++) {
    const family = families[i % families.length];
    const rng = makeRng(`${skillId}-${family.id}-${variant}`);
    const gen = GENERATORS[family.generatorKind];
    if (gen) questions.push(gen(family, rng, variant));
    variant++;
  }
  return questions;
}

// Accepts numbers (with/without commas), comparison symbols, and ordered lists.
export function checkNumberSenseAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const raw = String(studentResponse).trim().toLowerCase();
  const exp = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  if (raw === exp) return { correct: true };
  const noSpace = (s) => s.replace(/\s+/g, '');
  const noSpaceComma = (s) => s.replace(/[\s,]+/g, '');
  if (noSpace(raw) === noSpace(exp)) return { correct: true };       // ordered lists
  if (noSpaceComma(raw) === noSpaceComma(exp)) return { correct: true }; // numbers w/ separators
  return { correct: false };
}

export default { generateNumberSenseQuestionSet, checkNumberSenseAnswer };
