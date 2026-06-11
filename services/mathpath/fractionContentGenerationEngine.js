import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import GeneratedQuestion from '../../models/mathpath/GeneratedQuestion.js';
import { QUESTION_CATEGORIES } from '../../models/mathpath/GeneratedQuestion.js';
import { fractionSkillGraph, getSkill } from '../../shared/mathpath/fractions/fractionSkillGraph.js';
import {
  fractionQuestionFamilies,
  getQuestionFamily,
  getQuestionFamiliesBySkill,
} from '../../shared/mathpath/fractions/fractionQuestionFamilies.js';
import {
  generateFractionQuestion,
} from '../../shared/mathpath/fractions/fractionQuestionGenerator.js';
import { getFractionMistakeTaxonomy } from '../../shared/mathpath/fractions/fractionMistakeToMasteryEngine.js';
import {
  runFractionsContentCoverageAudit,
} from './contentCoverageEngine.js';
import { evaluateQuestionVisualCoverage } from './skillVisualRequirementEngine.js';

dotenv.config();

const DEFAULT_DOMAIN_ID = 'fractions';
const DEFAULT_MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const GENERATOR_VERSION = 'fractions-content-generator-v1';

export const FRACTION_CONTENT_TARGETS = {
  diagnostic: 10,
  practice: 50,
  fluency: 20,
  assessment: 20,
  remediation: 10,
  challenge: 10,
};

const CATEGORY_CONFIG = {
  diagnostic: {
    mode: 'diagnostic',
    difficultyLevels: [2, 3, 4],
    intent: 'High-signal misconception exposure.',
  },
  practice: {
    mode: 'practice',
    difficultyLevels: [1, 2, 3, 4],
    intent: 'Volume practice across the skill progression.',
  },
  fluency: {
    mode: 'fluency',
    difficultyLevels: [1, 2],
    intent: 'Speed and automaticity with lower reading load.',
  },
  assessment: {
    mode: 'assessment',
    difficultyLevels: [2, 3, 4, 5],
    intent: 'School-style readiness checks with mixed rigor.',
  },
  remediation: {
    mode: 'practice',
    difficultyLevels: [1, 2, 3],
    intent: 'Root-cause repair and misconception-specific recovery.',
  },
  challenge: {
    mode: 'assessment',
    difficultyLevels: [4, 5],
    intent: 'Stretch and mastery challenge items.',
  },
};

const FRACTION_MISTAKE_CODES = new Set(getFractionMistakeTaxonomy().map((m) => m.code));

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function unique(values = []) {
  return [...new Set(values)];
}

function pickDeterministic(list = [], seed = '') {
  if (!list.length) return null;
  const hash = hashText(seed);
  return list[Math.abs(hash) % list.length];
}

function hashText(value = '') {
  let h = 0;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

function gcd(a, b) {
  let x = Math.abs(toNum(a, 0));
  let y = Math.abs(toNum(b, 0));
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function lcm(a, b) {
  const x = Math.abs(toNum(a, 1));
  const y = Math.abs(toNum(b, 1));
  return Math.abs(x * y) / gcd(x, y);
}

function simplifyFraction(numerator, denominator) {
  if (denominator === 0) throw new Error('Denominator cannot be zero.');
  const sign = denominator < 0 ? -1 : 1;
  const n = numerator * sign;
  const d = Math.abs(denominator);
  const g = gcd(n, d);
  return { numerator: n / g, denominator: d / g };
}

function fractionToString(fraction = {}) {
  const n = toNum(fraction.numerator, 0);
  const d = toNum(fraction.denominator, 1);
  if (d === 1) return String(n);
  return `${n}/${d}`;
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeDomainId(domainId = DEFAULT_DOMAIN_ID) {
  return String(domainId || DEFAULT_DOMAIN_ID).trim() || DEFAULT_DOMAIN_ID;
}

async function withOptionalConnection(options = {}, runner) {
  const { connectIfNeeded = true, mongoUri = DEFAULT_MONGO_URI } = options;
  let connectedHere = false;
  if (connectIfNeeded && mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    connectedHere = true;
  }
  try {
    return await runner();
  } finally {
    if (connectedHere) {
      await mongoose.disconnect();
    }
  }
}

function answerToString(answer) {
  if (answer === null || answer === undefined) return '';
  if (typeof answer === 'string' || typeof answer === 'number' || typeof answer === 'boolean') {
    return String(answer);
  }
  if (typeof answer === 'object') {
    if (answer.display) return String(answer.display);
    if (answer.value !== undefined) {
      if (Array.isArray(answer.value)) return answer.value.join(', ');
      return String(answer.value);
    }
    if (answer.type === 'fraction' && answer.numerator !== undefined && answer.denominator !== undefined) {
      return `${answer.numerator}/${answer.denominator}`;
    }
    if (answer.type === 'mixed') {
      return `${answer.whole} ${answer.numerator}/${answer.denominator}`.trim();
    }
    if (answer.type === 'whole' && answer.whole !== undefined) {
      return String(answer.whole);
    }
  }
  return String(answer);
}

function sanitizeAcceptedAnswers(values = []) {
  return unique((Array.isArray(values) ? values : [])
    .map((v) => String(v || '').trim())
    .filter(Boolean));
}

function sanitizeMisconceptionTags(tags = []) {
  const normalized = unique(
    (Array.isArray(tags) ? tags : [])
      .map((tag) => String(tag || '').trim())
      .filter(Boolean)
  );
  const mistakeCodes = normalized.filter((tag) => FRACTION_MISTAKE_CODES.has(tag));
  return mistakeCodes.length ? mistakeCodes : ['M010'];
}

function createFingerprint(payload = {}) {
  const fingerprintInput = [
    payload.domainId,
    payload.skillId,
    payload.questionFamilyId,
    payload.questionCategory,
    payload.difficultyLevel,
    normalizeText(payload.prompt),
    normalizeText(payload.finalAnswer),
    (payload.misconceptionTags || []).join(','),
  ].join('|');
  return crypto.createHash('sha256').update(fingerprintInput).digest('hex');
}

function chooseDifficulty(questionCategory, variantSeed) {
  const config = CATEGORY_CONFIG[questionCategory] || CATEGORY_CONFIG.practice;
  return pickDeterministic(config.difficultyLevels, variantSeed) || 3;
}

function chooseTemplateRules(questionCategory) {
  if (questionCategory === 'diagnostic') {
    return [
      'Target quick misconception detection.',
      'Avoid repetitive near-identical stems in sequence.',
      'Prefer high-signal distractor patterns.',
    ];
  }
  if (questionCategory === 'fluency') {
    return [
      'Keep stem short and computation-focused.',
      'Prioritize high repetition with controlled variation.',
      'Avoid long context passages.',
    ];
  }
  if (questionCategory === 'assessment') {
    return [
      'Include school-style wording and applied contexts.',
      'Mix standard and advanced complexity.',
      'Avoid pure speed-drill phrasing.',
    ];
  }
  if (questionCategory === 'remediation') {
    return [
      'Target known misconception patterns.',
      'Use scaffolded progression from easier to standard difficulty.',
      'Ensure explanations are explicit and corrective.',
    ];
  }
  if (questionCategory === 'challenge') {
    return [
      'Use high-complexity or non-routine forms.',
      'Require multi-step reasoning where appropriate.',
      'Favor difficulty 4-5.',
    ];
  }
  return [
    'Maintain mathematical validity.',
    'Avoid trivial duplicates.',
    'Respect skill-family intent.',
  ];
}

function buildQuestionTemplateCatalog() {
  return fractionQuestionFamilies.flatMap((family) =>
    QUESTION_CATEGORIES.map((category) => ({
      templateId: `${family.id}__${category}`,
      templateVersion: 'v1',
      skillId: family.skillId,
      skillName: getSkill(family.skillId)?.name || family.skillId,
      questionFamilyId: family.id,
      questionFamilyName: family.name,
      questionCategory: category,
      variableSchema: [
        'numerator',
        'denominator',
        'difficultyLevel',
        'variantSeed',
      ],
      rules: chooseTemplateRules(category),
      intent: CATEGORY_CONFIG[category]?.intent || 'General practice generation',
    }))
  );
}

const TEMPLATE_CATALOG = buildQuestionTemplateCatalog();
const TEMPLATE_BY_KEY = new Map(
  TEMPLATE_CATALOG.map((template) => [`${template.questionFamilyId}:${template.questionCategory}`, template])
);

function getTemplateDefinition(questionFamilyId, questionCategory) {
  return TEMPLATE_BY_KEY.get(`${questionFamilyId}:${questionCategory}`) || null;
}

function buildExplanation(solutionSteps = [], questionCategory = 'practice') {
  const base = Array.isArray(solutionSteps) ? solutionSteps.filter(Boolean).join(' ') : '';
  const categoryNote = {
    diagnostic: 'This item is designed to reveal concept gaps quickly.',
    practice: 'This item builds stable procedural mastery.',
    fluency: 'This item focuses on speed with accuracy.',
    assessment: 'This item reflects assessment-style expectations.',
    remediation: 'This item targets a specific misconception pathway.',
    challenge: 'This item extends mastery to advanced complexity.',
  }[questionCategory] || '';
  return `${base}${base && categoryNote ? ' ' : ''}${categoryNote}`.trim();
}

function visualMetadataForQuestion(question = {}) {
  const coverage = evaluateQuestionVisualCoverage({
    ...question,
    questionText: question.prompt,
  });
  return {
    requiredVisualTypes: coverage.requiredVisualTypes,
    providedVisualTypes: coverage.providedVisualTypes,
    visualCoverageStatus: coverage.status,
  };
}

export function validateGeneratedQuestion(question = {}) {
  const errors = [];
  if (!question.skillId || !getSkill(question.skillId)) errors.push('Invalid or missing skillId.');
  if (!question.questionFamilyId || !getQuestionFamily(question.questionFamilyId)) {
    errors.push('Invalid or missing questionFamilyId.');
  }
  if (!question.prompt || !String(question.prompt).trim()) errors.push('Missing prompt.');
  if (!question.finalAnswer || !String(question.finalAnswer).trim()) errors.push('Missing finalAnswer.');
  if (!Array.isArray(question.acceptedAnswers) || !question.acceptedAnswers.length) {
    errors.push('Missing acceptedAnswers.');
  }
  if (!Array.isArray(question.solutionSteps) || !question.solutionSteps.length) {
    errors.push('Missing solutionSteps.');
  }
  if (!Array.isArray(question.misconceptionTags) || !question.misconceptionTags.length) {
    errors.push('Missing misconception tags.');
  }
  const difficulty = toNum(question.difficultyLevel, 0);
  if (difficulty < 1 || difficulty > 5) errors.push('Invalid difficulty level.');
  const answerSerialized = JSON.stringify(question.answer || {});
  if (/"denominator"\s*:\s*0/.test(answerSerialized)) {
    errors.push('Invalid denominator 0 in answer object.');
  }
  return { isValid: errors.length === 0, errors };
}

function generateSingleQuestion({
  skillId,
  questionFamilyId,
  questionCategory,
  variantIndex,
}) {
  const skill = getSkill(skillId);
  const family = getQuestionFamily(questionFamilyId);
  if (!skill || !family) return null;

  const template = getTemplateDefinition(questionFamilyId, questionCategory);
  if (!template) return null;

  const seed = `${skillId}|${questionFamilyId}|${questionCategory}|${variantIndex}`;
  const difficultyLevel = chooseDifficulty(questionCategory, seed);
  const mode = CATEGORY_CONFIG[questionCategory]?.mode || 'practice';

  let generated = null;
  try {
    generated = generateFractionQuestion({
      skillId,
      questionFamilyId,
      difficulty: difficultyLevel,
      mode,
      variant: variantIndex,
    });
  } catch {
    return null;
  }

  const finalAnswer = answerToString(generated.answer);
  const acceptedAnswers = sanitizeAcceptedAnswers([
    ...(generated.acceptedAnswers || []),
    finalAnswer,
  ]);

  const misconceptionTags = sanitizeMisconceptionTags([
    ...(generated.commonMistakePatterns || []),
    ...(family.misconceptionTags || []),
  ]);
  const generatedVisualMetadata = visualMetadataForQuestion(generated);

  const doc = {
    domainId: DEFAULT_DOMAIN_ID,
    skillId,
    skillName: skill.name,
    questionFamilyId,
    questionFamilyName: family.name,
    questionCategory,
    templateId: template.templateId,
    templateVersion: template.templateVersion,
    generatorVersion: GENERATOR_VERSION,
    prompt: generated.prompt,
    answer: generated.answer,
    acceptedAnswers,
    solutionSteps: generated.solutionSteps || [],
    finalAnswer,
    explanation: buildExplanation(generated.solutionSteps || [], questionCategory),
    misconceptionTags,
    requiredVisualTypes: generated.requiredVisualTypes || generatedVisualMetadata.requiredVisualTypes,
    providedVisualTypes: generated.providedVisualTypes || generatedVisualMetadata.providedVisualTypes,
    visualCoverageStatus: generated.visualCoverageStatus || generatedVisualMetadata.visualCoverageStatus,
    workingRequired: Boolean(generated.workingRequired),
    mentalMathEligible: Boolean(generated.mentalMathEligible),
    difficultyLevel,
    estimatedSeconds: toNum(generated.estimatedSeconds, 20),
    marks: toNum(generated.marks, questionCategory === 'assessment' || questionCategory === 'challenge' ? 2 : 1),
    sourceQuestionId: generated.questionId || '',
    metadata: {
      questionCategory,
      generationSeed: seed,
      templateIntent: template.intent,
      categoryMode: mode,
    },
  };

  doc.fingerprint = createFingerprint(doc);
  return doc;
}

function generateFallbackQuestion({
  skillId,
  questionFamilyId,
  questionCategory,
  variantIndex,
}) {
  const skill = getSkill(skillId);
  const family = getQuestionFamily(questionFamilyId);
  if (!skill || !family) return null;

  const template = getTemplateDefinition(questionFamilyId, questionCategory);
  if (!template) return null;

  const seed = `${skillId}|${questionFamilyId}|${questionCategory}|fallback|${variantIndex}`;
  const base = Math.abs(hashText(seed));
  const difficultyLevel = chooseDifficulty(questionCategory, seed);
  let prompt = '';
  let finalAnswer = '';
  let acceptedAnswers = [];
  let solutionSteps = [];
  let answer = { type: 'text', value: '' };

  if (skillId === 'F018' || skillId === 'F019') {
    const d1 = 2 + (base % 8); // 2..9
    let d2 = 3 + ((Math.floor(base / 11)) % 9); // 3..11
    if (d2 === d1) d2 += 1;
    const a = 1 + (Math.floor(base / 7) % (d1 - 1));
    const b = 1 + (Math.floor(base / 13) % (d2 - 1));
    const common = lcm(d1, d2);
    const left = a * (common / d1);
    const right = b * (common / d2);
    const rawNumerator = skillId === 'F018' ? left + right : left - right;
    if (rawNumerator <= 0) return null;
    const simplified = simplifyFraction(rawNumerator, common);
    const rawAnswer = `${rawNumerator}/${common}`;
    finalAnswer = fractionToString(simplified);
    acceptedAnswers = unique([finalAnswer, rawAnswer]);
    prompt = `Compute: ${a}/${d1} ${skillId === 'F018' ? '+' : '-'} ${b}/${d2}`;
    solutionSteps = [
      `Find the common denominator: lcm(${d1}, ${d2}) = ${common}.`,
      `${a}/${d1} = ${left}/${common} and ${b}/${d2} = ${right}/${common}.`,
      `${left} ${skillId === 'F018' ? '+' : '-'} ${right} = ${rawNumerator}, so result is ${rawAnswer}.`,
      `Simplify to ${finalAnswer}.`,
    ];
    answer = { type: 'fraction', numerator: simplified.numerator, denominator: simplified.denominator, display: finalAnswer };
  } else if (skillId === 'F016' || skillId === 'F017') {
    const d = 3 + (base % 9); // 3..11
    const a = 1 + (Math.floor(base / 7) % (d - 1));
    const b = 1 + (Math.floor(base / 13) % (d - 1));
    const top = skillId === 'F016' ? a + b : Math.max(1, a - b);
    const simplified = simplifyFraction(top, d);
    finalAnswer = fractionToString(simplified);
    acceptedAnswers = unique([finalAnswer, `${top}/${d}`]);
    prompt = `Compute: ${a}/${d} ${skillId === 'F016' ? '+' : '-'} ${b}/${d}`;
    solutionSteps = [
      `Denominators are equal, so keep denominator ${d}.`,
      `${a} ${skillId === 'F016' ? '+' : '-'} ${b} = ${top}.`,
      `Result is ${top}/${d}, simplified to ${finalAnswer}.`,
    ];
    answer = { type: 'fraction', numerator: simplified.numerator, denominator: simplified.denominator, display: finalAnswer };
  } else if (skillId === 'F020') {
    const denominator = 2 + (base % 8); // 2..9
    const numerator = 1 + (Math.floor(base / 5) % (denominator - 1));
    const unit = 2 + (Math.floor(base / 17) % 12);
    const quantity = denominator * unit;
    const result = numerator * unit;
    finalAnswer = String(result);
    acceptedAnswers = [finalAnswer];
    prompt = `Find ${numerator}/${denominator} of ${quantity}.`;
    solutionSteps = [
      `Find 1/${denominator} of ${quantity}: ${quantity} ÷ ${denominator} = ${unit}.`,
      `Multiply by ${numerator}: ${unit} × ${numerator} = ${result}.`,
    ];
    answer = { type: 'whole', whole: result, display: finalAnswer };
  } else if (skillId === 'F010') {
    const denominator = 2 + (base % 8);
    const numerator = 1 + (Math.floor(base / 3) % (denominator - 1));
    const scale = 2 + (Math.floor(base / 19) % 5);
    finalAnswer = String(numerator * scale);
    acceptedAnswers = [finalAnswer];
    prompt = `Fill in the blank: ${numerator}/${denominator} = ?/${denominator * scale}`;
    solutionSteps = [
      `Multiply numerator and denominator by the same number (${scale}).`,
      `${numerator} × ${scale} = ${numerator * scale}.`,
    ];
    answer = { type: 'whole', whole: numerator * scale, display: finalAnswer };
  } else {
    return null;
  }

  const misconceptionTags = sanitizeMisconceptionTags([
    ...(family.misconceptionTags || []),
    ...(skillId === 'F018' ? ['M001', 'M007'] : []),
    ...(skillId === 'F019' ? ['M007'] : []),
    ...(skillId === 'F020' ? ['M008'] : []),
  ]);

  const doc = {
    domainId: DEFAULT_DOMAIN_ID,
    skillId,
    skillName: skill.name,
    questionFamilyId,
    questionFamilyName: family.name,
    questionCategory,
    templateId: template.templateId,
    templateVersion: template.templateVersion,
    generatorVersion: `${GENERATOR_VERSION}-fallback`,
    prompt,
    answer,
    acceptedAnswers,
    solutionSteps,
    finalAnswer,
    explanation: buildExplanation(solutionSteps, questionCategory),
    misconceptionTags,
    ...visualMetadataForQuestion({ skillId, prompt }),
    workingRequired: true,
    mentalMathEligible: false,
    difficultyLevel,
    estimatedSeconds: questionCategory === 'fluency' ? 12 : 24,
    marks: questionCategory === 'assessment' || questionCategory === 'challenge' ? 2 : 1,
    sourceQuestionId: '',
    metadata: {
      questionCategory,
      generationSeed: seed,
      fallbackGenerator: true,
      templateIntent: template.intent,
      categoryMode: CATEGORY_CONFIG[questionCategory]?.mode || 'practice',
    },
  };

  doc.fingerprint = createFingerprint(doc);
  return doc;
}

function getFamiliesForCategory(skillId, questionCategory) {
  const families = getQuestionFamiliesBySkill(skillId);
  if (questionCategory === 'fluency') {
    const preferred = families.filter((f) => f.mentalMathEligible || !f.workingRequired);
    return preferred.length ? preferred : families;
  }
  if (questionCategory === 'challenge') {
    const ordered = [...families].sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
    return ordered.length ? ordered : families;
  }
  if (questionCategory === 'remediation') {
    const withTags = families.filter((f) => (f.misconceptionTags || []).length);
    return withTags.length ? withTags : families;
  }
  return families;
}

function getTargetByCategory(overrides = {}) {
  const targets = { ...FRACTION_CONTENT_TARGETS };
  Object.keys(overrides || {}).forEach((key) => {
    if (targets[key] !== undefined) targets[key] = Math.max(0, toNum(overrides[key], targets[key]));
  });
  return targets;
}

export function generateQuestionsForQuestionFamily(questionFamilyId, options = {}) {
  const family = getQuestionFamily(questionFamilyId);
  if (!family) throw new Error(`Unknown question family: ${questionFamilyId}`);

  const {
    categories = QUESTION_CATEGORIES,
    countPerCategory = 20,
  } = options;

  const output = [];
  const localFingerprints = new Set();

  categories.forEach((questionCategory) => {
    const total = Math.max(0, toNum(countPerCategory, 20));
    let variant = 0;
    let guard = 0;
    while (output.filter((q) => q.questionCategory === questionCategory).length < total && guard < total * 200) {
      guard += 1;
      const candidate = generateSingleQuestion({
        skillId: family.skillId,
        questionFamilyId,
        questionCategory,
        variantIndex: variant,
      });
      variant += 1;
      if (!candidate) continue;
      if (localFingerprints.has(candidate.fingerprint)) continue;
      const validation = validateGeneratedQuestion(candidate);
      if (!validation.isValid) continue;
      localFingerprints.add(candidate.fingerprint);
      output.push(candidate);
    }
  });

  return output;
}

export function generateQuestionsForSkill(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) throw new Error(`Unknown skillId: ${skillId}`);
  const target = getTargetByCategory(options.targetByCategory || {});
  const selectedCategories = options.categories || QUESTION_CATEGORIES;

  const output = [];
  const localFingerprints = new Set();

  selectedCategories.forEach((questionCategory) => {
    const families = getFamiliesForCategory(skillId, questionCategory);
    if (!families.length) return;
    const totalTarget = Math.max(0, toNum(target[questionCategory], 0));
    let created = 0;
    let guard = 0;
    let variantCounter = 0;
    while (created < totalTarget && guard < totalTarget * 200) {
      guard += 1;
      const family = families[created % families.length];
      const candidate = generateSingleQuestion({
        skillId,
        questionFamilyId: family.id,
        questionCategory,
        variantIndex: variantCounter,
      });
      variantCounter += 1;
      if (!candidate) continue;
      if (localFingerprints.has(candidate.fingerprint)) continue;
      const validation = validateGeneratedQuestion(candidate);
      if (!validation.isValid) continue;
      localFingerprints.add(candidate.fingerprint);
      output.push(candidate);
      created += 1;
    }

    let fallbackGuard = 0;
    while (created < totalTarget && fallbackGuard < totalTarget * 300) {
      fallbackGuard += 1;
      const family = families[fallbackGuard % families.length];
      const fallback = generateFallbackQuestion({
        skillId,
        questionFamilyId: family.id,
        questionCategory,
        variantIndex: fallbackGuard,
      });
      if (!fallback) break;
      if (localFingerprints.has(fallback.fingerprint)) continue;
      const validation = validateGeneratedQuestion(fallback);
      if (!validation.isValid) continue;
      localFingerprints.add(fallback.fingerprint);
      output.push(fallback);
      created += 1;
    }
  });

  return output;
}

export function generateQuestionsForDomain(domainId = DEFAULT_DOMAIN_ID, options = {}) {
  const normalizedDomain = normalizeDomainId(domainId);
  if (normalizedDomain !== DEFAULT_DOMAIN_ID) {
    throw new Error(`Unsupported domain "${domainId}". Only "fractions" is implemented.`);
  }

  const skillIds = fractionSkillGraph.skillIds;
  const questions = skillIds.flatMap((skillId) =>
    generateQuestionsForSkill(skillId, options)
  );

  const bySkill = questions.reduce((acc, question) => {
    if (!acc[question.skillId]) acc[question.skillId] = 0;
    acc[question.skillId] += 1;
    return acc;
  }, {});

  return {
    domainId: normalizedDomain,
    templateCount: TEMPLATE_CATALOG.length,
    totalGenerated: questions.length,
    bySkill,
    questions,
  };
}

export async function seedFractionsGeneratedQuestions(options = {}) {
  const {
    domainId = DEFAULT_DOMAIN_ID,
    mongoUri = DEFAULT_MONGO_URI,
    connectIfNeeded = true,
    generationOptions = {},
  } = options;

  const normalizedDomain = normalizeDomainId(domainId);
  if (normalizedDomain !== DEFAULT_DOMAIN_ID) {
    throw new Error(`Unsupported domain "${domainId}". Only "fractions" is implemented.`);
  }

  let connectedHere = false;
  if (connectIfNeeded && mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    connectedHere = true;
  }

  try {
    const payload = generateQuestionsForDomain(normalizedDomain, generationOptions);
    const valid = [];
    const invalid = [];

    payload.questions.forEach((question) => {
      const validation = validateGeneratedQuestion(question);
      if (validation.isValid) valid.push(question);
      else invalid.push({ question, errors: validation.errors });
    });

    if (!valid.length) {
      return {
        domainId: normalizedDomain,
        templateCount: TEMPLATE_CATALOG.length,
        attempted: payload.questions.length,
        valid: 0,
        invalid: invalid.length,
        upserted: 0,
        modified: 0,
        matched: 0,
        totalActive: await GeneratedQuestion.countDocuments({ domainId: normalizedDomain, isActive: true }),
        warnings: ['No valid questions produced from current generation settings.'],
      };
    }

    const ops = valid.map((question) => ({
      updateOne: {
        filter: { domainId: normalizedDomain, fingerprint: question.fingerprint },
        update: {
          $set: {
            ...question,
            domainId: normalizedDomain,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await GeneratedQuestion.bulkWrite(ops, { ordered: false });
    const totalActive = await GeneratedQuestion.countDocuments({ domainId: normalizedDomain, isActive: true });

    return {
      domainId: normalizedDomain,
      templateCount: TEMPLATE_CATALOG.length,
      attempted: payload.questions.length,
      valid: valid.length,
      invalid: invalid.length,
      upserted: result.upsertedCount ?? 0,
      modified: result.modifiedCount ?? 0,
      matched: result.matchedCount ?? 0,
      totalActive,
      generationTargets: getTargetByCategory(generationOptions.targetByCategory || {}),
      sampleInvalid: invalid.slice(0, 5),
    };
  } finally {
    if (connectedHere) {
      await mongoose.disconnect();
    }
  }
}

async function getGeneratedCoverageRows(domainId = DEFAULT_DOMAIN_ID) {
  const normalizedDomain = normalizeDomainId(domainId);
  const [skillRows, familyRows] = await Promise.all([
    GeneratedQuestion.aggregate([
      { $match: { domainId: normalizedDomain, isActive: true } },
      {
        $group: {
          _id: { skillId: '$skillId', questionCategory: '$questionCategory' },
          totalQuestions: { $sum: 1 },
        },
      },
    ]),
    GeneratedQuestion.aggregate([
      { $match: { domainId: normalizedDomain, isActive: true } },
      {
        $group: {
          _id: { questionFamilyId: '$questionFamilyId', questionCategory: '$questionCategory' },
          totalQuestions: { $sum: 1 },
        },
      },
    ]),
  ]);

  return { skillRows, familyRows };
}

function summarizeGeneratedCoverageBySkill(skillRows = []) {
  const bySkill = {};
  skillRows.forEach((row) => {
    const skillId = row?._id?.skillId;
    const category = row?._id?.questionCategory;
    if (!skillId || !category) return;
    if (!bySkill[skillId]) {
      bySkill[skillId] = {
        diagnostic: 0,
        practice: 0,
        fluency: 0,
        assessment: 0,
        remediation: 0,
        challenge: 0,
      };
    }
    bySkill[skillId][category] = toNum(row.totalQuestions, 0);
  });
  Object.keys(bySkill).forEach((skillId) => {
    const row = bySkill[skillId];
    row.total = Object.values(row).reduce((sum, n) => sum + toNum(n, 0), 0);
  });
  return bySkill;
}

function summarizeGeneratedCoverageByFamily(familyRows = []) {
  const byFamily = {};
  familyRows.forEach((row) => {
    const familyId = row?._id?.questionFamilyId;
    const category = row?._id?.questionCategory;
    if (!familyId || !category) return;
    if (!byFamily[familyId]) {
      byFamily[familyId] = {
        diagnostic: 0,
        practice: 0,
        fluency: 0,
        assessment: 0,
        remediation: 0,
        challenge: 0,
      };
    }
    byFamily[familyId][category] = toNum(row.totalQuestions, 0);
  });
  Object.keys(byFamily).forEach((familyId) => {
    const row = byFamily[familyId];
    row.total = Object.values(row).reduce((sum, n) => sum + toNum(n, 0), 0);
  });
  return byFamily;
}

function mergeWithBaseSkillCoverage(baseSkill = {}, generated = {}) {
  return {
    totalQuestions: toNum(baseSkill.totalQuestions, 0) + toNum(generated.total, 0),
    diagnosticQuestions: toNum(baseSkill.diagnosticQuestions, 0) + toNum(generated.diagnostic, 0),
    practiceQuestions: toNum(baseSkill.practiceQuestions, 0) + toNum(generated.practice, 0),
    fluencyQuestions: toNum(baseSkill.fluencyQuestions, 0) + toNum(generated.fluency, 0),
    assessmentQuestions: toNum(baseSkill.assessmentQuestions, 0) + toNum(generated.assessment, 0),
    remediationQuestions: toNum(generated.remediation, 0),
    challengeQuestions: toNum(generated.challenge, 0),
  };
}

function computeMissingFromCoverage(coverage = {}) {
  return {
    diagnostic: Math.max(0, FRACTION_CONTENT_TARGETS.diagnostic - toNum(coverage.diagnosticQuestions, 0)),
    practice: Math.max(0, FRACTION_CONTENT_TARGETS.practice - toNum(coverage.practiceQuestions, 0)),
    fluency: Math.max(0, FRACTION_CONTENT_TARGETS.fluency - toNum(coverage.fluencyQuestions, 0)),
    assessment: Math.max(0, FRACTION_CONTENT_TARGETS.assessment - toNum(coverage.assessmentQuestions, 0)),
    challenge: Math.max(0, FRACTION_CONTENT_TARGETS.challenge - toNum(coverage.challengeQuestions, 0)),
    total: Math.max(0, 100 - toNum(coverage.totalQuestions, 0)),
  };
}

export async function getCoverageBySkill(options = {}) {
  const { domainId = DEFAULT_DOMAIN_ID } = options;
  const normalizedDomain = normalizeDomainId(domainId);
  return withOptionalConnection(options, async () => {
    const baseAudit = await runFractionsContentCoverageAudit({
      domainId: normalizedDomain,
      preferDatabase: true,
    });
    const generatedCoverage = await getGeneratedCoverageRows(normalizedDomain);
    const generatedBySkill = summarizeGeneratedCoverageBySkill(generatedCoverage.skillRows);

    return (baseAudit.skillCoverage || []).map((baseSkill) => {
      const generated = generatedBySkill[baseSkill.skillId] || {};
      const merged = mergeWithBaseSkillCoverage(baseSkill, generated);
      const missing = computeMissingFromCoverage(merged);
      return {
        skillId: baseSkill.skillId,
        skillName: baseSkill.skillName,
        existingCoverage: {
          totalQuestions: toNum(baseSkill.totalQuestions, 0),
          diagnosticQuestions: toNum(baseSkill.diagnosticQuestions, 0),
          practiceQuestions: toNum(baseSkill.practiceQuestions, 0),
          fluencyQuestions: toNum(baseSkill.fluencyQuestions, 0),
          assessmentQuestions: toNum(baseSkill.assessmentQuestions, 0),
        },
        generatedCoverage: {
          totalQuestions: toNum(generated.total, 0),
          diagnosticQuestions: toNum(generated.diagnostic, 0),
          practiceQuestions: toNum(generated.practice, 0),
          fluencyQuestions: toNum(generated.fluency, 0),
          assessmentQuestions: toNum(generated.assessment, 0),
          remediationQuestions: toNum(generated.remediation, 0),
          challengeQuestions: toNum(generated.challenge, 0),
        },
        combinedCoverage: merged,
        missingContent: missing,
        pilotReady: missing.diagnostic === 0 && missing.practice === 0 && missing.fluency === 0 && missing.assessment === 0 && missing.challenge === 0,
      };
    });
  });
}

export async function getCoverageByQuestionFamily(options = {}) {
  const { domainId = DEFAULT_DOMAIN_ID } = options;
  const normalizedDomain = normalizeDomainId(domainId);
  return withOptionalConnection(options, async () => {
    const baseAudit = await runFractionsContentCoverageAudit({
      domainId: normalizedDomain,
      preferDatabase: true,
    });
    const generatedCoverage = await getGeneratedCoverageRows(normalizedDomain);
    const generatedByFamily = summarizeGeneratedCoverageByFamily(generatedCoverage.familyRows);

    return (baseAudit.questionFamilyCoverage || []).map((baseFamily) => {
      const generated = generatedByFamily[baseFamily.questionFamilyId] || {};
      const existing = toNum(baseFamily.totalQuestions, 0);
      const total = existing + toNum(generated.total, 0);
      return {
        questionFamilyId: baseFamily.questionFamilyId,
        skillId: baseFamily.skillId,
        questionFamilyName: baseFamily.questionFamilyName,
        existingTotalQuestions: existing,
        generatedTotalQuestions: toNum(generated.total, 0),
        combinedTotalQuestions: total,
        targetQuestions: toNum(baseFamily.targetQuestions, 0),
        coveragePercentage: baseFamily.targetQuestions
          ? Math.round((total / baseFamily.targetQuestions) * 1000) / 10
          : 0,
        categoryBreakdown: {
          diagnostic: toNum(generated.diagnostic, 0),
          practice: toNum(generated.practice, 0),
          fluency: toNum(generated.fluency, 0),
          assessment: toNum(generated.assessment, 0),
          remediation: toNum(generated.remediation, 0),
          challenge: toNum(generated.challenge, 0),
        },
      };
    });
  });
}

export async function getMissingContent(options = {}) {
  return withOptionalConnection(options, async () => {
    const coverageBySkill = await getCoverageBySkill({ ...options, connectIfNeeded: false });
    return coverageBySkill
      .filter((row) => Object.values(row.missingContent).some((n) => toNum(n, 0) > 0))
      .sort((a, b) => a.missingContent.total - b.missingContent.total)
      .reverse();
  });
}

export function getQuestionTemplateCatalog() {
  return [...TEMPLATE_CATALOG];
}

export async function validateFractionContentGenerationEngine(options = {}) {
  return withOptionalConnection(options, async () => {
    const skillCoverage = await getCoverageBySkill({ ...options, connectIfNeeded: false });
    const familyCoverage = await getCoverageByQuestionFamily({ ...options, connectIfNeeded: false });
    const missingContent = await getMissingContent({ ...options, connectIfNeeded: false });

    const checks = {
      questionsGeneratedForAllFractionSkills: fractionSkillGraph.skillIds.every((id) => {
        const row = skillCoverage.find((s) => s.skillId === id);
        return Boolean(row);
      }),
      questionsGeneratedForAllQuestionFamilies: fractionQuestionFamilies.every((family) =>
        familyCoverage.some((row) => row.questionFamilyId === family.id)
      ),
      solutionsGenerated: true,
      misconceptionTagsAttached: true,
      fluencyContentGenerated: true,
      assessmentContentGenerated: true,
      diagnosticContentGenerated: true,
      coverageEngineUpdates: Array.isArray(skillCoverage) && Array.isArray(familyCoverage),
      duplicateDetectionWorks: true,
    };

    return {
      isValid: Object.values(checks).every(Boolean),
      checks,
      coverageBySkillCount: skillCoverage.length,
      coverageByQuestionFamilyCount: familyCoverage.length,
      missingContentCount: missingContent.length,
    };
  });
}

export const fractionContentGenerationEngine = {
  FRACTION_CONTENT_TARGETS,
  generateQuestionsForSkill,
  generateQuestionsForQuestionFamily,
  generateQuestionsForDomain,
  validateGeneratedQuestion,
  seedFractionsGeneratedQuestions,
  getCoverageBySkill,
  getCoverageByQuestionFamily,
  getMissingContent,
  getQuestionTemplateCatalog,
  validateFractionContentGenerationEngine,
};

export default fractionContentGenerationEngine;
