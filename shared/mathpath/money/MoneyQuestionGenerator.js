import { getSkill } from './MoneySkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './MoneyQuestionFamilies.js';

// MathPath — Money question generator.
//
// Rebuilt for question quality (see MATHPATH_QUESTION_QUALITY_AUDIT.md). Key
// invariants this file upholds:
//   • All money is held in INTEGER CENTS internally and rendered as $X.YY via
//     money(); no floating-point dollar arithmetic, no "$0.4.40" artifacts.
//   • Answers never go negative (no "money left = -$10").
//   • Denominations are real SGD coins/notes.
//   • Distractors encode the family's declared misconception, not random noise.
//   • Worked solutions show the actual method.
//   • checkMoneyAnswer accepts "$3.00", "3.00", "$3" and "3" interchangeably.

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

// ── Money helpers (integer cents) ────────────────────────────────────────────
// Render cents as a Singapore-dollar string, e.g. 805 → "$8.05", 800 → "$8.00".
function money(cents) {
  const sign = cents < 0 ? '-' : '';
  const c = Math.abs(Math.round(cents));
  return `${sign}$${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`;
}

// Real SGD denominations (in cents) and human labels for coin/note recognition.
const COIN_CENTS = [5, 10, 20, 50, 100];
const NOTE_CENTS = [200, 500, 1000, 5000, 10000];
function denomLabel(cents) {
  if (cents < 100) return `${cents}-cent coin`;
  if (cents === 100) return '$1 coin';
  return `$${cents / 100} note`;
}
function denomLabelPlural(cents, n) {
  const base = denomLabel(cents);
  return n === 1 ? base : base.replace('coin', 'coins').replace('note', 'notes');
}

// Cent-parts that look like real prices (avoid awkward values like 7c).
const CENT_PARTS = [0, 5, 10, 15, 20, 25, 30, 40, 45, 50, 55, 60, 70, 75, 80, 90, 95];

// Gendered name/pronoun pairs so word problems stay consistent.
const PEOPLE = [
  { name: 'Aisha', they: 'she' },
  { name: 'Wei Ming', they: 'he' },
  { name: 'Priya', they: 'she' },
  { name: 'Daniel', they: 'he' },
  { name: 'Mei Ling', they: 'she' },
  { name: 'Arjun', they: 'he' },
];
const ITEMS = ['toy car', 'storybook', 'pencil case', 'water bottle', 'puzzle', 'lunch set'];
const COUNTABLE = ['pen', 'apple', 'eraser', 'notebook', 'sticker pack', 'muffin'];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function pickPerson(rng) { return pick(rng, PEOPLE); }
function pickItem(rng, arr) { return pick(rng, arr); }
function pickTwo(rng, arr) {
  const first = pick(rng, arr);
  let second = pick(rng, arr);
  if (second === first) second = arr[(arr.indexOf(first) + 1) % arr.length];
  return [first, second];
}

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

// Parse a "$X.YY" string back to integer cents (or null if not money-shaped).
function parseMoney(s) {
  const m = /^-?\$(\d+)\.(\d{2})$/.exec(String(s).trim());
  return m ? Number(m[1]) * 100 + Number(m[2]) : null;
}

function mcq({ family, prompt, answerDisplay, distractors, solutionSteps, misconceptionTag, difficulty, mode, rng, diagram }) {
  const seen = new Set([answerDisplay]);
  const opts = [];
  for (const d of distractors.map(String)) {
    if (!seen.has(d)) { seen.add(d); opts.push(d); }
  }
  // Backfill so there are always exactly 4 distinct, plausible money choices.
  // Collisions happen when a misconception value coincides with the answer
  // (e.g. a $1-coin count, or an add with no cents overflow).
  const answerCents = parseMoney(answerDisplay);
  if (answerCents != null) {
    const deltas = [5, -5, 10, -10, 20, -20, 15, -15, 100, -100, 50, -50];
    for (let i = 0; opts.length < 3 && i < deltas.length; i++) {
      const cand = money(answerCents + deltas[i]);
      if (answerCents + deltas[i] > 0 && !seen.has(cand)) { seen.add(cand); opts.push(cand); }
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

// ── MN001 — Recognising coins and notes ──────────────────────────────────────
function mn001Parts(rng, variant) {
  const denom = pick(rng, variant % 2 === 0 ? COIN_CENTS : NOTE_CENTS);
  const n = rint(rng, 2, 9);
  return { denom, n, total: denom * n };
}
function monCoinsNotes(family, rng, variant) {
  const { denom, n, total } = mn001Parts(rng, variant);
  const prompt = `What is the total value of ${n} ${denomLabelPlural(denom, n)}?`;
  const steps = [
    `Each ${denomLabel(denom)} is worth ${money(denom)}.`,
    `Total = ${n} × ${money(denom)} = ${money(total)}.`,
  ];
  return shortAnswer({
    family, prompt, answerDisplay: money(total),
    acceptedAnswers: [money(total)],
    solutionSteps: steps, misconceptionTag: 'mon/face-value',
    difficulty: family.difficulty, mode: 'practice',
    diagram: { kind: 'coins', items: [{ valueCents: denom, count: n }] },
  });
}
function monCoinsNotesMCQ(family, rng, variant) {
  const { denom, n, total } = mn001Parts(rng, variant);
  const prompt = `A purse holds ${n} ${denomLabelPlural(denom, n)}. What is their total value?`;
  const steps = [
    `Each ${denomLabel(denom)} is worth ${money(denom)}.`,
    `Total = ${n} × ${money(denom)} = ${money(total)}.`,
  ];
  // mon/face-value: count the coins instead of their value, or read one coin.
  const distractors = [
    money(n * 100),          // counts each coin as $1
    money(denom),            // value of a single coin
    money(total + denom),    // miscount by one coin
  ];
  return mcq({
    family, prompt, answerDisplay: money(total), distractors,
    solutionSteps: steps, misconceptionTag: 'mon/face-value',
    difficulty: family.difficulty, mode: 'practice', rng,
    diagram: { kind: 'coins', items: [{ valueCents: denom, count: n }] },
  });
}

// ── MN002 — Adding amounts of money ──────────────────────────────────────────
function mn002Parts(rng) {
  const a = rint(rng, 1, 9) * 100 + pick(rng, CENT_PARTS);
  const b = rint(rng, 1, 9) * 100 + pick(rng, CENT_PARTS);
  return { a, b, sum: a + b };
}
// The classic cents-overflow error: add the cent parts but forget to carry the
// extra dollar, e.g. $1.80 + $2.50 → "$3.30" (130 cents written as 30c, no +$1).
function centsOverflowWrong(a, b) {
  const dollars = Math.floor(a / 100) + Math.floor(b / 100);
  const cents = (a % 100) + (b % 100);
  return `$${dollars}.${String(cents % 100).padStart(2, '0')}`;
}
function monAdd(family, rng) {
  const { a, b, sum } = mn002Parts(rng);
  const prompt = `Add: ${money(a)} + ${money(b)}.`;
  const steps = [
    'Line up the decimal points and add cents to cents, dollars to dollars.',
    `${(a % 100) + (b % 100)} cents = ${money((a % 100) + (b % 100))}; carry any whole dollar.`,
    `${money(a)} + ${money(b)} = ${money(sum)}.`,
  ];
  return shortAnswer({
    family, prompt, answerDisplay: money(sum),
    acceptedAnswers: [money(sum)],
    solutionSteps: steps, misconceptionTag: 'mon/cents-overflow',
    difficulty: family.difficulty, mode: 'practice',
  });
}
function monAddWord(family, rng) {
  const p = pickPerson(rng);
  const [it1, it2] = pickTwo(rng, ITEMS);
  const { a, b, sum } = mn002Parts(rng);
  const prompt = `${p.name} bought a ${it1} for ${money(a)} and a ${it2} for ${money(b)}. How much did ${p.they} spend altogether?`;
  const steps = [
    `Total spent = ${money(a)} + ${money(b)}.`,
    `Add the cents, carrying a dollar if they pass 100 cents: ${money(sum)}.`,
  ];
  const distractors = [
    centsOverflowWrong(a, b),  // forgot to carry the cents
    money(Math.abs(a - b)),    // subtracted instead of added
    money(sum + 100),          // carried an extra dollar
  ];
  return mcq({
    family, prompt, answerDisplay: money(sum), distractors,
    solutionSteps: steps, misconceptionTag: 'mon/cents-overflow',
    difficulty: family.difficulty, mode: 'practice', rng,
  });
}

// ── MN003 — Total cost (unit price × quantity) ───────────────────────────────
function mn003Parts(rng) {
  const price = rint(rng, 1, 6) * 100 + pick(rng, [0, 5, 10, 20, 25, 50, 80, 90]);
  const q = rint(rng, 2, 6);
  return { price, q, total: price * q };
}
function monTotalCost(family, rng) {
  const { price, q, total } = mn003Parts(rng);
  const item = pickItem(rng, COUNTABLE);
  const prompt = `One ${item} costs ${money(price)}. How much do ${q} ${item}s cost?`;
  const steps = [
    'Total cost = unit price × quantity (multiply, do not add).',
    `${money(price)} × ${q} = ${money(total)}.`,
  ];
  return shortAnswer({
    family, prompt, answerDisplay: money(total),
    acceptedAnswers: [money(total)],
    solutionSteps: steps, misconceptionTag: 'mon/add-not-multiply',
    difficulty: family.difficulty, mode: 'practice',
  });
}
function monTotalCostMCQ(family, rng) {
  const { price, q, total } = mn003Parts(rng);
  const item = pickItem(rng, COUNTABLE);
  const prompt = `${cap(item)}s cost ${money(price)} each. What is the cost of ${q} of them?`;
  const steps = [
    'Total cost = unit price × quantity.',
    `${money(price)} × ${q} = ${money(total)}.`,
  ];
  // mon/add-not-multiply: e.g. $3 each, 4 items → "$3 + $4 = $7".
  const distractors = [
    money(price + q * 100),    // added the count (as dollars) instead of multiplying
    money(total - price),      // one group too few
    money(total + price),      // one group too many
  ];
  return mcq({
    family, prompt, answerDisplay: money(total), distractors,
    solutionSteps: steps, misconceptionTag: 'mon/add-not-multiply',
    difficulty: family.difficulty, mode: 'practice', rng,
  });
}

// ── MN004 — Calculating change ───────────────────────────────────────────────
function mn004Parts(rng) {
  const paid = pick(rng, [500, 1000, 2000, 5000]); // pays with a note
  const maxDollars = Math.floor(paid / 100) - 1;
  const cost = rint(rng, 1, Math.max(1, maxDollars)) * 100 + pick(rng, CENT_PARTS);
  const safeCost = Math.min(cost, paid - 5); // cost strictly below the note
  return { paid, cost: safeCost, change: paid - safeCost };
}
function monChange(family, rng) {
  const { paid, cost, change } = mn004Parts(rng);
  const prompt = `A book costs ${money(cost)}. You pay with a ${denomLabel(paid)}. How much change do you get?`;
  const steps = [
    'Change = amount paid − cost.',
    `${money(paid)} − ${money(cost)} = ${money(change)}.`,
  ];
  return shortAnswer({
    family, prompt, answerDisplay: money(change),
    acceptedAnswers: [money(change)],
    solutionSteps: steps, misconceptionTag: 'mon/change-direction',
    difficulty: family.difficulty, mode: 'practice',
  });
}
function monChangeWord(family, rng) {
  const { paid, cost, change } = mn004Parts(rng);
  const p = pickPerson(rng);
  const item = pickItem(rng, ITEMS);
  const prompt = `${p.name} buys a ${item} costing ${money(cost)} and pays with a ${denomLabel(paid)}. How much change should ${p.they} receive?`;
  const steps = [
    'Change = amount paid − cost.',
    `${money(paid)} − ${money(cost)} = ${money(change)}.`,
  ];
  const distractors = [
    money(cost),               // hands back the price, not the change
    money(paid),               // hands back the whole note
    money(paid + cost),        // added instead of subtracting
  ];
  return mcq({
    family, prompt, answerDisplay: money(change), distractors,
    solutionSteps: steps, misconceptionTag: 'mon/change-direction',
    difficulty: family.difficulty, mode: 'practice', rng,
  });
}

// ── MN005 — Money word problems (two-step, bar-model) ────────────────────────
function mn005Parts(rng) {
  const spend1 = rint(rng, 1, 5) * 100 + pick(rng, CENT_PARTS);
  const spend2 = rint(rng, 1, 5) * 100 + pick(rng, CENT_PARTS);
  // Start strictly covers both purchases so "money left" is never negative.
  const start = spend1 + spend2 + rint(rng, 1, 6) * 100 + pick(rng, CENT_PARTS);
  return { start, spend1, spend2, left: start - spend1 - spend2 };
}
function monWordProb(family, rng) {
  const { start, spend1, spend2, left } = mn005Parts(rng);
  const p = pickPerson(rng);
  const [it1, it2] = pickTwo(rng, ITEMS);
  const prompt = `${p.name} had ${money(start)}. ${cap(p.they)} spent ${money(spend1)} on a ${it1} and ${money(spend2)} on a ${it2}. How much money did ${p.they} have left?`;
  const steps = [
    `Total spent = ${money(spend1)} + ${money(spend2)} = ${money(spend1 + spend2)}.`,
    `Money left = ${money(start)} − ${money(spend1 + spend2)} = ${money(left)}.`,
  ];
  return shortAnswer({
    family, prompt, answerDisplay: money(left),
    acceptedAnswers: [money(left)],
    solutionSteps: steps, misconceptionTag: 'mon/money-decimal-place',
    difficulty: family.difficulty, mode: 'practice',
    diagram: { kind: 'bar-model', wholeCents: start, partsCents: [spend1, spend2, left], unknownIndex: 2 },
  });
}
function monWordProbMulti(family, rng) {
  const { start, spend1, spend2, left } = mn005Parts(rng);
  const p = pickPerson(rng);
  const [it1, it2] = pickTwo(rng, ITEMS);
  const prompt = `${p.name} had ${money(start)}. ${cap(p.they)} bought a ${it1} for ${money(spend1)} and a ${it2} for ${money(spend2)}. How much was left?`;
  const steps = [
    `Total spent = ${money(spend1)} + ${money(spend2)} = ${money(spend1 + spend2)}.`,
    `Money left = ${money(start)} − ${money(spend1 + spend2)} = ${money(left)}.`,
  ];
  const distractors = [
    money(start - spend1),          // forgot the second purchase
    money(spend1 + spend2),         // gave total spent, not what is left
    money(start + spend1 + spend2), // added everything
  ];
  return mcq({
    family, prompt, answerDisplay: money(left), distractors,
    solutionSteps: steps, misconceptionTag: 'mon/money-decimal-place',
    difficulty: family.difficulty, mode: 'practice', rng,
    diagram: { kind: 'bar-model', wholeCents: start, partsCents: [spend1, spend2, left], unknownIndex: 2 },
  });
}

const GENERATORS = {
  monCoinsNotes, monCoinsNotesMCQ,
  monAdd, monAddWord,
  monTotalCost, monTotalCostMCQ,
  monChange, monChangeWord,
  monWordProb, monWordProbMulti,
};

export function generateMoneyQuestionSet({ skillId, count = 6, mode = 'practice', sessionSalt = '' }) {
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
      const dedupKey = q.prompt + '|||' + (q.answer?.display ?? q.answer);
      if (!seenPrompts.has(dedupKey) || variant >= count * 3) {
        seenPrompts.add(dedupKey);
        questions.push(q);
        fi++;
      }
    }
    variant++;
  }
  return questions;
}

// Normalise a money / numeric response to an integer-cent key so that
// "$3.00", "3.00", "$3" and "3" all compare equal. Non-numeric answers fall
// back to a whitespace/comma-insensitive string compare.
function moneyKey(s) {
  const t = String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '').replace(/\$/g, '');
  if (/^-?\d+(\.\d+)?$/.test(t)) return `c${Math.round(parseFloat(t) * 100)}`;
  return t;
}

export function checkMoneyAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '');
  return { correct: moneyKey(studentResponse) === moneyKey(expected) };
}

export default { generateMoneyQuestionSet, checkMoneyAnswer };
