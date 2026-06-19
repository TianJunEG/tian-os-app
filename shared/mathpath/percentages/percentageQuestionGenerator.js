import { getSkill } from './percentageSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './percentageQuestionFamilies.js';

// Rule-based Percentage question generator. Deterministic: the same
// (skillId, questionFamilyId, variant) always yields the same question.
// Follows the same structure as decimalsQuestionGenerator.js exactly.

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

// ── Math helpers ─────────────────────────────────────────────────────────────
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// Format a dollar amount with two decimal places — Singapore exams never write
// "$4.4". The numeric answer.value is kept separate for tolerance matching.
function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

// ── Question assembly helpers ─────────────────────────────────────────────────
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

// ── Per-kind generators ───────────────────────────────────────────────────────
const GENERATORS = {
  pctMeaning(rng, family, difficulty, mode) {
    const n = rint(rng, 5, 90);
    const answerDisplay = `${n}%`;
    const prompt = `${n} squares out of 100 in a grid are shaded. What percentage is shaded?`;
    return mcq({
      family,
      rng,
      prompt,
      answerDisplay,
      distractors: [`${Math.round(n / 10)}%`, `${n * 10}%`, `${100 - n}%`],
      solutionSteps: [
        `Percentage means "out of 100".`,
        `${n} out of 100 = ${n}%.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/not-per-hundred',
      difficulty,
      mode,
    });
  },

  pctConvert(rng, family, difficulty, mode) {
    // Alternate between → decimal and → fraction based on family index
    const toFraction = family.name.toLowerCase().includes('fraction');
    // choose nice percentages: multiples of 5
    const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
    if (toFraction) {
      const g = gcd(p, 100);
      const num = p / g;
      const den = 100 / g;
      const display = `${num}/${den}`;
      return shortAnswer({
        family,
        prompt: `Write ${p}% as a fraction in its simplest form.`,
        answer: display,
        display,
        solutionSteps: [
          `${p}% = ${p}/100.`,
          `Simplify: divide both by ${g} → ${display}.`,
        ],
        misconceptionTag: family.misconceptionTags[0] || 'pct/keep-percent-sign',
        difficulty,
        mode,
      });
    }
    const dec = p / 100;
    const display = String(dec);
    return shortAnswer({
      family,
      prompt: `Write ${p}% as a decimal.`,
      answer: dec,
      display,
      solutionSteps: [
        `Divide by 100: ${p} ÷ 100 = ${display}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/move-point-wrong',
      difficulty,
      mode,
    });
  },

  pctOfQuantity(rng, family, difficulty, mode) {
    // Choose p and q so answer is a whole number.
    const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
    // q is a multiple of 100/gcd(p,100) to guarantee integer answer
    const g = gcd(p, 100);
    const step = 100 / g; // smallest q that makes integer
    const q = step * rint(rng, 2, 20);
    const answer = (p * q) / 100;
    const items = ['students in a class', 'apples in a basket', 'books on a shelf', 'marbles in a bag', 'stickers in a pack'];
    const item = family.name.toLowerCase().includes('word') ? pick(rng, items) : null;
    const prompt = item
      ? `There are ${q} ${item}. ${p}% of them are red. How many are red?`
      : `Find ${p}% of ${q}.`;
    return shortAnswer({
      family,
      prompt,
      answer,
      display: String(answer),
      solutionSteps: [
        `${p}% of ${q} = ${p}/100 × ${q}.`,
        `= ${p} × ${q} ÷ 100 = ${answer}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/forgot-divide-100',
      difficulty,
      mode,
    });
  },

  pctExpress(rng, family, difficulty, mode) {
    // Choose a, b so a/b × 100 is a whole number.
    const p = pick(rng, [5, 10, 20, 25, 40, 50, 60, 75, 80]);
    const g = gcd(p, 100);
    const step = 100 / g;
    const b = step * rint(rng, 2, 15);
    const a = (p * b) / 100;
    const contexts = [
      [`${a} out of ${b} students passed. What percentage passed?`, 'students'],
      [`A bag has ${b} marbles. ${a} are blue. What percentage are blue?`, 'marbles'],
      [`${a} out of ${b} questions were correct. What percentage was correct?`, 'questions'],
    ];
    const [prompt] = pick(rng, contexts);
    return shortAnswer({
      family,
      prompt,
      answer: p,
      display: `${p}%`,
      solutionSteps: [
        `Part ÷ Whole × 100 = ${a} ÷ ${b} × 100.`,
        `= ${p}%.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/wrong-base',
      difficulty,
      mode,
    });
  },

  pctFindWhole(rng, family, difficulty, mode) {
    // p ∈ nice values; whole ∈ multiples of 20 (100..2000); part = p%*whole (always integer)
    const p = pick(rng, [5, 10, 15, 20, 25, 40, 50, 75]);
    const g = gcd(p, 100);
    const step = 100 / g; // smallest whole making integer part
    const mult = rint(rng, 2, 20);
    const whole = step * mult;
    const part = (p * whole) / 100;
    return shortAnswer({
      family,
      prompt: `${p}% of a number is ${part}. What is the number?`,
      answer: whole,
      display: String(whole),
      solutionSteps: [
        `If ${p}% = ${part}, then 1% = ${part} ÷ ${p} = ${part / p}.`,
        `100% = ${part / p} × 100 = ${whole}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/part-is-whole',
      difficulty,
      mode,
    });
  },

  pctIncreaseDecrease(rng, family, difficulty, mode) {
    const isIncrease = family.name.toLowerCase().includes('increase');
    const p = pick(rng, [5, 10, 15, 20, 25, 30]);
    // choose q so answer is whole number
    const g = gcd(p, 100);
    const step = 100 / g;
    const q = step * rint(rng, 2, 20);
    const change = (p * q) / 100;
    const answer = isIncrease ? q + change : q - change;
    const prompt = isIncrease
      ? `A jacket originally costs $${q}. Its price increases by ${p}%. What is the new price?`
      : `A TV originally costs $${q}. Its price decreases by ${p}%. What is the new price?`;
    return shortAnswer({
      family,
      prompt,
      answer,
      display: money(answer),
      solutionSteps: [
        `${p}% of ${q} = ${change}.`,
        `New price = ${q} ${isIncrease ? '+' : '−'} ${change} = ${answer}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/add-percent-not-amount',
      difficulty,
      mode,
    });
  },

  pctBeforeAfter(rng, family, difficulty, mode) {
    // "There were {total} apples. {p}% were eaten. How many remain?"
    const p = pick(rng, [10, 20, 25, 30, 40, 50]);
    const g = gcd(p, 100);
    const step = 100 / g;
    const total = step * rint(rng, 4, 20);
    const eaten = (p * total) / 100;
    const remain = total - eaten;
    return shortAnswer({
      family,
      prompt: `There were ${total} apples. ${p}% of them were eaten. How many apples remain?`,
      answer: remain,
      display: String(remain),
      solutionSteps: [
        `${p}% of ${total} were eaten = ${eaten} apples.`,
        `Remaining = ${total} − ${eaten} = ${remain}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/percent-of-different-base',
      difficulty,
      mode,
    });
  },

  pctDiscount(rng, family, difficulty, mode) {
    const items = ['shirt', 'bag', 'book', 'toy', 'watch', 'jacket', 'shoes'];
    const item = pick(rng, items);
    const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50]);
    // price is a multiple of 100/(gcd(p,100)) to keep integer
    const g = gcd(p, 100);
    const step = 100 / g;
    const price = step * rint(rng, 2, 20);
    const discount = (p * price) / 100;
    const selling = price - discount;
    const askAmount = family.name.toLowerCase().includes('amount');
    const prompt = askAmount
      ? `A ${item} costs $${price}. There is a ${p}% discount. How much is the discount?`
      : `A ${item} costs $${price}. There is a ${p}% discount. What is the selling price?`;
    const answer = askAmount ? discount : selling;
    return shortAnswer({
      family,
      prompt,
      answer,
      display: money(answer),
      solutionSteps: [
        `Discount = ${p}% × $${price} = $${discount}.`,
        askAmount
          ? `The discount is $${discount}.`
          : `Selling price = $${price} − $${discount} = $${selling}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/discount-of-discounted',
      difficulty,
      mode,
    });
  },

  pctGST(rng, family, difficulty, mode) {
    // Realistic Singapore GST rates
    const p = pick(rng, [7, 8, 9]);
    const price = rint(rng, 2, 40) * 5; // $10–$200 in steps of $5
    const gstAmt = round2((p * price) / 100);
    const total = round2(price + gstAmt);
    const askAmount = family.name.toLowerCase().includes('amount');
    const prompt = askAmount
      ? `A meal costs $${price} before ${p}% GST. How much is the GST?`
      : `A meal costs $${price} before ${p}% GST. What is the total amount to pay?`;
    const answer = askAmount ? gstAmt : total;
    return shortAnswer({
      family,
      prompt,
      answer,
      display: money(answer),
      solutionSteps: [
        `GST = ${p}% × $${price} = ${money(gstAmt)}.`,
        askAmount
          ? `GST amount = ${money(gstAmt)}.`
          : `Total = $${price} + ${money(gstAmt)} = ${money(total)}.`,
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/gst-wrong-base',
      difficulty,
      mode,
    });
  },

  pctInterest(rng, family, difficulty, mode) {
    const principals = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000];
    const principal = pick(rng, principals);
    const rate = pick(rng, [2, 3, 4, 5, 6]);
    const years = rint(rng, 1, 3);
    const interest = (principal * rate * years) / 100;
    const total = principal + interest;
    const askTotal = family.name.toLowerCase().includes('total');
    const prompt = askTotal
      ? `$${principal} is deposited at ${rate}% simple interest per year for ${years} year${years > 1 ? 's' : ''}. What is the total amount at the end?`
      : `Find the simple interest on $${principal} at ${rate}% per year for ${years} year${years > 1 ? 's' : ''}.`;
    const answer = askTotal ? total : interest;
    return shortAnswer({
      family,
      prompt,
      answer,
      display: money(answer),
      solutionSteps: [
        `Interest per year = ${rate}% × $${principal} = $${(principal * rate) / 100}.`,
        `Interest for ${years} year${years > 1 ? 's' : ''} = $${(principal * rate) / 100} × ${years} = $${interest}.`,
        ...(askTotal ? [`Total = $${principal} + $${interest} = $${total}.`] : []),
      ],
      misconceptionTag: family.misconceptionTags[0] || 'pct/interest-compound-confuse',
      difficulty,
      mode,
    });
  },
};

// ── Public API ────────────────────────────────────────────────────────────────
export function generatePercentageQuestion({ skillId, questionFamilyId, difficulty, mode = 'practice', variant = 0, sessionSalt = '' } = {}) {
  let family = questionFamilyId ? getQuestionFamily(questionFamilyId) : null;
  if (!family) {
    if (!skillId) throw new Error('generatePercentageQuestion requires skillId or questionFamilyId');
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
  const rng = makeRng(`${family.skillId}:${family.id}:${mode}:${variant}:${sessionSalt}`);
  return generator(rng, family, resolvedDifficulty, mode);
}

export function generatePercentageQuestionSet({ skillId, questionFamilyIds, count = 5, mode = 'practice', difficulty, sessionSalt = '' } = {}) {
  if (!skillId && !(questionFamilyIds && questionFamilyIds.length)) {
    throw new Error('generatePercentageQuestionSet requires skillId or questionFamilyIds');
  }
  const familyIds = (questionFamilyIds && questionFamilyIds.length)
    ? questionFamilyIds
    : getQuestionFamiliesBySkill(skillId).map((f) => f.id);
  if (!familyIds.length) throw new Error(`No question families for skill ${skillId}`);

  const seenPrompts = new Set();
  const out = [];
  let attempt = 0;
  const maxAttempts = count * 5;
  while (out.length < count && attempt < maxAttempts) {
    const familyId = familyIds[attempt % familyIds.length];
    const variant = Math.floor(attempt / familyIds.length);
    const q = generatePercentageQuestion({ questionFamilyId: familyId, mode, difficulty, variant, sessionSalt });
    const dedupKey = q.prompt + '|||' + (q.answer?.display ?? q.answer);
    if (!seenPrompts.has(dedupKey) || attempt >= count * 3) {
      seenPrompts.add(dedupKey);
      out.push(q);
    }
    attempt++;
  }
  return out;
}

function normalizeAnswer(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/^\$/, ''); // strip leading $ for currency answers
}

export function checkPercentageAnswer({ question, studentResponse } = {}) {
  if (!question) throw new Error('checkPercentageAnswer requires a question');
  const submitted = typeof studentResponse === 'object' && studentResponse !== null
    ? studentResponse.answer
    : studentResponse;

  const accepted = (question.acceptedAnswers && question.acceptedAnswers.length)
    ? question.acceptedAnswers
    : [question.answer?.display];

  const normSubmitted = normalizeAnswer(submitted);

  // Exact string match (handles fractions, percentages, ordered sets).
  const stringMatch = accepted.some((a) => normalizeAnswer(a) === normSubmitted);

  // Numeric tolerance match for plain numeric and currency answers.
  let numericMatch = false;
  const target = question.answer?.value;
  if (typeof target === 'number' && normSubmitted !== '') {
    const n = Number(normSubmitted);
    if (Number.isFinite(n)) numericMatch = Math.abs(n - target) < 0.01;
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

export function isGeneratablePercentageSkill(skillId) {
  if (!getSkill(skillId)) return false;
  return getQuestionFamiliesBySkill(skillId).every((f) => Boolean(GENERATORS[f.generatorKind]));
}
