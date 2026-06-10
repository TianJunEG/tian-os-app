/**
 * p1PracticeFlow.js
 * ------------------------------------------------------------------
 * Client-side practice flow for P1 Mathematics — mirrors the fractions
 * practiceFlow interface so PracticeSession.jsx can treat both domains
 * identically through a thin adapter.
 *
 * Because P1 questions are generated entirely on the frontend (unlike
 * fractions which also run server-side), the "start" function generates
 * questions locally and the backend persistence layer simply stores the
 * already-built question set.
 * ------------------------------------------------------------------
 */
import { generateQuestionSet, generateDiagnosticSet, getDomainForSkill, getDomains } from './p1Orchestrator.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SESSION_TYPE_CONFIG = {
  practice:      { min: 4, max: 12, defaultCount: 6,  label: 'Practice' },
  diagnostic:    { min: 8, max: 12, defaultCount: 10, label: 'P1 Diagnostic' },
  warmup:        { min: 2, max: 3,  defaultCount: 3,  label: 'Quick Warm-up' },
  remediation:   { min: 4, max: 8,  defaultCount: 5,  label: 'Remediation' },
  mastery_check: { min: 8, max: 12, defaultCount: 10, label: 'Mastery Check' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSessionType(value) {
  const key = String(value || 'practice').toLowerCase();
  return SESSION_TYPE_CONFIG[key] ? key : 'practice';
}

function resolveSessionCount(sessionType, requestedLength) {
  const cfg = SESSION_TYPE_CONFIG[sessionType] || SESSION_TYPE_CONFIG.practice;
  const wanted = Number(requestedLength);
  if (!Number.isFinite(wanted)) return cfg.defaultCount;
  return Math.max(cfg.min, Math.min(cfg.max, Math.floor(wanted)));
}

/**
 * Detect whether a skill ID belongs to the P1 domain family.
 * Covers all 7 sub-domains: P1-NUM, P1-ADD, P1-MON, P1-MEA, P1-GEO, P1-EQG, P1-DAT
 */
export function isP1SkillId(skillId) {
  return /^P1-/.test(String(skillId || ''));
}

/**
 * Resolve the P1 domainId for backend persistence.
 * Maps the orchestrator domain (e.g. "p1-numbers") or falls back to a prefix-based match.
 */
export function resolveP1DomainId(skillId) {
  return getDomainForSkill(skillId) || 'p1-numbers';
}

// ---------------------------------------------------------------------------
// Answer checking — P1 questions store their answer directly
// ---------------------------------------------------------------------------
/**
 * Check a student answer against a P1 question's correct answer.
 *
 * P1 answers can be:
 *  - number (e.g. 7, 45)
 *  - string (e.g. "triangle", "heavier")
 *  - MCQ choice text
 *
 * @param {{ studentAnswer: string, correctAnswer: *, acceptedAnswers?: string[], type?: string }} params
 * @returns {{ correct: boolean, normalizedStudent: string, normalizedCorrect: string }}
 */
export function checkP1Answer({ studentAnswer, correctAnswer, acceptedAnswers = [], type = '' }) {
  const student = String(studentAnswer ?? '').trim().toLowerCase();
  const correct = String(correctAnswer ?? '').trim().toLowerCase();

  if (!student) return { correct: false, normalizedStudent: student, normalizedCorrect: correct };

  // Direct match
  if (student === correct) return { correct: true, normalizedStudent: student, normalizedCorrect: correct };

  // Numeric match (handles leading zeros, decimals, whitespace)
  const numStudent = Number(student);
  const numCorrect = Number(correct);
  if (Number.isFinite(numStudent) && Number.isFinite(numCorrect) && numStudent === numCorrect) {
    return { correct: true, normalizedStudent: student, normalizedCorrect: correct };
  }

  // Accepted alternatives (e.g. "7" or "seven")
  if (acceptedAnswers.length) {
    const normalizedAlts = acceptedAnswers.map((a) => String(a).trim().toLowerCase());
    if (normalizedAlts.includes(student)) {
      return { correct: true, normalizedStudent: student, normalizedCorrect: correct };
    }
  }

  return { correct: false, normalizedStudent: student, normalizedCorrect: correct };
}

// ---------------------------------------------------------------------------
// Start a P1 practice session (client-side question generation)
// ---------------------------------------------------------------------------
/**
 * Start a P1 practice session.
 *
 * @param {{
 *   studentId: string,
 *   sessionType?: string,
 *   requestedSkillId: string,
 *   sessionLength?: number,
 * }} opts
 * @returns {{
 *   practiceSessionId: string,
 *   studentId: string,
 *   domainId: string,
 *   targetSkillId: string,
 *   sessionType: string,
 *   sessionLabel: string,
 *   questions: object[],
 *   workingExpected: boolean,
 *   startedAt: string,
 * }}
 */
export function startP1PracticeFlow({
  studentId,
  sessionType: rawSessionType = 'practice',
  requestedSkillId,
  sessionLength,
} = {}) {
  const sessionType = normalizeSessionType(rawSessionType);
  const count = resolveSessionCount(sessionType, sessionLength);
  const domainId = resolveP1DomainId(requestedSkillId);
  const cfg = SESSION_TYPE_CONFIG[sessionType] || SESSION_TYPE_CONFIG.practice;

  const questions = generateQuestionSet(requestedSkillId, count).map((q, i) => ({
    ...q,
    questionId: q.questionId || `${requestedSkillId}_q${i + 1}_${Date.now()}`,
    skillId: q.skillId || requestedSkillId,
    questionFamilyId: q.questionFamilyId || '',
    // Normalise the answer shape so PracticeSession can display it
    answer: typeof q.answer === 'object' ? q.answer : { value: q.answer, display: String(q.answer ?? '') },
  }));

  return {
    practiceSessionId: makeId('p1-practice'),
    studentId,
    domainId,
    targetSkillId: requestedSkillId,
    sessionType,
    sessionLabel: cfg.label,
    questions,
    workingExpected: false, // P1 level: no working canvas expected
    startedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Start a P1 diagnostic — samples questions across all 7 domains
// ---------------------------------------------------------------------------
/**
 * Generate a cross-domain diagnostic for P1 Mathematics.
 *
 * Picks representative skills from each domain and generates 1–2 questions per
 * skill, producing ~14–21 questions total. Results can be used to identify
 * weak domains and recommend practice.
 *
 * @param {{ studentId: string, questionsPerDomain?: number }} opts
 */
export function startP1DiagnosticFlow({ studentId, questionsPerDomain = 2 } = {}) {
  const allDomains = getDomains();

  // Pick one representative skill per domain (the first supported skill)
  const diagnosticSkillIds = allDomains.map((d) => {
    const skillIds = d.skillIds || [];
    // Pick the first foundation-level skill from each domain
    return skillIds[0] || null;
  }).filter(Boolean);

  const rawQuestions = generateDiagnosticSet(diagnosticSkillIds, questionsPerDomain);
  const questions = rawQuestions.map((q, i) => ({
    ...q,
    questionId: q.questionId || `P1-DIAG_q${i + 1}_${Date.now()}`,
    skillId: q.skillId || '',
    questionFamilyId: q.questionFamilyId || '',
    answer: typeof q.answer === 'object' ? q.answer : { value: q.answer, display: String(q.answer ?? '') },
  }));

  return {
    practiceSessionId: makeId('p1-diagnostic'),
    studentId,
    domainId: 'p1-diagnostic',
    targetSkillId: 'P1-DIAGNOSTIC',
    sessionType: 'diagnostic',
    sessionLabel: 'P1 Diagnostic',
    questions,
    workingExpected: false,
    startedAt: new Date().toISOString(),
    isP1: true,
    diagnosticSkillIds,
  };
}

// ---------------------------------------------------------------------------
// Analyze diagnostic results — identify weak domains
// ---------------------------------------------------------------------------
/**
 * Analyze P1 diagnostic results to identify weak and strong domains.
 *
 * @param {{ results: object[] }} params
 * @returns {{ domainSummary: object[], weakDomains: string[], strongDomains: string[] }}
 */
export function analyzeP1DiagnosticResults({ results = [] } = {}) {
  const byDomain = {};
  for (const r of results) {
    const domainId = getDomainForSkill(r.skillId) || 'unknown';
    if (!byDomain[domainId]) byDomain[domainId] = { total: 0, correct: 0 };
    byDomain[domainId].total += 1;
    if (r.correct || r.answerCorrect) byDomain[domainId].correct += 1;
  }

  const domainSummary = Object.entries(byDomain).map(([domainId, counts]) => ({
    domainId,
    total: counts.total,
    correct: counts.correct,
    accuracy: counts.total ? Math.round((counts.correct / counts.total) * 100) : 0,
  }));

  const weakDomains = domainSummary.filter((d) => d.accuracy < 60).map((d) => d.domainId);
  const strongDomains = domainSummary.filter((d) => d.accuracy >= 80).map((d) => d.domainId);

  return { domainSummary, weakDomains, strongDomains };
}

// ---------------------------------------------------------------------------
// Submit a P1 practice attempt (client-side scoring)
// ---------------------------------------------------------------------------
/**
 * Score a completed P1 practice session.
 *
 * @param {{
 *   practiceSessionId: string,
 *   studentId: string,
 *   sessionType?: string,
 *   responses: object[],
 * }} params
 * @returns {{
 *   practiceSessionId: string,
 *   results: object[],
 *   accuracySummary: object,
 *   sessionType: string,
 * }}
 */
export function submitP1PracticeAttempt({
  practiceSessionId,
  studentId,
  sessionType = 'practice',
  responses = [],
} = {}) {
  const results = responses.map((r) => {
    const correct = Boolean(r.answerCorrect ?? r._correct ?? r.correct);
    return {
      attemptId: r.attemptId || makeId('attempt'),
      questionId: r.questionId,
      skillId: r.skillId || '',
      questionFamilyId: r.questionFamilyId || '',
      studentAnswer: String(r.studentAnswer ?? r.answer ?? ''),
      correctAnswer: String(r.correctAnswer ?? ''),
      correct,
      answerCorrect: correct,
      timeTaken: r.timeTaken || 0,
      confidence: r.confidence || r.confidenceLevel || '',
      confidenceLevel: r.confidenceLevel || r.confidence || '',
      reflection: r.reflection || r.confidence || '',
      helpRequested: Boolean(r.helpRequested),
      confidenceCalibration: r.confidenceCalibration || '',
      possibleMisconception: Boolean(r.possibleMisconception),
      skipped: Boolean(r.skipped),
      timestamp: r.timestamp || new Date().toISOString(),
    };
  });

  const total = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = total ? Math.round((correctCount / total) * 100) : 0;

  return {
    practiceSessionId,
    studentId,
    sessionType,
    results,
    accuracySummary: {
      total,
      correct: correctCount,
      accuracyPercentage: accuracy,
    },
  };
}

// ---------------------------------------------------------------------------
// Adaptive skill progression — recommend next skill after practice
// ---------------------------------------------------------------------------

/**
 * Collect all P1 skills from all domains, preserving domain order.
 */
function getAllP1Skills() {
  const allDomains = getDomains();
  const skills = [];
  // We need the actual skill objects with prerequisites — import each graph
  // The orchestrator only gives us skill IDs, not the full objects.
  // Use a lazy import pattern via the domain groups.
  for (const d of allDomains) {
    const domainSkillIds = d.skillIds || [];
    for (const id of domainSkillIds) {
      skills.push({ id, domainId: d.id });
    }
  }
  return skills;
}

/**
 * Check whether a skill's status counts as "mastered".
 */
function isMastered(status) {
  return ['mastered', 'accurate', 'fluent', 'retained'].includes(String(status || ''));
}

/**
 * Recommend the next P1 skill to practise.
 *
 * Strategy:
 * 1. If the current skill was NOT mastered, recommend the same skill again.
 * 2. Look for the next un-mastered skill in the same domain.
 * 3. If the whole domain is mastered, find the first un-mastered skill in the
 *    next domain (following the DOMAIN_GROUPS order).
 * 4. If everything is mastered, return null (congratulations!).
 *
 * @param {{
 *   currentSkillId: string,
 *   skillStatesMap: Record<string, { status: string }>,
 *   allSkillIds?: string[],
 * }} params
 * @returns {{ skillId: string, domainId: string, reason: string } | null}
 */
export function recommendNextP1Skill({ currentSkillId, skillStatesMap = {} } = {}) {
  const allDomains = getDomains();
  const currentDomainId = getDomainForSkill(currentSkillId);

  // If current skill not mastered, retry it
  const currentState = skillStatesMap[currentSkillId];
  if (!currentState || !isMastered(currentState.status)) {
    return { skillId: currentSkillId, domainId: currentDomainId || 'p1-numbers', reason: 'retry_current' };
  }

  // Find next un-mastered skill in current domain first
  const currentDomain = allDomains.find((d) => d.id === currentDomainId);
  if (currentDomain) {
    const domainSkillIds = currentDomain.skillIds || [];
    const currentIdx = domainSkillIds.indexOf(currentSkillId);
    // Look at skills after the current one in the same domain
    for (let i = currentIdx + 1; i < domainSkillIds.length; i++) {
      const sid = domainSkillIds[i];
      if (!isMastered(skillStatesMap[sid]?.status)) {
        return { skillId: sid, domainId: currentDomainId, reason: 'next_in_domain' };
      }
    }
    // Check earlier skills in the same domain that might not be mastered
    for (let i = 0; i < currentIdx; i++) {
      const sid = domainSkillIds[i];
      if (!isMastered(skillStatesMap[sid]?.status)) {
        return { skillId: sid, domainId: currentDomainId, reason: 'gap_in_domain' };
      }
    }
  }

  // Current domain is fully mastered — find next domain with un-mastered skills
  const currentDomainIdx = allDomains.findIndex((d) => d.id === currentDomainId);
  for (let di = 1; di <= allDomains.length; di++) {
    const domain = allDomains[(currentDomainIdx + di) % allDomains.length];
    if (domain.id === currentDomainId) continue;
    const domainSkillIds = domain.skillIds || [];
    for (const sid of domainSkillIds) {
      if (!isMastered(skillStatesMap[sid]?.status)) {
        return { skillId: sid, domainId: domain.id, reason: 'next_domain' };
      }
    }
  }

  // Everything mastered!
  return null;
}

export default {
  isP1SkillId,
  resolveP1DomainId,
  checkP1Answer,
  startP1PracticeFlow,
  startP1DiagnosticFlow,
  analyzeP1DiagnosticResults,
  submitP1PracticeAttempt,
  recommendNextP1Skill,
};
