import { fractionSkillGraph, getSkill } from './fractionSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';
import { getSkillCurriculumMapping } from '../curriculum/curriculumMappingSelectors.js';
import { buildFractionAssessmentMetadata } from './fractionAssessmentReadinessGate.js';

const LEVEL_RANK = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
  P6: 6,
  S1: 11,
  S2: 12,
  S3: 13,
  S4: 14,
};

function normalizeLevel(level = '') {
  const normalized = String(level || '').trim().toUpperCase();
  if (!normalized) return '';
  if (normalized === 'P1') return 'P1';
  if (normalized === 'P2') return 'P2';
  if (normalized === 'P3') return 'P3';
  if (normalized === 'P4') return 'P4';
  if (normalized === 'P5') return 'P5';
  if (normalized === 'P6') return 'P6';
  if (normalized.startsWith('SEC')) {
    const sec = normalized.replace(/^SEC/, 'S');
    return LEVEL_RANK[sec] ? sec : 'S1';
  }
  return normalized;
}

function levelRank(level = '') {
  const key = normalizeLevel(level);
  return LEVEL_RANK[key] || 999;
}

function normalizeFractionPromptSignature(prompt = '') {
  return String(prompt || '')
    .toLowerCase()
    .replace(/\d+\/\d+/g, '#')
    .replace(/\b\d+(?:\.\d+)?\b/g, '#')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9#\s]/g, ' ')
    .trim();
}

// Signature used to detect questions that render identically to the student within
// a single session — by prompt text AND operands AND answer. Unlike
// normalizeFractionPromptSignature (which strips digits to compare structure), this
// PRESERVES operands so "2/3 + 1/2" and "4/5 + 3/4" are treated as distinct, while
// the same "Compute: 2/3 + 1/2" served under different families is caught as a
// duplicate. The answer is included so visual questions with a fixed prompt
// (e.g. "What fraction of the shape is shaded?") but different diagrams/answers are
// not wrongly merged.
function renderedQuestionSignature(question = {}) {
  const prompt = String(question.prompt || '')
    .toLowerCase()
    .replace(/[^a-z0-9/+\-=.,?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const answer = String(question?.answer?.display ?? question?.answer ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');
  return `${prompt}::${answer}`;
}

function inferAllowedOperations(prompt = '') {
  const text = String(prompt || '').toLowerCase();
  const ops = new Set();
  if (/\//.test(text) && !/\d+\s*\/\s*\d+/.test(text) === false) ops.add('compare');
  if (/\+/.test(text)) ops.add('addition');
  if (/\s-\s/.test(text) && !/\s-\s*\d/.test(text)) ops.add('subtraction');
  if (/[×*]/.test(text)) ops.add('multiplication');
  if (/÷|\//.test(text) && /\d/.test(text)) ops.add('division');
  return [...ops];
}

const BASE_GUARDRAILS = {
  allowed_operations: ['addition', 'subtraction', 'multiplication', 'division', 'compare', 'identify', 'convert'],
  allow_negative_numbers: true,
  allow_improper_fractions: true,
  allow_mixed_numbers: true,
  allow_unlike_denominators: true,
  allow_word_problems: true,
};

function resolveAllowedLevelsForSkill(skillId = '') {
  const skill = getSkill(skillId);
  const levels = Array.isArray(skill?.singaporeLevel) && skill.singaporeLevel.length
    ? skill.singaporeLevel
    : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4'];
  return levels.map((lvl) => normalizeLevel(lvl)).filter(Boolean);
}

function buildQuestionRules(skillId, family = {}, level = '') {
  const allowedLevels = resolveAllowedLevelsForSkill(skillId);
  const target = normalizeLevel(level);
  const isPrimary = /^P[1-6]$/.test(target);
  return {
    allowed_levels: [...allowedLevels],
    min_level: allowedLevels[0] || 'P1',
    max_level: allowedLevels[allowedLevels.length - 1] || 'S4',
    allowed_operations: inferAllowedOperations(family?.description || ''),
    allow_negative_numbers: isPrimary ? target === 'P1' || target === 'P2' || target === 'P3' ? true : false : true,
    allow_improper_fractions: target ? !/^P4$/.test(target) : true,
    allow_mixed_numbers: !/^P4$/.test(target),
    allow_unlike_denominators: true,
    allow_word_problems: !/^P4$/.test(target),
  };
}

function matchesLevel(levelTag, allowedLevels = []) {
  const normalized = normalizeLevel(levelTag);
  if (!normalized) return true;
  if (!allowedLevels.length) return true;
  return allowedLevels.includes(normalized);
}

function hasNegativeFractionString(value = '') {
  return /-\d+\s*\/\s*\d+/.test(String(value))
    || /\(\s*-\d+\s*\/\s*\d+\s*\)/.test(String(value));
}

function hasSignedFractionOperation(text = '') {
  const plain = String(text || '');
  return /[^\w][\-−]\s*\d+\s*\/\s*\d+/.test(plain)
    || /\d+\s*\/\s*\d+\s*[\-−]\s*\d+\s*\/\s*\d+/.test(plain)
    || /[\[({]\s*-\d+/.test(plain);
}

function isFractionInRangeAllowed(question = {}, rules = BASE_GUARDRAILS) {
  const prompt = `${question.prompt || ''} ${question.stem || ''}`;
  const answer = question.answer || {};
  const rawNumerator = Number(answer?.numerator);
  const rawDenominator = Number(answer?.denominator);
  const rawWhole = Number(answer?.whole);
  const rawFraction = question?.answer?.fraction;
  if (!rules.allow_negative_numbers) {
    if (hasNegativeFractionString(prompt)) return false;
    if (Number.isFinite(rawNumerator) && rawNumerator < 0) return false;
    if (Number.isFinite(rawWhole) && rawWhole < 0) return false;
    if (rawFraction && Number.isFinite(rawFraction.numerator) && rawFraction.numerator < 0) return false;
    if (rawFraction && Number.isFinite(rawFraction.numerator) && rawFraction.numerator < 0) return false;
    if (hasSignedFractionOperation(prompt)) return false;
  }
  if (!rules.allow_improper_fractions && (answer?.type === 'mixed' || (Number.isFinite(rawNumerator) && Math.abs(rawNumerator) >= Math.abs(rawDenominator) && Number(rawDenominator) !== 0))) {
    return false;
  }
  if (!rules.allow_mixed_numbers && answer?.type === 'mixed') return false;
  return true;
}

const DOMAIN_ID = 'fractions';

function nowIso() {
  return new Date().toISOString();
}

// Monotonic per-call nonce. Date.now() + hash(seed) alone collide when several
// questions are generated in the same millisecond with the same prompt seed (e.g.
// recognise-fraction items that share the prompt "What fraction of the shape is
// shaded?" but have different answers). Colliding questionIds caused the session's
// questionById map to resolve responses to the wrong stored question, scoring
// correct answers as wrong (the "all correct but 50%" report). The nonce guarantees
// every generated question id is unique within the process.
let questionIdNonce = 0;
function makeId(prefix, seed = '') {
  questionIdNonce += 1;
  return `${prefix}_${Date.now()}_${Math.abs(hash(seed)).toString(36).slice(0, 6)}_${questionIdNonce.toString(36)}`;
}

function hash(input = '') {
  let h = 0;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function simplifyFraction(n, d) {
  if (d === 0) throw new Error('Invalid fraction with denominator 0.');
  const sign = d < 0 ? -1 : 1;
  const nn = n * sign;
  const dd = Math.abs(d);
  const g = gcd(nn, dd);
  return { numerator: nn / g, denominator: dd / g };
}

function toMixed(f) {
  const s = simplifyFraction(f.numerator, f.denominator);
  const whole = s.numerator >= 0 ? Math.floor(s.numerator / s.denominator) : Math.ceil(s.numerator / s.denominator);
  const rem = Math.abs(s.numerator % s.denominator);
  return { whole, numerator: rem, denominator: s.denominator };
}

function frac(n, d) {
  return simplifyFraction(n, d);
}

export const COUNTABLE_CONTEXT_NOUNS = [
  'problems',
  'questions',
  'students',
  'books',
  'pages',
  'stickers',
  'marbles',
  'pencils',
  'sweets',
  'apples',
  'oranges',
  'chairs',
  'tickets',
  'marks',
];

export function isWholeNumber(value) {
  return Number.isInteger(Number(value));
}

export function validateCountableFractionSequence(total, fractions = []) {
  if (!isWholeNumber(total) || Number(total) < 0) {
    return { valid: false, reason: 'total_not_whole', total, final: null, steps: [] };
  }

  let remaining = Number(total);
  const steps = [];
  for (const f of fractions) {
    const numerator = Number(f?.numerator);
    const denominator = Number(f?.denominator);
    if (!isWholeNumber(numerator) || !isWholeNumber(denominator) || denominator <= 0 || numerator < 0) {
      return { valid: false, reason: 'invalid_fraction', total: Number(total), final: null, steps };
    }
    const amountNumerator = remaining * numerator;
    if (!isWholeNumber(remaining) || amountNumerator % denominator !== 0) {
      return { valid: false, reason: 'fraction_creates_decimal_count', total: Number(total), final: null, steps };
    }
    const amount = amountNumerator / denominator;
    const before = remaining;
    remaining -= amount;
    if (!isWholeNumber(amount) || !isWholeNumber(remaining)) {
      return { valid: false, reason: 'non_integer_intermediate_count', total: Number(total), final: null, steps };
    }
    steps.push({ fraction: f, before, amount, remaining });
  }

  return { valid: true, reason: '', total: Number(total), final: remaining, steps };
}

function compareFractions(a, b) {
  return a.numerator * b.denominator - b.numerator * a.denominator;
}

function orderedSubtractionPair(a, b) {
  return compareFractions(a, b) >= 0 ? [a, b] : [b, a];
}

function integerFriendlyTotal(seed, min, max, fractions = []) {
  const span = max - min + 1;
  for (let offset = 0; offset < span; offset += 1) {
    const candidate = min + ((Math.abs(seed) + offset) % span);
    const sequence = validateCountableFractionSequence(candidate, fractions);
    if (sequence.valid) return { total: candidate, final: sequence.final };
  }
  const denominatorProduct = fractions.reduce((product, f) => product * Math.max(1, f.denominator), 1);
  const total = denominatorProduct * Math.max(1, Math.ceil(min / denominatorProduct));
  const sequence = validateCountableFractionSequence(total, fractions);
  if (!sequence.valid) {
    throw new Error('Could not generate integer-safe countable fraction total.');
  }
  return { total, final: sequence.final };
}

function sequentialWholeCountTotal(seed, min, max, fractions = []) {
  const result = integerFriendlyTotal(seed, min, max, fractions);
  const sequence = validateCountableFractionSequence(result.total, fractions);
  if (!sequence.valid) {
    throw new Error('Generated count-based fraction question with non-integer intermediate quantity.');
  }
  return { total: result.total, final: sequence.final, steps: sequence.steps };
}

function multipleInRange(seed, min, max, factor) {
  const safeFactor = Math.max(1, Number(factor) || 1);
  const low = Math.ceil(min / safeFactor);
  const high = Math.floor(max / safeFactor);
  if (high < low) return safeFactor * Math.max(1, low);
  return safeFactor * seq(seed, low, high);
}

function fracStr(f) {
  const s = simplifyFraction(f.numerator, f.denominator);
  if (s.denominator === 1) return String(s.numerator);
  return `${s.numerator}/${s.denominator}`;
}

function mixedStr(m) {
  if (!m.numerator) return String(m.whole);
  return `${m.whole} ${m.numerator}/${m.denominator}`;
}

function parseAnswer(raw) {
  const input = String(raw ?? '').trim();
  if (!input) return null;
  const symbolMatch = input.match(/^([<>]=?|=)$/);
  if (symbolMatch) {
    return { type: 'symbol', value: symbolMatch[1] };
  }
  if (/^-?\d+(\.\d+)?$/.test(input)) {
    const n = Number(input);
    if (Number.isInteger(n)) {
      return { type: 'whole', whole: n, fraction: { numerator: n, denominator: 1 } };
    }
    const sign = n < 0 ? -1 : 1;
    const [i, d = ''] = String(Math.abs(n)).split('.');
    const den = 10 ** d.length;
    const num = sign * (Number(i) * den + Number(d));
    return { type: 'decimal', value: n, fraction: simplifyFraction(num, den) };
  }
  if (/^-?\d+$/.test(input)) {
    const n = Number(input);
    return { type: 'whole', whole: n, fraction: { numerator: n, denominator: 1 } };
  }
  const mixedMatch = input.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const n = Number(mixedMatch[2]);
    const d = Number(mixedMatch[3]);
    if (d === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    const improper = simplifyFraction(whole * d + sign * n, d);
    return { type: 'mixed', whole, numerator: n, denominator: d, fraction: improper };
  }
  const fracMatch = input.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (fracMatch) {
    const n = Number(fracMatch[1]);
    const d = Number(fracMatch[2]);
    if (d === 0) return null;
    return { type: 'fraction', ...simplifyFraction(n, d), fraction: simplifyFraction(n, d) };
  }
  return null;
}

function answerPayloadFraction(n, d) {
  const s = simplifyFraction(n, d);
  return {
    type: 'fraction',
    numerator: s.numerator,
    denominator: s.denominator,
    display: fracStr(s),
  };
}

function answerPayloadWhole(n) {
  return { type: 'whole', whole: n, display: String(n) };
}

function answerPayloadMixed(whole, numerator, denominator) {
  return { type: 'mixed', whole, numerator, denominator, display: mixedStr({ whole, numerator, denominator }) };
}

function assertValidDenominators(value, path = '') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertValidDenominators(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    const nextPath = path ? `${path}.${key}` : key;
    if (key === 'denominator') {
      const den = Number(child);
      if (!Number.isFinite(den) || den <= 0) {
        throw new Error(`Invalid generated denominator at ${nextPath}.`);
      }
      return;
    }
    assertValidDenominators(child, nextPath);
  });
}

function modeMarks(mode = 'practice') {
  if (mode === 'assessment') return 2;
  if (mode === 'diagnostic') return 1;
  if (mode === 'fluency') return 1;
  return 1;
}

function estimateSeconds(mode = 'practice', difficulty = 2, base = 18) {
  if (mode === 'fluency') return Math.max(6, base - 6);
  if (mode === 'assessment') return base + difficulty * 3;
  if (mode === 'diagnostic') return base + 2;
  return base + difficulty * 2;
}

function seq(seed, min, max) {
  const width = max - min + 1;
  return min + (Math.abs(seed) % width);
}

function distinctSeq(seed, min, max, avoid) {
  let value = seq(seed, min, max);
  if (value === avoid) value = value < max ? value + 1 : value - 1;
  return value;
}

function ordinalWord(n) {
  return ({
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
    5: 'fifth',
    6: 'sixth',
    7: 'seventh',
    8: 'eighth',
    9: 'ninth',
    10: 'tenth',
    11: 'eleventh',
    12: 'twelfth',
  })[n] || `${n}th`;
}

function deterministicShuffle(items = [], seed = 0) {
  return [...items].sort((a, b) => hash(`${seed}|${fracStr(a)}|shown`) - hash(`${seed}|${fracStr(b)}|shown`));
}

function ensureNotAlreadySorted(shown = [], sorted = []) {
  const shownKey = shown.map(fracStr).join('|');
  const sortedKey = sorted.map(fracStr).join('|');
  if (shownKey !== sortedKey) return shown;
  return shown.length > 1 ? [shown[1], ...shown.slice(2), shown[0]] : shown;
}

function templateContext(skillId, questionFamilyId, difficulty = 2, mode = 'practice', variant = 0) {
  const seed = hash(`${skillId}|${questionFamilyId}|${difficulty}|${mode}|${variant}`);
  return { seed, difficulty, mode, variant, questionFamilyId };
}

const SKILL_MISTAKES = {
  F001: ['M003'],
  F002: ['M003', 'M001', 'M010'],
  F003: ['M003'],
  F004: ['M003'],
  F005: ['M003'],
  F006: ['M002', 'M003'],
  F007: ['M002'],
  F008: ['M002', 'M003'],
  F009: ['M002', 'M004'],
  F010: ['M004'],
  F011: ['M004', 'M003', 'M002', 'M010'],
  F012: ['M005', 'M002', 'M003', 'M010'],
  F013: ['M006'],
  F014: ['M006'],
  F015: ['M006', 'M007', 'M005', 'M010'],
  F016: ['M007', 'M010'],
  F017: ['M007', 'M010'],
  F018: ['M001', 'M004', 'M007', 'M005', 'M010'],
  F019: ['M004', 'M007'],
  F020: ['M008', 'M010'],
  F021: ['M009', 'M010'],
  F022: ['M009', 'M010'],
  F023: ['M008', 'M010', 'M012', 'M003'],
  F024: ['M008', 'M010'],
  F025: ['M008', 'M010', 'M011'],
  F026: ['M008', 'M010', 'M013'],
};

function workingTypeForSkill(skillId, workingRequired, mentalMathEligible) {
  if (workingRequired && ['F023', 'F024', 'F025', 'F026'].includes(skillId)) return 'model';
  if (workingRequired && ['F015', 'F016', 'F017', 'F018', 'F019', 'F020', 'F021', 'F022'].includes(skillId)) return 'calculation';
  if (mentalMathEligible || !workingRequired) return 'optional';
  return 'drawing';
}

function shouldRequireWorkingForGeneratedQuestion(skillId, mode, family) {
  const normalizedMode = String(mode || '').toLowerCase();
  if (normalizedMode === 'warmup' || normalizedMode === 'fluency') return false;
  if (['F015', 'F017', 'F018', 'F023', 'F025', 'F026'].includes(skillId)) return true;
  return family.mentalMathEligible ? false : !!family.workingRequired;
}

function inferAnswerInputType(answer = {}) {
  const normalizedType = String(answer?.type || '').toLowerCase();
  if (normalizedType === 'whole') return 'whole_number';
  if (normalizedType === 'mixed') return 'mixed_number';
  if (normalizedType === 'fraction' || normalizedType === 'decimal' || normalizedType === 'list') {
    return normalizedType === 'list' ? 'ordering' : normalizedType;
  }

  const display = String(answer?.display || answer?.value || '').trim();
  if (/^-?\d+$/.test(display)) return 'whole_number';
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(display)) return 'mixed_number';
  if (/^-?\d+\s*\/\s*-?\d+$/.test(display)) return 'fraction';
  if (/^-?\d*\.\d+$/.test(display)) return 'decimal';
  if (display.includes(',')) return 'ordering';
  return 'text';
}

function inferAllowedInputTools(answerFormat) {
  if (answerFormat === 'fraction' || answerFormat === 'mixed_number') return ['fraction', 'mixed', 'whole', 'clear'];
  if (answerFormat === 'text' || answerFormat === 'expression') {
    return ['fraction', 'subscript', 'power', 'subscriptPower', 'mixed', 'root', 'degree', 'angle', 'pi', 'theta', 'clear'];
  }
  return [];
}

function normalizeVisualType(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  const aliases = {
    fraction_bar: 'fraction_strip',
    fraction_model: 'shaded_fraction_model',
    shaded_shape: 'shaded_fraction_model',
    shaded_grid: 'shaded_fraction_model',
    part_whole_cards: 'picture_model',
    comparison_models: 'bar_model',
  };
  return aliases[raw] || raw;
}

function visualTypesForGeneratedQuestion({ skillId, prompt = '', diagramSpec = null }) {
  const bySkill = {
    F001: ['shaded_fraction_model'],
    F002: ['shaded_fraction_model'],
    F003: ['shaded_fraction_model'],
    F004: ['fraction_strip'],
    F005: ['number_line'],
    F006: ['fraction_strip'],
    F007: ['fraction_strip'],
    F008: ['fraction_strip'],
    F009: ['number_line'],
    F010: ['fraction_strip'],
    F011: ['fraction_strip'],
    F012: ['fraction_strip'],
    F013: ['shaded_fraction_model'],
    F014: ['shaded_fraction_model'],
    F015: ['fraction_strip'],
    F016: ['fraction_strip'],
    F017: ['fraction_strip'],
    F018: ['fraction_strip'],
    F019: ['fraction_strip'],
    F020: ['picture_model'],
    F021: ['shaded_fraction_model'],
    F022: ['fraction_strip'],
    F023: ['bar_model'],
    F024: ['bar_model'],
    F025: ['bar_model'],
    F026: ['bar_model'],
  };
  const required = new Set(bySkill[skillId] || []);
  const text = String(prompt || '');
  if (/number\s*line/i.test(text)) required.add('number_line');
  if (/remainder|left|spent|gave away|at first|more than|less than/i.test(text)) required.add('bar_model');
  if (/shaded|shape|equal parts?|whole/i.test(text)) required.add('shaded_fraction_model');
  if (/\bof\s+\d+\b|objects?|cards?|apples?|stickers?/i.test(text)) required.add('picture_model');
  const provided = new Set([normalizeVisualType(diagramSpec?.type)].filter(Boolean));
  if (diagramSpec?.type === 'fraction_bar' && Number(diagramSpec?.data?.shaded || 0) > 0) {
    provided.add('shaded_fraction_model');
  }
  return {
    requiredVisualTypes: [...required],
    providedVisualTypes: [...provided],
  };
}

function buildQuestionCore({ skillId, questionFamilyId, mode, difficulty, prompt, answer, acceptedAnswers, allowedInputTools, workingRequired, mentalMathEligible, solutionSteps, diagramSpec }) {
  const family = getQuestionFamily(questionFamilyId) || {};
  const primaryMapping = getSkillCurriculumMapping(skillId, {
    country: 'SG',
    curriculum: 'MOE_PRIMARY_MATH_2021',
  });
  const secondaryMapping = getSkillCurriculumMapping(skillId, {
    country: 'SG',
    curriculum: 'MOE_SECONDARY_G1_MATH_2021',
  });
  const workedSolution = Array.isArray(solutionSteps) ? solutionSteps.join(' ') : '';
  const answerFormat = inferAnswerInputType(answer);
  const visualMetadata = visualTypesForGeneratedQuestion({ skillId, prompt, diagramSpec });
  const assessmentMetadata = buildFractionAssessmentMetadata({
    skillId,
    family,
    difficulty,
    mode,
    singaporeLevel: primaryMapping?.level || primaryMapping?.introducedLevel || 'P5',
  });

  const question = {
    questionId: makeId('fq', `${skillId}|${questionFamilyId}|${prompt}`),
    domainId: DOMAIN_ID,
    skillId,
    questionFamilyId,
    questionCategory: mode,
    questionType: assessmentMetadata.questionType,
    responseType: 'short_answer',
    moeLevel: assessmentMetadata.moeLevel,
    assessmentEligible: assessmentMetadata.assessmentEligible,
    assessmentQuestionType: assessmentMetadata.questionType,
    prompt,
    answer,
    acceptedAnswers,
    answerFormat,
    answer_type: answerFormat,
    answerType: answerFormat,
    allowedInputTools: Array.isArray(allowedInputTools) ? allowedInputTools : inferAllowedInputTools(answerFormat),
    workingRequired,
    requiresWorking: workingRequired,
    workingOptional: !workingRequired,
    allowNoWorking: !workingRequired,
    workingType: workingTypeForSkill(skillId, workingRequired, mentalMathEligible),
    workingPrompt: workingRequired ? 'Show your working before submitting your answer.' : 'Show working if it helps.',
    mentalMathEligible,
    difficulty,
    difficultyBand: difficulty <= 2 ? 'easy' : difficulty <= 4 ? 'medium' : 'hard',
    estimatedSeconds: estimateSeconds(mode, difficulty),
    marks: modeMarks(mode),
    solutionSteps,
    workedSolution,
    diagramSpec,
    requiredVisualTypes: visualMetadata.requiredVisualTypes,
    providedVisualTypes: visualMetadata.providedVisualTypes,
    visualCoverageStatus: visualMetadata.requiredVisualTypes.every((type) => visualMetadata.providedVisualTypes.includes(type)) ? 'present' : 'missing',
    requiresDiagram: Boolean(diagramSpec),
    requiresVisual: Boolean(diagramSpec),
    commonMistakePatterns: SKILL_MISTAKES[skillId] || ['M010'],
    mistakeTags: SKILL_MISTAKES[skillId] || ['M010'],
    singaporeMetadata: {
      country: 'SG',
      subject: 'Mathematics',
      mappings: [primaryMapping, secondaryMapping].filter(Boolean).map((mapping) => ({
        curriculum: mapping.curriculum,
        phase: mapping.phase,
        stream: mapping.stream,
        level: mapping.level,
        introducedLevel: mapping.introducedLevel,
        masteryLevel: mapping.masteryLevel,
        strand: mapping.strand,
        subStrand: mapping.subStrand,
        syllabusRef: mapping.syllabusRef,
      })),
    },
    createdAt: nowIso(),
  };
  assertValidDenominators(question.answer);
  if (question.diagramSpec) assertValidDenominators(question.diagramSpec);
  return question;
}

function templateForSkill(skillId, variant, ctx) {
  const s = ctx.seed;
  const familyId = String(ctx.questionFamilyId || '');
  switch (skillId) {
    case 'F001': {
      const d = seq(s, 2, 8);
      const shaded = variant === 0 ? 1 : seq(s, 1, d - 1);
      return {
        prompt: 'What fraction of the shape is shaded?',
        answer: answerPayloadFraction(shaded, d),
        acceptedAnswers: [fracStr({ numerator: shaded, denominator: d })],
        diagramSpec: {
          type: 'fraction_bar',
          width: 640,
          height: 180,
          data: { parts: d, shaded, labelMode: 'none' },
        },
        solutionSteps: ['Count shaded parts.', 'Count total equal parts.', `Write fraction as ${shaded}/${d}.`],
      };
    }
    case 'F002': {
      const n = seq(s, 1, 7);
      const d = seq(s + 9, n + 1, 12);
      const askNum = variant % 2 === 0;
      const target = askNum ? 'shaded' : 'equal';
      return {
        prompt: askNum
          ? `A bar is split into ${d} equal parts. ${n} parts are shaded. How many parts are shaded?`
          : `A bar is split into ${d} equal parts. ${n} parts are shaded. How many equal parts are in the whole bar?`,
        answer: answerPayloadWhole(askNum ? n : d),
        acceptedAnswers: [String(askNum ? n : d)],
        diagramSpec: {
          type: 'fraction_bar',
          width: 640,
          height: 180,
          data: { parts: d, shaded: n, labelMode: 'none' },
        },
        solutionSteps: [`Count the ${target} parts.`, `So the answer is ${askNum ? n : d}.`],
      };
    }
    case 'F003': {
      const d = [2, 3, 4, 5][Math.abs(s) % 4];
      const n = seq(s + 3, 1, d - 1);
      const groups = seq(s + 11, 2, 6);
      const total = d * groups;
      const unit = total / d;
      const shaded = unit * n;
      return {
        prompt: `A set has ${total} objects. ${n}/${d} of them are selected. How many are selected?`,
        answer: answerPayloadWhole(shaded),
        acceptedAnswers: [String(shaded)],
        solutionSteps: [`Find 1/${d} of ${total}: ${total}/${d} = ${unit}.`, `Multiply by ${n}: ${shaded}.`],
      };
    }
    case 'F004': {
      const d = seq(s, 2, 12);
      return {
        prompt: `A bar is split into ${d} equal parts. 1 part is shaded. What fraction is shaded?`,
        answer: answerPayloadFraction(1, d),
        acceptedAnswers: [`1/${d}`],
        diagramSpec: {
          type: 'fraction_bar',
          width: 640,
          height: 180,
          data: { parts: d, shaded: 1, labelMode: 'none' },
        },
        solutionSteps: ['Count the shaded parts.', 'Count the total equal parts.', `So the fraction is 1/${d}.`],
      };
    }
    case 'F005': {
      const d = [2, 3, 4, 5, 6, 8][Math.abs(s) % 6];
      const pos = seq(s + 2, 1, d - 1);
      return {
        prompt: `On a number line from 0 to 1 divided into ${d} equal parts, what fraction is at the ${ordinalWord(pos)} mark after 0?`,
        answer: answerPayloadFraction(pos, d),
        acceptedAnswers: [`${pos}/${d}`],
        diagramSpec: {
          type: 'number_line',
          width: 640,
          height: 180,
          data: {
            min: 0,
            max: 1,
            minStepCount: d,
            points: [{ value: pos / d, label: '?' }],
            endpointLabels: ['0', '1'],
          },
        },
        solutionSteps: ['Each mark is one equal part.', `The ${pos}th mark is ${pos}/${d}.`],
      };
    }
    case 'F006': {
      const a = seq(s, 2, 9);
      const b = distinctSeq(s + 5, 2, 9, a);
      const relation = a < b ? '>' : '<';
      return {
        prompt: `Which is greater: 1/${a} or 1/${b}?`,
        answer: { type: 'text', value: relation, display: relation },
        acceptedAnswers: [relation],
        solutionSteps: ['For unit fractions, smaller denominator means larger value.', `So the sign is "${relation}".`],
      };
    }
    case 'F007': {
      const d = seq(s, 3, 12);
      const a = seq(s + 1, 1, d - 1);
      const b = distinctSeq(s + 4, 1, d - 1, a);
      const greater = a > b ? '>' : '<';
      return {
        prompt: `Which is greater: ${a}/${d} or ${b}/${d}?`,
        answer: { type: 'text', value: greater, display: greater },
        acceptedAnswers: [greater],
        solutionSteps: ['Denominators are equal.', 'Compare numerators directly.', `The symbol is "${greater}".`],
      };
    }
    case 'F008': {
      const n = seq(s, 1, 6);
      const a = seq(s + 2, n + 1, 12);
      const b = distinctSeq(s + 5, n + 1, 12, a);
      const greater = a < b ? '>' : '<';
      return {
        prompt: `Which is greater: ${n}/${a} or ${n}/${b}?`,
        answer: { type: 'text', value: greater, display: greater },
        acceptedAnswers: [greater],
        solutionSteps: ['Numerators are equal.', 'Smaller denominator gives larger fraction.', `The symbol is "${greater}".`],
      };
    }
    case 'F009': {
      const triples = [
        [frac(1, 4), frac(1, 2), frac(3, 4)],
        [frac(1, 3), frac(1, 2), frac(2, 3)],
        [frac(2, 5), frac(1, 2), frac(4, 5)],
        [frac(3, 8), frac(1, 4), frac(5, 8)],
        [frac(2, 3), frac(1, 6), frac(1, 2)],
      ];
      const picked = triples[Math.abs(s) % triples.length];
      const sortedFractions = [...picked].sort((x, y) => compareFractions(x, y));
      const shown = ensureNotAlreadySorted(deterministicShuffle(picked, s), sortedFractions);
      const arr = sortedFractions.map(fracStr);
      return {
        prompt: `Order these fractions from smallest to largest: ${shown.map(fracStr).join(', ')}.`,
        answer: { type: 'list', value: arr, display: arr.join(', ') },
        acceptedAnswers: [arr.join(','), arr.join(', ')],
        solutionSteps: ['Convert to comparable values (or common denominator).', `Order: ${arr.join(', ')}.`],
      };
    }
    case 'F010': {
      const n = seq(s, 1, 5);
      const d = seq(s + 5, n + 1, 9);
      const k = [2, 3, 4][Math.abs(s) % 3];
      return {
        prompt: `Complete: ${n}/${d} = ?/${d * k}`,
        answer: answerPayloadFraction(n * k, d * k),
        acceptedAnswers: [fracStr({ numerator: n * k, denominator: d * k })],
        solutionSteps: [`Multiply numerator and denominator by ${k}.`, `${n}/${d} = ${n * k}/${d * k}.`],
      };
    }
    case 'F011': {
      if (familyId.endsWith('_004')) {
        const d = seq(s, 3, 12);
        const a = seq(s + 1, 1, d - 1);
        const b = seq(s + 4, 1, d - 1);
        const relation = a === b ? '=' : (a > b ? '>' : '<');
        return {
          prompt: `Fill in the correct symbol: ${a}/${d} __ ${b}/${d}`,
          answer: { type: 'text', value: relation, display: relation },
          acceptedAnswers: [relation],
          solutionSteps: ['Denominators are the same, so compare numerators.', `Since ${a} ${relation} ${b}, the symbol is "${relation}".`],
        };
      }
      if (familyId.endsWith('_005')) {
        const d = seq(s, 4, 10);
        const a = seq(s + 1, 1, d - 1);
        const b = seq(s + 6, 1, d - 1);
        const greater = a > b ? '>' : (a < b ? '<' : '=');
        return {
          prompt: `A model shows ${a}/${d} and ${b}/${d}. Which fraction is greater (or equal if same)?`,
          answer: { type: 'text', value: greater, display: greater },
          acceptedAnswers: [greater],
          solutionSteps: ['Both fractions have equal-sized parts.', 'Compare the number of parts shaded.', `Answer: ${greater}.`],
        };
      }
      const n = seq(s, 1, 6);
      const d = seq(s + 6, n + 1, 12);
      const k = [2, 3][Math.abs(s) % 2];
      return {
        prompt: `Write one equivalent fraction for ${n}/${d}.`,
        answer: answerPayloadFraction(n * k, d * k),
        acceptedAnswers: [fracStr({ numerator: n * 2, denominator: d * 2 }), fracStr({ numerator: n * 3, denominator: d * 3 })],
        solutionSteps: ['Multiply numerator and denominator by the same number.', `One valid answer: ${n * k}/${d * k}.`],
      };
    }
    case 'F012': {
      if (familyId.endsWith('_004')) {
        const n = seq(s, 1, 6);
        const a = seq(s + 2, n + 1, 12);
        const b = seq(s + 7, n + 1, 12);
        const relation = a === b ? '=' : (a < b ? '>' : '<');
        return {
          prompt: `Fill in the correct symbol: ${n}/${a} __ ${n}/${b}`,
          answer: { type: 'text', value: relation, display: relation },
          acceptedAnswers: [relation],
          solutionSteps: ['Numerators are equal.', 'Smaller denominator means larger fraction.', `So the symbol is "${relation}".`],
        };
      }
      if (familyId.endsWith('_005')) {
        const n = seq(s, 1, 5);
        const a = seq(s + 1, n + 1, 10);
        const b = seq(s + 5, n + 1, 10);
        const greater = a <= b ? `${n}/${a}` : `${n}/${b}`;
        return {
          prompt: `Compare ${n}/${a} and ${n}/${b}. Which fraction is larger?`,
          answer: { type: 'text', value: greater, display: greater },
          acceptedAnswers: [greater],
          solutionSteps: ['Same numerator means same number of parts selected.', 'Larger part size comes from smaller denominator.', `Answer: ${greater}.`],
        };
      }
      const g = [2, 3, 4][Math.abs(s) % 3];
      const n = seq(s, 2, 8) * g;
      const d = seq(s + 5, n / g + 1, 12) * g;
      const simp = simplifyFraction(n, d);
      return {
        prompt: `Simplify ${n}/${d} to lowest terms.`,
        answer: answerPayloadFraction(simp.numerator, simp.denominator),
        acceptedAnswers: [fracStr(simp)],
        solutionSteps: ['Find the greatest common factor.', `Divide numerator and denominator by ${gcd(n, d)}.`],
      };
    }
    case 'F013': {
      const d = seq(s, 2, 8);
      const n = seq(s + 3, d + 1, d * 3);
      return {
        prompt: `Write ${n}/${d} as a mixed number.`,
        answer: (() => { const m = toMixed({ numerator: n, denominator: d }); return answerPayloadMixed(m.whole, m.numerator, m.denominator); })(),
        acceptedAnswers: [mixedStr(toMixed({ numerator: n, denominator: d })), fracStr({ numerator: n, denominator: d })],
        solutionSteps: ['Divide numerator by denominator.', 'Use quotient as whole part and remainder as numerator.'],
      };
    }
    case 'F014': {
      const w = seq(s, 1, 5); const n = seq(s + 3, 1, 5); const d = seq(s + 5, n + 1, 8);
      const imp = frac(w * d + n, d);
      return {
        prompt: `Convert the mixed number ${w} ${n}/${d} to an improper fraction.`,
        answer: answerPayloadFraction(imp.numerator, imp.denominator),
        acceptedAnswers: [fracStr(imp)],
        solutionSteps: [`Multiply ${w} × ${d} and add ${n}.`, `Write the result over ${d}: ${imp.numerator}/${imp.denominator}.`],
        allowedInputTools: ['fraction', 'clear'],
      };
    }
    case 'F015': {
      if (familyId.endsWith('_004') || familyId.endsWith('_005')) {
        const d = seq(s, 3, 10);
        const a = seq(s + 2, 1, d - 1);
        const b = seq(s + 6, 1, d - 1);
        const ans = frac(a + b, d);
        return {
          prompt: `Add and simplify if needed: ${a}/${d} + ${b}/${d}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Keep denominator the same.', `Add numerators: ${a} + ${b} = ${a + b}.`, `Simplify to ${fracStr(ans)} if possible.`],
        };
      }
      const d = seq(s, 2, 8); const w = seq(s + 2, 1, 4); const n = seq(s + 5, 1, d - 1);
      const imp = frac(w * d + n, d);
      return {
        prompt: `Convert ${w} ${n}/${d} to an improper fraction.`,
        answer: answerPayloadFraction(imp.numerator, imp.denominator),
        acceptedAnswers: [fracStr(imp)],
        solutionSteps: [`Multiply ${w} × ${d} and add ${n}.`, `Result: ${imp.numerator}/${imp.denominator}.`],
      };
    }
    case 'F016': {
      const d = seq(s, 3, 12); const a = seq(s + 1, 1, d - 1); const b = seq(s + 4, 1, d - 1);
      const ans = frac(a + b, d);
      return {
        prompt: `Compute: ${a}/${d} + ${b}/${d}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Keep denominator the same.', `Add numerators: ${a}+${b}=${a + b}.`, `Answer: ${fracStr(ans)}.`],
      };
    }
    case 'F017': {
      if (familyId.endsWith('_004')) {
        const d = seq(s, 4, 12); const b = seq(s + 1, 1, d - 2); const a = seq(s + 5, b + 1, d - 1);
        const ans = frac(a - b, d);
        return {
          prompt: `Compute: ${a}/${d} - ${b}/${d}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Use the same denominator.', `Subtract numerators: ${a} - ${b} = ${a - b}.`, `Answer: ${fracStr(ans)}.`],
        };
      }
      const d = seq(s, 4, 12); const b = seq(s + 1, 1, d - 2); const a = seq(s + 5, b + 1, d - 1);
      const ans = frac(a - b, d);
      return {
        prompt: `Compute: ${a}/${d} - ${b}/${d}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Keep denominator the same.', `Subtract numerators: ${a}-${b}=${a - b}.`, `Answer: ${fracStr(ans)}.`],
      };
    }
    case 'F018': {
      if (familyId.endsWith('_005')) {
        const [a, b] = orderedSubtractionPair(
          frac(seq(s, 1, 4), 2 + (Math.abs(s) % 4)),
          frac(seq(s + 7, 1, 4), 3 + (Math.abs(s + 2) % 4))
        );
        const cd = lcm(a.denominator, b.denominator);
        const ans = frac(a.numerator * (cd / a.denominator) - b.numerator * (cd / b.denominator), cd);
        return {
          prompt: `Compute: ${fracStr(a)} - ${fracStr(b)}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Find a common denominator.', `Convert fractions to denominator ${cd}.`, `Subtract numerators and simplify to ${fracStr(ans)}.`],
        };
      }
      if (familyId.endsWith('_006')) {
        const [a, b] = orderedSubtractionPair(
          frac(seq(s, 2, 6), 3 + (Math.abs(s) % 4)),
          frac(seq(s + 4, 1, 5), 2 + (Math.abs(s + 1) % 4))
        );
        const cd = lcm(a.denominator, b.denominator);
        const ans = frac(a.numerator * (cd / a.denominator) - b.numerator * (cd / b.denominator), cd);
        return {
          prompt: `Compute and write in lowest terms: ${fracStr(a)} - ${fracStr(b)}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Find the least common denominator.', `Convert both fractions to denominator ${cd}.`, `Subtract numerators and simplify to ${fracStr(ans)}.`],
        };
      }
      const a = frac(seq(s, 1, 4), 2 + (Math.abs(s) % 4));
      const b = frac(seq(s + 7, 1, 4), 3 + (Math.abs(s + 2) % 4));
      const cd = lcm(a.denominator, b.denominator);
      const ans = frac(a.numerator * (cd / a.denominator) + b.numerator * (cd / b.denominator), cd);
      return {
        prompt: `Compute: ${fracStr(a)} + ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Find a common denominator.', `Convert fractions to denominator ${cd}.`, `Add numerators and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F019': {
      const [a, b] = orderedSubtractionPair(
        frac(seq(s, 2, 6), 3 + (Math.abs(s) % 5)),
        frac(seq(s + 3, 1, 5), 2 + (Math.abs(s + 1) % 5))
      );
      const cd = lcm(a.denominator, b.denominator);
      const ans = frac(a.numerator * (cd / a.denominator) - b.numerator * (cd / b.denominator), cd);
      return {
        prompt: `Compute: ${fracStr(a)} - ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Find a common denominator.', `Convert both fractions to denominator ${cd}.`, `Subtract and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F020': {
      const d = [2, 3, 4, 5, 8][Math.abs(s) % 5];
      const n = seq(s + 3, 1, d - 1);
      const base = seq(s + 5, 2, 12);
      const qty = base * d;
      const ans = (qty / d) * n;
      return {
        prompt: `Find ${n}/${d} of ${qty}.`,
        answer: answerPayloadWhole(ans),
        acceptedAnswers: [String(ans)],
        solutionSteps: [`Find 1/${d} of ${qty}: ${qty / d}.`, `Multiply by ${n}: ${ans}.`],
      };
    }
    case 'F021': {
      if (familyId.endsWith('_005')) {
        const a = frac(seq(s, 1, 4), [2, 4, 5, 8][Math.abs(s) % 4]);
        const decimal = ['0.5', '0.25', '0.2'][Math.abs(s + 3) % 3];
        const b = decimal === '0.5' ? frac(1, 2) : decimal === '0.25' ? frac(1, 4) : frac(1, 5);
        const ans = frac(a.numerator * b.numerator, a.denominator * b.denominator);
        return {
          prompt: `Compute and give your answer as a simplified fraction: ${fracStr(a)} × ${decimal}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: [`Convert ${decimal} to ${fracStr(b)}.`, `Multiply fractions and simplify to ${fracStr(ans)}.`],
        };
      }
      if (variant % 2 === 0) {
        const a = frac(seq(s, 1, 5), seq(s + 2, 2, 8));
        const w = seq(s + 4, 2, 6);
        const ans = frac(a.numerator * w, a.denominator);
        return {
          prompt: `Compute: ${fracStr(a)} × ${w}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Multiply numerator by whole number.', `Simplify to ${fracStr(ans)}.`],
        };
      }
      const a = frac(seq(s, 1, 4), seq(s + 2, 2, 8));
      const b = frac(seq(s + 5, 1, 4), seq(s + 7, 2, 8));
      const ans = frac(a.numerator * b.numerator, a.denominator * b.denominator);
      return {
        prompt: `Compute: ${fracStr(a)} × ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Multiply numerators.', 'Multiply denominators.', `Simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F022': {
      if (familyId.endsWith('_005')) {
        const a = frac(seq(s, 1, 5), seq(s + 2, 2, 8));
        const b = frac(seq(s + 4, 1, 4), seq(s + 6, 2, 8));
        const ans = frac(a.numerator * b.denominator, a.denominator * b.numerator);
        return {
          prompt: `Compute: (${fracStr(a)}) ÷ ${fracStr(b)}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Keep the first fraction.', 'Invert the second fraction.', `Multiply and simplify to ${fracStr(ans)}.`],
        };
      }
      const a = frac(seq(s, 1, 5), seq(s + 2, 2, 8));
      const b = frac(seq(s + 4, 1, 4), seq(s + 6, 2, 8));
      const ans = frac(a.numerator * b.denominator, a.denominator * b.numerator);
      return {
        prompt: `Compute: ${fracStr(a)} ÷ ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Keep the first fraction.', 'Invert the second fraction.', `Multiply and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F023': {
      if (familyId.endsWith('_005')) {
        const a = frac([1, 2, 3][Math.abs(s) % 3], [2, 4, 5][Math.abs(s + 2) % 3]);
        const b = frac([1, 2, 3][Math.abs(s + 3) % 3], [2, 5, 10][Math.abs(s + 4) % 3]);
        const ratioValue = frac(a.numerator * b.denominator, a.denominator * b.numerator);
        return {
          prompt: `In the ratio A:B = ${fracStr(a)} : ${fracStr(b)}, find A/B as a simplified fraction.`,
          answer: answerPayloadFraction(ratioValue.numerator, ratioValue.denominator),
          acceptedAnswers: [fracStr(ratioValue)],
          solutionSteps: ['A/B equals first term divided by second term.', `${fracStr(a)} ÷ ${fracStr(b)} = ${fracStr(ratioValue)}.`],
        };
      }
      if (familyId.endsWith('_006')) {
        const groups = seq(s, 3, 9);
        const perGroup = seq(s + 2, 2, 8);
        const total = groups * perGroup;
        const n = [1, 2, 3][Math.abs(s + 5) % 3];
        const d = [2, 3, 4][Math.abs(s + 7) % 3];
        const scaledTotal = total * d;
        const ans = (scaledTotal / d) * n;
        return {
          prompt: `A set has ${scaledTotal} items. Find ${n}/${d} of the set.`,
          answer: answerPayloadWhole(ans),
          acceptedAnswers: [String(ans)],
          solutionSteps: [`Find 1/${d} of ${scaledTotal}: ${scaledTotal / d}.`, `Multiply by ${n}: ${ans}.`],
        };
      }
      const used = frac(1, [2, 3, 4][Math.abs(s) % 3]);
      const { total, final, steps } = sequentialWholeCountTotal(s, 20, 60, [used]);
      const firstStep = steps[0];
      return {
        prompt: `A student used ${fracStr(used)} of a worksheet with ${total} questions. How many questions are left?`,
        answer: answerPayloadWhole(final),
        acceptedAnswers: [String(final)],
        solutionSteps: [
          `Used questions = ${fracStr(used)} of ${total} = ${firstStep.amount}.`,
          `Subtract from ${total}: ${total} - ${firstStep.amount} = ${final}.`,
        ],
      };
    }
    case 'F024': {
      const f1 = frac(1, [2, 3, 4][Math.abs(s) % 3]);
      const f2 = frac(1, [2, 3, 4][Math.abs(s + 2) % 3]);
      const { total, final, steps } = sequentialWholeCountTotal(s, 24, 72, [f1, f2]);
      return {
        prompt: `A class completed ${fracStr(f1)} of ${total} problems, then ${fracStr(f2)} of the remainder. How many problems are still unfinished?`,
        answer: answerPayloadWhole(final),
        acceptedAnswers: [String(final)],
        solutionSteps: [
          `First completed: ${fracStr(f1)} of ${total} = ${steps[0].amount}.`,
          `Remainder: ${steps[0].remaining}.`,
          `Then completed: ${fracStr(f2)} of ${steps[0].remaining} = ${steps[1].amount}.`,
          `Final unfinished = ${final}.`,
        ],
      };
    }
    case 'F025': {
      if (familyId.endsWith('_005')) {
        const p = [10, 20, 25, 40, 50, 75][Math.abs(s) % 6];
        const askFraction = variant % 2 === 0;
        const f = simplifyFraction(p, 100);
        const dec = p / 100;
        return {
          prompt: askFraction
            ? `Express ${p}% as a fraction in simplest form.`
            : `Express ${p}% as a decimal.`,
          answer: askFraction ? answerPayloadFraction(f.numerator, f.denominator) : { type: 'decimal', value: dec, display: String(dec) },
          acceptedAnswers: askFraction ? [fracStr(f)] : [String(dec)],
          solutionSteps: ['Percent means out of 100.', askFraction ? `${p}/100 simplifies to ${fracStr(f)}.` : `${p}/100 = ${dec}.`],
        };
      }
      const a = frac(seq(s, 1, 4), 6);
      const b = frac(seq(s + 3, 1, 5), 8);
      const c = frac(seq(s + 5, 1, 3), 12);
      const ans = frac(a.numerator * lcm(lcm(a.denominator, b.denominator), c.denominator) / a.denominator +
        b.numerator * lcm(lcm(a.denominator, b.denominator), c.denominator) / b.denominator -
        c.numerator * lcm(lcm(a.denominator, b.denominator), c.denominator) / c.denominator,
        lcm(lcm(a.denominator, b.denominator), c.denominator));
      return {
        prompt: `Exam-style: Compute ${fracStr(a)} + ${fracStr(b)} - ${fracStr(c)}.`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Find common denominator for all fractions.', 'Convert each fraction.', `Compute and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F026': {
      if (familyId.endsWith('_005')) {
        const y = seq(s, 2, 12);
        const asFraction = frac(3 + y, 5);
        if (variant % 2 === 0) {
          return {
            prompt: `If y = ${y}, evaluate (3 + y)/5 as a simplified fraction.`,
            answer: answerPayloadFraction(asFraction.numerator, asFraction.denominator),
            acceptedAnswers: [fracStr(asFraction)],
            solutionSteps: [`Substitute y = ${y}.`, `Compute 3 + ${y} = ${3 + y}.`, `Result is ${fracStr(asFraction)}.`],
          };
        }
        return {
          prompt: `Rewrite ${y} ÷ 5 in fraction form.`,
          answer: answerPayloadFraction(y, 5),
          acceptedAnswers: [`${y}/5`],
          solutionSteps: ['Division can be written as a fraction.', `${y} ÷ 5 = ${y}/5.`],
        };
      }
      const f = frac([1, 2, 3][Math.abs(s) % 3], [3, 4, 5][Math.abs(s + 1) % 3]);
      const total = multipleInRange(s, 30, 90, f.denominator);
      const ans = (total * f.numerator) / f.denominator;
      return {
        prompt: `Mastery challenge: ${fracStr(f)} of ${total} students passed. How many students passed?`,
        answer: answerPayloadWhole(ans),
        acceptedAnswers: [String(ans)],
        solutionSteps: [`Find 1/${f.denominator} of ${total}.`, `Multiply by ${f.numerator} to get ${ans}.`],
      };
    }
    default: {
      return {
        prompt: 'Placeholder fraction question.',
        answer: answerPayloadWhole(0),
        acceptedAnswers: ['0'],
        solutionSteps: ['Placeholder step.'],
      };
    }
  }
}

export function generateFractionQuestion(options = {}) {
  const {
    skillId,
    questionFamilyId,
    difficulty = 2,
    mode = 'practice',
    variant = 0,
  } = options;
  if (!getSkill(skillId)) throw new Error(`Invalid skillId: ${skillId}`);
  const family = getQuestionFamily(questionFamilyId);
  if (!family) throw new Error(`Invalid questionFamilyId: ${questionFamilyId}`);

  const ctx = templateContext(skillId, questionFamilyId, difficulty, mode, variant);
  const payload = templateForSkill(skillId, variant % 3, ctx);
  const workingRequired = shouldRequireWorkingForGeneratedQuestion(skillId, mode, family);

  return buildQuestionCore({
    skillId,
    questionFamilyId,
    mode,
    difficulty,
    prompt: payload.prompt,
    answer: payload.answer,
    acceptedAnswers: payload.acceptedAnswers,
    allowedInputTools: payload.allowedInputTools,
    workingRequired,
    mentalMathEligible: !!family.mentalMathEligible,
    solutionSteps: payload.solutionSteps,
    diagramSpec: payload.diagramSpec,
  });
}

export function generateFractionQuestionSet(options = {}) {
  const {
    skillId,
    questionFamilyIds = [],
    count = 5,
    mode = 'practice',
    difficulty = 2,
  } = options;
  const ids = questionFamilyIds.length ? questionFamilyIds : getQuestionFamiliesBySkill(skillId).map((f) => f.id);
  if (!ids.length) return [];
  return Array.from({ length: count }).map((_, i) =>
    generateFractionQuestion({
      skillId,
      questionFamilyId: ids[i % ids.length],
      difficulty,
      mode,
      variant: i,
    })
  );
}

export function generateDiagnosticQuestionSet(options = {}) {
  const { targetSkillIds = [], targetQuestionFamilyIds = [], mode = 'diagnostic' } = options;
  const bySkill = new Map();
  targetQuestionFamilyIds.forEach((qid) => {
    const f = getQuestionFamily(qid);
    if (!f) return;
    if (!bySkill.has(f.skillId)) bySkill.set(f.skillId, []);
    bySkill.get(f.skillId).push(qid);
  });
  const skills = targetSkillIds.length ? targetSkillIds : [...bySkill.keys()];
  return skills.flatMap((skillId, i) =>
    generateFractionQuestionSet({
      skillId,
      questionFamilyIds: bySkill.get(skillId) || getQuestionFamiliesBySkill(skillId).slice(0, 2).map((f) => f.id),
      count: 2,
      mode,
      difficulty: 2 + (i % 2),
    })
  );
}

export function generatePracticeQuestionSet(options = {}) {
  const { practiceQueue = [], count = 8 } = options;
  if (!practiceQueue.length) return [];
  const out = [];
  const seenSignatures = new Set();
  // Distinct variant seed per generation attempt so a regeneration produces a
  // genuinely different question rather than the same deterministic output.
  let variantSeed = 0;
  const MAX_VARIANT_ATTEMPTS = 8;

  for (let i = 0; i < count; i += 1) {
    const row = practiceQueue[i % practiceQueue.length];
    const familyIds = row.questionFamilyIds || (row.questionFamilyId ? [row.questionFamilyId] : []);
    if (!familyIds.length) continue;
    const familyId = familyIds[i % familyIds.length];

    let chosen = null;
    let fallback = null;
    // Try several variants; accept the first whose rendered signature has not
    // already been served this session. This dedupes by what the student actually
    // sees (prompt + operands + answer), not just questionId/family — so the same
    // sum cannot appear repeatedly under different family labels.
    for (let attempt = 0; attempt < MAX_VARIANT_ATTEMPTS; attempt += 1) {
      variantSeed += 1;
      let candidate;
      try {
        candidate = generateFractionQuestion({
          skillId: row.skillId,
          questionFamilyId: familyId,
          difficulty: 2,
          mode: 'practice',
          variant: variantSeed,
        });
      } catch (err) {
        continue;
      }
      if (!candidate) continue;
      fallback = candidate;
      const signature = renderedQuestionSignature(candidate);
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        chosen = candidate;
        break;
      }
    }

    // If every attempt collided (very small operand space), keep the last generated
    // question so the session still has its full length rather than dropping items.
    const selected = chosen || fallback;
    if (selected) out.push(selected);
  }
  return out;
}

export function generateFluencyQuestionSet(options = {}) {
  const { skillId, questionFamilyId, count = 10 } = options;
  return generateFractionQuestionSet({
    skillId,
    questionFamilyIds: [questionFamilyId],
    count,
    mode: 'fluency',
    difficulty: 1,
  }).map((q) => ({ ...q, estimatedSeconds: Math.max(6, q.estimatedSeconds - 5), marks: 1 }));
}

export function generateAssessmentQuestionSet(options = {}) {
  const { assessmentSession, count = 12 } = options;
  const families = assessmentSession?.targetQuestionFamilyIds || [];
  const skills = assessmentSession?.targetSkillIds || [];
  if (!skills.length || !families.length) return [];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const skillId = skills[i % skills.length];
    const familyId = families.find((fid) => getQuestionFamily(fid)?.skillId === skillId) || families[i % families.length];
    let generated = null;
    for (let attempt = 0; attempt < 4 && !generated; attempt += 1) {
      try {
        generated = generateFractionQuestion({
          skillId,
          questionFamilyId: familyId,
          difficulty: 2 + (i % 3),
          mode: 'assessment',
          variant: i + attempt * count,
        });
      } catch (err) {
        if (!/denominator/i.test(String(err?.message || ''))) throw err;
      }
    }
    if (generated?.assessmentEligible === true) out.push(generated);
  }
  return out.map((q) => ({ ...q, marks: q.marks || 2 }));
}

export function checkFractionAnswer(options = {}) {
  const { studentAnswer, correctAnswer, acceptedAnswers = [] } = options;
  const normalizeListAnswer = (raw) => String(raw || '')
    .split(',')
    .map((part) => part.trim().replace(/\s+/g, ''))
    .filter(Boolean)
    .join(',');

  if (correctAnswer?.type === 'list') {
    const normalizedStudent = normalizeListAnswer(studentAnswer);
    const normalizedAccepted = [
      correctAnswer.display,
      ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : []),
    ].map(normalizeListAnswer);
    return {
      correct: normalizedAccepted.includes(normalizedStudent),
      normalizedStudentAnswer: normalizedStudent || null,
      normalizedCorrectAnswer: normalizeListAnswer(correctAnswer.display),
    };
  }

  const parsedStudent = parseAnswer(studentAnswer);
  const parsedCorrect = typeof correctAnswer === 'string'
    ? parseAnswer(correctAnswer)
    : correctAnswer?.type === 'fraction'
      ? parseAnswer(correctAnswer.display || `${correctAnswer.numerator}/${correctAnswer.denominator}`)
      : correctAnswer?.type === 'whole'
        ? parseAnswer(String(correctAnswer.whole))
        : correctAnswer?.type === 'mixed'
          ? parseAnswer(correctAnswer.display || `${correctAnswer.whole} ${correctAnswer.numerator}/${correctAnswer.denominator}`)
          : correctAnswer?.type === 'text'
            ? parseAnswer(correctAnswer.value || correctAnswer.display || '')
          : parseAnswer(String(correctAnswer?.display || correctAnswer || ''));

  const acceptedParsed = acceptedAnswers.map(parseAnswer).filter(Boolean);
  let correct = false;
  if (parsedStudent?.type === 'symbol' && parsedCorrect?.type === 'symbol') {
    const studentSymbol = String(parsedStudent.value || '').trim();
    const correctSymbol = String(parsedCorrect.value || '').trim();
    correct = studentSymbol === correctSymbol;
  } else if (parsedStudent && parsedCorrect && parsedStudent.fraction && parsedCorrect.fraction) {
    correct = parsedStudent.fraction.numerator * parsedCorrect.fraction.denominator ===
      parsedCorrect.fraction.numerator * parsedStudent.fraction.denominator;
  }
  if (!correct && parsedStudent) {
    if (parsedStudent.type === 'symbol') {
      const studentSymbol = String(parsedStudent.value || '').trim();
      correct = acceptedParsed.some((acc) => acc?.type === 'symbol' && String(acc.value || '').trim() === studentSymbol);
    } else {
      correct = acceptedParsed.some((acc) => {
        if (!acc || !acc.fraction || !parsedStudent.fraction) return false;
        return parsedStudent.fraction.numerator * acc.fraction.denominator ===
          acc.fraction.numerator * parsedStudent.fraction.denominator;
      });
      if (!correct) {
        const normalizedStudent = String(studentAnswer || '').trim().toLowerCase();
        const normalizedCorrect = String(correctAnswer?.display || correctAnswer || '').trim().toLowerCase();
        correct = Boolean(normalizedStudent && normalizedCorrect && normalizedStudent === normalizedCorrect);
      }
    }
  }
  return {
    correct,
    normalizedStudentAnswer: parsedStudent
      ? parsedStudent.type === 'symbol'
        ? parsedStudent.value
        : parsedStudent.fraction ? fracStr(parsedStudent.fraction) : null
      : null,
    normalizedCorrectAnswer: parsedCorrect
      ? parsedCorrect.type === 'symbol'
        ? parsedCorrect.value
        : parsedCorrect.fraction ? fracStr(parsedCorrect.fraction) : null
      : null,
  };
}

export function validateFractionQuestionGenerator() {
  const skills = fractionSkillGraph.skillIds;
  const generatedBySkill = skills.map((skillId) => {
    const families = getQuestionFamiliesBySkill(skillId).slice(0, 3).map((f) => f.id);
    const set = generateFractionQuestionSet({ skillId, questionFamilyIds: families, count: 3, mode: 'practice' });
    return { skillId, set };
  });
  const allQuestions = generatedBySkill.flatMap((x) => x.set);

  const hasAllSkills = generatedBySkill.every((x) => x.set.length >= 3);
  const validSkillIds = allQuestions.every((q) => !!getSkill(q.skillId));
  const validFamilyIds = allQuestions.every((q) => !!getQuestionFamily(q.questionFamilyId));
  const hasAnswer = allQuestions.every((q) => q.answer && q.acceptedAnswers?.length);
  const hasSolutionSteps = allQuestions.every((q) => Array.isArray(q.solutionSteps) && q.solutionSteps.length > 0);
  const workingRuleCorrect = allQuestions.every((q) => {
    const f = getQuestionFamily(q.questionFamilyId);
    return f ? q.workingRequired === shouldRequireWorkingForGeneratedQuestion(q.skillId, q.questionCategory, f) : false;
  });
  const mentalRuleCorrect = allQuestions
    .filter((q) => getQuestionFamily(q.questionFamilyId)?.mentalMathEligible)
    .every((q) => {
      const f = getQuestionFamily(q.questionFamilyId);
      return q.workingRequired === shouldRequireWorkingForGeneratedQuestion(q.skillId, q.questionCategory, f);
    });
  const answerCheckFraction = checkFractionAnswer({ studentAnswer: '2/4', correctAnswer: '1/2', acceptedAnswers: [] }).correct;
  const answerCheckMixed = checkFractionAnswer({ studentAnswer: '1 2/3', correctAnswer: '5/3', acceptedAnswers: [] }).correct;
  const answerCheckWhole = checkFractionAnswer({ studentAnswer: '4', correctAnswer: '4', acceptedAnswers: [] }).correct;
  const assessmentHasMarks = generateAssessmentQuestionSet({
    assessmentSession: {
      targetSkillIds: ['F010', 'F018'],
      targetQuestionFamilyIds: ['QF_F010_001', 'QF_F018_001'],
    },
    count: 4,
  }).every((q) => q.marks > 0);
  const noZeroDenominator = allQuestions.every((q) => {
    const as = JSON.stringify(q.answer);
    return !/"denominator":0/.test(as);
  });

  return {
    isValid:
      hasAllSkills &&
      validSkillIds &&
      validFamilyIds &&
      hasAnswer &&
      hasSolutionSteps &&
      workingRuleCorrect &&
      mentalRuleCorrect &&
      answerCheckFraction &&
      answerCheckMixed &&
      answerCheckWhole &&
      assessmentHasMarks &&
      noZeroDenominator,
    checks: {
      hasAllSkills,
      validSkillIds,
      validFamilyIds,
      hasAnswer,
      hasSolutionSteps,
      workingRuleCorrect,
      mentalRuleCorrect,
      answerCheckFraction,
      answerCheckMixed,
      answerCheckWhole,
      assessmentHasMarks,
      noZeroDenominator,
    },
    sampleQuestions: {
      F001: generateFractionQuestion({ skillId: 'F001', questionFamilyId: 'QF_F001_001', difficulty: 1, mode: 'practice' }),
      F010: generateFractionQuestion({ skillId: 'F010', questionFamilyId: 'QF_F010_001', difficulty: 2, mode: 'practice' }),
      F018: generateFractionQuestion({ skillId: 'F018', questionFamilyId: 'QF_F018_001', difficulty: 3, mode: 'practice' }),
      F022: generateFractionQuestion({ skillId: 'F022', questionFamilyId: 'QF_F022_001', difficulty: 4, mode: 'assessment' }),
      F025: generateFractionQuestion({ skillId: 'F025', questionFamilyId: 'QF_F025_001', difficulty: 4, mode: 'assessment' }),
    },
  };
}

export const fractionQuestionGenerator = {
  generateFractionQuestion,
  generateFractionQuestionSet,
  generateDiagnosticQuestionSet,
  generatePracticeQuestionSet,
  generateFluencyQuestionSet,
  generateAssessmentQuestionSet,
  checkFractionAnswer,
  validateFractionQuestionGenerator,
};

export default fractionQuestionGenerator;
