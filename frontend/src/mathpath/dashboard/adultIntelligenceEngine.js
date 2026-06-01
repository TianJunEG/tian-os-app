import { fractionSkillGraph, getSkill } from '../fractions/fractionSkillGraph.js';
import { getQuestionFamiliesBySkill } from '../fractions/fractionQuestionFamilies.js';
import { getFractionMistakeTaxonomy } from '../fractions/fractionMistakeToMasteryEngine.js';

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function dedupe(values = []) {
  return [...new Set((values || []).filter(Boolean))];
}

function skillName(skillId = '') {
  return getSkill(skillId)?.name || skillId || 'Unmapped skill';
}

function parentSkillLabel(skillId = '') {
  const name = skillName(skillId);
  return String(name || skillId).replace(/^F\d{3}\s*/, '');
}

function latestDate(...values) {
  const dates = values
    .flat()
    .map((value) => new Date(value || 0))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() > 0)
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0]?.toISOString() || null;
}

function severityRank(value = '') {
  const map = { critical: 5, high: 4, major: 4, medium: 3, moderate: 3, low: 2, minor: 1 };
  return map[String(value).toLowerCase()] || 1;
}

function actionPriority(action = {}) {
  const severity = severityRank(action.severity || action.priorityBand);
  return (severity * 100) + toNum(action.weight, 0);
}

function normaliseMistakeRows(mistakePlans = []) {
  const taxonomy = new Map(getFractionMistakeTaxonomy().map((row) => [row.code, row]));
  return (mistakePlans || []).flatMap((plan) => {
    const focus = plan.focusMistakes || [];
    return focus.map((mistake) => {
      const code = mistake.mistakeCode || mistake.suspectedMistakeCode || 'M010';
      const tax = taxonomy.get(code) || {};
      return {
        studentId: plan.studentId || mistake.studentId || '',
        mistakeCode: code,
        mistakeName: tax.title || code,
        category: mistake.category || tax.category || 'careless_error',
        severity: mistake.highestSeverityLevel || mistake.severityLevel || mistake.highestSeverity || mistake.severity || 'medium',
        frequency: toNum(mistake.count || mistake.frequency, 1),
        rootCauseSkillIds: dedupe([...(plan.rootCauseSkillIds || []), ...(mistake.rootCauseSkillIds || [])]),
        remediationSkillIds: dedupe([...(tax.remediationSkillIds || []), ...(mistake.remediationSkillIds || [])]),
        nextActions: plan.nextActions || [],
        interventionPathways: plan.interventionPathways || [],
        worksheetMappings: plan.worksheetMappings || [],
        reassessmentQueue: plan.reassessmentQueue || [],
        latestAt: mistake.mostRecent || plan.createdAt || plan.generatedAt || null,
      };
    });
  });
}

function buildMasterySignals({ studentProgressState = {}, diagnosticResult = {}, practiceState = {} }) {
  const masteredSkillIds = dedupe([
    ...(studentProgressState.masteryProgress?.masteredSkillIds || []),
    ...(studentProgressState.masteredSkillIds || []),
    ...(diagnosticResult.masteredSkillIds || []),
    ...(practiceState.masteredSkillIds || []),
  ]);
  const weakSkillIds = dedupe([
    ...(studentProgressState.weakSkills || []).map((row) => row.skillId || row),
    ...(studentProgressState.weakSkillIds || []),
    ...(diagnosticResult.weakSkillIds || []),
    ...(practiceState.weakSkillIds || []),
  ]);
  const currentSkillId = studentProgressState.currentSkill?.skillId || practiceState.currentSkillId || diagnosticResult.recommendedStartingSkillId || weakSkillIds[0] || '';
  const total = fractionSkillGraph.skillIds.length || 1;

  return {
    masteredSkillIds,
    weakSkillIds,
    currentSkillId,
    currentFocusSkills: dedupe([currentSkillId, ...weakSkillIds]).slice(0, 4).filter(Boolean),
    masteryPercentage: Math.round((masteredSkillIds.length / total) * 1000) / 10,
    recentlyMasteredSkills: masteredSkillIds.slice(-5).map((skillId) => ({ skillId, label: parentSkillLabel(skillId) })),
    skillsRequiringAttention: weakSkillIds.slice(0, 6).map((skillId) => ({ skillId, label: parentSkillLabel(skillId) })),
  };
}

function buildConfidenceSignals({ attempts = [], diagnosticResult = {}, fluencyState = {} }) {
  const confidenceRows = attempts.filter((attempt) => attempt.confidence || attempt.confidenceLevel);
  const mismatches = confidenceRows.filter((attempt) => {
    const confidence = String(attempt.confidence || attempt.confidenceLevel || '').toLowerCase();
    const high = confidence.includes('confident') || confidence.includes('very') || toNum(confidence, 0) >= 4;
    const low = confidence.includes('guess') || confidence.includes('unsure') || toNum(confidence, 5) <= 2;
    return (high && attempt.correct === false) || (low && attempt.correct === true);
  });
  const diagnosticCalibration = diagnosticResult.confidenceCalibration || diagnosticResult.explainability?.confidenceInsights?.calibrationLabel || '';
  return {
    attemptsWithConfidence: confidenceRows.length,
    mismatchCount: mismatches.length,
    confidenceCalibration: diagnosticCalibration || (mismatches.length ? 'needs_calibration' : 'stable'),
    trend: mismatches.length >= 3 ? 'watch' : fluencyState.confidenceTrend || 'stable',
  };
}

function buildFluencySignals(fluencyState = {}) {
  const rows = fluencyState.questionFamilyResults || [];
  const accurateButSlow = rows.filter((row) => row.status === 'accurateButSlow');
  const fastButWrong = rows.filter((row) => toNum(row.accuracy, 100) < 75 && toNum(row.averageTime, 999) <= toNum(row.benchmarkTime || row.targetTimeSeconds, 999));
  return {
    averageResponseTime: rows.length ? Math.round(rows.reduce((sum, row) => sum + toNum(row.averageTime, 0), 0) / rows.length * 10) / 10 : null,
    accurateButSlowSkillIds: dedupe(accurateButSlow.map((row) => row.skillId)),
    fastButWrongSkillIds: dedupe(fastButWrong.map((row) => row.skillId)),
    trend: accurateButSlow.length ? 'understanding_not_fluent' : fastButWrong.length ? 'possible_misconception' : rows.length ? 'stable' : 'building_data',
  };
}

function buildWorkingEvidenceSignals(workingAnalysisSummary = {}) {
  const missing = toNum(workingAnalysisSummary.missingWorkingCount, 0) + (workingAnalysisSummary.missingWorkingQuestions || []).length;
  const unreadable = (workingAnalysisSummary.unreadableWorkingQuestions || []).length;
  const quality = workingAnalysisSummary.averageWorkingQuality ?? workingAnalysisSummary.workingQualityScore?.finalScore ?? null;
  return {
    averageWorkingQuality: quality,
    missingWorkingCount: missing,
    unreadableWorkingCount: unreadable,
    supportFlag: missing >= 2 || unreadable >= 1,
    adultMessage: missing
      ? 'Some working is missing. Please remind the student to upload clear steps.'
      : unreadable
        ? 'Some uploaded working is hard to read. Review the layout together.'
        : 'Working evidence is usable for review.',
  };
}

function buildRetentionSignals(retentionState = {}) {
  const due = retentionState.skillsDueForReview || [];
  const refresh = retentionState.skillsNeedingRefresh || [];
  const retained = retentionState.retainedSkillIds || [];
  return {
    retainedSkillIds: retained,
    skillsDueForReview: due,
    skillsNeedingRefresh: refresh,
    dueCount: due.length,
    riskCount: refresh.length,
    status: refresh.length ? 'needs_refresh' : due.length ? 'review_due' : retained.length ? 'stable' : 'building_data',
  };
}

function buildSupportFlags({ helpRequests = [], confidenceSignals = {}, workingEvidence = {}, mistakeRows = [], retentionSignals = {} }) {
  const flags = [];
  (helpRequests || []).forEach((help) => {
    flags.push({
      flagType: 'student_help_request',
      severity: toNum(help.count, 1) >= 3 ? 'high' : 'medium',
      studentId: help.studentId || '',
      skillId: help.skillId || '',
      title: 'Student requested help',
      detail: `${toNum(help.count, 1)} help request(s)${help.skillId ? ` in ${parentSkillLabel(help.skillId)}` : ''}.`,
      source: 'help_request',
      latestAt: help.latestAt || help.createdAt || null,
    });
  });
  if (confidenceSignals.mismatchCount >= 2) {
    flags.push({
      flagType: 'confidence_mismatch',
      severity: confidenceSignals.mismatchCount >= 5 ? 'high' : 'medium',
      title: 'Confidence mismatch',
      detail: 'Confidence and correctness are not aligned yet.',
      source: 'confidence',
    });
  }
  if (workingEvidence.supportFlag) {
    flags.push({
      flagType: 'working_evidence_needed',
      severity: workingEvidence.missingWorkingCount >= 3 ? 'high' : 'medium',
      title: 'Working evidence needs attention',
      detail: workingEvidence.adultMessage,
      source: 'working',
    });
  }
  if (retentionSignals.riskCount || retentionSignals.dueCount) {
    flags.push({
      flagType: retentionSignals.riskCount ? 'retention_risk' : 'retention_due',
      severity: retentionSignals.riskCount ? 'high' : 'medium',
      title: retentionSignals.riskCount ? 'Retention refresh needed' : 'Retention review due',
      detail: 'A short spaced review will help prevent forgetting.',
      source: 'retention',
    });
  }
  mistakeRows
    .filter((row) => severityRank(row.severity) >= 4 || row.frequency >= 3)
    .slice(0, 5)
    .forEach((row) => {
      flags.push({
        flagType: 'misconception_detected',
        severity: severityRank(row.severity) >= 5 ? 'critical' : 'high',
        studentId: row.studentId,
        skillId: row.remediationSkillIds[0] || row.rootCauseSkillIds[0] || '',
        title: row.mistakeName,
        detail: `${row.frequency} occurrence(s). Recommended support: ${parentSkillLabel(row.remediationSkillIds[0] || row.rootCauseSkillIds[0] || '')}.`,
        source: 'mistake_to_mastery',
        latestAt: row.latestAt,
      });
    });
  return flags.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function buildRecommendedActions({ masterySignals = {}, supportFlags = [], mistakeRows = [], retentionSignals = {}, workingEvidence = {} }) {
  const actions = [];
  mistakeRows.slice(0, 4).forEach((row) => {
    actions.push({
      actionId: `act_mistake_${row.mistakeCode}_${row.studentId || 'student'}`,
      actionType: 'start_intervention',
      audience: ['parent', 'tutor', 'teacher'],
      severity: row.severity,
      title: `Review ${row.mistakeName}`,
      description: `Focus on ${parentSkillLabel(row.remediationSkillIds[0] || row.rootCauseSkillIds[0] || masterySignals.currentSkillId)}.`,
      targetSkillIds: dedupe([...(row.remediationSkillIds || []), ...(row.rootCauseSkillIds || [])]).slice(0, 3),
      worksheetMapping: row.worksheetMappings?.[0] || null,
      weight: row.frequency,
    });
  });
  if (retentionSignals.dueCount || retentionSignals.riskCount) {
    actions.push({
      actionId: 'act_retention_review',
      actionType: 'assign_retention_review',
      audience: ['parent', 'tutor', 'teacher'],
      severity: retentionSignals.riskCount ? 'high' : 'medium',
      title: 'Run retention review',
      description: 'Use a short review to keep older skills secure.',
      targetSkillIds: dedupe([...retentionSignals.skillsDueForReview, ...retentionSignals.skillsNeedingRefresh]),
      weight: retentionSignals.riskCount + retentionSignals.dueCount,
    });
  }
  if (workingEvidence.supportFlag) {
    actions.push({
      actionId: 'act_review_working',
      actionType: 'review_working',
      audience: ['parent', 'tutor', 'teacher'],
      severity: 'medium',
      title: 'Review working evidence',
      description: workingEvidence.adultMessage,
      targetSkillIds: [],
      weight: 2,
    });
  }
  if (!actions.length && masterySignals.currentSkillId) {
    actions.push({
      actionId: 'act_continue_current_skill',
      actionType: 'continue_practice',
      audience: ['parent', 'tutor', 'teacher'],
      severity: 'low',
      title: 'Continue current practice',
      description: `Keep building ${parentSkillLabel(masterySignals.currentSkillId)}.`,
      targetSkillIds: [masterySignals.currentSkillId],
      weight: 1,
    });
  }
  supportFlags
    .filter((flag) => flag.flagType === 'student_help_request')
    .forEach((flag, index) => {
      actions.push({
        actionId: `act_help_${index + 1}`,
        actionType: 'respond_to_help_request',
        audience: ['parent', 'tutor', 'teacher'],
        severity: flag.severity,
        title: 'Respond to student help request',
        description: flag.detail,
        targetSkillIds: [flag.skillId].filter(Boolean),
        weight: 4,
      });
    });
  return actions.sort((a, b) => actionPriority(b) - actionPriority(a)).slice(0, 8);
}

function buildUpcomingActivities({ recommendedActions = [], retentionSignals = {} }) {
  return recommendedActions.slice(0, 5).map((action) => ({
    activityId: `upcoming_${action.actionId}`,
    type: action.actionType,
    label: action.title,
    targetSkillIds: action.targetSkillIds || [],
    due: action.actionType === 'assign_retention_review' ? 'this_week' : 'next_session',
  })).concat(
    (retentionSignals.skillsDueForReview || []).slice(0, 2).map((skillId) => ({
      activityId: `retention_${skillId}`,
      type: 'retention_review',
      label: `Review ${parentSkillLabel(skillId)}`,
      targetSkillIds: [skillId],
      due: 'this_week',
    }))
  );
}

function buildLearningTimeline(options = {}) {
  const events = [];
  (options.assessmentResults || []).forEach((row, index) => {
    events.push({
      eventId: `assessment_${index + 1}`,
      eventType: 'assessment',
      title: 'Assessment completed',
      detail: row.percentage !== undefined || row.latestScore !== undefined ? `Score: ${row.percentage ?? row.latestScore}%` : 'Assessment result recorded.',
      timestamp: row.timestamp || row.completedAt || row.createdAt || null,
    });
  });
  normaliseMistakeRows(options.mistakePlans || []).forEach((row, index) => {
    events.push({
      eventId: `mistake_${index + 1}`,
      eventType: 'mistake',
      title: row.mistakeName,
      detail: `${row.frequency} occurrence(s), ${row.severity} severity.`,
      timestamp: row.latestAt,
      skillIds: row.remediationSkillIds,
    });
  });
  (options.helpRequests || []).forEach((row, index) => {
    events.push({
      eventId: `help_${index + 1}`,
      eventType: 'support_request',
      title: 'Help requested',
      detail: row.skillId ? `Help requested in ${parentSkillLabel(row.skillId)}.` : 'Student requested help.',
      timestamp: row.latestAt || row.createdAt || null,
      skillIds: [row.skillId].filter(Boolean),
    });
  });
  (options.workingSessions || []).forEach((row, index) => {
    events.push({
      eventId: `working_${index + 1}`,
      eventType: 'working_evidence',
      title: 'Working submitted',
      detail: row.analysisSummary || row.status || 'Working evidence recorded.',
      timestamp: row.submittedAt || row.submissionTimestamp || row.createdAt || null,
      skillIds: row.skillIds || [],
    });
  });
  return events
    .map((event) => ({ ...event, timestamp: event.timestamp || latestDate(new Date()) }))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 30);
}

function buildAdultAlerts({ supportFlags = [], recommendedActions = [] }) {
  const alerts = supportFlags.map((flag, index) => ({
    alertId: `alert_${flag.flagType}_${index + 1}`,
    alertType: flag.flagType,
    severity: flag.severity,
    title: flag.title,
    message: flag.detail,
    source: flag.source,
    createdAt: flag.latestAt || new Date().toISOString(),
    actionType: recommendedActions.find((action) => (action.targetSkillIds || []).includes(flag.skillId))?.actionType || '',
    dismissed: false,
  }));
  if (!alerts.length && recommendedActions.some((action) => action.actionType === 'continue_practice')) {
    alerts.push({
      alertId: 'alert_mastery_momentum',
      alertType: 'mastery_milestone',
      severity: 'low',
      title: 'Learning is on track',
      message: 'Continue the current practice plan.',
      source: 'adult_intelligence',
      createdAt: new Date().toISOString(),
      actionType: 'continue_practice',
      dismissed: false,
    });
  }
  return alerts.slice(0, 10);
}

export function buildClassGroupingSuggestions(options = {}) {
  const {
    studentProgressStates = [],
    mistakePlans = [],
    fluencyStates = [],
    retentionStates = [],
  } = options;
  const states = Array.isArray(studentProgressStates) ? studentProgressStates : [];
  const groups = new Map();
  const add = (key, label, studentId, reason, skillId = '', category = '') => {
    if (!studentId) return;
    if (!groups.has(key)) {
      groups.set(key, {
        groupId: `adult_group_${key}`,
        groupName: label,
        category,
        focusSkillId: skillId,
        studentIds: [],
        reasons: [],
        recommendedActivity: '',
      });
    }
    const row = groups.get(key);
    row.studentIds.push(studentId);
    row.reasons.push(reason);
  };

  states.forEach((state) => {
    const sid = state.studentId;
    Object.entries(state.skillStatuses || {}).forEach(([skillId, status]) => {
      if (['needsReview', 'weak', 'forgotten'].includes(String(status))) {
        add(`skill_${skillId}`, `${parentSkillLabel(skillId)} Support`, sid, `${parentSkillLabel(skillId)} needs review.`, skillId, 'skill_mastery');
      }
    });
  });
  normaliseMistakeRows(mistakePlans).forEach((row) => {
    add(`mistake_${row.category}`, row.category === 'question_misread' ? 'Word Problem Reasoning' : `${row.mistakeName} Group`, row.studentId, row.mistakeName, row.remediationSkillIds[0], row.category);
  });
  fluencyStates.forEach((state) => {
    const sid = state.studentId;
    (state.questionFamilyResults || state.fluencyState?.questionFamilyResults || []).forEach((row) => {
      if (row.status === 'accurateButSlow') add('fluency_deficits', 'Fluency Deficits', sid, `${parentSkillLabel(row.skillId)} is accurate but slow.`, row.skillId, 'fluency_deficit');
    });
  });
  retentionStates.forEach((state) => {
    const sid = state.studentId;
    (state.skillsNeedingRefresh || state.retentionProgress?.skillsNeedingRefresh || []).forEach((skillId) => {
      add('retention_review', 'Retention Review', sid, `${parentSkillLabel(skillId)} needs refresh.`, skillId, 'retention');
    });
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      studentIds: dedupe(group.studentIds),
      reasons: dedupe(group.reasons).slice(0, 3),
      recommendedActivity:
        group.category === 'fluency_deficit'
          ? 'Short timed fluency drill'
          : group.category === 'retention'
            ? 'Spaced review set with exit check'
            : group.category === 'question_misread'
              ? 'Model word-problem reading and bar model setup'
              : 'Reteach concept, guided practice, independent check',
    }))
    .filter((group) => group.studentIds.length > 0)
    .sort((a, b) => b.studentIds.length - a.studentIds.length)
    .slice(0, 8);
}

function buildReportFoundation({ model = {}, audience = 'parent' }) {
  const sections = audience === 'teacher'
    ? ['Class overview', 'Skill coverage', 'Misconception clusters', 'Groups', 'Assignments', 'Next actions']
    : audience === 'tutor'
      ? ['Current need', 'Root cause', 'Intervention plan', 'Working evidence', 'Next session plan']
      : ['Overall progress', 'Current focus', 'Recent progress', 'Actions', 'Working evidence'];
  return {
    reportType: `${audience}_mathpath_summary`,
    printable: true,
    pdfReady: true,
    generatedAt: model.generatedAt,
    sections,
    exportPayload: {
      studentId: model.studentId || null,
      classId: model.classId || null,
      overallStatus: model.overallStatus || model.classStatus || 'building_data',
      recommendedActions: model.recommendedActions || [],
      alerts: model.alerts || [],
    },
  };
}

export function buildUnifiedAdultIntelligenceModel(options = {}) {
  const {
    studentId = '',
    classId = '',
    audience = 'parent',
    studentProgressState = {},
    diagnosticResult = {},
    practiceState = {},
    fluencyState = {},
    retentionState = {},
    assessmentResults = [],
    mistakePlans = [],
    workingAnalysisSummary = {},
    workingSessions = [],
    attempts = [],
    helpRequests = [],
  } = options;

  const masterySignals = buildMasterySignals({ studentProgressState, diagnosticResult, practiceState });
  const mistakeRows = normaliseMistakeRows(mistakePlans);
  const confidenceSignals = buildConfidenceSignals({ attempts, diagnosticResult, fluencyState });
  const fluencySignals = buildFluencySignals(fluencyState);
  const workingEvidence = buildWorkingEvidenceSignals(workingAnalysisSummary);
  const retentionSignals = buildRetentionSignals(retentionState);
  const supportFlags = buildSupportFlags({ helpRequests, confidenceSignals, workingEvidence, mistakeRows, retentionSignals });
  const recommendedActions = buildRecommendedActions({ masterySignals, supportFlags, mistakeRows, retentionSignals, workingEvidence });
  const upcomingActivities = buildUpcomingActivities({ recommendedActions, retentionSignals });
  const timeline = buildLearningTimeline({ assessmentResults, mistakePlans, helpRequests, workingSessions });
  const alerts = buildAdultAlerts({ supportFlags, recommendedActions });

  const model = {
    intelligenceModelVersion: 'adult-intelligence-v1',
    generatedAt: new Date().toISOString(),
    audience,
    studentId,
    classId,
    domainId: 'fractions',
    overallStatus: supportFlags.some((flag) => severityRank(flag.severity) >= 4)
      ? 'needs_attention'
      : masterySignals.masteryPercentage >= 70
        ? 'on_track'
        : masterySignals.weakSkillIds.length
          ? 'needs_support'
          : 'building_data',
    whatIsHappening: masterySignals.currentFocusSkills.length
      ? `Current focus: ${masterySignals.currentFocusSkills.map(parentSkillLabel).join(', ')}.`
      : 'Learning data is still building.',
    whyItIsHappening: mistakeRows[0]
      ? `${mistakeRows[0].mistakeName} is affecting ${parentSkillLabel(mistakeRows[0].remediationSkillIds[0] || mistakeRows[0].rootCauseSkillIds[0])}.`
      : supportFlags[0]?.detail || 'No major root-cause pattern is currently flagged.',
    whatShouldHappenNext: recommendedActions[0]?.title || 'Continue current practice.',
    masterySignals,
    rootCauses: dedupe(mistakeRows.flatMap((row) => row.rootCauseSkillIds)).map((skillId) => ({ skillId, label: parentSkillLabel(skillId) })),
    misconceptions: mistakeRows,
    confidenceSignals,
    fluencySignals,
    workingEvidence,
    interventions: mistakeRows.flatMap((row) => row.interventionPathways || []),
    retentionSignals,
    supportFlags,
    recommendedActions,
    upcomingActivities,
    alerts,
    timeline,
    parentTrainingRecommendations: [
      { moduleId: 'parent_fractions_help', title: 'Helping with fractions', optional: true },
      { moduleId: 'parent_word_problems', title: 'Helping with word problems', optional: true },
      { moduleId: 'parent_revision_support', title: 'Supporting revision', optional: true },
      { moduleId: 'parent_growth_mindset', title: 'Growth mindset', optional: true },
    ],
  };

  return {
    ...model,
    reportFoundation: buildReportFoundation({ model, audience }),
  };
}

export function buildAdultActionCentre(model = {}) {
  return {
    actions: (model.recommendedActions || []).map((action) => ({
      ...action,
      canPrintWorksheet: Boolean(action.worksheetMapping || action.actionType.includes('worksheet')),
      canAssignActivity: ['assign_retention_review', 'start_intervention', 'continue_practice'].includes(action.actionType),
      canMarkDiscussionCompleted: ['respond_to_help_request', 'review_working'].includes(action.actionType),
    })),
  };
}

export function buildTutorInterventionQueue(models = []) {
  return (models || [])
    .flatMap((model) => (model.supportFlags || []).map((flag) => ({
      studentId: model.studentId,
      flagType: flag.flagType,
      severity: flag.severity,
      title: flag.title,
      nextAction: model.recommendedActions?.[0]?.title || '',
    })))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

export function validateAdultIntelligenceEngine() {
  const model = buildUnifiedAdultIntelligenceModel({
    studentId: 'adult_student_1',
    audience: 'parent',
    diagnosticResult: { weakSkillIds: ['F010'], masteredSkillIds: ['F001'], confidenceCalibration: 'needs_calibration' },
    practiceState: { currentSkillId: 'F010', weakSkillIds: ['F010', 'F018'], masteredSkillIds: ['F001', 'F002'] },
    fluencyState: {
      questionFamilyResults: [
        { skillId: 'F018', questionFamilyId: 'QF_F018_001', status: 'accurateButSlow', accuracy: 90, averageTime: 28, benchmarkTime: 18 },
      ],
    },
    retentionState: { retainedSkillIds: ['F001'], skillsDueForReview: ['F003'], skillsNeedingRefresh: ['F010'] },
    mistakePlans: [{
      studentId: 'adult_student_1',
      focusMistakes: [{ mistakeCode: 'M001', count: 3, highestSeverityLevel: 'major' }],
      rootCauseSkillIds: ['F010'],
      interventionPathways: [{ pathway_id: 'PATH_FRA_M001_major' }],
      worksheetMappings: [{ worksheet_id: 'WS_FRA_M001' }],
    }],
    workingAnalysisSummary: { averageWorkingQuality: 58, missingWorkingCount: 2 },
    helpRequests: [{ studentId: 'adult_student_1', skillId: 'F010', count: 2, latestAt: '2026-01-01T00:00:00.000Z' }],
    assessmentResults: [{ percentage: 62, createdAt: '2026-01-01T00:00:00.000Z' }],
    workingSessions: [{ status: 'submitted', skillIds: ['F010'], submittedAt: '2026-01-02T00:00:00.000Z' }],
  });
  const actionCentre = buildAdultActionCentre(model);
  const groups = buildClassGroupingSuggestions({
    studentProgressStates: [{ studentId: 's1', skillStatuses: { F010: 'weak' } }],
    mistakePlans: [{ studentId: 's1', focusMistakes: [{ mistakeCode: 'M001', count: 2 }], rootCauseSkillIds: ['F010'] }],
    fluencyStates: [{ studentId: 's1', questionFamilyResults: [{ skillId: 'F018', status: 'accurateButSlow' }] }],
    retentionStates: [{ studentId: 's1', skillsNeedingRefresh: ['F010'] }],
  });
  const queue = buildTutorInterventionQueue([model]);

  return {
    isValid:
      Boolean(model.whatIsHappening && model.whyItIsHappening && model.whatShouldHappenNext) &&
      model.supportFlags.length > 0 &&
      model.alerts.length > 0 &&
      model.timeline.length > 0 &&
      model.reportFoundation.pdfReady === true &&
      actionCentre.actions.length > 0 &&
      groups.length > 0 &&
      queue.length > 0,
    checks: {
      answersAdultQuestions: Boolean(model.whatIsHappening && model.whyItIsHappening && model.whatShouldHappenNext),
      supportFlagsBuilt: model.supportFlags.length > 0,
      alertsBuilt: model.alerts.length > 0,
      timelineBuilt: model.timeline.length > 0,
      reportingFoundationBuilt: model.reportFoundation.pdfReady === true,
      actionCentreBuilt: actionCentre.actions.length > 0,
      groupingSuggestionsBuilt: groups.length > 0,
      tutorQueueBuilt: queue.length > 0,
    },
    sample: { model, actionCentre, groups, queue },
  };
}

export const adultIntelligenceEngine = {
  buildUnifiedAdultIntelligenceModel,
  buildAdultActionCentre,
  buildClassGroupingSuggestions,
  buildTutorInterventionQueue,
  validateAdultIntelligenceEngine,
};

export default adultIntelligenceEngine;
