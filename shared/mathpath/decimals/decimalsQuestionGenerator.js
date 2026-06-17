import { getSkill } from './decimalsSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './decimalsQuestionFamilies.js';

// Rule-based Decimals question generator. Deterministic: the same
// (skillId, questionFamilyId, variant) always yields the same question, so
// diagnostics/practice can reproduce an item and fluency drills can vary it by
// bumping `variant`. All decimal arithmetic is done on scaled integers to avoid
// binary-float noise (0.1 + 0.2 !== 0.3), then formatted back to exact strings.

// ── Seeded RNG (mulberry32 over a string hash) ──────────────────────────────
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seedStr) {
  let a = hashSeed(seedStr);
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rint(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick(rng, arr) {
  return arr[rint(rng, 0, arr.length - 1)];
}

// ── Decimal helpers (scaled-integer arithmetic) ─────────────────────────────
function round(value, dp) {
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON) * f) / f;
}

// Minimal exact string for a value known to have at most `dp` places.
function decStr(value, dp) {
  if (!Number.isFinite(value)) return String(value);
  let s = value.toFixed(dp);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

// Like decStr but keeps exactly `dp` decimal places (no trailing-zero
// stripping) — so "round to 1 d.p." shows 6.0, not 6, and a decimal factor
// never collapses to a whole number in the prompt.
function decFixed(value, dp) {
  return Number.isFinite(value) ? value.toFixed(dp) : String(value);
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

function placeName(dp) {
  return { 1: 'tenths', 2: 'hundredths', 3: 'thousandths' }[dp] || `place ${dp}`;
}

// ── Question assembly helpers ───────────────────────────────────────────────
function shortAnswer({ family, prompt, answer, display, solutionSteps, misconceptionTag, difficulty, mode }) {
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'short_answer',
    prompt,
    choices: [],
    answer: { display: display ?? String(answer), value: answer },
    acceptedAnswers: [display ?? String(answer)],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
  };
}

function mcq({ family, prompt, answerDisplay, distractors, solutionSteps, misconceptionTag, difficulty, mode, rng }) {
  const seen = new Set([answerDisplay]);
  const opts = [];
  for (const d of distractors.map(String)) {
    if (!seen.has(d)) { seen.add(d); opts.push(d); }
  }
  const choices = [answerDisplay, ...opts.slice(0, 3)];
  // deterministic shuffle
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
  };
}

// ── Per-kind generators ─────────────────────────────────────────────────────
const GENERATORS = {
  decimalPlaceValue(rng, family, difficulty, mode) {
    const dp = pick(rng, [2, 3]);
    const whole = rint(rng, 1, 9);
    const digits = Array.from({ length: dp }, () => rint(rng, 1, 9));
    const display = `${whole}.${digits.join('')}`;
    const targetIdx = rint(rng, 0, dp - 1);
    const answerDigit = digits[targetIdx];
    const tag = family.misconceptionTags[0] || 'dec/place-confuse';
    return shortAnswer({
      family,
      prompt: `In ${display}, which digit is in the ${placeName(targetIdx + 1)} place?`,
      answer: answerDigit,
      display: String(answerDigit),
      solutionSteps: [
        `Count places after the point: tenths, hundredths, thousandths.`,
        `The ${placeName(targetIdx + 1)} digit of ${display} is ${answerDigit}.`,
      ],
      misconceptionTag: tag,
      difficulty,
      mode,
    });
  },

  decimalNumberLine(rng, family, difficulty, mode) {
    const a = rint(rng, 0, 8);
    const k = rint(rng, 1, 9);
    const value = round(a + k / 10, 1);
    return shortAnswer({
      family,
      prompt: `A number line from ${a} to ${a + 1} is split into 10 equal parts. What value is at mark ${k}?`,
      answer: value,
      display: decStr(value, 1),
      solutionSteps: [
        `Each interval is 1 ÷ 10 = 0.1.`,
        `Mark ${k} is ${a} + ${k} × 0.1 = ${decStr(value, 1)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/nl-interval',
      difficulty,
      mode,
    });
  },

  decimalCompare(rng, family, difficulty, mode) {
    // Build a pair that trips the "more digits = bigger" misconception.
    const whole = rint(rng, 0, 4);
    const aTenth = rint(rng, 1, 8);
    const x = round(whole + aTenth / 10, 1); // e.g. 0.5
    const yHund = rint(rng, 1, 9);
    const y = round(whole + (aTenth - 1) / 10 + yHund / 100, 2); // e.g. 0.4d (more digits, smaller)
    const xs = decStr(x, 1);
    const ys = decStr(y, 2);
    const larger = x >= y ? xs : ys;
    return mcq({
      family,
      rng,
      prompt: `Which is larger: ${xs} or ${ys}?`,
      answerDisplay: larger,
      distractors: [larger === xs ? ys : xs],
      solutionSteps: [
        `Line up the decimal points and compare place by place.`,
        `${xs} has ${aTenth} tenths; ${ys} has ${aTenth - 1} tenths, so ${larger} is larger.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/longer-decimal',
      difficulty,
      mode,
    });
  },

  decimalOrder(rng, family, difficulty, mode) {
    const count = 4;
    const set = [];
    const seen = new Set();
    while (set.length < count) {
      const dp = pick(rng, [1, 2]);
      const v = round(rint(rng, 1, 9) / (dp === 1 ? 10 : 100) + rint(rng, 0, 3), 2);
      const s = decStr(v, 2);
      if (!seen.has(s)) { seen.add(s); set.push(v); }
    }
    const ascending = !family.name.toLowerCase().includes('decreasing');
    const sorted = [...set].sort((p, q) => (ascending ? p - q : q - p));
    const display = sorted.map((v) => decStr(v, 2)).join(', ');
    return shortAnswer({
      family,
      prompt: `Arrange in ${ascending ? 'increasing' : 'decreasing'} order: ${set.map((v) => decStr(v, 2)).join(', ')}`,
      answer: display,
      display,
      solutionSteps: [
        `Align decimal points and compare place by place.`,
        `${ascending ? 'Smallest to largest' : 'Largest to smallest'}: ${display}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/align-right',
      difficulty,
      mode,
    });
  },

  decimalRound(rng, family, difficulty, mode) {
    const toWhole = family.name.toLowerCase().includes('whole') && rng() < 0.5;
    const dp = toWhole ? 0 : 1;
    const value = round(rint(rng, 10, 99) / 10 + rint(rng, 1, 9) / 100, 2);
    const rounded = round(value, dp);
    return shortAnswer({
      family,
      prompt: `Round ${decFixed(value, 2)} to ${dp === 0 ? 'the nearest whole number' : '1 decimal place'}.`,
      answer: rounded,
      display: decFixed(rounded, dp),
      solutionSteps: [
        `Look at the digit one place to the right of the ${dp === 0 ? 'ones' : 'tenths'}.`,
        `That digit decides whether to round up; ${decFixed(value, 2)} → ${decFixed(rounded, dp)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/truncate',
      difficulty,
      mode,
    });
  },

  decimalAddSub(rng, family, difficulty, mode) {
    const isAdd = family.name.toLowerCase().includes('add');
    const dp = pick(rng, [1, 2]);
    const f = 10 ** dp;
    let xi = rint(rng, 11, 99) * (dp === 1 ? 1 : 1);
    let yi = rint(rng, 11, 99);
    // ensure non-negative subtraction
    if (!isAdd && yi > xi) [xi, yi] = [yi, xi];
    const x = round(xi / f, dp);
    const y = round(yi / f, dp);
    const resultInt = isAdd ? xi + yi : xi - yi;
    const result = round(resultInt / f, dp);
    return shortAnswer({
      family,
      prompt: `${decStr(x, dp)} ${isAdd ? '+' : '−'} ${decStr(y, dp)} = ?`,
      answer: result,
      display: decStr(result, dp),
      solutionSteps: [
        `Stack the numbers with the decimal points aligned.`,
        `${isAdd ? 'Add' : 'Subtract'} as whole numbers, then bring the point straight down: ${decStr(result, dp)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/add-misalign',
      difficulty,
      mode,
    });
  },

  decimalScaleByTen(rng, family, difficulty, mode) {
    const isMult = family.name.toLowerCase().includes('multiply');
    // Keep every answer within the P5/P6 ceiling of thousandths (≤ 3 d.p.).
    // For division, the quotient gains log10(p) decimal places, so pick the
    // operand's d.p. and divisor so that dp + log10(p) ≤ 3.
    let p, dp;
    if (isMult) {
      p = pick(rng, [10, 100, 1000]);
      dp = pick(rng, [2, 3]);
    } else {
      const shift = pick(rng, [1, 2]);          // ÷10 or ÷100
      p = 10 ** shift;
      dp = pick(rng, shift === 1 ? [0, 1, 2] : [0, 1]); // dp + shift ≤ 3
    }
    const x = round(rint(rng, 11, 999) / 10 ** dp, dp);
    const resDp = isMult ? Math.max(0, dp - (String(p).length - 1)) : dp + (String(p).length - 1);
    const result = round(isMult ? x * p : x / p, resDp);
    return shortAnswer({
      family,
      prompt: `${decFixed(x, dp)} ${isMult ? '×' : '÷'} ${p} = ?`,
      answer: result,
      display: decFixed(result, resDp),
      solutionSteps: [
        `${isMult ? 'Multiplying' : 'Dividing'} by ${p} shifts the digits ${String(p).length - 1} place(s) ${isMult ? 'left of' : 'right of'} the point.`,
        `${decFixed(x, dp)} → ${decFixed(result, resDp)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/move-wrong-way',
      difficulty,
      mode,
    });
  },

  decimalMultWhole(rng, family, difficulty, mode) {
    const dp = pick(rng, [1, 2]);
    const f = 10 ** dp;
    const xi = rint(rng, 11, 99);
    const x = round(xi / f, dp);
    const w = rint(rng, 2, 9);
    const result = round((xi * w) / f, dp);
    return shortAnswer({
      family,
      prompt: `${decFixed(x, dp)} × ${w} = ?`,
      answer: result,
      display: decFixed(result, dp),
      solutionSteps: [
        `Multiply as whole numbers: ${xi} × ${w} = ${xi * w}.`,
        `The factor has ${dp} decimal place(s), so the product does too: ${decFixed(result, dp)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/lost-point',
      difficulty,
      mode,
    });
  },

  decimalMultDecimal(rng, family, difficulty, mode) {
    const dpX = pick(rng, [1, 2]);
    const dpY = pick(rng, [1, 2]);
    const xi = rint(rng, 11, dpX === 1 ? 99 : 99);
    const yi = rint(rng, 11, 99);
    const x = round(xi / 10 ** dpX, dpX);
    const y = round(yi / 10 ** dpY, dpY);
    const totalDp = dpX + dpY;
    const result = round((xi * yi) / 10 ** totalDp, totalDp);
    return shortAnswer({
      family,
      prompt: `${decStr(x, dpX)} × ${decStr(y, dpY)} = ?`,
      answer: result,
      display: decStr(result, totalDp),
      solutionSteps: [
        `Multiply as whole numbers: ${xi} × ${yi} = ${xi * yi}.`,
        `Total decimal places in the factors = ${dpX} + ${dpY} = ${totalDp}, so place the point: ${decStr(result, totalDp)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/wrong-place-count',
      difficulty,
      mode,
    });
  },

  decimalDivWhole(rng, family, difficulty, mode) {
    const w = rint(rng, 2, 9);
    const dp = pick(rng, [1, 2]);
    const f = 10 ** dp;
    // build a dividend that divides exactly: quotient int * w
    const qi = rint(rng, 11, 80);
    const dividendInt = qi * w;
    const dividend = round(dividendInt / f, dp);
    const quotient = round(qi / f, dp);
    return shortAnswer({
      family,
      prompt: `${decStr(dividend, dp)} ÷ ${w} = ?`,
      answer: quotient,
      display: decStr(quotient, dp),
      solutionSteps: [
        `Divide keeping the decimal point in the quotient above the point in the dividend.`,
        `${decStr(dividend, dp)} ÷ ${w} = ${decStr(quotient, dp)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/quotient-point',
      difficulty,
      mode,
    });
  },

  decimalDivDecimal(rng, family, difficulty, mode) {
    const divisorDp = 1;
    const di = rint(rng, 2, 9); // divisor = di/10
    const divisor = round(di / 10, 1);
    const qi = rint(rng, 2, 20); // whole-number quotient keeps it clean
    const dividend = round((di * qi) / 10, 1);
    return shortAnswer({
      family,
      prompt: `${decStr(dividend, 1)} ÷ ${decStr(divisor, divisorDp)} = ?`,
      answer: qi,
      display: String(qi),
      solutionSteps: [
        `Multiply both numbers by 10 to make the divisor a whole number: ${di * qi} ÷ ${di}.`,
        `${di * qi} ÷ ${di} = ${qi}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/no-scale-divisor',
      difficulty,
      mode,
    });
  },

  decimalToFraction(rng, family, difficulty, mode) {
    const dp = pick(rng, [1, 2]);
    const f = 10 ** dp;
    const numRaw = rint(rng, 1, f - 1);
    const value = round(numRaw / f, dp);
    const g = gcd(numRaw, f);
    const num = numRaw / g;
    const den = f / g;
    const display = `${num}/${den}`;
    return shortAnswer({
      family,
      prompt: `Write ${decStr(value, dp)} as a fraction in lowest terms.`,
      answer: display,
      display,
      solutionSteps: [
        `${decStr(value, dp)} = ${numRaw}/${f} (read the place value as the denominator).`,
        `Divide top and bottom by ${g}: ${display}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/wrong-denominator',
      difficulty,
      mode,
    });
  },

  fractionToDecimal(rng, family, difficulty, mode) {
    // denominators that terminate cleanly
    const den = pick(rng, [2, 4, 5, 10, 20, 25, 50, 100]);
    const num = rint(rng, 1, den - 1);
    const value = round(num / den, 4);
    const dp = decStr(value, 4).split('.')[1]?.length || 1;
    return shortAnswer({
      family,
      prompt: `Write ${num}/${den} as a decimal.`,
      answer: value,
      display: decStr(value, 4),
      solutionSteps: [
        `Divide the numerator by the denominator: ${num} ÷ ${den}.`,
        `${num} ÷ ${den} = ${decStr(value, 4)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/divide-reversed',
      difficulty,
      mode,
    });
  },

  decimalMeasureConvert(rng, family, difficulty, mode) {
    const pairs = [
      { big: 'km', small: 'm', factor: 1000 },
      { big: 'kg', small: 'g', factor: 1000 },
      { big: 'L', small: 'ml', factor: 1000 },
      { big: 'm', small: 'cm', factor: 100 },
    ];
    const pairChoice = pick(rng, pairs);
    const up = !family.name.toLowerCase().includes('down');
    if (up) {
      const value = round(rint(rng, 11, 999) / 100, 2); // e.g. 2.35 km
      const result = round(value * pairChoice.factor, 2);
      return shortAnswer({
        family,
        prompt: `Convert ${decStr(value, 2)} ${pairChoice.big} to ${pairChoice.small}.`,
        answer: result,
        display: decStr(result, 2),
        solutionSteps: [
          `1 ${pairChoice.big} = ${pairChoice.factor} ${pairChoice.small}; bigger unit → smaller unit means multiply.`,
          `${decStr(value, 2)} × ${pairChoice.factor} = ${decStr(result, 2)} ${pairChoice.small}.`,
        ],
        misconceptionTag: family.misconceptionTags[0] || 'dec/convert-direction',
        difficulty,
        mode,
      });
    }
    const smallValue = rint(rng, 1, 9) * pairChoice.factor + rint(rng, 1, pairChoice.factor - 1);
    const result = round(smallValue / pairChoice.factor, 3);
    return shortAnswer({
      family,
      prompt: `Convert ${smallValue} ${pairChoice.small} to ${pairChoice.big}.`,
      answer: result,
      display: decStr(result, 3),
      solutionSteps: [
        `1 ${pairChoice.big} = ${pairChoice.factor} ${pairChoice.small}; smaller unit → bigger unit means divide.`,
        `${smallValue} ÷ ${pairChoice.factor} = ${decStr(result, 3)} ${pairChoice.big}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'dec/convert-direction',
      difficulty,
      mode,
    });
  },
};

// ── Public API ──────────────────────────────────────────────────────────────
export function generateDecimalQuestion({ skillId, questionFamilyId, difficulty, mode = 'practice', variant = 0 } = {}) {
  let family = questionFamilyId ? getQuestionFamily(questionFamilyId) : null;
  if (!family) {
    if (!skillId) throw new Error('generateDecimalQuestion requires skillId or questionFamilyId');
    const families = getQuestionFamiliesBySkill(skillId);
    if (!families.length) throw new Error(`No question families for skill ${skillId}`);
    family = families[variant % families.length];
  }
  if (skillId && family.skillId !== skillId) {
    throw new Error(`Family ${family.id} does not belong to skill ${skillId}`);
  }
  const generator = GENERATORS[family.generatorKind];
  if (!generator) throw new Error(`No generator for kind ${family.generatorKind}`);

  const resolvedDifficulty = difficulty ?? family.difficulty;
  const rng = makeRng(`${family.skillId}:${family.id}:${mode}:${variant}`);
  return generator(rng, family, resolvedDifficulty, mode);
}

export function generateDecimalQuestionSet({ skillId, questionFamilyIds, count = 5, mode = 'practice', difficulty } = {}) {
  if (!skillId && !(questionFamilyIds && questionFamilyIds.length)) {
    throw new Error('generateDecimalQuestionSet requires skillId or questionFamilyIds');
  }
  const familyIds = (questionFamilyIds && questionFamilyIds.length)
    ? questionFamilyIds
    : getQuestionFamiliesBySkill(skillId).map((f) => f.id);
  if (!familyIds.length) throw new Error(`No question families for skill ${skillId}`);

  const out = [];
  for (let i = 0; i < count; i++) {
    const familyId = familyIds[i % familyIds.length];
    const variant = Math.floor(i / familyIds.length);
    out.push(generateDecimalQuestion({ questionFamilyId: familyId, mode, difficulty, variant }));
  }
  return out;
}

function normalizeAnswer(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-'); // normalise unicode minus
}

export function checkDecimalAnswer({ question, studentResponse } = {}) {
  if (!question) throw new Error('checkDecimalAnswer requires a question');
  const submitted = typeof studentResponse === 'object' && studentResponse !== null
    ? studentResponse.answer
    : studentResponse;

  const accepted = (question.acceptedAnswers && question.acceptedAnswers.length)
    ? question.acceptedAnswers
    : [question.answer?.display];

  const normSubmitted = normalizeAnswer(submitted);
  // Exact string match against accepted forms (handles fractions, ordered sets).
  const stringMatch = accepted.some((a) => normalizeAnswer(a) === normSubmitted);

  // Numeric tolerance match for plain decimal answers.
  let numericMatch = false;
  const target = question.answer?.value;
  if (typeof target === 'number' && normSubmitted !== '') {
    const n = Number(normSubmitted);
    if (Number.isFinite(n)) numericMatch = Math.abs(n - target) < 1e-9;
  }

  const correct = stringMatch || numericMatch;
  return {
    correct,
    score: correct ? 1 : 0,
    feedback: correct
      ? 'Correct.'
      : `Not quite. The answer is ${question.answer?.display}.`,
    expected: question.answer?.display,
    misconceptionTag: correct ? null : question.misconceptionTag,
  };
}

export function isGeneratableDecimalSkill(skillId) {
  if (!getSkill(skillId)) return false;
  return getQuestionFamiliesBySkill(skillId).every((f) => Boolean(GENERATORS[f.generatorKind]));
}
