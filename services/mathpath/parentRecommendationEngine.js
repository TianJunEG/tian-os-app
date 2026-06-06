const PRIORITY_WEIGHT = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function dateValue(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
}

function sortRecommendations(items = []) {
  return [...items].sort((a, b) => {
    const p = (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
    if (p !== 0) return p;
    return dateValue(b.createdAt || b.updatedAt || b.recommendedAt) - dateValue(a.createdAt || a.updatedAt || a.recommendedAt);
  });
}

export function buildParentRecommendations({
  growth = {},
  assignments = [],
  papers = [],
  mistakes = [],
  now = new Date(),
} = {}) {
  const recs = [];

  const recheckReady = assignments.find((assignment) => assignment.recheck?.recommended && !assignment.recheck?.diagnosticSessionId);
  if (recheckReady) {
    recs.push({
      type: 'run_recheck',
      priority: 'critical',
      title: 'Run Recheck',
      reason: `${recheckReady.title || 'Recovery Pack'} is ready for a recheck.`,
      actionLabel: 'Run Recheck',
      assignmentId: String(recheckReady._id || recheckReady.id || ''),
      createdAt: recheckReady.recheck?.recommendedAt || recheckReady.updatedAt || recheckReady.createdAt,
    });
  }

  const activeAssignment = assignments.find((assignment) => ['assigned', 'in_progress'].includes(assignment.status));
  if (activeAssignment) {
    const attempted = num(activeAssignment.completion?.questionsAttempted);
    const target = num(activeAssignment.targetQuestionCount || activeAssignment.completion?.questionsAssigned);
    recs.push({
      type: 'complete_recovery_pack',
      priority: 'high',
      title: 'Complete Recovery Pack',
      reason: `${attempted}/${target || '-'} questions completed.`,
      actionLabel: 'Continue Recovery Pack',
      assignmentId: String(activeAssignment._id || activeAssignment.id || ''),
      createdAt: activeAssignment.updatedAt || activeAssignment.createdAt,
    });
  }

  const needsReviewPaper = papers.find((paper) => ['uploaded', 'processing', 'ocr_complete', 'questions_detected', 'needs_review'].includes(paper.status));
  if (needsReviewPaper) {
    recs.push({
      type: 'review_uploaded_paper',
      priority: 'high',
      title: 'Review Uploaded Paper',
      reason: 'A paper has detected questions or weak skills waiting for adult confirmation.',
      actionLabel: 'Review Paper',
      paperAnalysisId: String(needsReviewPaper._id || needsReviewPaper.id || ''),
      createdAt: needsReviewPaper.updatedAt || needsReviewPaper.createdAt,
    });
  }

  const remainingWeak = growth.remainingWeakSkills || [];
  if (remainingWeak.length && !activeAssignment) {
    recs.push({
      type: 'assign_recovery_pack',
      priority: 'high',
      title: 'Assign Recovery Pack',
      reason: `${remainingWeak[0]} is still below readiness threshold.`,
      actionLabel: 'Assign Recovery Pack',
      skillId: remainingWeak[0],
      createdAt: growth.latest?.completedAt,
    });
  }

  const highMistakes = mistakes
    .filter((mistake) => mistake.severity === 'high' || num(mistake.frequency) >= 3)
    .sort((a, b) => num(b.frequency) - num(a.frequency));
  if (highMistakes[0]) {
    recs.push({
      type: 'schedule_tutor_support',
      priority: 'medium',
      title: 'Schedule Tutor Support',
      reason: `${highMistakes[0].skillId || 'A skill'} has repeated mistakes that may need adult explanation.`,
      actionLabel: 'Plan Tutor Support',
      skillId: highMistakes[0].skillId || '',
      createdAt: highMistakes[0].lastSeenAt,
    });
  }

  if (!growth.latest && !assignments.length && !papers.length) {
    recs.push({
      type: 'needs_adult_attention',
      priority: 'medium',
      title: 'Start MathPath Check-In',
      reason: 'No completed diagnostic or recent intervention evidence is available yet.',
      actionLabel: 'Start Diagnostic',
    });
  }

  const staleDays = growth.latest?.completedAt
    ? Math.floor((now - new Date(growth.latest.completedAt)) / 86400000)
    : null;
  if (staleDays !== null && staleDays >= 14) {
    recs.push({
      type: 'run_recheck',
      priority: 'medium',
      title: 'Run Recheck',
      reason: `Last diagnostic was ${staleDays} days ago.`,
      actionLabel: 'Run Recheck',
      createdAt: growth.latest?.completedAt,
    });
  }

  return sortRecommendations(recs).slice(0, 3);
}

export function buildSuccessCentreStory({
  student = {},
  growth = {},
  assignments = [],
  papers = [],
  mistakes = [],
  recommendations = [],
} = {}) {
  const latestAssignment = [...assignments].sort((a, b) => dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt))[0] || null;
  const latestPaper = [...papers].sort((a, b) => dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt))[0] || null;
  const topImprovements = (growth.perSkillGrowth || [])
    .filter((row) => row.improvement !== null && row.improvement !== undefined && num(row.improvement) > 0)
    .sort((a, b) => num(b.improvement) - num(a.improvement))
    .slice(0, 5);
  const currentConcerns = (growth.perSkillGrowth || [])
    .filter((row) => row.currentScore !== null && row.currentScore !== undefined && num(row.currentScore) < 60)
    .sort((a, b) => num(a.currentScore) - num(b.currentScore))
    .slice(0, 5)
    .map((row) => ({
      skillId: row.skillId,
      skillName: row.skillName || row.skillId,
      currentReadiness: num(row.currentScore),
      suggestedAction: recommendations[0]?.title || 'Assign Recovery Pack',
    }));

  return {
    student: {
      studentId: String(student._id || student.id || student.studentId || ''),
      name: student.name || 'Student',
      level: student.level || '',
    },
    currentStatus: {
      baselineReadiness: growth.baseline?.readinessScore ?? null,
      currentReadiness: growth.latest?.readinessScore ?? null,
      improvement: growth.overallImprovement ?? null,
      lastDiagnosticDate: growth.latest?.completedAt || null,
      remainingWeakSkillCount: (growth.remainingWeakSkills || []).length,
      activeRecoveryPackCount: assignments.filter((assignment) => ['assigned', 'in_progress'].includes(assignment.status)).length,
    },
    improvementJourney: {
      baseline: growth.baseline ? {
        label: 'Baseline Diagnostic',
        readinessScore: growth.baseline.readinessScore,
        completedAt: growth.baseline.completedAt,
      } : null,
      recoveryPack: latestAssignment ? {
        label: latestAssignment.title || 'Recovery Pack',
        status: latestAssignment.status,
        questionsAttempted: latestAssignment.completion?.questionsAttempted || 0,
        targetQuestionCount: latestAssignment.targetQuestionCount || latestAssignment.completion?.questionsAssigned || 0,
        accuracy: latestAssignment.completion?.accuracy || 0,
      } : null,
      recheck: growth.latest && growth.latest?.diagnosticSessionId !== growth.baseline?.diagnosticSessionId ? {
        label: 'Recheck',
        readinessScore: growth.latest.readinessScore,
        completedAt: growth.latest.completedAt,
      } : null,
      current: {
        label: 'Current Status',
        readinessScore: growth.latest?.readinessScore ?? null,
        improvement: growth.overallImprovement ?? null,
      },
    },
    topImprovements,
    currentConcerns,
    recommendedActions: recommendations,
    recentReports: [
      ...(latestPaper ? [{
        type: 'paper_analysis',
        title: latestPaper.originalFilename || 'Uploaded paper',
        status: latestPaper.status,
        createdAt: latestPaper.createdAt,
        id: String(latestPaper._id || latestPaper.id || ''),
      }] : []),
      ...(growth.latest ? [{
        type: 'diagnostic',
        title: 'Latest diagnostic',
        status: 'completed',
        createdAt: growth.latest.completedAt,
        id: growth.latest.diagnosticSessionId,
      }] : []),
    ],
    upcomingRechecks: assignments
      .filter((assignment) => assignment.recheck?.recommended)
      .map((assignment) => ({
        assignmentId: String(assignment._id || assignment.id || ''),
        title: assignment.title || 'Recovery Pack',
        recommendedAt: assignment.recheck?.recommendedAt,
        diagnosticSessionId: assignment.recheck?.diagnosticSessionId || '',
      })),
  };
}

export default {
  buildParentRecommendations,
  buildSuccessCentreStory,
};
