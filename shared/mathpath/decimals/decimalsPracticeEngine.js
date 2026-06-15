import { decimalsSkillGraph, getSkill, getPrerequisites } from './decimalsSkillGraph.js';
import { getQuestionFamiliesBySkill, getQuestionFamily } from './decimalsQuestionFamilies.js';

// Decimals practice/progression engine. Mirrors the Fractions practice engine
// (selection → action → state update → queue → session) so it can wire into the
// shared MathPath orchestrator, adapted to the 14-skill Decimals graph and its
// strands. In-memory stores keep per-student progress for the runtime; callers
// may also pass explicit masteredSkillIds/weakSkillIds from a diagnostic.

const PRACTICE_STORE = new Map();
const SESSION_STORE = new Map();
const SKILL_IDS = new Set(decimalsSkillGraph.skillIds);

const DEFAULT_ACCURACY_THRESHOLDS = {
  Foundations: 85,
  Comparison: 90,
  Rounding: 90,
  Operations: 90,
  Conversion: 90,
  Applications: 85,
};

const STATUS = {
  NOT_STARTED: 'notStarted',
  LEARNING: 'learning',
  ACCURATE: 'accurate',
  FLUENT: 'fluent',
  RETAINED: 'retained',
  NEEDS_REVIEW: 'needsReview',
  WEAK: 'weak',
};

function nowIso() {
  return new Date().toISOString();
}

function skillIdNumber(skillId) {
  return Number(String(skillId).replace('D', '')) || 0;
}

function skillIdFor(n) {
  return `D${String(n).padStart(3, '0')}`;
}

function buildSessionId() {
  return `decpractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function computeAccuracy(attempts) {
  if (!attempts.length) return 0;
  return Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 1000) / 10;
}

function computeAverageTime(attempts) {
  const answered = attempts.filter((a) => !a.skipped && Number.isFinite(Number(a.timeTaken)));
  if (!answered.length) return null;
  return Math.round((answered.reduce((sum, a) => sum + Number(a.timeTaken), 0) / answered.length) * 10) / 10;
}

function getSkillThreshold(skillId) {
  const strand = getSkill(skillId)?.strand || 'Foundations';
  return DEFAULT_ACCURACY_THRESHOLDS[strand] ?? 90;
}

function getStudentState(studentId) {
  if (!PRACTICE_STORE.has(studentId)) {
    PRACTICE_STORE.set(studentId, {
      studentId,
      masteredSkillIds: [],
      weakSkillIds: [],
      currentSkillId: null,
      retentionDueSkillIds: [],
      skillHistory: {},
      familyHistory: {},
      attempts: [],
      updatedAt: nowIso(),
    });
  }
  return PRACTICE_STORE.get(studentId);
}

function setStudentState(studentId, next) {
  next.updatedAt = nowIso();
  PRACTICE_STORE.set(studentId, next);
  return next;
}

function familyIsFluent(attempts, family) {
  if (!attempts.length) return false;
  const accuracy = computeAccuracy(attempts);
  const avgTime = computeAverageTime(attempts);
  return accuracy >= 90 && avgTime !== null && avgTime <= family.fluencyTargetSeconds;
}

function deriveFluencyFlag(correct, timeTaken, familyId) {
  const family = getQuestionFamily(familyId);
  const target = family?.fluencyTargetSeconds ?? 20;
  if (!correct) return 'inaccurate';
  return Number(timeTaken) <= target ? 'accurateAndFluent' : 'accurateButSlow';
}

function summarizeStatus({ accuracy, avgTime, family, attempts, workingMissingCount }) {
  if (!attempts.length) return STATUS.NOT_STARTED;
  if (accuracy < 70) return STATUS.WEAK;
  if (accuracy < 85) return STATUS.NEEDS_REVIEW;
  if (accuracy >= 90 && avgTime !== null && avgTime <= family.fluencyTargetSeconds) {
    if (attempts.length >= 8) return STATUS.FLUENT;
    return STATUS.ACCURATE;
  }
  if (accuracy >= 90 && avgTime !== null && avgTime > family.fluencyTargetSeconds) return STATUS.ACCURATE;
  if (workingMissingCount >= 2 && family.workingRequired && !family.mentalMathEligible) return STATUS.NEEDS_REVIEW;
  return STATUS.LEARNING;
}

function findEarliestWeakPrerequisite(skillId, weakSet) {
  const prereqs = getPrerequisites(skillId);
  for (const prereq of prereqs) {
    if (weakSet.has(prereq)) return findEarliestWeakPrerequisite(prereq, weakSet);
  }
  return skillId;
}

function pickWeakFamily(skillId, familyHistory) {
  const families = getQuestionFamiliesBySkill(skillId);
  const ranked = families
    .map((f) => {
      const data = familyHistory[f.id] || { attempts: [] };
      const accuracy = computeAccuracy(data.attempts || []);
      return { family: f, accuracy, count: (data.attempts || []).length };
    })
    .sort((a, b) => {
      if (a.count === 0 && b.count !== 0) return -1;
      if (b.count === 0 && a.count !== 0) return 1;
      return a.accuracy - b.accuracy;
    });
  return ranked[0]?.family || families[0] || null;
}

function reasonAndPriority(studentState, chosenSkillId, chosenFamilyId) {
  const weakSet = new Set(studentState.weakSkillIds || []);
  const retentionSet = new Set(studentState.retentionDueSkillIds || []);

  if (retentionSet.has(chosenSkillId)) return { reason: 'retentionReview', priority: 100 };
  if (weakSet.has(chosenSkillId)) {
    const familyData = studentState.familyHistory?.[chosenFamilyId];
    const attempts = familyData?.attempts || [];
    const incorrectStreak = attempts.slice(-3).filter((a) => !a.correct).length;
    if (incorrectStreak >= 2) return { reason: 'prerequisiteGap', priority: 95 };
    if (attempts.length && computeAccuracy(attempts) >= 90 && computeAverageTime(attempts) > (getQuestionFamily(chosenFamilyId)?.fluencyTargetSeconds ?? 20)) {
      return { reason: 'fluencyPractice', priority: 85 };
    }
    return { reason: 'accuracyPractice', priority: 90 };
  }
  return { reason: 'readyForNextSkill', priority: 70 };
}

export function selectNextDecimalPracticeTarget(studentState = {}) {
  const weakSkillIds = studentState.weakSkillIds || [];
  const retentionDueSkillIds = studentState.retentionDueSkillIds || [];
  const familyHistory = studentState.familyHistory || {};

  let skillId = null;

  if (retentionDueSkillIds.length) {
    skillId = [...retentionDueSkillIds].sort((a, b) => skillIdNumber(a) - skillIdNumber(b))[0];
  } else if (weakSkillIds.length) {
    const weakSet = new Set(weakSkillIds);
    const sorted = [...weakSkillIds].sort((a, b) => skillIdNumber(a) - skillIdNumber(b));
    skillId = findEarliestWeakPrerequisite(sorted[0], weakSet);
  } else if (studentState.currentSkillId && SKILL_IDS.has(studentState.currentSkillId)) {
    skillId = studentState.currentSkillId;
  } else {
    skillId = (studentState.masteredSkillIds || [])
      .sort((a, b) => skillIdNumber(a) - skillIdNumber(b))
      .reduce((next, mastered) => {
        const candidate = skillIdFor(skillIdNumber(mastered) + 1);
        return SKILL_IDS.has(candidate) ? candidate : next;
      }, 'D001');
  }

  const family = pickWeakFamily(skillId, familyHistory);
  const questionFamilyId = family?.id || null;
  const { reason, priority } = reasonAndPriority(studentState, skillId, questionFamilyId);
  return { skillId, questionFamilyId, reason, priority };
}

export function determineDecimalPracticeAction(state = {}) {
  const {
    accuracy = 0,
    fluencyFlag = 'inaccurate',
    repeatedIncorrect = false,
    retentionDue = false,
    readyToAdvance = false,
    workingRequired = false,
    workingMissingCount = 0,
    mentalMathEligible = false,
  } = state;

  if (retentionDue) return 'scheduleRetention';
  if (workingRequired && !mentalMathEligible && workingMissingCount >= 2) return 'requireWorkingUpload';
  if (repeatedIncorrect) return 'remediatePrerequisite';
  if (accuracy >= 90 && fluencyFlag === 'accurateButSlow') return 'startFluency';
  if (readyToAdvance) return 'advanceSkill';
  return 'continuePractice';
}

export function updateDecimalPracticeState(attempt = {}) {
  const {
    studentId,
    skillId,
    questionFamilyId,
    correct,
    timeTaken,
    confidence,
    workingUploaded,
    attemptNumber,
  } = attempt;

  if (!studentId || !SKILL_IDS.has(skillId) || !getQuestionFamily(questionFamilyId)) {
    throw new Error('Invalid practice attempt payload.');
  }

  const studentState = getStudentState(studentId);
  const family = getQuestionFamily(questionFamilyId);
  const fluencyFlag = deriveFluencyFlag(correct, timeTaken, questionFamilyId);

  if (!studentState.familyHistory[questionFamilyId]) {
    studentState.familyHistory[questionFamilyId] = { attempts: [], status: STATUS.NOT_STARTED };
  }
  if (!studentState.skillHistory[skillId]) {
    studentState.skillHistory[skillId] = { attempts: [], status: STATUS.NOT_STARTED };
  }

  const attemptRecord = {
    skillId,
    questionFamilyId,
    correct: Boolean(correct),
    timeTaken: Number(timeTaken || 0),
    confidence: confidence ?? null,
    workingUploaded: Boolean(workingUploaded),
    attemptNumber: Number(attemptNumber || 1),
    fluencyFlag,
    createdAt: nowIso(),
  };

  studentState.attempts.push(attemptRecord);
  studentState.familyHistory[questionFamilyId].attempts.push(attemptRecord);
  studentState.skillHistory[skillId].attempts.push(attemptRecord);
  studentState.currentSkillId = skillId;

  const familyAttempts = studentState.familyHistory[questionFamilyId].attempts;
  const skillAttempts = studentState.skillHistory[skillId].attempts;
  const familyAccuracy = computeAccuracy(familyAttempts);
  const familyAverageTime = computeAverageTime(familyAttempts);
  const familyWorkingMissingCount = familyAttempts.filter(
    (a) => family.workingRequired && !family.mentalMathEligible && !a.workingUploaded
  ).length;

  const familyStatus = summarizeStatus({
    accuracy: familyAccuracy,
    avgTime: familyAverageTime,
    family,
    attempts: familyAttempts,
    workingMissingCount: familyWorkingMissingCount,
  });

  studentState.familyHistory[questionFamilyId].status = familyStatus;

  const skillAccuracy = computeAccuracy(skillAttempts);
  const skillAverageTime = computeAverageTime(skillAttempts);
  const skillThreshold = getSkill(skillId)?.mastery?.minimumAccuracy ?? getSkillThreshold(skillId);
  const allSkillFamilies = getQuestionFamiliesBySkill(skillId);
  const fluentFamilies = allSkillFamilies.filter((f) =>
    familyIsFluent(studentState.familyHistory[f.id]?.attempts || [], f)
  ).length;
  const readyToAdvance = skillAccuracy >= skillThreshold && fluentFamilies >= Math.max(1, Math.ceil(allSkillFamilies.length * 0.5));
  const repeatedIncorrect = familyAttempts.slice(-3).filter((a) => !a.correct).length >= 2;
  const retentionDue = (studentState.retentionDueSkillIds || []).includes(skillId);

  let skillStatus = STATUS.LEARNING;
  if (skillAccuracy < 70) skillStatus = STATUS.WEAK;
  else if (readyToAdvance && fluentFamilies === allSkillFamilies.length) skillStatus = STATUS.FLUENT;
  else if (readyToAdvance) skillStatus = STATUS.ACCURATE;
  else if (skillAccuracy >= 85) skillStatus = STATUS.LEARNING;
  else skillStatus = STATUS.NEEDS_REVIEW;

  studentState.skillHistory[skillId].status = skillStatus;

  if (skillStatus === STATUS.FLUENT || skillStatus === STATUS.ACCURATE) {
    if (!studentState.masteredSkillIds.includes(skillId)) studentState.masteredSkillIds.push(skillId);
    studentState.weakSkillIds = studentState.weakSkillIds.filter((id) => id !== skillId);
  } else if (!studentState.weakSkillIds.includes(skillId)) {
    studentState.weakSkillIds.push(skillId);
  }

  const nextRecommendedAction = determineDecimalPracticeAction({
    accuracy: skillAccuracy,
    fluencyFlag,
    repeatedIncorrect,
    retentionDue,
    readyToAdvance,
    workingRequired: family.workingRequired,
    workingMissingCount: familyWorkingMissingCount,
    mentalMathEligible: family.mentalMathEligible,
  });

  setStudentState(studentId, studentState);

  return {
    skillStatus,
    questionFamilyStatus: familyStatus,
    accuracy: skillAccuracy,
    averageTime: skillAverageTime,
    fluencyFlag,
    nextRecommendedAction,
  };
}

export function getDecimalPracticeQueue(studentState = {}) {
  const state = {
    masteredSkillIds: studentState.masteredSkillIds || [],
    weakSkillIds: studentState.weakSkillIds || [],
    currentSkillId: studentState.currentSkillId || null,
    attemptHistory: studentState.attemptHistory || [],
    retentionDueSkillIds: studentState.retentionDueSkillIds || [],
    familyHistory: studentState.familyHistory || {},
  };

  const queue = [];
  const seen = new Set();

  const primary = selectNextDecimalPracticeTarget(state);
  if (primary.skillId && primary.questionFamilyId) {
    const key = `${primary.skillId}:${primary.questionFamilyId}`;
    seen.add(key);
    queue.push(primary);
  }

  const candidateSkills = [
    ...state.retentionDueSkillIds,
    ...state.weakSkillIds,
    state.currentSkillId,
  ]
    .filter(Boolean)
    .sort((a, b) => skillIdNumber(a) - skillIdNumber(b));

  candidateSkills.forEach((skillId) => {
    const family = pickWeakFamily(skillId, state.familyHistory);
    if (!family) return;
    const key = `${skillId}:${family.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const meta = reasonAndPriority(state, skillId, family.id);
    queue.push({ skillId, questionFamilyId: family.id, ...meta });
  });

  return queue.sort((a, b) => b.priority - a.priority);
}

export function buildDecimalPracticeSession(options = {}) {
  const {
    studentId,
    diagnosticResult = {},
    masteredSkillIds = [],
    weakSkillIds = [],
    currentSkillId = null,
    attemptHistory = [],
    sessionLength = 8,
  } = options;

  const existing = getStudentState(studentId || 'anonymous');
  const mergedState = {
    ...existing,
    masteredSkillIds: [...new Set([...(existing.masteredSkillIds || []), ...masteredSkillIds, ...(diagnosticResult.masteredSkillIds || [])])],
    weakSkillIds: [...new Set([...(existing.weakSkillIds || []), ...weakSkillIds, ...(diagnosticResult.weakSkillIds || [])])],
    currentSkillId: currentSkillId || diagnosticResult.recommendedStartingSkillId || existing.currentSkillId || 'D001',
    attemptHistory,
    retentionDueSkillIds: diagnosticResult.suspectedPrerequisiteGaps || existing.retentionDueSkillIds || [],
    familyHistory: existing.familyHistory || {},
  };

  const queue = getDecimalPracticeQueue(mergedState);
  const top = queue[0] || selectNextDecimalPracticeTarget(mergedState);
  const targetSkillId = top.skillId;
  const targetFamilies = getQuestionFamiliesBySkill(targetSkillId).map((f) => f.id);
  const sortedFamilies = targetFamilies.sort((a, b) => {
    const da = mergedState.familyHistory[a]?.attempts || [];
    const db = mergedState.familyHistory[b]?.attempts || [];
    return computeAccuracy(da) - computeAccuracy(db);
  });
  const selectedFamilies = sortedFamilies.slice(0, Math.max(2, Math.min(4, sortedFamilies.length)));

  const workingExpected = selectedFamilies.some((id) => {
    const family = getQuestionFamily(id);
    return family?.workingRequired && !family?.mentalMathEligible;
  });

  const sessionGoalByReason = {
    prerequisiteGap: 'Fix prerequisite gap before advanced decimal work',
    weakQuestionFamily: 'Strengthen weak question family performance',
    accuracyPractice: 'Improve accuracy in target decimal skill',
    fluencyPractice: 'Improve fluency speed while keeping accuracy',
    retentionReview: 'Review retained skills to prevent forgetting',
    readyForNextSkill: 'Advance to next decimal skill',
  };

  const sessionId = buildSessionId();
  const session = {
    sessionId,
    studentId: studentId || 'anonymous',
    targetSkillId,
    targetQuestionFamilyIds: selectedFamilies,
    practicePlan: queue.slice(0, 6),
    estimatedQuestionCount: Math.max(4, Math.min(Number(sessionLength) || 8, 12)),
    sessionGoal: sessionGoalByReason[top.reason] || 'Decimal skill practice session',
    workingExpected,
    reason: top.reason,
    createdAt: nowIso(),
  };

  SESSION_STORE.set(sessionId, session);
  setStudentState(session.studentId, mergedState);
  return session;
}

export function resetDecimalPracticeState(studentId) {
  PRACTICE_STORE.delete(studentId);
}

export function validateDecimalPracticeEngine() {
  const studentId = 'decimal_practice_validation_student';
  PRACTICE_STORE.delete(studentId);

  const diagnosticResult = {
    recommendedStartingSkillId: 'D008',
    masteredSkillIds: ['D001', 'D002', 'D003'],
    weakSkillIds: ['D008', 'D006'],
    suspectedPrerequisiteGaps: ['D006'],
  };

  const session = buildDecimalPracticeSession({ studentId, diagnosticResult, sessionLength: 8 });

  const firstTarget = selectNextDecimalPracticeTarget(getStudentState(studentId));
  const weakPrioritized = firstTarget.skillId === 'D006';

  const slowCorrect = updateDecimalPracticeState({
    studentId,
    skillId: 'D009',
    questionFamilyId: 'QF_D009_001',
    correct: true,
    timeTaken: 999,
    confidence: 'confident',
    workingUploaded: false,
    attemptNumber: 1,
  });
  const accurateButSlowToFluency = slowCorrect.fluencyFlag === 'accurateButSlow';

  const stateBeforeRemediation = getStudentState(studentId);
  stateBeforeRemediation.retentionDueSkillIds = [];
  setStudentState(studentId, stateBeforeRemediation);

  // mental-math family skips the working-upload gate, so 3 wrong → remediation
  updateDecimalPracticeState({ studentId, skillId: 'D007', questionFamilyId: 'QF_D007_001', correct: false, timeTaken: 12, confidence: 'unsure', workingUploaded: false, attemptNumber: 1 });
  updateDecimalPracticeState({ studentId, skillId: 'D007', questionFamilyId: 'QF_D007_001', correct: false, timeTaken: 12, confidence: 'unsure', workingUploaded: false, attemptNumber: 2 });
  const repeatIncorrect = updateDecimalPracticeState({ studentId, skillId: 'D007', questionFamilyId: 'QF_D007_001', correct: false, timeTaken: 11, confidence: 'unsure', workingUploaded: false, attemptNumber: 3 });
  const repeatedIncorrectTriggersRemediation = repeatIncorrect.nextRecommendedAction === 'remediatePrerequisite';

  const state = getStudentState(studentId);
  state.retentionDueSkillIds = ['D005'];
  setStudentState(studentId, state);
  const retentionTarget = selectNextDecimalPracticeTarget(getStudentState(studentId));
  const retentionPrioritized = retentionTarget.skillId === 'D005' && retentionTarget.reason === 'retentionReview';

  state.retentionDueSkillIds = [];
  setStudentState(studentId, state);
  // working-required family: 2 correct without working → upload prompt
  updateDecimalPracticeState({ studentId, skillId: 'D008', questionFamilyId: 'QF_D008_001', correct: true, timeTaken: 20, confidence: 'confident', workingUploaded: false, attemptNumber: 1 });
  const workingPrompt1 = updateDecimalPracticeState({ studentId, skillId: 'D008', questionFamilyId: 'QF_D008_001', correct: true, timeTaken: 20, confidence: 'confident', workingUploaded: false, attemptNumber: 2 });
  const workingRequiredPrompt = workingPrompt1.nextRecommendedAction === 'requireWorkingUpload';

  const mentalMath = updateDecimalPracticeState({ studentId, skillId: 'D003', questionFamilyId: 'QF_D003_001', correct: true, timeTaken: 5, confidence: 'confident', workingUploaded: false, attemptNumber: 1 });
  const mentalMathNoWorkingPrompt = mentalMath.nextRecommendedAction !== 'requireWorkingUpload';

  const queue = getDecimalPracticeQueue(getStudentState(studentId));
  const validQueueIds = queue.every((item) => SKILL_IDS.has(item.skillId) && getQuestionFamily(item.questionFamilyId));

  PRACTICE_STORE.delete(studentId);

  return {
    isValid:
      weakPrioritized &&
      accurateButSlowToFluency &&
      repeatedIncorrectTriggersRemediation &&
      retentionPrioritized &&
      workingRequiredPrompt &&
      mentalMathNoWorkingPrompt &&
      validQueueIds,
    checks: {
      weakPrioritized,
      accurateButSlowToFluency,
      repeatedIncorrectTriggersRemediation,
      retentionPrioritized,
      workingRequiredPrompt,
      mentalMathNoWorkingPrompt,
      validQueueIds,
    },
    sampleSession: session,
    sampleQueueHead: queue[0] || null,
  };
}

export const decimalsPracticeEngine = {
  buildDecimalPracticeSession,
  selectNextDecimalPracticeTarget,
  updateDecimalPracticeState,
  getDecimalPracticeQueue,
  determineDecimalPracticeAction,
  resetDecimalPracticeState,
  validateDecimalPracticeEngine,
};

export default decimalsPracticeEngine;
