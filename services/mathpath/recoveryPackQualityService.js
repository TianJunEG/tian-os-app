import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import { auditMisconceptionInterventionCoverage, getInterventionForMisconception } from './misconceptionInterventionMap.js';
import { getMisconceptionsForSkill, listSkillMisconceptionEntries } from './skillMisconceptionMap.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const asArray = (value) => (Array.isArray(value) ? value : []);
const id = (value) => value?._id?.toString?.() || value?.toString?.() || value;

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function stagesForSkill(skillId = '') {
  const misconceptions = getMisconceptionsForSkill(skillId);
  const interventions = misconceptions.map(getInterventionForMisconception).filter(Boolean);
  return unique(interventions.flatMap((row) => row.guidedPracticeSequence || []));
}

export function auditRecoveryPackCoverage() {
  const rows = listSkillMisconceptionEntries().map((entry) => {
    const misconceptions = unique([...(entry.primary || []), ...(entry.secondary || [])]);
    const interventions = misconceptions.map(getInterventionForMisconception).filter(Boolean);
    const guidedStages = unique(interventions.flatMap((row) => row.guidedPracticeSequence || []));
    const workedExamples = interventions.filter((row) => row.workedExampleFocus?.length);
    const recheckStrategies = unique(interventions.map((row) => row.recheckStrategy));
    const hasVisual = guidedStages.some((stage) => /visual|model|strip|line|bar|area/.test(stage))
      || interventions.some((row) => /model|visual|bar|line/.test(row.interventionType));
    const missing = [
      misconceptions.length ? null : 'misconception_targeting_missing',
      guidedStages.length ? null : 'guided_questions_missing',
      workedExamples.length ? null : 'worked_example_missing',
      recheckStrategies.length ? null : 'recheck_alignment_missing',
      hasVisual ? null : 'visual_or_model_stage_missing',
    ].filter(Boolean);
    return {
      skillId: entry.skillId,
      skillName: entry.skillName,
      recoveryContentExists: interventions.length > 0,
      misconceptionTargetingExists: misconceptions.length > 0,
      guidedQuestionsExist: guidedStages.includes('guided_practice') || guidedStages.some((stage) => stage.includes('guided')),
      workedExamplesExist: workedExamples.length > 0,
      recheckAlignmentExists: recheckStrategies.length > 0,
      misconceptionTags: misconceptions,
      guidedStages,
      recheckStrategies,
      missing,
      coverageStatus: missing.length ? 'partial' : 'ready',
    };
  });

  return {
    domainId: 'fractions',
    skillCount: rows.length,
    readyCount: rows.filter((row) => row.coverageStatus === 'ready').length,
    partialCount: rows.filter((row) => row.coverageStatus !== 'ready').length,
    rows,
  };
}

export function scoreRecoveryPackQuality({
  assignment = {},
  sourceDiagnostic = null,
  paperAnalysis = null,
  recheck = null,
} = {}) {
  const skillIds = asArray(assignment.skillIds);
  const misconceptionTags = unique([
    ...skillIds.flatMap(getMisconceptionsForSkill),
    ...asArray(paperAnalysis?.detectedQuestions).flatMap((question) => asArray(question.misconceptionTags)),
    ...asArray(sourceDiagnostic?.perSkillSnapshot).flatMap((row) => asArray(row.misconceptionTags)),
  ]);
  const mappedInterventions = misconceptionTags.map(getInterventionForMisconception).filter(Boolean);
  const guidedStages = unique([
    ...mappedInterventions.flatMap((row) => row.guidedPracticeSequence || []),
    ...skillIds.flatMap(stagesForSkill),
  ]);
  const hasWorkedExample = mappedInterventions.some((row) => row.workedExampleFocus?.length);
  const hasGuided = guidedStages.some((stage) => stage.includes('guided'));
  const hasIndependent = guidedStages.some((stage) => stage.includes('independent'));
  const hasVisual = mappedInterventions.some((row) => /model|visual|bar|line|strip/.test(row.interventionType));
  const hasRecheck = mappedInterventions.some((row) => row.recheckStrategy) || Boolean(recheck || assignment.recheck?.diagnosticSessionId);
  const hasEvidence = Boolean(sourceDiagnostic || paperAnalysis || assignment.sourceType);

  const score = clamp([
    misconceptionTags.length ? 25 : 0,
    skillIds.length ? 20 : 0,
    hasVisual ? 10 : 0,
    hasWorkedExample ? 15 : 0,
    hasGuided ? 10 : 0,
    hasIndependent ? 5 : 0,
    hasRecheck ? 10 : 0,
    hasEvidence ? 5 : 0,
  ].reduce((sum, value) => sum + value, 0));

  const missing = [
    misconceptionTags.length ? null : 'misconception_alignment_missing',
    skillIds.length ? null : 'skill_alignment_missing',
    hasWorkedExample ? null : 'worked_example_missing',
    hasGuided ? null : 'guided_practice_missing',
    hasIndependent ? null : 'independent_practice_missing',
    hasRecheck ? null : 'recheck_alignment_missing',
    hasEvidence ? null : 'evidence_support_missing',
  ].filter(Boolean);

  return {
    assignmentId: id(assignment._id || assignment.id),
    sourceType: assignment.sourceType,
    skillIds,
    misconceptionTags,
    guidedStages,
    qualityScore: score,
    qualityBand: score >= 85 ? 'strong' : score >= 65 ? 'partial' : 'weak',
    missing,
    dimensions: {
      misconceptionAlignment: misconceptionTags.length > 0,
      skillAlignment: skillIds.length > 0,
      progressionQuality: hasWorkedExample && hasGuided && hasIndependent,
      recheckReadiness: hasRecheck,
      evidenceSupport: hasEvidence,
    },
  };
}

export function auditWorkedExampleCoverage() {
  const rows = auditMisconceptionInterventionCoverage().rows.map((row) => ({
    misconceptionId: row.misconceptionId,
    misconceptionName: row.misconceptionName,
    workedExampleExists: Boolean(row.workedExampleFocus?.length),
    explainsWrongAnswer: row.workedExampleFocus?.some((item) => /wrong|why|trap/.test(item)) || false,
    explainsCorrectMethod: row.workedExampleFocus?.some((item) => /correct|method|same|divide|rename|model|whole/.test(item)) || false,
    explainsCommonTrap: row.workedExampleFocus?.some((item) => /trap/.test(item)) || false,
  }));
  return {
    rows,
    gaps: rows.filter((row) => !row.workedExampleExists || !row.explainsWrongAnswer || !row.explainsCorrectMethod || !row.explainsCommonTrap),
  };
}

export function auditGuidedPracticeProgression() {
  const rows = listSkillMisconceptionEntries().map((entry) => {
    const stages = stagesForSkill(entry.skillId);
    const checks = {
      visualUnderstanding: stages.some((stage) => /visual|model|strip|line|bar|area/.test(stage)),
      guidedPractice: stages.some((stage) => stage.includes('guided')),
      independentPractice: stages.some((stage) => stage.includes('independent')),
      masteryCheck: stages.includes('recheck') || stages.some((stage) => stage.includes('recheck')),
    };
    return {
      skillId: entry.skillId,
      skillName: entry.skillName,
      stages,
      checks,
      missingStages: Object.entries(checks).filter(([, present]) => !present).map(([key]) => key),
      progressionStatus: Object.values(checks).every(Boolean) ? 'complete' : 'partial',
    };
  });
  return { rows, gaps: rows.filter((row) => row.progressionStatus !== 'complete') };
}

export function auditRecheckAlignment({ assignments = [], diagnostics = [] } = {}) {
  return assignments.map((assignment) => {
    const assignmentId = id(assignment._id);
    const recheck = diagnostics.find((session) => session.diagnosticPurpose === 'recheck'
      && (id(session.assignmentId) === assignmentId || session.sourceId === assignmentId || session.diagnosticSessionId === assignment.recheck?.diagnosticSessionId));
    const recheckSkills = asArray(recheck?.targetSkillIds).length
      ? asArray(recheck.targetSkillIds)
      : asArray(recheck?.perSkillSnapshot).map((row) => row.skillId);
    const missingTargetSkills = asArray(assignment.skillIds).filter((skillId) => !recheckSkills.includes(skillId));
    return {
      assignmentId,
      skillIds: asArray(assignment.skillIds),
      recheckDiagnosticId: recheck?.diagnosticSessionId || assignment.recheck?.diagnosticSessionId || '',
      recheckExists: Boolean(recheck),
      recheckSkills,
      missingTargetSkills,
      alignmentStatus: !recheck ? 'missing_recheck' : missingTargetSkills.length ? 'partial' : 'aligned',
    };
  });
}

export async function getRecoveryPackQualityReport({ studentId, domainId = 'fractions', limit = 100 } = {}) {
  const filter = { domainId };
  if (studentId) filter.studentId = studentId;
  const assignments = await MathPathAssignment.find(filter).sort({ createdAt: -1 }).limit(Number(limit) || 100).lean();
  const sourceDiagnosticIds = assignments.filter((assignment) => assignment.sourceType === 'diagnostic').map((assignment) => assignment.sourceId);
  const paperIds = assignments.filter((assignment) => assignment.sourceType === 'paper_analysis').map((assignment) => assignment.sourceId);
  const [diagnostics, papers, rechecks] = await Promise.all([
    sourceDiagnosticIds.length ? MathPathDiagnosticSession.find({ diagnosticSessionId: { $in: sourceDiagnosticIds } }).lean() : [],
    paperIds.length ? PaperAnalysis.find({ _id: { $in: paperIds } }).lean() : [],
    MathPathDiagnosticSession.find({
      domainId,
      diagnosticPurpose: 'recheck',
      ...(studentId ? { studentId } : {}),
    }).lean(),
  ]);

  const qualityRows = assignments.map((assignment) => scoreRecoveryPackQuality({
    assignment,
    sourceDiagnostic: diagnostics.find((session) => session.diagnosticSessionId === assignment.sourceId),
    paperAnalysis: papers.find((paper) => id(paper._id) === assignment.sourceId),
    recheck: rechecks.find((session) => id(session.assignmentId) === id(assignment._id)),
  }));

  const coverage = auditRecoveryPackCoverage();
  const workedExamples = auditWorkedExampleCoverage();
  const progression = auditGuidedPracticeProgression();
  const recheckAlignment = auditRecheckAlignment({ assignments, diagnostics: rechecks });

  return {
    domainId,
    assignmentCount: assignments.length,
    averageQualityScore: qualityRows.length
      ? Math.round(qualityRows.reduce((sum, row) => sum + row.qualityScore, 0) / qualityRows.length)
      : 0,
    recoveryPackCoverageMatrix: coverage.rows,
    lowQualityRecoveryPacks: qualityRows.filter((row) => row.qualityScore < 65),
    strongestRecoveryPacks: qualityRows.filter((row) => row.qualityScore >= 85),
    misconceptionInterventionCoverage: auditMisconceptionInterventionCoverage(),
    workedExampleGaps: workedExamples.gaps,
    guidedPracticeGaps: progression.gaps,
    recheckWeaknesses: recheckAlignment.filter((row) => row.alignmentStatus !== 'aligned'),
    qualityRows,
  };
}

export default {
  auditRecoveryPackCoverage,
  scoreRecoveryPackQuality,
  auditWorkedExampleCoverage,
  auditGuidedPracticeProgression,
  auditRecheckAlignment,
  getRecoveryPackQualityReport,
};
