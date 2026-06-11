// Rule-based Math question generation for the Phase-2 shared question bank.
// MVP: deterministic templates keyed by skill-name keywords, with a numeric
// fallback. No AI. Each question is a plain object (no DB) shaped for models/Question.js.
//
// Scope: Math only. English = Spelling (no Reading/Comprehension/Writing) and
// Science come later via their own templates.

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

// Build an MCQ from a numeric answer + plausible distractors. Distractors are
// de-duplicated against each other and the answer; if collisions leave fewer than
// 3, we top up with nearby values so every MCQ has exactly 4 distinct options.
function mcq(stem, answer, distractors, workedSolution, misconceptionTag, difficulty) {
  const ans = String(answer);
  const seen = new Set([ans]);
  const opts = [];
  for (const d of distractors.map(String)) {
    if (!seen.has(d)) { seen.add(d); opts.push(d); }
  }
  const n = Number(answer);
  for (let delta = 1; opts.length < 3 && delta < 60; delta++) {
    for (const cand of [n + delta, n - delta]) {
      const s = String(cand);
      if (cand > 0 && Number.isFinite(cand) && !seen.has(s)) { seen.add(s); opts.push(s); }
      if (opts.length >= 3) break;
    }
  }
  const choices = shuffle([ans, ...opts.slice(0, 3)]);
  return { type: 'mcq', stem, choices, answer: ans, workedSolution, misconceptionTag, difficulty };
}
function short(stem, answer, workedSolution, misconceptionTag, difficulty) {
  return { type: 'short_answer', stem, choices: [], answer: String(answer), workedSolution, misconceptionTag, difficulty };
}
function shortVisual(stem, answer, workedSolution, misconceptionTag, difficulty, visual) {
  return {
    type: 'short_answer',
    stem,
    choices: [],
    answer: String(answer),
    workedSolution,
    misconceptionTag,
    difficulty,
    visual,
  };
}

const addingUnlikeFractionsSample = {
  type: 'short_answer',
  stem: '1/2 + 1/3 = ?',
  choices: [],
  answer: '5/6',
  workedSolution: 'Find a common denominator of 6.\n1/2 = 3/6.\n1/3 = 2/6.\n3/6 + 2/6 = 5/6.',
  misconceptionTag: 'frac/add-without-common',
  difficulty: 'medium',
};

// One question for a given skill keyword + difficulty.
function buildOne(skillName, difficulty) {
  const name = skillName.toLowerCase();
  const big = difficulty === 'hard' ? 90 : difficulty === 'medium' ? 40 : 12;

  // ---- Parametrised word problems (variations of real P6 exam items, no AI) ----
  // Matched before the generic single-keyword branches below so compound skills
  // (e.g. "Percentage before and after") don't fall into the plain templates.
  if (name.includes('remainder') || (name.includes('fraction') && name.includes('word problem'))) {
    const f = rnd(3, 5), base = rnd(2, 9) * 10, item = ['eggs', 'apples', 'sweets', 'beads'][rnd(0, 3)];
    const remBefore = f * base, left = (f - 1) * base, morning = rnd(2, 9) * 10, total = remBefore + morning;
    return short(`A baker had ${total} ${item} at first. In the morning he used some. In the afternoon he used 1/${f} of the remaining ${item}. After that, ${left} ${item} were left. How many ${item} did he use in the morning?`,
      morning, `After the afternoon, ${f - 1}/${f} of the remainder = ${left}, so the remainder after the morning = ${remBefore}. Morning used = ${total} − ${remBefore} = ${morning}.`, 'frac/remainder', difficulty);
  }
  if (name.includes('exam-style fraction applications')) {
    const d1 = [2, 3, 4][rnd(0, 2)];
    const d2 = [4, 6, 8][rnd(0, 2)];
    const n1 = rnd(1, d1 - 1);
    const n2 = rnd(1, d2 - 1);
    const common = d1 * d2;
    const totalNum = n1 * d2 + n2 * d1;
    return short(`A student completed ${n1}/${d1} of a worksheet in the morning and ${n2}/${d2} in the afternoon. What fraction was completed in total?`,
      `${totalNum}/${common}`,
      `Use common denominator ${common}: ${n1}/${d1} = ${n1 * d2}/${common}, ${n2}/${d2} = ${n2 * d1}/${common}. Add to get ${totalNum}/${common}.`,
      'frac/add-without-common', difficulty);
  }
  if (name.includes('fractions mastery challenge')) {
    const den = [6, 8, 10, 12][rnd(0, 3)];
    const a = rnd(1, Math.floor(den / 2) - 1);
    const b = rnd(1, Math.floor(den / 2) - 1);
    const c = rnd(1, Math.floor(den / 3));
    const result = a + b - c;
    if (result <= 0) return buildOne(skillName, difficulty);
    return short(`Solve: ${a}/${den} + ${b}/${den} − ${c}/${den} = ?`,
      `${result}/${den}`,
      `Same denominator ${den}, so combine numerators: ${a} + ${b} − ${c} = ${result}. Answer ${result}/${den}.`,
      'frac/challenge-procedure', difficulty);
  }
  if (name.includes('before and after') && name.includes('ratio')) {
    const [a, b] = [[1, 3], [1, 2], [2, 3], [3, 4], [2, 5]][rnd(0, 4)];
    const unit = rnd(3, 9) * 10, x = rnd(1, 4) * 10;
    const r0 = a * unit - x, b0 = b * unit - x;
    if (r0 <= 0) return buildOne(skillName, difficulty);
    return short(`There were ${r0} red pens and ${b0} blue pens. After an equal number of red and blue pens were added, the ratio of red to blue became ${a} : ${b}. How many red pens were there in the end?`,
      a * unit, `The difference ${b0} − ${r0} = ${b0 - r0} is unchanged. After, blue − red = ${b - a} units = ${b0 - r0}, so 1 unit = ${unit}. Red in the end = ${a} unit${a > 1 ? 's' : ''} = ${a * unit}.`, 'ratio/before-after', difficulty);
  }
  if (name.includes('before and after') && name.includes('percent')) {
    const fam = [{ p1: 40, p2: 32, blueU: 12, t1U: 20, yU: 8, t2U: 25, redU: 5 },
      { p1: 50, p2: 40, blueU: 4, t1U: 8, yU: 4, t2U: 10, redU: 2 }][rnd(0, 1)];
    const m = rnd(3, 8), blue = fam.blueU * m, total1 = fam.t1U * m, yellow = fam.yU * m, total2 = fam.t2U * m, red = fam.redU * m;
    return short(`A box contained some yellow cubes and ${blue} blue cubes. ${fam.p1}% of the cubes were yellow. After some red cubes were added, ${fam.p2}% of the cubes were yellow. How many red cubes were added?`,
      red, `Blue = ${100 - fam.p1}% = ${blue}, so the total was ${total1} and yellow = ${yellow}. Yellow is unchanged: ${yellow} is ${fam.p2}% of the new total ${total2}. Red added = ${total2} − ${total1} = ${red}.`, 'percent/before-after', difficulty);
  }
  if (name.includes('increase') || name.includes('decrease')) {
    const base = rnd(2, 9) * 10, pct = [10, 20, 25, 50][rnd(0, 3)], after = base + base * pct / 100;
    return short(`A price increased from $${base} to $${after}. What was the percentage increase?`, `${pct}`,
      `Increase = $${after - base}. ${after - base}/${base} × 100% = ${pct}%.`, 'percent/increase', difficulty);
  }
  if (name.includes('tiered') || (name.includes('rate') && name.includes('charge'))) {
    const a = [2, 2.5, 3, 3.5][rnd(0, 3)], b = a + [1, 1.5, 2][rnd(0, 2)], N = [30, 40, 50][rnd(0, 2)], extra = rnd(1, 5) * 10;
    const U = N + extra, cost = N * a + extra * b;
    return short(`Water costs $${a} per m³ for the first ${N} m³, and $${b} per m³ for every additional m³. A family used ${U} m³. How much was their water bill?`,
      `${cost}`, `First ${N} m³: ${N} × $${a} = $${N * a}. Next ${extra} m³: ${extra} × $${b} = $${extra * b}. Total = $${cost}.`, 'rate/tiered', difficulty);
  }
  if (name.includes('water level')) {
    const r = rnd(2, 6), s = r * rnd(3, 9), d = rnd(2, 9), t = d * s / r;
    return short(`Water drips into an empty rectangular tank with a base area of ${s} cm² at a rate of ${r} cm³ per second. How many seconds will it take for the water to be ${d} cm deep?`,
      t, `Volume needed = base area × depth = ${s} × ${d} = ${s * d} cm³. Time = ${s * d} ÷ ${r} = ${t} s.`, 'volume/rate', difficulty);
  }
  if (name.includes('solving') && name.includes('algebra')) {
    const k = rnd(2, 4), y = rnd(5, 15), cMax = (k - 1) * y - 1;
    if (cMax < 2) return buildOne(skillName, difficulty);
    const c = rnd(2, cMax), total = y * (2 + k) + c;
    return short(`Ali had y marbles. Bala had ${c} more marbles than Ali. Charles had ${k} times as many marbles as Ali. Altogether they had ${total} marbles. How many more marbles did Charles have than Bala?`,
      (k - 1) * y - c, `y + (y + ${c}) + ${k}y = ${total} → ${2 + k}y = ${total - c} → y = ${y}. Charles = ${k * y}, Bala = ${y + c}. Difference = ${(k - 1) * y - c}.`, 'algebra/word', difficulty);
  }
  if (name.includes('multiple quantities') || name.includes('total value')) {
    const [a, b, c] = [[2, 3, 5], [1, 2, 3], [2, 2, 4], [1, 3, 4]][rnd(0, 3)];
    const unit = rnd(3, 9) * 5, total = (a + b + c) * unit;
    return short(`Red, blue and green counters are in the ratio ${a} : ${b} : ${c}. There are ${total} counters in all. How many are green?`,
      c * unit, `Total = ${a + b + c} units = ${total}, so 1 unit = ${unit}. Green = ${c} units = ${c * unit}.`, 'ratio/multi', difficulty);
  }
  if (name.includes('percent') && name.includes('word problem')) {
    const orig = rnd(2, 9) * 10, pct = [10, 20, 25][rnd(0, 2)], pay = orig - orig * pct / 100;
    return short(`A shirt costing $${orig} is sold at a ${pct}% discount. What is the selling price?`, `${pay}`,
      `Discount = ${pct}% × $${orig} = $${orig * pct / 100}. Selling price = $${orig} − $${orig * pct / 100} = $${pay}.`, 'percent/discount', difficulty);
  }

  // ---- v0.1.1 P4/P5 coverage hardening batch (explicit skill-name branches) ----
  if (name.includes('comparing decimals')) {
    const whole = rnd(1, 9);
    const tenthsA = rnd(1, 9);
    let tenthsB = rnd(1, 9); if (tenthsB === tenthsA) tenthsB = (tenthsB % 9) + 1;
    const hundredthsA = rnd(0, 9);
    const hundredthsB = rnd(0, 9);
    const a = Number(`${whole}.${tenthsA}${hundredthsA}`);
    const b = Number(`${whole}.${tenthsB}${hundredthsB}`);
    const ans = Math.max(a, b).toFixed(2);
    return short(`Which is greater: ${a.toFixed(2)} or ${b.toFixed(2)}? Write the greater number.`, ans,
      `Compare tenths first (${tenthsA} vs ${tenthsB}). If needed, compare hundredths. The greater number is ${ans}.`, 'decimal/compare-length', difficulty);
  }
  if (name.includes('decimals on a number line')) {
    const start = rnd(2, 8);
    const parts = [4, 5, 10][rnd(0, 2)];
    const n = rnd(1, parts - 1);
    const step = 1 / parts;
    const val = Number((start + n * step).toFixed(2));
    const q = short(`On a number line, the distance from ${start} to ${start + 1} is split into ${parts} equal parts. What value is ${n} part${n > 1 ? 's' : ''} to the right of ${start}?`,
      val.toFixed(2), `Each part is 1/${parts} = ${step.toFixed(2)}. ${n} parts is ${(n * step).toFixed(2)}. So ${start} + ${(n * step).toFixed(2)} = ${val.toFixed(2)}.`, 'decimal/number-line', difficulty);
    q.diagramSpec = { type: 'number_line', width: 640, height: 180, data: { min: start, max: start + 1, minStepCount: parts, points: [{ value: val, label: '?' }], endpointLabels: [String(start), String(start + 1)] } };
    return q;
  }
  if (name.includes('ordering decimals')) {
    const set = new Set();
    while (set.size < 4) set.add((rnd(10, 99) / 10).toFixed(1));
    const arr = [...set].map(Number);
    const sorted = [...arr].sort((x, y) => x - y);
    return short(`Arrange from smallest to largest: ${arr.map((x) => x.toFixed(1)).join(', ')}.`,
      sorted.map((x) => x.toFixed(1)).join(', '), `Compare whole numbers first, then tenths: ${sorted.map((x) => x.toFixed(1)).join(' < ')}.`, 'decimal/order', difficulty);
  }
  if (name.includes('comparing fractions (same numerator)')) {
    const n = rnd(1, 5);
    let d1 = rnd(n + 2, 10), d2 = rnd(n + 2, 10);
    if (d1 === d2) d2 = d1 + 1;
    const greater = d1 < d2 ? `${n}/${d1}` : `${n}/${d2}`;
    return short(`Which is greater: ${n}/${d1} or ${n}/${d2}? Write the greater fraction.`,
      greater, `Same numerator means the smaller denominator gives larger parts. So the greater fraction is ${greater}.`, 'frac/compare-numer', difficulty);
  }
  if (name.includes('mixed numbers and improper fractions')) {
    const whole = rnd(1, 5);
    const d = rnd(2, 8);
    const n = rnd(1, d - 1);
    return short(`Write ${whole} ${n}/${d} as an improper fraction.`,
      `${whole * d + n}/${d}`, `${whole} ${n}/${d} = (${whole} × ${d} + ${n})/${d} = ${whole * d + n}/${d}.`, 'frac/mixed-improper', difficulty);
  }
  if (name.includes('place value to 1 000 000')) {
    const n = rnd(100000, 999999);
    const places = [['hundred-thousands', 100000], ['ten-thousands', 10000], ['thousands', 1000], ['hundreds', 100]];
    const [label, value] = places[rnd(0, places.length - 1)];
    const digit = Math.floor(n / value) % 10;
    return short(`In ${n.toLocaleString()}, what is the digit in the ${label} place?`,
      digit, `${n.toLocaleString()} → the ${label} digit is ${digit}.`, 'place-value', difficulty);
  }
  if (name.includes('rounding to nearest 1000') || name.includes('rounding to the nearest 1000')) {
    const n = rnd(2000, 99999);
    const ans = Math.round(n / 1000) * 1000;
    return short(`Round ${n.toLocaleString()} to the nearest thousand.`,
      ans.toLocaleString(), `Check the hundreds digit of ${n.toLocaleString()}. Round to ${ans.toLocaleString()}.`, 'rounding', difficulty);
  }
  if (name.includes('rounding decimals')) {
    const a = rnd(1, 20), b = rnd(0, 9), c = rnd(0, 9);
    const n = Number(`${a}.${b}${c}`);
    const ans = n.toFixed(1);
    return short(`Round ${n.toFixed(2)} to 1 decimal place.`,
      ans, `Look at the hundredths digit (${c}). Rounded to 1 decimal place: ${ans}.`, 'rounding', difficulty);
  }
  if (name.includes('comparing unlike fractions')) {
    const d1 = rnd(2, 5), d2 = rnd(3, 8);
    const a = rnd(1, d1 - 1), b = rnd(1, d2 - 1);
    if (a * d2 === b * d1) return buildOne(skillName, difficulty);
    const greater = a * d2 > b * d1 ? `${a}/${d1}` : `${b}/${d2}`;
    return short(`Which is greater: ${a}/${d1} or ${b}/${d2}? Write the greater fraction.`,
      greater, `Cross-multiply: ${a}×${d2} = ${a * d2}, ${b}×${d1} = ${b * d1}. The greater fraction is ${greater}.`, 'frac/compare-unlike', difficulty);
  }
  if (name.includes('ordering fractions')) {
    const d = rnd(6, 12);
    const picks = shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 4);
    const sorted = [...picks].sort((x, y) => x - y);
    return short(`Arrange from smallest to largest: ${picks.map((x) => `${x}/${d}`).join(', ')}.`,
      sorted.map((x) => `${x}/${d}`).join(', '), `Same denominator, so order by numerator: ${sorted.map((x) => `${x}/${d}`).join(' < ')}.`, 'frac/order-denom', difficulty);
  }
  if (name.includes('adding/subtracting mixed numbers') || name.includes('adding and subtracting mixed numbers')) {
    const d = rnd(3, 8);
    const w1 = rnd(1, 4), n1 = rnd(1, d - 1);
    const w2 = rnd(1, 3), n2 = rnd(1, d - 1);
    if (Math.random() < 0.5) {
      const num = (w1 * d + n1) + (w2 * d + n2);
      return short(`${w1} ${n1}/${d} + ${w2} ${n2}/${d} = ? (give your answer as an improper fraction over ${d})`,
        `${num}/${d}`, `Convert each mixed number: ${w1} ${n1}/${d} = ${(w1 * d + n1)}/${d}, ${w2} ${n2}/${d} = ${(w2 * d + n2)}/${d}. Add numerators: ${num}/${d}.`, 'frac/mixed-add-sub', difficulty);
    }
    const left = (w1 * d + n1) + (w2 * d + n2);
    return short(`${left}/${d} − ${w2} ${n2}/${d} = ? (give your answer as an improper fraction over ${d})`,
      `${w1 * d + n1}/${d}`, `Convert ${w2} ${n2}/${d} to ${(w2 * d + n2)}/${d}. Then ${left}/${d} − ${(w2 * d + n2)}/${d} = ${(w1 * d + n1)}/${d}.`, 'frac/mixed-add-sub', difficulty);
  }
  if (name.includes('percentage of a quantity')) {
    const p = [10, 20, 25, 40, 50, 75][rnd(0, 5)];
    const base = p === 25 || p === 75 ? rnd(2, 12) * 4 : p === 20 || p === 40 ? rnd(2, 12) * 5 : rnd(2, 12) * 10;
    const ans = (p / 100) * base;
    return short(`What is ${p}% of ${base}?`,
      ans, `${p}% of ${base} = ${p}/100 × ${base} = ${ans}.`, 'percent/of-quantity', difficulty);
  }
  if (name.includes('reading tables')) {
    const cats = ['Red', 'Blue', 'Green', 'Yellow'];
    const vals = shuffle([rnd(8, 24), rnd(8, 24), rnd(8, 24), rnd(8, 24)]);
    const pick = rnd(0, cats.length - 1);
    return shortVisual(
      `Use the table. How many students chose ${cats[pick]}?`,
      vals[pick],
      `From the table, ${cats[pick]} corresponds to ${vals[pick]} students.`,
      'data/read-cell',
      difficulty,
      {
        type: 'table',
        version: 'v1',
        alt: 'Table of favourite colour and number of students',
        payload: {
          headers: ['Category', 'Count'],
          rows: cats.map((c, i) => [c, String(vals[i])]),
        },
      }
    );
  }
  if (name.includes('interpreting and comparing data')) {
    const labels = ['Class A', 'Class B', 'Class C', 'Class D'];
    const vals = shuffle([rnd(12, 35), rnd(12, 35), rnd(12, 35), rnd(12, 35)]);
    const hi = vals.indexOf(Math.max(...vals));
    const lo = vals.indexOf(Math.min(...vals));
    if (Math.random() < 0.5) {
      return shortVisual(
        `Use the table. Which class has the highest score? Write the class name.`,
        labels[hi],
        `${labels[hi]} has the highest value (${vals[hi]}).`,
        'data/compare-max',
        difficulty,
        {
          type: 'table',
          version: 'v1',
          alt: 'Table of class and score',
          payload: {
            headers: ['Class', 'Score'],
            rows: labels.map((l, i) => [l, String(vals[i])]),
          },
        }
      );
    }
    return shortVisual(
      `Use the table. How many more points did ${labels[hi]} score than ${labels[lo]}?`,
      vals[hi] - vals[lo],
      `${labels[hi]} scored ${vals[hi]} and ${labels[lo]} scored ${vals[lo]}. Difference = ${vals[hi] - vals[lo]}.`,
      'data/compare-difference',
      difficulty,
      {
        type: 'table',
        version: 'v1',
        alt: 'Table of class and score',
        payload: {
          headers: ['Class', 'Score'],
          rows: labels.map((l, i) => [l, String(vals[i])]),
        },
      }
    );
  }
  if (name.includes('bar graph')) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu'];
    const vals = shuffle([rnd(2, 10), rnd(2, 10), rnd(2, 10), rnd(2, 10)]);
    const ask = rnd(0, labels.length - 1);
    return shortVisual(
      `A bar graph is shown as table data below. How many books were read on ${labels[ask]}?`,
      vals[ask],
      `From the table-based bar data, ${labels[ask]} has value ${vals[ask]}.`,
      'graph/read-value',
      difficulty,
      {
        type: 'table',
        version: 'v1',
        alt: 'Bar graph data shown in a table: day and books read',
        payload: {
          headers: ['Day', 'Books Read (bar value)'],
          rows: labels.map((l, i) => [l, String(vals[i])]),
        },
      }
    );
  }

  // ── Foundational counting & number facts (so the earliest recommended skills
  //     are actually practiceable) ──
  if (name.includes('counting') || name.includes('skip count')) {
    if (name.includes('skip')) {
      const k = [2, 5, 10][rnd(0, 2)], a = k * rnd(1, 9);
      return short(`Skip count by ${k}: ${a}, ${a + k}, ___`, a + 2 * k, `Add ${k} each time: ${a + k} + ${k} = ${a + 2 * k}.`, 'count/lose-step', difficulty);
    }
    const cap = name.includes('1000') ? 999 : name.includes('100') ? 99 : 19;
    const n = rnd(5, cap);
    const templates = [
      () => short(`What number comes after ${n}?`, n + 1, `${n} + 1 = ${n + 1}.`, 'count/next', difficulty),
      () => short(`What number comes before ${n}?`, n - 1, `${n} - 1 = ${n - 1}.`, 'count/before', difficulty),
      () => short(`What number is between ${n - 1} and ${n + 1}?`, n, `${n} sits between ${n - 1} and ${n + 1}.`, 'count/between', difficulty),
      () => short(`Fill in the missing number: ${n - 1}, ___, ${n + 1}`, n, `The count goes ${n - 1}, ${n}, ${n + 1}.`, 'count/missing-number', difficulty),
      () => short(`Count forward: ${n}, ${n + 1}, ___`, n + 2, `Counting forward adds 1 each time.`, 'count/forward', difficulty),
      () => short(`Count backward: ${n}, ${n - 1}, ___`, n - 2, `Counting backward subtracts 1 each time.`, 'count/backward', difficulty),
      () => {
        const a = rnd(1, cap - 2);
        const b = a + rnd(1, 3);
        return short(`Which number is greater, ${a} or ${b}?`, Math.max(a, b), `${Math.max(a, b)} is greater than ${Math.min(a, b)}.`, 'count/compare', difficulty);
      },
      () => {
        const arr = [n + 1, n - 1, n];
        return short(`Order these numbers from smallest to largest: ${arr.join(', ')}.`, `${n - 1}, ${n}, ${n + 1}`, `Smallest to largest: ${n - 1}, ${n}, ${n + 1}.`, 'count/order', difficulty);
      },
    ];
    return templates[rnd(0, templates.length - 1)]();
  }
  if (name.includes('number bond') || (name.includes('addition') && name.includes('fact'))) {
    const a = rnd(1, 10), b = rnd(1, Math.min(10, 20 - a));
    return mcq(`${a} + ${b} = ?`, a + b, [a + b + 1, a + b - 1, a + b + 2], `${a} + ${b} = ${a + b}.`, 'add/recall', difficulty);
  }
  if (name.includes('subtraction') && name.includes('fact')) {
    const a = rnd(6, 20), b = rnd(1, a - 1);
    return mcq(`${a} − ${b} = ?`, a - b, [a - b + 1, a - b - 1, a - b + 2], `${a} − ${b} = ${a - b}.`, 'sub/recall', difficulty);
  }
  if (name.includes('comparing numbers')) {
    let a = rnd(10, big * 10), b = rnd(10, big * 10); if (a === b) b += rnd(1, 9);
    return short(`Which is greater, ${a} or ${b}? Write the greater number.`, Math.max(a, b), `${Math.max(a, b)} is greater than ${Math.min(a, b)}.`, 'compare/leading-digit', difficulty);
  }
  if (name.includes('multiplication') || name.includes('times table')) {
    const a = rnd(2, difficulty === 'easy' ? 9 : 12), b = rnd(2, difficulty === 'easy' ? 9 : 12);
    return mcq(`${a} × ${b} = ?`, a * b, [a * b + a, a * b - b, a * (b + 1)],
      `${a} × ${b} = ${a * b}.`, 'mult/recall', difficulty);
  }
  if (name.includes('long division') || name.includes('division')) {
    const b = rnd(2, 9), q = rnd(2, big), a = b * q;
    return short(`${a} ÷ ${b} = ?`, q, `${a} ÷ ${b} = ${q} because ${b} × ${q} = ${a}.`, 'div/remainder', difficulty);
  }
  if (name.includes('place value')) {
    const n = rnd(1000, 99999);
    const place = [['ten thousands', 10000], ['thousands', 1000], ['hundreds', 100], ['tens', 10]][rnd(0, 3)];
    const digit = Math.floor(n / place[1]) % 10;
    return short(`In ${n.toLocaleString()}, what is the digit in the ${place[0]} place?`, digit,
      `${n.toLocaleString()} → the ${place[0]} digit is ${digit}.`, 'place-value', difficulty);
  }
  if (name.includes('equivalent fraction')) {
    const n = rnd(1, 4), d = rnd(n + 1, 6), k = rnd(2, 4);
    const q = short(`Fill in: ${n}/${d} = ?/${d * k}`, n * k, `Multiply top and bottom by ${k}: ${n}×${k}=${n * k}, ${d}×${k}=${d * k}.`, 'frac/scale-one-part', difficulty);
    q.diagramSpec = { type: 'fraction_bar', width: 640, height: 140, data: { parts: d, shaded: n, labelMode: 'none' } };
    return q;
  }
  if (name.includes('simplif')) {
    const k = rnd(2, 5), n = rnd(1, 4), d = rnd(n + 1, 6);
    const num = n * k, den = d * k, g = gcd(num, den);
    const q = short(`Simplify ${num}/${den} to its lowest terms.`, `${num / g}/${den / g}`,
      `Divide top and bottom by ${g}: ${num}/${den} = ${num / g}/${den / g}.`, 'frac/incomplete-simplify', difficulty);
    q.diagramSpec = { type: 'fraction_bar', width: 640, height: 140, data: { parts: den, shaded: num, labelMode: 'none' } };
    return q;
  }
  if (
    name.includes('adding like') ||
    (name.includes('adding') && name.includes('like') && !name.includes('unlike')) ||
    name.includes('add fractions with same denominator') ||
    name.includes('add same denominator')
  ) {
    const d = rnd(4, 10), a = rnd(1, d - 2), b = rnd(1, d - a - 1);
    const q = short(`${a}/${d} + ${b}/${d} = ?  (give your answer as a fraction)`, `${a + b}/${d}`,
      `Same denominator: add the tops. ${a}+${b}=${a + b}, keep /${d}.`, 'frac/add-denominators', difficulty);
    q.diagramSpec = { type: 'fraction_bar', width: 640, height: 140, data: { parts: d, shaded: a + b, labelMode: 'none' } };
    return q;
  }
  if (name.includes('adding unlike') || (name.includes('add') && name.includes('unlike'))) {
    if (difficulty === 'medium') return { ...addingUnlikeFractionsSample };
    const d1 = rnd(2, 4), d2 = d1 * rnd(2, 3), a = rnd(1, d1 - 1), b = rnd(1, d2 - 1);
    const num = a * (d2 / d1) + b;
    return short(`${a}/${d1} + ${b}/${d2} = ?  (over ${d2})`, `${num}/${d2}`,
      `Make denominators equal (${d2}): ${a}/${d1} = ${a * (d2 / d1)}/${d2}, then add ${b}/${d2} → ${num}/${d2}.`, 'frac/add-without-common', difficulty);
  }
  if (name.includes('subtract')) {
    const d1 = rnd(2, 4), d2 = d1 * rnd(2, 3), b = rnd(1, d2 - 1), a = rnd(2, d1 - 1);
    const num = a * (d2 / d1) - b;
    return short(`${a}/${d1} − ${b}/${d2} = ?  (over ${d2})`, `${num}/${d2}`,
      `Common denominator ${d2}: ${a}/${d1}=${a * (d2 / d1)}/${d2}; ${a * (d2 / d1)}−${b}=${num} → ${num}/${d2}.`, 'frac/sub-denominators', difficulty);
  }
  if (name.includes('multiplying fraction')) {
    const n = rnd(1, 5), d = rnd(n + 1, 8), w = rnd(2, 6);
    return short(`${n}/${d} × ${w} = ?  (give as a fraction over ${d})`, `${n * w}/${d}`,
      `Multiply the numerator by ${w}: ${n}×${w}=${n * w}, keep /${d}.`, 'frac/mult-whole', difficulty);
  }
  if (name.includes('decimal place')) {
    const whole = rnd(1, 99), dec = rnd(1, 99);
    const val = `${whole}.${String(dec).padStart(2, '0')}`;
    return short(`In ${val}, what digit is in the tenths place?`, String(dec).padStart(2, '0')[0],
      `Tenths is the first digit after the point: ${val} → ${String(dec).padStart(2, '0')[0]}.`, 'decimal/place', difficulty);
  }
  if (name.includes('adding decimal')) {
    const a = rnd(1, 50) + rnd(1, 9) / 10, b = rnd(1, 50) + rnd(1, 9) / 10;
    const sum = Math.round((a + b) * 10) / 10;
    return short(`${a.toFixed(1)} + ${b.toFixed(1)} = ?`, sum.toFixed(1),
      `Line up the points and add: ${a.toFixed(1)} + ${b.toFixed(1)} = ${sum.toFixed(1)}.`, 'decimal/align', difficulty);
  }
  if (name.includes('decimals and fraction')) {
    const opts = [['1/2', '0.5'], ['1/4', '0.25'], ['3/4', '0.75'], ['1/5', '0.2'], ['1/10', '0.1']];
    const [f, dec] = opts[rnd(0, opts.length - 1)];
    return short(`Write ${f} as a decimal.`, dec, `${f} = ${dec}.`, 'decimal/convert', difficulty);
  }
  // Circles before rectangles so "…area of a circle" / "perimeter…circle parts"
  // don't fall into the rectangle templates. Friendly radii keep π = 22/7 exact.
  if (name.includes('circle') || name.includes('circumference')) {
    const r = [7, 14, 21][rnd(0, 2)];
    if (name.includes('circumference') || name.includes('perimeter') || name.includes('part')) {
      const circ = 2 * 22 / 7 * r;
      return short(`Find the circumference of a circle of radius ${r} cm. (Take π = 22/7)`, circ,
        `C = 2 × 22/7 × ${r} = ${circ} cm.`, 'circle/circumference', difficulty);
    }
    const area = 22 / 7 * r * r;
    return short(`Find the area of a circle of radius ${r} cm. (Take π = 22/7)`, area,
      `Area = 22/7 × ${r} × ${r} = ${area} cm².`, 'circle/area', difficulty);
  }
  if (name.includes('volume') && (name.includes('cube') || name.includes('cuboid'))) {
    const l = rnd(2, big), w = rnd(2, Math.max(3, Math.floor(big / 2))), h = rnd(2, 9);
    return short(`A cuboid measures ${l} cm by ${w} cm by ${h} cm. What is its volume (cm³)?`, l * w * h,
      `Volume = ${l} × ${w} × ${h} = ${l * w * h} cm³.`, 'volume/cuboid', difficulty);
  }
  if (name.includes('perimeter') && name.includes('rectangl')) {
    const l = rnd(3, big), w = rnd(2, big);
    return short(`A rectangle is ${l} cm by ${w} cm. What is its perimeter (cm)?`, 2 * (l + w),
      `Perimeter = 2 × (length + width) = 2 × (${l} + ${w}) = ${2 * (l + w)} cm.`, 'geo/perimeter-vs-area', difficulty);
  }
  if (name.includes('area') && name.includes('rectangl')) {
    const l = rnd(3, big), w = rnd(2, big);
    return short(`A rectangle is ${l} cm by ${w} cm. What is its area (cm²)?`, l * w,
      `Area = length × width = ${l} × ${w} = ${l * w} cm².`, 'geo/perimeter-vs-area', difficulty);
  }
  if (name.includes('mental addition') || name.includes('mental subtraction') || (name.includes('mental') && (name.includes('add') || name.includes('subtr')))) {
    if (Math.random() < 0.5) {
      const a = rnd(10, big * 3), b = rnd(10, big * 3);
      return short(`${a} + ${b} = ?`, a + b, `${a} + ${b} = ${a + b}.`, 'mental/regroup', difficulty);
    }
    const a = rnd(20, big * 4), b = rnd(5, a - 1);
    return short(`${a} − ${b} = ?`, a - b, `${a} − ${b} = ${a - b}.`, 'mental/regroup', difficulty);
  }
  if (name.includes('percentage') || name.includes('percent')) {
    const pcts = difficulty === 'easy' ? [10, 25, 50] : difficulty === 'medium' ? [10, 20, 25, 50, 75] : [5, 15, 30, 40, 60];
    const p = pcts[rnd(0, pcts.length - 1)];
    const base = rnd(2, 10) * (difficulty === 'easy' ? 10 : 20);
    const ans = (p / 100) * base;
    return short(`What is ${p}% of ${base}?`, ans % 1 === 0 ? ans : ans.toFixed(2),
      `${p}% of ${base} = ${p}/100 × ${base} = ${ans % 1 === 0 ? ans : ans.toFixed(2)}.`, 'percent/of-quantity', difficulty);
  }
  if (name.includes('model drawing') || name.includes('multi-step')) {
    const each = rnd(3, 12), groups = rnd(3, 9), extra = rnd(2, 20);
    return short(`A box holds ${each} pencils. There are ${groups} boxes and ${extra} loose pencils. How many pencils altogether?`,
      each * groups + extra, `${groups} × ${each} = ${each * groups}, then + ${extra} = ${each * groups + extra}.`, 'wordproblem/operation-choice', difficulty);
  }
  if (name.includes('round')) {
    const [word, t] = [['ten', 10], ['hundred', 100], ['thousand', 1000]][difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2];
    const n = rnd(t * 2, t * 90) + rnd(1, t - 1);
    const ans = Math.round(n / t) * t;
    return short(`Round ${n.toLocaleString()} to the nearest ${word}.`, ans.toLocaleString(),
      `Look at the digit after the ${word}s place: ${n.toLocaleString()} → ${ans.toLocaleString()}.`, 'rounding', difficulty);
  }
  if (name.includes('order of operation')) {
    const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9);
    return short(`Find the value of ${a} + ${b} × ${c}.`, a + b * c,
      `Multiply first: ${b} × ${c} = ${b * c}, then + ${a} = ${a + b * c}.`, 'order-of-ops', difficulty);
  }
  if (name.includes('mixed number') || name.includes('improper')) {
    const w = rnd(1, 5), d = rnd(2, 6), n = rnd(1, d - 1);
    const unit = d === 2 ? 'halves' : d === 3 ? 'thirds' : d === 4 ? 'quarters' : `(1/${d})s`;
    return short(`How many ${unit} are there in ${w} ${n}/${d}?`, w * d + n,
      `${w} ${n}/${d} = (${w}×${d} + ${n})/${d} = ${w * d + n}/${d}.`, 'frac/mixed-improper', difficulty);
  }
  if (name.includes('divid') && name.includes('fraction')) {
    const d = rnd(2, 6), whole = rnd(2, 8);
    return short(`How many pieces of 1/${d} m can be cut from ${whole} m of ribbon?`, whole * d,
      `${whole} ÷ 1/${d} = ${whole} × ${d} = ${whole * d}.`, 'frac/divide', difficulty);
  }
  if (name.includes('subtract') && name.includes('decimal')) {
    const a = rnd(10, 90) + rnd(1, 99) / 100, b = rnd(1, 9) + rnd(1, 99) / 100;
    const diff = Math.round((a - b) * 100) / 100;
    return short(`${a.toFixed(2)} − ${b.toFixed(2)} = ?`, diff.toFixed(2),
      `Line up the decimal points and subtract: ${diff.toFixed(2)}.`, 'decimal/align', difficulty);
  }
  if (name.includes('ratio')) {
    const k = rnd(2, 6), a = rnd(1, 6);
    let b = rnd(1, 6); if (b === a) b = (a % 6) + 1;   // keep the two parts different
    const g = gcd(a, b);
    return short(`Simplify the ratio ${a * k} : ${b * k}.`, `${a / g} : ${b / g}`,
      `Divide both parts by ${k * g}: ${a * k} : ${b * k} = ${a / g} : ${b / g}.`, 'ratio/simplify', difficulty);
  }
  if (name.includes('rate') || name.includes('speed') || name.includes('distance')) {
    const speed = rnd(3, 12) * 5, time = rnd(2, 6);
    return short(`A car travels at ${speed} km/h for ${time} hours. How far does it travel (km)?`, speed * time,
      `Distance = speed × time = ${speed} × ${time} = ${speed * time} km.`, 'speed/dst', difficulty);
  }
  if (name.includes('average') || name.includes('mean')) {
    const k = [3, 4, 5][rnd(0, 2)], avg = rnd(6, 20) * 2, d = rnd(1, 4);
    const nums = k === 3 ? [avg - d, avg, avg + d]
      : k === 4 ? [avg - 3 * d, avg - d, avg + d, avg + 3 * d]
        : [avg - 2 * d, avg - d, avg, avg + d, avg + 2 * d];
    return short(`Find the average of: ${shuffle(nums).join(', ')}.`, avg,
      `Sum = ${avg * k}; ${avg * k} ÷ ${k} = ${avg}.`, 'average/mean', difficulty);
  }
  if (name.includes('hcf') || name.includes('factor') || name.includes('multiple') || name.includes('lcm')) {
    const x = rnd(2, 9) * rnd(2, 6), y = rnd(2, 9) * rnd(2, 6), g = gcd(x, y);
    return short(`Find the highest common factor (HCF) of ${x} and ${y}.`, g,
      `The largest number that divides both ${x} and ${y} is ${g}.`, 'number-theory/hcf', difficulty);
  }
  if (name.includes('pattern')) {
    const start = rnd(1, 9), step = rnd(2, 9);
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    return short(`What is the next number in the pattern: ${seq.join(', ')}, ___ ?`, start + 4 * step,
      `Each term increases by ${step}: ${start + 3 * step} + ${step} = ${start + 4 * step}.`, 'pattern/arithmetic', difficulty);
  }
  if (name.includes('evaluat') && name.includes('algebra')) {
    const a = rnd(2, 6), b = rnd(1, 9), x = rnd(2, 8);
    return short(`Find the value of ${a}x + ${b} when x = ${x}.`, a * x + b,
      `${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}.`, 'algebra/evaluate', difficulty);
  }
  if (name.includes('triangle')) {
    const base = rnd(2, Math.floor(big / 2)) * 2, h = rnd(2, big);   // even base → whole area
    return short(`A triangle has a base of ${base} cm and a height of ${h} cm. Find its area (cm²).`,
      base * h / 2, `Area = ½ × base × height = ½ × ${base} × ${h} = ${base * h / 2} cm².`, 'geo/triangle-area', difficulty);
  }
  if (name.includes('understanding fraction')) {
    const total = [10, 12, 15, 16, 20][rnd(0, 4)], part = rnd(1, total - 1), g = gcd(part, total);
    const q = short(`In a group of ${total} marbles, ${part} are red. What fraction of the marbles are red? (Give your answer in lowest terms.)`,
      `${part / g}/${total / g}`, `${part} out of ${total} = ${part}/${total} = ${part / g}/${total / g}.`, 'frac/of-set', difficulty);
    q.diagramSpec = { type: 'fraction_bar', width: 640, height: 140, data: { parts: total / g, shaded: part / g, labelMode: 'none' } };
    return q;
  }
  if (name.includes('number line')) {
    const start = rnd(1, 8), parts = [4, 5, 8, 10][rnd(0, 3)], n = rnd(1, parts - 1);
    const val = Number((start + n / parts).toFixed(3)), per = Number((n / parts).toFixed(3));
    const q = short(`On a number line, the distance from ${start} to ${start + 1} is split into ${parts} equal parts. What value is ${n} part${n > 1 ? 's' : ''} to the right of ${start}?`,
      val, `Each part = 1 ÷ ${parts} = ${Number((1 / parts).toFixed(3))}. ${n} parts = ${per}, so ${start} + ${per} = ${val}.`, 'decimal/number-line', difficulty);
    q.diagramSpec = { type: 'number_line', width: 640, height: 180, data: { min: start, max: start + 1, minStepCount: parts, points: [{ value: val, label: '?' }], endpointLabels: [String(start), String(start + 1)] } };
    return q;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Figure-free coverage for the developmental skill graph. Each branch below is
  // a numeric/algebraic skill that can be generated honestly without a visual
  // stimulus. Skills that intrinsically need a figure (2D/3D shape ID, symmetry,
  // nets, graphs, charts, reading scales) are deliberately left to authored items
  // rather than faked here. Compound keywords are ordered most-specific-first.
  // ──────────────────────────────────────────────────────────────────────────

  // ---- Number Sense ----
  if (name.includes('ordering number')) {
    const lo = name.includes('100 000') ? 1000 : 10, hi = name.includes('100 000') ? 99999 : 99;
    const set = new Set(); while (set.size < 4) set.add(rnd(lo, hi));
    const arr = [...set], sorted = [...arr].sort((a, b) => a - b);
    return short(`Arrange these from smallest to largest: ${arr.join(', ')}.`, sorted.join(', '),
      `Compare place values from the left: ${sorted.join(' < ')}.`, 'order/place-value', difficulty);
  }
  if (name.includes('estimating sum')) {
    const a = rnd(120, 880), b = rnd(120, 880), ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100;
    return short(`Estimate ${a} + ${b} by first rounding each number to the nearest hundred.`, ra + rb,
      `${a} ≈ ${ra}, ${b} ≈ ${rb}, so ${ra} + ${rb} = ${ra + rb}.`, 'estimate/round-first', difficulty);
  }
  if (name.includes('estimating product')) {
    const a = rnd(18, 92), b = rnd(18, 92), ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10;
    return short(`Estimate ${a} × ${b} by first rounding each number to the nearest ten.`, ra * rb,
      `${a} ≈ ${ra}, ${b} ≈ ${rb}, so ${ra} × ${rb} = ${ra * rb}.`, 'estimate/round-first', difficulty);
  }
  if (name.includes('reasonableness') || name.includes('estimation to check')) {
    const a = rnd(180, 820), b = rnd(180, 820), ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100;
    return short(`A pupil worked out ${a} + ${b} = ${a + b}. Estimate the sum (rounding each to the nearest hundred) to check this is reasonable.`,
      ra + rb, `${a} ≈ ${ra}, ${b} ≈ ${rb}; estimate ${ra} + ${rb} = ${ra + rb}, close to ${a + b}, so it is reasonable.`, 'estimate/check', difficulty);
  }
  if (name.includes('integer')) {
    const set = new Set(); while (set.size < 4) set.add(rnd(-20, 20));
    const arr = [...set], sorted = [...arr].sort((a, b) => a - b);
    return short(`Arrange these integers from least to greatest: ${arr.join(', ')}.`, sorted.join(', '),
      `On a number line, more-negative numbers are smaller: ${sorted.join(' < ')}.`, 'integer/negative-order', difficulty);
  }
  if (name.includes('negative number')) {
    const start = rnd(-5, 8), drop = rnd(6, 15);
    return short(`The temperature was ${start}°C. It then fell by ${drop}°C. What is the new temperature (°C)?`,
      start - drop, `${start} − ${drop} = ${start - drop}°C.`, 'integer/subtract-context', difficulty);
  }

  // ---- Operations (column methods) ----
  if (name.includes('add') && (name.includes('digit') || name.includes('regroup'))) {
    const noRegroup = name.includes('no regroup'), wide = name.includes('3') || name.includes('4');
    let a, b;
    if (noRegroup) {
      const a1 = rnd(1, 4), a0 = rnd(1, 4), b1 = rnd(1, 5 - a1), b0 = rnd(1, 5 - a0);
      a = a1 * 10 + a0; b = b1 * 10 + b0;
    } else if (wide) { a = rnd(200, 9999); b = rnd(200, 9999); }
    else { a = rnd(15, 89); b = rnd(15, 89); }
    return short(`${a} + ${b} = ?`, a + b,
      `Add the ones first, then the tens${wide ? ', hundreds and thousands' : ''}: ${a} + ${b} = ${a + b}.`,
      noRegroup ? 'add/column' : 'add/forgot-carry', difficulty);
  }
  if (name.includes('multiplying by 10')) {
    const n = rnd(2, 99), p = [10, 100, 1000][rnd(0, 2)];
    return short(`${n} × ${p} = ?`, n * p,
      `Multiplying by ${p} shifts the digits ${String(p).length - 1} place${p > 10 ? 's' : ''} left: ${n} × ${p} = ${n * p}.`, 'mult/place-shift', difficulty);
  }
  if (name.includes('multiplying') && name.includes('digit')) {
    const a = rnd(12, difficulty === 'hard' ? 999 : 99), b = rnd(2, 9);
    return short(`${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a * b}.`, 'mult/long', difficulty);
  }

  // ---- Fractions (figure-free) ----
  if (name.includes('unit fraction')) {
    const d = rnd(2, 8);
    const q = short(`A pizza is cut into ${d} equal slices. What fraction is one slice? (Give as a fraction.)`,
      `1/${d}`, `One of ${d} equal parts is 1/${d}.`, 'frac/unit', difficulty);
    q.diagramSpec = { type: 'fraction_bar', width: 640, height: 140, data: { parts: d, shaded: 1, labelMode: 'none' } };
    return q;
  }
  if (name.includes('numerator and denominator') || (name.includes('numerator') && name.includes('denominator'))) {
    const d = rnd(3, 9), n = rnd(1, d - 1);
    if (Math.random() < 0.5) {
      return short(`In the fraction ${n}/${d}, what is the numerator?`,
        n, `In ${n}/${d}, the numerator is the top number: ${n}.`, 'frac/num-den', difficulty);
    }
    return short(`In the fraction ${n}/${d}, what is the denominator?`,
      d, `In ${n}/${d}, the denominator is the bottom number: ${d}.`, 'frac/num-den', difficulty);
  }
  if (name.includes('parts of a whole') || name.includes('fraction of a whole') || name.includes('recognise fraction')) {
    const d = rnd(3, 8), n = rnd(1, d - 1);
    const q = short(`A bar is divided into ${d} equal parts and ${n} ${n === 1 ? 'is' : 'are'} shaded. What fraction is shaded? (Give as a fraction.)`,
      `${n}/${d}`, `${n} shaded out of ${d} equal parts = ${n}/${d}.`, 'frac/part-whole', difficulty);
    q.diagramSpec = { type: 'fraction_bar', width: 640, height: 140, data: { parts: d, shaded: n, labelMode: 'none' } };
    return q;
  }
  if (name.includes('fraction of a set') || name.includes('fraction of a quantity')) {
    const d = rnd(2, 6), per = rnd(2, 6), total = d * per, n = rnd(1, d - 1);
    return short(`There are ${total} sweets and ${n}/${d} of them are red. How many are red?`,
      n * per, `${total} ÷ ${d} = ${per}, then × ${n} = ${n * per}.`, 'frac/of-set', difficulty);
  }
  if (name.includes('comparing fraction') && name.includes('same denominator')) {
    const d = rnd(4, 9); let a = rnd(1, d - 1), b = rnd(1, d - 1); if (a === b) b = (b % (d - 1)) + 1;
    const bigger = Math.max(a, b);
    const q = short(`Which is greater: ${a}/${d} or ${b}/${d}? Write the greater fraction.`,
      `${bigger}/${d}`, `Same denominator — the larger numerator wins: ${bigger}/${d}.`, 'frac/compare-denom', difficulty);
    q.diagramSpec = { type: 'fraction_bar', width: 640, height: 140, data: { parts: d, shaded: bigger, labelMode: 'none' } };
    return q;
  }
  if (name.includes('comparing fraction') && name.includes('same numerator')) {
    const n = rnd(1, 4); let d1 = rnd(n + 1, 9), d2 = rnd(n + 1, 9); if (d1 === d2) d2 = d1 + 1;
    const smaller = Math.min(d1, d2);
    return short(`Which is greater: ${n}/${d1} or ${n}/${d2}? Write the greater fraction.`,
      `${n}/${smaller}`, `Same numerator — the smaller denominator gives bigger pieces: ${n}/${smaller}.`, 'frac/compare-numer', difficulty);
  }
  if (name.includes('comparing unlike')) {
    const d1 = rnd(2, 4), d2 = d1 * rnd(2, 3); let a = rnd(1, d1 - 1), b = rnd(1, d2 - 1);
    if (a * d2 === b * d1) b = Math.max(1, b - 1);
    const greater = a * d2 > b * d1 ? `${a}/${d1}` : `${b}/${d2}`;
    return short(`Which is greater: ${a}/${d1} or ${b}/${d2}? Write the greater fraction.`,
      greater, `Cross-multiply: ${a}×${d2} = ${a * d2} vs ${b}×${d1} = ${b * d1}. Greater is ${greater}.`, 'frac/compare-unlike', difficulty);
  }
  if (name.includes('ordering fraction')) {
    const d = rnd(5, 10), picks = shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 3);
    const sorted = [...picks].sort((a, b) => a - b);
    return short(`Arrange from smallest to largest: ${picks.map((n) => `${n}/${d}`).join(', ')}.`,
      sorted.map((n) => `${n}/${d}`).join(', '), `Same denominator — order by numerator: ${sorted.map((n) => `${n}/${d}`).join(' < ')}.`, 'frac/order-denom', difficulty);
  }
  if (name.includes('fraction by a whole')) {
    const d = rnd(3, 8), n = rnd(1, d - 1), w = rnd(2, 6);
    return short(`${n}/${d} × ${w} = ?  (give as a fraction over ${d})`,
      `${n * w}/${d}`, `Multiply the numerator by ${w}: ${n}×${w} = ${n * w}, keep /${d}.`, 'frac/mult-whole', difficulty);
  }
  if (name.includes('fraction by a fraction')) {
    const a = rnd(1, 4), b = rnd(a + 1, 6), c = rnd(1, 4), e = rnd(c + 1, 6);
    return short(`${a}/${b} × ${c}/${e} = ?  (give as a fraction; you need not simplify)`,
      `${a * c}/${b * e}`, `Multiply tops and bottoms: ${a}×${c} = ${a * c}, ${b}×${e} = ${b * e} → ${a * c}/${b * e}.`, 'frac/mult-frac', difficulty);
  }

  // ---- Decimals (figure-free) ----
  if (name.includes('decimals by 10') || (name.includes('decimal') && name.includes('100, 1000'))) {
    const whole = rnd(1, 99), dec = rnd(1, 9), val = whole + dec / 10, p = [10, 100][rnd(0, 1)], ans = Math.round(val * p);
    return short(`${val.toFixed(1)} × ${p} = ?`, ans,
      `Multiplying by ${p} moves the point ${String(p).length - 1} place${p > 10 ? 's' : ''} right: ${val.toFixed(1)} × ${p} = ${ans}.`, 'decimal/place-shift', difficulty);
  }
  if (name.includes('multiplying a decimal by a whole')) {
    const whole = rnd(1, 20), dec = rnd(1, 9), val = whole + dec / 10, w = rnd(2, 9), ans = Math.round(val * w * 10) / 10;
    return short(`${val.toFixed(1)} × ${w} = ?`, ans.toFixed(1),
      `${val.toFixed(1)} × ${w} = ${ans.toFixed(1)} (keep one decimal place).`, 'decimal/mult-whole', difficulty);
  }
  if (name.includes('decimal by a decimal')) {
    const a = rnd(2, 9), b = rnd(2, 9), ans = (a * b) / 100;
    return short(`0.${a} × 0.${b} = ?`, ans.toFixed(2),
      `${a} × ${b} = ${a * b}; two decimal places → ${ans.toFixed(2)}.`, 'decimal/mult-place', difficulty);
  }
  if (name.includes('dividing a decimal by a whole')) {
    const w = rnd(2, 9), q = rnd(11, 99), val = (w * q) / 10;
    return short(`${val.toFixed(1)} ÷ ${w} = ?`, (q / 10).toFixed(1),
      `${val.toFixed(1)} ÷ ${w} = ${(q / 10).toFixed(1)}.`, 'decimal/div-whole', difficulty);
  }
  if (name.includes('dividing by a decimal')) {
    const dt = rnd(2, 9), q = rnd(2, 12), dividend = (dt * q) / 10;
    return short(`${dividend.toFixed(1)} ÷ 0.${dt} = ?`, q,
      `0.${dt} = ${dt}/10, so ${dividend.toFixed(1)} ÷ 0.${dt} = ${dividend.toFixed(1)} × 10 ÷ ${dt} = ${q}.`, 'decimal/div-by-decimal', difficulty);
  }
  if (name.includes('decimals to fraction')) {
    const opts = [['0.5', '1/2'], ['0.25', '1/4'], ['0.75', '3/4'], ['0.2', '1/5'], ['0.1', '1/10'], ['0.4', '2/5'], ['0.05', '1/20']];
    const [d, f] = opts[rnd(0, opts.length - 1)];
    return short(`Write ${d} as a fraction in its lowest terms.`, f, `${d} = ${f}.`, 'decimal/to-fraction', difficulty);
  }
  if (name.includes('fractions to decimal')) {
    const opts = [['1/2', '0.5'], ['1/4', '0.25'], ['3/4', '0.75'], ['1/5', '0.2'], ['1/10', '0.1'], ['2/5', '0.4'], ['3/5', '0.6']];
    const [f, d] = opts[rnd(0, opts.length - 1)];
    return short(`Write ${f} as a decimal.`, d, `${f} = ${d}.`, 'decimal/from-fraction', difficulty);
  }
  if (name.includes('comparing decimal')) {
    let a = rnd(1, 99) / 10, b = rnd(1, 99) / 10; if (a === b) b += 0.1;
    return short(`Which is greater: ${a.toFixed(1)} or ${b.toFixed(1)}? Write the greater number.`,
      Math.max(a, b).toFixed(1), `Compare the whole-number parts first, then the tenths: ${Math.max(a, b).toFixed(1)} is greater.`, 'decimal/compare-length', difficulty);
  }
  if (name.includes('ordering decimal')) {
    const set = new Set(); while (set.size < 4) set.add((rnd(10, 99) / 10).toFixed(1));
    const arr = [...set].map(Number), sorted = [...arr].sort((a, b) => a - b);
    return short(`Arrange from smallest to largest: ${arr.map((x) => x.toFixed(1)).join(', ')}.`,
      sorted.map((x) => x.toFixed(1)).join(', '), `Compare the tenths: ${sorted.map((x) => x.toFixed(1)).join(' < ')}.`, 'decimal/order', difficulty);
  }
  if (name.includes('measurement conversions with decimal')) {
    const totalCm = rnd(1, 9) * 100 + rnd(1, 9) * 10;
    return short(`Write ${totalCm} cm in metres.`, (totalCm / 100).toFixed(2),
      `100 cm = 1 m, so ${totalCm} cm = ${(totalCm / 100).toFixed(2)} m.`, 'measure/decimal-convert', difficulty);
  }

  // ---- Measurement (figure-free) ----
  if (name.includes('unit conversion')) {
    const pick = rnd(0, 2);
    if (pick === 0) { const km = rnd(1, 9), m = rnd(1, 9) * 100; return short(`Convert ${km} km ${m} m into metres.`, km * 1000 + m, `1 km = 1000 m, so ${km} km ${m} m = ${km * 1000 + m} m.`, 'measure/convert', difficulty); }
    if (pick === 1) { const kg = rnd(1, 9), g = rnd(1, 9) * 100; return short(`Convert ${kg} kg ${g} g into grams.`, kg * 1000 + g, `1 kg = 1000 g, so ${kg} kg ${g} g = ${kg * 1000 + g} g.`, 'measure/convert', difficulty); }
    const L = rnd(1, 9), ml = rnd(1, 9) * 100; return short(`Convert ${L} L ${ml} ml into millilitres.`, L * 1000 + ml, `1 L = 1000 ml, so ${L} L ${ml} ml = ${L * 1000 + ml} ml.`, 'measure/convert', difficulty);
  }
  if (name.includes('length') && name.includes('unit')) {
    const m = rnd(2, 9), cm = rnd(1, 9) * 10;
    return short(`A rope is ${m} m ${cm} cm long. How long is it in centimetres?`, m * 100 + cm,
      `1 m = 100 cm, so ${m} m ${cm} cm = ${m * 100 + cm} cm.`, 'measure/length', difficulty);
  }
  if (name.includes('mass')) {
    const kg = rnd(2, 9), g = rnd(1, 9) * 100;
    return short(`A bag has a mass of ${kg} kg ${g} g. What is its mass in grams?`, kg * 1000 + g,
      `1 kg = 1000 g, so ${kg} kg ${g} g = ${kg * 1000 + g} g.`, 'measure/mass', difficulty);
  }
  if (name.includes('capacity')) {
    const L = rnd(2, 9), ml = rnd(1, 9) * 100;
    return short(`A jug holds ${L} L ${ml} ml of water. What is this in millilitres?`, L * 1000 + ml,
      `1 L = 1000 ml, so ${L} L ${ml} ml = ${L * 1000 + ml} ml.`, 'measure/capacity', difficulty);
  }
  if (name.includes('24-hour') || name.includes('telling time')) {
    const h = rnd(1, 11), m = [0, 15, 30, 45][rnd(0, 3)], mm = String(m).padStart(2, '0');
    return short(`Write ${h}.${mm} p.m. in 24-hour time (4 digits).`, `${h + 12}${mm}`,
      `For p.m., add 12 to the hour: ${h} + 12 = ${h + 12}, giving ${h + 12}${mm}.`, 'time/24hr', difficulty);
  }
  if (name.includes('comparing and converting')) {
    const m = rnd(1, 5), cm = rnd(1, 9) * 10, aTotal = m * 100 + cm; let bTotal = rnd(120, 580);
    if (bTotal === aTotal) bTotal += 10;
    return short(`Which is longer: ${m} m ${cm} cm or ${bTotal} cm? Write the longer length in centimetres.`,
      Math.max(aTotal, bTotal), `${m} m ${cm} cm = ${aTotal} cm. The longer length is ${Math.max(aTotal, bTotal)} cm.`, 'measure/compare-mixed-units', difficulty);
  }
  if (name.includes('perimeter') && name.includes('measurement')) {
    const l = rnd(4, 20), w = rnd(3, 18);
    return short(`A rectangular garden is ${l} m long and ${w} m wide. A fence runs all the way round it. What length of fence is needed (m)?`,
      2 * (l + w), `Perimeter = 2 × (${l} + ${w}) = ${2 * (l + w)} m.`, 'measure/perimeter-context', difficulty);
  }
  if (name.includes('area') && name.includes('measurement')) {
    const l = rnd(3, 20), w = rnd(2, 15);
    return short(`A rectangular field is ${l} m by ${w} m. What is its area (m²)?`, l * w,
      `Area = ${l} × ${w} = ${l * w} m².`, 'measure/area-context', difficulty);
  }
  if (name.includes('money')) {
    const each = Math.round((rnd(2, 9) + rnd(1, 19) * 0.05) * 100) / 100, change = Math.round((20 - each) * 100) / 100;
    return short(`A toy costs $${each.toFixed(2)}. You pay with a $20 note. How much change do you get?`,
      change.toFixed(2), `$20.00 − $${each.toFixed(2)} = $${change.toFixed(2)}.`, 'money/change', difficulty);
  }

  // ---- Percentage (figure-free) ----
  if (name.includes('discount')) {
    const orig = rnd(2, 9) * 10, pct = [10, 15, 20, 25, 30][rnd(0, 4)], pay = orig - orig * pct / 100;
    return short(`A bag costs $${orig}. It is sold at a ${pct}% discount. What is the selling price?`,
      pay, `Discount = ${pct}% × $${orig} = $${orig * pct / 100}. Price = $${orig} − $${orig * pct / 100} = $${pay}.`, 'percent/discount', difficulty);
  }
  if (name.includes('gst') || name.includes('tax')) {
    const before = rnd(2, 9) * 100, pct = [7, 8, 9][rnd(0, 2)], after = before + before * pct / 100;
    return short(`A meal costs $${before} before ${pct}% GST. What is the total bill after GST?`,
      after, `GST = ${pct}% × $${before} = $${before * pct / 100}. Total = $${before} + $${before * pct / 100} = $${after}.`, 'percent/gst', difficulty);
  }
  if (name.includes('interest')) {
    const p = rnd(2, 9) * 1000, rate = [1, 2, 3, 5][rnd(0, 3)], yrs = rnd(1, 3), interest = p * rate / 100 * yrs;
    return short(`$${p} is saved at ${rate}% simple interest per year. How much interest is earned in ${yrs} year${yrs > 1 ? 's' : ''}?`,
      interest, `Interest per year = ${rate}% × $${p} = $${p * rate / 100}. Over ${yrs} year${yrs > 1 ? 's' : ''}: $${interest}.`, 'percent/interest', difficulty);
  }

  // ---- Ratio & Rate ----
  if (name.includes('proportion')) {
    const perUnit = rnd(2, 9), units = rnd(2, 8), q = rnd(2, 9);
    return short(`${units} identical books cost $${perUnit * units}. How much do ${q} of the same books cost?`,
      perUnit * q, `1 book = $${perUnit * units} ÷ ${units} = $${perUnit}. ${q} books = ${q} × $${perUnit} = $${perUnit * q}.`, 'proportion/unitary', difficulty);
  }

  // ---- Algebra (figure-free) ----
  if (name.includes('missing number') || name.includes('unknowns in arithmetic')) {
    const a = rnd(2, 9), c = rnd(a + 2, a + 20);
    return short(`Find the missing number: ${a} + ___ = ${c}.`, c - a, `${c} − ${a} = ${c - a}.`, 'algebra/missing-number', difficulty);
  }
  if (name.includes('letter for an unknown')) {
    const known = rnd(2, 9), total = rnd(known + 2, known + 15);
    return short(`Sam has x apples. He gets ${known} more and now has ${total}. What is x?`,
      total - known, `x + ${known} = ${total}, so x = ${total} − ${known} = ${total - known}.`, 'algebra/letter', difficulty);
  }
  if (name.includes('algebraic notation')) {
    const k = rnd(2, 9);
    return mcq(`How do we write "${k} multiplied by n" in algebra?`, `${k}n`, [`n${k}`, `${k}+n`, `${k}-n`],
      `${k} × n is written ${k}n.`, 'algebra/notation', difficulty);
  }
  if (name.includes('forming expression')) {
    const k = rnd(2, 9);
    return mcq(`Mei has ${k} more stickers than Raj, who has p stickers. Which expression shows how many Mei has?`,
      `p + ${k}`, [`p − ${k}`, `${k}p`, `p × ${k}`], `"${k} more than p" means add: p + ${k}.`, 'algebra/form-expression', difficulty);
  }
  if (name.includes('substitution')) {
    const a = rnd(2, 6), b = rnd(1, 9), x = rnd(2, 9);
    return short(`If x = ${x}, find the value of ${a}x + ${b}.`, a * x + b,
      `${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}.`, 'algebra/substitute', difficulty);
  }
  if (name.includes('one-step') && name.includes('equation')) {
    const x = rnd(2, 12), a = rnd(2, 9);
    return short(`Solve for x: ${a}x = ${a * x}.`, x, `x = ${a * x} ÷ ${a} = ${x}.`, 'algebra/one-step', difficulty);
  }
  if (name.includes('two-step') && name.includes('equation')) {
    const x = rnd(2, 9), a = rnd(2, 6), b = rnd(1, 12), c = a * x + b;
    return short(`Solve for x: ${a}x + ${b} = ${c}.`, x,
      `${a}x = ${c} − ${b} = ${c - b}; x = ${c - b} ÷ ${a} = ${x}.`, 'algebra/two-step', difficulty);
  }
  if (name.includes('forming and solving')) {
    const x = rnd(3, 12), a = rnd(2, 5), b = rnd(2, 9), total = a * x + b;
    return short(`There are ${a} equal boxes of pencils plus ${b} loose pencils — ${total} pencils in all. Let x be the number per box. Form an equation and find x.`,
      x, `${a}x + ${b} = ${total} → ${a}x = ${total - b} → x = ${x}.`, 'algebra/form-solve', difficulty);
  }

  // ---- Geometry (numeric angle/area work only; shape ID, symmetry, nets, views
  //      need a figure and are left to authored items) ----
  if (name.includes('angles on a line')) {
    if (Math.random() < 0.5) {
      const a = rnd(20, 150);
      return short(`Two angles sit on a straight line. One is ${a}°. Find the other angle.`,
        180 - a, `Angles on a straight line add to 180°: 180 − ${a} = ${180 - a}°.`, 'geo/angles-line', difficulty);
    }
    const a = rnd(40, 150), b = rnd(40, 300 - a);
    return short(`Three angles meet at a point. Two of them are ${a}° and ${b}°. Find the third angle.`,
      360 - a - b, `Angles at a point add to 360°: 360 − ${a} − ${b} = ${360 - a - b}°.`, 'geo/angles-point', difficulty);
  }
  if (name.includes('angles in special')) {
    const a = rnd(50, 130);
    return short(`In a parallelogram, one angle is ${a}°. Find the angle next to it (co-interior).`,
      180 - a, `Co-interior angles in a parallelogram add to 180°: 180 − ${a} = ${180 - a}°.`, 'geo/quad-angles', difficulty);
  }
  if (name.includes('composite figure')) {
    const a = rnd(6, 12), b = rnd(5, 10), c = rnd(2, a - 1), d = rnd(2, b - 1);
    return short(`An L-shaped figure is a ${a} cm by ${b} cm rectangle with a ${c} cm by ${d} cm rectangle cut from one corner. Find its area (cm²).`,
      a * b - c * d, `Area = ${a}×${b} − ${c}×${d} = ${a * b} − ${c * d} = ${a * b - c * d} cm².`, 'geo/composite-area', difficulty);
  }

  // ---- Diagram-backed skills (visual stimulus generated via diagramSpec) --------
  if (name.includes('identifying 2d shape')) {
    const all = ['square', 'rectangle', 'triangle', 'circle', 'oval', 'semi-circle', 'rhombus', 'trapezium'];
    const pool = difficulty === 'easy' ? all.slice(0, 4) : difficulty === 'medium' ? all.slice(0, 6) : all;
    const display = shuffle(pool).slice(0, Math.min(pool.length, 5));
    const askIdx = rnd(0, display.length - 1);
    const answer = display[askIdx].replace(/-/g, ' ');
    const distractors = shuffle(all.filter((s) => s !== display[askIdx])).slice(0, 3).map((s) => s.replace(/-/g, ' '));
    const q = mcq(`Look at the shapes. What is the name of Shape ${askIdx + 1}?`, answer, distractors,
      `Shape ${askIdx + 1} is a ${answer}.`, 'geo/shape-identify', difficulty);
    q.diagramSpec = { type: 'shape_library', width: 640, height: 200, data: { shapes: display.map((type, i) => ({ type, label: `Shape ${i + 1}` })) } };
    return q;
  }
  if (name.includes('properties of 2d shape')) {
    const shapes = [
      { type: 'triangle', sides: 3, vertices: 3 },
      { type: 'square', sides: 4, vertices: 4 },
      { type: 'rectangle', sides: 4, vertices: 4 },
      { type: 'circle', sides: 0, vertices: 0 },
    ];
    if (difficulty !== 'easy') shapes.push({ type: 'rhombus', sides: 4, vertices: 4 }, { type: 'trapezium', sides: 4, vertices: 4 });
    const pick = shapes[rnd(0, shapes.length - 1)];
    const label = pick.type.replace(/-/g, ' ');
    const askSides = Math.random() < 0.5;
    const ans = askSides ? pick.sides : pick.vertices;
    const prop = askSides ? 'sides' : 'vertices (corners)';
    const q = mcq(`The shape shown is a ${label}. How many ${prop} does it have?`, ans, [ans + 1, Math.max(0, ans - 1), ans + 2],
      `A ${label} has ${pick.sides} side${pick.sides !== 1 ? 's' : ''} and ${pick.vertices} ${pick.vertices !== 1 ? 'vertices' : 'vertex'}.`, 'geo/shape-properties', difficulty);
    q.diagramSpec = { type: 'shape_library', width: 640, height: 200, data: { shapes: [{ type: pick.type, label }] } };
    return q;
  }
  if (name.includes('types of quadrilateral')) {
    const quads = [
      { type: 'square', label: 'square', desc: '4 equal sides and 4 right angles' },
      { type: 'rectangle', label: 'rectangle', desc: '2 pairs of equal sides and 4 right angles' },
      { type: 'rhombus', label: 'rhombus', desc: '4 equal sides but not all right angles' },
      { type: 'trapezium', label: 'trapezium', desc: 'exactly 1 pair of parallel sides' },
    ];
    const display = shuffle(quads);
    const askIdx = rnd(0, display.length - 1);
    const target = display[askIdx];
    const others = quads.filter((qd) => qd.label !== target.label).map((qd) => qd.label);
    const q = mcq(`Look at the shapes. What type of quadrilateral is Shape ${askIdx + 1}?`, target.label, others,
      `Shape ${askIdx + 1} is a ${target.label} — it has ${target.desc}.`, 'geo/quad-identify', difficulty);
    q.diagramSpec = { type: 'shape_library', width: 640, height: 200, data: { shapes: display.map((s, i) => ({ type: s.type, label: `Shape ${i + 1}` })) } };
    return q;
  }
  if (name.includes('picture graph')) {
    const items = ['Apples', 'Oranges', 'Bananas', 'Grapes', 'Mangoes', 'Pears'];
    const cats = shuffle(items).slice(0, 4);
    const sv = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 5;
    const counts = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4).map((v) => v * sv);
    const askIdx = rnd(0, cats.length - 1);
    const maxIdx = counts.indexOf(Math.max(...counts));
    let q;
    if (Math.random() < 0.6) {
      q = short(`The picture graph shows fruits sold. How many ${cats[askIdx].toLowerCase()} were sold?` + (sv > 1 ? ` (Each symbol = ${sv})` : ''),
        counts[askIdx], sv === 1 ? `Count the symbols for ${cats[askIdx]}: ${counts[askIdx]}.` : `${cats[askIdx]} has ${counts[askIdx] / sv} symbols × ${sv} = ${counts[askIdx]}.`,
        'data/picture-graph-read', difficulty);
    } else {
      const others = cats.filter((_, i) => i !== maxIdx);
      q = mcq(`The picture graph shows fruits sold. Which fruit was sold the most?` + (sv > 1 ? ` (Each symbol = ${sv})` : ''),
        cats[maxIdx], others, `${cats[maxIdx]} has the most symbols (${counts[maxIdx] / sv}), representing ${counts[maxIdx]}.`,
        'data/picture-graph-compare', difficulty);
    }
    q.diagramSpec = { type: 'picture_graph', width: 640, height: 280, data: { categories: cats.map((label, i) => ({ label, count: counts[i] })), symbol: '●', symbolValue: sv } };
    return q;
  }
  if (name.includes('reading measuring scale')) {
    const scaleEnd = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
    const objLen = rnd(2, Math.floor(scaleEnd * 0.6));
    const objStart = rnd(0, scaleEnd - objLen);
    const q = short(`A pencil is placed on the ruler. It starts at the ${objStart} cm mark. How long is the pencil (cm)?`, objLen,
      `The pencil goes from ${objStart} cm to ${objStart + objLen} cm. Length = ${objStart + objLen} − ${objStart} = ${objLen} cm.`, 'measure/read-scale', difficulty);
    q.diagramSpec = { type: 'length_measurement', width: 640, height: 180, data: { start: 0, end: scaleEnd, unit: 'cm', objects: [{ start: objStart, end: objStart + objLen, label: '?' }] } };
    return q;
  }

  // No rule-based template fits this skill — return null so the seed skips it
  // (the skill relies on authored/exam-sourced items instead of a wrong stub).
  return null;
}

// True when there is a rule-based template for this skill (i.e. the generator
// can produce real questions, not a wrong fallback). Branch selection in
// buildOne depends only on the skill name, so one probe is conclusive.
export function isGeneratable(skillName) {
  return buildOne(skillName, 'easy') !== null;
}

// Generate `perDifficulty` questions at each difficulty for a skill. Returns []
// for skills with no template (so callers leave them to authored items).
export function generateQuestionsForSkill(skillName, perDifficulty = 4) {
  if (!isGeneratable(skillName)) return [];
  const out = [];
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const seen = new Set();
    let guard = 0;
    while (out.filter((q) => q.difficulty === difficulty).length < perDifficulty && guard < perDifficulty * 8) {
      guard++;
      const q = buildOne(skillName, difficulty);
      if (seen.has(q.stem)) continue;       // avoid duplicate stems in one skill
      seen.add(q.stem);
      out.push(q);
    }
  }
  if (skillName.toLowerCase().includes('adding unlike')) {
    const i = out.findIndex((q) => q.stem === addingUnlikeFractionsSample.stem);
    if (i > 0) {
      const [sample] = out.splice(i, 1);
      out.unshift(sample);
    }
  }
  return out;
}
