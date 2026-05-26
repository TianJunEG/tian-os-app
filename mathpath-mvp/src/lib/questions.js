// questions.js — procedural question generation + misconception diagnosis (server-side).
//
// Each question carries everything the client needs to render and grade without importing this
// module: a type ('numeric' | 'choice'), a LaTeX and/or text prompt, an optional visual, the
// answer, choices (for choice items), worked-solution steps, and the params used to rebuild it
// for remediation. Fractions render with KaTeX (stacked), never slash notation.

import { getSkill } from './graph.js';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

let seq = 0;
const id = (skill) => `${skill}-q${String(Date.now()).slice(-5)}${seq++}`;

// ── Multiplication: climb the table from an easy ×10/×5 landmark (skip-count for small b) ──
function multSteps(a, b) {
  const product = a * b;
  const L = b > 10 ? 10 : b > 5 ? 5 : 0;
  if (!L) {
    const terms = Array(b).fill(a).join(' + ');
    return { text: `${a} × ${b} = ${terms} = ${product}.`, hint: `Count up in ${a}s.` };
  }
  const steps = b - L;
  const adds = Array(steps).fill(a).join(' + ');
  return {
    text: `${a} × ${b} = ${a} × ${L} + ${adds} = ${a * L} + ${adds} = ${product}.`,
    hint: `Start from the easy ${a} × ${L} = ${a * L}, then add ${a} ${steps === 1 ? 'once more' : `${steps} more times`}.`,
  };
}

function buildMul(skill, a, b) {
  const product = a * b;
  const ms = multSteps(a, b);
  return {
    question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'mul', params: { a, b },
    question_type: 'numeric', prompt_text: `${a} × ${b}`,
    answer: product,
    worked_solution: [
      { text: `${a} × ${b} means ${a} groups of ${b}.` },
      { text: ms.text },
      { text: `So ${a} × ${b} = ${product}.` },
    ],
    hint_sequence: [{ text: `It's a fact from the ${a} times table.` }, { text: ms.hint }],
    expected_time_seconds: skill.expected_time_seconds,
  };
}

function buildDiv(skill, divisor, quotient) {
  const dividend = divisor * quotient;
  return {
    question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'div', params: { divisor, quotient },
    question_type: 'numeric', prompt_text: `${dividend} ÷ ${divisor}`,
    answer: quotient,
    worked_solution: [
      { text: `${dividend} ÷ ${divisor} asks how many ${divisor}s make ${dividend}.` },
      { text: `${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${quotient}.` },
    ],
    hint_sequence: [{ text: `Use the matching fact: ${divisor} × ? = ${dividend}.` }],
    expected_time_seconds: skill.expected_time_seconds,
  };
}

// ── Fraction meaning: "what fraction is shaded?" (visual bar + KaTeX choices) ──
function buildFracMeaning(skill, n, d) {
  const ans = `${n}/${d}`;
  const opts = new Set([ans]);
  const add = (x, y) => { if (x >= 1 && x < y && y >= 2) opts.add(`${x}/${y}`); };
  add(d - n, d);            // counted the unshaded parts
  add(n, d - n || d);       // shaded-to-unshaded instead of shaded-to-whole
  add(n + 1, d); add(n, d + 1);
  const choices = Array.from(opts).slice(0, 4).sort(() => Math.random() - 0.5)
    .map((v) => ({ value: v, latex: `\\frac{${v.split('/')[0]}}{${v.split('/')[1]}}` }));
  return {
    question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracMeaning', params: { n, d },
    question_type: 'choice', prompt_text: 'What fraction is shaded?',
    visual: { kind: Math.random() < 0.5 ? 'circle' : 'bar', n, d },
    answer: ans, choices,
    worked_solution: [
      { text: `The bar is split into ${d} equal parts; ${n} are shaded.` },
      { text: 'The fraction is shaded parts over total parts:' },
      { latex: `\\frac{\\text{shaded}}{\\text{total}} = \\frac{${n}}{${d}}` },
    ],
    hint_sequence: [{ text: `Count the shaded parts, then all the parts.` }],
    expected_time_seconds: skill.expected_time_seconds,
  };
}

// ── Equivalent fractions: fill the missing numerator (numeric) ──
function buildFracEquiv(skill, a, b, k) {
  return {
    question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracEquiv', params: { a, b, k },
    question_type: 'numeric',
    prompt_latex: `\\frac{${a}}{${b}} = \\frac{\\rule{0.7em}{0.08em}}{${b * k}}`,
    prompt_text: `${a}/${b} = ?/${b * k}`,
    answer: a * k,
    worked_solution: [
      { text: `${b} was multiplied by ${k} to get ${b * k}.` },
      { text: 'Do the same to the top:' },
      { latex: `\\frac{${a}}{${b}} = \\frac{${a} \\times ${k}}{${b} \\times ${k}} = \\frac{${a * k}}{${b * k}}` },
    ],
    hint_sequence: [{ text: `What times ${b} gives ${b * k}? Multiply the top by the same number.` }],
    expected_time_seconds: skill.expected_time_seconds,
  };
}

// ── Comparing fractions: which is greater? (two KaTeX choices) ──
function buildFracCompare(skill, a, b, c, d) {
  const left = a / b, right = c / d;
  const ans = left > right ? `${a}/${b}` : `${c}/${d}`;
  const choices = [
    { value: `${a}/${b}`, latex: `\\frac{${a}}{${b}}` },
    { value: `${c}/${d}`, latex: `\\frac{${c}}{${d}}` },
  ].sort(() => Math.random() - 0.5);
  return {
    question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracCompare', params: { a, b, c, d },
    question_type: 'choice', prompt_text: 'Which fraction is greater?',
    answer: ans, choices,
    worked_solution: [
      { text: 'Rename to a common denominator, then compare numerators:' },
      { latex: `\\frac{${a}}{${b}} = \\frac{${a * d}}{${b * d}}, \\quad \\frac{${c}}{${d}} = \\frac{${c * b}}{${b * d}}` },
      { text: `${a * d > c * b ? `${a * d} > ${c * b}` : `${c * b} > ${a * d}`}, so the greater fraction is ${ans.replace('/', ' over ')}.` },
    ],
    hint_sequence: [{ text: 'Give them the same denominator, then the bigger numerator wins.' }],
    expected_time_seconds: skill.expected_time_seconds,
  };
}

// ── Adding fractions (like denominators): add the tops, keep the bottom ──
function buildFracAdd(skill, a, c, d) {
  const sum = a + c;
  const ans = `${sum}/${d}`;
  const opts = new Set([ans]);
  opts.add(`${sum}/${d + d}`);       // added the denominators too
  opts.add(`${a * c}/${d}`);
  opts.add(`${sum + 1}/${d}`);
  const choices = Array.from(opts).slice(0, 4).sort(() => Math.random() - 0.5)
    .map((v) => ({ value: v, latex: `\\frac{${v.split('/')[0]}}{${v.split('/')[1]}}` }));
  return {
    question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracAdd', params: { a, c, d },
    question_type: 'choice',
    prompt_latex: `\\frac{${a}}{${d}} + \\frac{${c}}{${d}}`,
    prompt_text: `${a}/${d} + ${c}/${d}`,
    answer: ans, choices,
    worked_solution: [
      { text: 'The denominators already match, so add the numerators and keep the denominator:' },
      { latex: `\\frac{${a}}{${d}} + \\frac{${c}}{${d}} = \\frac{${a} + ${c}}{${d}} = \\frac{${sum}}{${d}}` },
    ],
    hint_sequence: [{ text: 'Same bottom number? Add the tops, keep the bottom the same.' }],
    expected_time_seconds: skill.expected_time_seconds,
  };
}

// ── Simplifying fractions: reduce to simplest form (KaTeX choices) ──
function buildFracSimplify(skill, num, den) {
  const g = gcd(num, den);
  const sn = num / g, sd = den / g;
  const ans = `${sn}/${sd}`;
  const opts = new Set([ans]);
  opts.add(`${num}/${den}`);                  // didn't simplify
  if (g > 2) opts.add(`${num / 2}/${den / 2}`); // partial simplify (if even)
  opts.add(`${sn + 1}/${sd}`);
  opts.add(`${sd}/${sn}`);
  const choices = Array.from(opts).filter((v) => { const [x, y] = v.split('/').map(Number); return x >= 1 && y >= 1; })
    .slice(0, 4).sort(() => Math.random() - 0.5)
    .map((v) => ({ value: v, latex: `\\frac{${v.split('/')[0]}}{${v.split('/')[1]}}` }));
  return {
    question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracSimplify', params: { num, den },
    question_type: 'choice',
    prompt_text: 'Write this in its simplest form:', prompt_latex: `\\frac{${num}}{${den}}`,
    answer: ans, choices,
    worked_solution: [
      { text: `The largest number that divides both ${num} and ${den} is ${g}.` },
      { text: 'Divide the top and bottom by it:' },
      { latex: `\\frac{${num}}{${den}} = \\frac{${num} \\div ${g}}{${den} \\div ${g}} = \\frac{${sn}}{${sd}}` },
    ],
    hint_sequence: [{ text: `What is the biggest number that divides both ${num} and ${den}?` }],
    expected_time_seconds: skill.expected_time_seconds,
  };
}

// ── Generation entry points ──
export function generateQuestion(skill, seed) {
  if (typeof skill === 'string') skill = getSkill(skill);
  switch (skill.gen) {
    case 'mul': return buildMul(skill, seed?.a ?? pick([2, 3, 4, 5, 6, 7, 8, 9]), seed?.b ?? rand(2, 12));
    case 'div': return buildDiv(skill, seed?.divisor ?? pick([2, 3, 4, 5, 6, 7, 8, 9]), seed?.quotient ?? rand(2, 9));
    case 'fracMeaning': { const d = seed?.d ?? rand(3, 8); return buildFracMeaning(skill, seed?.n ?? rand(1, d - 1), d); }
    case 'fracEquiv': return buildFracEquiv(skill, seed?.a ?? rand(1, 5), seed?.b ?? rand(2, 6), seed?.k ?? rand(2, 4));
    case 'fracSimplify': {
      if (seed?.num) return buildFracSimplify(skill, seed.num, seed.den);
      // a reducible fraction: simplest sn/sd scaled by a common factor g (gcd stays g)
      const sd = rand(2, 6), sn = rand(1, sd - 1), g = rand(2, 4);
      return buildFracSimplify(skill, sn * g, sd * g);
    }
    case 'fracCompare': {
      // two unequal fractions with small denominators
      for (let t = 0; t < 50; t++) {
        const a = rand(1, 5), b = rand(2, 8), c = rand(1, 5), e = rand(2, 8);
        if (a < b && c < e && a / b !== c / e) return buildFracCompare(skill, a, b, c, e);
      }
      return buildFracCompare(skill, 2, 3, 3, 5);
    }
    case 'fracAdd': {
      const d = seed?.d ?? rand(3, 9);
      const a = seed?.a ?? rand(1, d - 2);
      const c = seed?.c ?? (rand(1, d - a - 1) || 1);
      return buildFracAdd(skill, a, c, d);
    }
    default: return buildMul(skill, 2, 3);
  }
}

export function reconstruct(skillId, params) {
  const skill = getSkill(skillId);
  return generateQuestion(skill, params);
}

export function buildSession(skill, count) {
  return Array.from({ length: count }, () => generateQuestion(skill));
}

// A parallel "now you try" item near the missed one (same family, gentle variation).
export function siblingParams(skillId, p) {
  switch (getSkill(skillId).gen) {
    case 'mul': return { a: p.a, b: p.b >= 12 ? p.b - 1 : p.b + 1 };
    case 'div': return { divisor: p.divisor, quotient: p.quotient >= 9 ? p.quotient - 1 : p.quotient + 1 };
    case 'fracMeaning': return { n: Math.max(1, p.n - 1 || 1), d: p.d };
    case 'fracEquiv': return { a: p.a, b: p.b, k: p.k >= 4 ? p.k - 1 : p.k + 1 };
    case 'fracSimplify': return { num: p.num, den: p.den };
    case 'fracCompare': return { a: p.a, b: p.b, c: p.c, d: p.d };
    case 'fracAdd': return { a: p.a, c: p.c, d: p.d };
    default: return p;
  }
}

// ── Diagnosis: map a wrong answer to a named misconception ──
export function diagnose(skillId, params, given) {
  const g = getSkill(skillId).gen;
  if (g === 'mul') {
    const n = Number(given), { a, b } = params;
    if (n === a + b) return { tag: 'mult/adds', label: 'Added instead of multiplying' };
    if (n === a * (b - 1) || n === a * (b + 1)) return { tag: 'mult/adjacent', label: 'Recalled a neighbouring fact' };
    return { tag: 'mult/recall', label: 'Mis-recalled the fact' };
  }
  if (g === 'div') {
    const n = Number(given), { divisor, quotient } = params;
    if (n === divisor * quotient) return { tag: 'div/multiplied', label: 'Multiplied instead of dividing' };
    if (n === quotient - 1 || n === quotient + 1) return { tag: 'div/off-by-one', label: 'Off by one in the related fact' };
    return { tag: 'div/recall', label: 'Mis-recalled the related fact' };
  }
  if (g === 'fracMeaning') {
    const { n, d } = params;
    if (given === `${d - n}/${d}`) return { tag: 'frac/unshaded', label: 'Counted the unshaded parts' };
    return { tag: 'frac/parts', label: 'Mis-counted parts vs whole' };
  }
  if (g === 'fracEquiv') {
    const n = Number(given), { a, k } = params;
    if (n === a + k) return { tag: 'frac/added-not-multiplied', label: 'Added instead of multiplying the top' };
    if (n === a) return { tag: 'frac/scaled-one-part', label: 'Scaled the bottom but not the top' };
    return { tag: 'frac/equiv', label: 'Equivalent-fraction slip' };
  }
  if (g === 'fracSimplify') {
    const { num, den } = params;
    if (given === `${num}/${den}`) return { tag: 'frac/not-simplified', label: "Didn't simplify the fraction" };
    const div = gcd(num, den);
    if (div > 2 && given === `${num / 2}/${den / 2}`) return { tag: 'frac/partial-simplify', label: 'Only simplified part way' };
    return { tag: 'frac/simplify', label: 'Simplifying slip' };
  }
  if (g === 'fracCompare') {
    const { a, b, c, d } = params;
    const bigDen = b > d ? `${a}/${b}` : `${c}/${d}`;
    if (given === bigDen && given !== `${a / b > c / d ? `${a}/${b}` : `${c}/${d}`}`) {
      return { tag: 'frac/bigger-denominator', label: 'Thought the bigger denominator means a bigger fraction' };
    }
    return { tag: 'frac/compare', label: 'Comparison slip' };
  }
  if (g === 'fracAdd') {
    const { a, c, d } = params;
    if (given === `${a + c}/${d + d}`) return { tag: 'frac/added-denominators', label: 'Added the denominators too' };
    return { tag: 'frac/add', label: 'Addition slip' };
  }
  return { tag: 'recall', label: 'Slip' };
}

export function isCorrect(question, given) {
  return question.question_type === 'choice'
    ? String(given) === String(question.answer)
    : Number(given) === Number(question.answer);
}
