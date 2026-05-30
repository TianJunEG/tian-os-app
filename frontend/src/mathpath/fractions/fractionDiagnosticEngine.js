import { fractionSkillGraph, getSkill, getPrerequisites } from './fractionSkillGraph.js';
import { fractionQuestionFamilies, getQuestionFamiliesBySkill, getQuestionFamily } from './fractionQuestionFamilies.js';

const STRAND_THRESHOLDS = {
  Foundation: 85,
  Comparison: 85,
  Equivalence: 90,
  Conversion: 85,
  Operations: 90,
  Applications: 80,
};

const MODE_SKILL_RANGES = {
  basic: ['F001', 'F005'],
  core: ['F001', 'F019'],
  full: ['F001', 'F026'],
};

const ENRICHMENT_LEVELS = new Set(['P1', 'P2']);

const SESSION_STORE = new Map();
const SKILL_ID_SET = new Set(fractionSkillGraph.skillIds);

function skillIdToNumber(skillId) {
  return Number(skillId.replace('F', ''));
}

function buildSkillRange(startId, endId) {
  const start = skillIdToNumber(startId);
  const end = skillIdToNumber(endId);
  return fractionSkillGraph.skillIds.filter((id) => {
    const n = skillIdToNumber(id);
    return n >= start && n <= end;
  });
}

function getModeSkillIds(mode = 'core') {
  const key = String(mode || 'core').toLowerCase();
  const range = MODE_SKILL_RANGES[key] || MODE_SKILL_RANGES.core;
  return buildSkillRange(range[0], range[1]);
}

function defaultModeForLevel(level = 'P4') {
  const normalized = String(level || '').toUpperCase();
  if (normalized === 'P3' || ENRICHMENT_LEVELS.has(normalized)) return 'basic';
  if (normalized === 'P4') return 'core';
  return 'full';
}

function buildSessionId() {
  return `fracdiag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeStrand(skill) {
  if (!skill) return 'Foundation';
  if (skill.strand === 'Representation') return 'Foundation';
  if (skill.strand === 'Assessment Prep' || skill.strand === 'Mastery') return 'Applications';
  return skill.strand;
}

function isFluentResponse(response) {
  const family = getQuestionFamily(response.questionFamilyId);
  const target = family?.fluencyTargetSeconds ?? 20;
  return Boolean(response.correct) && Number(response.timeTaken || 0) <= target;
}

function classifyFluencyFlag(response) {
  if (response.skipped) return 'skipped';
  if (!response.correct) return 'inaccurate';
  return isFluentResponse(response) ? 'accurateAndFluent' : 'accurateButSlow';
}

function computeConfidenceLevel(responses) {
  if (!responses.length) return 'unknown';
  const normalized = responses
    .map((r) => r.confidence)
    .map((value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const v = value.toLowerCase();
        if (v.includes('very')) return 4;
        if (v.includes('confident')) return 3;
        if (v.includes('unsure')) return 2;
        if (v.includes('guess')) return 1;
        const parsed = Number(v);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    })
    .filter((v) => v !== null);

  if (!normalized.length) return 'unknown';
  const avg = normalized.reduce((a, b) => a + b, 0) / normalized.length;
  if (avg >= 3.25) return 'high';
  if (avg >= 2.25) return 'medium';
  return 'low';
}

function aggregateScores(responses, keySelector) {
  const bucket = new Map();
  responses.forEach((response) => {
    const key = keySelector(response);
    if (!key) return;
    if (!bucket.has(key)) {
      bucket.set(key, {
        total: 0,
        correct: 0,
        skipped: 0,
        fluentCorrect: 0,
        accurateButSlow: 0,
        totalTimeOnCorrect: 0,
      });
    }
    const item = bucket.get(key);
    item.total += 1;
    if (response.skipped) item.skipped += 1;
    if (response.correct) {
      item.correct += 1;
      item.totalTimeOnCorrect += Number(response.timeTaken || 0);
      if (isFluentResponse(response)) item.fluentCorrect += 1;
      else item.accurateButSlow += 1;
    }
  });

  return Array.from(bucket.entries()).reduce((acc, [key, value]) => {
    const answered = Math.max(1, value.total - value.skipped);
    acc[key] = {
      totalQuestions: value.total,
      accuracy: Math.round((value.correct / Math.max(1, value.total)) * 1000) / 10,
      fluencyAccuracy: Math.round((value.fluentCorrect / answered) * 1000) / 10,
      accurateButSlowRate: Math.round((value.accurateButSlow / answered) * 1000) / 10,
      skippedRate: Math.round((value.skipped / value.total) * 1000) / 10,
      averageCorrectSeconds: value.correct ? Math.round((value.totalTimeOnCorrect / value.correct) * 10) / 10 : null,
    };
    return acc;
  }, {});
}

function toWeakSkillIds(skillScores) {
  return Object.entries(skillScores)
    .filter(([, score]) => score.accuracy < 85 || score.skippedRate >= 20 || score.accurateButSlowRate >= 50)
    .map(([skillId]) => skillId);
}

function toMasteredSkillIds(skillScores) {
  return Object.entries(skillScores)
    .filter(([, score]) => score.accuracy >= 90 && score.fluencyAccuracy >= 70 && score.skippedRate < 10)
    .map(([skillId]) => skillId);
}

function collectPrerequisiteGaps(weakSkillIds) {
  const weakSet = new Set(weakSkillIds);
  const gaps = new Set();

  function walk(skillId) {
    const prereqs = getPrerequisites(skillId);
    prereqs.forEach((prereqId) => {
      if (!weakSet.has(prereqId)) gaps.add(prereqId);
      walk(prereqId);
    });
  }

  weakSkillIds.forEach((skillId) => walk(skillId));
  return [...gaps].sort((a, b) => skillIdToNumber(a) - skillIdToNumber(b));
}

function buildPracticeQueue(startingSkillId, weakSkillIds) {
  const seen = new Set();
  const queue = [];
  const ordered = [startingSkillId, ...weakSkillIds].filter(Boolean);
  ordered
    .sort((a, b) => skillIdToNumber(a) - skillIdToNumber(b))
    .forEach((skillId) => {
      if (seen.has(skillId)) return;
      seen.add(skillId);
      const families = getQuestionFamiliesBySkill(skillId).map((f) => f.id);
      queue.push({
        skillId,
        skillName: getSkill(skillId)?.name || skillId,
        questionFamilyIds: families,
      });
    });
  return queue;
}

function summarizeForParent(startingSkillId, weakStrands) {
  const startSkillName = getSkill(startingSkillId)?.name || startingSkillId;
  if (!weakStrands.length) {
    return 'Your child is currently showing strong fraction readiness across the scanned skills. We recommend continuing regular mixed fraction practice to maintain fluency and retention.';
  }
  const primaryWeak = weakStrands[0];
  return `Your child shows a solid base in some fraction areas, but needs support in ${primaryWeak}. This is affecting higher-level fraction tasks. We recommend starting at ${startSkillName}.`;
}

function summarizeForStudent(startingSkillId, weakStrands) {
  const startSkillName = getSkill(startingSkillId)?.name || startingSkillId;
  if (!weakStrands.length) {
    return 'Great work. You are doing well in fractions. Keep going with mixed practice to stay fast and accurate.';
  }
  return `You are doing well in parts of fractions. Your next mission is ${startSkillName}. Strengthening this will make harder fraction questions easier.`;
}

export function buildFractionDiagnosticSession(options = {}) {
  const {
    studentLevel = 'P4',
    mode = null,
    previousMasteredSkillIds = [],
    previousWeakSkillIds = [],
  } = options;

  const resolvedMode = String(mode || defaultModeForLevel(studentLevel)).toLowerCase();
  const targetSkillIds = getModeSkillIds(resolvedMode);
  const targetQuestionFamilyIds = targetSkillIds.flatMap((skillId) =>
    getQuestionFamiliesBySkill(skillId)
      .slice(0, 2)
      .map((family) => family.id)
  );

  const sessionId = buildSessionId();
  const session = {
    sessionId,
    mode: resolvedMode,
    studentLevel,
    stage: 'strandScreening',
    targetSkillIds,
    targetQuestionFamilyIds,
    estimatedQuestionCount: targetQuestionFamilyIds.length,
    previousMasteredSkillIds,
    previousWeakSkillIds,
    enrichmentOnly: ENRICHMENT_LEVELS.has(String(studentLevel).toUpperCase()),
  };
  SESSION_STORE.set(sessionId, session);
  return session;
}

export function getWeakStrands(result) {
  const weak = Object.entries(result.strandScores || {})
    .filter(([strand, score]) => {
      const threshold = STRAND_THRESHOLDS[strand] ?? 85;
      return score.accuracy < threshold || score.accurateButSlowRate >= 45;
    })
    .map(([strand]) => strand);
  return weak;
}

export function getDiagnosticDrillDownTargets(result) {
  const weakSkills = result.weakSkillIds || [];
  const weakStrands = getWeakStrands(result);
  const strandSkillIds = new Set(
    (result.targetSkillIds || []).filter((skillId) => weakStrands.includes(normalizeStrand(getSkill(skillId))))
  );

  const allTargets = new Set([...weakSkills, ...strandSkillIds]);
  const drillSkillIds = new Set();
  allTargets.forEach((skillId) => {
    drillSkillIds.add(skillId);
    const prereqs = getPrerequisites(skillId);
    prereqs.forEach((p) => drillSkillIds.add(p));
  });

  const skillIds = [...drillSkillIds].sort((a, b) => skillIdToNumber(a) - skillIdToNumber(b));
  const questionFamilyIds = skillIds.flatMap((skillId) => getQuestionFamiliesBySkill(skillId).map((f) => f.id));
  return { skillIds, questionFamilyIds };
}

export function determineFractionPlacement(result) {
  const weakSet = new Set(result.weakSkillIds || []);
  const candidates = [];

  function earliestWeak(skillId) {
    const prereqs = getPrerequisites(skillId);
    for (const prereq of prereqs) {
      if (weakSet.has(prereq)) return earliestWeak(prereq);
    }
    return skillId;
  }

  [...weakSet].forEach((skillId) => {
    candidates.push(earliestWeak(skillId));
  });

  if (!candidates.length) {
    return (result.targetSkillIds || [])[0] || 'F001';
  }
  return candidates.sort((a, b) => skillIdToNumber(a) - skillIdToNumber(b))[0];
}

export function buildFractionDiagnosticSummary(result) {
  const weakStrands = getWeakStrands(result);
  const recommendedStartingSkillId = determineFractionPlacement(result);
  const recommendedPracticeQueue = buildPracticeQueue(recommendedStartingSkillId, result.weakSkillIds || []);

  return {
    overallFractionReadinessScore: result.overallFractionReadinessScore,
    strandScores: result.strandScores,
    masteredSkillIds: result.masteredSkillIds,
    weakSkillIds: result.weakSkillIds,
    suspectedPrerequisiteGaps: result.suspectedPrerequisiteGaps,
    recommendedStartingSkillId,
    recommendedPracticeQueue,
    fluencyFlags: result.fluencyFlags,
    confidenceLevel: result.confidenceLevel,
    parentFriendlySummary: summarizeForParent(recommendedStartingSkillId, weakStrands),
    studentFriendlySummary: summarizeForStudent(recommendedStartingSkillId, weakStrands),
  };
}

export function scoreFractionDiagnosticAttempt(attempt = {}) {
  const session = SESSION_STORE.get(attempt.sessionId);
  if (!session) {
    throw new Error('Invalid diagnostic sessionId.');
  }
  const responses = Array.isArray(attempt.responses) ? attempt.responses : [];
  const validResponses = responses.filter(
    (r) => SKILL_ID_SET.has(r.skillId) && typeof r.questionFamilyId === 'string'
  );

  const skillScores = aggregateScores(validResponses, (r) => r.skillId);
  const questionFamilyScores = aggregateScores(validResponses, (r) => r.questionFamilyId);
  const strandScores = aggregateScores(validResponses, (r) => normalizeStrand(getSkill(r.skillId)));

  const masteredSkillIds = toMasteredSkillIds(skillScores);
  const weakSkillIds = toWeakSkillIds(skillScores);
  const suspectedPrerequisiteGaps = collectPrerequisiteGaps(weakSkillIds);

  const readinessAccuracy =
    validResponses.length === 0
      ? 0
      : (validResponses.filter((r) => r.correct).length / validResponses.length) * 100;
  const readinessFluency =
    validResponses.length === 0
      ? 0
      : (validResponses.filter((r) => classifyFluencyFlag(r) === 'accurateAndFluent').length / validResponses.length) *
        100;
  const overallFractionReadinessScore = Math.round((readinessAccuracy * 0.7 + readinessFluency * 0.3) * 10) / 10;

  const fluencyFlags = validResponses.map((r) => ({
    questionId: r.questionId,
    skillId: r.skillId,
    questionFamilyId: r.questionFamilyId,
    flag: classifyFluencyFlag(r),
  }));

  const result = {
    sessionId: attempt.sessionId,
    mode: session.mode,
    targetSkillIds: session.targetSkillIds,
    targetQuestionFamilyIds: session.targetQuestionFamilyIds,
    stage: validResponses.length >= session.estimatedQuestionCount ? 'rootCauseDrillDown' : session.stage,
    overallFractionReadinessScore,
    strandScores,
    skillScores,
    questionFamilyScores,
    masteredSkillIds,
    weakSkillIds,
    suspectedPrerequisiteGaps,
    recommendedStartingSkillId: null,
    recommendedPracticeQueue: [],
    fluencyFlags,
    confidenceLevel: computeConfidenceLevel(validResponses),
    parentFriendlySummary: '',
    studentFriendlySummary: '',
  };

  const summary = buildFractionDiagnosticSummary(result);
  return { ...result, ...summary };
}

export function validateFractionDiagnosticEngine() {
  const basic = buildFractionDiagnosticSession({ studentLevel: 'P3', mode: 'basic' });
  const core = buildFractionDiagnosticSession({ studentLevel: 'P4', mode: 'core' });
  const full = buildFractionDiagnosticSession({ studentLevel: 'P6', mode: 'full' });

  const basicRangeValid =
    basic.targetSkillIds[0] === 'F001' && basic.targetSkillIds[basic.targetSkillIds.length - 1] === 'F005';
  const coreRangeValid =
    core.targetSkillIds[0] === 'F001' && core.targetSkillIds[core.targetSkillIds.length - 1] === 'F019';
  const fullRangeValid =
    full.targetSkillIds[0] === 'F001' && full.targetSkillIds[full.targetSkillIds.length - 1] === 'F026';

  const simulatedResult = {
    targetSkillIds: core.targetSkillIds,
    weakSkillIds: ['F018'],
    strandScores: { Operations: { accuracy: 70, accurateButSlowRate: 20 } },
  };
  const drillDown = getDiagnosticDrillDownTargets(simulatedResult);
  const placement = determineFractionPlacement({ ...simulatedResult, weakSkillIds: ['F018', 'F010'] });

  const fluencyFlagCheck = classifyFluencyFlag({
    correct: true,
    skipped: false,
    timeTaken: 999,
    questionFamilyId: 'QF_F001_001',
  });

  const sampleAttempt = scoreFractionDiagnosticAttempt({
    sessionId: core.sessionId,
    responses: [
      { questionId: 'q1', skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: false, timeTaken: 25, confidence: 'unsure', skipped: false },
      { questionId: 'q2', skillId: 'F011', questionFamilyId: 'QF_F011_001', correct: false, timeTaken: 24, confidence: 'unsure', skipped: false },
      { questionId: 'q3', skillId: 'F016', questionFamilyId: 'QF_F016_001', correct: true, timeTaken: 30, confidence: 'confident', skipped: false },
      { questionId: 'q4', skillId: 'F018', questionFamilyId: 'QF_F018_001', correct: false, timeTaken: 35, confidence: 'guessing', skipped: false },
    ],
  });

  const requiredFields = [
    'overallFractionReadinessScore',
    'strandScores',
    'skillScores',
    'questionFamilyScores',
    'masteredSkillIds',
    'weakSkillIds',
    'suspectedPrerequisiteGaps',
    'recommendedStartingSkillId',
    'recommendedPracticeQueue',
    'fluencyFlags',
    'confidenceLevel',
    'parentFriendlySummary',
    'studentFriendlySummary',
  ];

  const missingResultFields = requiredFields.filter((field) => !(field in sampleAttempt));
  const placementPrefersPrereq = placement === 'F010';
  const drillDownIncludesPrereq = drillDown.skillIds.includes('F010') || drillDown.skillIds.includes('F011');

  return {
    isValid:
      basicRangeValid &&
      coreRangeValid &&
      fullRangeValid &&
      drillDownIncludesPrereq &&
      placementPrefersPrereq &&
      fluencyFlagCheck === 'accurateButSlow' &&
      missingResultFields.length === 0,
    checks: {
      basicRangeValid,
      coreRangeValid,
      fullRangeValid,
      drillDownIncludesPrereq,
      placementPrefersPrereq,
      accurateButSlowFlagValid: fluencyFlagCheck === 'accurateButSlow',
      resultObjectHasAllFields: missingResultFields.length === 0,
    },
    sampleResult: sampleAttempt,
    missingResultFields,
  };
}

export const fractionDiagnosticEngine = {
  buildFractionDiagnosticSession,
  scoreFractionDiagnosticAttempt,
  getWeakStrands,
  getDiagnosticDrillDownTargets,
  determineFractionPlacement,
  buildFractionDiagnosticSummary,
  validateFractionDiagnosticEngine,
};

export default fractionDiagnosticEngine;
