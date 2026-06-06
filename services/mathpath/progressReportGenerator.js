function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function generateParentProgressReport({
  student = {},
  growth = {},
  assignments = [],
  papers = [],
  recommendations = [],
} = {}) {
  const completedRecoveryPacks = assignments.filter((assignment) => assignment.status === 'completed');
  const completedRechecks = (growth.history || []).filter((session) => session.diagnosticPurpose === 'recheck');

  return {
    reportType: 'parent_progress_report',
    generatedAt: new Date().toISOString(),
    student: {
      studentId: String(student._id || student.id || student.studentId || ''),
      name: student.name || 'Student',
      level: student.level || '',
    },
    baseline: growth.baseline ? {
      diagnosticSessionId: growth.baseline.diagnosticSessionId,
      readinessScore: num(growth.baseline.readinessScore),
      completedAt: growth.baseline.completedAt,
    } : null,
    latestDiagnostic: growth.latest ? {
      diagnosticSessionId: growth.latest.diagnosticSessionId,
      diagnosticPurpose: growth.latest.diagnosticPurpose || 'baseline',
      readinessScore: num(growth.latest.readinessScore),
      completedAt: growth.latest.completedAt,
    } : null,
    improvement: growth.overallImprovement ?? null,
    recoveryPacksCompleted: completedRecoveryPacks.map((assignment) => ({
      assignmentId: String(assignment._id || assignment.id || ''),
      title: assignment.title || 'Recovery Pack',
      completedAt: assignment.completion?.completedAt || assignment.updatedAt,
      accuracy: num(assignment.completion?.accuracy),
      skillIds: assignment.skillIds || [],
    })),
    rechecksCompleted: completedRechecks.map((session) => ({
      diagnosticSessionId: session.diagnosticSessionId,
      readinessScore: num(session.readinessScore),
      completedAt: session.completedAt,
      assignmentId: session.assignmentId || '',
    })),
    currentWeakSkills: growth.remainingWeakSkills || [],
    papersReviewed: papers.filter((paper) => ['reviewed', 'assigned'].includes(paper.status)).map((paper) => ({
      paperAnalysisId: String(paper._id || paper.id || ''),
      title: paper.originalFilename || 'Uploaded paper',
      weakSkillIds: paper.weakSkillIds || [],
      reviewedAt: paper.reviewedAt,
    })),
    recommendedNextSteps: recommendations.map((item) => ({
      type: item.type,
      title: item.title,
      reason: item.reason,
      priority: item.priority,
    })),
  };
}

export default {
  generateParentProgressReport,
};
