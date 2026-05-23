// generator.js — procedural problem generation.
//
// Math is doable "software only" because we synthesise unlimited, exactly gradable items
// from a skill's spec instead of authoring a question bank. Every item resolves to a single
// integer answer (so the drill UI stays uniform) but the *form* varies: straight arithmetic,
// number bonds / missing number, place value, number patterns, comparison. Strategy is
// rejection sampling — draw values, keep the first draw that satisfies the spec.

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Draw the second operand, optionally forced to a multiple of ten/hundred (mental-calc skills).
function drawB(s) {
  const base = randInt(s.bRange[0], s.bRange[1]);
  if (s.bMultipleSet) return base * pickFrom(s.bMultipleSet);
  if (s.bMultiple) return base * s.bMultiple;
  return base;
}

function additionCarries(a, b) {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true;
    a = Math.floor(a / 10); b = Math.floor(b / 10);
  }
  return false;
}
function subtractionBorrows(a, b) {
  while (a > 0 || b > 0) {
    if ((a % 10) < (b % 10)) return true;
    a = Math.floor(a / 10); b = Math.floor(b / 10);
  }
  return false;
}

const PLUS = '+', MINUS = '−', TIMES = '×', DIVIDE = '÷';

function problem(skill, display, answer, kind, parts) {
  return { skillId: skill.id, display, answer, kind, parts };
}

// --- per-kind generators ---

function genAdd(skill) {
  const s = skill.spec;
  const terms = s.terms || 2;
  for (let t = 0; t < 300; t++) {
    if (terms > 2) {
      const nums = Array.from({ length: terms }, () => randInt(s.aRange[0], s.aRange[1]));
      const sum = nums.reduce((x, y) => x + y, 0);
      if (s.maxSum != null && sum > s.maxSum) continue;
      if (s.minSum != null && sum < s.minSum) continue;
      return problem(skill, `${nums.join(` ${PLUS} `)} =`, sum, 'add', { terms: nums });
    }
    const a = randInt(s.aRange[0], s.aRange[1]);
    const b = drawB(s);
    const sum = a + b;
    if (s.maxSum != null && sum > s.maxSum) continue;
    if (s.minSum != null && sum < s.minSum) continue;
    const carries = additionCarries(a, b);
    if (s.carry === true && !carries) continue;
    if (s.carry === false && carries) continue;
    return problem(skill, `${a} ${PLUS} ${b} =`, sum, 'add', { terms: [a, b] });
  }
  return problem(skill, `${s.aRange[0]} ${PLUS} ${s.bRange[0]} =`, s.aRange[0] + s.bRange[0], 'add', { terms: [s.aRange[0], s.bRange[0]] });
}

function genSub(skill) {
  const s = skill.spec;
  for (let t = 0; t < 300; t++) {
    let a = randInt(s.aRange[0], s.aRange[1]);
    let b = drawB(s);
    if (b > a) { const tmp = a; a = b; b = tmp; }
    if (a === b) continue;
    const borrows = subtractionBorrows(a, b);
    if (s.borrow === true && !borrows) continue;
    if (s.borrow === false && borrows) continue;
    return problem(skill, `${a} ${MINUS} ${b} =`, a - b, 'sub', { a, b });
  }
  const big = Math.max(s.aRange[1], s.bRange[1]);
  return problem(skill, `${big} ${MINUS} 1 =`, big - 1, 'sub', { a: big, b: 1 });
}

const pickFrom = (arr) => arr[randInt(0, arr.length - 1)];

function genMul(skill) {
  const s = skill.spec;
  for (let t = 0; t < 300; t++) {
    const a = s.aSet ? pickFrom(s.aSet) : randInt(s.aRange[0], s.aRange[1]);
    const b = s.bSet ? pickFrom(s.bSet) : randInt(s.bRange[0], s.bRange[1]);
    if (s.maxProduct != null && a * b > s.maxProduct) continue;
    return problem(skill, `${a} ${TIMES} ${b} =`, a * b, 'mul', { a, b });
  }
  const a = s.aSet ? s.aSet[0] : s.aRange[0];
  const b = s.bSet ? s.bSet[0] : s.bRange[0];
  return problem(skill, `${a} ${TIMES} ${b} =`, a * b, 'mul', { a, b });
}

function genDiv(skill) {
  const s = skill.spec;
  for (let t = 0; t < 300; t++) {
    const divisor = s.divisorSet ? pickFrom(s.divisorSet) : randInt(s.divisorRange[0], s.divisorRange[1]);
    const quotient = randInt(s.quotientRange[0], s.quotientRange[1]);
    const dividend = divisor * quotient;
    if (s.maxDividend != null && dividend > s.maxDividend) continue;
    return problem(skill, `${dividend} ${DIVIDE} ${divisor} =`, quotient, 'div', { dividend, divisor });
  }
  const d = s.divisorSet ? s.divisorSet[0] : s.divisorRange[0], q = s.quotientRange[0];
  return problem(skill, `${d * q} ${DIVIDE} ${d} =`, q, 'div', { dividend: d * q, divisor: d });
}

// Missing number / number bond: a + b = c, hide one part. Single-integer answer.
function genMissing(skill) {
  const s = skill.spec;
  const op = s.op || '+';
  for (let t = 0; t < 300; t++) {
    let a, b, c;
    if (op === '+') {
      c = s.sum != null ? s.sum : randInt(s.cRange[0], s.cRange[1]);
      a = randInt(1, c - 1);
      b = c - a;
    } else {
      a = randInt(s.aRange[0], s.aRange[1]);
      b = randInt(1, a - 1);
      c = a - b;
      if (c <= 0) continue;
    }
    if (op === '+') {
      if (s.style === 'bond') return problem(skill, `${c} = ${a} ${PLUS} ___`, b, 'missing', { a, b, c, hidden: 'b' });
      return problem(skill, `${a} ${PLUS} ___ = ${c}`, b, 'missing', { a, b, c, hidden: 'b' });
    }
    return problem(skill, `${a} ${MINUS} ___ = ${c}`, b, 'missing', { a, b, c, hidden: 'b' });
  }
  return problem(skill, `1 ${PLUS} ___ = 2`, 1, 'missing', { a: 1, b: 1, c: 2, hidden: 'b' });
}

// Place value: "3 tens and 4 ones =" or, with hundreds, "2 hundreds, 3 tens and 4 ones ="
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
function genPlaceValue(skill) {
  const s = skill.spec;
  const tens = randInt(s.hundreds ? 0 : 1, 9);
  const ones = randInt(0, 9);
  if (s.hundreds) {
    const hundreds = randInt(1, 9);
    const display = `${plural(hundreds, 'hundred')}, ${plural(tens, 'ten')} and ${plural(ones, 'one')} =`;
    return problem(skill, display, hundreds * 100 + tens * 10 + ones, 'placeValue', { hundreds, tens, ones });
  }
  return problem(skill, `${plural(tens, 'ten')} and ${plural(ones, 'one')} =`, tens * 10 + ones, 'placeValue', { hundreds: 0, tens, ones });
}

// Odd / even: "Next even number after 23"
function genParity(skill) {
  const s = skill.spec;
  const which = s.which === 'either' ? (Math.random() < 0.5 ? 'even' : 'odd') : (s.which || 'even');
  const n = randInt(s.range[0], s.range[1]);
  const parityOk = which === 'even' ? n % 2 === 0 : n % 2 === 1;
  const answer = parityOk ? n + 2 : n + 1;
  return problem(skill, `Next ${which} number after ${n}`, answer, 'parity', { n, which });
}

// Like fractions within one whole: "3/8 + 2/8 = ?/8" → numerator answer
function genFractionLike(skill) {
  const s = skill.spec;
  for (let t = 0; t < 300; t++) {
    const d = randInt(s.denomRange[0], s.denomRange[1]);
    if (d < 2) continue;
    const op = Math.random() < 0.5 ? '+' : '-';
    if (op === '+') {
      const a = randInt(1, d - 1);
      const b = randInt(1, d - a); // a + b <= d (within one whole)
      return problem(skill, `${a}/${d} ${PLUS} ${b}/${d} = ?/${d}`, a + b, 'fractionLike', { a, b, d, op });
    }
    const a = randInt(2, d);
    const b = randInt(1, a - 1);
    return problem(skill, `${a}/${d} ${MINUS} ${b}/${d} = ?/${d}`, a - b, 'fractionLike', { a, b, d, op });
  }
  return problem(skill, `1/4 ${PLUS} 1/4 = ?/4`, 2, 'fractionLike', { a: 1, b: 1, d: 4, op: '+' });
}

// Comparison: "Which is greater: 34 or 43?"
function genCompare(skill) {
  const s = skill.spec;
  const pick = s.pick || 'greater';
  let a = randInt(s.range[0], s.range[1]);
  let b = randInt(s.range[0], s.range[1]);
  while (b === a) b = randInt(s.range[0], s.range[1]);
  const answer = pick === 'greater' ? Math.max(a, b) : Math.min(a, b);
  return problem(skill, `Which is ${pick}: ${a} or ${b}?`, answer, 'compare', { a, b, pick });
}

// Number pattern: "2, 4, 6, 8, ?" → next term
function genPattern(skill) {
  const s = skill.spec;
  const len = s.len || 4;
  for (let t = 0; t < 300; t++) {
    const step = randInt(s.stepRange[0], s.stepRange[1]);
    const up = s.dir === 'down' ? false : s.dir === 'up' ? true : Math.random() < 0.5;
    const start = randInt(s.startRange[0], s.startRange[1]);
    const seq = [];
    for (let i = 0; i <= len; i++) seq.push(up ? start + i * step : start - i * step);
    if (seq.some((n) => n < 0)) continue;
    const next = seq[len];
    return problem(skill, `${seq.slice(0, len).join(', ')}, ?`, next, 'pattern', { seq: seq.slice(0, len), next });
  }
  return problem(skill, '2, 4, 6, 8, ?', 10, 'pattern', { seq: [2, 4, 6, 8], next: 10 });
}

const KINDS = {
  add: genAdd, sub: genSub, mul: genMul, div: genDiv,
  missing: genMissing, placeValue: genPlaceValue, compare: genCompare, pattern: genPattern,
  parity: genParity, fractionLike: genFractionLike,
};

export function generateProblem(skill) {
  const gen = KINDS[skill.spec.kind] || genAdd;
  return gen(skill);
}
