import { geometrySkillGraph, getSkill, getPrerequisites } from './GeometrySkillGraph.js';
import { getQuestionFamiliesBySkill, getQuestionFamily } from './GeometryQuestionFamilies.js';

const PRACTICE_STORE = new Map();
const SESSION_STORE = new Map();
const SKILL_IDS = new Set(geometrySkillGraph.skillIds);

const DEFAULT_ACCURACY_THRESHOLDS = {
  '2D Shapes': 95,
  'Lines': 88,
  'Angles': 92,
  'Quadrilaterals': 88,
  'Symmetry': 88,
  '3D Shapes': 88,
  'Construction': 88,
  'Perimeter': 90,
  'Area': 90,
  'Circles': 88,
  'Composite': 88,
};

const STATUS = {
  NOT_STARTED: 'notStarted', LEARNING: 'learning', ACCURATE: 'accurate',
  FLUENT: 'fluent', RETAINED: 'retained', NEEDS_REVIEW: 'needsReview', WEAK: 'weak',
};

const ORDERED_SKILL_IDS = geometrySkillGraph.skillIds;

function nowIso() { return new Date().toISOString(); }
function skillIdNumber(skillId) { return Number(String(skillId).replace('GE', '')) || 0; }
function skillIdFor(n) { return `GE${String(n).padStart(3, '0')}`; }
function buildSessionId() { return `geometrypractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
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
  const strand = getSkill(skillId)?.strand || 'Core';
  return DEFAULT_ACCURACY_THRESHOLDS[strand] ?? 88;
}

function getStudentState(studentId) {
  if (!PRACTICE_STORE.has(studentId)) {
    PRACTICE_STORE.set(studentId, {
      studentId, masteredSkillIds: [], weakSkillIds: [], currentSkillId: null,
      retentionDueSkillIds: [], skillHistory: {}, familyHistory: {}, attempts: [], updatedAt: nowIso(),
    });
  }
  return PRACTICE_STORE.get(studentId);
}
function setStudentState(studentId, next) { next.updatedAt = nowIso(); PRACTICE_STORE.set(studentId, next); return next; }

function familyIsFluent(attempts, family) {
  if (!attempts.length) return false;
  const accuracy = computeAccuracy(attempts);
  const avgTime = computeAverageTime(attempts);
  return accuracy >= 90 && avgTime !== null && avgTime <= family.fluencyTargetSeconds;
}
function deriveFluencyFlag(correct, timeTaken, questionFamilyId) {
  const family = getQuestionFamily(questionFamilyId);
  const target = family?.fluencyTargetSeconds ?? 20;
  if (!correct) return 'inaccurate';
  return Number(timeTaken) <= target ? 'accurateAndFluent' : 'accurateButSlow';
}

function pickWeakFamily(skillId, familyHistory) {
  const families = getQuestionFamiliesBySkill(skillId);
  const ranked = families.map((f) => {
    const data = familyHistory[f.id] || { attempts: [] };
    const accuracy = computeAccuracy(data.attempts || []);
    return { family: f, accuracy, count: (data.attempts || []).length };
  }).sort((a, b) => { if (a.count === 0 && b.count !== 0) return -1; if (b.count === 0 && a.count !== 0) return 1; return a.accuracy - b.accuracy; });
  return ranked[0]?.family || families[0] || null;
}

function findEarliestWeakPrerequisite(skillId, weakSet) {
  const prereqs = getPrerequisites(skillId);
  for (const prereq of prereqs) {
    if (weakSet.has(prereq)) return findEarliestWeakPrerequisite(prereq, weakSet);
  }
  return skillId;
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
    return { reason: 'accuracyPractice', priority: 90 };
  }
  return { reason: 'readyForNextSkill', priority: 70 };
}

export function selectNextGeometryPracticeTarget(studentState = {}) {
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
  } else if (studentState.currentSkillId && SKILL_IDS.has(studentState.currentSkillId) && !(studentState.masteredSkillIds || []).includes(studentState.currentSkillId)) {
    skillId = studentState.currentSkillId;
  } else {
    skillId = (studentState.masteredSkillIds || [])
      .sort((a, b) => skillIdNumber(a) - skillIdNumber(b))
      .reduce((next, mastered) => {
        const candidate = skillIdFor(skillIdNumber(mastered) + 1);
        return SKILL_IDS.has(candidate) ? candidate : next;
      }, 'GE001');
  }
  const family = pickWeakFamily(skillId, familyHistory);
  const questionFamilyId = family?.id || null;
  const { reason, priority } = reasonAndPriority(studentState, skillId, questionFamilyId);
  return { skillId, questionFamilyId, reason, priority };
}

export function buildGeometryPracticeSession(options = {}) {
  const {
    studentId, masteredSkillIds = [], weakSkillIds = [], currentSkillId = null,
    diagnosticResult = {}, attemptHistory = [], sessionLength = 8,
  } = options;
  const existing = getStudentState(studentId || 'anonymous');
  const mergedState = {
    ...existing,
    masteredSkillIds: [...new Set([...(existing.masteredSkillIds || []), ...masteredSkillIds, ...(diagnosticResult.masteredSkillIds || [])])],
    weakSkillIds: [...new Set([...(existing.weakSkillIds || []), ...weakSkillIds, ...(diagnosticResult.weakSkillIds || [])])],
    currentSkillId: currentSkillId || existing.currentSkillId || 'GE001',
    attemptHistory, retentionDueSkillIds: existing.retentionDueSkillIds || [], familyHistory: existing.familyHistory || {},
  };
  const top = selectNextGeometryPracticeTarget(mergedState);
  const targetSkillId = top.skillId;
  const targetFamilies = getQuestionFamiliesBySkill(targetSkillId).map((f) => f.id);
  const sessionId = buildSessionId();
  const session = {
    sessionId, studentId: studentId || 'anonymous', targetSkillId,
    targetQuestionFamilyIds: targetFamilies.slice(0, 4),
    estimatedQuestionCount: Math.max(4, Math.min(Number(sessionLength) || 8, 12)),
    sessionGoal: 'Geometry skill practice session',
    reason: top.reason, createdAt: nowIso(),
  };
  SESSION_STORE.set(sessionId, session);
  setStudentState(session.studentId, mergedState);
  return session;
}

export function resetGeometryPracticeState(studentId) { PRACTICE_STORE.delete(studentId); }

export const geometryPracticeEngine = {
  buildGeometryPracticeSession, selectNextGeometryPracticeTarget, resetGeometryPracticeState,
};
export default geometryPracticeEngine;
