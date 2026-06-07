const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

function signalFromScore(score, weakThreshold = 70) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'unknown';
  return Number(score) < weakThreshold ? 'weak' : 'secure';
}

function signalFromAccuracy(accuracy, weakThreshold = 70) {
  if (accuracy === null || accuracy === undefined || Number.isNaN(Number(accuracy))) return 'unknown';
  return Number(accuracy) < weakThreshold ? 'weak' : 'improving';
}

function summarizeSignals(signals) {
  const usable = signals.filter((item) => item.signal !== 'unknown');
  if (!usable.length) {
    return { agreementScore: 0, dominantSignal: 'insufficient', conflicts: [] };
  }

  const counts = usable.reduce((acc, item) => {
    acc[item.signal] = (acc[item.signal] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [dominantSignal, dominantCount] = sorted[0];
  const conflicts = usable
    .filter((item) => item.signal !== dominantSignal)
    .map((item) => ({ source: item.source, signal: item.signal, reason: item.reason }));

  return {
    agreementScore: clamp(Math.round((dominantCount / usable.length) * 100)),
    dominantSignal,
    conflicts,
  };
}

export function validateCrossEvidenceForSkill({
  skillId,
  diagnosticEvidence = {},
  paperEvidence = {},
  workingEvidence = {},
  assignmentEvidence = {},
  recheckEvidence = {},
} = {}) {
  const signals = [
    {
      source: 'diagnostic',
      signal: diagnosticEvidence.isWeak === true
        ? 'weak'
        : diagnosticEvidence.isWeak === false
          ? 'secure'
          : signalFromScore(diagnosticEvidence.score),
      reason: diagnosticEvidence.reason || 'Diagnostic skill score and question evidence.',
    },
    {
      source: 'paper_analysis',
      signal: paperEvidence.isWeak === true
        ? 'weak'
        : paperEvidence.isWeak === false
          ? 'secure'
          : 'unknown',
      reason: paperEvidence.reason || 'Uploaded paper weak-skill confirmation.',
    },
    {
      source: 'working_evidence',
      signal: workingEvidence.methodIssue ? 'weak' : workingEvidence.hasClearWorking ? 'secure' : 'unknown',
      reason: workingEvidence.reason || 'Working evidence method and step quality.',
    },
    {
      source: 'assignment',
      signal: assignmentEvidence.completed
        ? signalFromAccuracy(assignmentEvidence.accuracy)
        : assignmentEvidence.started
          ? 'weak'
          : 'unknown',
      reason: assignmentEvidence.reason || 'Recovery Pack completion and accuracy.',
    },
    {
      source: 'recheck',
      signal: recheckEvidence.completed
        ? signalFromScore(recheckEvidence.score)
        : 'unknown',
      reason: recheckEvidence.reason || 'Recheck diagnostic score after intervention.',
    },
  ];

  const summary = summarizeSignals(signals);
  const confidenceLevel = summary.agreementScore >= 75
    ? 'high'
    : summary.agreementScore >= 50
      ? 'medium'
      : 'low';

  return {
    skillId,
    agreementScore: summary.agreementScore,
    confidenceLevel,
    dominantSignal: summary.dominantSignal,
    sourceSignals: signals,
    conflicts: summary.conflicts,
    requiresReview: summary.agreementScore < 60 || summary.conflicts.length > 1,
  };
}

export function buildCrossEvidenceValidation({
  skillIds = [],
  diagnostics = [],
  attempts = [],
  paperAnalyses = [],
  assignments = [],
  rechecks = [],
} = {}) {
  const uniqueSkillIds = Array.from(new Set(skillIds.filter(Boolean)));

  return uniqueSkillIds.map((skillId) => {
    const latestDiagnostic = diagnostics
      .flatMap((session) => session.perSkillSnapshot || [])
      .filter((snapshot) => snapshot.skillId === skillId)
      .at(-1);
    const skillAttempts = attempts.filter((attempt) => attempt.skillId === skillId);
    const wrongAttempts = skillAttempts.filter((attempt) => (attempt.answerCorrect ?? attempt.correct) === false);
    const paperWeak = paperAnalyses.some((paper) => (paper.weakSkillIds || []).includes(skillId)
      || (paper.detectedQuestions || []).some((question) => (
        (question.detectedSkillIds || []).includes(skillId) && question.adultConfirmedWrong
      )));
    const assignment = assignments.find((item) => (item.skillIds || []).includes(skillId));
    const recheckSnapshot = rechecks
      .flatMap((session) => session.perSkillSnapshot || [])
      .filter((snapshot) => snapshot.skillId === skillId)
      .at(-1);

    return validateCrossEvidenceForSkill({
      skillId,
      diagnosticEvidence: {
        score: latestDiagnostic?.score,
        isWeak: latestDiagnostic ? Number(latestDiagnostic.score) < 70 : undefined,
        reason: latestDiagnostic ? `${latestDiagnostic.correctCount || 0}/${latestDiagnostic.questionsAnswered || 0} diagnostic questions correct.` : undefined,
      },
      paperEvidence: { isWeak: paperWeak, reason: paperWeak ? 'Paper analysis confirms this weak skill.' : undefined },
      workingEvidence: {
        methodIssue: wrongAttempts.some((attempt) => attempt.workingRequirementLevel === 'HIGH' && attempt.workingNotNeeded),
        hasClearWorking: skillAttempts.some((attempt) => attempt.workingSubmitted),
      },
      assignmentEvidence: assignment ? {
        started: ['in_progress', 'completed'].includes(assignment.status),
        completed: assignment.status === 'completed',
        accuracy: assignment.completion?.accuracy,
      } : {},
      recheckEvidence: recheckSnapshot ? { completed: true, score: recheckSnapshot.score } : {},
    });
  });
}
