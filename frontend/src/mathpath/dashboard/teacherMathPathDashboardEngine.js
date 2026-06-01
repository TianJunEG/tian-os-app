import { fractionSkillGraph, getSkill } from '../fractions/fractionSkillGraph.js';
import { getFractionMistakeTaxonomy } from '../fractions/fractionMistakeToMasteryEngine.js';
import {
  buildClassGroupingSuggestions,
  buildUnifiedAdultIntelligenceModel,
} from './adultIntelligenceEngine.js';

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dedupe(arr = []) {
  return [...new Set(arr)];
}

function skillName(skillId) {
  const skill = getSkill(skillId);
  return skill ? `${skill.id} ${skill.name}` : skillId;
}

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, n) => sum + toNum(n, 0), 0) / values.length;
}

function getStudentId(state = {}, fallback = '') {
  return state.studentId || fallback;
}

function getReadinessBand(state = {}, assessmentByStudent = {}) {
  const band = state?.readinessLevel?.readinessBand;
  if (band) return band;
  return assessmentByStudent?.[getStudentId(state)]?.readinessBand || 'developing';
}

function normalizeReadinessBand(band) {
  const raw = String(band || '').toLowerCase();
  if (raw === 'advanced' || raw === 'strong') return 'strong';
  if (raw === 'ready') return 'ready';
  if (raw === 'progressing' || raw === 'ontrack' || raw === 'on_track') return 'approaching';
  if (raw === 'developing') return 'developing';
  return 'notReady';
}

function assessmentByStudent(assessmentResults = []) {
  const map = {};
  (assessmentResults || []).forEach((row) => {
    const sid = row.studentId;
    if (!sid) return;
    map[sid] = {
      latestScore: toNum(row.latestScore, toNum(row.percentage, 0)),
      readinessBand: normalizeReadinessBand(row.readinessBand || row?.readinessScore?.readinessBand),
      weakSkills: row.weakSkillsAcrossClass || row.weakSkills || [],
    };
  });
  return map;
}

function mistakeRowsWithStudent(mistakePlans = []) {
  const rows = [];
  (mistakePlans || []).forEach((item) => {
    const studentId = item.studentId || item.sid || item.ownerStudentId || null;
    const focus = item.focusMistakes || [];
    focus.forEach((m) => rows.push({ studentId, ...m, rootCauseSkillIds: item.rootCauseSkillIds || [] }));
  });
  return rows;
}

export function buildClassOverview(studentProgressStates = []) {
  const states = Array.isArray(studentProgressStates) ? studentProgressStates : [];
  const totalStudents = states.length;
  const mastery = states.map((s) => toNum(s.masteryProgress?.percentageMastered, 0));
  const fluency = states.map((s) => toNum(s.masteryProgress?.percentageFluent, 0));
  const retention = states.map((s) => toNum(s.masteryProgress?.percentageRetained, 0));
  const readiness = states.map((s) => toNum(s.readinessLevel?.readinessScore, 0));

  const bandFor = (s) => String(s.readinessLevel?.readinessBand || 'developing').toLowerCase();
  const studentsNeedingSupport = states.filter((s) => ['beginner', 'developing'].includes(bandFor(s))).length;
  const studentsReadyForExtension = states.filter((s) => ['ready', 'advanced'].includes(bandFor(s))).length;
  const studentsOnTrack = Math.max(0, totalStudents - studentsNeedingSupport);

  return {
    totalStudents,
    studentsOnTrack,
    studentsNeedingSupport,
    studentsReadyForExtension,
    averageMastery: Math.round(average(mastery) * 10) / 10,
    averageFluency: Math.round(average(fluency) * 10) / 10,
    averageRetention: Math.round(average(retention) * 10) / 10,
    averageReadiness: Math.round(average(readiness) * 10) / 10,
  };
}

export function buildSkillMasteryHeatmap(options = {}) {
  const { skillGraph = fractionSkillGraph, studentProgressStates = [] } = options;
  const states = Array.isArray(studentProgressStates) ? studentProgressStates : [];
  const total = Math.max(states.length, 1);

  return (skillGraph.skillIds || []).map((skillId) => {
    const skill = getSkill(skillId);
    let masteredCount = 0;
    let fluentCount = 0;
    let retainedCount = 0;
    let weakCount = 0;
    let notStartedCount = 0;

    states.forEach((s) => {
      const status = String(s.skillStatuses?.[skillId] || 'notStarted');
      if (['accurate', 'fluent', 'retained'].includes(status)) masteredCount += 1;
      if (['fluent', 'retained'].includes(status)) fluentCount += 1;
      if (status === 'retained') retainedCount += 1;
      if (['needsReview', 'weak', 'forgotten'].includes(status)) weakCount += 1;
      if (status === 'notStarted') notStartedCount += 1;
    });

    return {
      skillId,
      skillName: `${skillId} ${skill?.name || skillId}`,
      masteredCount,
      fluentCount,
      retainedCount,
      weakCount,
      notStartedCount,
      classMasteryPercentage: Math.round((masteredCount / total) * 1000) / 10,
      classFluencyPercentage: Math.round((fluentCount / total) * 1000) / 10,
    };
  });
}

export function buildClassFluencyBottlenecks(fluencyStates = []) {
  const states = Array.isArray(fluencyStates) ? fluencyStates : [];
  const grouped = new Map();

  states.forEach((state) => {
    const sid = getStudentId(state);
    const qfRows = state?.fluencyState?.questionFamilyResults || state?.questionFamilyResults || [];
    qfRows.forEach((row) => {
      const issueType =
        row.status === 'accurateButSlow' ? 'accurateButSlow'
          : toNum(row.accuracy, 0) < 75 && toNum(row.averageTime, 0) <= toNum(row.benchmarkTime, Number.MAX_SAFE_INTEGER) ? 'fastButInaccurate'
            : toNum(row.consistencyScore, 100) < 60 ? 'inconsistent'
              : toNum(row.attemptsCount, 0) < 5 ? 'insufficientAttempts'
                : null;
      if (!issueType) return;
      const key = `${row.skillId}:${issueType}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          skillId: row.skillId,
          skillName: skillName(row.skillId),
          issueType,
          affectedStudentIds: [],
          averageTime: [],
          benchmarkTime: [],
        });
      }
      const g = grouped.get(key);
      g.affectedStudentIds.push(sid);
      if (row.averageTime !== null && row.averageTime !== undefined) g.averageTime.push(toNum(row.averageTime));
      if (row.benchmarkTime !== null && row.benchmarkTime !== undefined) g.benchmarkTime.push(toNum(row.benchmarkTime));
    });
  });

  return [...grouped.values()].map((g) => ({
    skillId: g.skillId,
    skillName: g.skillName,
    issueType: g.issueType,
    affectedStudentIds: dedupe(g.affectedStudentIds).filter(Boolean),
    averageTime: Math.round(average(g.averageTime) * 10) / 10,
    benchmarkTime: Math.round(average(g.benchmarkTime) * 10) / 10,
    recommendation:
      g.issueType === 'accurateButSlow'
        ? `Assign a short fluency drill for ${g.skillName}.`
        : g.issueType === 'fastButInaccurate'
          ? `Run a mini-lesson and targeted practice for ${g.skillName}.`
          : g.issueType === 'inconsistent'
            ? `Use mixed guided and independent practice for ${g.skillName}.`
            : `Collect additional attempts for ${g.skillName} before deciding intervention.`,
  }));
}

export function buildClassRetentionRisks(retentionStates = []) {
  const states = Array.isArray(retentionStates) ? retentionStates : [];
  const rows = new Map();

  states.forEach((state) => {
    const sid = getStudentId(state);
    const due = state?.retentionProgress?.skillsDueForReview || state?.skillsDueForReview || [];
    const atRisk = state?.retentionProgress?.skillsNeedingRefresh || state?.skillsNeedingRefresh || [];
    const forgotten = state?.forgottenSkills || [];
    dedupe([...due, ...atRisk, ...forgotten]).forEach((skillId) => {
      if (!rows.has(skillId)) rows.set(skillId, { due: [], risk: [], forgotten: [] });
      const cell = rows.get(skillId);
      if (due.includes(skillId)) cell.due.push(sid);
      if (atRisk.includes(skillId)) cell.risk.push(sid);
      if (forgotten.includes(skillId)) cell.forgotten.push(sid);
    });
  });

  return [...rows.entries()].map(([skillId, v]) => ({
    skillId,
    skillName: skillName(skillId),
    studentsDueForReview: dedupe(v.due).filter(Boolean),
    studentsAtRisk: dedupe(v.risk).filter(Boolean),
    studentsForgotten: dedupe(v.forgotten).filter(Boolean),
    recommendation:
      v.forgotten.length
        ? `Schedule immediate retention review for ${skillName(skillId)}.`
        : v.risk.length
          ? `Assign targeted refresh practice for ${skillName(skillId)}.`
          : `Run short spaced-review practice for ${skillName(skillId)}.`,
  }));
}

export function buildClassAssessmentReadiness(assessmentResults = []) {
  const rows = Array.isArray(assessmentResults) ? assessmentResults : [];
  const distribution = { notReady: 0, developing: 0, approaching: 0, ready: 0, strong: 0 };
  const weakSkills = [];
  const strongStudents = [];
  const developingStudents = [];
  const studentsNeedingSupport = [];
  const scores = [];

  rows.forEach((row) => {
    const sid = row.studentId;
    const score = toNum(row.latestScore, toNum(row.percentage, 0));
    const band = normalizeReadinessBand(row.readinessBand || row?.readinessScore?.readinessBand);
    distribution[band] += 1;
    scores.push(score);
    if (band === 'strong' || band === 'ready') strongStudents.push(sid);
    if (band === 'developing' || band === 'approaching') developingStudents.push(sid);
    if (band === 'notReady') studentsNeedingSupport.push(sid);
    (row.weakSkillsAcrossClass || row.weakSkills || []).forEach((s) => weakSkills.push(s));
  });

  return {
    latestAssessmentAverage: Math.round(average(scores) * 10) / 10,
    readinessDistribution: distribution,
    strongStudents: dedupe(strongStudents).filter(Boolean),
    developingStudents: dedupe(developingStudents).filter(Boolean),
    studentsNeedingSupport: dedupe(studentsNeedingSupport).filter(Boolean),
    weakSkillsAcrossClass: dedupe(weakSkills),
  };
}

export function buildCommonMistakePatterns(mistakePlans = []) {
  const taxonomy = new Map(getFractionMistakeTaxonomy().map((t) => [t.code, t]));
  const rows = new Map();
  mistakeRowsWithStudent(mistakePlans).forEach((m) => {
    const code = m.mistakeCode || m.suspectedMistakeCode;
    if (!code) return;
    if (!rows.has(code)) {
      rows.set(code, { students: [], skills: [], severity: 'low', frequency: 0 });
    }
    const r = rows.get(code);
    r.students.push(m.studentId);
    r.frequency += toNum(m.count, 1);
    (m.rootCauseSkillIds || []).forEach((s) => r.skills.push(s));
    if ((m.highestSeverity || m.severity) === 'high') r.severity = 'high';
    else if (((m.highestSeverity || m.severity) === 'medium') && r.severity !== 'high') r.severity = 'medium';
  });

  return [...rows.entries()].map(([mistakeCode, row]) => {
    const tax = taxonomy.get(mistakeCode);
    const affectedStudentIds = dedupe(row.students).filter(Boolean);
    const affectedSkills = dedupe(row.skills);
    return {
      mistakeCode,
      mistakeName: tax?.title || mistakeCode,
      affectedStudentCount: affectedStudentIds.length,
      affectedStudentIds,
      affectedSkills,
      severity: row.severity,
      recommendedClassIntervention:
        row.severity === 'high'
          ? `Run a focused mini-lesson on ${tax?.title || mistakeCode} and assign remediation practice.`
          : `Monitor and reinforce with short practice on ${tax?.title || mistakeCode}.`,
    };
  });
}

export function buildWorkingQualityOverview(workingAnalysisSummaries = []) {
  const rows = Array.isArray(workingAnalysisSummaries) ? workingAnalysisSummaries : [];
  const qualityScores = [];
  const studentsMissingWorking = [];
  const studentsWithUnreadableWorking = [];
  const issues = [];

  rows.forEach((row) => {
    const sid = row.studentId;
    const score = row.averageWorkingQuality ?? row.workingQualityScore?.finalScore;
    if (score !== null && score !== undefined) qualityScores.push(toNum(score));
    if (toNum(row.missingWorkingCount, 0) > 0 || (row.missingWorkingQuestions || []).length) {
      studentsMissingWorking.push(sid);
      issues.push('missingWorking');
    }
    if ((row.unreadableWorkingQuestions || []).length || (row.calculatorIntegrityFlags || []).some((f) => f.flagType === 'unreadableWorking')) {
      studentsWithUnreadableWorking.push(sid);
      issues.push('unreadableWorking');
    }
  });

  const avg = Math.round(average(qualityScores) * 10) / 10;
  return {
    averageWorkingQuality: avg,
    studentsMissingWorking: dedupe(studentsMissingWorking).filter(Boolean),
    studentsWithUnreadableWorking: dedupe(studentsWithUnreadableWorking).filter(Boolean),
    commonWorkingIssues: dedupe(issues),
    recommendation:
      studentsMissingWorking.length
        ? 'Remind students to upload working after sessions and model clear step-by-step layout.'
        : studentsWithUnreadableWorking.length
          ? 'Coach students on clearer written steps and consistent working structure.'
          : 'Working quality is generally stable across the class.',
  };
}

export function buildInterventionGroups(options = {}) {
  const {
    studentProgressStates = [],
    skillMasteryHeatmap = [],
    fluencyBottlenecks = [],
    retentionRisks = [],
    assessmentReadiness = {},
  } = options;
  const states = Array.isArray(studentProgressStates) ? studentProgressStates : [];

  const groups = [];
  const total = Math.max(states.length, 1);
  const weakSkill = [...skillMasteryHeatmap]
    .sort((a, b) => (b.weakCount - a.weakCount) || (a.classMasteryPercentage - b.classMasteryPercentage))[0];
  if (weakSkill && weakSkill.weakCount > 0) {
    const studentIds = states
      .filter((s) => ['needsReview', 'weak', 'forgotten'].includes(String(s.skillStatuses?.[weakSkill.skillId] || '')))
      .map((s) => s.studentId)
      .filter(Boolean);
    groups.push({
      groupId: `grp_support_${weakSkill.skillId.toLowerCase()}`,
      groupName: `${weakSkill.skillName.replace(/^F\d{3}\s*/, '')} Support Group`,
      focusSkillId: weakSkill.skillId,
      focusSkillName: weakSkill.skillName,
      studentIds,
      reason: `${weakSkill.weakCount}/${total} students need support in ${weakSkill.skillName}.`,
      recommendedActivity: 'Short reteach + guided practice cycle',
      estimatedDurationMinutes: 25,
    });
  }

  const slow = fluencyBottlenecks.filter((b) => b.issueType === 'accurateButSlow');
  if (slow.length) {
    groups.push({
      groupId: 'grp_fluency_slow',
      groupName: 'Accurate But Slow Group',
      focusSkillId: slow[0].skillId,
      focusSkillName: slow[0].skillName,
      studentIds: dedupe(slow.flatMap((b) => b.affectedStudentIds)).filter(Boolean),
      reason: 'Students are accurate but require speed and consistency building.',
      recommendedActivity: 'Timed fluency drill with immediate feedback',
      estimatedDurationMinutes: 15,
    });
  }

  const retention = retentionRisks.filter((r) => r.studentsAtRisk.length || r.studentsForgotten.length);
  if (retention.length) {
    groups.push({
      groupId: 'grp_retention_review',
      groupName: 'Retention Review Group',
      focusSkillId: retention[0].skillId,
      focusSkillName: retention[0].skillName,
      studentIds: dedupe(retention.flatMap((r) => [...r.studentsAtRisk, ...r.studentsForgotten])).filter(Boolean),
      reason: 'Students need spaced review to stabilise previously learned skills.',
      recommendedActivity: 'Targeted review set + quick exit check',
      estimatedDurationMinutes: 20,
    });
  }

  if ((assessmentReadiness.strongStudents || []).length) {
    groups.push({
      groupId: 'grp_extension',
      groupName: 'Extension Group',
      focusSkillId: 'F026',
      focusSkillName: skillName('F026'),
      studentIds: assessmentReadiness.strongStudents,
      reason: 'Students are ready for challenge-level fraction applications.',
      recommendedActivity: 'Challenge problems and advanced applications',
      estimatedDurationMinutes: 20,
    });
  }

  return groups;
}

export function buildRecommendedTeacherActions(options = {}) {
  const {
    classOverview = {},
    interventionGroups = [],
    fluencyBottlenecks = [],
    retentionRisks = [],
    assessmentReadiness = {},
    commonMistakePatterns = [],
    workingQualityOverview = {},
  } = options;

  const actions = [];
  interventionGroups.forEach((g) => {
    actions.push({
      priority: 0,
      actionType: 'formInterventionGroup',
      title: `Run ${g.groupName}`,
      description: g.reason,
      targetStudentIds: g.studentIds,
      targetSkillIds: [g.focusSkillId],
      estimatedDurationMinutes: g.estimatedDurationMinutes,
    });
  });

  if (fluencyBottlenecks.some((b) => b.issueType === 'accurateButSlow')) {
    const target = fluencyBottlenecks.filter((b) => b.issueType === 'accurateButSlow');
    actions.push({
      priority: 0,
      actionType: 'assignFluencyDrill',
      title: 'Assign short class fluency drill',
      description: `${target.length} fluency bottleneck(s) are accurate but slow.`,
      targetStudentIds: dedupe(target.flatMap((b) => b.affectedStudentIds)),
      targetSkillIds: dedupe(target.map((b) => b.skillId)),
      estimatedDurationMinutes: 15,
    });
  }

  const retentionTarget = retentionRisks.filter((r) => r.studentsAtRisk.length || r.studentsForgotten.length);
  if (retentionTarget.length) {
    actions.push({
      priority: 0,
      actionType: 'assignRetentionReview',
      title: 'Schedule retention review cycle',
      description: 'Several students have skills at risk or forgotten status.',
      targetStudentIds: dedupe(retentionTarget.flatMap((r) => [...r.studentsAtRisk, ...r.studentsForgotten])),
      targetSkillIds: dedupe(retentionTarget.map((r) => r.skillId)),
      estimatedDurationMinutes: 20,
    });
  }

  const severeMistake = commonMistakePatterns.find((m) => m.severity === 'high');
  if (severeMistake) {
    actions.push({
      priority: 0,
      actionType: 'runMiniLesson',
      title: `Mini-lesson on ${severeMistake.mistakeName}`,
      description: severeMistake.recommendedClassIntervention,
      targetStudentIds: severeMistake.affectedStudentIds,
      targetSkillIds: severeMistake.affectedSkills,
      estimatedDurationMinutes: 20,
    });
  }

  if ((workingQualityOverview.studentsMissingWorking || []).length) {
    actions.push({
      priority: 0,
      actionType: 'reviewWorking',
      title: 'Reinforce working submission routine',
      description: 'Some students are missing required working uploads.',
      targetStudentIds: workingQualityOverview.studentsMissingWorking,
      targetSkillIds: [],
      estimatedDurationMinutes: 10,
    });
  }

  if ((assessmentReadiness.studentsNeedingSupport || []).length) {
    actions.push({
      priority: 0,
      actionType: 'assignPractice',
      title: 'Assign targeted remediation set',
      description: 'Support students with lower assessment readiness bands.',
      targetStudentIds: assessmentReadiness.studentsNeedingSupport,
      targetSkillIds: assessmentReadiness.weakSkillsAcrossClass || [],
      estimatedDurationMinutes: 25,
    });
  } else if ((assessmentReadiness.strongStudents || []).length >= Math.ceil(toNum(classOverview.totalStudents, 0) * 0.4)) {
    actions.push({
      priority: 0,
      actionType: 'assignAssessment',
      title: 'Assign class progress assessment',
      description: 'A substantial portion of the class is ready for progress checking.',
      targetStudentIds: assessmentReadiness.strongStudents,
      targetSkillIds: [],
      estimatedDurationMinutes: 30,
    });
  }

  const priorityByType = {
    formInterventionGroup: 1,
    runMiniLesson: 2,
    assignPractice: 3,
    assignFluencyDrill: 4,
    assignRetentionReview: 5,
    reviewWorking: 6,
    assignAssessment: 7,
  };
  return actions
    .map((a) => ({ ...a, priority: priorityByType[a.actionType] || 9 }))
    .sort((a, b) => a.priority - b.priority);
}

export function buildTeacherMathPathDashboard(options = {}) {
  const {
    teacherId,
    classId,
    domainId = 'fractions',
    studentProgressStates = [],
    assessmentResults = [],
    mistakePlans = [],
    workingAnalysisSummaries = [],
    helpRequests = [],
  } = options;

  const states = Array.isArray(studentProgressStates) ? studentProgressStates : [];
  const classOverview = buildClassOverview(states);
  const skillMasteryHeatmap = buildSkillMasteryHeatmap({ skillGraph: fractionSkillGraph, studentProgressStates: states });
  const fluencyBottlenecks = buildClassFluencyBottlenecks(states);
  const retentionRisks = buildClassRetentionRisks(states);
  const assessmentReadiness = buildClassAssessmentReadiness(assessmentResults);
  const commonMistakePatterns = buildCommonMistakePatterns(mistakePlans);
  const workingQualityOverview = buildWorkingQualityOverview(workingAnalysisSummaries);
  const interventionGroups = buildInterventionGroups({
    studentProgressStates: states,
    skillMasteryHeatmap,
    fluencyBottlenecks,
    retentionRisks,
    assessmentReadiness,
  });
  const recommendedTeacherActions = buildRecommendedTeacherActions({
    classOverview,
    interventionGroups,
    fluencyBottlenecks,
    retentionRisks,
    assessmentReadiness,
    commonMistakePatterns,
    workingQualityOverview,
  });
  const adultGroupingSuggestions = buildClassGroupingSuggestions({
    studentProgressStates: states,
    mistakePlans,
    fluencyStates: states,
    retentionStates: states,
  });
  const adultIntelligence = buildUnifiedAdultIntelligenceModel({
    classId,
    audience: 'teacher',
    mistakePlans,
    helpRequests,
    assessmentResults,
    workingAnalysisSummary: workingQualityOverview,
  });

  return {
    teacherId,
    classId,
    domainId,
    classOverview,
    skillMasteryHeatmap,
    interventionGroups,
    fluencyBottlenecks,
    retentionRisks,
    assessmentReadiness,
    commonMistakePatterns,
    workingQualityOverview,
    recommendedTeacherActions,
    classGroupingEngine: adultGroupingSuggestions,
    teacherInterventionView: {
      commonMisconceptions: commonMistakePatterns,
      recommendedReteachingTopics: commonMistakePatterns.slice(0, 5).map((row) => row.mistakeName),
      remediationGroups: adultGroupingSuggestions,
      worksheetPacks: commonMistakePatterns.slice(0, 5).map((row) => ({
        packId: `teacher_ws_${row.mistakeCode}`,
        title: `${row.mistakeName} worksheet pack`,
        targetSkillIds: row.affectedSkills,
      })),
    },
    teacherAssignmentCentre: {
      supportedAssignmentTypes: ['practice', 'worksheet', 'lifelab_activity', 'sciencepath_future', 'englishpath_future'],
      foundationsReady: true,
      primaryActions: recommendedTeacherActions,
    },
    adultIntelligence,
  };
}

export function validateTeacherMathPathDashboardEngine() {
  const studentProgressStates = [
    {
      studentId: 's1',
      skillStatuses: { F010: 'needsReview', F018: 'needsReview', F001: 'retained', F026: 'notStarted' },
      masteryProgress: { percentageMastered: 42, percentageFluent: 28, percentageRetained: 12 },
      readinessLevel: { readinessScore: 48, readinessBand: 'developing' },
      fluencyState: {
        questionFamilyResults: [
          { skillId: 'F020', questionFamilyId: 'QF_F020_001', status: 'accurateButSlow', accuracy: 91, averageTime: 26, benchmarkTime: 18, consistencyScore: 66, attemptsCount: 6 },
        ],
      },
      retentionProgress: { skillsDueForReview: ['F003'], skillsNeedingRefresh: ['F010'], retainedSkillIds: ['F001'] },
    },
    {
      studentId: 's2',
      skillStatuses: { F010: 'accurate', F018: 'learning', F001: 'retained', F026: 'notStarted' },
      masteryProgress: { percentageMastered: 58, percentageFluent: 34, percentageRetained: 18 },
      readinessLevel: { readinessScore: 61, readinessBand: 'progressing' },
      fluencyState: {
        questionFamilyResults: [
          { skillId: 'F020', questionFamilyId: 'QF_F020_001', status: 'accurateButSlow', accuracy: 88, averageTime: 24, benchmarkTime: 18, consistencyScore: 64, attemptsCount: 7 },
        ],
      },
      retentionProgress: { skillsDueForReview: ['F003'], skillsNeedingRefresh: [], retainedSkillIds: ['F001'] },
    },
    {
      studentId: 's3',
      skillStatuses: { F010: 'fluent', F018: 'fluent', F001: 'retained', F026: 'learning' },
      masteryProgress: { percentageMastered: 74, percentageFluent: 62, percentageRetained: 41 },
      readinessLevel: { readinessScore: 83, readinessBand: 'ready' },
      fluencyState: { questionFamilyResults: [] },
      retentionProgress: { skillsDueForReview: [], skillsNeedingRefresh: [], retainedSkillIds: ['F001', 'F010'] },
    },
  ];

  const assessmentResults = [
    { studentId: 's1', latestScore: 46, readinessBand: 'developing', weakSkills: ['F010', 'F018'] },
    { studentId: 's2', latestScore: 59, readinessBand: 'approaching', weakSkills: ['F020'] },
    { studentId: 's3', latestScore: 82, readinessBand: 'strong', weakSkills: [] },
  ];

  const mistakePlans = [
    { studentId: 's1', focusMistakes: [{ mistakeCode: 'M001', count: 3, highestSeverity: 'high' }], rootCauseSkillIds: ['F010'] },
    { studentId: 's2', focusMistakes: [{ mistakeCode: 'M001', count: 1, highestSeverity: 'medium' }], rootCauseSkillIds: ['F010'] },
  ];

  const workingAnalysisSummaries = [
    { studentId: 's1', averageWorkingQuality: 54, missingWorkingCount: 2, missingWorkingQuestions: ['q1'] },
    { studentId: 's2', averageWorkingQuality: 73, missingWorkingCount: 0, unreadableWorkingQuestions: [] },
    { studentId: 's3', averageWorkingQuality: 82, missingWorkingCount: 0, unreadableWorkingQuestions: [] },
  ];
  const helpRequests = [{ studentId: 's1', skillId: 'F010', count: 2, latestAt: '2026-01-01T00:00:00.000Z' }];

  const dashboard = buildTeacherMathPathDashboard({
    teacherId: 't1',
    classId: 'class_a',
    domainId: 'fractions',
    studentProgressStates,
    assessmentResults,
    mistakePlans,
    workingAnalysisSummaries,
    helpRequests,
  });

  return {
    isValid:
      dashboard.classOverview.totalStudents === 3 &&
      dashboard.skillMasteryHeatmap.length === 26 &&
      Array.isArray(dashboard.interventionGroups) &&
      Array.isArray(dashboard.fluencyBottlenecks) &&
      Array.isArray(dashboard.retentionRisks) &&
      !!dashboard.assessmentReadiness.readinessDistribution &&
      Array.isArray(dashboard.commonMistakePatterns) &&
      !!dashboard.workingQualityOverview &&
      Array.isArray(dashboard.recommendedTeacherActions) &&
      Array.isArray(dashboard.classGroupingEngine) &&
      Boolean(dashboard.teacherAssignmentCentre?.foundationsReady) &&
      Boolean(dashboard.adultIntelligence?.alerts),
    checks: {
      handlesMultipleStudentStates: dashboard.classOverview.totalStudents === 3,
      classOverviewCalculated: dashboard.classOverview.averageMastery > 0,
      heatmapIncludesAllSkills: dashboard.skillMasteryHeatmap.length === 26,
      interventionGroupsGenerated: dashboard.interventionGroups.length > 0,
      fluencyBottlenecksIdentified: dashboard.fluencyBottlenecks.length > 0,
      retentionRisksIdentified: dashboard.retentionRisks.length > 0,
      readinessDistributionGenerated: Object.keys(dashboard.assessmentReadiness.readinessDistribution || {}).length === 5,
      commonMistakesGrouped: dashboard.commonMistakePatterns.length > 0,
      workingOverviewIncluded: typeof dashboard.workingQualityOverview.averageWorkingQuality !== 'undefined',
      actionsGenerated: dashboard.recommendedTeacherActions.length > 0,
      adultGroupingIncluded: dashboard.classGroupingEngine.length > 0,
      assignmentFoundationIncluded: dashboard.teacherAssignmentCentre?.foundationsReady === true,
      adultIntelligenceIncluded: Boolean(dashboard.adultIntelligence?.alerts),
      partialDataSafe: Boolean(buildTeacherMathPathDashboard({ teacherId: 't2', classId: 'empty', studentProgressStates: [] })),
    },
    sample: {
      teacherDashboard: dashboard,
      heatmapExample: dashboard.skillMasteryHeatmap[9], // F010
      interventionGroups: dashboard.interventionGroups.slice(0, 2),
    },
  };
}

export const teacherMathPathDashboardEngine = {
  buildTeacherMathPathDashboard,
  buildClassOverview,
  buildSkillMasteryHeatmap,
  buildInterventionGroups,
  buildClassFluencyBottlenecks,
  buildClassRetentionRisks,
  buildClassAssessmentReadiness,
  buildCommonMistakePatterns,
  buildWorkingQualityOverview,
  buildRecommendedTeacherActions,
  buildClassGroupingSuggestions,
  buildUnifiedAdultIntelligenceModel,
  validateTeacherMathPathDashboardEngine,
};

export default teacherMathPathDashboardEngine;
