// Rule-based Math question generation for the Phase-2 shared question bank.
// MVP: deterministic templates keyed by skill-name keywords, with a numeric
// fallback. No AI. Each question is a plain object (no DB) shaped for models/Question.js.
//
// Scope: Math only. English = Spelling (no Reading/Comprehension/Writing) and
// Science come later via their own templates.

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

// Build an MCQ from a numeric answer + plausible distractors.
function mcq(stem, answer, distractors, workedSolution, misconceptionTag, difficulty) {
  const choices = shuffle([String(answer), ...distractors.map(String)]);
  return { type: 'mcq', stem, choices, answer: String(answer), workedSolution, misconceptionTag, difficulty };
}
function short(stem, answer, workedSolution, misconceptionTag, difficulty) {
  return { type: 'short_answer', stem, choices: [], answer: String(answer), workedSolution, misconceptionTag, difficulty };
}

// One question for a given skill keyword + difficulty.
function buildOne(skillName, difficulty) {
  const name = skillName.toLowerCase();
  const big = difficulty === 'hard' ? 90 : difficulty === 'medium' ? 40 : 12;

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
  if (name.includes('perimeter')) {
    const l = rnd(3, big), w = rnd(2, big);
    return short(`A rectangle is ${l} cm by ${w} cm. What is its perimeter (cm)?`, 2 * (l + w),
      `Perimeter = 2 × (length + width) = 2 × (${l} + ${w}) = ${2 * (l + w)} cm.`, 'geo/perimeter-vs-area', difficulty);
  }
  if (name.includes('area')) {
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
  if (name.includes('model drawing') || name.includes('word problem') || name.includes('multi-step')) {
    const each = rnd(3, 12), groups = rnd(3, 9), extra = rnd(2, 20);
    return short(`A box holds ${each} pencils. There are ${groups} boxes and ${extra} loose pencils. How many pencils altogether?`,
      each * groups + extra, `${groups} × ${each} = ${each * groups}, then + ${extra} = ${each * groups + extra}.`, 'wordproblem/operation-choice', difficulty);
  }
  // Generic numeric fallback (still tagged to the skill via the DB ref).
  const a = rnd(2, big), b = rnd(2, big);
  return mcq(`${a} + ${b} = ?`, a + b, [a + b + 1, a + b - 2, a + b + 10], `${a} + ${b} = ${a + b}.`, 'arithmetic', difficulty);
}

// Generate `perDifficulty` questions at each difficulty for a skill.
export function generateQuestionsForSkill(skillName, perDifficulty = 4) {
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
