function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function generateStudentCareParentSummary({
  student = {},
  assignments = [],
  growth = {},
  papers = [],
  recommendations = [],
} = {}) {
  const latestCompletedPack = [...assignments]
    .filter((assignment) => assignment.status === 'completed')
    .sort((a, b) => new Date(b.completion?.completedAt || b.updatedAt || b.createdAt || 0) - new Date(a.completion?.completedAt || a.updatedAt || a.createdAt || 0))[0] || null;
  const recheckReady = assignments.find((assignment) => assignment.recheck?.recommended && !assignment.recheck?.diagnosticSessionId) || null;
  const latestPaper = [...papers].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null;
  const weakArea = (growth.remainingWeakSkills || [])[0] || latestPaper?.weakSkillIds?.[0] || '';
  const next = recommendations[0] || null;
  const studentId = String(student._id || student.id || student.studentId || '');
  const studentDisplayName = student.name || 'Student';
  const completedToday = latestCompletedPack ? [{
    type: 'recovery_pack',
    title: latestCompletedPack.title || 'Recovery Pack',
    accuracy: num(latestCompletedPack.completion?.accuracy),
    completedAt: latestCompletedPack.completion?.completedAt || latestCompletedPack.updatedAt,
  }] : [];
  const currentWeakSkills = (growth.remainingWeakSkills || (weakArea ? [weakArea] : [])).filter(Boolean);
  const improvementHighlights = Number.isFinite(Number(growth.overallImprovement))
    ? [`Readiness changed by ${num(growth.overallImprovement)} points since baseline.`]
    : [];
  const recommendedNextActions = [next ? {
    type: next.type,
    title: next.title,
    reason: next.reason,
  } : (recheckReady ? {
    type: 'run_recheck',
    title: 'Run Recheck',
    reason: 'Recovery Pack is complete and recheck is ready.',
  } : {
    type: 'continue_learning',
    title: 'Continue Learning',
    reason: 'Keep building steady MathPath evidence.',
  })];
  const parentFriendlySummary = `${studentDisplayName} ${latestCompletedPack ? `completed ${latestCompletedPack.title || 'a Recovery Pack'} with ${num(latestCompletedPack.completion?.accuracy)}% accuracy. ` : ''}${recheckReady ? 'A recheck is recommended. ' : ''}${weakArea ? `Current weak area: ${weakArea}.` : 'No urgent weak area is flagged.'}`;

  return {
    studentId,
    studentName: studentDisplayName,
    date: new Date().toISOString(),
    completedToday,
    currentWeakSkills,
    improvementHighlights,
    recommendedNextActions,
    parentFriendlySummary,
    student: {
      studentId,
      name: studentDisplayName,
      level: student.level || '',
    },
    today: {
      completedRecoveryPack: latestCompletedPack ? {
        assignmentId: String(latestCompletedPack._id || latestCompletedPack.id || ''),
        title: latestCompletedPack.title || 'Recovery Pack',
        accuracy: num(latestCompletedPack.completion?.accuracy),
        completedAt: latestCompletedPack.completion?.completedAt || latestCompletedPack.updatedAt,
      } : null,
      recheckRecommended: Boolean(recheckReady),
      paperReviewed: latestPaper && ['reviewed', 'assigned'].includes(latestPaper.status) ? {
        paperAnalysisId: String(latestPaper._id || latestPaper.id || ''),
        title: latestPaper.originalFilename || 'Uploaded paper',
        status: latestPaper.status,
      } : null,
    },
    weakArea,
    recommendedNextAction: next ? {
      type: next.type,
      title: next.title,
      reason: next.reason,
    } : (recheckReady ? {
      type: 'run_recheck',
      title: 'Run Recheck',
      reason: 'Recovery Pack is complete and recheck is ready.',
    } : {
      type: 'continue_learning',
      title: 'Continue Learning',
      reason: 'Keep building steady MathPath evidence.',
    }),
    parentCopy: parentFriendlySummary,
  };
}

export default {
  generateStudentCareParentSummary,
};
