import GeneratedQuestion from '../../models/mathpath/GeneratedQuestion.js';
import MathPathQuestionFamily from '../../models/mathpath/MathPathQuestionFamily.js';
import {
  evaluateQuestionVisualCoverage,
  getFractionVisualRequirementAudit,
} from './skillVisualRequirementEngine.js';
import { getVisualModelRegistry } from './visualModelRegistry.js';

function idOf(question = {}, index = 0) {
  return question._id?.toString?.() || question.id || question.questionId || question.fingerprint || `visual_question_${index + 1}`;
}

function textOf(question = {}) {
  return String(question.questionText || question.prompt || question.text || question.stem || question.title || '').trim();
}

function skillIdOf(question = {}) {
  return String(question.skillId || question.skillCode || question.frameworkSkillId || question.officialSkillCode || question.metadata?.mathPathSkillId || '').trim().toUpperCase();
}

function levelOf(question = {}) {
  return String(question.moeLevel || question.singaporeLevel || question.metadata?.moeLevel || question.metadata?.level || 'Unmapped').trim() || 'Unmapped';
}

function familyToQuestionLike(family = {}) {
  return {
    id: `family_${family.questionFamilyId || family._id}`,
    skillId: family.skillId,
    skillName: family.skillName || family.name || family.skillId,
    questionText: `${family.name || ''}. ${family.description || ''}`.trim(),
    moeLevel: family.moeLevel || family.metadata?.moeLevel || '',
    requiredVisualTypes: family.requiredVisualTypes || family.metadata?.requiredVisualTypes || [],
    visualType: family.visualType || family.metadata?.visualType || '',
    metadata: { ...(family.metadata || {}), sourceType: 'question_family' },
  };
}

export function auditQuestionVisualCoverage(questions = []) {
  const questionRows = (questions || []).map((question, index) => {
    const coverage = evaluateQuestionVisualCoverage(question);
    return {
      questionId: idOf(question, index),
      skillId: skillIdOf(question),
      skillName: question.skillName || coverage.skillName || skillIdOf(question),
      level: levelOf(question),
      questionText: textOf(question),
      requiredVisualTypes: coverage.requiredVisualTypes,
      optionalVisualTypes: coverage.optionalVisualTypes,
      providedVisualTypes: coverage.providedVisualTypes,
      missingVisualTypes: coverage.missingVisualTypes,
      hasVisual: coverage.hasVisual,
      status: coverage.status,
      reasons: coverage.requirements.map((row) => row.reason).filter(Boolean),
    };
  });

  const requiredQuestionRows = questionRows.filter((row) => row.requiredVisualTypes.length);
  const missingQuestionVisuals = questionRows.filter((row) => row.missingVisualTypes.length);
  const visualCoveragePercent = requiredQuestionRows.length
    ? Math.round(((requiredQuestionRows.length - missingQuestionVisuals.length) / requiredQuestionRows.length) * 100)
    : 100;

  const visualCoverageByLevel = [...questionRows.reduce((map, row) => {
    const key = row.level || 'Unmapped';
    const entry = map.get(key) || { level: key, requiredQuestions: 0, missingVisualQuestions: 0, visualCoveragePercent: 100 };
    if (row.requiredVisualTypes.length) entry.requiredQuestions += 1;
    if (row.missingVisualTypes.length) entry.missingVisualQuestions += 1;
    map.set(key, entry);
    return map;
  }, new Map()).values()].map((entry) => ({
    ...entry,
    visualCoveragePercent: entry.requiredQuestions
      ? Math.round(((entry.requiredQuestions - entry.missingVisualQuestions) / entry.requiredQuestions) * 100)
      : 100,
  }));

  const skillVisualCoverage = getFractionVisualRequirementAudit(questions);
  const skillsMissingVisuals = skillVisualCoverage.filter((row) => (
    row.visualModelRequired && row.currentStatus !== 'implemented'
  ));
  const barModelFindings = skillVisualCoverage
    .filter((row) => row.requiredVisualTypes.includes('bar_model') || row.optionalVisualTypes.includes('bar_model'))
    .map((row) => ({
      skillId: row.skillId,
      skillName: row.skillName,
      currentStatus: row.currentStatus,
      missingQuestionCount: row.missingQuestionCount,
      qualityConcerns: row.qualityConcerns,
      recommendation: row.currentStatus === 'implemented'
        ? 'Maintain bar-model coverage and include it in worksheet rendering.'
        : 'Add explicit bar_model metadata and model-method diagrams for word-problem questions.',
    }));

  return {
    generatedAt: new Date().toISOString(),
    totalQuestions: questionRows.length,
    visualModelRegistry: getVisualModelRegistry(),
    visualCoveragePercent,
    requiredQuestionCount: requiredQuestionRows.length,
    missingVisualQuestionCount: missingQuestionVisuals.length,
    skillVisualCoverage,
    skillsMissingVisuals,
    missingQuestionVisuals: missingQuestionVisuals.slice(0, 100),
    visualCoverageByLevel,
    barModelFindings,
  };
}

export async function getQuestionVisualQualityAudit({ domainId = 'fractions', limit = 500 } = {}) {
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
    ...auditQuestionVisualCoverage(questionRows),
  };
}

export default {
  auditQuestionVisualCoverage,
  getQuestionVisualQualityAudit,
};
