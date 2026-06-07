export const MISTAKE_LEARNING_STATUSES = Object.freeze({
  NEW: 'new',
  ACKNOWLEDGED: 'acknowledged',
  CORRECTED: 'corrected',
  UNDERSTOOD: 'understood',
  MASTERED: 'mastered',
});

const STUDENT_STATUS_COPY = {
  new: 'Ready to learn from this mistake.',
  acknowledged: 'You found the mistake.',
  corrected: 'You fixed the mistake.',
  understood: 'You showed understanding.',
  mastered: 'You can now solve similar questions successfully.',
};

function clean(value = '') {
  return String(value || '').trim();
}

function normalise(value = '') {
  return clean(value).toLowerCase().replace(/\s+/g, '');
}

function hasUsefulReflection(text = '') {
  return clean(text).length >= 8;
}

function correctionMatches(mistake = {}, correctionAttempt = '') {
  const expected = normalise(mistake.correctAnswer);
  const attempt = normalise(correctionAttempt);
  if (!expected || !attempt) return false;
  return attempt === expected || attempt.includes(expected);
}

function inferUnderstandingPrompt(mistake = {}) {
  if (mistake.misconceptionTag || mistake.mistakeType === 'method_error') {
    return 'Which step should you change next time?';
  }
  if (mistake.mistakeType === 'calculation_error' || mistake.mistakeType === 'careless') {
    return 'How will you check this type of answer next time?';
  }
  return 'Why is the correct answer different from your first answer?';
}

function understandingPassed(answer = '') {
  return clean(answer).length >= 8;
}

export function statusCopy(status = 'new') {
  return STUDENT_STATUS_COPY[status] || STUDENT_STATUS_COPY.new;
}

export function buildMistakeCorrectionFlow(mistake = {}) {
  const learningStatus = mistake.learningStatus || (mistake.reviewed ? 'acknowledged' : 'new');
  return {
    mistakeId: String(mistake._id || mistake.id || ''),
    learningStatus,
    statusCopy: statusCopy(learningStatus),
    reflectionPrompt: 'What was the mistake?',
    correctionPrompt: 'Write the corrected answer.',
    understandingPrompt: mistake.understandingCheck?.prompt || inferUnderstandingPrompt(mistake),
    masteryRule: 'Mastery needs a successful correction, guided question, independent question, or recheck evidence.',
    canProgress: {
      acknowledge: learningStatus === 'new',
      correct: ['new', 'acknowledged'].includes(learningStatus),
      understand: ['acknowledged', 'corrected'].includes(learningStatus),
      master: learningStatus === 'understood',
    },
  };
}

export function applyMistakeLearningAction(mistake, {
  action = '',
  reflection = '',
  correctionAttempt = '',
  understandingAnswer = '',
  masteryEvidence = {},
  userId = null,
  source = 'student',
} = {}) {
  const now = new Date();
  const current = mistake.learningStatus || (mistake.reviewed ? 'acknowledged' : 'new');

  if (action === 'acknowledge') {
    mistake.learningStatus = current === 'new' ? 'acknowledged' : current;
    mistake.reviewed = true;
    mistake.reviewedAt = mistake.reviewedAt || now;
    mistake.reviewedByUserId = mistake.reviewedByUserId || userId;
    mistake.reviewSource = source;
    if (mistake.status === 'open') mistake.status = 'reviewed';
    return { mistake, learningStatus: mistake.learningStatus, message: statusCopy(mistake.learningStatus) };
  }

  if (action === 'correct') {
    if (!hasUsefulReflection(reflection)) {
      const err = new Error('Write a short reflection before moving on.');
      err.status = 400;
      err.code = 'REFLECTION_REQUIRED';
      throw err;
    }
    if (!clean(correctionAttempt)) {
      const err = new Error('Try correcting the answer before moving on.');
      err.status = 400;
      err.code = 'CORRECTION_REQUIRED';
      throw err;
    }
    mistake.reflection = clean(reflection);
    mistake.correctionAttempt = clean(correctionAttempt);
    mistake.reviewed = true;
    mistake.reviewedAt = mistake.reviewedAt || now;
    mistake.reviewedByUserId = mistake.reviewedByUserId || userId;
    mistake.reviewSource = source;
    if (mistake.status === 'open') mistake.status = 'reviewed';
    mistake.learningStatus = correctionMatches(mistake, correctionAttempt) ? 'corrected' : 'acknowledged';
    return {
      mistake,
      learningStatus: mistake.learningStatus,
      correctionCorrect: mistake.learningStatus === 'corrected',
      message: statusCopy(mistake.learningStatus),
    };
  }

  if (action === 'understand') {
    if (current !== 'corrected' && !correctionMatches(mistake, mistake.correctionAttempt)) {
      const err = new Error('Correct the mistake before the understanding check.');
      err.status = 409;
      err.code = 'CORRECTION_NOT_COMPLETE';
      throw err;
    }
    const passed = understandingPassed(understandingAnswer);
    mistake.understandingCheck = {
      prompt: inferUnderstandingPrompt(mistake),
      answer: clean(understandingAnswer),
      passed,
      checkedAt: now,
    };
    mistake.learningStatus = passed ? 'understood' : 'corrected';
    return { mistake, learningStatus: mistake.learningStatus, understandingPassed: passed, message: statusCopy(mistake.learningStatus) };
  }

  if (action === 'master') {
    const evidenceType = clean(masteryEvidence.evidenceType);
    if (!['successful_correction', 'guided_question', 'independent_question', 'recheck'].includes(evidenceType)) {
      const err = new Error('Mastery needs successful learning evidence.');
      err.status = 400;
      err.code = 'MASTERY_EVIDENCE_REQUIRED';
      throw err;
    }
    if ((mistake.learningStatus || current) !== 'understood' && evidenceType !== 'recheck') {
      const err = new Error('Show understanding before marking mastery.');
      err.status = 409;
      err.code = 'UNDERSTANDING_REQUIRED';
      throw err;
    }
    mistake.masteryEvidence = {
      evidenceType,
      sourceId: clean(masteryEvidence.sourceId),
      recordedAt: now,
      note: clean(masteryEvidence.note),
    };
    mistake.learningStatus = 'mastered';
    mistake.resolved = true;
    mistake.status = 'resolved';
    return { mistake, learningStatus: 'mastered', mastered: true, message: statusCopy('mastered') };
  }

  const err = new Error('Unknown mistake learning action.');
  err.status = 400;
  err.code = 'UNKNOWN_MISTAKE_ACTION';
  throw err;
}

export function shapeMistakeLearningFields(mistake = {}) {
  const learningStatus = mistake.learningStatus || (mistake.reviewed ? 'acknowledged' : 'new');
  return {
    learningStatus,
    learningStatusLabel: statusCopy(learningStatus),
    reflection: mistake.reflection || '',
    correctionAttempt: mistake.correctionAttempt || '',
    understandingCheck: mistake.understandingCheck || {},
    masteryEvidence: mistake.masteryEvidence || {},
    correctionFlow: buildMistakeCorrectionFlow(mistake),
  };
}

export function auditMasteryInflationRisk({ mistakes = [] } = {}) {
  const reviewedWithoutEvidence = mistakes.filter((mistake) => (
    mistake.reviewed
    && !mistake.masteryEvidence?.evidenceType
    && !mistake.understandingCheck?.passed
    && mistake.learningStatus !== 'mastered'
  ));
  const resolvedWithoutEvidence = mistakes.filter((mistake) => (
    (mistake.status === 'resolved' || mistake.resolved)
    && !mistake.masteryEvidence?.evidenceType
  ));
  return {
    reviewedWithoutEvidenceCount: reviewedWithoutEvidence.length,
    resolvedWithoutEvidenceCount: resolvedWithoutEvidence.length,
    risk: resolvedWithoutEvidence.length ? 'high' : reviewedWithoutEvidence.length ? 'medium' : 'low',
  };
}

export default {
  buildMistakeCorrectionFlow,
  applyMistakeLearningAction,
  shapeMistakeLearningFields,
  auditMasteryInflationRisk,
};
