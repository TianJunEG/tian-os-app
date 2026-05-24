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

// Read a bar / picture / pie / line graph: value, difference, or total.
function genBarChart(skill) {
  const mode = skill.spec.mode || 'bar', r = randInt;
  const sets = [
    { theme: 'the number of marbles of each colour', labels: ['Red', 'Blue', 'Green', 'Yellow'], time: false },
    { theme: 'the pets owned by a class', labels: ['Cats', 'Dogs', 'Fish', 'Birds'], time: false },
    { theme: 'the fruit sold at a stall', labels: ['Apples', 'Pears', 'Plums', 'Grapes'], time: false },
    { theme: 'the number of books read each day', labels: ['Mon', 'Tue', 'Wed', 'Thu'], time: true },
    { theme: 'the temperature recorded each day', labels: ['Mon', 'Tue', 'Wed', 'Thu'], time: true },
  ];
  // Line graphs use time series; pie charts partition a whole (no time series).
  const pool = mode === 'line' ? sets.filter((s) => s.time) : mode === 'pie' ? sets.filter((s) => !s.time) : sets;
  const set = pickFrom(pool);
  const n = Math.min(set.labels.length, r(3, 4)), scale = skill.spec.scale || pickFrom([1, 2, 5, 10]), cap = mode === 'picture' ? 7 : 5;
  const cats = Array.from({ length: n }, (_, i) => ({ label: set.labels[i], value: scale * r(1, cap) }));
  const chart = { mode, cats, scale }, noun = { picture: 'picture graph', pie: 'pie chart', line: 'line graph', bar: 'bar graph' }[mode];
  const q = pickFrom(mode === 'line' ? ['value', 'diff'] : ['value', 'diff', 'total']);
  if (q === 'value') {
    const i = r(0, n - 1);
    return problem(skill, `The ${noun} shows ${set.theme}. What is the value for ${cats[i].label}?`, cats[i].value, 'barChart', { chart, q, i });
  }
  if (q === 'total') return problem(skill, `The ${noun} shows ${set.theme}. What is the total?`, cats.reduce((p, d) => p + d.value, 0), 'barChart', { chart, q });
  let hi = 0, lo = 0;
  cats.forEach((d, i) => { if (d.value > cats[hi].value) hi = i; if (d.value < cats[lo].value) lo = i; });
  if (cats[hi].value === cats[lo].value) return genBarChart(skill);
  return problem(skill, `The ${noun} shows ${set.theme}. How many more for ${cats[hi].label} than ${cats[lo].label}?`, cats[hi].value - cats[lo].value, 'barChart', { chart, q, i: hi, j: lo });
}

const KINDS = {
  barModel: genBarModel,
  compoundToUnit: genCompoundToUnit, duration: genDuration, moneyConvert: genMoneyConvert, barChart: genBarChart,
  moneyCount: genMoneyCount, moneyCompare: genMoneyCompare, moneyAddSub: genMoneyAddSub, moneyChange: genMoneyChange,
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
};

export function generateProblem(skill) {
  const gen = KINDS[skill.spec.kind] || genAdd;
  return gen(skill);
}

// Grade a typed answer. Integer problems need an exact match; decimal problems
// (prob.decimal) are compared at 3 dp so "0.5" and "0.50" both pass and float
// artefacts don't cause false negatives.
export function checkAnswer(value, prob) {
  const n = Number(String(value).trim());
  if (!Number.isFinite(n)) return false;
  if (!prob.decimal) return n === prob.answer;
  return Math.round(n * 1000) === Math.round(prob.answer * 1000);
}
