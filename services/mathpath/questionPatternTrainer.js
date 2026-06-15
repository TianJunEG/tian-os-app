import crypto from 'crypto';
import mongoose from 'mongoose';
import TrainedQuestionPattern from '../../models/mathpath/TrainedQuestionPattern.js';
import SimilarQuestionPracticeSet from '../../models/mathpath/SimilarQuestionPracticeSet.js';
import SimilarQuestionPracticeSession from '../../models/mathpath/SimilarQuestionPracticeSession.js';

const DEFAULT_SESSION_TYPES = ['diagnostic', 'practice', 'remediation', 'mastery_check'];
const DEFAULT_TARGET = { easy: 10, medium: 10, hard: 10, wordProblem: 5, misconception: 5 };
const PRACTICE_SET_STORE = new Map();
// Write-through cache in front of the SimilarQuestionPracticeSession collection.
// The Map keeps single-instance reads fast (and lets validation run without a DB),
// but every active session is also persisted so a different instance can serve the
// matching submit. Reads fall back to Mongo on a cache miss.
const PRACTICE_SESSION_STORE = new Map();

// Only touch Mongo when a live connection exists; otherwise Mongoose buffers the
// op until a (possibly never-arriving) connection, hanging the request. When
// disconnected the write-through Map is the source of truth, matching the prior
// in-memory-only behaviour (and keeping DB-less unit tests fast).
const dbConnected = () => mongoose.connection?.readyState === 1;

async function persistPracticeSession(session) {
  PRACTICE_SESSION_STORE.set(session.sessionId, session);
  if (!dbConnected()) return session;
  try {
    // A session reloaded from Mongo (.lean()) carries _id/__v/timestamps; those
    // must not appear in $set (e.g. _id is immutable), so drop the Mongo internals.
    const { _id, __v, createdAt, updatedAt, ...doc } = session;
    await SimilarQuestionPracticeSession.findOneAndUpdate(
      { sessionId: session.sessionId },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch {
    // Persistence is best-effort: on a DB hiccup the in-memory copy still serves
    // a same-instance submit, matching the pre-persistence behaviour.
  }
  return session;
}

async function loadPracticeSession(sessionId) {
  if (PRACTICE_SESSION_STORE.has(sessionId)) return PRACTICE_SESSION_STORE.get(sessionId);
  if (!dbConnected()) return null;
  let stored = null;
  try {
    stored = await SimilarQuestionPracticeSession.findOne({ sessionId }).lean();
  } catch {
    stored = null;
  }
  if (stored) PRACTICE_SESSION_STORE.set(sessionId, stored);
  return stored;
}
const FRACTION_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12];
const FRACTION_SKILL_HINTS = [
  { skillId: 'F005', topic: 'Fractions', subtopic: 'Number line fractions', patterns: [/number line/i, /mark after 0/i] },
  { skillId: 'F018', topic: 'Fractions', subtopic: 'Add different denominators', patterns: [/add/i, /\+\s*\d+\s*\//, /sum/i] },
  { skillId: 'F019', topic: 'Fractions', subtopic: 'Subtract different denominators', patterns: [/subtract/i, /difference/i, /left after/i] },
  { skillId: 'F020', topic: 'Fractions', subtopic: 'Fraction of quantity', patterns: [/of the \d+/i, /\d+\s+(buttons|tarts|marbles|stickers|litres|kg)/i] },
  { skillId: 'F023', topic: 'Fractions', subtopic: 'Fraction word problems', patterns: [/remaining/i, /rest were/i, /gave away/i, /spent/i] },
  { skillId: 'F024', topic: 'Fractions', subtopic: 'Multi-step fraction problems', patterns: [/then/i, /remainder/i, /after that/i] },
  { skillId: 'F025', topic: 'Fractions', subtopic: 'Exam-style applications', patterns: [/give your answer in the simplest form/i, /at first/i] },
];

function stableId(prefix, payload) {
  const digest = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
  return `${prefix}_${digest}`;
}

function nowIso() {
  return new Date().toISOString();
}

function toExamples(sourceExamples = []) {
  return (Array.isArray(sourceExamples) ? sourceExamples : [])
    .map((row) => ({
      prompt: String(row?.prompt || row?.stem || '').trim(),
      answer: String(row?.answer || row?.finalAnswer || '').trim(),
      workedSolution: String(row?.workedSolution || row?.solution || '').trim(),
      skillId: String(row?.skillId || '').trim().toUpperCase(),
    }))
    .filter((row) => row.prompt);
}

function extractNumbers(text = '') {
  const matches = String(text).match(/\d+\s*\/\s*\d+|\d+/g) || [];
  return matches.map((m) => m.replace(/\s+/g, ''));
}

function parseFraction(value) {
  const m = String(value || '').match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  const numerator = Number(m[1]);
  const denominator = Number(m[2]);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return { numerator, denominator };
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function simplify(numerator, denominator) {
  const g = gcd(numerator, denominator);
  return { numerator: numerator / g, denominator: denominator / g };
}

function fractionText(frac) {
  const s = simplify(frac.numerator, frac.denominator);
  if (s.denominator === 1) return String(s.numerator);
  return `${s.numerator}/${s.denominator}`;
}

function normalizeAnswer(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasUnresolvedTemplateTokens(value = '') {
  return /\{[^}]+\}/.test(String(value || ''));
}

function stablePrompt(text = '') {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseAnswerFraction(value = '') {
  const raw = String(value || '').trim();
  const mixed = raw.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (!denominator) return null;
    const sign = whole < 0 ? -1 : 1;
    return simplify(whole * denominator + sign * numerator, denominator);
  }
  const frac = raw.match(/^(-?\d+)\s*\/\s*(-?\d+)/);
  if (frac) {
    const numerator = Number(frac[1]);
    const denominator = Number(frac[2]);
    if (!denominator) return null;
    return simplify(numerator, denominator);
  }
  const whole = raw.match(/^-?\d+$/);
  if (whole) return { numerator: Number(raw), denominator: 1 };
  return null;
}

export function checkSimilarQuestionAnswer(studentAnswer, expectedAnswer, strategy = 'fraction_equivalence') {
  if (strategy === 'fraction_equivalence') {
    const student = parseAnswerFraction(studentAnswer);
    const expected = parseAnswerFraction(expectedAnswer);
    if (student && expected) return student.numerator * expected.denominator === expected.numerator * student.denominator;
  }
  return normalizeAnswer(studentAnswer) === normalizeAnswer(expectedAnswer);
}

function inferSkill(examples, requestedSkillId = '') {
  const explicit = String(requestedSkillId || '').trim().toUpperCase();
  if (/^F\d{3}$/.test(explicit)) return explicit;
  const fromExample = examples.map((e) => e.skillId).find((id) => /^F\d{3}$/.test(id));
  if (fromExample) return fromExample;
  const joined = examples.map((e) => e.prompt).join('\n');
  const scored = FRACTION_SKILL_HINTS
    .map((hint) => ({
      ...hint,
      score: hint.patterns.reduce((sum, regex) => sum + (regex.test(joined) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].skillId : 'F023';
}

function skillMeta(skillId) {
  return FRACTION_SKILL_HINTS.find((row) => row.skillId === skillId) || {
    skillId,
    topic: 'Fractions',
    subtopic: 'Fraction practice',
  };
}

function inferArchetype(examples, skillId) {
  const joined = examples.map((e) => e.prompt).join(' ').toLowerCase();
  if (/remaining|remainder|rest were|gave away/.test(joined)) return 'fraction_of_remainder_word_problem';
  if (/number line/.test(joined)) return 'fraction_on_number_line';
  if (/how many|buttons|tarts|marbles|stickers|kg|litres/.test(joined)) return 'fraction_of_quantity_word_problem';
  if (skillId === 'F018') return 'add_unlike_fractions';
  if (skillId === 'F019') return 'subtract_unlike_fractions';
  return 'fraction_word_problem_pattern';
}

function inferMisconceptions(skillId, archetype) {
  const base = new Set(['M010']);
  if (['F018', 'F019'].includes(skillId)) base.add('M007');
  if (skillId === 'F018') base.add('M001');
  if (/remainder|word_problem/.test(archetype)) base.add('M008');
  if (['F023', 'F024', 'F025'].includes(skillId)) base.add('M003');
  if (skillId === 'F025') base.add('M011');
  return [...base];
}

function remediationFor(skillId, misconceptionTags = []) {
  const out = new Set();
  if (misconceptionTags.includes('M008')) ['F020', 'F023', 'F024'].forEach((id) => out.add(id));
  if (misconceptionTags.includes('M007')) ['F010', 'F011', 'F018'].forEach((id) => out.add(id));
  if (misconceptionTags.includes('M003')) ['F002', 'F003', 'F004'].forEach((id) => out.add(id));
  if (!out.size) out.add(skillId);
  return [...out];
}

function makeQuestionTemplate(archetype) {
  if (archetype === 'fraction_of_remainder_word_problem') {
    return '{name} had {totalLabel}. {firstNumerator}/{firstDenominator} were {firstGroup}. {secondNumerator}/{secondDenominator} of the remaining {objectPlural} were {secondGroup}. The rest were {finalGroup}. What fraction of the {objectPlural} were {finalGroup}?';
  }
  if (archetype === 'fraction_of_quantity_word_problem') {
    return 'There are {total} {objectPlural}. {firstNumerator}/{firstDenominator} are {firstGroup}. {secondNumerator}/{secondDenominator} of the remaining {objectPlural} are {secondGroup}. The rest are {finalGroup}. How many {objectPlural} are {finalGroup}?';
  }
  if (archetype === 'fraction_on_number_line') {
    return 'On a number line from 0 to 1 divided into {denominator} equal parts, what fraction is at the {positionWord} mark after 0?';
  }
  if (archetype === 'add_unlike_fractions') return 'Find {aNumerator}/{aDenominator} + {bNumerator}/{bDenominator}. Give your answer in simplest form.';
  if (archetype === 'subtract_unlike_fractions') return 'Find {aNumerator}/{aDenominator} - {bNumerator}/{bDenominator}. Give your answer in simplest form.';
  return '{context}. What fraction is represented by {numerator}/{denominator}?';
}

function inferVariableRules(examples, archetype) {
  const numbers = examples.flatMap((e) => extractNumbers(e.prompt));
  const fractions = numbers.map(parseFraction).filter(Boolean);
  const denominators = fractions.map((f) => f.denominator);
  const maxDenominator = Math.max(8, ...denominators, 10);
  const minDenominator = Math.max(2, Math.min(3, ...denominators));
  const rules = [
    { name: 'firstDenominator', role: 'first fraction denominator', min: minDenominator, max: Math.min(12, maxDenominator + 4), step: 1 },
    { name: 'secondDenominator', role: 'fraction of remainder denominator', min: 2, max: 8, step: 1 },
    { name: 'firstNumerator', role: 'first fraction numerator', min: 1, max: 5, step: 1 },
    { name: 'secondNumerator', role: 'second fraction numerator', min: 1, max: 3, step: 1 },
    { name: 'context', role: 'word problem context', values: ['buttons', 'tarts', 'stickers', 'marbles', 'litres'] },
  ];
  if (archetype === 'fraction_on_number_line') {
    return [{ name: 'denominator', role: 'number line equal parts', min: 2, max: 12, step: 1 }];
  }
  return rules;
}

function ordinal(n) {
  const words = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh' };
  return words[n] || `${n}th`;
}

function contextFor(index) {
  const rows = [
    ['Cheng', 'tarts', 'pineapple', 'chocolate', 'strawberry'],
    ['A box', 'buttons', 'blue', 'red', 'green'],
    ['Mei', 'stickers', 'star', 'round', 'square'],
    ['Ravi', 'marbles', 'black', 'white', 'clear'],
    ['Sally', 'litres of juice', 'given away', 'drunk', 'left'],
  ];
  const picked = rows[index % rows.length];
  return { name: picked[0], objectPlural: picked[1], firstGroup: picked[2], secondGroup: picked[3], finalGroup: picked[4], totalLabel: `some ${picked[1]}` };
}

function valuesForVariant(index, difficulty) {
  const diffOffset = difficulty === 'hard' ? 4 : difficulty === 'medium' ? 2 : 0;
  const firstDenominator = [4, 5, 6, 8, 9, 10, 12][(index + diffOffset) % 7];
  const firstNumerator = Math.max(1, Math.min(firstDenominator - 1, 1 + ((index + 1) % Math.min(4, firstDenominator - 1))));
  const secondDenominator = [2, 3, 4, 5, 6][(index + diffOffset) % 5];
  const secondNumerator = Math.max(1, Math.min(secondDenominator - 1, 1 + (index % Math.min(3, secondDenominator - 1))));
  const total = firstDenominator * secondDenominator * (difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2);
  return { firstDenominator, firstNumerator, secondDenominator, secondNumerator, total };
}

function buildSafeSubtractionPair(v) {
  const aCandidateDenominators = [
    v.firstDenominator,
    ...FRACTION_DENOMINATORS,
    ...FRACTION_DENOMINATORS,
  ];
  const bCandidateDenominators = [
    v.secondDenominator,
    ...FRACTION_DENOMINATORS,
    ...FRACTION_DENOMINATORS,
  ];

  for (let i = 0; i < aCandidateDenominators.length; i += 1) {
    const aDenominator = Math.max(2, Number(aCandidateDenominators[i]) || 2);
    for (let aNumerator = 1; aNumerator < aDenominator; aNumerator += 1) {
      const rotatedNumerator = 1 + ((v.firstNumerator + aNumerator - 1) % (aDenominator - 1));
      for (let j = 0; j < bCandidateDenominators.length; j += 1) {
        const bDenominator = Math.max(2, Number(bCandidateDenominators[j]) || 2);
        const maxSecondNumerator = Math.floor((rotatedNumerator * bDenominator - 1) / aDenominator);
        if (maxSecondNumerator < 1) continue;
        const bNumerator = 1 + ((v.secondNumerator + rotatedNumerator - 1) % Math.min(bDenominator - 1, maxSecondNumerator));
        return {
          a: { numerator: rotatedNumerator, denominator: aDenominator },
          b: { numerator: bNumerator, denominator: bDenominator },
        };
      }
    }
  }

  return {
    a: { numerator: 2, denominator: 2 },
    b: { numerator: 1, denominator: 4 },
  };
}

function buildVariant(pattern, index, bucket = 'practice', difficulty = 'medium') {
  const ctx = contextFor(index);
  const v = valuesForVariant(index, difficulty);
  const remainingNumerator = v.firstDenominator - v.firstNumerator;
  const finalNumeratorRaw = remainingNumerator * (v.secondDenominator - v.secondNumerator);
  const finalDenominatorRaw = v.firstDenominator * v.secondDenominator;
  const finalFraction = simplify(finalNumeratorRaw, finalDenominatorRaw);
  const finalFractionDisplay = fractionText(finalFraction);
  const isQuantity = pattern.archetype === 'fraction_of_quantity_word_problem' || bucket === 'wordProblem';
  const quantityAnswer = Math.round((v.total * finalFraction.numerator) / finalFraction.denominator);

  let prompt = pattern.questionTemplate;
  let answer = finalFractionDisplay;
  if (pattern.archetype === 'fraction_on_number_line') {
    const denominator = [2, 3, 4, 5, 6, 8, 10, 12][index % 8];
    const position = 1 + (index % (denominator - 1));
    prompt = makeQuestionTemplate('fraction_on_number_line')
      .replace('{denominator}', String(denominator))
      .replace('{positionWord}', ordinal(position));
    answer = fractionText({ numerator: position, denominator });
  } else if (pattern.archetype === 'add_unlike_fractions') {
    const a = { numerator: v.firstNumerator, denominator: v.firstDenominator };
    const b = { numerator: v.secondNumerator, denominator: v.secondDenominator };
    answer = fractionText({
      numerator: a.numerator * b.denominator + b.numerator * a.denominator,
      denominator: a.denominator * b.denominator,
    });
    prompt = makeQuestionTemplate('add_unlike_fractions')
      .replace('{aNumerator}', String(a.numerator)).replace('{aDenominator}', String(a.denominator))
      .replace('{bNumerator}', String(b.numerator)).replace('{bDenominator}', String(b.denominator));
  } else if (pattern.archetype === 'subtract_unlike_fractions') {
    const pair = buildSafeSubtractionPair(v);
    const a = pair.a;
    const b = pair.b;
    answer = fractionText({ numerator: a.numerator * b.denominator - b.numerator * a.denominator, denominator: a.denominator * b.denominator });
    prompt = makeQuestionTemplate('subtract_unlike_fractions')
      .replace('{aNumerator}', String(a.numerator)).replace('{aDenominator}', String(a.denominator))
      .replace('{bNumerator}', String(b.numerator)).replace('{bDenominator}', String(b.denominator));
  } else if (pattern.archetype === 'fraction_word_problem_pattern') {
    const numerator = finalFraction.numerator;
    const denominator = finalFraction.denominator;
    prompt = makeQuestionTemplate('fraction_word_problem_pattern')
      .replace('{context}', `${ctx.name} had a whole of 1.`)
      .replace('{numerator}', String(numerator))
      .replace('{denominator}', String(denominator));
    answer = fractionText(finalFraction);
  } else {
    prompt = prompt
      .replace('{name}', ctx.name)
      .replace('{totalLabel}', isQuantity ? `${v.total} ${ctx.objectPlural}` : ctx.totalLabel)
      .replaceAll('{objectPlural}', ctx.objectPlural)
      .replace('{firstGroup}', ctx.firstGroup)
      .replace('{secondGroup}', ctx.secondGroup)
      .replaceAll('{finalGroup}', ctx.finalGroup)
      .replaceAll('{firstNumerator}', String(v.firstNumerator))
      .replaceAll('{firstDenominator}', String(v.firstDenominator))
      .replaceAll('{secondNumerator}', String(v.secondNumerator))
      .replaceAll('{secondDenominator}', String(v.secondDenominator))
      .replace('{total}', String(v.total));
    if (isQuantity) answer = `${quantityAnswer} ${ctx.objectPlural}`;
  }

  const misconceptionTags = bucket === 'misconception'
    ? [...new Set([...(pattern.misconceptionTags || []), 'M008'])]
    : pattern.misconceptionTags || [];
  const category = bucket === 'wordProblem' ? 'practice' : bucket === 'misconception' ? 'remediation' : bucket;
  const variant = {
    variantId: stableId('variant', { patternId: pattern.patternId, prompt, category, difficulty }),
    patternId: pattern.patternId,
    domainId: pattern.domain,
    skillId: pattern.inferredSkillIds?.[0] || 'F023',
    questionFamilyId: `TRAINED_${pattern.inferredSkillIds?.[0] || 'F023'}_${pattern.archetype}`,
    questionCategory: category,
    difficulty,
    prompt,
    answer,
    acceptedAnswers: [answer],
    finalAnswer: answer,
    answerType: isQuantity ? 'quantity' : pattern.answerType,
    answerCheckStrategy: isQuantity ? 'exact_number_with_unit' : pattern.answerCheckStrategy,
    workedSolution: [
      'Identify the first fraction and the amount left.',
      'Treat the remainder as the new amount if another fraction acts on it.',
      `Final answer: ${answer}.`,
    ].join(' '),
    solutionSteps: [
      'Identify the fraction structure.',
      'Apply the operation to valid generated numbers.',
      `Write the answer as ${answer}.`,
    ],
    misconceptionTags,
    remediationSkillIds: pattern.remediationSkillIds || [],
    compatibleSessionTypes: pattern.compatibleSessionTypes || DEFAULT_SESSION_TYPES,
    worksheetCompatible: Boolean(pattern.worksheetCompatible),
    metadata: {
      bucket,
      generatedFromPattern: true,
      diagramRequired: /model|number_line|remainder/.test(pattern.archetype),
    },
  };
  return variant;
}

function validateVariant(variant, seen) {
  const errors = [];
  const normalizedPrompt = stablePrompt(variant.prompt);
  if (!normalizedPrompt || normalizedPrompt.length < 20) errors.push('wording is too short');
  if (!variant.answer) errors.push('answer cannot be computed');
  if (!variant.answerCheckStrategy) errors.push('answer check metadata is missing');
  if (hasUnresolvedTemplateTokens(variant.prompt)) errors.push('template placeholders were not replaced');
  if (seen.has(normalizedPrompt)) errors.push('duplicate or near-duplicate prompt');
  if (!variant.questionCategory) errors.push('session category missing');
  if (variant.worksheetCompatible && /diagramRequired:true/.test(String(variant.prompt))) errors.push('diagram metadata missing');
  return { ok: errors.length === 0, errors, key: normalizedPrompt };
}

function normalizeClientGeneratedVariants(pattern, requestedVariants = []) {
  if (!Array.isArray(requestedVariants) || !requestedVariants.length) return null;
  const generatedFromServer = generateVariantsFromPattern(pattern, { generatedVariantTarget: pattern.generatedVariantTarget || {} });
  const canonicalByVariantId = new Map((generatedFromServer.variants || []).map((q) => [q.variantId, q]));

  const seen = new Set();
  const variants = [];
  const invalid = [];

  for (const incoming of requestedVariants) {
    const variantId = String(incoming?.variantId || '').trim();
    const canonical = variantId ? canonicalByVariantId.get(variantId) : null;
    if (!canonical) {
      invalid.push(variantId || 'missing-variant-id');
      continue;
    }
    if (seen.has(variantId)) {
      continue;
    }
    seen.add(variantId);
    variants.push(canonical);
  }

  if (invalid.length) {
    throw new Error(`Some variants are invalid or stale. Regenerate the question bank first. Invalid entries: ${invalid.slice(0, 6).join(', ')}`);
  }
  if (!variants.length) {
    throw new Error('No valid generated variants were submitted for approval.');
  }
  return variants;
}

export function extractQuestionPattern(input = {}) {
  const examples = toExamples(input.sourceExamples);
  const requestedSkillId = input.targetSkillId || input.skillId || '';
  const inferredSkillId = inferSkill(examples, requestedSkillId);
  const meta = skillMeta(inferredSkillId);
  const archetype = inferArchetype(examples, inferredSkillId);
  const misconceptionTags = inferMisconceptions(inferredSkillId, archetype);
  const target = {
    ...DEFAULT_TARGET,
    ...(input.generatedVariantTarget || {}),
    ...(input.difficultyMix || {}),
  };
  const totalTarget = Number(input.variantCount || target.total || Object.values(target).reduce((sum, n) => sum + Number(n || 0), 0));
  const warnings = [];
  if (examples.length < 3) warnings.push('Shallow pattern extraction: provide at least 3 representative examples.');
  if (new Set(examples.map((e) => extractNumbers(e.prompt).join('|'))).size <= 1) warnings.push('Seed examples have limited variable diversity.');
  if (!/^F\d{3}$/.test(inferredSkillId)) warnings.push('Could not confidently map to an existing Fractions skill.');

  return {
    patternId: stableId('qpattern', { examples, requestedSkillId, archetype }),
    sourceQuestionIds: input.sourceQuestionIds || [],
    sourceExamples: examples,
    inferredSkillIds: [inferredSkillId],
    domain: input.domain || 'fractions',
    topic: input.topic || meta.topic,
    subtopic: input.subtopic || meta.subtopic,
    archetype,
    difficultyBand: input.difficultyBand || 'mixed',
    curriculumTags: input.curriculumTags || ['SG', 'MOE', input.level || 'P5'].filter(Boolean),
    syllabusRefs: input.syllabusRefs || [],
    questionTemplate: makeQuestionTemplate(archetype),
    variableRules: inferVariableRules(examples, archetype),
    constraints: [
      'Generated denominators must be non-zero.',
      'Generated fractions must be mathematically valid.',
      'Answers must be computed before preview.',
      'Prompts must be unique after normalization.',
    ],
    answerType: /quantity/.test(archetype) ? 'quantity' : 'fraction',
    answerCheckStrategy: /quantity/.test(archetype) ? 'exact_number_with_unit' : 'fraction_equivalence',
    workedSolutionTemplate: 'Identify known fractions, compute the changed amount, simplify, then check reasonableness.',
    misconceptionTags,
    remediationSkillIds: remediationFor(inferredSkillId, misconceptionTags),
    compatibleSessionTypes: input.compatibleSessionTypes?.length ? input.compatibleSessionTypes : DEFAULT_SESSION_TYPES,
    worksheetCompatible: input.worksheetCompatible !== false,
    generatedVariantTarget: {
      total: totalTarget,
      easy: Number(target.easy || 0),
      medium: Number(target.medium || 0),
      hard: Number(target.hard || 0),
      wordProblem: Number(target.wordProblem || 0),
      misconception: Number(target.misconception || 0),
    },
    qualityWarnings: warnings,
    metadata: {
      extractedNumberTokens: [...new Set(examples.flatMap((e) => extractNumbers(e.prompt)))].slice(0, 30),
      seedExampleCount: examples.length,
    },
  };
}

export function generateVariantsFromPattern(patternInput = {}, options = {}) {
  const pattern = patternInput.patternId ? patternInput : extractQuestionPattern(patternInput);
  const target = {
    ...DEFAULT_TARGET,
    ...(pattern.generatedVariantTarget || {}),
    ...(options.generatedVariantTarget || {}),
  };
  const plan = [
    ['diagnostic', 'easy', Number(target.easy || 0)],
    ['practice', 'medium', Number(target.medium || 0)],
    ['mastery_check', 'hard', Number(target.hard || 0)],
    ['wordProblem', 'medium', Number(target.wordProblem || 0)],
    ['misconception', 'medium', Number(target.misconception || 0)],
  ];

  const variants = [];
  const rejected = [];
  const seen = new Set();
  plan.forEach(([bucket, difficulty, count]) => {
    let attempts = 0;
    let made = 0;
    while (made < count && attempts < count * 5 + 20) {
      const candidate = buildVariant(pattern, variants.length + attempts + 1, bucket, difficulty);
      const validation = validateVariant(candidate, seen);
      if (validation.ok) {
        seen.add(validation.key);
        variants.push(candidate);
        made += 1;
      } else {
        rejected.push({ prompt: candidate.prompt, errors: validation.errors });
      }
      attempts += 1;
    }
  });

  const difficultyDistribution = variants.reduce((acc, v) => {
    acc[v.difficulty] = (acc[v.difficulty] || 0) + 1;
    return acc;
  }, {});
  const categoryDistribution = variants.reduce((acc, v) => {
    acc[v.questionCategory] = (acc[v.questionCategory] || 0) + 1;
    return acc;
  }, {});

  return {
    pattern,
    variants,
    quality: {
      requestedCount: plan.reduce((sum, [, , count]) => sum + count, 0),
      acceptedCount: variants.length,
      rejectedCount: rejected.length,
      rejected: rejected.slice(0, 10),
      duplicateCount: rejected.filter((row) => row.errors.includes('duplicate or near-duplicate prompt')).length,
      difficultyDistribution,
      categoryDistribution,
      warnings: pattern.qualityWarnings || [],
      shallowExtraction: (pattern.qualityWarnings || []).some((warning) => /shallow/i.test(warning)),
    },
  };
}

export async function saveTrainedQuestionPattern(patternInput = {}, userId = null, status = 'draft') {
  const pattern = patternInput.patternId ? patternInput : extractQuestionPattern(patternInput);
  const saved = await TrainedQuestionPattern.findOneAndUpdate(
    { patternId: pattern.patternId },
    {
      $set: {
        ...pattern,
        status,
        createdByUserId: userId || null,
        approvedByUserId: status === 'approved' ? userId || null : null,
        approvedAt: status === 'approved' ? new Date() : null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return saved;
}

export function createTemporaryPracticeSet({ patternInput = {}, generated = null, userId = null, title = '' } = {}) {
  const bundle = generated || generateVariantsFromPattern(patternInput);
  const pattern = bundle.pattern;
  const practiceSet = {
    practiceSetId: stableId('practiceset', { patternId: pattern.patternId, count: bundle.variants.length, title }),
    patternId: pattern.patternId,
    title: title || `${pattern.subtopic || pattern.topic || 'Similar Questions'} Practice`,
    subject: pattern.domain === 'fractions' ? 'Math' : '',
    domain: pattern.domain || 'fractions',
    topic: pattern.topic || 'Fractions',
    skillId: pattern.inferredSkillIds?.[0] || '',
    skillName: pattern.subtopic || '',
    level: pattern.curriculumTags?.find((tag) => /^P\d|SEC/i.test(tag)) || '',
    curriculum: pattern.curriculumTags?.find((tag) => /MOE/i.test(tag)) || 'MOE',
    generatedQuestions: bundle.variants,
    approved: false,
    createdByUserId: userId || null,
    studentProgressState: {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  PRACTICE_SET_STORE.set(practiceSet.practiceSetId, practiceSet);
  return practiceSet;
}

export async function approvePracticeSet({ patternInput = {}, generated = null, userId = null, title = '', persist = true } = {}) {
  const pattern = patternInput.patternId ? patternInput : extractQuestionPattern(patternInput);
  const normalizedVariants = generated?.variants ? normalizeClientGeneratedVariants(pattern, generated.variants) : null;
  const bundle = normalizedVariants ? { pattern, variants: normalizedVariants } : (generated || generateVariantsFromPattern(pattern));
  const savedPattern = persist
    ? await saveTrainedQuestionPattern(pattern, userId, 'approved')
    : { ...pattern, status: 'approved', approvedByUserId: userId || null, approvedAt: new Date() };
  const tempSet = createTemporaryPracticeSet({ patternInput: savedPattern, generated: { pattern: savedPattern, variants: bundle.variants }, userId, title });
  const approvedSet = {
    ...tempSet,
    approved: true,
    approvedByUserId: userId || null,
    approvedAt: nowIso(),
  };
  PRACTICE_SET_STORE.set(approvedSet.practiceSetId, approvedSet);
  if (!persist) return approvedSet;
  return SimilarQuestionPracticeSet.findOneAndUpdate(
    { practiceSetId: approvedSet.practiceSetId },
    { $set: approvedSet },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function getPracticeSet(practiceSetId, { allowDraft = false } = {}) {
  if (PRACTICE_SET_STORE.has(practiceSetId)) {
    const set = PRACTICE_SET_STORE.get(practiceSetId);
    if (set.approved || allowDraft) return set;
  }
  const query = { practiceSetId };
  if (!allowDraft) query.approved = true;
  return SimilarQuestionPracticeSet.findOne(query).lean();
}

export async function listApprovedPracticeSets({ domain = 'fractions', skillId = '' } = {}) {
  const memory = [...PRACTICE_SET_STORE.values()].filter((set) => (
    set.approved && set.domain === domain && (!skillId || set.skillId === skillId)
  ));
  let persisted = [];
  try {
    const query = { approved: true, domain };
    if (skillId) query.skillId = skillId;
    persisted = await SimilarQuestionPracticeSet.find(query).sort({ updatedAt: -1 }).limit(50).lean();
  } catch {
    persisted = [];
  }
  const byId = new Map([...persisted, ...memory].map((set) => [set.practiceSetId, set]));
  return [...byId.values()];
}

export async function startSimilarQuestionPractice({ practiceSetId, studentId, limit = 10 } = {}) {
  if (!studentId) throw new Error('studentId is required.');
  const set = await getPracticeSet(practiceSetId);
  if (!set) throw new Error('Practice set not found.');
  const questions = (set.generatedQuestions || []).slice(0, Math.max(1, Math.min(50, Number(limit || 10))));
  const session = {
    sessionId: stableId('similarpractice', { practiceSetId, studentId, at: Date.now() }),
    practiceSetId,
    studentId,
    domain: set.domain,
    skillId: set.skillId,
    startedAt: nowIso(),
    status: 'active',
    responses: [],
    summary: null,
  };
  await persistPracticeSession({ ...session, questions });
  return {
    session,
    practiceSet: {
      practiceSetId: set.practiceSetId,
      title: set.title,
      topic: set.topic,
      skillId: set.skillId,
      level: set.level,
    },
    questions: questions.map((q) => ({
      variantId: q.variantId,
      prompt: q.prompt,
      difficulty: q.difficulty,
      skillId: q.skillId,
      questionCategory: q.questionCategory,
      worksheetCompatible: q.worksheetCompatible,
    })),
  };
}

export async function submitSimilarQuestionPractice({ sessionId, studentId, responses = [] } = {}) {
  const session = await loadPracticeSession(sessionId);
  if (!session) throw new Error('Practice session not found.');
  if (String(session.studentId) !== String(studentId)) throw new Error('studentId does not match practice session.');
  const byId = new Map((session.questions || []).map((q) => [q.variantId, q]));
  const results = (responses || []).map((response) => {
    const question = byId.get(response.variantId);
    if (!question) return { variantId: response.variantId, correct: false, error: 'Question not found.' };
    const correct = checkSimilarQuestionAnswer(response.answer, question.answer, question.answerCheckStrategy);
    return {
      variantId: question.variantId,
      prompt: question.prompt,
      skillId: question.skillId || session.skillId || 'F023',
      questionFamilyId: question.questionFamilyId || `TRAINED_${question.skillId || session.skillId || 'F023'}`,
      questionCategory: question.questionCategory || 'practice',
      answerCheckStrategy: question.answerCheckStrategy,
      difficulty: question.difficulty || 'medium',
      studentAnswer: String(response.answer || ''),
      confidence: response.confidence || '',
      reflection: response.reflection || response.confidence || '',
      helpRequested: Boolean(response.helpRequested),
      correctAnswer: question.answer,
      correct,
      timedOut: Boolean(response.timedOut),
      questionStartedAt: response.questionStartedAt || null,
      questionEndedAt: response.questionEndedAt || null,
      workingUploaded: Boolean(response.workingUploaded),
      workingSubmitted: Boolean(response.workingSubmitted),
      workingSubmittedAt: response.workingSubmittedAt || null,
      workingImage: response.workingImage || '',
      workingStrokes: Array.isArray(response.workingStrokes) ? response.workingStrokes : [],
      workingNotNeeded: Boolean(response.workingNotNeeded),
      skipped: Boolean(response.skipped),
      timestamp: response.timestamp || null,
      attemptNumber: Number(response.attemptNumber || 1),
      timeTaken: Number(response.timeTaken || 0) || null,
      workedSolution: question.workedSolution,
      misconceptionTags: correct ? [] : question.misconceptionTags || [],
      remediationSkillIds: correct ? [] : question.remediationSkillIds || [],
    };
  });
  const correctCount = results.filter((r) => r.correct).length;
  const total = results.length;
  const summary = {
    total,
    correct: correctCount,
    incorrect: Math.max(0, total - correctCount),
    scorePct: total ? Math.round((correctCount / total) * 100) : 0,
    mistakeCount: results.filter((r) => !r.correct).length,
    masteryStatus: total && correctCount / total >= 0.85 ? 'mastery_ready' : 'needs_practice',
  };
  const nextSession = { ...session, status: 'completed', responses: results, summary, completedAt: nowIso() };
  await persistPracticeSession(nextSession);
  return { sessionId, summary, results };
}

export function validateQuestionPatternTrainer() {
  const sourceExamples = [
    { prompt: 'Cheng baked some tarts. 2/5 were pineapple. 1/6 of the remaining tarts were chocolate. The rest were strawberry. What fraction were strawberry?', answer: '1/2' },
    { prompt: 'There are 75 buttons. 2/5 are blue. 1/3 of the remaining buttons are red. The rest are green. How many buttons are green?', answer: '30 buttons' },
    { prompt: 'A class has some stickers. 3/8 are stars. 1/5 of the remaining stickers are circles. The rest are squares. What fraction are squares?', answer: '1/2' },
    { prompt: 'Mei had some marbles. 1/4 were black. 2/3 of the remaining marbles were white. The rest were clear. What fraction were clear?', answer: '1/4' },
  ];
  const pattern = extractQuestionPattern({ sourceExamples, targetSkillId: 'F023' });
  const generated = generateVariantsFromPattern(pattern, { generatedVariantTarget: { easy: 5, medium: 5, hard: 5, wordProblem: 3, misconception: 2 } });
  const uniquePrompts = new Set(generated.variants.map((v) => v.prompt.toLowerCase().replace(/\s+/g, ' ').trim()));
  const checks = {
    mapsToFractionsSkill: pattern.inferredSkillIds.includes('F023'),
    extractsPattern: pattern.archetype === 'fraction_of_remainder_word_problem',
    generatesAtLeastTwenty: generated.variants.length >= 20,
    variantsUnique: uniquePrompts.size === generated.variants.length,
    answersGenerated: generated.variants.every((v) => Boolean(v.answer && v.acceptedAnswers?.length)),
    answerChecksPresent: generated.variants.every((v) => Boolean(v.answerCheckStrategy)),
    difficultyDistributionWorks: ['easy', 'medium', 'hard'].every((level) => generated.quality.difficultyDistribution[level] > 0),
    misconceptionTagsExist: generated.variants.some((v) => (v.misconceptionTags || []).length > 1),
    worksheetCompatibilitySet: generated.variants.every((v) => typeof v.worksheetCompatible === 'boolean'),
    sessionCompatibilitySet: generated.variants.every((v) => Array.isArray(v.compatibleSessionTypes) && v.compatibleSessionTypes.length),
  };
  const practiceSet = createTemporaryPracticeSet({ patternInput: pattern, generated, title: 'Validation Practice Set' });
  practiceSet.approved = true;
  PRACTICE_SET_STORE.set(practiceSet.practiceSetId, practiceSet);
  const practiceLoadable = Boolean(PRACTICE_SET_STORE.get(practiceSet.practiceSetId)?.generatedQuestions?.length);
  checks.teacherCanApproveGeneratedSet = Boolean(practiceSet.approved);
  checks.approvedSetCanLoad = practiceLoadable;
  return { isValid: Object.values(checks).every(Boolean), checks, sample: { pattern, variants: generated.variants.slice(0, 3), quality: generated.quality, practiceSet } };
}

export default {
  extractQuestionPattern,
  generateVariantsFromPattern,
  saveTrainedQuestionPattern,
  createTemporaryPracticeSet,
  approvePracticeSet,
  getPracticeSet,
  listApprovedPracticeSets,
  startSimilarQuestionPractice,
  submitSimilarQuestionPractice,
  checkSimilarQuestionAnswer,
  validateQuestionPatternTrainer,
};
