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

  // ── Foundational counting & number facts (so the earliest recommended skills
  //     are actually practiceable) ──
  if (name.includes('counting') || name.includes('skip count')) {
    if (name.includes('skip')) {
      const k = [2, 5, 10][rnd(0, 2)], a = k * rnd(1, 9);
      return short(`Skip count by ${k}: ${a}, ${a + k}, ___`, a + 2 * k, `Add ${k} each time: ${a + k} + ${k} = ${a + 2 * k}.`, 'count/lose-step', difficulty);
    }
    const cap = name.includes('1000') ? 999 : name.includes('100') ? 99 : 19;
    const n = rnd(5, cap);
    return short(`What number comes after ${n}?`, n + 1, `${n} + 1 = ${n + 1}.`, 'count/next', difficulty);
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
    return short(`Fill in: ${n}/${d} = ?/${d * k}`, n * k, `Multiply top and bottom by ${k}: ${n}×${k}=${n * k}, ${d}×${k}=${d * k}.`, 'frac/scale-one-part', difficulty);
  }
  if (name.includes('simplif')) {
    const k = rnd(2, 5), n = rnd(1, 4), d = rnd(n + 1, 6);
    const num = n * k, den = d * k, g = gcd(num, den);
    return short(`Simplify ${num}/${den} to its lowest terms.`, `${num / g}/${den / g}`,
      `Divide top and bottom by ${g}: ${num}/${den} = ${num / g}/${den / g}.`, 'frac/incomplete-simplify', difficulty);
  }
  if (name.includes('adding like') || (name.includes('adding') && name.includes('like') && !name.includes('unlike'))) {
    const d = rnd(4, 10), a = rnd(1, d - 2), b = rnd(1, d - a - 1);
    return short(`${a}/${d} + ${b}/${d} = ?  (give your answer as a fraction)`, `${a + b}/${d}`,
      `Same denominator: add the tops. ${a}+${b}=${a + b}, keep /${d}.`, 'frac/add-denominators', difficulty);
  }
  if (name.includes('adding unlike') || (name.includes('add') && name.includes('unlike'))) {
    const d1 = rnd(2, 4), d2 = d1 * rnd(2, 3), a = rnd(1, d1 - 1), b = rnd(1, d2 - 1);
    const num = a * (d2 / d1) + b;
    return short(`${a}/${d1} + ${b}/${d2} = ?  (over ${d2})`, `${num}/${d2}`,
      `Make denominators equal (${d2}): ${a}/${d1} = ${a * (d2 / d1)}/${d2}, then add ${b}/${d2} → ${num}/${d2}.`, 'frac/add-denominators', difficulty);
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
    return short(`In a group of ${total} marbles, ${part} are red. What fraction of the marbles are red? (Give your answer in lowest terms.)`,
      `${part / g}/${total / g}`, `${part} out of ${total} = ${part}/${total} = ${part / g}/${total / g}.`, 'frac/of-set', difficulty);
  }
  if (name.includes('number line')) {
    const start = rnd(1, 8), parts = [4, 5, 8, 10][rnd(0, 3)], n = rnd(1, parts - 1);
    const val = Number((start + n / parts).toFixed(3)), per = Number((n / parts).toFixed(3));
    return short(`On a number line, the distance from ${start} to ${start + 1} is split into ${parts} equal parts. What value is ${n} part${n > 1 ? 's' : ''} to the right of ${start}?`,
      val, `Each part = 1 ÷ ${parts} = ${Number((1 / parts).toFixed(3))}. ${n} parts = ${per}, so ${start} + ${per} = ${val}.`, 'decimal/number-line', difficulty);
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
  return out;
}
