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
// Integer helpers (Secondary 1). nz: a non-zero integer in [-max, max]; par:
// wrap a negative in parentheses for readable expressions, e.g. (-6).
function nzInt(rng, max) { const v = rint(rng, 1, max) * (rng() < 0.5 ? -1 : 1); return v; }
function par(n) { return n < 0 ? `(${n})` : `${n}`; }
// Number helpers (Secondary 1): gcd, lcm, and prime factorisation.
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
function primeFactors(n) { const f = []; let d = 2; while (d * d <= n) { while (n % d === 0) { f.push(d); n /= d; } d++; } if (n > 1) f.push(n); return f; }

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

  // ── Secondary 1 (G1) — Integers ─────────────────────────────────────────────
  [NS(24)]: (rng) => {
    const a = nzInt(rng, 12), b = nzInt(rng, 12); const ans = a + b;
    return { prompt: `${par(a)} + ${par(b)} = ?`, answer: ans, tag: 'int/ignore-sign',
      steps: [`Start at ${a} on the number line and move ${b >= 0 ? `${b} right` : `${Math.abs(b)} left`}.`, `${a} + ${b} = ${ans}.`],
      distractors: [a - b, Math.abs(a) + Math.abs(b), -(a + b)].filter((d) => d !== ans) };
  },
  [NS(25)]: (rng) => {
    const a = nzInt(rng, 12), b = nzInt(rng, 12); const ans = a - b;
    return { prompt: `${par(a)} − ${par(b)} = ?`, answer: ans, tag: 'int/subtract-negative',
      steps: [`Subtracting ${b} is the same as adding ${-b}.`, `${a} − ${b} = ${a} + ${-b} = ${ans}.`],
      distractors: [a + b, b - a, -(a - b)].filter((d) => d !== ans) };
  },
  [NS(26)]: (rng) => {
    const a = nzInt(rng, 9), b = nzInt(rng, 9); const ans = a * b;
    return { prompt: `${par(a)} × ${par(b)} = ?`, answer: ans, tag: 'int/sign-rule-mult',
      steps: [`${a < 0 === (b < 0) ? 'Same signs give a positive answer.' : 'Different signs give a negative answer.'}`, `${a} × ${b} = ${ans}.`],
      distractors: [-ans, ans + a, Math.abs(ans) === ans ? -Math.abs(ans) : Math.abs(ans)].filter((d) => d !== ans) };
  },
  [NS(27)]: (rng) => {
    const b = nzInt(rng, 9), q = nzInt(rng, 9); const a = b * q; const ans = q;
    return { prompt: `${par(a)} ÷ ${par(b)} = ?`, answer: ans, tag: 'int/sign-rule-div',
      steps: [`${a < 0 === (b < 0) ? 'Same signs give a positive answer.' : 'Different signs give a negative answer.'}`, `${a} ÷ ${b} = ${ans}.`],
      distractors: [-ans, ans + 1, ans - 1].filter((d) => d !== ans) };
  },
  [NS(28)]: (rng) => {
    const p = nzInt(rng, 8), q = rint(rng, 2, 6), r = nzInt(rng, 6); const ans = p + q * r;
    return { prompt: `${par(p)} + ${q} × ${par(r)} = ?`, answer: ans, tag: 'int/left-to-right',
      steps: ['Do the multiplication first.', `${q} × ${r} = ${q * r}; ${p} + ${q * r} = ${ans}.`],
      distractors: [(p + q) * r, p + q + r, p - q * r].filter((d) => d !== ans) };
  },
  [NS(29)]: (rng) => {
    const kind = rint(rng, 0, 2);
    if (kind === 0) {
      const t = rint(rng, -8, 3), drop = rint(rng, 4, 14); const ans = t - drop;
      return { prompt: `The temperature was ${t}°C. It fell by ${drop}°C overnight. What is the new temperature (in °C)?`, answer: ans, tag: 'int/direction',
        steps: [`A fall subtracts: ${t} − ${drop} = ${ans}.`], distractors: [t + drop, drop - t, -ans].filter((d) => d !== ans) };
    }
    if (kind === 1) {
      const depth = rint(rng, 5, 30), desc = rint(rng, 4, 20); const ans = -depth - desc;
      return { prompt: `A diver is ${depth} m below sea level (−${depth} m). She descends a further ${desc} m. What is her new position (in m, using a negative number for below sea level)?`, answer: ans, tag: 'int/direction',
        steps: [`Descending subtracts: −${depth} − ${desc} = ${ans}.`], distractors: [-depth + desc, depth + desc, ans + 2 * desc].filter((d) => d !== ans) };
    }
    const start = -rint(rng, 5, 40), deposit = rint(rng, 10, 60); const ans = start + deposit;
    return { prompt: `A bank account is overdrawn, with a balance of −$${Math.abs(start)} (that is, ${start} dollars). A deposit of $${deposit} is made. What is the new balance (in dollars)?`, answer: ans, tag: 'int/direction',
      steps: [`Add the deposit: ${start} + ${deposit} = ${ans}.`], distractors: [start - deposit, deposit - start, -ans].filter((d) => d !== ans) };
  },

  // ── Secondary 1 (G1) — Number: factors, powers and roots (MOE N1.2/N1.3) ────
  // NS030 — Prime factorisation (answer is a product of primes)
  [NS(30)]: (rng) => {
    const N = pick(rng, [12, 18, 20, 24, 28, 36, 40, 45, 48, 50, 54, 60, 72, 84, 90, 100]);
    const pf = primeFactors(N);
    const ans = pf.join(' × ');
    const merged = [pf[0] * pf[1], ...pf.slice(2)].join(' × ');           // not fully factorised
    const dropped = pf.slice(1).join(' × ');                              // missing a factor
    const extra = [...pf, 2].sort((a, b) => a - b).join(' × ');           // an extra factor
    return { prompt: `Express ${N} as a product of its prime factors (write the primes in order, e.g. 2 × 2 × 3).`, answer: ans, tag: 'num/not-fully-factorised',
      steps: [`Divide by the smallest prime repeatedly: ${N} = ${ans}.`],
      choices: [...new Set([ans, merged, dropped, extra])] };
  },
  // NS031 — HCF by prime factorisation
  [NS(31)]: (rng) => {
    const a = pick(rng, [12, 18, 24, 30, 36, 40, 48]), b = pick(rng, [16, 20, 24, 28, 36, 45, 60]);
    const ans = gcd(a, b);
    return { prompt: `Find the highest common factor (HCF) of ${a} and ${b}.`, answer: ans, tag: 'num/hcf-lcm-confuse',
      steps: [`${a} = ${primeFactors(a).join(' × ')}; ${b} = ${primeFactors(b).join(' × ')}.`, `Take the common prime factors: HCF = ${ans}.`],
      distractors: [lcm(a, b), ans + 1, Math.min(a, b)].filter((d) => d !== ans) };
  },
  // NS032 — LCM by prime factorisation
  [NS(32)]: (rng) => {
    const a = pick(rng, [4, 6, 8, 9, 10, 12, 15]), b = pick(rng, [6, 8, 9, 10, 14, 15, 18]);
    const ans = lcm(a, b);
    return { prompt: `Find the lowest common multiple (LCM) of ${a} and ${b}.`, answer: ans, tag: 'num/hcf-lcm-confuse',
      steps: [`${a} = ${primeFactors(a).join(' × ')}; ${b} = ${primeFactors(b).join(' × ')}.`, `Take the highest power of each prime: LCM = ${ans}.`],
      distractors: [gcd(a, b), a * b, ans + a].filter((d) => d !== ans) };
  },
  // NS033 — Squares and cubes
  [NS(33)]: (rng) => {
    const cube = rng() < 0.4;
    const base = cube ? rint(rng, 2, 6) : rint(rng, 2, 13);
    const ans = cube ? base ** 3 : base ** 2;
    return { prompt: `What is ${base}${cube ? '³' : '²'}?`, answer: ans, tag: 'num/power-as-multiply',
      steps: [`${base}${cube ? '³' : '²'} = ${base} × ${base}${cube ? ` × ${base}` : ''} = ${ans}.`],
      distractors: [cube ? base * 3 : base * 2, ans + base, cube ? base ** 2 : base ** 3].filter((d) => d !== ans && d > 0) };
  },
  // NS034 — Square and cube roots (perfect values)
  [NS(34)]: (rng) => {
    const cube = rng() < 0.4;
    const ans = cube ? rint(rng, 2, 6) : rint(rng, 2, 12);
    const radicand = cube ? ans ** 3 : ans ** 2;
    return { prompt: `What is ${cube ? '∛' : '√'}${radicand}?`, answer: ans, tag: 'num/root-as-divide',
      steps: [`${ans} × ${ans}${cube ? ` × ${ans}` : ''} = ${radicand}, so ${cube ? '∛' : '√'}${radicand} = ${ans}.`],
      distractors: [cube ? Math.round(radicand / 3) : Math.round(radicand / 2), ans + 1, ans + 2].filter((d) => d !== ans && d > 0) };
  },
  // NS035 — Index notation / evaluating powers
  [NS(35)]: (rng) => {
    const base = pick(rng, [2, 3, 4, 5]), exp = base === 2 ? rint(rng, 3, 8) : rint(rng, 2, 4);
    const ans = base ** exp;
    return { prompt: `Evaluate ${base}^${exp} (that is, ${base} to the power of ${exp}).`, answer: ans, tag: 'num/power-as-multiply',
      steps: [`${base}^${exp} = ${Array(exp).fill(base).join(' × ')} = ${ans}.`],
      distractors: [base * exp, base ** (exp - 1), ans + base].filter((d) => d !== ans && d > 0) };
  },
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
  // Secondary 1 (G1) — Integers
  nsNsIntAdd: NS(24), nsNsIntSub: NS(25), nsNsIntMul: NS(26), nsNsIntDiv: NS(27),
  nsNsIntOrderOps: NS(28), nsNsIntWord: NS(29),
  // Secondary 1 (G1) — Number: factors, powers and roots
  nsNsPrimeFactorise: NS(30), nsNsHcf: NS(31), nsNsLcm: NS(32),
  nsNsSquaresCubes: NS(33), nsNsRoots: NS(34), nsNsPowers: NS(35),
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
  // Prime-factorisation products: accept ×, x or * as the multiplication sign.
  const prod = (s) => s.replace(/[×x*]/g, '*').replace(/\s+/g, '');
  if (/[×x*]/.test(exp) && prod(raw) === prod(exp)) return { correct: true };
  return { correct: false };
}

export default { generateNumberSenseQuestionSet, checkNumberSenseAnswer };
