function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function buildPaperAnalysisReport(analysis = {}) {
  const questions = analysis.detectedQuestions || [];
  const ignored = questions.filter((q) => q.adultIgnored).length;
  const correct = questions.filter((q) => q.adultConfirmedCorrect || q.teacherMarkedCorrect === true).length;
  const incorrect = questions.filter((q) => q.adultConfirmedWrong || q.teacherMarkedCorrect === false).length;
  const skillsDetected = unique(questions.flatMap((q) => q.detectedSkillIds || []));
  const weakSkills = unique(questions
    .filter((q) => q.adultConfirmedWrong || q.teacherMarkedCorrect === false)
    .flatMap((q) => q.detectedSkillIds || []));
  const misconceptions = unique(questions.flatMap((q) => q.misconceptionTags || []));
  return {
    totalQuestions: questions.length,
    correct,
    incorrect,
    ignored,
    skillsDetected,
    weakSkills,
    misconceptions,
    confidence: questions.length
      ? Math.round((questions.reduce((sum, q) => sum + Number(q.confidence || 0), 0) / questions.length) * 100) / 100
      : 0,
    reviewRequired: questions.some((q) => q.needsAdultReview),
  };
}

export function buildPaperAnalysisRecommendations(analysis = {}) {
  const report = buildPaperAnalysisReport(analysis);
  const actions = [];
  report.weakSkills.forEach((skillId) => {
    actions.push({
      type: 'assign_practice',
      skillId,
      reason: 'Adult-confirmed wrong question mapped to this skill.',
      status: 'pending_review',
      confidence: report.confidence,
    });
  });
  if (report.incorrect > 0) {
    actions.push({
      type: 'run_mini_diagnostic',
      skillId: '',
      reason: 'Confirmed errors are available for a focused recheck after practice.',
      status: 'pending_review',
      confidence: report.confidence,
    });
  }
  if (report.misconceptions.length) {
    actions.push({
      type: 'review_working',
      skillId: report.weakSkills[0] || '',
      reason: 'Misconception patterns were detected and should be reviewed with working evidence.',
      status: 'pending_review',
      confidence: report.confidence,
    });
  }
  if (report.weakSkills.length) {
    actions.push({
      type: 'generate_worksheet',
      skillId: report.weakSkills[0],
      reason: 'A short remediation worksheet can reinforce confirmed weak skills.',
      status: 'pending_review',
      confidence: report.confidence,
    });
  }
  return { report, recommendedActions: actions };
}

export default {
  buildPaperAnalysisReport,
  buildPaperAnalysisRecommendations,
};
