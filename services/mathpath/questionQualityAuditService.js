import GeneratedQuestion from '../../models/mathpath/GeneratedQuestion.js';
import MathPathQuestionFamily from '../../models/mathpath/MathPathQuestionFamily.js';
import { evaluateDiagramRequirement } from './questionDiagramRequirementEngine.js';
import { analyseQuestionVariation } from './questionVariationEngine.js';

const FRACTION_SKILL_NAMES = {
  F001: 'Recognise Fractions',
  F002: 'Numerator and Denominator',
  F003: 'Fraction of a Whole',
  F004: 'Unit Fractions',
  F005: 'Fractions on Number Line',
  F006: 'Compare Unit Fractions',
  F007: 'Compare Same Denominator',
  F008: 'Compare Same Numerator',
  F009: 'Order Fractions',
  F010: 'Equivalent Fractions',
  F011: 'Generate Equivalent Fractions',
  F012: 'Simplify Fractions',
  F013: 'Improper Fractions',
  F014: 'Mixed Numbers',
  F015: 'Convert Mixed and Improper',
  F016: 'Add Same Denominator',
  F017: 'Subtract Same Denominator',
  F018: 'Add Different Denominators',
  F019: 'Subtract Different Denominators',
  F020: 'Fraction of Quantity',
  F021: 'Multiply Fractions',
  F022: 'Divide Fractions',
  F023: 'Fraction Word Problems',
  F024: 'Multi-Step Fraction Problems',
  F025: 'Exam-Style Fraction Applications',
  F026: 'Fractions Mastery Challenge',
};

const P5_PLUS_SKILLS = new Set(['F022', 'F024', 'F026']);
const HIGH_WORKING_SKILLS = new Set(['F018', 'F019', 'F023', 'F024', 'F025', 'F026']);
const EXPECTED_MISCONCEPTIONS_BY_SKILL = {
  F006: ['unit_fraction_denominator_order'],
  F007: ['same_denominator_numerator_comparison'],
  F008: ['same_numerator_denominator_comparison'],
  F010: ['equivalence_scale_error'],
  F012: ['incorrect_simplification'],
  F015: ['mixed_improper_conversion_error'],
  F018: ['missing_common_denominator', 'fraction_add_denominators_directly'],
  F019: ['missing_common_denominator', 'fraction_subtract_denominators_directly'],
  F020: ['fraction_of_quantity_whole_error'],
  F023: ['word_problem_operation_error'],
  F024: ['multi_step_order_error'],
  F025: ['uses_original_instead_of_remainder'],
  F026: ['multi_step_order_error', 'model_method_gap'],
};

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function textOf(question = {}) {
  return String(question.questionText || question.prompt || question.text || question.stem || '').trim();
}

function skillIdOf(question = {}) {
  return String(question.skillId || question.skillCode || question.frameworkSkillId || '').trim().toUpperCase();
}

function idOf(question = {}, index = 0) {
  return question._id?.toString?.() || question.id || question.questionId || question.fingerprint || `question_${index + 1}`;
}

function answerInputType(question = {}) {
  const metadata = question.metadata || {};
  return String(
    question.answerInputType ||
    question.inputType ||
    question.answerType ||
    metadata.answerInputType ||
    metadata.inputType ||
    metadata.answerType ||
    ''
  ).trim().toLowerCase();
}

function hasFractionLanguage(text = '') {
  return /\b\d+\s*\/\s*\d+\b|fraction|numerator|denominator|mixed number|improper/i.test(text);
}

function scoreCurriculumAlignment(question = {}) {
  const text = textOf(question);
  const skillId = skillIdOf(question);
  const flags = [];
  let score = 90;

  if (/\bdivide fractions?\b|reciprocal|keep change flip/i.test(text) && !P5_PLUS_SKILLS.has(skillId)) {
    score -= 35;
    flags.push('possible_out_of_level_fraction_division');
  }
  if (/\balgebra\b|\bx\s*[+=-]|percentage|ratio/i.test(text) && !['F024', 'F026'].includes(skillId)) {
    score -= 25;
    flags.push('possible_topic_scope_drift');
  }
  if (skillId && FRACTION_SKILL_NAMES[skillId] && question.skillName && !String(question.skillName).toLowerCase().includes(FRACTION_SKILL_NAMES[skillId].split(' ')[0].toLowerCase())) {
    score -= 10;
    flags.push('skill_title_mapping_needs_review');
  }

  return { score: clampScore(score), flags };
}

function scoreClarity(question = {}) {
  const text = textOf(question);
  const flags = [];
  let score = 90;

  if (!text) {
    return { score: 0, flags: ['missing_question_text'] };
  }
  if (text.length > 280) {
    score -= 20;
    flags.push('question_wording_too_long');
  }
  if (!/[?.]$/.test(text)) {
    score -= 5;
    flags.push('missing_terminal_punctuation');
  }
  if (/\bthing\b|\bstuff\b|\bsome amount\b/i.test(text)) {
    score -= 15;
    flags.push('vague_context');
  }
  if (/\bundefined\b|\bNaN\b|\{\{|\}\}/i.test(text)) {
    score -= 45;
    flags.push('template_token_leak');
  }

  return { score: clampScore(score), flags };
}

function scoreAgeAppropriateness(question = {}) {
  const text = textOf(question);
  const difficulty = Number(question.difficultyLevel || question.difficulty || question.level || 3);
  const flags = [];
  let score = 90;

  if (difficulty > 4 && !['F023', 'F024', 'F025', 'F026'].includes(skillIdOf(question))) {
    score -= 20;
    flags.push('difficulty_high_for_foundation_skill');
  }
  if (text.split(/\s+/).filter(Boolean).length > 70) {
    score -= 15;
    flags.push('high_reading_load');
  }
  if (/\bquadratic\b|\btrigonometry\b|\bgradient\b/i.test(text)) {
    score -= 45;
    flags.push('out_of_primary_scope_language');
  }

  return { score: clampScore(score), flags };
}

function scoreMisconceptionCoverage(question = {}) {
  const skillId = skillIdOf(question);
  const tags = (question.misconceptionTags || question.metadata?.misconceptionTags || []).map((tag) => String(tag || '').trim()).filter(Boolean);
  const expected = EXPECTED_MISCONCEPTIONS_BY_SKILL[skillId] || [];
  const flags = [];
  let score = expected.length ? 65 : 85;

  if (expected.length && tags.length) {
    const covered = expected.filter((tag) => tags.includes(tag)).length;
    score = 70 + Math.round((covered / expected.length) * 30);
  } else if (expected.length) {
    flags.push('missing_misconception_tags');
  }

  if (HIGH_WORKING_SKILLS.has(skillId) && !question.workingRequired && !question.requiresWorking) {
    score -= 10;
    flags.push('working_evidence_should_be_stronger');
  }

  return { score: clampScore(score), flags };
}

function scoreAnswerInput(question = {}) {
  const text = textOf(question);
  const inputType = answerInputType(question);
  const flags = [];
  let score = 85;

  if (hasFractionLanguage(text) && inputType === 'text') {
    score -= 25;
    flags.push('fraction_answer_should_not_be_plain_text_only');
  }
  if (hasFractionLanguage(text) && !inputType && !question.acceptedAnswers?.length) {
    score -= 15;
    flags.push('fraction_answer_input_unspecified');
  }
  if (/mixed number|improper/i.test(text) && inputType && !/mixed|fraction|numeric/.test(inputType)) {
    score -= 20;
    flags.push('mixed_number_input_needs_fraction_support');
  }

  return { score: clampScore(score), flags };
}

function detectInvalidCountableFraction(question = {}) {
  const text = textOf(question);
  const match = text.match(/\b1\s*\/\s*(\d+)\s+of\s+(\d+)\b/i);
  if (!match) return null;
  const denominator = Number(match[1]);
  const total = Number(match[2]);
  if (!denominator || !total) return null;
  return total % denominator === 0 ? null : 'countable_fraction_has_non_integer_intermediate';
}

export function scoreQuestionQuality(question = {}, index = 0, variationContext = {}) {
  const diagram = evaluateDiagramRequirement(question);
  const curriculum = scoreCurriculumAlignment(question);
  const clarity = scoreClarity(question);
  const age = scoreAgeAppropriateness(question);
  const misconception = scoreMisconceptionCoverage(question);
  const answerInput = scoreAnswerInput(question);
  const invalidContextFlag = detectInvalidCountableFraction(question);
  const diversityPenalty = variationContext.repeatedQuestionIds?.has?.(idOf(question, index)) ? 35 : 0;
  const diversityScore = clampScore(90 - diversityPenalty);
  const diagramQuality = diagram.requiresDiagram ? (diagram.missingVisuals.length ? 35 : 90) : 85;
  const flags = [
    ...curriculum.flags,
    ...clarity.flags,
    ...age.flags,
    ...misconception.flags,
    ...answerInput.flags,
    ...(diagram.missingVisuals.length ? ['missing_required_visual_model'] : []),
    ...(invalidContextFlag ? [invalidContextFlag] : []),
  ];

  const componentScores = {
    curriculumAlignment: curriculum.score,
    diagramQuality: clampScore(diagramQuality),
    clarity: clarity.score,
    ageAppropriateness: age.score,
    misconceptionCoverage: misconception.score,
    answerInputSuitability: answerInput.score,
    diversityScore,
  };
  const qualityScore = clampScore(
    componentScores.curriculumAlignment * 0.2 +
    componentScores.diagramQuality * 0.18 +
    componentScores.clarity * 0.16 +
    componentScores.ageAppropriateness * 0.14 +
    componentScores.misconceptionCoverage * 0.14 +
    componentScores.answerInputSuitability * 0.1 +
    componentScores.diversityScore * 0.08 -
    (invalidContextFlag ? 20 : 0)
  );

  return {
    questionId: idOf(question, index),
    skillId: skillIdOf(question),
    skillName: question.skillName || FRACTION_SKILL_NAMES[skillIdOf(question)] || '',
    questionText: textOf(question),
    qualityScore,
    componentScores,
    diagram,
    flags: [...new Set(flags)],
  };
}

export function buildMisconceptionCoverage(questions = []) {
  const bySkill = new Map();
  (questions || []).forEach((question) => {
    const skillId = skillIdOf(question);
    if (!skillId) return;
    if (!bySkill.has(skillId)) bySkill.set(skillId, new Set());
    (question.misconceptionTags || question.metadata?.misconceptionTags || []).forEach((tag) => {
      if (tag) bySkill.get(skillId).add(String(tag));
    });
  });

  return Object.entries(EXPECTED_MISCONCEPTIONS_BY_SKILL).map(([skillId, expected]) => {
    const covered = [...(bySkill.get(skillId) || new Set())];
    const missing = expected.filter((tag) => !covered.includes(tag));
    return {
      skillId,
      skillName: FRACTION_SKILL_NAMES[skillId] || skillId,
      covered,
      missing,
      status: missing.length ? 'gap' : 'covered',
    };
  });
}

export function auditQuestionBank(questions = []) {
  const variation = analyseQuestionVariation(questions);
  const repeatedQuestionIds = new Set([
    ...variation.repeatedTemplates.flatMap((group) => group.questionIds),
    ...variation.repeatedNumbers.flatMap((group) => group.questionIds),
    ...variation.repeatedStructures.flatMap((group) => group.questionIds),
  ]);
  const scoredQuestions = (questions || []).map((question, index) => scoreQuestionQuality(question, index, { repeatedQuestionIds }));
  const lowQualityQuestions = scoredQuestions
    .filter((row) => row.qualityScore < 70 || row.flags.length)
    .sort((a, b) => a.qualityScore - b.qualityScore)
    .slice(0, 50);
  const missingDiagrams = scoredQuestions
    .filter((row) => row.diagram.missingVisuals.length)
    .map((row) => ({
      questionId: row.questionId,
      skillId: row.skillId,
      questionText: row.questionText,
      missingVisuals: row.diagram.missingVisuals,
      reasons: row.diagram.requiredVisuals.map((item) => item.reason),
    }))
    .slice(0, 50);
  const difficultyIssues = scoredQuestions
    .filter((row) => row.flags.some((flag) => /difficulty|out_of|scope/.test(flag)))
    .slice(0, 50);
  const answerInputIssues = scoredQuestions
    .filter((row) => row.flags.some((flag) => /answer|input/.test(flag)))
    .slice(0, 50);
  const misconceptionCoverage = buildMisconceptionCoverage(questions);

  return {
    generatedAt: new Date().toISOString(),
    totalQuestions: scoredQuestions.length,
    averageQualityScore: scoredQuestions.length
      ? clampScore(scoredQuestions.reduce((sum, row) => sum + row.qualityScore, 0) / scoredQuestions.length)
      : 0,
    lowQualityQuestions,
    missingDiagrams,
    repeatedTemplates: variation.repeatedTemplates,
    repeatedNumbers: variation.repeatedNumbers,
    repeatedStructures: variation.repeatedStructures,
    diversityScore: variation.diversityScore,
    difficultyIssues,
    answerInputIssues,
    misconceptionCoverage,
    misconceptionGaps: misconceptionCoverage.filter((row) => row.status === 'gap'),
    topIssues: summarizeTopIssues(scoredQuestions),
  };
}

function summarizeTopIssues(scoredQuestions = []) {
  const counts = new Map();
  scoredQuestions.forEach((row) => row.flags.forEach((flag) => counts.set(flag, (counts.get(flag) || 0) + 1)));
  return [...counts.entries()]
    .map(([flag, count]) => ({ flag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function familyToQuestionLike(family = {}) {
  return {
    id: `family_${family.questionFamilyId || family._id}`,
    skillId: family.skillId,
    skillName: FRACTION_SKILL_NAMES[family.skillId] || family.skillId,
    questionText: `${family.name || ''}. ${family.description || ''}`.trim(),
    difficultyLevel: family.difficulty,
    workingRequired: family.workingRequired,
    misconceptionTags: family.misconceptionTags || [],
    metadata: { sourceType: 'question_family' },
  };
}

export async function getQuestionQualityAudit({ domainId = 'fractions', limit = 500 } = {}) {
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 500));
  const [generatedQuestions, families] = await Promise.all([
    GeneratedQuestion.find({ domainId, isActive: true }).sort({ skillId: 1, templateId: 1 }).limit(safeLimit).lean(),
    MathPathQuestionFamily.find({ domainId, isActive: true }).sort({ skillId: 1, questionFamilyId: 1 }).limit(200).lean(),
  ]);
  const questionRows = [
    ...generatedQuestions,
    ...families.map(familyToQuestionLike),
  ];
  return {
    domainId,
    sourceCounts: {
      generatedQuestions: generatedQuestions.length,
      questionFamilies: families.length,
    },
    ...auditQuestionBank(questionRows),
  };
}

export default {
  scoreQuestionQuality,
  auditQuestionBank,
  buildMisconceptionCoverage,
  getQuestionQualityAudit,
};
