export const DIAGNOSTIC_DECISIONS = Object.freeze({
  MOVE_UP: 'MOVE_UP',
  SAME_LEVEL_CONFIRMATION: 'SAME_LEVEL_CONFIRMATION',
  STEP_DOWN: 'STEP_DOWN',
  PREREQUISITE_PROBE: 'PREREQUISITE_PROBE',
  MISCONCEPTION_PROBE: 'MISCONCEPTION_PROBE',
  REPHRASE_ONCE: 'REPHRASE_ONCE',
  STOP_AND_ASSIGN_PRACTICE: 'STOP_AND_ASSIGN_PRACTICE',
  MARK_SECURE: 'MARK_SECURE',
  MARK_FRAGILE: 'MARK_FRAGILE',
  ASSIGN_REMEDIATION: 'ASSIGN_REMEDIATION',
});

const HIGH_CONFIDENCE = new Set(['i_know_this', 'know_this', 'high', 'very_high', 'very_confident', 'confident']);
const LOW_CONFIDENCE = new Set(['not_sure', 'dont_know', 'i_need_help', 'need_help', 'low', 'unsure']);
const DEFAULT_EXPECTED_TIME_MS = 60000;
const DEFAULT_REPEATED_WRONG_LIMIT = 2;

function toId(value) {
  return String(value?.skillId || value?.id || value?._id || value || '').trim();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeConfidence(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (HIGH_CONFIDENCE.has(raw)) return 'high';
  if (LOW_CONFIDENCE.has(raw)) return 'low';
  return raw ? 'medium' : 'unknown';
}

function skillDifficulty(skill = {}) {
  return toNumber(skill.difficulty ?? skill.metadata?.difficulty ?? skill.order, 0);
}

function questionDifficulty(question = {}, skill = {}) {
  return toNumber(question.difficultyLevel ?? question.metadata?.difficultyLevel ?? question.difficulty, skillDifficulty(skill));
}

function expectedTimeMs(skill = {}, question = {}) {
  return Math.max(
    1000,
    toNumber(
      question.expectedTimeMs
        ?? question.metadata?.expectedTimeMs
        ?? skill.expectedTimeMs
        ?? skill.metadata?.expectedTimeMs
        ?? skill.metadata?.fluency?.targetSeconds * 1000,
      DEFAULT_EXPECTED_TIME_MS
    )
  );
}

function isSlowResponse({ currentSkill, currentQuestion, response = {} }) {
  const time = toNumber(response.timeTakenMs ?? response.timeMs ?? response.timeTakenSeconds * 1000, 0);
  if (!time) return false;
  const expected = expectedTimeMs(currentSkill, currentQuestion);
  return time > Math.max(expected * 1.5, expected + 15000);
}

function listSkills(skillGraph = {}) {
  if (Array.isArray(skillGraph)) return skillGraph;
  if (Array.isArray(skillGraph.skills)) return skillGraph.skills;
  if (skillGraph instanceof Map) return [...skillGraph.values()];
  return Object.values(skillGraph || {});
}

function buildSkillMap(skillGraph = {}) {
  return new Map(listSkills(skillGraph).map((skill) => [toId(skill), skill]).filter(([id]) => id));
}

function secureSkillSet(studentEvidence = {}, sessionState = {}) {
  return new Set([
    ...(studentEvidence.secureSkillIds || []),
    ...(studentEvidence.masteredSkillIds || []),
    ...(sessionState.secureSkillIds || []),
  ].map(toId).filter(Boolean));
}

function findPrerequisiteProbe({ currentSkill = {}, skillMap, studentEvidence = {}, sessionState = {} }) {
  const secure = secureSkillSet(studentEvidence, sessionState);
  const prereqs = (currentSkill.prerequisiteSkillIds || currentSkill.metadata?.prerequisiteSkillIds || []).map(toId).filter(Boolean);
  return prereqs.find((id) => !secure.has(id) && skillMap.has(id)) || prereqs.find((id) => skillMap.has(id)) || '';
}

function findStepDownSkill({ currentSkill = {}, skillMap, studentEvidence = {}, sessionState = {} }) {
  const currentId = toId(currentSkill);
  const currentDifficulty = skillDifficulty(currentSkill);
  const secure = secureSkillSet(studentEvidence, sessionState);
  const candidates = [...skillMap.values()]
    .filter((skill) => toId(skill) !== currentId)
    .filter((skill) => !secure.has(toId(skill)))
    .filter((skill) => {
      const sameSubject = !currentSkill.subjectId || !skill.subjectId || String(skill.subjectId) === String(currentSkill.subjectId);
      const sameDomain = !currentSkill.domainId || !skill.domainId || String(skill.domainId) === String(currentSkill.domainId);
      return sameSubject && sameDomain;
    })
    .filter((skill) => skillDifficulty(skill) < currentDifficulty)
    .sort((a, b) => skillDifficulty(b) - skillDifficulty(a));
  return toId(candidates[0] || '');
}

function findMoveUpSkill({ currentSkill = {}, skillMap, sessionState = {} }) {
  const currentId = toId(currentSkill);
  const currentDifficulty = skillDifficulty(currentSkill);
  const related = (currentSkill.relatedSkillIds || currentSkill.subSkillIds || currentSkill.metadata?.relatedSkillIds || [])
    .map(toId)
    .map((id) => skillMap.get(id))
    .filter(Boolean)
    .filter((skill) => skillDifficulty(skill) >= currentDifficulty)
    .sort((a, b) => skillDifficulty(a) - skillDifficulty(b));
  if (related[0]) return toId(related[0]);

  const attempted = new Set((sessionState.visitedSkillIds || []).map(toId));
  const candidates = [...skillMap.values()]
    .filter((skill) => toId(skill) !== currentId && !attempted.has(toId(skill)))
    .filter((skill) => {
      const sameSubject = !currentSkill.subjectId || !skill.subjectId || String(skill.subjectId) === String(currentSkill.subjectId);
      const sameDomain = !currentSkill.domainId || !skill.domainId || String(skill.domainId) === String(currentSkill.domainId);
      return sameSubject && sameDomain;
    })
    .filter((skill) => skillDifficulty(skill) > currentDifficulty)
    .sort((a, b) => skillDifficulty(a) - skillDifficulty(b));
  return toId(candidates[0] || '');
}

function repeatedWrongCount({ currentSkill, studentEvidence = {}, sessionState = {} }) {
  const skillId = toId(currentSkill);
  const bySkill = studentEvidence.attemptsBySkill?.[skillId] || sessionState.attemptsBySkill?.[skillId] || {};
  return Math.max(
    toNumber(studentEvidence.consecutiveWrong, 0),
    toNumber(sessionState.consecutiveWrong, 0),
    toNumber(bySkill.consecutiveWrong, 0),
    toNumber(sessionState.currentSkillWrongCount, 0)
  );
}

function shouldRephrase({ currentQuestion = {}, response = {}, sessionState = {}, detectedErrorTags = [] }) {
  if (!currentQuestion.canRephrase) return false;
  const questionId = String(currentQuestion.questionId || currentQuestion.id || currentQuestion._id || '');
  const used = Boolean(
    response.rephraseUsed
      || sessionState.rephraseUsed
      || (questionId && sessionState.rephraseUsedByQuestion?.[questionId])
  );
  if (used) return false;
  return detectedErrorTags.some((tag) => /misread|comprehension|language|question/i.test(String(tag)));
}

function makeDecision({
  sessionId = '',
  studentId = '',
  currentSkill = {},
  currentQuestion = {},
  response = {},
  decisionType,
  nextSkillId = '',
  nextDifficulty = null,
  reason,
  detectedErrorTags = [],
  metadataGaps = [],
  assignedPracticeSkillIds = [],
  shouldRephrase = false,
  shouldStopDiagnostic = false,
}) {
  return {
    sessionId,
    studentId,
    currentSkillId: toId(currentSkill),
    currentQuestionId: String(currentQuestion.questionId || currentQuestion.id || currentQuestion._id || ''),
    responseCorrect: Boolean(response.correct),
    confidence: String(response.confidence ?? response.reflection ?? ''),
    timeTakenMs: toNumber(response.timeTakenMs ?? response.timeMs ?? response.timeTakenSeconds * 1000, 0),
    attempts: toNumber(response.attempts ?? response.attemptNumber, 1),
    skipped: Boolean(response.skipped),
    blankAnswer: Boolean(response.blankAnswer),
    workingSubmitted: Boolean(response.workingSubmitted || response.workingUploaded || response.fullscreenWorkingSubmitted),
    detectedErrorTags,
    currentDifficulty: questionDifficulty(currentQuestion, currentSkill),
    decisionType,
    nextSkillId,
    nextDifficulty: nextSkillId ? nextDifficulty : undefined,
    reason,
    shouldRephrase,
    shouldShowHint: false,
    shouldStopDiagnostic,
    assignedPracticeSkillIds,
    metadataGaps,
  };
}

export function decideNextDiagnosticStep({
  sessionId = '',
  studentId = '',
  currentSkill = {},
  currentQuestion = {},
  response = {},
  studentEvidence = {},
  skillGraph = {},
  sessionState = {},
} = {}) {
  const skillMap = buildSkillMap(skillGraph);
  const detectedErrorTags = [
    ...(response.detectedErrorTags || []),
    ...(response.errorTags || []),
    ...(response.mistakeTags || []),
  ].filter(Boolean);
  const confidence = normalizeConfidence(response.confidence ?? response.reflection);
  const correct = Boolean(response.correct);
  const skipped = Boolean(response.skipped || response.timedOut);
  const blankAnswer = Boolean(response.blankAnswer || (!correct && response.studentAnswer === ''));
  const slow = isSlowResponse({ currentSkill, currentQuestion, response });
  const wrongCount = repeatedWrongCount({ currentSkill, studentEvidence, sessionState }) + (!correct && !skipped ? 1 : 0);
  const wrongLimit = toNumber(sessionState.repeatedWrongLimit, DEFAULT_REPEATED_WRONG_LIMIT);
  const prerequisiteId = findPrerequisiteProbe({ currentSkill, skillMap, studentEvidence, sessionState });
  const stepDownId = findStepDownSkill({ currentSkill, skillMap, studentEvidence, sessionState });
  const moveUpId = findMoveUpSkill({ currentSkill, skillMap, sessionState });
  const metadataGaps = [];
  const difficultyForSkill = (skillId) => {
    if (!skillId) return null;
    const skill = skillMap.get(skillId);
    return skill ? skillDifficulty(skill) : null;
  };

  if (!skillMap.size) metadataGaps.push('missing_skill_graph');
  if (!(currentSkill.prerequisiteSkillIds || currentSkill.metadata?.prerequisiteSkillIds)?.length) {
    metadataGaps.push('missing_prerequisite_metadata');
  }

  const base = {
    sessionId,
    studentId,
    currentSkill,
    currentQuestion,
    response: { ...response, skipped, blankAnswer },
    detectedErrorTags,
    metadataGaps,
  };

  if (!correct && wrongCount >= wrongLimit) {
    return makeDecision({
      ...base,
      decisionType: DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE,
      nextSkillId: '',
      shouldStopDiagnostic: true,
      assignedPracticeSkillIds: [prerequisiteId || toId(currentSkill)].filter(Boolean),
      reason: 'Repeated wrong answers have provided enough evidence. Stop testing and assign targeted practice.',
    });
  }

  if (!correct && shouldRephrase({ currentQuestion, response, sessionState, detectedErrorTags })) {
    return makeDecision({
      ...base,
        decisionType: DIAGNOSTIC_DECISIONS.REPHRASE_ONCE,
        nextSkillId: toId(currentSkill),
        nextDifficulty: skillDifficulty(currentSkill),
        shouldRephrase: true,
      reason: 'Question metadata allows one rephrase and the response suggests a comprehension issue.',
    });
  }

  if (correct && confidence === 'high' && !slow) {
    const skillId = toId(currentSkill);
    const bySkill = studentEvidence.attemptsBySkill?.[skillId] || sessionState.attemptsBySkill?.[skillId] || {};
    const priorCorrect = toNumber(bySkill.correctCount, 0) + toNumber(sessionState.currentSkillCorrectCount, 0);
    const MIN_CORRECT_FOR_SECURE = 2;
    if (moveUpId) {
      return makeDecision({
        ...base,
        decisionType: DIAGNOSTIC_DECISIONS.MOVE_UP,
        nextSkillId: moveUpId,
        nextDifficulty: difficultyForSkill(moveUpId),
        reason: 'Correct answer with high confidence and reasonable time. Move to a harder linked skill.',
      });
    }
    if (priorCorrect >= MIN_CORRECT_FOR_SECURE - 1) {
      return makeDecision({
        ...base,
        decisionType: DIAGNOSTIC_DECISIONS.MARK_SECURE,
        reason: 'At least 2 correct answers with high confidence. Mark current skill secure.',
      });
    }
    return makeDecision({
      ...base,
      decisionType: DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION,
      nextSkillId: skillId,
      nextDifficulty: skillDifficulty(currentSkill),
      reason: 'First correct answer with high confidence — need one more to confirm before marking secure.',
    });
  }

  if (correct && (confidence === 'low' || confidence === 'unknown')) {
    return makeDecision({
      ...base,
      decisionType: currentQuestion.hasParallelItem
        ? DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION
        : DIAGNOSTIC_DECISIONS.MARK_FRAGILE,
      nextSkillId: toId(currentSkill),
      nextDifficulty: skillDifficulty(currentSkill),
      reason: 'Correct answer with low confidence. Confirm the same skill or mark mastery as fragile.',
    });
  }

  if (correct && slow) {
    return makeDecision({
      ...base,
      decisionType: DIAGNOSTIC_DECISIONS.MARK_FRAGILE,
      nextSkillId: toId(currentSkill),
      nextDifficulty: skillDifficulty(currentSkill),
      reason: 'Correct answer was slow. Concept may be present but fluency is not secure.',
    });
  }

  if (!correct && confidence === 'high') {
    return makeDecision({
      ...base,
      decisionType: DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE,
      nextSkillId: toId(currentSkill),
      nextDifficulty: skillDifficulty(currentSkill),
      reason: 'Wrong answer with high confidence. Probe for misconception using item error-tag metadata.',
    });
  }

  if (skipped || blankAnswer) {
    return makeDecision({
      ...base,
      decisionType: prerequisiteId ? DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE : DIAGNOSTIC_DECISIONS.STEP_DOWN,
      nextSkillId: prerequisiteId || stepDownId,
      nextDifficulty: difficultyForSkill(prerequisiteId || stepDownId),
      reason: prerequisiteId
        ? 'Skipped, blank, or timed out. Probe an unmet prerequisite from the skill graph.'
        : 'Skipped, blank, or timed out. No prerequisite was available, so step down by difficulty.',
    });
  }

  if (!correct && (confidence === 'low' || confidence === 'unknown')) {
    return makeDecision({
      ...base,
      decisionType: prerequisiteId ? DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE : DIAGNOSTIC_DECISIONS.STEP_DOWN,
      nextSkillId: prerequisiteId || stepDownId,
      nextDifficulty: difficultyForSkill(prerequisiteId || stepDownId),
      reason: prerequisiteId
        ? 'Wrong answer with low confidence. Probe prerequisite skill from skill graph.'
        : 'Wrong answer with low confidence. No prerequisite metadata was available, so step down by difficulty.',
    });
  }

  return makeDecision({
    ...base,
    decisionType: stepDownId ? DIAGNOSTIC_DECISIONS.STEP_DOWN : DIAGNOSTIC_DECISIONS.ASSIGN_REMEDIATION,
    nextSkillId: stepDownId,
    nextDifficulty: difficultyForSkill(stepDownId),
    assignedPracticeSkillIds: [stepDownId || toId(currentSkill)].filter(Boolean),
    reason: stepDownId
      ? 'Evidence is mixed. Step down to an easier skill in the same skill graph.'
      : 'No valid next question path was available. Assign remediation practice from current evidence.',
    shouldStopDiagnostic: !stepDownId,
  });
}

export function calculateDiagnosticReadinessScore({
  correct = false,
  confidence = '',
  timeTakenMs = 0,
  difficulty = 1,
  attempts = 1,
  skipped = false,
  blankAnswer = false,
} = {}) {
  if (skipped || blankAnswer) return 0;
  const confidenceSignal = normalizeConfidence(confidence);
  const difficultyWeight = Math.max(0.5, Math.min(2, toNumber(difficulty, 1) / 3));
  const base = correct ? 70 : 20;
  const confidenceBonus = confidenceSignal === 'high' ? 15 : confidenceSignal === 'low' ? -10 : 0;
  const timePenalty = toNumber(timeTakenMs, 0) > DEFAULT_EXPECTED_TIME_MS ? 10 : 0;
  const attemptPenalty = Math.max(0, toNumber(attempts, 1) - 1) * 8;
  return Math.max(0, Math.min(100, Math.round((base + confidenceBonus - timePenalty - attemptPenalty) * difficultyWeight)));
}

export default {
  DIAGNOSTIC_DECISIONS,
  decideNextDiagnosticStep,
  calculateDiagnosticReadinessScore,
};
