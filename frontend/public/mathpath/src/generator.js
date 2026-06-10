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

// Place value: tens/ones, or with hundreds, or with thousands.
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
function genPlaceValue(skill) {
  const s = skill.spec;
  if (s.tenThousands) {
    const tenThousands = randInt(1, 9), thousands = randInt(0, 9), hundreds = randInt(0, 9), tens = randInt(0, 9), ones = randInt(0, 9);
    const display = `${plural(tenThousands, 'ten thousand')}, ${plural(thousands, 'thousand')}, ${plural(hundreds, 'hundred')}, ${plural(tens, 'ten')} and ${plural(ones, 'one')} =`;
    const value = tenThousands * 10000 + thousands * 1000 + hundreds * 100 + tens * 10 + ones;
    return problem(skill, display, value, 'placeValue', { tenThousands, thousands, hundreds, tens, ones });
  }
  if (s.thousands) {
    const thousands = randInt(1, 9), hundreds = randInt(0, 9), tens = randInt(0, 9), ones = randInt(0, 9);
    const display = `${plural(thousands, 'thousand')}, ${plural(hundreds, 'hundred')}, ${plural(tens, 'ten')} and ${plural(ones, 'one')} =`;
    return problem(skill, display, thousands * 1000 + hundreds * 100 + tens * 10 + ones, 'placeValue', { tenThousands: 0, thousands, hundreds, tens, ones });
  }
  const tens = randInt(s.hundreds ? 0 : 1, 9);
  const ones = randInt(0, 9);
  if (s.hundreds) {
    const hundreds = randInt(1, 9);
    const display = `${plural(hundreds, 'hundred')}, ${plural(tens, 'ten')} and ${plural(ones, 'one')} =`;
    return problem(skill, display, hundreds * 100 + tens * 10 + ones, 'placeValue', { tenThousands: 0, thousands: 0, hundreds, tens, ones });
  }
  return problem(skill, `${plural(tens, 'ten')} and ${plural(ones, 'one')} =`, tens * 10 + ones, 'placeValue', { tenThousands: 0, thousands: 0, hundreds: 0, tens, ones });
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

// Division with remainder: "Find the remainder: 29 ÷ 4" → 1
function genDivRemainder(skill) {
  const s = skill.spec;
  const divisor = randInt(s.divisorRange[0], s.divisorRange[1]); // >= 2
  const quotient = randInt(s.quotientRange[0], s.quotientRange[1]);
  const remainder = randInt(1, divisor - 1); // always a non-zero leftover
  const dividend = divisor * quotient + remainder;
  return problem(skill, `Find the remainder: ${dividend} ${DIVIDE} ${divisor}`, remainder, 'divRemainder', { dividend, divisor, quotient, remainder });
}

// Equivalent fractions: "1/2 = ?/6" → 3  (denominators kept within 12)
function genFractionEquiv(skill) {
  const s = skill.spec;
  const maxDenom = s.maxDenom || 12;
  for (let t = 0; t < 300; t++) {
    const b = randInt(s.baseDenomRange[0], s.baseDenomRange[1]); // >= 2
    const k = randInt(s.scaleRange[0], s.scaleRange[1]); // >= 2
    const target = b * k;
    if (target > maxDenom) continue;
    const a = randInt(1, b - 1);
    return problem(skill, `${a}/${b} = ?/${target}`, a * k, 'fractionEquiv', { a, b, k, target });
  }
  return problem(skill, `1/2 = ?/4`, 2, 'fractionEquiv', { a: 1, b: 2, k: 2, target: 4 });
}

// Two related fractions within one whole (one denominator a multiple of the other):
// "1/2 + 1/4 = ?/4" → 3   answer is the numerator over the larger denominator.
function genFractionRelated(skill) {
  const maxDenom = skill.spec.maxDenom || 12;
  for (let t = 0; t < 400; t++) {
    const d1 = randInt(2, 6);
    const k = randInt(2, Math.floor(maxDenom / d1));
    if (k < 2) continue;
    const d2 = d1 * k; // larger, common denominator
    const a = randInt(1, d1 - 1); // a/d1 == (a*k)/d2
    const b = randInt(1, d2 - 1); // b/d2
    const vA = a * k, vB = b;
    const op = Math.random() < 0.5 ? '+' : '-';
    if (op === '+') {
      if (vA + vB > d2) continue; // keep within one whole
      return problem(skill, `${a}/${d1} ${PLUS} ${b}/${d2} = ?/${d2}`, vA + vB, 'fractionRelated', { a, d1, b, d2, op });
    }
    if (vA === vB) continue;
    if (vA > vB) return problem(skill, `${a}/${d1} ${MINUS} ${b}/${d2} = ?/${d2}`, vA - vB, 'fractionRelated', { a, d1, b, d2, op });
    return problem(skill, `${b}/${d2} ${MINUS} ${a}/${d1} = ?/${d2}`, vB - vA, 'fractionRelated', { a, d1, b, d2, op });
  }
  return problem(skill, `1/2 ${PLUS} 1/4 = ?/4`, 3, 'fractionRelated', { a: 1, d1: 2, b: 1, d2: 4, op: '+' });
}

// ---------- Primary 4 ----------

const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
const lcm = (a, b) => (a / gcd(a, b)) * b;
const dround = (x, p = 3) => Math.round(x * 10 ** p) / 10 ** p;
const fmt = (x) => String(dround(x, 3)); // tidy decimal for display (no trailing zeros)
function decProblem(skill, display, answer, kind, parts) {
  const p = problem(skill, display, dround(answer, 3), kind, parts);
  p.decimal = true; // tells the UI to allow a decimal point and grade with tolerance
  return p;
}

// Rounding whole numbers: "Round 3847 to the nearest 100" → 3800
function genRoundInt(skill) {
  const s = skill.spec;
  const unit = pickFrom(s.unitSet);
  const n = randInt(s.range[0], s.range[1]);
  return problem(skill, `Round ${n} to the nearest ${unit}`, Math.round(n / unit) * unit, 'roundInt', { n, unit });
}

// Greatest common factor: "Greatest common factor of 24 and 36" → 12
function genHcf(skill) {
  for (let t = 0; t < 300; t++) {
    const g = randInt(2, 9);
    const x = g * randInt(2, Math.floor(100 / g));
    const y = g * randInt(2, Math.floor(100 / g));
    if (x === y) continue;
    return problem(skill, `Greatest common factor of ${x} and ${y}`, gcd(x, y), 'hcf', { x, y });
  }
  return problem(skill, `Greatest common factor of 12 and 18`, 6, 'hcf', { x: 12, y: 18 });
}

// Lowest common multiple of two 1-digit numbers: "Lowest common multiple of 4 and 6" → 12
function genLcm(skill) {
  for (let t = 0; t < 300; t++) {
    const a = randInt(2, 9), b = randInt(2, 9);
    if (a === b) continue;
    return problem(skill, `Lowest common multiple of ${a} and ${b}`, lcm(a, b), 'lcm', { a, b });
  }
  return problem(skill, `Lowest common multiple of 4 and 6`, 12, 'lcm', { a: 4, b: 6 });
}

// Mixed number → improper fraction: "2 1/3 = ?/3" → 7
function genMixedToImproper(skill) {
  const maxDenom = skill.spec.maxDenom || 12;
  const d = randInt(2, maxDenom);
  const whole = randInt(1, 5);
  const num = randInt(1, d - 1);
  return problem(skill, `${whole} ${num}/${d} = ?/${d}`, whole * d + num, 'mixedToImproper', { whole, num, d });
}

// Fraction of a set: "3/4 of 20 =" → 15
function genFractionOfSet(skill) {
  for (let t = 0; t < 300; t++) {
    const d = randInt(2, 9);
    const set = d * randInt(2, Math.floor(100 / d));
    const a = randInt(1, d - 1);
    return problem(skill, `${a}/${d} of ${set} =`, (set / d) * a, 'fractionOfSet', { a, d, set });
  }
  return problem(skill, `1/2 of 10 =`, 5, 'fractionOfSet', { a: 1, d: 2, set: 10 });
}

// Add/subtract two unlike fractions (≤ 2 different denominators ≤ 12), answer over the LCD.
// "1/3 + 1/4 = ?/12" → 7
function genFractionUnlike(skill) {
  const maxDenom = skill.spec.maxDenom || 12;
  for (let t = 0; t < 500; t++) {
    const d1 = randInt(2, maxDenom), d2 = randInt(2, maxDenom);
    if (d1 === d2) continue;
    const L = lcm(d1, d2);
    const a = randInt(1, d1 - 1), b = randInt(1, d2 - 1);
    const vA = a * (L / d1), vB = b * (L / d2);
    const op = Math.random() < 0.5 ? '+' : '-';
    if (op === '+') {
      if (vA + vB > L) continue; // within one whole
      return problem(skill, `${a}/${d1} ${PLUS} ${b}/${d2} = ?/${L}`, vA + vB, 'fractionUnlike', { a, d1, b, d2, L, op });
    }
    if (vA === vB) continue;
    if (vA > vB) return problem(skill, `${a}/${d1} ${MINUS} ${b}/${d2} = ?/${L}`, vA - vB, 'fractionUnlike', { a, d1, b, d2, L, op });
    return problem(skill, `${b}/${d2} ${MINUS} ${a}/${d1} = ?/${L}`, vB - vA, 'fractionUnlike', { a, d1, b, d2, L, op });
  }
  return problem(skill, `1/3 ${PLUS} 1/4 = ?/12`, 7, 'fractionUnlike', { a: 1, d1: 3, b: 1, d2: 4, L: 12, op: '+' });
}

// Decimal place value (compose): "4 tenths, 7 hundredths and 3 thousandths =" → 0.473
function genDecimalPlaceValue(skill) {
  let t1, h1, th, N;
  do { t1 = randInt(0, 9); h1 = randInt(0, 9); th = randInt(0, 9); N = t1 * 100 + h1 * 10 + th; } while (N === 0);
  const display = `${t1} tenths, ${h1} hundredths and ${th} thousandths =`;
  return decProblem(skill, display, N / 1000, 'decimalPlaceValue', { t1, h1, th });
}

// Comparing decimals: "Which is greater: 0.7 or 0.65?" → 0.7
function genCompareDecimal(skill) {
  for (let t = 0; t < 300; t++) {
    const x = randInt(1, 999) / 100, y = randInt(1, 999) / 100;
    if (x === y) continue;
    return decProblem(skill, `Which is greater: ${fmt(x)} or ${fmt(y)}?`, Math.max(x, y), 'compareDecimal', { x, y });
  }
  return decProblem(skill, `Which is greater: 0.7 or 0.65?`, 0.7, 'compareDecimal', { x: 0.7, y: 0.65 });
}

// Rounding decimals: "Round 3.467 to 1 decimal place" → 3.5
function genRoundDecimal(skill) {
  const value = dround(randInt(1, 9999) / 1000, 3);
  const target = pickFrom(['whole', '1', '2']);
  const label = target === 'whole' ? 'the nearest whole number' : `${target} decimal place${target === '1' ? '' : 's'}`;
  const answer = target === 'whole' ? Math.round(value) : dround(value, Number(target));
  return decProblem(skill, `Round ${fmt(value)} to ${label}`, answer, 'roundDecimal', { value, target });
}

// Add/subtract decimals up to 2 dp (computed in cents to stay exact): "12.3 + 4.05 =" → 16.35
function genAddSubDecimal(skill) {
  for (let t = 0; t < 300; t++) {
    const x = randInt(10, 9000), y = randInt(10, 9000); // cents
    const op = Math.random() < 0.5 ? '+' : '-';
    if (op === '+') {
      if (x + y > 9999) continue;
      return decProblem(skill, `${fmt(x / 100)} ${PLUS} ${fmt(y / 100)} =`, (x + y) / 100, 'addSubDecimal', { x, y, op });
    }
    if (x <= y) continue;
    return decProblem(skill, `${fmt(x / 100)} ${MINUS} ${fmt(y / 100)} =`, (x - y) / 100, 'addSubDecimal', { x, y, op });
  }
  return decProblem(skill, `1.5 ${PLUS} 2.25 =`, 3.75, 'addSubDecimal', { x: 150, y: 225, op: '+' });
}

// Multiply/divide a decimal (≤ 2 dp) by a 1-digit whole number: "1.2 × 4 =" → 4.8 ; "4.8 ÷ 4 =" → 1.2
function genMulDivDecimal(skill) {
  const m = randInt(2, 9);
  if (Math.random() < 0.5) {
    const x = randInt(10, 500) / 100; // the decimal
    return decProblem(skill, `${fmt(x)} ${TIMES} ${m} =`, x * m, 'mulDivDecimal', { op: '*', x, m });
  }
  const q = randInt(10, 300) / 100; // clean quotient
  const dividend = dround(q * m, 2);
  return decProblem(skill, `${fmt(dividend)} ${DIVIDE} ${m} =`, q, 'mulDivDecimal', { op: '/', x: dividend, m });
}

// Express a fraction as a decimal (denominator a factor of 10 or 100): "3/4 =" → 0.75
function genFracToDecimal(skill) {
  const denomSet = skill.spec.denomSet || [2, 4, 5, 10, 20, 25, 50, 100];
  for (let t = 0; t < 300; t++) {
    const d = pickFrom(denomSet);
    const a = randInt(1, d - 1);
    if (a / d >= 1) continue;
    return decProblem(skill, `${a}/${d} =`, a / d, 'fracToDecimal', { a, d });
  }
  return decProblem(skill, `3/4 =`, 0.75, 'fracToDecimal', { a: 3, d: 4 });
}

// ---------- Primary 5 ----------

// Multiply/divide whole numbers by 10/100/1000 and their multiples: "47 × 1000 =" → 47000
function genMulDivPow10(skill) {
  const factor = pickFrom([10, 100, 1000]) * pickFrom([1, 1, 1, 2, 3, 4, 5]);
  if (Math.random() < 0.5) {
    const a = randInt(2, 999);
    return problem(skill, `${a} ${TIMES} ${factor} =`, a * factor, 'mulDivPow10', { op: '*', a, factor });
  }
  const q = randInt(2, 999);
  return problem(skill, `${q * factor} ${DIVIDE} ${factor} =`, q, 'mulDivPow10', { op: '/', a: q * factor, factor });
}

// Order of operations / brackets. Values constructed so the result is a whole number.
// "3 + 4 × 5 =" → 23   ·   "(3 + 4) × 5 =" → 35
function genOrderOps(skill) {
  const r = randInt, br = !!skill.spec.brackets;
  let display, jsExpr, answer;
  const set = (d, j, ans) => { display = d; jsExpr = j; answer = ans; };
  if (!br) {
    switch (r(0, 4)) {
      case 0: { const a = r(1, 20), b = r(2, 9), c = r(2, 9); set(`${a} ${PLUS} ${b} ${TIMES} ${c} =`, `${a}+${b}*${c}`, a + b * c); break; }
      case 1: { const a = r(2, 9), b = r(2, 9), c = r(1, a * b); set(`${a} ${TIMES} ${b} ${MINUS} ${c} =`, `${a}*${b}-${c}`, a * b - c); break; }
      case 2: { const a = r(2, 9), b = r(2, 9), c = r(1, 20); set(`${a} ${TIMES} ${b} ${PLUS} ${c} =`, `${a}*${b}+${c}`, a * b + c); break; }
      case 3: { const c = r(2, 9), q = r(2, 9), a = r(1, 20); set(`${a} ${PLUS} ${c * q} ${DIVIDE} ${c} =`, `${a}+${c * q}/${c}`, a + q); break; }
      default: { const c = r(2, 9), q = r(2, 9), a = r(q, 25); set(`${a} ${MINUS} ${c * q} ${DIVIDE} ${c} =`, `${a}-${c * q}/${c}`, a - q); break; }
    }
  } else {
    switch (r(0, 4)) {
      case 0: { const a = r(2, 15), b = r(2, 15), c = r(2, 9); set(`(${a} ${PLUS} ${b}) ${TIMES} ${c} =`, `(${a}+${b})*${c}`, (a + b) * c); break; }
      case 1: { const a = r(3, 20), b = r(1, a - 1), c = r(2, 9); set(`(${a} ${MINUS} ${b}) ${TIMES} ${c} =`, `(${a}-${b})*${c}`, (a - b) * c); break; }
      case 2: { const a = r(2, 9), b = r(2, 12), c = r(2, 12); set(`${a} ${TIMES} (${b} ${PLUS} ${c}) =`, `${a}*(${b}+${c})`, a * (b + c)); break; }
      case 3: { const c = r(2, 9), q = r(2, 9), sum = c * q, a = r(1, sum - 1); set(`(${a} ${PLUS} ${sum - a}) ${DIVIDE} ${c} =`, `(${a}+${sum - a})/${c}`, q); break; }
      default: { const a = r(2, 9), b = r(2, 12), c = r(1, b - 1); set(`${a} ${TIMES} (${b} ${MINUS} ${c}) =`, `${a}*(${b}-${c})`, a * (b - c)); break; }
    }
  }
  return problem(skill, display, answer, 'orderOps', { jsExpr });
}

// Add/subtract mixed numbers, answer as an improper numerator over the LCD: "1 1/2 + 2 1/3 = ?/6" → 23
function genMixedAddSub(skill) {
  const maxDenom = skill.spec.maxDenom || 12, r = randInt;
  const d1 = r(2, maxDenom), d2 = r(2, maxDenom), L = lcm(d1, d2);
  const w1 = r(1, 4), a = r(1, d1 - 1), w2 = r(1, 4), b = r(1, d2 - 1);
  const V1 = w1 * L + a * (L / d1), V2 = w2 * L + b * (L / d2);
  const op = Math.random() < 0.5 ? '+' : '-';
  if (op === '+') return problem(skill, `${w1} ${a}/${d1} ${PLUS} ${w2} ${b}/${d2} = ?/${L}`, V1 + V2, 'mixedAddSub', { w1, a, d1, w2, b, d2, L, op });
  if (V1 >= V2) return problem(skill, `${w1} ${a}/${d1} ${MINUS} ${w2} ${b}/${d2} = ?/${L}`, V1 - V2, 'mixedAddSub', { w1, a, d1, w2, b, d2, L, op });
  return problem(skill, `${w2} ${b}/${d2} ${MINUS} ${w1} ${a}/${d1} = ?/${L}`, V2 - V1, 'mixedAddSub', { w1, a, d1, w2, b, d2, L, op });
}

// Fraction (proper/improper/mixed) × whole number, chosen so the product is a whole: "3/4 × 8 =" → 6
function genFracTimesWhole(skill) {
  const r = randInt;
  const d = r(2, 9), n = d * r(1, 6); // n a multiple of d → whole-number product
  if (Math.random() < 0.4) {
    const w = r(1, 4), a = r(1, d - 1);
    return problem(skill, `${w} ${a}/${d} ${TIMES} ${n} =`, (w * d + a) * (n / d), 'fracTimesWhole', { w, a, d, n });
  }
  const a = r(1, 2 * d);
  return problem(skill, `${a}/${d} ${TIMES} ${n} =`, a * (n / d), 'fracTimesWhole', { w: 0, a, d, n });
}

// Multiply two fractions, answer as numerator over the product of denominators: "2/3 × 3/5 = ?/15" → 6
function genFracTimesFrac(skill) {
  const r = randInt;
  const d1 = r(2, 8), d2 = r(2, 8), a = r(1, 2 * d1), c = r(1, 2 * d2);
  return problem(skill, `${a}/${d1} ${TIMES} ${c}/${d2} = ?/${d1 * d2}`, a * c, 'fracTimesFrac', { a, d1, c, d2 });
}

// Multiply/divide decimals (≤ 3 dp) by 10/100/1000 and their multiples: "0.45 × 100 =" → 45
function genDecMulDivPow10(skill) {
  const factor = pickFrom([10, 100, 1000]) * pickFrom([1, 1, 1, 2, 3, 5]);
  if (Math.random() < 0.5) {
    const x = randInt(1, 9999) / 1000;
    return decProblem(skill, `${fmt(x)} ${TIMES} ${factor} =`, x * factor, 'decMulDivPow10', { op: '*', x, factor });
  }
  const q = randInt(1, 9999) / 1000;
  return decProblem(skill, `${fmt(dround(q * factor, 3))} ${DIVIDE} ${factor} =`, q, 'decMulDivPow10', { op: '/', x: dround(q * factor, 3), factor });
}

// Metric conversion in decimal form: "2500 m = ? km" → 2.5  ·  "3.2 km = ? m" → 3200
function genUnitConvert(skill) {
  const [large, small, factor] = pickFrom([['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['l', 'ml', 1000]]);
  if (Math.random() < 0.5) {
    const a = randInt(1, 9999); // smaller unit → larger unit
    return decProblem(skill, `${a} ${small} = ? ${large}`, a / factor, 'unitConvert', { op: '/', a, factor });
  }
  const a = randInt(1, 9000) / 1000; // larger unit (≤ 3 dp) → smaller unit
  return decProblem(skill, `${fmt(a)} ${large} = ? ${small}`, a * factor, 'unitConvert', { op: '*', a, factor });
}

// Expressing a part of a whole as a percentage: "15 out of 50 = ?%" → 30
function genPartAsPercent(skill) {
  for (let t = 0; t < 300; t++) {
    const whole = pickFrom([10, 20, 25, 50, 100, 200]);
    const part = randInt(1, whole - 1);
    if ((part * 100) % whole !== 0) continue;
    return problem(skill, `${part} out of ${whole} = ?%`, (part * 100) / whole, 'partAsPercent', { part, whole });
  }
  return problem(skill, `1 out of 4 = ?%`, 25, 'partAsPercent', { part: 1, whole: 4 });
}

// Finding a percentage part of a whole: "20% of 80 =" → 16
function genPercentOf(skill) {
  for (let t = 0; t < 300; t++) {
    const pct = randInt(1, 20) * 5;
    const whole = pickFrom([20, 40, 50, 60, 80, 100, 150, 200, 400, 500]);
    if ((pct * whole) % 100 !== 0) continue;
    return problem(skill, `${pct}% of ${whole} =`, (pct * whole) / 100, 'percentOf', { pct, whole });
  }
  return problem(skill, `20% of 50 =`, 10, 'percentOf', { pct: 20, whole: 50 });
}

// Discount / GST / interest — applied percentage: "A $250 item has a 20% discount. Discount = ?" → 50
function genPercentApp(skill) {
  const phrase = pickFrom([
    (p, c) => `A $${p} item has a ${c}% discount. How much is the discount, in $?`,
    (p, c) => `${c}% GST is charged on a $${p} purchase. How much is the GST, in $?`,
    (p, c) => `$${p} earns ${c}% interest in a year. How much interest, in $?`,
  ]);
  for (let t = 0; t < 300; t++) {
    const price = pickFrom([50, 80, 100, 120, 150, 200, 250, 400, 500, 800, 1000]);
    const pct = pickFrom([5, 8, 9, 10, 15, 20, 25, 50]);
    if ((price * pct) % 100 !== 0) continue;
    return problem(skill, phrase(price, pct), (price * pct) / 100, 'percentApp', { price, pct });
  }
  return problem(skill, `A $100 item has a 20% discount. How much is the discount, in $?`, 20, 'percentApp', { price: 100, pct: 20 });
}

// Rate: find the rate, total, or number of units given the other two.
function genRate(skill) {
  const r = randInt, rate = r(2, 60), units = r(2, 12), total = rate * units;
  const which = pickFrom(['total', 'rate', 'units']);
  if (which === 'total') return problem(skill, `A car travels at ${rate} km/h for ${units} h. Distance = ? km`, total, 'rate', { rate, units, total, which });
  if (which === 'rate') return problem(skill, `A car travels ${total} km in ${units} h. Speed = ? km/h`, rate, 'rate', { rate, units, total, which });
  return problem(skill, `At ${rate} km/h, how many hours to travel ${total} km?`, units, 'rate', { rate, units, total, which });
}

// ---------- Primary 6 ----------

// Divide a proper fraction by a whole number — the denominator gets multiplied: "1/2 ÷ 3 = 1/?" → 6
function genFracDivWhole(skill) {
  const r = randInt;
  const d = r(2, 8), a = r(1, d - 1), n = r(2, 9);
  return problem(skill, `${a}/${d} ${DIVIDE} ${n} = ${a}/?`, d * n, 'fracDivWhole', { a, d, n });
}

// Divide a whole number by a proper fraction (invert and multiply): "6 ÷ 2/3 =" → 9
function genDivByFraction(skill) {
  const r = randInt;
  const d = r(2, 6), a = r(1, d - 1), k = r(2, 6), n = a * k; // n chosen so n*d/a is whole
  return problem(skill, `${n} ${DIVIDE} ${a}/${d} =`, k * d, 'divByFraction', { n, a, d });
}

// Find the whole given a part and the percentage: "20% of a number is 30. What is the number?" → 150
function genPercentWhole(skill) {
  for (let t = 0; t < 300; t++) {
    const pct = randInt(1, 19) * 5;
    const whole = pickFrom([20, 40, 50, 60, 80, 100, 120, 150, 200, 400, 500]);
    if ((pct * whole) % 100 !== 0) continue;
    return problem(skill, `${pct}% of a number is ${(pct * whole) / 100}. What is the number?`, whole, 'percentWhole', { pct, part: (pct * whole) / 100, whole });
  }
  return problem(skill, `20% of a number is 30. What is the number?`, 150, 'percentWhole', { pct: 20, part: 30, whole: 150 });
}

// Percentage increase / decrease: "A price increased from $80 to $100. Percentage increase?" → 25
function genPercentChange(skill) {
  for (let t = 0; t < 300; t++) {
    const before = pickFrom([20, 25, 40, 50, 80, 100, 200, 250, 500]);
    const pct = pickFrom([5, 10, 15, 20, 25, 40, 50]);
    if ((before * pct) % 100 !== 0) continue;
    const inc = Math.random() < 0.5;
    const after = inc ? before + (before * pct) / 100 : before - (before * pct) / 100;
    if (after <= 0) continue;
    return problem(skill, `A price ${inc ? 'increased' : 'decreased'} from $${before} to $${after}. What is the percentage ${inc ? 'increase' : 'decrease'}?`, pct, 'percentChange', { before, after });
  }
  return problem(skill, `A price increased from $80 to $100. What is the percentage increase?`, 25, 'percentChange', { before: 80, after: 100 });
}

// Missing term in a pair of equivalent ratios: "2 : 3 = 8 : ?" → 12
function genRatioMissing(skill) {
  const r = randInt;
  const a = r(1, 9), b = r(1, 9), k = r(2, 9);
  return problem(skill, `${a} : ${b} = ${a * k} : ?`, b * k, 'ratioMissing', { a, b, k });
}

// Divide a quantity in a given ratio: "Divide $100 in the ratio 2 : 3. First share?" → 40
function genRatioDivide(skill) {
  const r = randInt;
  const a = r(1, 5), b = r(1, 5), unit = r(2, 20), total = (a + b) * unit;
  const first = Math.random() < 0.5;
  return problem(skill, `Divide $${total} in the ratio ${a} : ${b}. What is the ${first ? 'first' : 'second'} share, in $?`, (first ? a : b) * unit, 'ratioDivide', { a, b, total, first });
}

// Simplify a linear expression — combine like terms, give the coefficient: "5a + 3a − 2a = ?a" → 6
function genAlgSimplify(skill) {
  const r = randInt, L = pickFrom(['a', 'b', 'x', 'y', 'n']);
  const p = r(2, 9), q = r(1, 6), s = r(0, p + q - 1);
  const expr = s > 0 ? `${p}${L} ${PLUS} ${q}${L} ${MINUS} ${s}${L}` : `${p}${L} ${PLUS} ${q}${L}`;
  return problem(skill, `${expr} = ?${L}`, p + q - s, 'algSimplify', { p, q, s });
}

// Evaluate a linear expression by substitution: "If x = 5, find 3x + 2" → 17
function genAlgEval(skill) {
  const r = randInt, L = pickFrom(['a', 'b', 'x', 'y', 'n']);
  const val = r(2, 12), m = r(2, 9), c = r(1, 20);
  if (Math.random() < 0.5 && m * val - c >= 0) {
    return problem(skill, `If ${L} = ${val}, find ${m}${L} ${MINUS} ${c}`, m * val - c, 'algEval', { val, m, c, op: '-' });
  }
  return problem(skill, `If ${L} = ${val}, find ${m}${L} ${PLUS} ${c}`, m * val + c, 'algEval', { val, m, c, op: '+' });
}

// Solve a simple linear equation (whole-number coefficient): "Solve 3x + 2 = 14. x = ?" → 4
function genAlgSolve(skill) {
  const r = randInt, L = pickFrom(['x', 'y', 'n', 'a']);
  const x = r(2, 12), m = r(2, 9), c = r(1, 20);
  if (Math.random() < 0.5 && m * x - c > 0) {
    const rhs = m * x - c;
    return problem(skill, `Solve: ${m}${L} ${MINUS} ${c} = ${rhs}.  ${L} = ?`, x, 'algSolve', { x, m, c, op: '-', rhs });
  }
  const rhs = m * x + c;
  return problem(skill, `Solve: ${m}${L} ${PLUS} ${c} = ${rhs}.  ${L} = ?`, x, 'algSolve', { x, m, c, op: '+', rhs });
}

// Average of a set of data, or the total given the average: "Find the average of 4, 8, 6" → 6
function genAverage(skill) {
  const r = randInt;
  if (Math.random() < 0.4) {
    const count = r(3, 5), mean = r(2, 30);
    return problem(skill, `The average of ${count} numbers is ${mean}. What is their total?`, mean * count, 'average', { mean, count, which: 'total' });
  }
  for (let t = 0; t < 300; t++) {
    const count = r(3, 5), nums = Array.from({ length: count }, () => r(1, 40));
    const sum = nums.reduce((p, n) => p + n, 0);
    if (sum % count !== 0) continue;
    return problem(skill, `Find the average of ${nums.join(', ')}`, sum / count, 'average', { nums, which: 'mean' });
  }
  return problem(skill, `Find the average of 4, 8, 6`, 6, 'average', { nums: [4, 8, 6], which: 'mean' });
}

// ---------- Measurement & Geometry (P3 / P5 / P6) ----------
// Each of these pairs with an SVG figure drawn from the same parts (see diagram.js).

const PI = 3.14;

function genRectArea(skill) {
  const l = randInt(3, 15), w = randInt(2, 12);
  return problem(skill, `Area of this rectangle = ? cm²`, l * w, 'rectArea', { l, w });
}

function genRectPerimeter(skill) {
  const l = randInt(3, 15), w = randInt(2, 12);
  return problem(skill, `Perimeter of this rectangle = ? cm`, 2 * (l + w), 'rectPerimeter', { l, w });
}

function genTriArea(skill) {
  const base = randInt(3, 16);
  let height = randInt(2, 12);
  if ((base * height) % 2 !== 0) height += 1; // keep ½·b·h a whole number
  return problem(skill, `Area of this triangle = ? cm²`, (base * height) / 2, 'triArea', { base, height });
}

function genCuboidVolume(skill) {
  const l = randInt(2, 9), b = randInt(2, 9), h = randInt(2, 9);
  return problem(skill, `Volume of this cuboid = ? cm³`, l * b * h, 'cuboidVolume', { l, b, h });
}

function genCircleArea(skill) {
  const r = randInt(1, 12);
  return decProblem(skill, `Area of this circle = ? cm²  (take π = 3.14)`, PI * r * r, 'circleArea', { r });
}

function genCircleCircumference(skill) {
  const r = randInt(1, 12);
  return decProblem(skill, `Circumference of this circle = ? cm  (take π = 3.14)`, 2 * PI * r, 'circleCircumference', { r });
}

// Build n consecutive angles that sum to `total`, each ≥ 20°; the last is the unknown.
function angleSegments(total, n) {
  for (let t = 0; t < 300; t++) {
    const seg = [];
    let remaining = total;
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      const max = remaining - 20 * (n - i - 1);
      if (max < 20) { ok = false; break; }
      const v = randInt(20, max);
      seg.push(v); remaining -= v;
    }
    if (ok && remaining >= 20) { seg.push(remaining); return seg; }
  }
  return total === 180 ? [110, 70] : [120, 90, 150];
}

function genAngleLine(skill) {
  const seg = angleSegments(180, Math.random() < 0.5 ? 2 : 3);
  return problem(skill, `Find angle x, in degrees.`, seg[seg.length - 1], 'angleLine', { segments: seg, total: 180 });
}

function genAnglePoint(skill) {
  const seg = angleSegments(360, randInt(2, 3) + 1);
  return problem(skill, `Find angle x, in degrees.`, seg[seg.length - 1], 'anglePoint', { segments: seg, total: 360 });
}

function genAngleTriangle(skill) {
  for (let t = 0; t < 300; t++) {
    const a = randInt(20, 130), b = randInt(20, 130);
    if (180 - a - b >= 20) return problem(skill, `Find angle x, in degrees.`, 180 - a - b, 'angleTriangle', { a, b });
  }
  return problem(skill, `Find angle x, in degrees.`, 80, 'angleTriangle', { a: 60, b: 40 });
}

function genSemicircleArea(skill) {
  const r = randInt(2, 12);
  return decProblem(skill, `Area of this semicircle = ? cm²  (take π = 3.14)`, 0.5 * PI * r * r, 'semicircleArea', { r });
}

function genSemicirclePerimeter(skill) {
  const r = randInt(2, 12);
  return decProblem(skill, `Perimeter of this semicircle = ? cm  (take π = 3.14)`, PI * r + 2 * r, 'semicirclePerimeter', { r });
}

function genQuarterArea(skill) {
  const r = randInt(2, 12);
  return decProblem(skill, `Area of this quarter circle = ? cm²  (take π = 3.14)`, 0.25 * PI * r * r, 'quarterArea', { r });
}

function genQuarterPerimeter(skill) {
  const r = randInt(2, 12);
  return decProblem(skill, `Perimeter of this quarter circle = ? cm  (take π = 3.14)`, (PI * r) / 2 + 2 * r, 'quarterPerimeter', { r });
}

// L-shaped composite area = outer rectangle − notch.
function genCompositeArea(skill) {
  const W = randInt(6, 16), H = randInt(5, 12);
  const nw = randInt(2, W - 3), nh = randInt(2, H - 2);
  return problem(skill, `Area of this L-shaped figure = ? cm²`, W * H - nw * nh, 'compositeArea', { W, H, nw, nh });
}

// ---------- Word problems (bar models) ----------
// One generator + one diagram renderer cover several model-method structures (spec.structure).
// Every problem has a worded prompt, a proportional bar diagram, and a single whole-number answer.

const BAR_NAMES = ['Aisha', 'Ben', 'Mei', 'Raj', 'Sara', 'Tom', 'Lily', 'Omar'];
function twoNames() { const a = pickFrom(BAR_NAMES); let b = pickFrom(BAR_NAMES); while (b === a) b = pickFrom(BAR_NAMES); return [a, b]; }
const cell = (value, label, accent) => ({ value, label, accent: !!accent });
const barModelProblem = (skill, display, answer, parts) => problem(skill, display, answer, 'barModel', parts);

function genBarModel(skill) {
  const s = skill.spec, r = randInt;
  let st = s.structure;
  if (st === 'compare') st = Math.random() < 0.5 ? 'compareMore' : 'compareDiff';

  if (st === 'partWhole') {
    const a = r(s.min || 3, s.max || 20), b = r(s.min || 3, s.max || 20);
    const c = pickFrom([['red', 'blue', 'marbles'], ['green', 'red', 'apples'], ['big', 'small', 'boxes'], ['gold', 'silver', 'coins']]);
    const display = `A bag has ${a} ${c[0]} ${c[2]} and ${b} ${c[1]} ${c[2]}. How many ${c[2]} are there altogether?`;
    const model = { rows: [{ cells: [cell(a, `${a}`), cell(b, `${b}`)] }], braces: [{ row: 0, start: 0, end: 1, label: '?', side: 'bottom' }] };
    return barModelProblem(skill, display, a + b, { structure: st, a, b, model });
  }
  if (st === 'missingPart') {
    const whole = r(s.wholeMin || 12, s.wholeMax || 40), a = r(2, whole - 2);
    const c = pickFrom([['children', 'are boys', 'girls'], ['fruits', 'are apples', 'oranges'], ['pencils', 'are red', 'blue ones']]);
    const display = `There are ${whole} ${c[0]}. ${a} ${c[1]}. How many ${c[2]} are there?`;
    const model = { rows: [{ cells: [cell(a, `${a}`), cell(whole - a, '?')] }], braces: [{ row: 0, start: 0, end: 1, label: `${whole}`, side: 'top' }] };
    return barModelProblem(skill, display, whole - a, { structure: st, whole, a, model });
  }
  if (st === 'compareMore') {
    const [A, B] = twoNames(), a = r(s.min || 5, s.max || 40), d = r(s.dMin || 3, s.dMax || 20);
    const item = pickFrom(['stickers', 'stamps', 'shells', 'cards']);
    const display = `${A} has ${a} ${item}. ${B} has ${d} more ${item} than ${A}. How many ${item} does ${B} have?`;
    const model = { rows: [{ caption: A, cells: [cell(a, `${a}`)] }, { caption: B, cells: [cell(a, `${a}`), cell(d, `${d}`, true)] }], braces: [{ row: 1, start: 0, end: 1, label: '?', side: 'bottom' }] };
    return barModelProblem(skill, display, a + d, { structure: st, a, d, model });
  }
  if (st === 'compareDiff') {
    const [A, B] = twoNames();
    let a = r(s.min || 5, s.max || 40), b = r(s.min || 5, s.max || 40);
    if (a === b) a += r(1, 5);
    if (a < b) { const t = a; a = b; b = t; }
    const item = pickFrom(['books', 'sweets', 'beads', 'points']);
    const display = `${A} has ${a} ${item}. ${B} has ${b} ${item}. How many more ${item} does ${A} have than ${B}?`;
    const model = { rows: [{ caption: A, cells: [cell(a, `${a}`)] }, { caption: B, cells: [cell(b, `${b}`)] }] };
    return barModelProblem(skill, display, a - b, { structure: st, a, b, model });
  }
  if (st === 'unitsTotal') {
    const n = r(2, s.nMax || 5), each = r(2, s.eachMax || 9);
    const [name] = twoNames(), c = pickFrom([['bags', 'bag', 'marbles'], ['boxes', 'box', 'crayons'], ['packs', 'pack', 'cards'], ['baskets', 'basket', 'eggs']]);
    const display = `${name} buys ${n} ${c[0]} of ${c[2]}. Each ${c[1]} has ${each} ${c[2]}. How many ${c[2]} in all?`;
    const model = { rows: [{ cells: Array.from({ length: n }, () => cell(each, `${each}`)) }], braces: [{ row: 0, start: 0, end: n - 1, label: '?', side: 'bottom' }] };
    return barModelProblem(skill, display, n * each, { structure: st, n, each, model });
  }
  if (st === 'unitsEach') {
    const n = r(2, s.nMax || 6), each = r(2, s.eachMax || 12), total = n * each;
    const c = pickFrom([['children', 'sweets'], ['friends', 'stickers'], ['plates', 'biscuits'], ['boxes', 'pens']]);
    const display = `${total} ${c[1]} are shared equally among ${n} ${c[0]}. How many ${c[1]} does each get?`;
    const model = { rows: [{ cells: Array.from({ length: n }, (_, i) => cell(each, i === 0 ? '?' : '')) }], braces: [{ row: 0, start: 0, end: n - 1, label: `${total}`, side: 'top' }] };
    return barModelProblem(skill, display, each, { structure: st, total, n, model });
  }
  if (st === 'fractionOfQuantity') {
    const d = pickFrom([2, 3, 4, 5, 6, 8]), unitVal = r(2, s.eachMax || 9), num = r(1, d - 1), whole = d * unitVal;
    const c = pickFrom([['sweets', 'red'], ['marbles', 'blue'], ['stickers', 'shiny'], ['beads', 'gold']]);
    const display = `There are ${whole} ${c[0]}. ${num}/${d} of them are ${c[1]}. How many ${c[0]} are ${c[1]}?`;
    const cells = Array.from({ length: d }, (_, i) => cell(unitVal, '', i < num));
    const model = { rows: [{ cells }], braces: [{ row: 0, start: 0, end: d - 1, label: `${whole}`, side: 'top' }, { row: 0, start: 0, end: num - 1, label: '?', side: 'bottom' }] };
    return barModelProblem(skill, display, num * unitVal, { structure: st, whole, d, num, model });
  }
  if (st === 'percentOfQuantity') {
    let pct, whole;
    do { pct = pickFrom([5, 10, 20, 25, 40, 50, 60, 75, 80]); whole = pickFrom([20, 40, 50, 60, 80, 100, 120, 160, 200, 240, 400]); } while ((pct * whole) % 100 !== 0);
    const part = (pct * whole) / 100;
    const c = pickFrom([['students', 'girls'], ['apples', 'ripe'], ['books', 'fiction'], ['cars', 'red']]);
    const display = `${pct}% of the ${whole} ${c[0]} are ${c[1]}. How many ${c[0]} are ${c[1]}?`;
    const model = { rows: [{ cells: [cell(part, '', true), cell(whole - part, '')] }], braces: [{ row: 0, start: 0, end: 1, label: `${whole}`, side: 'top' }, { row: 0, start: 0, end: 0, label: '?', side: 'bottom' }] };
    return barModelProblem(skill, display, part, { structure: st, whole, pct, model });
  }
  if (st === 'ratioShare') {
    let a = r(1, 5), b = r(1, 5); if (a === b) b = (b % 5) + 1; if (a + b < 3) b += 2;
    const unit = r(2, s.eachMax || 12), total = (a + b) * unit, [A, B] = twoNames();
    const item = pickFrom(['sweets', 'marbles', 'stickers', 'coins']);
    const display = `${total} ${item} are shared between ${A} and ${B} in the ratio ${a} : ${b}. How many ${item} does ${A} get?`;
    const cells = Array.from({ length: a + b }, (_, i) => cell(unit, '', i < a));
    const model = { rows: [{ cells }], braces: [{ row: 0, start: 0, end: a + b - 1, label: `${total}`, side: 'top' }, { row: 0, start: 0, end: a - 1, label: '?', side: 'bottom' }] };
    return barModelProblem(skill, display, a * unit, { structure: st, total, a, b, model });
  }
  if (st === 'percentWholeBar') {
    let pct, whole;
    do { pct = pickFrom([5, 10, 20, 25, 40, 50, 75, 80]); whole = pickFrom([20, 40, 50, 60, 80, 100, 120, 150, 200, 240, 400, 500]); } while ((pct * whole) % 100 !== 0);
    const part = (pct * whole) / 100;
    const display = `${pct}% of a number is ${part}. What is the number?`;
    const model = { rows: [{ cells: [cell(part, '', true), cell(whole - part, '')] }], braces: [{ row: 0, start: 0, end: 1, label: '?', side: 'top' }, { row: 0, start: 0, end: 0, label: `${part}`, side: 'bottom' }] };
    return barModelProblem(skill, display, whole, { structure: st, whole, pct, part, model });
  }

  // twoStepRemain
  const lo = s.min || 10, hi = s.max || 300;
  const s1 = r(lo, hi), s2 = r(lo, hi), remain = r(lo, hi), total = s1 + s2 + remain;
  const [name] = twoNames(), items = pickFrom([['a book', 'a pen'], ['a toy', 'a snack'], ['a shirt', 'a cap'], ['lunch', 'a drink']]);
  const display = `${name} had $${total}. ${name} spent $${s1} on ${items[0]} and $${s2} on ${items[1]}. How much money is left?`;
  const model = { rows: [{ cells: [cell(s1, `${s1}`), cell(s2, `${s2}`), cell(remain, '?')] }], braces: [{ row: 0, start: 0, end: 2, label: `${total}`, side: 'top' }] };
  return barModelProblem(skill, display, remain, { structure: 'twoStepRemain', total, s1, s2, model });
}

// ---------- Measurement, money & statistics ----------

// Compound units to the smaller unit: "2 m 30 cm = ? cm" → 230
function genCompoundToUnit(skill) {
  const [big, small, factor] = pickFrom([['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['l', 'ml', 1000]]);
  const bigN = randInt(1, 8);
  const smallN = factor === 100 ? randInt(1, 19) * 5 : randInt(1, 19) * 50;
  return problem(skill, `${bigN} ${big} ${smallN} ${small} = ? ${small}`, bigN * factor + smallN, 'compoundToUnit', { bigN, smallN, factor });
}

// Time duration: "starts 09:15, ends 10:50 → 95 minutes"
function genDuration(skill) {
  const start = randInt(6 * 12, 20 * 12) * 5; // on a 5-minute grid, 06:00–20:00
  const dur = randInt(2, 36) * 5; // 10–180 minutes
  const end = start + dur;
  const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  const ctx = pickFrom(['lesson', 'film', 'football match', 'train ride']);
  return problem(skill, `A ${ctx} starts at ${fmt(start)} and ends at ${fmt(end)}. How many minutes does it last?`, dur, 'duration', { start, end });
}

// Money in decimal notation ↔ cents: "$4.85 = ? cents" → 485  ·  "560 cents = $?" → 5.6
function genMoneyConvert(skill) {
  const cents = randInt(105, 5000);
  if (Math.random() < 0.5) return problem(skill, `$${(cents / 100).toFixed(2)} = ? cents`, cents, 'moneyConvert', { cents, dir: 'toCents' });
  return decProblem(skill, `${cents} cents = $ ?`, cents / 100, 'moneyConvert', { cents, dir: 'toDollars' });
}

const money = (c) => `$${(c / 100).toFixed(2)}`;

// Counting money from shown coins/notes. Coins mode → answer in cents; with notes → dollars.
function genMoneyCount(skill) {
  const r = randInt;
  if (skill.spec.withNotes) {
    const notes = [200, 500, 1000], coins = [10, 20, 50, 100], tokens = [];
    for (let i = 0, nN = r(1, 2); i < nN; i++) tokens.push({ value: pickFrom(notes), kind: 'note' });
    for (let i = 0, nC = r(1, 2); i < nC; i++) tokens.push({ value: pickFrom(coins), kind: 'coin' });
    const totalC = tokens.reduce((s, t) => s + t.value, 0);
    return decProblem(skill, `How much money is shown? Give your answer in dollars.`, totalC / 100, 'moneyCount', { tokens, mode: 'dollars' });
  }
  const denoms = [5, 10, 20, 50];
  let d1 = pickFrom(denoms), d2 = pickFrom(denoms);
  while (d2 === d1) d2 = pickFrom(denoms);
  const tokens = [];
  for (let i = 0, a = r(1, 4); i < a; i++) tokens.push({ value: d1, kind: 'coin' });
  for (let i = 0, b = r(1, 4); i < b; i++) tokens.push({ value: d2, kind: 'coin' });
  const totalC = tokens.reduce((s, t) => s + t.value, 0);
  return problem(skill, `How much money is shown? Give your answer in cents.`, totalC, 'moneyCount', { tokens, mode: 'cents' });
}

// Comparing two or three amounts: "Which is greatest: $4.50, $4.05?" → 4.5
function genMoneyCompare(skill) {
  const k = Math.random() < 0.5 ? 2 : 3, set = [];
  while (set.length < k) { const v = randInt(105, 1995); if (!set.includes(v)) set.push(v); }
  return decProblem(skill, `Which amount is the greatest: ${set.map(money).join(', ')}? Give your answer in dollars.`, Math.max(...set) / 100, 'moneyCompare', { set });
}

// Adding / subtracting money in decimal notation: "$12.45 + $3.70 = ?" → 16.15
function genMoneyAddSub(skill) {
  let a = randInt(105, 5000), b = randInt(105, 5000);
  const op = Math.random() < 0.5 ? '+' : '-';
  if (op === '+') return decProblem(skill, `${money(a)} ${PLUS} ${money(b)} = ?`, (a + b) / 100, 'moneyAddSub', { a, b, op });
  if (a < b) { const t = a; a = b; b = t; }
  return decProblem(skill, `${money(a)} ${MINUS} ${money(b)} = ?`, (a - b) / 100, 'moneyAddSub', { a, b, op });
}

// Making change: "A toy costs $6.40. You pay with a $10 note. How much change?" → 3.6
function genMoneyChange(skill) {
  const paid = pickFrom([2, 5, 10, 20, 50]) * 100;
  const lo = Math.max(105, paid - 495);
  const cost = 5 * randInt(Math.ceil(lo / 5), (paid - 5) / 5);
  const item = pickFrom(['book', 'toy', 'pen', 'cap', 'game']);
  return decProblem(skill, `A ${item} costs ${money(cost)}. You pay with a ${money(paid)} note. How much change, in dollars?`, (paid - cost) / 100, 'moneyChange', { paid, cost });
}

const CHART_SETS = [
  { theme: 'the number of marbles of each colour', labels: ['Red', 'Blue', 'Green', 'Yellow'], time: false },
  { theme: 'the pets owned by a class', labels: ['Cats', 'Dogs', 'Fish', 'Birds'], time: false },
  { theme: 'the fruit sold at a stall', labels: ['Apples', 'Pears', 'Plums', 'Grapes'], time: false },
  { theme: 'the number of books read each day', labels: ['Mon', 'Tue', 'Wed', 'Thu'], time: true },
  { theme: 'the temperature recorded each day', labels: ['Mon', 'Tue', 'Wed', 'Thu'], time: true },
];
// Build a chart's data. Line graphs use time series; pie charts partition a whole.
function makeChart(mode, scaleOverride) {
  const r = randInt;
  const pool = mode === 'line' ? CHART_SETS.filter((s) => s.time) : mode === 'pie' ? CHART_SETS.filter((s) => !s.time) : CHART_SETS;
  const set = pickFrom(pool);
  const n = Math.min(set.labels.length, r(3, 4)), scale = scaleOverride || pickFrom([1, 2, 5, 10]), cap = mode === 'picture' ? 7 : 5;
  const cats = Array.from({ length: n }, (_, i) => ({ label: set.labels[i], value: scale * r(1, cap) }));
  return { chart: { mode, cats, scale }, noun: { picture: 'picture graph', pie: 'pie chart', line: 'line graph', bar: 'bar graph' }[mode], theme: set.theme };
}

// Read a bar / picture / pie / line graph: value, difference, or total (numeric answer).
function genBarChart(skill) {
  const mode = skill.spec.mode || 'bar', { chart, noun, theme } = makeChart(mode, skill.spec.scale), cats = chart.cats, n = cats.length;
  const q = pickFrom(mode === 'line' ? ['value', 'diff'] : ['value', 'diff', 'total']);
  if (q === 'value') {
    const i = randInt(0, n - 1);
    return problem(skill, `The ${noun} shows ${theme}. What is the value for ${cats[i].label}?`, cats[i].value, 'barChart', { chart, q, i });
  }
  if (q === 'total') return problem(skill, `The ${noun} shows ${theme}. What is the total?`, cats.reduce((p, d) => p + d.value, 0), 'barChart', { chart, q });
  let hi = 0, lo = 0;
  cats.forEach((d, i) => { if (d.value > cats[hi].value) hi = i; if (d.value < cats[lo].value) lo = i; });
  if (cats[hi].value === cats[lo].value) return genBarChart(skill);
  return problem(skill, `The ${noun} shows ${theme}. How many more for ${cats[hi].label} than ${cats[lo].label}?`, cats[hi].value - cats[lo].value, 'barChart', { chart, q, i: hi, j: lo });
}

// ---------- Multiple-choice items (non-numeric answers) ----------

function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = randInt(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function choiceProblem(skill, display, answer, choices, kind, parts) {
  const p = problem(skill, display, answer, kind, parts);
  p.choice = true; p.choices = choices;
  return p;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function toWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` and ${toWords(n % 100)}` : ''}`;
  return `${toWords(Math.floor(n / 1000))} thousand${n % 1000 ? `${n % 1000 < 100 ? ' and' : ''} ${toWords(n % 1000)}` : ''}`;
}

// "Which of these is 247 in words?" → multiple choice over word forms.
function genNumberInWords(skill) {
  const s = skill.spec, n = randInt(s.min || 20, s.max || 999);
  const answer = toWords(n), seen = new Set([answer]), choices = [answer];
  const deltas = [1, -1, 9, -9, 10, -10, 100, -100, 20, -20];
  for (let t = 0; t < 200 && choices.length < 4; t++) {
    const m = n + pickFrom(deltas);
    if (m < 1 || m > 9999) continue;
    const w = toWords(m);
    if (!seen.has(w)) { seen.add(w); choices.push(w); }
  }
  return choiceProblem(skill, `Which of these is ${n} in words?`, answer, shuffle(choices), 'numberInWords', { n });
}

// "What is the name of this shape?" → multiple choice over shape names (shows a 2D shape).
const SHAPES = ['circle', 'square', 'rectangle', 'triangle', 'pentagon', 'hexagon'];
function genShapeName(skill) {
  const pool = skill.spec.shapes || SHAPES, shape = pickFrom(pool);
  const others = shuffle(pool.filter((s) => s !== shape)).slice(0, 3);
  return choiceProblem(skill, `What is the name of this shape?`, cap1(shape), shuffle([cap1(shape), ...others.map(cap1)]), 'shapeName', { shape });
}

// "Which has the most/least?" on a graph → multiple choice over category labels.
function genChartCategory(skill) {
  const { chart, noun, theme } = makeChart(skill.spec.mode || 'bar', skill.spec.scale), cats = chart.cats;
  const which = Math.random() < 0.5 ? 'most' : 'least';
  const sorted = [...cats].sort((a, b) => b.value - a.value);
  const target = which === 'most' ? sorted[0] : sorted[sorted.length - 1];
  const tie = which === 'most' ? sorted[1].value === target.value : sorted[sorted.length - 2].value === target.value;
  if (tie) return genChartCategory(skill);
  return choiceProblem(skill, `The ${noun} shows ${theme}. Which has the ${which}?`, target.label, shuffle(cats.map((c) => c.label)), 'chartCategory', { chart, which });
}

// "What time is shown?" on a clock face → multiple choice over times.
function genClockRead(skill) {
  const gran = skill.spec.gran || 5, r = randInt;
  const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  const h = r(1, 12), m = r(0, 59 / gran | 0) * gran;
  const answer = fmt(h, m), seen = new Set([answer]), choices = [answer];
  for (let t = 0; t < 200 && choices.length < 4; t++) {
    const dh = r(0, 1) ? 0 : pickFrom([-1, 1, 2]);
    const dm = pickFrom([-2, -1, 1, 2]) * gran;
    let hh = ((h - 1 + dh + 12) % 12) + 1, mm = m + dm;
    if (mm < 0) { mm += 60; hh = ((hh - 2 + 12) % 12) + 1; }
    if (mm >= 60) { mm -= 60; hh = (hh % 12) + 1; }
    const f = fmt(hh, mm);
    if (!seen.has(f)) { seen.add(f); choices.push(f); }
  }
  return choiceProblem(skill, `What time is shown on the clock?`, answer, shuffle(choices), 'clockRead', { h, m });
}

// Ordinal position: a row of shapes with one highlighted → "which position?" (first…tenth).
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
function genOrdinal(skill) {
  const n = randInt(4, 8), pos = randInt(1, n), answer = ORDINALS[pos - 1];
  const seen = new Set([answer]), choices = [answer];
  while (choices.length < 4) { const w = ORDINALS[randInt(1, Math.min(10, n + 2)) - 1]; if (!seen.has(w)) { seen.add(w); choices.push(w); } }
  return choiceProblem(skill, `What position is the highlighted shape, counting from the left?`, answer, shuffle(choices), 'ordinal', { n, pos });
}

// 3D solid recognition → multiple choice over solid names (shows an oblique sketch).
const SOLIDS = ['cube', 'cuboid', 'cone', 'cylinder', 'sphere'];
function genSolidName(skill) {
  const shape = pickFrom(SOLIDS), others = shuffle(SOLIDS.filter((s) => s !== shape)).slice(0, 3);
  return choiceProblem(skill, `What is the name of this solid?`, cap1(shape), shuffle([cap1(shape), ...others.map(cap1)]), 'solidName', { shape });
}

// 24-hour clock: convert a 12-hour time with a.m./p.m. to 24-hour notation.
function genClock24(skill) {
  const r = randInt, h12 = r(1, 12), m = r(0, 11) * 5, pm = Math.random() < 0.5;
  const h24 = pm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
  const fmt = (h, mm) => `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const answer = fmt(h24, m), seen = new Set([answer]), choices = [answer];
  for (const c of [fmt(h12, m), fmt((h24 + 12) % 24, m), fmt((h24 + 1) % 24, m), fmt(h12 === 12 ? 0 : h12, m)]) { if (choices.length < 4 && !seen.has(c)) { seen.add(c); choices.push(c); } }
  while (choices.length < 4) { const c = fmt(r(0, 23), m); if (!seen.has(c)) { seen.add(c); choices.push(c); } }
  return choiceProblem(skill, `Write ${h12}:${String(m).padStart(2, '0')} ${pm ? 'p.m.' : 'a.m.'} in 24-hour time.`, answer, shuffle(choices), 'clock24', { h12, m, pm });
}

// Fraction as part of a whole: a bar split into d parts with n shaded → "what fraction is shaded?"
function genFractionOfWhole(skill) {
  const r = randInt, d = r(2, 8), n = r(1, d - 1), answer = `${n}/${d}`, val = n / d;
  const seen = new Set([answer]), choices = [answer];
  const add = (num, den) => { if (num >= 1 && den >= 2 && num < den && Math.abs(num / den - val) > 1e-9) { const s = `${num}/${den}`; if (!seen.has(s)) { seen.add(s); choices.push(s); } } };
  add(d - n, d); add(n, d + 1); add(n + 1, d); add(n, Math.max(2, d - 1)); add(n - 1, d);
  while (choices.length < 4) { add(r(1, 8), r(2, 9)); }
  return choiceProblem(skill, `What fraction of the shape is shaded?`, answer, shuffle(choices.slice(0, 4)), 'fractionOfWhole', { d, n });
}

// ============================================================================
// Secondary (S1–S4) generators. Singapore lower/upper-secondary mathematics.
// Answers stay a single value (integer, decimal at 3 dp, or a chosen string).
// `negProblem` flags items whose answer may be negative so the UI shows a sign key.
// ============================================================================

function negProblem(skill, display, answer, kind, parts) {
  const p = problem(skill, display, answer, kind, parts);
  p.neg = true; // tells the UI to allow a leading minus + show a ± key
  return p;
}

const neg = (x) => (x < 0 ? `(${x})` : `${x}`); // bracket negatives in a prompt

// ---- Numbers & arithmetic ----

// Signed addition/subtraction: "−7 + (3) = ?" → −4
function genIntegerAddSub(skill) {
  const r = randInt, a = r(-12, 12), b = r(-12, 12);
  const plus = Math.random() < 0.5;
  const ans = plus ? a + b : a - b;
  return negProblem(skill, `${a} ${plus ? PLUS : MINUS} ${neg(b)} = ?`, ans, 'integerAddSub', { a, b, op: plus ? '+' : '-' });
}

// Signed multiplication/division: "(−6) × 4 = ?" → −24
function genIntegerMulDiv(skill) {
  const r = randInt;
  if (Math.random() < 0.5) {
    const a = r(-9, 9) || 3, b = r(-9, 9) || 2;
    return negProblem(skill, `${neg(a)} ${TIMES} ${neg(b)} = ?`, a * b, 'integerMulDiv', { a, b, op: '×' });
  }
  const q = r(-9, 9) || 2, d = r(2, 9) * (Math.random() < 0.5 ? -1 : 1), a = q * d;
  return negProblem(skill, `${neg(a)} ${DIVIDE} ${neg(d)} = ?`, q, 'integerMulDiv', { a, d, op: '÷' });
}

// Evaluate a power: "3⁴ = ?" → 81 (kept ≤ 4 digits)
function genIndexEval(skill) {
  for (let t = 0; t < 50; t++) {
    const base = randInt(2, 7), exp = randInt(2, 4);
    if (base ** exp <= 9999) return problem(skill, `${base}<sup>${exp}</sup> = ?`, base ** exp, 'indexEval', { base, exp });
  }
  return problem(skill, `2<sup>5</sup> = ?`, 32, 'indexEval', { base: 2, exp: 5 });
}

// Laws of indices: "2³ × 2⁴ = 2^?" → 7 ; "5⁶ ÷ 5² = 5^?" → 4
function genIndexLaw(skill) {
  const base = randInt(2, 9);
  if (Math.random() < 0.5) {
    const m = randInt(2, 6), n = randInt(2, 6);
    return problem(skill, `${base}<sup>${m}</sup> ${TIMES} ${base}<sup>${n}</sup> = ${base}<sup>?</sup>`, m + n, 'indexLaw', { base, m, n, op: '×' });
  }
  const small = randInt(2, 5), big = small + randInt(1, 4);
  return problem(skill, `${base}<sup>${big}</sup> ${DIVIDE} ${base}<sup>${small}</sup> = ${base}<sup>?</sup>`, big - small, 'indexLaw', { base, big, small, op: '÷' });
}

// Square / cube roots of perfect powers: "√196 = ?" → 14
function genRootEval(skill) {
  if (Math.random() < 0.6) { const n = randInt(2, 20); return problem(skill, `√${n * n} = ?`, n, 'rootEval', { n, root: 2 }); }
  const n = randInt(2, 9);
  return problem(skill, `∛${n * n * n} = ?`, n, 'rootEval', { n, root: 3 });
}

// Standard form — find the index: "Write 45 000 as a × 10ⁿ. n = ?" → 4
function genStandardFormPower(skill) {
  const lead = randInt(1, 9), dec = randInt(0, 9), n = randInt(3, 6);
  const value = lead * 10 ** n + dec * 10 ** (n - 1);
  return problem(skill, `Write ${value.toLocaleString('en-US')} in standard form a × 10ⁿ (1 ≤ a < 10). What is n?`, n, 'standardFormPower', { value, n });
}

// ---- Algebra ----

// Expand a(bx + c) — coefficient of the letter: "Expand 3(2x + 4): coefficient of x?" → 6
function genExpandCoeff(skill) {
  const a = randInt(2, 9), b = randInt(2, 9), c = randInt(1, 9), L = pickFrom(['x', 'y', 'n']);
  return problem(skill, `Expand ${a}(${b}${L} ${PLUS} ${c}). What is the coefficient of ${L}?`, a * b, 'expandCoeff', { a, b, c });
}

// Factorise out the HCF — the number outside the bracket: "Factorise 12x + 18" → 6
function genFactorHcf(skill) {
  const f = randInt(2, 9), p = randInt(2, 7), q = randInt(2, 9), L = pickFrom(['x', 'y', 'n']);
  const A = f * p, B = f * q;
  return problem(skill, `Factorise fully ${A}${L} ${PLUS} ${B}. What number goes outside the bracket?`, gcd(A, B), 'factorHcf', { A, B });
}

// Solve a linear equation with the letter on both sides: "5x + 2 = 2x + 14" → x = 4
function genSolveLinear2(skill) {
  const L = pickFrom(['x', 'y']);
  for (let t = 0; t < 200; t++) {
    const x = randInt(2, 9), a = randInt(3, 9), c = randInt(1, a - 1), b = randInt(1, 9), d = (a - c) * x + b;
    if (d > 0) return problem(skill, `Solve: ${a}${L} ${PLUS} ${b} = ${c}${L} ${PLUS} ${d}.  ${L} = ?`, x, 'solveLinear2', { a, b, c, d, x });
  }
  return problem(skill, `Solve: 3${L} ${PLUS} 2 = ${L} ${PLUS} 8.  ${L} = ?`, 3, 'solveLinear2', {});
}

// Expand (x + a)(x + b) — constant term or coefficient of x
function genExpandProduct(skill) {
  const a = randInt(1, 9), b = randInt(1, 9);
  if (Math.random() < 0.5) return problem(skill, `Expand (x ${PLUS} ${a})(x ${PLUS} ${b}). What is the constant term?`, a * b, 'expandProduct', { a, b, which: 'const' });
  return problem(skill, `Expand (x ${PLUS} ${a})(x ${PLUS} ${b}). What is the coefficient of x?`, a + b, 'expandProduct', { a, b, which: 'coeff' });
}

// Factorise x² + bx + c = (x + p)(x + q) — give the larger of p, q
function genFactorQuad(skill) {
  const p = randInt(1, 9), q = randInt(1, 9);
  return problem(skill, `x² ${PLUS} ${p + q}x ${PLUS} ${p * q} = (x ${PLUS} p)(x ${PLUS} q). What is the larger of p and q?`, Math.max(p, q), 'factorQuad', { p, q });
}

// Solve a factorisable quadratic with positive roots — give the larger root
function genQuadRoot(skill) {
  const p = randInt(1, 9), q = randInt(1, 9);
  return problem(skill, `Solve x² ${MINUS} ${p + q}x ${PLUS} ${p * q} = 0. Give the larger root.`, Math.max(p, q), 'quadRoot', { p, q });
}

// Solve a 2×2 simultaneous system — report x (chosen to be a positive integer)
function genSimEqn(skill) {
  for (let t = 0; t < 300; t++) {
    const x = randInt(1, 8), y = randInt(1, 8);
    const a = randInt(1, 4), b = randInt(1, 4), c = a * x + b * y;
    const d = randInt(1, 4), e = randInt(1, 4), f = d * x + e * y;
    if (a * e - b * d !== 0) return problem(skill, `Solve: ${a}x ${PLUS} ${b}y = ${c} and ${d}x ${PLUS} ${e}y = ${f}.  x = ?`, x, 'simEqn', { x, y });
  }
  return problem(skill, `Solve: x ${PLUS} y = 5 and 2x ${PLUS} y = 7.  x = ?`, 2, 'simEqn', {});
}

// Gradient of a line through two points (can be negative)
function genGradient(skill) {
  for (let t = 0; t < 300; t++) {
    const x1 = randInt(-4, 4), x2 = randInt(-4, 4); if (x1 === x2) continue;
    const y1 = randInt(-6, 6), y2 = randInt(-6, 6);
    if ((y2 - y1) % (x2 - x1) !== 0) continue;
    return negProblem(skill, `Find the gradient of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`, (y2 - y1) / (x2 - x1), 'gradient', { x1, y1, x2, y2 });
  }
  return negProblem(skill, `Find the gradient of the line through (0, 0) and (2, 6).`, 3, 'gradient', {});
}

// ---- Ratio & proportion ----

// Direct proportion: "5 pens cost $15. Cost of 8 pens?" → 24
function genProportionDirect(skill) {
  const unit = randInt(2, 9), n1 = randInt(2, 6), n2 = randInt(2, 9);
  return problem(skill, `${n1} items cost $${unit * n1}. How much do ${n2} items cost, in $?`, unit * n2, 'proportionDirect', { unit, n1, n2 });
}

// ---- Geometry & mensuration ----

const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29], [10, 24, 26]];

// Pythagoras — hypotenuse from a Pythagorean triple
function genPythagoras(skill) {
  const [a, b, c] = pickFrom(TRIPLES);
  return problem(skill, `A right-angled triangle has legs ${a} and ${b}. Find the hypotenuse.`, c, 'pythagoras', { a, b, c });
}

// Trigonometry — special-angle from a known ratio
function genTrigAngle(skill) {
  const cases = [
    { f: 'sin', v: '½', a: 30 }, { f: 'sin', v: '√3 ⁄ 2', a: 60 }, { f: 'sin', v: '1 ⁄ √2', a: 45 },
    { f: 'cos', v: '½', a: 60 }, { f: 'cos', v: '√3 ⁄ 2', a: 30 }, { f: 'tan', v: '1', a: 45 }, { f: 'tan', v: '√3', a: 60 },
  ];
  const c = pickFrom(cases);
  return problem(skill, `If ${c.f} θ = ${c.v} and 0° &lt; θ &lt; 90°, find θ in degrees.`, c.a, 'trigAngle', { f: c.f, a: c.a });
}

// Trigonometry — side opposite a 30° angle (opp = hyp ÷ 2)
function genTrigSide(skill) {
  const hyp = randInt(2, 12) * 2;
  return problem(skill, `In a right-angled triangle the hypotenuse is ${hyp} and one angle is 30°. Find the side opposite the 30° angle.`, hyp / 2, 'trigSide', { hyp });
}

// Volume of a cylinder (π = 3.14)
function genCylinderVolume(skill) {
  const r = randInt(1, 7), h = randInt(2, 10);
  return decProblem(skill, `Volume of a cylinder with radius ${r} cm and height ${h} cm = ? cm³  (take π = 3.14)`, PI * r * r * h, 'cylinderVolume', { r, h });
}

// Area of a sector (π = 3.14)
function genSectorArea(skill) {
  const r = randInt(2, 10), deg = pickFrom([30, 45, 60, 90, 120, 180]);
  return decProblem(skill, `Area of a sector with radius ${r} cm and angle ${deg}° = ? cm²  (take π = 3.14)`, (deg / 360) * PI * r * r, 'sectorArea', { r, deg });
}

// ---- Statistics & probability ----

// Median of a small data set (odd count)
function genMedian(skill) {
  const count = pickFrom([3, 5]);
  const nums = Array.from({ length: count }, () => randInt(1, 30));
  const sorted = [...nums].sort((a, b) => a - b);
  return problem(skill, `Find the median of ${nums.join(', ')}`, sorted[(count - 1) / 2], 'median', { nums });
}

// Mode of a small data set (guaranteed unique)
function genMode(skill) {
  for (let t = 0; t < 200; t++) {
    const base = randInt(2, 9);
    const nums = shuffle([base, base, base, randInt(1, 9), randInt(1, 9)]);
    const counts = {};
    nums.forEach((n) => { counts[n] = (counts[n] || 0) + 1; });
    const max = Math.max(...Object.values(counts));
    const modes = Object.keys(counts).filter((k) => counts[k] === max);
    if (modes.length === 1) return problem(skill, `Find the mode of ${nums.join(', ')}`, Number(modes[0]), 'mode', { nums });
  }
  return problem(skill, `Find the mode of 4, 4, 4, 2, 7`, 4, 'mode', {});
}

// Single-event probability as a simplified fraction (multiple choice)
function genProbability(skill) {
  const total = pickFrom([6, 8, 10, 12]), fav = randInt(1, total - 1);
  const simp = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };
  const answer = simp(fav, total);
  const seen = new Set([answer]), choices = [answer];
  const addC = (s) => { if (s && !seen.has(s)) { seen.add(s); choices.push(s); } };
  addC(simp(total - fav, total)); addC(`${fav}/${total}`); addC(simp(Math.max(1, fav - 1), total)); addC(`${total}/${fav}`);
  while (choices.length < 4) addC(simp(randInt(1, total - 1), total));
  return choiceProblem(skill, `A bag has ${total} balls; ${fav} are red. A ball is drawn at random. P(red) = ?`, answer, shuffle(choices.slice(0, 4)), 'probability', { fav, total });
}

// ---------- Fraction identification, conceptual & comparison generators ----------

// F001: Identify the fraction of a shape that is shaded (or not shaded)
function genFractionIdentify(skill) {
  const denoms = [2, 3, 4, 5, 6, 8, 10, 12];
  const simp = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };
  for (let t = 0; t < 300; t++) {
    const d = pickFrom(denoms);
    if (d < 4) continue; // need enough room for 4 distinct choices
    const n = randInt(1, d - 1);
    const askShaded = Math.random() < 0.6;
    const partNum = askShaded ? n : d - n;
    const answer = simp(partNum, d);
    const word = askShaded ? 'shaded' : 'not shaded';
    const display = `A shape is divided into ${d} equal parts. ${n} parts are shaded. What fraction of the shape is ${word}?`;
    const seen = new Set([answer]), choices = [answer];
    const add = (s) => { if (s && !seen.has(s)) { seen.add(s); choices.push(s); } };
    add(`${partNum}/${d}`);                          // unsimplified form
    add(`${d}/${partNum}`);                           // swapped numerator/denominator
    add(simp(Math.min(partNum + 1, d - 1), d));       // off-by-one up
    add(simp(askShaded ? d - n : n, d));              // complement fraction
    add(simp(Math.max(1, partNum - 1), d));           // off-by-one down
    for (let u = 0; u < 50 && choices.length < 4; u++) add(simp(randInt(1, 11), randInt(2, 12)));
    if (choices.length < 4) continue;
    return choiceProblem(skill, display, answer, shuffle(choices.slice(0, 4)), 'fractionIdentify', { d, n, askShaded });
  }
  return choiceProblem(skill, 'A shape is divided into 4 equal parts. 1 part is shaded. What fraction of the shape is shaded?', '1/4', shuffle(['1/4', '4/1', '3/4', '2/4']), 'fractionIdentify', { d: 4, n: 1, askShaded: true });
}

// F002: Name the numerator or denominator of a fraction
function genFractionNaming(skill) {
  for (let t = 0; t < 300; t++) {
    const d = randInt(3, 12);
    const a = randInt(1, d - 1);
    const askNum = Math.random() < 0.5;
    const part = askNum ? 'numerator' : 'denominator';
    const answer = String(askNum ? a : d);
    const display = `In the fraction ${a}/${d}, what is the ${part}?`;
    const seen = new Set([answer]), choices = [answer];
    const add = (s) => { if (s && !seen.has(s)) { seen.add(s); choices.push(s); } };
    add(String(askNum ? d : a));
    add(String(a + d));
    add(String(Math.abs(d - a)));
    add('1');
    add(String(d + 1));
    if (choices.length < 4) continue;
    return choiceProblem(skill, display, answer, shuffle(choices.slice(0, 4)), 'fractionNaming', { a, d, askNum });
  }
  return choiceProblem(skill, 'In the fraction 3/7, what is the numerator?', '3', shuffle(['3', '7', '10', '4']), 'fractionNaming', { a: 3, d: 7, askNum: true });
}

// F003: Fraction from a model (bar/rectangle/circle)
function genFractionFromModel(skill) {
  const shapes = ['bar', 'rectangle', 'circle'];
  const denoms = [3, 4, 5, 6, 8, 10, 12];
  for (let t = 0; t < 300; t++) {
    const shape = pickFrom(shapes);
    const d = pickFrom(denoms);
    const n = randInt(1, d - 1);
    const answer = `${n}/${d}`;
    const display = `A ${shape} is divided into ${d} equal parts. ${n} parts are shaded. What fraction is shaded?`;
    const seen = new Set([answer]), choices = [answer];
    const add = (s) => { if (s && !seen.has(s)) { seen.add(s); choices.push(s); } };
    add(`${d}/${n}`);
    add(`${d - n}/${d}`);
    add(`${n}/${d + 1}`);
    add(`${Math.min(n + 1, d - 1)}/${d}`);
    add(`${Math.max(n - 1, 1)}/${d}`);
    for (let u = 0; u < 50 && choices.length < 4; u++) add(`${randInt(1, 9)}/${randInt(2, 12)}`);
    if (choices.length < 4) continue;
    return choiceProblem(skill, display, answer, shuffle(choices.slice(0, 4)), 'fractionFromModel', { shape, d, n });
  }
  return choiceProblem(skill, 'A bar is divided into 4 equal parts. 1 part is shaded. What fraction is shaded?', '1/4', shuffle(['1/4', '4/1', '3/4', '1/3']), 'fractionFromModel', { shape: 'bar', d: 4, n: 1 });
}

// F004: Identify unit fractions and compare them
function genUnitFractionId(skill) {
  const variant = Math.random() < 0.6 ? 'identify' : 'largest';
  if (variant === 'identify') {
    const d = randInt(2, 12);
    const answer = `1/${d}`;
    const seen = new Set([answer]), choices = [answer];
    const add = (s) => { if (!seen.has(s)) { seen.add(s); choices.push(s); } };
    for (let t = 0; t < 200 && choices.length < 4; t++) {
      const nd = randInt(2, 12), nn = randInt(2, Math.max(2, nd - 1));
      add(`${nn}/${nd}`);
    }
    return choiceProblem(skill, 'Which of these is a unit fraction?', answer, shuffle(choices.slice(0, 4)), 'unitFractionId', { variant, d });
  }
  const ds = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 4);
  ds.sort((a, b) => a - b);
  const answer = `1/${ds[0]}`;
  const choices = ds.map((d) => `1/${d}`);
  return choiceProblem(skill, 'Which is the largest unit fraction?', answer, shuffle(choices), 'unitFractionId', { variant, ds });
}

// F005: Fraction on a number line
function genFractionNumberLine(skill) {
  const ordinal = (n) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th';
  const denoms = [3, 4, 5, 6, 8, 10];
  const simp = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };
  for (let t = 0; t < 300; t++) {
    const d = pickFrom(denoms);
    const n = randInt(1, d - 1);
    const answer = simp(n, d);
    const display = `A number line from 0 to 1 is divided into ${d} equal parts. The arrow points to the ${ordinal(n)} mark. What fraction does the arrow show?`;
    const seen = new Set([answer]), choices = [answer];
    const add = (s) => { if (s && !seen.has(s)) { seen.add(s); choices.push(s); } };
    add(`${n}/${d}`);
    add(`${n}/${d + 1}`);
    add(simp(d - n, d));
    add(simp(Math.min(n + 1, d - 1), d));
    add(simp(Math.max(n - 1, 1), d));
    for (let u = 0; u < 50 && choices.length < 4; u++) add(simp(randInt(1, 11), randInt(2, 12)));
    if (choices.length < 4) continue;
    return choiceProblem(skill, display, answer, shuffle(choices.slice(0, 4)), 'fractionNumberLine', { d, n });
  }
  return choiceProblem(skill, 'A number line from 0 to 1 is divided into 4 equal parts. The arrow points to the 1st mark. What fraction does the arrow show?', '1/4', shuffle(['1/4', '1/5', '3/4', '2/4']), 'fractionNumberLine', { d: 4, n: 1 });
}

// F005/F007/F008/F009: Order fractions in ascending or descending order
function genFractionOrder(skill) {
  const simp = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };
  for (let t = 0; t < 300; t++) {
    const d1 = randInt(2, 6), d2 = randInt(2, 6), d3 = randInt(2, 6);
    const L = lcm(lcm(d1, d2), d3);
    if (L > 12) continue;
    const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1), n3 = randInt(1, d3 - 1);
    const v1 = n1 / d1, v2 = n2 / d2, v3 = n3 / d3;
    if (v1 === v2 || v2 === v3 || v1 === v3) continue;
    const fracs = [{ s: simp(n1, d1), v: v1 }, { s: simp(n2, d2), v: v2 }, { s: simp(n3, d3), v: v3 }];
    const asc = Math.random() < 0.5;
    const sorted = [...fracs].sort((a, b) => asc ? a.v - b.v : b.v - a.v);
    const answer = sorted.map((f) => f.s).join(', ');
    const reversed = [...sorted].reverse().map((f) => f.s).join(', ');
    const swap12 = [sorted[1], sorted[0], sorted[2]].map((f) => f.s).join(', ');
    const swap23 = [sorted[0], sorted[2], sorted[1]].map((f) => f.s).join(', ');
    const display = `Arrange these fractions in ${asc ? 'ascending' : 'descending'} order: ${fracs.map((f) => f.s).join(', ')}`;
    return choiceProblem(skill, display, answer, shuffle([answer, reversed, swap12, swap23]), 'fractionOrder', { fracs: fracs.map((f) => f.s), asc });
  }
  return choiceProblem(skill, 'Arrange these fractions in ascending order: 1/2, 1/4, 3/4', '1/4, 1/2, 3/4', shuffle(['1/4, 1/2, 3/4', '3/4, 1/2, 1/4', '1/2, 1/4, 3/4', '1/4, 3/4, 1/2']), 'fractionOrder', { fracs: ['1/2', '1/4', '3/4'], asc: true });
}

// F006: Benchmark a fraction against 1/2
function genFractionBenchmark(skill) {
  const denoms = [3, 4, 5, 6, 7, 8, 9, 10, 12];
  const makeFrac = (wantGreater) => {
    for (let t = 0; t < 100; t++) {
      const d = pickFrom(denoms);
      const n = randInt(1, d - 1);
      if (n * 2 === d) continue;
      const isGreater = n * 2 > d;
      if (isGreater === wantGreater) return { s: `${n}/${d}`, n, d };
    }
    return wantGreater ? { s: '3/4', n: 3, d: 4 } : { s: '1/4', n: 1, d: 4 };
  };
  for (let t = 0; t < 300; t++) {
    const askGreater = Math.random() < 0.5;
    const word = askGreater ? 'greater than' : 'less than';
    const correct = makeFrac(askGreater);
    const seen = new Set([correct.s]), choices = [correct.s];
    const add = (s) => { if (!seen.has(s)) { seen.add(s); choices.push(s); } };
    for (let u = 0; u < 100 && choices.length < 4; u++) {
      const f = makeFrac(!askGreater);
      add(f.s);
    }
    if (choices.length < 4) continue;
    return choiceProblem(skill, `Which fraction is ${word} 1/2?`, correct.s, shuffle(choices.slice(0, 4)), 'fractionBenchmark', { askGreater });
  }
  return choiceProblem(skill, 'Which fraction is greater than 1/2?', '3/4', shuffle(['3/4', '1/3', '2/5', '3/8']), 'fractionBenchmark', { askGreater: true });
}

// F009: Identify the correct comparison statement among four
function genCompareStatements(skill) {
  const simp = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };
  const makeStatement = (forceTrue) => {
    for (let t = 0; t < 100; t++) {
      const d1 = randInt(2, 8), d2 = randInt(2, 8);
      if (d1 === d2) continue;
      const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1);
      const v1 = n1 / d1, v2 = n2 / d2;
      if (Math.abs(v1 - v2) < 1e-9) continue;
      const f1 = simp(n1, d1), f2 = simp(n2, d2);
      const gt = v1 > v2;
      if (forceTrue) return gt ? `${f1} > ${f2}` : `${f1} < ${f2}`;
      return gt ? `${f1} < ${f2}` : `${f1} > ${f2}`;
    }
    return forceTrue ? '2/3 > 1/2' : '1/3 > 1/2';
  };
  for (let t = 0; t < 300; t++) {
    const answer = makeStatement(true);
    const seen = new Set([answer]), choices = [answer];
    const add = (s) => { if (!seen.has(s)) { seen.add(s); choices.push(s); } };
    for (let u = 0; u < 100 && choices.length < 4; u++) {
      add(makeStatement(false));
    }
    if (choices.length < 4) continue;
    return choiceProblem(skill, 'Which of these statements is correct?', answer, shuffle(choices.slice(0, 4)), 'compareStatements', {});
  }
  return choiceProblem(skill, 'Which of these statements is correct?', '2/3 > 1/2', shuffle(['2/3 > 1/2', '1/3 > 1/2', '3/4 < 1/2', '2/5 > 3/4']), 'compareStatements', {});
}

// ---------- Equivalence, simplification & number-type generators ----------

// Express a fraction in simplest form (MCQ) — F012
function genSimplestForm(skill) {
  const denoms = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20];
  const factors = [2, 3, 4, 5, 6];
  for (let t = 0; t < 300; t++) {
    const d = pickFrom(denoms);
    const k = pickFrom(factors);
    if (d % k !== 0) continue;
    const b = d / k;
    if (b < 2) continue;
    const a = randInt(1, b - 1);
    if (gcd(a, b) !== 1) continue;
    const num = a * k, den = d;
    const answer = `${a}/${b}`;
    const seen = new Set([answer]);
    const choices = [answer];
    const partial = k > 2 && k % 2 === 0 ? `${num / 2}/${den / 2}` : k > 3 && k % 3 === 0 ? `${num / 3}/${den / 3}` : null;
    if (partial && !seen.has(partial)) { seen.add(partial); choices.push(partial); }
    const swapped = `${b}/${a}`;
    if (!seen.has(swapped) && a !== b) { seen.add(swapped); choices.push(swapped); }
    if (a > 1 && b > 1) { const sub1 = `${a - 1}/${b - 1}`; if (!seen.has(sub1)) { seen.add(sub1); choices.push(sub1); } }
    const orig = `${num}/${den}`;
    if (!seen.has(orig)) { seen.add(orig); choices.push(orig); }
    while (choices.length < 4) {
      const fn = randInt(1, b), fd = randInt(2, b + 2);
      const c = `${fn}/${fd}`;
      if (!seen.has(c)) { seen.add(c); choices.push(c); }
    }
    return choiceProblem(skill, `Express ${num}/${den} in its simplest form.`, answer, shuffle(choices.slice(0, 4)), 'simplestForm', { num, den, a, b, k });
  }
  return choiceProblem(skill, `Express 6/8 in its simplest form.`, '3/4', shuffle(['3/4', '2/4', '4/3', '6/8']), 'simplestForm', { num: 6, den: 8, a: 3, b: 4, k: 2 });
}

// Find the missing term in an equivalent fraction (integer answer) — F011
function genFractionMissingTerm(skill) {
  for (let t = 0; t < 300; t++) {
    const b = randInt(2, 8);
    const a = randInt(1, b - 1);
    if (gcd(a, b) !== 1) continue;
    const k = randInt(2, 6);
    if (Math.random() < 0.5) {
      const answer = a * k;
      return problem(skill, `${a}/${b} = ?/${b * k}`, answer, 'fractionMissingTerm', { a, b, k, missing: 'numerator' });
    }
    const answer = b * k;
    return problem(skill, `${a}/${b} = ${a * k}/?`, answer, 'fractionMissingTerm', { a, b, k, missing: 'denominator' });
  }
  return problem(skill, `1/3 = ?/9`, 3, 'fractionMissingTerm', { a: 1, b: 3, k: 3, missing: 'numerator' });
}

// Identify the non-equivalent fraction from a set (MCQ) — F010
function genNonEquivalent(skill) {
  for (let t = 0; t < 300; t++) {
    const b = randInt(2, 6);
    const a = randInt(1, b - 1);
    if (gcd(a, b) !== 1) continue;
    const equivs = [2, 3, 4].map((k) => `${a * k}/${b * k}`);
    const wk = pickFrom([2, 3, 4]);
    const off = pickFrom([1, -1]);
    const wrongNum = a * wk + off;
    const wrongDen = b * wk;
    if (wrongNum < 1 || wrongNum >= wrongDen) continue;
    if (wrongNum / wrongDen === a / b) continue;
    const wrong = `${wrongNum}/${wrongDen}`;
    const choices = shuffle([...equivs, wrong]);
    return choiceProblem(skill, `Which fraction is NOT equivalent to ${a}/${b}?`, wrong, choices, 'nonEquivalent', { a, b, wrong, equivs });
  }
  return choiceProblem(skill, `Which fraction is NOT equivalent to 1/3?`, '3/8', shuffle(['2/6', '3/9', '4/12', '3/8']), 'nonEquivalent', { a: 1, b: 3, wrong: '3/8', equivs: ['2/6', '3/9', '4/12'] });
}

// Find the missing value in a chain of equivalent fractions (integer answer) — F011
function genEquivChain(skill) {
  for (let t = 0; t < 300; t++) {
    const b = randInt(2, 6);
    const a = randInt(1, b - 1);
    if (gcd(a, b) !== 1) continue;
    const ks = shuffle([2, 3, 4]).slice(0, 2);
    ks.unshift(1);
    const fracs = ks.map((k) => ({ n: a * k, d: b * k }));
    const hideIdx = randInt(0, 2);
    const hideNum = Math.random() < 0.5;
    const answer = hideNum ? fracs[hideIdx].n : fracs[hideIdx].d;
    const parts = fracs.map((f, i) => {
      if (i === hideIdx) return hideNum ? `?/${f.d}` : `${f.n}/?`;
      return `${f.n}/${f.d}`;
    });
    const display = parts.join(' = ');
    return problem(skill, display, answer, 'equivChain', { a, b, ks, hideIdx, hideNum });
  }
  return problem(skill, `1/2 = ?/4 = 3/6`, 2, 'equivChain', { a: 1, b: 2, ks: [1, 2, 3], hideIdx: 1, hideNum: true });
}

// Simplify a fraction after addition/subtraction (MCQ) — F012
function genSimplifyAfterOp(skill) {
  const denoms = [4, 6, 8, 10, 12];
  for (let t = 0; t < 300; t++) {
    const d = pickFrom(denoms);
    const a = randInt(1, d - 1);
    const b = randInt(1, d - a);
    const sum = a + b;
    if (sum >= d) continue;
    const g = gcd(sum, d);
    if (g < 2) continue;
    const simpNum = sum / g, simpDen = d / g;
    const answer = `${simpNum}/${simpDen}`;
    const seen = new Set([answer]);
    const choices = [answer];
    const raw = `${sum}/${d}`;
    if (!seen.has(raw)) { seen.add(raw); choices.push(raw); }
    const wrong1 = `${Math.max(1, Math.floor(sum / g))}/${d}`;
    if (wrong1 !== answer && !seen.has(wrong1)) { seen.add(wrong1); choices.push(wrong1); }
    const comp = `${d - sum}/${d}`;
    if (!seen.has(comp)) { seen.add(comp); choices.push(comp); }
    const wrong2 = `${simpNum + 1}/${simpDen}`;
    if (!seen.has(wrong2) && simpNum + 1 < simpDen) { seen.add(wrong2); choices.push(wrong2); }
    while (choices.length < 4) {
      const rn = randInt(1, d - 1), rd = randInt(2, d);
      const c = `${rn}/${rd}`;
      if (!seen.has(c)) { seen.add(c); choices.push(c); }
    }
    const op = Math.random() < 0.5 ? PLUS : MINUS;
    let displayA = a, displayB = b;
    if (op === MINUS) { displayA = sum; displayB = sum - a; }
    return choiceProblem(skill, `Simplify: ${displayA}/${d} ${op} ${displayB}/${d}`, answer, shuffle(choices.slice(0, 4)), 'simplifyAfterOp', { a: displayA, b: displayB, d, op, sum, simpNum, simpDen });
  }
  return choiceProblem(skill, `Simplify: 2/8 ${PLUS} 2/8`, '1/2', shuffle(['1/2', '4/8', '4/16', '2/4']), 'simplifyAfterOp', { a: 2, b: 2, d: 8, op: PLUS, sum: 4, simpNum: 1, simpDen: 2 });
}

// Identify an improper fraction or count wholes in one (MCQ / integer) — F013
function genImproperFractionId(skill) {
  if (Math.random() < 0.5) {
    for (let t = 0; t < 300; t++) {
      const impD = randInt(2, 8);
      const impN = randInt(impD, impD + 6);
      const answer = `${impN}/${impD}`;
      const seen = new Set([answer]);
      const choices = [answer];
      while (choices.length < 4) {
        const pd = randInt(2, 9);
        const pn = randInt(1, pd - 1);
        const c = `${pn}/${pd}`;
        if (!seen.has(c)) { seen.add(c); choices.push(c); }
      }
      return choiceProblem(skill, `Which of these is an improper fraction?`, answer, shuffle(choices), 'improperFractionId', { variant: 'identify', impN, impD });
    }
    return choiceProblem(skill, `Which of these is an improper fraction?`, '7/4', shuffle(['7/4', '3/5', '2/7', '1/3']), 'improperFractionId', { variant: 'identify', impN: 7, impD: 4 });
  }
  const d = randInt(2, 8);
  const wholes = randInt(1, 5);
  const rem = randInt(1, d - 1);
  const n = wholes * d + rem;
  return problem(skill, `How many wholes are in ${n}/${d}?`, wholes, 'improperFractionId', { variant: 'wholes', n, d, wholes, rem });
}

// Convert between mixed numbers and improper fractions (MCQ / integer) — F014
function genMixedNumberRead(skill) {
  if (Math.random() < 0.5) {
    for (let t = 0; t < 300; t++) {
      const d = randInt(2, 8);
      const whole = randInt(1, 5);
      const num = randInt(1, d - 1);
      const improper = whole * d + num;
      const answer = `${whole} ${num}/${d}`;
      const seen = new Set([answer]);
      const choices = [answer];
      const w1 = `${whole + 1} ${num}/${d}`;
      if (!seen.has(w1)) { seen.add(w1); choices.push(w1); }
      const w2 = whole > 1 ? `${whole - 1} ${num}/${d}` : `${whole + 2} ${num}/${d}`;
      if (!seen.has(w2)) { seen.add(w2); choices.push(w2); }
      const swapped = num !== d - num ? `${whole} ${d - num}/${d}` : `${whole} 1/${d}`;
      if (!seen.has(swapped)) { seen.add(swapped); choices.push(swapped); }
      const wd = `${whole} ${num}/${d + 1}`;
      if (!seen.has(wd)) { seen.add(wd); choices.push(wd); }
      while (choices.length < 4) {
        const rw = randInt(1, 6), rn = randInt(1, d - 1);
        const c = `${rw} ${rn}/${d}`;
        if (!seen.has(c)) { seen.add(c); choices.push(c); }
      }
      return choiceProblem(skill, `Which mixed number is equal to ${improper}/${d}?`, answer, shuffle(choices.slice(0, 4)), 'mixedNumberRead', { variant: 'toMixed', improper, d, whole, num });
    }
    return choiceProblem(skill, `Which mixed number is equal to 7/3?`, '2 1/3', shuffle(['2 1/3', '3 1/3', '1 1/3', '2 2/3']), 'mixedNumberRead', { variant: 'toMixed', improper: 7, d: 3, whole: 2, num: 1 });
  }
  const d = randInt(2, 8);
  const whole = randInt(1, 5);
  const num = randInt(1, d - 1);
  const answer = whole * d + num;
  return problem(skill, `Write ${whole} ${num}/${d} as an improper fraction over ${d}. What is the numerator?`, answer, 'mixedNumberRead', { variant: 'toImproper', d, whole, num });
}

// ---------- Operations, word-problem & exam-style generators ----------

// F020: shade-to-target — "How many more parts must be shaded so that T/D is shaded?"
function genShadeToTarget(skill) {
  const denoms = [4, 6, 8, 10, 12];
  for (let t = 0; t < 300; t++) {
    const D = pickFrom(denoms);
    const N = randInt(1, D - 2);
    const T = randInt(N + 1, D - 1);
    const answer = T - N;
    return problem(
      skill,
      `A figure has ${D} equal parts. ${N} ${N === 1 ? 'part is' : 'parts are'} already shaded. How many more parts must be shaded so that ${T}/${D} of the figure is shaded?`,
      answer,
      'shadeToTarget',
      { D, N, T }
    );
  }
  return problem(skill, 'A figure has 8 equal parts. 2 parts are already shaded. How many more parts must be shaded so that 5/8 of the figure is shaded?', 3, 'shadeToTarget', { D: 8, N: 2, T: 5 });
}

// F023: fraction remainder word problem — "What fraction of the cake is left?"
function genFractionRemainderWP(skill) {
  const names = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily'];
  const foods = ['cake', 'pizza', 'pie'];
  const denoms = [2, 3, 4, 5, 6];
  for (let t = 0; t < 300; t++) {
    const d1 = pickFrom(denoms);
    let d2 = pickFrom(denoms);
    if (d2 === d1) continue;
    const L = lcm(d1, d2);
    const a1 = randInt(1, d1 - 1);
    const a2 = randInt(1, d2 - 1);
    const v1 = a1 * (L / d1);
    const v2 = a2 * (L / d2);
    if (v1 + v2 >= L) continue;
    const answer = L - v1 - v2;
    const n1 = pickFrom(names);
    let n2 = pickFrom(names);
    while (n2 === n1) n2 = pickFrom(names);
    const food = pickFrom(foods);
    return problem(
      skill,
      `${n1} ate ${a1}/${d1} of a ${food}. ${n2} ate ${a2}/${d2} of the same ${food}. What fraction of the ${food} is left? Express your answer as ?/${L}.`,
      answer,
      'fractionRemainderWP',
      { a1, d1, a2, d2, L, n1, n2, food }
    );
  }
  return problem(skill, 'Ali ate 1/3 of a cake. Mei ate 1/4 of the same cake. What fraction of the cake is left? Express your answer as ?/12.', 5, 'fractionRemainderWP', { a1: 1, d1: 3, a2: 1, d2: 4, L: 12, n1: 'Ali', n2: 'Mei', food: 'cake' });
}

// F005: number line operation — read two arrows, compute sum or difference
function genNumberLineOp(skill) {
  const denoms = [3, 4, 5, 6, 8, 10];
  for (let t = 0; t < 300; t++) {
    const d = pickFrom(denoms);
    const isAdd = Math.random() < 0.5;
    if (isAdd) {
      const a1 = randInt(1, d - 1);
      const a2 = randInt(1, d - a1);
      const answer = a1 + a2;
      return problem(skill, `On a number line, arrow A points to ${a1}/${d} and arrow B points to ${a2}/${d}. Find A ${PLUS} B. Express your answer as ?/${d}.`, answer, 'numberLineOp', { a1, a2, d, op: '+' });
    }
    const a1 = randInt(2, d);
    const a2 = randInt(1, a1 - 1);
    const answer = a1 - a2;
    return problem(skill, `On a number line, arrow A points to ${a1}/${d} and arrow B points to ${a2}/${d}. Find A ${MINUS} B. Express your answer as ?/${d}.`, answer, 'numberLineOp', { a1, a2, d, op: '-' });
  }
  return problem(skill, `On a number line, arrow A points to 3/8 and arrow B points to 2/8. Find A ${PLUS} B. Express your answer as ?/8.`, 5, 'numberLineOp', { a1: 3, a2: 2, d: 8, op: '+' });
}

// F024: two-step fraction word problem
function genTwoStepFraction(skill) {
  const names = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
  const pattern = pickFrom(['A', 'B']);
  if (pattern === 'A') {
    const items = ['stickers', 'marbles', 'beads', 'stamps', 'coins'];
    const heShe = { Ali: 'He', Ben: 'He', Raj: 'He', Tom: 'He', John: 'He', Mei: 'She', Siti: 'She', Lily: 'She', Sarah: 'She', Mary: 'She' };
    for (let t = 0; t < 300; t++) {
      const d = randInt(2, 6);
      const a = randInt(1, d - 1);
      const k = randInt(2, 8);
      const Q = d * k;
      const gave = Q * a / d;
      const M = randInt(1, 20);
      const answer = Q - gave + M;
      const name = pickFrom(names);
      const pro = heShe[name] || 'He';
      const item = pickFrom(items);
      return problem(skill, `${name} had ${Q} ${item}. ${pro} gave ${a}/${d} of them away and received ${M} more. How many ${item} does ${name} have now?`, answer, 'twoStepFractionA', { Q, a, d, M, name, item });
    }
    return problem(skill, 'Ali had 20 stickers. He gave 1/4 of them away and received 3 more. How many stickers does Ali have now?', 18, 'twoStepFractionA', { Q: 20, a: 1, d: 4, M: 3, name: 'Ali', item: 'stickers' });
  }
  const materials = ['ribbon', 'string', 'rope', 'wire'];
  const heSheB = { Ali: 'He', Ben: 'He', Raj: 'He', Tom: 'He', John: 'He', Mei: 'She', Siti: 'She', Lily: 'She', Sarah: 'She', Mary: 'She' };
  for (let t = 0; t < 300; t++) {
    const d = randInt(3, 10);
    const aNum = randInt(2, d - 1);
    const bNum = randInt(1, aNum - 1);
    const answer = aNum - bNum;
    const name = pickFrom(names);
    const pro = heSheB[name] || 'He';
    const mat = pickFrom(materials);
    return problem(skill, `${name} had ${aNum}/${d} of a ${mat}. ${pro} used ${bNum}/${d} of the ${mat}. What fraction of the ${mat} is left? Express your answer as ?/${d}.`, answer, 'twoStepFractionB', { aNum, bNum, d, name, mat });
  }
  return problem(skill, 'Mei had 5/8 of a ribbon. She used 2/8 of the ribbon. What fraction of the ribbon is left? Express your answer as ?/8.', 3, 'twoStepFractionB', { aNum: 5, bNum: 2, d: 8, name: 'Mei', mat: 'ribbon' });
}

// F025: exam-style MCQ — mixed fraction sub-patterns
function genExamStyleFraction(skill) {
  const sub = pickFrom(['simplest', 'working', 'findNumber']);
  if (sub === 'simplest') {
    for (let t = 0; t < 300; t++) {
      const d = randInt(3, 12);
      const n = randInt(1, d - 1);
      if (gcd(n, d) !== 1) continue;
      const simplified = `${n}/${d}`;
      const distractors = [];
      const seen = new Set([simplified]);
      for (let u = 0; u < 200 && distractors.length < 3; u++) {
        const dd = randInt(4, 12);
        const nn = randInt(1, dd - 1);
        if (gcd(nn, dd) === 1) continue;
        const frac = `${nn}/${dd}`;
        if (seen.has(frac)) continue;
        seen.add(frac);
        distractors.push(frac);
      }
      if (distractors.length < 3) continue;
      return choiceProblem(skill, 'Which of these fractions is in its simplest form?', simplified, shuffle([simplified, ...distractors]), 'examSimplest', { n, d });
    }
    return choiceProblem(skill, 'Which of these fractions is in its simplest form?', '3/7', shuffle(['3/7', '4/8', '6/9', '2/10']), 'examSimplest', { n: 3, d: 7 });
  }
  if (sub === 'working') {
    for (let t = 0; t < 300; t++) {
      const d1 = randInt(2, 6), d2 = randInt(2, 6);
      if (d1 === d2) continue;
      const L = lcm(d1, d2);
      const a = randInt(1, d1 - 1), b = randInt(1, d2 - 1);
      const v1 = a * (L / d1), v2 = b * (L / d2);
      if (v1 + v2 > L) continue;
      const correct = `${v1}/${L} ${PLUS} ${v2}/${L} = ${v1 + v2}/${L}`;
      const wrongAddDenom = `${a + b}/${d1 + d2}`;
      const wrongLCD = `${a}/${L} ${PLUS} ${b}/${L} = ${a + b}/${L}`;
      const wrongNoSimplify = v1 + v2 > 1 && gcd(v1 + v2, L) > 1
        ? `${(v1 + v2) / gcd(v1 + v2, L)}/${L / gcd(v1 + v2, L)}`
        : `${v1 + v2 + 1}/${L}`;
      const choices = [correct, `${a}/${d1} ${PLUS} ${b}/${d2} = ${wrongAddDenom}`, wrongLCD, wrongNoSimplify];
      return choiceProblem(skill, `Which shows the correct working for ${a}/${d1} ${PLUS} ${b}/${d2}?`, correct, shuffle(choices), 'examWorking', { a, d1, b, d2, L });
    }
    return choiceProblem(skill, `Which shows the correct working for 1/3 ${PLUS} 1/4?`, `4/12 ${PLUS} 3/12 = 7/12`, shuffle([`4/12 ${PLUS} 3/12 = 7/12`, '2/7', '1/12 + 1/12 = 2/12', '8/12']), 'examWorking', { a: 1, d1: 3, b: 1, d2: 4, L: 12 });
  }
  for (let t = 0; t < 300; t++) {
    const b = randInt(2, 8);
    const a = randInt(1, b - 1);
    const ans = randInt(2, 12) * b;
    const C = (ans * a) / b;
    if (C !== Math.floor(C) || C < 1) continue;
    return problem(skill, `${a}/${b} of a number is ${C}. What is the number?`, ans, 'examFindNumber', { a, b, C });
  }
  return problem(skill, '1/3 of a number is 5. What is the number?', 15, 'examFindNumber', { a: 1, b: 3, C: 5 });
}

// F026: mastery drill — meta-generator dispatching to simpler fraction patterns
function genMasteryDrill(skill) {
  const kind = pickFrom(['fractionLike_add', 'fractionLike_sub', 'equiv', 'simplify', 'of_set']);
  if (kind === 'fractionLike_add') {
    const d = randInt(2, 12);
    const a = randInt(1, d - 1);
    const b = randInt(1, d - a);
    return problem(skill, `${a}/${d} ${PLUS} ${b}/${d} = ?/${d}`, a + b, 'masteryAdd', { a, b, d });
  }
  if (kind === 'fractionLike_sub') {
    const d = randInt(2, 12);
    const a = randInt(2, d);
    const b = randInt(1, a - 1);
    return problem(skill, `${a}/${d} ${MINUS} ${b}/${d} = ?/${d}`, a - b, 'masterySub', { a, b, d });
  }
  if (kind === 'equiv') {
    const b = randInt(2, 6);
    const k = randInt(2, 5);
    const a = randInt(1, b - 1);
    return problem(skill, `${a}/${b} = ?/${b * k}`, a * k, 'masteryEquiv', { a, b, k });
  }
  if (kind === 'simplify') {
    for (let t = 0; t < 300; t++) {
      const g = randInt(2, 5);
      const sn = randInt(1, 6);
      const sd = randInt(sn + 1, 8);
      if (gcd(sn, sd) !== 1) continue;
      const n = sn * g, d = sd * g;
      const answer = `${sn}/${sd}`;
      const distractors = [];
      const seen = new Set([answer]);
      const tryAdd = (s) => { if (!seen.has(s) && distractors.length < 3) { seen.add(s); distractors.push(s); } };
      tryAdd(`${n}/${sd}`);
      tryAdd(`${sn}/${d}`);
      tryAdd(`${sn + 1}/${sd}`);
      tryAdd(`${sn}/${sd + 1}`);
      if (distractors.length < 3) continue;
      return choiceProblem(skill, `What is ${n}/${d} in its simplest form?`, answer, shuffle([answer, ...distractors]), 'masterySimplify', { n, d, sn, sd });
    }
    return choiceProblem(skill, 'What is 6/9 in its simplest form?', '2/3', shuffle(['2/3', '6/3', '2/9', '3/6']), 'masterySimplify', { n: 6, d: 9, sn: 2, sd: 3 });
  }
  const d = randInt(2, 8);
  const k = randInt(2, 6);
  const set = d * k;
  const a = randInt(1, d - 1);
  return problem(skill, `${a}/${d} of ${set} =`, (set / d) * a, 'masteryOfSet', { a, d, set });
}

const KINDS = {
  barModel: genBarModel,
  compoundToUnit: genCompoundToUnit, duration: genDuration, moneyConvert: genMoneyConvert, barChart: genBarChart,
  moneyCount: genMoneyCount, moneyCompare: genMoneyCompare, moneyAddSub: genMoneyAddSub, moneyChange: genMoneyChange,
  numberInWords: genNumberInWords, shapeName: genShapeName, chartCategory: genChartCategory, clockRead: genClockRead,
  ordinal: genOrdinal, solidName: genSolidName, clock24: genClock24, fractionOfWhole: genFractionOfWhole,
  fractionIdentify: genFractionIdentify, fractionNaming: genFractionNaming, fractionFromModel: genFractionFromModel,
  unitFractionId: genUnitFractionId, fractionNumberLine: genFractionNumberLine, fractionOrder: genFractionOrder,
  fractionBenchmark: genFractionBenchmark, compareStatements: genCompareStatements,
  simplestForm: genSimplestForm, fractionMissingTerm: genFractionMissingTerm, nonEquivalent: genNonEquivalent,
  equivChain: genEquivChain, simplifyAfterOp: genSimplifyAfterOp, improperFractionId: genImproperFractionId,
  mixedNumberRead: genMixedNumberRead, shadeToTarget: genShadeToTarget, fractionRemainderWP: genFractionRemainderWP,
  numberLineOp: genNumberLineOp, twoStepFraction: genTwoStepFraction, examStyleFraction: genExamStyleFraction,
  masteryDrill: genMasteryDrill,
  add: genAdd, sub: genSub, mul: genMul, div: genDiv,
  missing: genMissing, placeValue: genPlaceValue, compare: genCompare, pattern: genPattern,
  parity: genParity, fractionLike: genFractionLike,
  divRemainder: genDivRemainder, fractionEquiv: genFractionEquiv, fractionRelated: genFractionRelated,
  roundInt: genRoundInt, hcf: genHcf, lcm: genLcm,
  mixedToImproper: genMixedToImproper, fractionOfSet: genFractionOfSet, fractionUnlike: genFractionUnlike,
  decimalPlaceValue: genDecimalPlaceValue, compareDecimal: genCompareDecimal, roundDecimal: genRoundDecimal,
  addSubDecimal: genAddSubDecimal, mulDivDecimal: genMulDivDecimal, fracToDecimal: genFracToDecimal,
  mulDivPow10: genMulDivPow10, orderOps: genOrderOps, mixedAddSub: genMixedAddSub,
  fracTimesWhole: genFracTimesWhole, fracTimesFrac: genFracTimesFrac,
  decMulDivPow10: genDecMulDivPow10, unitConvert: genUnitConvert,
  partAsPercent: genPartAsPercent, percentOf: genPercentOf, percentApp: genPercentApp, rate: genRate,
  fracDivWhole: genFracDivWhole, divByFraction: genDivByFraction,
  percentWhole: genPercentWhole, percentChange: genPercentChange,
  ratioMissing: genRatioMissing, ratioDivide: genRatioDivide,
  algSimplify: genAlgSimplify, algEval: genAlgEval, algSolve: genAlgSolve, average: genAverage,
  rectArea: genRectArea, rectPerimeter: genRectPerimeter, triArea: genTriArea,
  cuboidVolume: genCuboidVolume, circleArea: genCircleArea, circleCircumference: genCircleCircumference,
  angleLine: genAngleLine, anglePoint: genAnglePoint, angleTriangle: genAngleTriangle,
  semicircleArea: genSemicircleArea, semicirclePerimeter: genSemicirclePerimeter,
  quarterArea: genQuarterArea, quarterPerimeter: genQuarterPerimeter, compositeArea: genCompositeArea,
  // Secondary (S1–S4)
  integerAddSub: genIntegerAddSub, integerMulDiv: genIntegerMulDiv,
  indexEval: genIndexEval, indexLaw: genIndexLaw, rootEval: genRootEval, standardFormPower: genStandardFormPower,
  expandCoeff: genExpandCoeff, factorHcf: genFactorHcf, solveLinear2: genSolveLinear2,
  expandProduct: genExpandProduct, factorQuad: genFactorQuad, quadRoot: genQuadRoot,
  simEqn: genSimEqn, gradient: genGradient, proportionDirect: genProportionDirect,
  pythagoras: genPythagoras, trigAngle: genTrigAngle, trigSide: genTrigSide,
  cylinderVolume: genCylinderVolume, sectorArea: genSectorArea,
  median: genMedian, mode: genMode, probability: genProbability,
};

export function generateProblem(skill) {
  const gen = KINDS[skill.spec.kind] || genAdd;
  return gen(skill);
}

// Grade a typed answer. Integer problems need an exact match; decimal problems
// (prob.decimal) are compared at 3 dp so "0.5" and "0.50" both pass and float
// artefacts don't cause false negatives.
export function checkAnswer(value, prob) {
  if (prob.choice) return String(value) === String(prob.answer);
  const n = Number(String(value).trim());
  if (!Number.isFinite(n)) return false;
  if (!prob.decimal) return n === prob.answer;
  return Math.round(n * 1000) === Math.round(prob.answer * 1000);
}
