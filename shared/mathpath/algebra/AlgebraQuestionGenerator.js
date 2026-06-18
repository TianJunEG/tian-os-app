import { getSkill } from './AlgebraSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './AlgebraQuestionFamilies.js';

// MathPath — Algebra question generator.
//
// Rebuilt for question quality (P2 — see MATHPATH_QUESTION_QUALITY_AUDIT.md).
// Replaces boilerplate solutions and random distractors, and keeps every item
// inside (or reframed toward) the Singapore P6 algebra syllabus: use a letter
// for an unknown; notation (3n, n/2); form and evaluate expressions; substitute;
// simplify like terms. The families that were Secondary in the audit
// (AL007 distributive expansion, AL008/AL009 equation solving, AL010 form-and-
// solve) are reframed toward in-scope evaluation / finding-the-unknown so they
// are correct and non-negative — pending a product decision to drop them.
// Answers are a number or a simple term ("8n"); checkAlgebraAnswer handles both.

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

// ── Envelope builders ────────────────────────────────────────────────────────
function shortAnswer({ family, prompt, answerDisplay, solutionSteps, misconceptionTag, difficulty, mode }) {
  return {
    id: `${family.id}#${mode}`, skillId: family.skillId, questionFamilyId: family.id,
    type: 'short_answer', prompt, choices: [],
    answer: { display: answerDisplay, value: answerDisplay }, acceptedAnswers: [answerDisplay],
    solutionSteps, misconceptionTag, difficulty, mode,
    workingRequired: family.workingRequired, generatorKind: family.generatorKind,
  };
}
function mcqFrom({ family, prompt, answerDisplay, q, solutionSteps, misconceptionTag, difficulty, mode, rng }) {
  let opts;
  if (q.choices && q.choices.length) {
    opts = [...new Set(q.choices.map(String))];
  } else {
    opts = [String(answerDisplay)];
    const seen = new Set(opts);
    for (const d of q.distractors || []) {
      if (!seen.has(String(d)) && Number(d) > 0) { seen.add(String(d)); opts.push(String(d)); }
    }
    const base = Number(answerDisplay);
    const deltas = [1, -1, 2, -2, 3, -3, 5, -5];
    for (let i = 0; opts.length < 4 && i < deltas.length && Number.isFinite(base); i++) {
      const v = base + deltas[i];
      // Keep non-negative answers' options non-negative; negative answers
      // (e.g. substitution with negatives) may have negative options.
      if (base >= 0 && v <= 0) continue;
      if (!seen.has(String(v))) { seen.add(String(v)); opts.push(String(v)); }
    }
    opts = opts.slice(0, 4);
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = rint(rng, 0, i);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return {
    id: `${family.id}#${mode}`, skillId: family.skillId, questionFamilyId: family.id,
    type: 'mcq', prompt, choices: opts,
    answer: { display: answerDisplay, value: answerDisplay }, acceptedAnswers: [answerDisplay],
    solutionSteps, misconceptionTag, difficulty, mode,
    workingRequired: family.workingRequired, generatorKind: family.generatorKind,
  };
}

const AL = (n) => `AL${String(n).padStart(3, '0')}`;
const LETTERS = ['n', 'p', 'k', 'm', 'y', 'a'];
const VARS = ['x', 'y', 'n', 'a', 'm'];

// Format a linear expression ax + b nicely, e.g. "2x + 7", "3x - 4", "-x + 6".
function mkExpr(a, b, v) {
  const coeff = a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`;
  if (b === 0) return coeff;
  return `${coeff} ${b > 0 ? '+' : '-'} ${Math.abs(b)}`;
}
function termV(n, v) { return `${n >= 0 ? '+' : '-'} ${Math.abs(n) === 1 ? '' : Math.abs(n)}${v}`; }
function term(n) { return `${n >= 0 ? '+' : '-'} ${Math.abs(n)}`; }
// Canonicalise a single-variable linear expression to "<coeff><var>+<const>";
// returns null when the string has no variable (i.e. it is purely numeric).
function canonLinear(s) {
  let t = String(s).toLowerCase().replace(/\s+/g, '').replace(/−/g, '-').replace(/[*×]/g, '');
  if (!/[a-z]/.test(t)) return null;
  const v = t.match(/[a-z]/)[0];
  if (t[0] !== '-' && t[0] !== '+') t = `+${t}`;
  const terms = t.match(/[+-][^+-]*/g) || [];
  let coeff = 0, cons = 0;
  for (const tm of terms) {
    if (tm.includes(v)) { let c = tm.replace(v, ''); if (c === '+' || c === '') c = '1'; if (c === '-') c = '-1'; coeff += parseInt(c, 10) || 0; }
    else { cons += parseInt(tm, 10) || 0; }
  }
  return `${coeff}${v}${cons >= 0 ? '+' : ''}${cons}`;
}

const BUILDERS = {
  // AL001 — Unknowns in arithmetic (missing number)
  [AL(1)]: (rng) => { const a = rint(rng, 3, 19), x = rint(rng, 2, 15); return { prompt: `${a} + ___ = ${a + x}. What is the missing number?`, value: a + x - a, tag: 'alg/equals-means-answer', steps: [`${a + x} − ${a} = ${x}.`], distractors: [a + x, a, x + 1] }; },
  // AL002 — Using a letter for an unknown
  [AL(2)]: (rng) => { const L = pick(rng, LETTERS), x = rint(rng, 2, 15), b = rint(rng, 2, 12); return { prompt: `${L} + ${b} = ${x + b}. What is ${L}?`, value: x, tag: 'alg/letter-as-label', steps: [`${L} = ${x + b} − ${b} = ${x}.`], distractors: [x + b, b, x + 1] }; },
  // AL003 — Algebraic notation (evaluate 'a letter times a number')
  [AL(3)]: (rng) => { const L = pick(rng, LETTERS), k = rint(rng, 2, 9), v = rint(rng, 2, 9); return { prompt: `${k}${L} means ${k} × ${L}. If ${L} = ${v}, what is ${k}${L}?`, value: k * v, tag: 'alg/3n-means-3-plus-n', steps: [`${k}${L} = ${k} × ${v} = ${k * v}.`], distractors: [k + v, Number(`${k}${v}`), k * v + k] }; },
  // AL004 — Forming expressions from words (form and evaluate)
  [AL(4)]: (rng) => { const L = pick(rng, LETTERS), more = rint(rng, 2, 12), v = rint(rng, 3, 12); return { prompt: `A bag holds ${L} sweets. A second bag holds ${more} more than the first. The expression for the second bag is ${L} + ${more}. If ${L} = ${v}, how many sweets are in the second bag?`, value: v + more, tag: 'alg/word-order', steps: [`${L} + ${more} = ${v} + ${more} = ${v + more}.`], distractors: [v - more > 0 ? v - more : v + 1, more, v + more + 1] }; },
  // AL005 — Substitution (evaluate kn + c)
  [AL(5)]: (rng) => { const L = pick(rng, LETTERS), k = rint(rng, 2, 6), c = rint(rng, 1, 9), v = rint(rng, 2, 9); return { prompt: `Find the value of ${k}${L} + ${c} when ${L} = ${v}.`, value: k * v + c, tag: 'alg/sub-ignore-precedence', steps: [`${k} × ${v} = ${k * v}, then + ${c} = ${k * v + c}.`], distractors: [k * (v + c), k + v + c, k * v] }; },
  // AL006 — Simplifying by collecting like terms (term answer)
  [AL(6)]: (rng) => { const L = pick(rng, LETTERS), a = rint(rng, 2, 8), b = rint(rng, 1, 7); const sum = a + b; return { prompt: `Simplify: ${a}${L} + ${b}${L}. Write your answer as a single term.`, value: `${sum}${L}`, tag: 'alg/combine-unlike', steps: [`Add the coefficients: ${a} + ${b} = ${sum}.`, `${a}${L} + ${b}${L} = ${sum}${L}.`], choices: [`${sum}${L}`, `${sum}`, `${a * b}${L}`, `${sum}${L}${L}`] }; },
  // AL007 — Brackets, reframed as evaluate k(n + c) by substitution (in-scope)
  [AL(7)]: (rng) => { const L = pick(rng, LETTERS), k = rint(rng, 2, 5), c = rint(rng, 1, 6), v = rint(rng, 2, 8); return { prompt: `Find the value of ${k}(${L} + ${c}) when ${L} = ${v}.`, value: k * (v + c), tag: 'alg/distribute-partial', steps: [`Work out the bracket first: ${v} + ${c} = ${v + c}.`, `${k} × ${v + c} = ${k * (v + c)}.`], distractors: [k * v + c, k + v + c, k * v] }; },
  // AL008 — One-step "equation" reframed as find-the-unknown
  [AL(8)]: (rng) => { const L = pick(rng, LETTERS), x = rint(rng, 2, 15), b = rint(rng, 2, 12); return { prompt: `Solve: ${L} + ${b} = ${x + b}. What is ${L}?`, value: x, tag: 'alg/same-side-op', steps: [`Subtract ${b} from both sides: ${L} = ${x + b} − ${b} = ${x}.`], distractors: [x + b, b, x + 1] }; },
  // AL009 — Two-step, engineered so the unknown is a clean integer
  [AL(9)]: (rng) => { const L = pick(rng, LETTERS), x = rint(rng, 2, 9), k = rint(rng, 2, 4), b = rint(rng, 1, 9); return { prompt: `Solve: ${k}${L} + ${b} = ${k * x + b}. What is ${L}?`, value: x, tag: 'alg/order-of-undo', steps: [`Subtract ${b}: ${k}${L} = ${k * x}.`, `Divide by ${k}: ${L} = ${x}.`], distractors: [k * x + b, k * x, x + 1] }; },
  // AL010 — Word problem forming a simple (non-negative) relationship
  [AL(10)]: (rng) => { const L = pick(rng, LETTERS), more = rint(rng, 2, 9), end = rint(rng, 10, 20); const start = end + more; return { prompt: `A pupil had ${L} stickers. After giving away ${more}, they had ${end} left. How many stickers did they start with?`, value: start, tag: 'alg/wrong-relation', steps: [`${L} − ${more} = ${end}, so ${L} = ${end} + ${more} = ${start}.`], distractors: [end - more > 0 ? end - more : end + 1, end, more] }; },

  // ── Secondary 1 (G1) — Algebra ──────────────────────────────────────────────
  [AL(11)]: (rng) => {
    const v = pick(rng, VARS);
    let a1 = rint(rng, 2, 8), a2 = rint(rng, 1, 5) * (rng() < 0.5 ? -1 : 1);
    if (a1 + a2 === 0) a2 += 1;
    const b1 = rint(rng, 1, 9), b2 = rint(rng, 1, 8) * (rng() < 0.5 ? -1 : 1);
    const coeff = a1 + a2, cons = b1 + b2;
    const ans = mkExpr(coeff, cons, v);
    return { prompt: `Simplify: ${a1}${v} ${term(b1)} ${termV(a2, v)} ${term(b2)}`, value: ans, tag: 'alg/combine-unlike',
      steps: [`Collect the ${v}-terms: ${a1}${v} ${termV(a2, v)} = ${coeff}${v}.`, `Collect the numbers: ${b1} ${term(b2)} = ${cons}.`, `Answer: ${ans}.`],
      choices: [ans, mkExpr(a1 - a2, cons, v), mkExpr(coeff, b1 - b2, v), mkExpr(coeff + 1, cons, v)] };
  },
  [AL(12)]: (rng) => {
    const v = pick(rng, VARS), k = rint(rng, 2, 6), c = rint(rng, 1, 8) * (rng() < 0.5 ? -1 : 1);
    const ans = mkExpr(k, k * c, v);
    return { prompt: `Expand: ${k}(${v} ${term(c)})`, value: ans, tag: 'alg/distribute-partial',
      steps: [`Multiply each term inside the bracket by ${k}.`, `${k} × ${v} = ${k}${v}; ${k} × ${term(c).replace(' ', '')} = ${k * c >= 0 ? '+' : '-'} ${Math.abs(k * c)}.`, `Answer: ${ans}.`],
      choices: [ans, mkExpr(k, c, v), mkExpr(1, k * c, v), mkExpr(k, k * c + k, v)] };
  },
  [AL(13)]: (rng) => {
    const v = pick(rng, VARS), a = rint(rng, 2, 6), x = rint(rng, 2, 9), b = rint(rng, 1, 9) * (rng() < 0.5 ? -1 : 1);
    const c = a * x + b;
    return { prompt: `Solve: ${a}${v} ${term(b)} = ${c}. ${v} = ?`, value: x, tag: 'alg/order-of-undo',
      steps: [`${b >= 0 ? `Subtract ${b}` : `Add ${-b}`} from both sides: ${a}${v} = ${a * x}.`, `Divide by ${a}: ${v} = ${x}.`],
      distractors: [c - b, c + b, x + 1].filter((d) => d !== x) };
  },
  [AL(14)]: (rng) => {
    const v = pick(rng, VARS), a = rint(rng, 2, 5), x = rint(rng, 2, 9), b = rint(rng, 1, 6) * (rng() < 0.5 ? -1 : 1);
    const c = a * (x + b);
    return { prompt: `Solve: ${a}(${v} ${term(b)}) = ${c}. ${v} = ?`, value: x, tag: 'alg/distribute-partial',
      steps: [`Divide both sides by ${a}: ${v} ${term(b)} = ${x + b}.`, `${b >= 0 ? `Subtract ${b}` : `Add ${-b}`}: ${v} = ${x}.`],
      distractors: [x + b, c - b, x + 1].filter((d) => d !== x) };
  },
  [AL(15)]: (rng) => {
    const k = rint(rng, 2, 5), a = -rint(rng, 1, 7), b = rint(rng, 1, 8) * (rng() < 0.5 ? -1 : 1);
    const ans = k * a - b;
    return { prompt: `Find the value of ${k}a − b when a = ${a} and b = ${b}.`, value: ans, tag: 'alg/sign-error',
      steps: [`${k} × (${a}) = ${k * a}.`, `${k * a} − (${b}) = ${ans}.`],
      distractors: [k * a + b, k * Math.abs(a) - b, k * a - Math.abs(b)].filter((d) => d !== ans) };
  },
  [AL(16)]: (rng) => {
    const k = rint(rng, 2, 5), x = rint(rng, 2, 12), add = rint(rng, 1, 9);
    const total = k * x + add;
    return { prompt: `I think of a number, multiply it by ${k}, then add ${add}. The result is ${total}. What is the number?`, value: x, tag: 'alg/wrong-relation',
      steps: [`Let the number be n. Then ${k}n + ${add} = ${total}.`, `${k}n = ${total - add}, so n = ${x}.`],
      distractors: [total - add, total + add, x + 1].filter((d) => d !== x) };
  },
  // Word-problem variants (_W) — richer contextual application, difficulty +1
  AL001W: (rng) => { const start = rint(rng, 8, 25), add = rint(rng, 3, 12); return { prompt: `A baker baked some muffins. After adding ${add} more, there were ${start + add} altogether. How many did the baker bake at first?`, value: start, tag: 'alg/equals-means-answer', steps: [`Let n = number baked at first.`, `n + ${add} = ${start + add}`, `n = ${start + add} − ${add} = ${start}.`], distractors: [start + add, add, start + 1] }; },
  AL002W: (rng) => { const L = pick(rng, LETTERS), cut = rint(rng, 3, 12), end = rint(rng, 5, 20); return { prompt: `A ribbon is ${L} cm long. After cutting ${cut} cm from it, the ribbon is ${end} cm long. Find ${L}.`, value: cut + end, tag: 'alg/letter-as-label', steps: [`${L} − ${cut} = ${end}`, `${L} = ${end} + ${cut} = ${cut + end}.`], distractors: [end, cut, end - cut > 0 ? end - cut : cut + end + 1] }; },
  AL003W: (rng) => { const L = pick(rng, LETTERS), k = rint(rng, 2, 8), v = rint(rng, 3, 12); const items = pick(rng, ['stickers', 'marbles', 'cards', 'pencils']); return { prompt: `Each pupil has ${L} ${items}. There are ${k} pupils in a group. If ${L} = ${v}, how many ${items} are there altogether?`, value: k * v, tag: 'alg/3n-means-3-plus-n', steps: [`Total = ${k}${L}.`, `When ${L} = ${v}: ${k} × ${v} = ${k * v}.`], distractors: [k + v, Number(`${k}${v}`), k * v + k] }; },
  AL004W: (rng) => { const L = pick(rng, LETTERS), less = rint(rng, 2, 12); const obj = pick(rng, ['books', 'marbles', 'stickers', 'cards']); const [p1, p2] = pick(rng, [['Ali', 'Ben'], ['Sam', 'Joy'], ['Kai', 'Mia']]); return { prompt: `${p1} has ${L} ${obj}. ${p2} has ${less} fewer ${obj} than ${p1}. Write an expression for the number of ${obj} ${p2} has.`, value: `${L} - ${less}`, tag: 'alg/word-order', steps: [`${p2} has ${less} fewer, so the expression is ${L} − ${less}.`], choices: [`${L} - ${less}`, `${L} + ${less}`, `${less} - ${L}`, `${less}`] }; },
  AL005W: (rng) => { const L = pick(rng, LETTERS), k = rint(rng, 2, 6), c = rint(rng, 1, 9), v = rint(rng, 2, 9); return { prompt: `A shop charges (${k}${L} + ${c}) dollars for ${L} hours of tuition. Find the charge for ${v} hours.`, value: k * v + c, tag: 'alg/sub-ignore-precedence', steps: [`Substitute ${L} = ${v}: ${k} × ${v} + ${c} = ${k * v} + ${c} = ${k * v + c}.`], distractors: [k * (v + c), k + v + c, k * v] }; },
  AL006W: (rng) => { const L = pick(rng, LETTERS), a = rint(rng, 2, 6), b = rint(rng, 1, 4); const pc = 2 * (a + b); return { prompt: `A rectangle has length ${a}${L} cm and width ${b}${L} cm. Write an expression for the perimeter.`, value: `${pc}${L}`, tag: 'alg/combine-unlike', steps: [`Perimeter = 2(${a}${L}) + 2(${b}${L}) = ${2 * a}${L} + ${2 * b}${L} = ${pc}${L}.`], choices: [`${pc}${L}`, `${a + b}${L}`, `${2 * a * b}${L}`, `${pc + 2}${L}`] }; },
  AL007W: (rng) => { const L = pick(rng, LETTERS), k = rint(rng, 2, 5), c = rint(rng, 1, 6), v = rint(rng, 2, 8); const total = k * (v + c); return { prompt: `${k} boxes each hold (${L} + ${c}) apples. If ${L} = ${v}, find the total number of apples.`, value: total, tag: 'alg/distribute-partial', steps: [`Total = ${k}(${L} + ${c}).`, `When ${L} = ${v}: ${k}(${v} + ${c}) = ${k} × ${v + c} = ${total}.`], distractors: [k * v + c, k + v + c, total + k] }; },
  AL008W: (rng) => { const x = rint(rng, 3, 18), b = rint(rng, 2, 12); if (rng() < 0.5) { return { prompt: `A jar held some sweets. After ${b} more were added, there were ${x + b} sweets in total. How many sweets were in the jar at first?`, value: x, tag: 'alg/same-side-op', steps: [`Let n = starting number. n + ${b} = ${x + b}. n = ${x}.`], distractors: [x + b, b, x + 1] }; } return { prompt: `A pupil had some stickers. After giving ${b} away, she had ${x} left. How many did she start with?`, value: x + b, tag: 'alg/same-side-op', steps: [`Let n = starting number. n − ${b} = ${x}. n = ${x} + ${b} = ${x + b}.`], distractors: [x, b, x + b + 1] }; },
  AL009W: (rng) => { const x = rint(rng, 2, 9), k = rint(rng, 2, 4), b = rint(rng, 1, 9), L = pick(rng, LETTERS); const total = k * x + b; return { prompt: `There are ${k} bags with ${L} marbles each and ${b} loose marbles. There are ${total} marbles in total. How many marbles are in each bag?`, value: x, tag: 'alg/order-of-undo', steps: [`${k}${L} + ${b} = ${total}`, `${k}${L} = ${k * x}`, `${L} = ${x}.`], distractors: [total, k * x, x + 1] }; },
  AL010W: (rng) => { const x = rint(rng, 3, 10), k = rint(rng, 2, 4), L = pick(rng, LETTERS); const together = (k + 1) * x; const [p1, p2] = pick(rng, [['Ali', 'Ben'], ['Sam', 'Jay'], ['Kai', 'Mia']]); return { prompt: `${p1} has ${k} times as many marbles as ${p2}. Together they have ${together} marbles. Let ${p2} have ${L} marbles. Form an equation and find ${L}.`, value: x, tag: 'alg/wrong-relation', steps: [`${p2}: ${L}; ${p1}: ${k}${L}.`, `${L} + ${k}${L} = ${together}`, `${k + 1}${L} = ${together}`, `${L} = ${x}.`], distractors: [together, k * x, x + 1] }; },
};

function runBuilder(skillId, rng, variant) {
  const build = BUILDERS[skillId];
  return build ? build(rng, variant) : null;
}
function makePractice(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return shortAnswer({
      family, prompt: q.prompt, answerDisplay: String(q.value),
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice',
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return mcqFrom({
      family, prompt: q.prompt, answerDisplay: String(q.value), q,
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng,
    });
  };
}

const GENERATORS = {
  algUnknownArith: makePractice(AL(1)), algUnknownArithMCQ: makeMCQ(AL(1)),
  algUnknownLetter: makePractice(AL(2)), algUnknownLetterMCQ: makeMCQ(AL(2)),
  algNotation: makePractice(AL(3)), algNotationMCQ: makeMCQ(AL(3)),
  algFormExpression: makePractice(AL(4)), algFormExpressionMCQ: makeMCQ(AL(4)),
  algSubstitute: makePractice(AL(5)), algSubstituteWord: makeMCQ(AL(5)),
  algSimplifyAdd: makePractice(AL(6)), algSimplifyAddMCQ: makeMCQ(AL(6)),
  algSimplifyMixed: makePractice(AL(7)), algSimplifyMixedMCQ: makeMCQ(AL(7)),
  algEquation1Step: makePractice(AL(8)), algEquation1StepWord: makeMCQ(AL(8)),
  algEquation2Step: makePractice(AL(9)), algEquation2StepWord: makeMCQ(AL(9)),
  algWordToEquation: makePractice(AL(10)), algWordToEquationMCQ: makeMCQ(AL(10)),
  // Secondary 1 (G1)
  algSimplifyLinear: makePractice(AL(11)), algSimplifyLinearMCQ: makeMCQ(AL(11)),
  algExpandBrackets: makePractice(AL(12)), algExpandBracketsMCQ: makeMCQ(AL(12)),
  algSolveTwoStep: makePractice(AL(13)), algSolveTwoStepMCQ: makeMCQ(AL(13)),
  algSolveBrackets: makePractice(AL(14)), algSolveBracketsMCQ: makeMCQ(AL(14)),
  algSubstituteNeg: makePractice(AL(15)), algSubstituteNegMCQ: makeMCQ(AL(15)),
  algFormSolve: makePractice(AL(16)), algFormSolveMCQ: makeMCQ(AL(16)),
  algUnknownArithWord: makePractice('AL001W'),
  algUnknownLetterWord: makePractice('AL002W'),
  algNotationWord: makePractice('AL003W'),
  algFormExpressionWord2: makePractice('AL004W'),
  algSubstituteContext: makePractice('AL005W'),
  algSimplifyPerimeter: makePractice('AL006W'),
  algBracketsWord: makePractice('AL007W'),
  algEquation1StepContext: makePractice('AL008W'),
  algEquation2StepContext: makePractice('AL009W'),
  algWordToEquationHard: makePractice('AL010W'),
};

export function generateAlgebraQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

// Accepts numbers and simple terms ("8n"), whitespace-insensitive.
export function checkAlgebraAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = question.answer?.display ?? question.answer ?? '';
  // Linear-expression answers (e.g. "2x + 7", "12n") are compared by their
  // canonical form, so "7 + 2x" and "2x + 7" both match.
  const expCanon = canonLinear(expected);
  if (expCanon !== null) return { correct: canonLinear(studentResponse) === expCanon };
  const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/×/g, '');
  return { correct: norm(studentResponse) === norm(expected) };
}

export default { generateAlgebraQuestionSet, checkAlgebraAnswer };
