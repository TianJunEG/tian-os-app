import { getSkill } from './OperationsSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './OperationsQuestionFamilies.js';

// MathPath — Four Operations question generator.
//
// Rebuilt for question quality (see MATHPATH_QUESTION_QUALITY_AUDIT.md). The old
// file was a stub: every one of the 48 generators returned "Compute: a + b".
// This version has one real builder per skill (OP001–OP024) producing the
// correct operation, level-appropriate operands, misconception-based
// distractors and genuine worked solutions. A thin practice/MCQ wrapper pair
// is registered for each of the 48 generatorKind names.

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
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

// Column-wise add with NO carrying — the realistic add/forgot-carry error.
function noCarryAdd(a, b) {
  const da = String(a).split('').reverse();
  const db = String(b).split('').reverse();
  const len = Math.max(da.length, db.length);
  const out = [];
  for (let i = 0; i < len; i++) out.push(((+da[i] || 0) + (+db[i] || 0)) % 10);
  return Number(out.reverse().join(''));
}
// Column-wise |digit−digit| — the sub/smaller-from-larger error.
function smallerFromLarger(a, b) {
  const da = String(a).split('').reverse();
  const db = String(b).split('').reverse();
  const len = Math.max(da.length, db.length);
  const out = [];
  for (let i = 0; i < len; i++) out.push(Math.abs((+da[i] || 0) - (+db[i] || 0)));
  return Number(out.reverse().join('')) || 0;
}

// ── Question envelope builders ───────────────────────────────────────────────
function shortAnswer({ family, prompt, answerDisplay, solutionSteps, misconceptionTag, difficulty, mode, diagram }) {
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'short_answer',
    prompt,
    choices: [],
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
function mcq({ family, prompt, answerDisplay, distractors, solutionSteps, misconceptionTag, difficulty, mode, rng, diagram }) {
  const seen = new Set([answerDisplay]);
  const opts = [];
  for (const d of distractors.map(String)) {
    // Drop non-positive numeric distractors (e.g. answer−10 when the answer is
    // small) — a negative option is an obvious giveaway and never a real error.
    const dn = Number(d);
    if (Number.isFinite(dn) && dn <= 0) continue;
    if (!seen.has(d) && d !== answerDisplay) { seen.add(d); opts.push(d); }
  }
  // Numeric backfill so there are always 4 distinct, plausible choices.
  const n = Number(String(answerDisplay).replace(/,/g, ''));
  if (Number.isFinite(n)) {
    const deltas = [1, -1, 2, -2, 10, -10, 3, -3, 5, -5, 20, -20];
    for (let i = 0; opts.length < 3 && i < deltas.length; i++) {
      const cand = String(n + deltas[i]);
      if (n + deltas[i] > 0 && !seen.has(cand)) { seen.add(cand); opts.push(cand); }
    }
  }
  const choices = [answerDisplay, ...opts.slice(0, 3)];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rint(rng, 0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'mcq',
    prompt,
    choices,
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

const NAMES = ['Aisha', 'Wei Ming', 'Priya', 'Daniel', 'Mei Ling', 'Arjun', 'Siti', 'Ravi'];
const THINGS = ['stickers', 'marbles', 'beads', 'stamps', 'sweets', 'cards'];

// ── Per-skill builders: each returns { prompt, answer, steps, distractors, tag, diagram? } ─
const BUILDERS = {
  // OP001 — Addition facts within 20
  OP001(rng) {
    const a = rint(rng, 2, 14), b = rint(rng, 2, 20 - a);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, answer: ans, tag: 'add/off-by-one',
      steps: [`Start at ${a} and count on ${b}.`, `${a} + ${b} = ${ans}.`],
      distractors: [ans + 1, ans - 1, ans + 2] };
  },
  // OP002 — Adding 2-digit numbers (no regrouping)
  OP002(rng) {
    const ua = rint(rng, 1, 4), ta = rint(rng, 1, 4);
    const ub = rint(rng, 1, 9 - ua), tb = rint(rng, 1, 9 - ta);
    const a = ta * 10 + ua, b = tb * 10 + ub, ans = a + b;
    return { prompt: `${a} + ${b} = ?`, answer: ans, tag: 'add/place-misalign',
      steps: ['Add the ones, then the tens.', `${ua} + ${ub} = ${ua + ub}; ${ta * 10} + ${tb * 10} = ${(ta + tb) * 10}.`, `${a} + ${b} = ${ans}.`],
      distractors: [noCarryAdd(a, b) + 1, ans + 10, ans - 10] };
  },
  // OP003 — Adding with regrouping (carrying)
  OP003(rng) {
    const ua = rint(rng, 5, 9), ub = rint(rng, 10 - ua + 1, 9);
    const a = rint(rng, 1, 4) * 10 + ua, b = rint(rng, 1, 4) * 10 + ub, ans = a + b;
    return { prompt: `${a} + ${b} = ?`, answer: ans, tag: 'add/forgot-carry',
      steps: [`Ones: ${ua} + ${ub} = ${ua + ub} — write ${(ua + ub) % 10}, carry 1.`, 'Add the tens and the carried 1.', `${a} + ${b} = ${ans}.`],
      distractors: [noCarryAdd(a, b), ans - 10, ans + 1] };
  },
  // OP004 — Adding 3–4 digit numbers
  OP004(rng) {
    const a = rint(rng, 1000, 8999), b = rint(rng, 1000, 9999 - 0);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, answer: ans, tag: 'add/carry-cascade',
      steps: ['Line up the digits by place value and add, carrying where needed.', `${a} + ${b} = ${ans}.`],
      distractors: [noCarryAdd(a, b), ans - 100, ans + 10] };
  },
  // OP005 — Subtraction facts within 20
  OP005(rng) {
    const a = rint(rng, 8, 20), b = rint(rng, 2, a - 1);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, answer: ans, tag: 'sub/count-back-error',
      steps: [`Start at ${a} and count back ${b}.`, `${a} − ${b} = ${ans}.`],
      distractors: [ans + 1, ans - 1, ans + 2] };
  },
  // OP006 — Subtracting 2-digit numbers (no regrouping)
  OP006(rng) {
    const tb = rint(rng, 1, 4), ub = rint(rng, 1, 4);
    const ta = rint(rng, tb, tb + 4), ua = rint(rng, ub, 9);
    const a = ta * 10 + ua, b = tb * 10 + ub, ans = a - b;
    return { prompt: `${a} − ${b} = ?`, answer: ans, tag: 'sub/smaller-from-larger',
      steps: ['Subtract the ones, then the tens.', `${ua} − ${ub} = ${ua - ub}; ${ta}0 − ${tb}0 = ${(ta - tb)}0.`, `${a} − ${b} = ${ans}.`],
      distractors: [ans + 10, ans - 10, ans + 1] };
  },
  // OP007 — Subtracting with regrouping (borrowing)
  OP007(rng) {
    const ua = rint(rng, 0, 4), ub = rint(rng, ua + 1, 9); // forces a borrow
    const tb = rint(rng, 1, 4), ta = rint(rng, tb + 1, 8);
    const a = ta * 10 + ua, b = tb * 10 + ub, ans = a - b;
    return { prompt: `${a} − ${b} = ?`, answer: ans, tag: 'sub/smaller-from-larger',
      steps: [`Ones: ${ua} is less than ${ub}, so borrow 1 ten: ${ua + 10} − ${ub} = ${ua + 10 - ub}.`, 'Reduce the tens by 1, then subtract.', `${a} − ${b} = ${ans}.`],
      distractors: [smallerFromLarger(a, b), ans + 10, ans - 1] };
  },
  // OP008 — Subtracting 3–4 digit numbers (across zeros)
  OP008(rng) {
    const a = rint(rng, 3, 9) * 1000 + rint(rng, 0, 9); // tens/hundreds zero → across-zeros
    const b = rint(rng, 1000, a - 1);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, answer: ans, tag: 'sub/across-zeros',
      steps: ['Borrow across the zeros from the next non-zero digit.', `${a} − ${b} = ${ans}.`],
      distractors: [smallerFromLarger(a, b), ans + 100, ans - 10] };
  },
  // OP009 — Multiplication facts (times tables to 12)
  OP009(rng) {
    const a = rint(rng, 2, 12), b = rint(rng, 2, 12), ans = a * b;
    return { prompt: `${a} × ${b} = ?`, answer: ans, tag: 'mult/adjacent-fact',
      steps: [`${a} × ${b} means ${b} groups of ${a}.`, `${a} × ${b} = ${ans}.`],
      distractors: [ans + a, ans - a, ans + b] };
  },
  // OP010 — Multiplying by 10, 100, 1000
  OP010(rng) {
    const n = rint(rng, 2, 99), p = pick(rng, [10, 100, 1000]), ans = n * p;
    const zeros = String(p).length - 1;
    return { prompt: `${n} × ${p} = ?`, answer: ans, tag: 'mult/append-zeros-decimal',
      steps: [`Multiplying by ${p} shifts every digit ${zeros} place(s) left.`, `Write ${n} then ${zeros} zero(s): ${ans}.`],
      distractors: [n * (p * 10), n * (p / 10), ans + p] };
  },
  // OP011 — Multiplying 2–3 digit by 1 digit
  OP011(rng) {
    const a = rint(rng, 13, 199), b = rint(rng, 3, 9), ans = a * b;
    return { prompt: `${a} × ${b} = ?`, answer: ans, tag: 'mult/forgot-carry',
      steps: ['Multiply each digit by the ones, carrying where needed.', `${a} × ${b} = ${ans}.`],
      distractors: [ans + b, ans - b, ans + 10] };
  },
  // OP012 — Long multiplication (2 digit × 2 digit)
  OP012(rng) {
    const a = rint(rng, 12, 99), b = rint(rng, 12, 99), ans = a * b;
    const ones = b % 10, tens = Math.floor(b / 10);
    return { prompt: `${a} × ${b} = ?`, answer: ans, tag: 'mult/missing-placeholder',
      steps: [`${a} × ${ones} = ${a * ones}.`, `${a} × ${tens}0 = ${a * tens * 10} (remember the place-holder zero).`, `Add: ${a * ones} + ${a * tens * 10} = ${ans}.`],
      distractors: [a * ones + a * tens, ans - a, ans + a] }; // missing placeholder = no ×10
  },
  // OP013 — Division facts (inverse of times tables)
  OP013(rng) {
    const b = rint(rng, 2, 12), q = rint(rng, 2, 12), a = b * q;
    return { prompt: `${a} ÷ ${b} = ?`, answer: q, tag: 'div/order-reversal',
      steps: [`${b} × ? = ${a}.`, `${a} ÷ ${b} = ${q}.`],
      distractors: [q + 1, q - 1, b] };
  },
  // OP014 — Short division by a 1-digit number (exact)
  OP014(rng) {
    const b = rint(rng, 3, 9), q = rint(rng, 23, 444), a = b * q;
    return { prompt: `${a} ÷ ${b} = ?`, answer: q, tag: 'div/drop-zero',
      steps: ['Divide each digit from the left, carrying remainders to the next.', `${a} ÷ ${b} = ${q}.`],
      distractors: [q + 1, q - 1, q * 10] };
  },
  // OP015 — Division with remainders (interpreting)
  OP015(rng) {
    const b = rint(rng, 3, 9), q = rint(rng, 4, 20), r = rint(rng, 1, b - 1), a = b * q + r;
    const name = pick(rng, NAMES), thing = pick(rng, THINGS);
    return { prompt: `${name} shares ${a} ${thing} equally among ${b} friends. How many ${thing} are left over?`, answer: r, tag: 'div/ignore-remainder',
      steps: [`${a} ÷ ${b} = ${q} remainder ${r}.`, `Each friend gets ${q}; ${r} ${thing} are left over.`],
      distractors: [0, q, b - r] };
  },
  // OP016 — Long division by a 2-digit number (exact)
  OP016(rng) {
    const b = rint(rng, 11, 25), q = rint(rng, 12, 60), a = b * q;
    return { prompt: `${a} ÷ ${b} = ?`, answer: q, tag: 'div/bad-estimate',
      steps: ['Estimate how many times the divisor fits, multiply, subtract, bring down.', `${a} ÷ ${b} = ${q}.`],
      distractors: [q + 1, q - 1, q + 10] };
  },
  // OP017 — Mental addition & subtraction strategies (compensation)
  OP017(rng) {
    const a = pick(rng, [98, 99, 97, 49, 48]), b = rint(rng, 24, 76), ans = a + b;
    const round = a === 49 || a === 48 ? 50 : 100;
    return { prompt: `Work out ${a} + ${b} using a mental strategy.`, answer: ans, tag: 'mental/no-compensation',
      steps: [`${a} is close to ${round}. ${round} + ${b} = ${round + b}.`, `Take away the extra ${round - a}: ${round + b} − ${round - a} = ${ans}.`],
      distractors: [round + b, ans + 1, ans - (round - a)] };
  },
  // OP018 — Mental multiplication & division strategies (factoring)
  OP018(rng) {
    const a = pick(rng, [12, 14, 15, 16, 18, 24, 25]), b = pick(rng, [4, 6, 8]), ans = a * b;
    return { prompt: `Work out ${a} × ${b} using a mental strategy.`, answer: ans, tag: 'mental/no-factoring',
      steps: [`Split ${a} = ${a - (a % 10)} + ${a % 10}.`, `${a - (a % 10)} × ${b} = ${(a - (a % 10)) * b}; ${a % 10} × ${b} = ${(a % 10) * b}.`, `Add: ${ans}.`],
      distractors: [ans + b, ans - b, (a - (a % 10)) * b] };
  },
  // OP019 — Order of operations (× ÷ before + −)
  OP019(rng) {
    const a = rint(rng, 2, 9), b = rint(rng, 2, 9), c = rint(rng, 2, 9), ans = a + b * c;
    return { prompt: `${a} + ${b} × ${c} = ?`, answer: ans, tag: 'order/left-to-right',
      steps: ['Do multiplication before addition.', `${b} × ${c} = ${b * c}; ${a} + ${b * c} = ${ans}.`],
      distractors: [(a + b) * c, ans + 1, a + b + c] }; // left-to-right error
  },
  // OP020 — Order of operations with brackets
  OP020(rng) {
    const a = rint(rng, 2, 9), b = rint(rng, 2, 9), c = rint(rng, 2, 6), ans = (a + b) * c;
    return { prompt: `(${a} + ${b}) × ${c} = ?`, answer: ans, tag: 'order/ignore-brackets',
      steps: ['Work out the brackets first.', `${a} + ${b} = ${a + b}; ${a + b} × ${c} = ${ans}.`],
      distractors: [a + b * c, ans + c, ans - c] }; // ignore-brackets error
  },
  // OP021 — Factors and multiples
  OP021(rng, variant) {
    if (variant % 2 === 0) {
      const a = rint(rng, 3, 9), other = rint(rng, 3, 9), N = a * other;
      return { prompt: `Fill in the missing factor: ${N} = ${a} × ___.`, answer: other, tag: 'op/factor-multiple-confuse',
        steps: [`${N} ÷ ${a} = ${other}.`, `${a} × ${other} = ${N}.`],
        distractors: [N, other + 1, other - 1] };
    }
    const N = pick(rng, [12, 18, 20, 24, 30, 36, 40]);
    const factors = [];
    for (let i = 2; i < N; i++) if (N % i === 0) factors.push(i);
    const ans = pick(rng, factors);
    const nonFactors = [];
    for (let i = 2; i < N && nonFactors.length < 6; i++) if (N % i !== 0) nonFactors.push(i);
    return { prompt: `Which of these is a factor of ${N}?`, answer: ans, tag: 'op/factor-multiple-confuse',
      steps: [`A factor divides ${N} exactly.`, `${N} ÷ ${ans} = ${N / ans}, so ${ans} is a factor.`],
      distractors: nonFactors.slice(0, 3), noBackfill: true };
  },
  // OP022 — HCF and LCM
  OP022(rng, variant) {
    const a = pick(rng, [4, 6, 8, 9, 12]), b = pick(rng, [6, 8, 10, 15, 18]);
    if (variant % 2 === 0) {
      const ans = gcd(a, b);
      return { prompt: `Find the HCF (highest common factor) of ${a} and ${b}.`, answer: ans, tag: 'op/hcf-lcm-confuse',
        steps: ['List common factors and take the largest.', `HCF(${a}, ${b}) = ${ans}.`],
        distractors: [lcm(a, b), ans + 1, Math.max(a, b)] };
    }
    const ans = lcm(a, b);
    return { prompt: `Find the LCM (lowest common multiple) of ${a} and ${b}.`, answer: ans, tag: 'op/hcf-lcm-confuse',
      steps: ['List multiples of each and take the smallest shared one.', `LCM(${a}, ${b}) = ${ans}.`],
      distractors: [gcd(a, b), a * b, ans + a] };
  },
  // OP023 — Model drawing (bar models)
  OP023(rng) {
    const a = rint(rng, 5, 40), more = rint(rng, 3, 20);
    const name1 = NAMES[0], name2 = NAMES[1];
    const ans = a + (a + more);
    return { prompt: `${name1} has ${a} ${THINGS[0]}. ${name2} has ${more} more than ${name1}. How many do they have altogether?`, answer: ans, tag: 'op/model-wrong-parts',
      steps: [`${name2} has ${a} + ${more} = ${a + more}.`, `Altogether: ${a} + ${a + more} = ${ans}.`],
      distractors: [a + more, 2 * a, ans + more],
      diagram: { kind: 'bar-model', bars: [{ label: name1, value: a }, { label: name2, value: a + more }], question: 'total' } };
  },
  // OP024 — Multi-step word problems
  OP024(rng) {
    const each = rint(rng, 3, 12), qty = rint(rng, 3, 8), paidExtra = rint(rng, 5, 40);
    const total = each * qty;
    const name = pick(rng, NAMES);
    const start = total + paidExtra; // ensures non-negative "left"
    const ans = start - total;
    return { prompt: `${name} had $${start}. ${name} bought ${qty} ${THINGS[5]} costing $${each} each. How much money is left?`, answer: ans, tag: 'op/wrong-operation-choice',
      steps: [`Cost = ${qty} × $${each} = $${total}.`, `Money left = $${start} − $${total} = $${ans}.`],
      distractors: [start - each, total, start + total] };
  },
};

// Skills that produce a number; everything here is numeric so the checker and
// the MCQ numeric backfill apply uniformly.
function runBuilder(skillId, rng, variant) {
  const build = BUILDERS[skillId];
  if (!build) return null;
  return build(rng, variant);
}

// ── 48 generatorKind wrappers (practice + MCQ per skill) ─────────────────────
function makePractice(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return shortAnswer({
      family, prompt: q.prompt, answerDisplay: String(q.answer),
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', diagram: q.diagram,
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return mcq({
      family, prompt: q.prompt, answerDisplay: String(q.answer),
      distractors: (q.distractors || []).map(String), solutionSteps: q.steps,
      misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng, diagram: q.diagram,
    });
  };
}

// Map each generatorKind name to a builder. The families use names like
// "opsOpAddFacts" (practice) and "opsOpAddFactsMCQ" (MCQ).
const KIND_TO_SKILL = {
  opsOpAddFacts: 'OP001', opsOpAdd2digit: 'OP002', opsOpAddRegroup: 'OP003', opsOpAddLarge: 'OP004',
  opsOpSubFacts: 'OP005', opsOpSub2digit: 'OP006', opsOpSubRegroup: 'OP007', opsOpSubLarge: 'OP008',
  opsOpMultFacts: 'OP009', opsOpMultBy10100: 'OP010', opsOpMult2x1: 'OP011', opsOpMultLong: 'OP012',
  opsOpDivFacts: 'OP013', opsOpDivShort: 'OP014', opsOpDivRemainder: 'OP015', opsOpDivLong: 'OP016',
  opsOpMentalAddSub: 'OP017', opsOpMentalMultDiv: 'OP018', opsOpOrderOfOps: 'OP019', opsOpOrderOfOpsBrackets: 'OP020',
  opsOpFactorsMultiples: 'OP021', opsOpHcfLcm: 'OP022', opsOpModelDrawing: 'OP023', opsOpWordMultiStep: 'OP024',
};

const GENERATORS = {};
for (const [kind, skillId] of Object.entries(KIND_TO_SKILL)) {
  GENERATORS[kind] = makePractice(skillId);
  GENERATORS[`${kind}MCQ`] = makeMCQ(skillId);
}

export function generateOperationsQuestionSet({ skillId, count = 6, mode = 'practice', sessionSalt = '' }) {
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return [];
  const questions = [];
  const seenPrompts = new Set();
  let variant = 0;
  let fi = 0;
  const maxAttempts = count * 5;
  while (questions.length < count && variant < maxAttempts) {
    const family = families[fi % families.length];
    const rng = makeRng(`${skillId}-${family.id}-${variant}-${sessionSalt}`);
    const gen = GENERATORS[family.generatorKind];
    if (gen) {
      const q = gen(family, rng, variant);
      if (!seenPrompts.has(q.prompt)) {
        seenPrompts.add(q.prompt);
        questions.push(q);
        fi++;
      }
    }
    variant++;
  }
  return questions;
}

export function checkOperationsAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '').replace(/^\$/, '');
  const expected = norm(question.answer?.display ?? question.answer ?? '');
  return { correct: norm(studentResponse) === expected };
}

export default { generateOperationsQuestionSet, checkOperationsAnswer };
