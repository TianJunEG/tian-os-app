import { fractionSkillGraph, getDependents, getPrerequisites, getSkill } from './fractionSkillGraph.js';
import { getQuestionFamily } from './fractionQuestionFamilies.js';

const HIGH_CONFIDENCE = new Set(['i_know_this', 'confident', 'very confident', 'high', '4', '3']);
const LOW_CONFIDENCE = new Set(['dont_know', "don't know", 'guessing', 'guess', 'low', '1']);

export const FRACTION_MISCONCEPTION_LIBRARY = [
  {
    misconceptionId: 'frac_denominator_larger_means_larger',
    domainId: 'fractions',
    skillIds: ['F006', 'F008', 'F009'],
    description: 'Student may think a larger denominator always means a larger fraction.',
    detectionRules: ['wrong on unit/same-numerator comparison', 'fast inaccurate answer', 'high confidence with incorrect comparison'],
    suggestedIntervention: 'Use fraction bars to show that more equal parts make each part smaller.',
  },
  {
    misconceptionId: 'frac_numerator_only_comparison',
    domainId: 'fractions',
    skillIds: ['F007', 'F009'],
    description: 'Student may compare only numerators and ignore denominator size.',
    detectionRules: ['wrong on ordering/comparison', 'weak same-denominator or ordering evidence'],
    suggestedIntervention: 'Compare fractions with common denominators first, then contrast with unlike denominators.',
  },
  {
    misconceptionId: 'frac_common_denominator_gap',
    domainId: 'fractions',
    skillIds: ['F010', 'F011', 'F012', 'F018', 'F019'],
    description: 'Student may not yet use equivalent fractions or common denominators reliably.',
    detectionRules: ['weak equivalent fractions', 'weak simplifying', 'wrong unlike-denominator operations'],
    suggestedIntervention: 'Rebuild equivalent fractions before practising unlike-denominator operations.',
  },
  {
    misconceptionId: 'frac_part_whole_model_gap',
    domainId: 'fractions',
    skillIds: ['F001', 'F002', 'F003', 'F004', 'F005'],
    description: 'Student may not yet connect numerator, denominator, and equal parts in a model.',
    detectionRules: ['weak foundation skills', 'diagram/model questions wrong', 'missing working on visual questions'],
    suggestedIntervention: 'Use shaded-bar and number-line models before symbolic questions.',
  },
  {
    misconceptionId: 'frac_mixed_improper_conversion_gap',
    domainId: 'fractions',
    skillIds: ['F013', 'F014', 'F015'],
    description: 'Student may be unsure how wholes and fractional parts combine.',
    detectionRules: ['weak improper/mixed conversion skills', 'slow or skipped conversion questions'],
    suggestedIntervention: 'Use whole-number boxes plus fraction boxes, then convert with repeated denominators.',
  },
  {
    misconceptionId: 'frac_operation_procedure_gap',
    domainId: 'fractions',
    skillIds: ['F016', 'F017', 'F018', 'F019', 'F021', 'F022'],
    description: 'Student may know fraction meaning but not the operation procedure yet.',
    detectionRules: ['operation skills weak', 'foundations stronger than operations', 'slow accurate or slow inaccurate operation attempts'],
    suggestedIntervention: 'Teach one operation structure at a time and require worked steps.',
  },
];

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function confidenceBand(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (HIGH_CONFIDENCE.has(normalized) || normalized.includes('know') || normalized.includes('confident')) return 'high';
  if (LOW_CONFIDENCE.has(normalized) || normalized.includes('guess') || normalized.includes('dont')) return 'low';
  if (normalized.includes('sure') || normalized === '2') return 'medium';
  return 'unknown';
}

function responseTimeTarget(response = {}) {
  return getQuestionFamily(response.questionFamilyId)?.fluencyTargetSeconds || response.estimatedSeconds || 20;
}

function hasWorkingEvidence(response = {}) {
  return Boolean(
    response.workingSubmitted
    || response.workingUploaded
    || response.fullscreenWorkingSubmitted
    || response.workingImage
    || response.fullscreenWorkingImage
    || (Array.isArray(response.workingStrokes) && response.workingStrokes.length)
    || (Array.isArray(response.workingEvidence) && response.workingEvidence.length)
  );
}

function workingLength(response = {}) {
  const strokes = [
    ...(Array.isArray(response.workingStrokes) ? response.workingStrokes : []),
    ...(Array.isArray(response.fullscreenWorkingStrokes) ? response.fullscreenWorkingStrokes : []),
    ...(Array.isArray(response.workingEvidence)
      ? response.workingEvidence.flatMap((item) => Array.isArray(item?.strokes) ? item.strokes : [])
      : []),
  ];
  return strokes.reduce((sum, stroke) => sum + (Array.isArray(stroke?.points) ? stroke.points.length : 0), 0);
}

function classifyFluency(response = {}) {
  if (response.skipped) {
    return Number(response.timeTaken || response.timeSpentSeconds || 0) <= 8 ? 'skip_fast' : 'skip_slow';
  }
  const time = Number(response.timeTaken || response.timeSpentSeconds || 0);
  const fast = time <= responseTimeTarget(response);
  if (response.correct && fast) return 'fast_accurate';
  if (response.correct && !fast) return 'slow_accurate';
  if (!response.correct && fast) return 'fast_inaccurate';
  return 'slow_inaccurate';
}

function masteryBand(score = {}) {
  const accuracy = Number(score.accuracy || 0);
  const fluency = Number(score.fluencyAccuracy || 0);
  const skipped = Number(score.skippedRate || 0);
  if (accuracy >= 92 && fluency >= 75 && skipped < 10) return 'Mastered';
  if (accuracy >= 85 && skipped < 15) return 'Secure';
  if (accuracy >= 60) return 'Developing';
  return 'Emerging';
}

function buildSkillEvidence(responses = [], skillScores = {}) {
  const bySkill = new Map();
  responses.forEach((response) => {
    if (!response.skillId) return;
    if (!bySkill.has(response.skillId)) {
      const skill = getSkill(response.skillId);
      bySkill.set(response.skillId, {
        skillId: response.skillId,
        skillName: skill?.name || response.skillId,
        parentSkill: 'Fractions',
        prerequisites: getPrerequisites(response.skillId),
        dependents: getDependents(response.skillId),
        difficultyLevel: skill?.difficulty || null,
        moeMapping: skill?.curriculumTags || null,
        questionsAttempted: 0,
        questionsCorrect: 0,
        questionsWrong: 0,
        skipped: 0,
        totalTimeSeconds: 0,
        confidenceCounts: { high: 0, medium: 0, low: 0, unknown: 0 },
        workingSubmittedCount: 0,
        workingNotNeededCount: 0,
        workingLengthPoints: 0,
        evidence: [],
      });
    }
    const row = bySkill.get(response.skillId);
    const time = Number(response.timeTaken || response.timeSpentSeconds || 0);
    const confidence = confidenceBand(response.confidence || response.confidenceLevel || response.reflection);
    row.questionsAttempted += 1;
    row.totalTimeSeconds += time;
    if (response.skipped) row.skipped += 1;
    else if (response.correct) row.questionsCorrect += 1;
    else row.questionsWrong += 1;
    row.confidenceCounts[confidence] += 1;
    if (hasWorkingEvidence(response)) row.workingSubmittedCount += 1;
    if (response.workingNotNeeded) row.workingNotNeededCount += 1;
    row.workingLengthPoints += workingLength(response);
    row.evidence.push({
      questionId: response.questionId,
      questionFamilyId: response.questionFamilyId,
      correct: Boolean(response.correct),
      skipped: Boolean(response.skipped),
      timeTakenSeconds: time,
      confidence,
      workingEvidenceAvailable: hasWorkingEvidence(response),
      fluencySignal: classifyFluency(response),
    });
  });

  return [...bySkill.values()].map((row) => {
    const score = skillScores[row.skillId] || {};
    const accuracy = row.questionsAttempted ? (row.questionsCorrect / row.questionsAttempted) * 100 : 0;
    return {
      ...row,
      accuracy: round(score.accuracy ?? accuracy, 1),
      averageTimeSeconds: row.questionsAttempted ? round(row.totalTimeSeconds / row.questionsAttempted, 1) : null,
      workingEvidenceRate: row.questionsAttempted ? round((row.workingSubmittedCount / row.questionsAttempted) * 100, 1) : 0,
      masteryBand: masteryBand(score),
    };
  });
}

function detectMisconceptions({ skillEvidence = [], weakSkillIds = [] }) {
  const weakSet = new Set(weakSkillIds);
  return FRACTION_MISCONCEPTION_LIBRARY
    .map((definition) => {
      const relevant = skillEvidence.filter((row) => definition.skillIds.includes(row.skillId));
      const weakRelevant = relevant.filter((row) => weakSet.has(row.skillId) || row.accuracy < 70);
      const fastWrong = relevant.reduce((sum, row) => sum + row.evidence.filter((e) => e.fluencySignal === 'fast_inaccurate').length, 0);
      const overconfidentWrong = relevant.reduce(
        (sum, row) => sum + row.evidence.filter((e) => !e.correct && e.confidence === 'high').length,
        0
      );
      const evidenceCount = weakRelevant.length + fastWrong + overconfidentWrong;
      if (!evidenceCount) return null;
      return {
        ...definition,
        confidence: Math.min(95, 45 + evidenceCount * 15),
        evidenceSkillIds: weakRelevant.map((row) => row.skillId),
        evidenceQuestionIds: relevant.flatMap((row) => row.evidence.filter((e) => !e.correct || e.skipped).map((e) => e.questionId)).slice(0, 8),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);
}

function detectRootCauses({ skillEvidence = [], weakSkillIds = [], suspectedPrerequisiteGaps = [], misconceptions = [] }) {
  const weakSet = new Set(weakSkillIds);
  const rows = [];

  misconceptions.slice(0, 4).forEach((m) => {
    rows.push({
      rootCauseId: `root_${m.misconceptionId}`,
      title: m.description,
      why: `Detected from weak skills ${m.evidenceSkillIds.join(', ') || m.skillIds.join(', ')} and ${m.evidenceQuestionIds.length} question signals.`,
      evidenceSkillIds: m.evidenceSkillIds,
      evidenceQuestionIds: m.evidenceQuestionIds,
      suggestedIntervention: m.suggestedIntervention,
      confidence: m.confidence,
    });
  });

  suspectedPrerequisiteGaps.forEach((skillId) => {
    const blocked = skillEvidence.filter((row) => row.prerequisites.includes(skillId) && weakSet.has(row.skillId));
    if (!blocked.length) return;
    const skill = getSkill(skillId);
    rows.push({
      rootCauseId: `root_prereq_${skillId}`,
      title: `${skill?.name || skillId} may be blocking later skills`,
      why: `This prerequisite supports ${blocked.map((row) => row.skillName).join(', ')}.`,
      evidenceSkillIds: [skillId, ...blocked.map((row) => row.skillId)],
      evidenceQuestionIds: blocked.flatMap((row) => row.evidence.filter((e) => !e.correct || e.skipped).map((e) => e.questionId)).slice(0, 8),
      suggestedIntervention: `Review ${skill?.name || skillId} before returning to the later skill.`,
      confidence: 70,
    });
  });

  return rows.sort((a, b) => b.confidence - a.confidence);
}

function buildConfidenceInsights(skillEvidence = []) {
  return skillEvidence.map((row) => {
    const highWrong = row.evidence.filter((e) => !e.correct && e.confidence === 'high').length;
    const lowCorrect = row.evidence.filter((e) => e.correct && e.confidence === 'low').length;
    const highCorrect = row.evidence.filter((e) => e.correct && e.confidence === 'high').length;
    const lowWrong = row.evidence.filter((e) => !e.correct && e.confidence === 'low').length;
    let category = 'Mixed confidence';
    if (highCorrect >= Math.max(1, row.questionsAttempted * 0.5)) category = 'High Confidence + High Accuracy';
    else if (highWrong > 0) category = 'High Confidence + Low Accuracy';
    else if (lowCorrect > 0) category = 'Low Confidence + High Accuracy';
    else if (lowWrong > 0) category = 'Low Confidence + Low Accuracy';
    return {
      skillId: row.skillId,
      skillName: row.skillName,
      category,
      insight: category === 'High Confidence + Low Accuracy'
        ? `Student appears overconfident in ${row.skillName}.`
        : category === 'Low Confidence + High Accuracy'
          ? `Student can answer ${row.skillName} but may need confidence-building practice.`
          : category === 'Low Confidence + Low Accuracy'
            ? `${row.skillName} needs guided rebuilding.`
            : `${row.skillName} confidence is broadly aligned with performance.`,
    };
  });
}

function buildFluencyInsights(skillEvidence = []) {
  return skillEvidence.map((row) => {
    const counts = row.evidence.reduce((acc, item) => {
      acc[item.fluencySignal] = (acc[item.fluencySignal] || 0) + 1;
      return acc;
    }, {});
    const primary = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    const labels = {
      fast_accurate: 'Fast Accurate',
      slow_accurate: 'Slow Accurate',
      fast_inaccurate: 'Fast Inaccurate',
      slow_inaccurate: 'Slow Inaccurate',
      skip_fast: 'Skip + Fast',
      skip_slow: 'Skip + Slow',
      unknown: 'Unknown',
    };
    return {
      skillId: row.skillId,
      skillName: row.skillName,
      category: labels[primary],
      insight: primary === 'slow_accurate'
        ? `${row.skillName}: understanding is present, but fluency needs practice.`
        : primary === 'fast_inaccurate'
          ? `${row.skillName}: quick incorrect answers suggest a possible misconception.`
          : primary === 'slow_inaccurate'
            ? `${row.skillName}: student is spending time but still struggling.`
            : primary === 'skip_fast'
              ? `${row.skillName}: student may be avoiding this type quickly.`
              : primary === 'skip_slow'
                ? `${row.skillName}: student attempted but could not complete confidently.`
                : `${row.skillName}: responses are accurate and fluent.`,
    };
  });
}

function buildReadinessComponents({ validResponses = [], skillEvidence = [], masteredSkillIds = [] }) {
  const total = Math.max(1, validResponses.length);
  const correct = validResponses.filter((r) => r.correct).length;
  const fluent = validResponses.filter((r) => classifyFluency(r) === 'fast_accurate').length;
  const calibrated = validResponses.filter((r) => {
    const c = confidenceBand(r.confidence || r.confidenceLevel || r.reflection);
    return (r.correct && c === 'high') || (!r.correct && (c === 'medium' || c === 'low'));
  }).length;
  const working = validResponses.filter(hasWorkingEvidence).length;
  const knowledge = round((correct / total) * 100);
  const fluency = round((fluent / total) * 100);
  const confidence = round((calibrated / total) * 100);
  const workingQuality = round((working / total) * 100);
  const retention = masteredSkillIds.length ? round((masteredSkillIds.length / Math.max(1, skillEvidence.length)) * 100) : null;
  const overall = round(
    knowledge * 0.45
    + fluency * 0.2
    + confidence * 0.15
    + (retention ?? knowledge) * 0.1
    + workingQuality * 0.1
  );
  return {
    knowledge,
    fluency,
    confidence,
    retention,
    workingQuality,
    overall,
    explanation: 'Overall combines knowledge, fluency, confidence calibration, retention evidence, and working evidence. Timing is a signal, not the only mastery rule.',
  };
}

function buildRecommendations({ recommendedStartingSkillId, rootCauses = [], misconceptions = [] }) {
  const skill = getSkill(recommendedStartingSkillId);
  const root = rootCauses[0];
  const misconception = misconceptions[0];
  return {
    student: `Practise ${skill?.name || recommendedStartingSkillId}. Focus on showing each step clearly.`,
    parent: root
      ? `${root.title}. Recommended action: ${root.suggestedIntervention}`
      : `Start with ${skill?.name || recommendedStartingSkillId} and review progress after one short practice session.`,
    tutor: misconception
      ? `Next lesson priority: ${misconception.description}. Intervention: ${misconception.suggestedIntervention}`
      : `Teach ${skill?.name || recommendedStartingSkillId}, then check prerequisite links.`,
    teacher: misconception
      ? `Group students showing ${misconception.misconceptionId.replace(/_/g, ' ')} for targeted remediation.`
      : `Place student in a small remediation group for ${skill?.name || recommendedStartingSkillId}.`,
  };
}

export function buildSkillGraphArchitecture() {
  return {
    domainId: fractionSkillGraph.domainId,
    parentSkill: fractionSkillGraph.domainName,
    totalSkills: fractionSkillGraph.skills.length,
    skills: fractionSkillGraph.skills.map((skill) => ({
      skillId: skill.id,
      skillName: skill.name,
      parentSkill: 'Fractions',
      strand: skill.strand,
      prerequisites: skill.prerequisites,
      difficultyLevel: skill.difficulty,
      moeMapping: skill.curriculumTags,
    })),
  };
}

export function buildDiagnosticExplainability(options = {}) {
  const {
    responses = [],
    skillScores = {},
    weakSkillIds = [],
    masteredSkillIds = [],
    suspectedPrerequisiteGaps = [],
    recommendedStartingSkillId = 'F001',
  } = options;
  const validResponses = responses.filter((r) => r?.skillId);
  const skillEvidence = buildSkillEvidence(validResponses, skillScores);
  const misconceptions = detectMisconceptions({ skillEvidence, weakSkillIds });
  const rootCauses = detectRootCauses({ skillEvidence, weakSkillIds, suspectedPrerequisiteGaps, misconceptions });
  const confidenceInsights = buildConfidenceInsights(skillEvidence);
  const fluencyInsights = buildFluencyInsights(skillEvidence);
  const readinessComponents = buildReadinessComponents({ validResponses, skillEvidence, masteredSkillIds });
  const recommendations = buildRecommendations({ recommendedStartingSkillId, rootCauses, misconceptions });

  return {
    skillGraph: buildSkillGraphArchitecture(),
    skillEvidence,
    rootCauses,
    misconceptions,
    confidenceInsights,
    fluencyInsights,
    readinessComponents,
    masteryBands: skillEvidence.map((row) => ({
      skillId: row.skillId,
      skillName: row.skillName,
      band: row.masteryBand,
      rule: 'Emerging <60% accuracy; Developing 60-84%; Secure 85%+ with low skipping; Mastered 92%+ with fluency.',
    })),
    recommendations,
    audit: {
      unexplainedScores: [],
      hasEvidence: skillEvidence.every((row) => row.evidence.length > 0),
      hasReasoning: rootCauses.length > 0 || weakSkillIds.length === 0,
      hasRecommendation: Boolean(recommendations.student && recommendations.parent && recommendations.tutor && recommendations.teacher),
    },
  };
}

export function validateDiagnosticExplainabilityEngine() {
  const explainability = buildDiagnosticExplainability({
    responses: [
      { questionId: 'q1', skillId: 'F006', questionFamilyId: 'QF_F006_001', correct: false, timeTaken: 6, confidence: 'i_know_this', skipped: false },
      { questionId: 'q2', skillId: 'F008', questionFamilyId: 'QF_F008_001', correct: false, timeTaken: 7, confidence: 'i_know_this', skipped: false },
      { questionId: 'q3', skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: true, timeTaken: 18, confidence: 'not_sure', skipped: false, workingSubmitted: true },
    ],
    skillScores: {
      F006: { accuracy: 0, fluencyAccuracy: 0, skippedRate: 0 },
      F008: { accuracy: 0, fluencyAccuracy: 0, skippedRate: 0 },
      F010: { accuracy: 100, fluencyAccuracy: 80, skippedRate: 0 },
    },
    weakSkillIds: ['F006', 'F008'],
    masteredSkillIds: ['F010'],
    suspectedPrerequisiteGaps: ['F004'],
    recommendedStartingSkillId: 'F004',
  });
  return {
    isValid:
      explainability.skillEvidence.length >= 3
      && explainability.rootCauses.length > 0
      && explainability.misconceptions.length > 0
      && explainability.readinessComponents.explanation
      && explainability.recommendations.student
      && explainability.audit.hasRecommendation,
    sample: explainability,
  };
}

export default {
  FRACTION_MISCONCEPTION_LIBRARY,
  buildDiagnosticExplainability,
  buildSkillGraphArchitecture,
  validateDiagnosticExplainabilityEngine,
};
