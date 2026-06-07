import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import { listMisconceptionInterventions } from './misconceptionInterventionMap.js';
import { getMisconceptionsForSkill } from './skillMisconceptionMap.js';
import { generateWorkedExample, listWorkedExamples } from './workedExampleEngine.js';

const asArray = (value) => (Array.isArray(value) ? value : []);
const id = (value) => value?._id?.toString?.() || value?.toString?.() || value;

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

export function assetForMisconception(misconceptionId = '') {
  const worked = generateWorkedExample(misconceptionId);
  if (!worked) return null;
  return {
    misconceptionId: worked.misconceptionId,
    title: worked.title,
    explanation: worked.explanation,
    visualModelType: worked.visualModelType,
    workedExample: worked.workedExample,
    guidedPracticeIds: worked.guidedPracticeSequence.filter((stage) => stage !== 'worked_example' && stage !== 'recheck').map((stage) => `guided_${worked.misconceptionId}_${stage}`),
    independentPracticeIds: [`independent_${worked.misconceptionId}_practice`],
    recheckQuestionIds: [`recheck_${worked.misconceptionId}_${worked.recheckStrategy}`],
    status: 'ready',
    guidedPracticeSequence: worked.guidedPracticeSequence,
    recheckStrategy: worked.recheckStrategy,
    studentExplanation: worked.studentExplanation,
  };
}

export function listRecoveryPackAssets() {
  return listMisconceptionInterventions().map((row) => assetForMisconception(row.misconceptionId)).filter(Boolean);
}

export function buildRecoveryPackAssetMatrix() {
  const rows = listRecoveryPackAssets().map((asset) => {
    const missing = [
      asset ? null : 'intervention_mapping_missing',
      asset?.workedExample?.incorrectMethod ? null : 'worked_example_missing',
      asset?.visualModelType ? null : 'visual_explanation_missing',
      asset?.guidedPracticeIds?.length ? null : 'guided_practice_missing',
      asset?.independentPracticeIds?.length ? null : 'independent_practice_missing',
      asset?.recheckQuestionIds?.length ? null : 'recheck_missing',
    ].filter(Boolean);
    return {
      misconceptionId: asset.misconceptionId,
      title: asset.title,
      interventionMappingExists: true,
      workedExampleExists: Boolean(asset.workedExample?.incorrectMethod),
      visualExplanationExists: Boolean(asset.visualModelType),
      guidedPracticeExists: Boolean(asset.guidedPracticeIds?.length),
      independentPracticeExists: Boolean(asset.independentPracticeIds?.length),
      recheckExists: Boolean(asset.recheckQuestionIds?.length),
      visualModelType: asset.visualModelType,
      status: missing.length ? 'partial' : 'ready',
      missing,
    };
  });
  return {
    misconceptionCount: rows.length,
    readyCount: rows.filter((row) => row.status === 'ready').length,
    assetCoveragePercent: rows.length ? Math.round((rows.filter((row) => row.status === 'ready').length / rows.length) * 100) : 0,
    rows,
    missingAssets: rows.filter((row) => row.missing.length > 0),
    missingWorkedExamples: rows.filter((row) => !row.workedExampleExists),
    missingVisualExplanations: rows.filter((row) => !row.visualExplanationExists),
    missingRechecks: rows.filter((row) => !row.recheckExists),
  };
}

export function buildGuidedPracticeFlow({ misconceptionIds = [], skillIds = [] } = {}) {
  const tags = unique([
    ...asArray(misconceptionIds),
    ...asArray(skillIds).flatMap(getMisconceptionsForSkill),
  ]);
  const assets = tags.map(assetForMisconception).filter(Boolean);
  const primary = assets[0] || null;
  if (!primary) {
    return {
      misconceptionIds: [],
      steps: [],
      status: 'missing_assets',
    };
  }
  return {
    misconceptionIds: tags,
    status: 'ready',
    steps: [
      { type: 'worked_example', assetId: primary.misconceptionId, title: primary.title, content: primary.workedExample },
      { type: 'visual_explanation', visualModelType: primary.visualModelType, explanation: primary.workedExample.visualExplanation },
      ...primary.guidedPracticeIds.slice(0, 2).map((practiceId, index) => ({ type: 'guided_question', practiceId, title: `Guided Question ${index + 1}` })),
      { type: 'independent_practice', practiceIds: primary.independentPracticeIds, title: 'Independent Practice' },
      { type: 'mastery_check', recheckQuestionIds: primary.recheckQuestionIds, title: 'Mastery Check' },
    ],
  };
}

export function validateRecheckTargets({ assignment = {}, diagnostic = null } = {}) {
  const targetSkillIds = asArray(assignment.skillIds);
  const targetMisconceptions = unique([
    ...asArray(assignment.misconceptionIds),
    ...targetSkillIds.flatMap(getMisconceptionsForSkill),
  ]);
  const diagnosticSkillIds = asArray(diagnostic?.targetSkillIds).length
    ? asArray(diagnostic.targetSkillIds)
    : asArray(diagnostic?.perSkillSnapshot).map((row) => row.skillId);
  const diagnosticMisconceptions = unique(asArray(diagnostic?.perSkillSnapshot).flatMap((row) => asArray(row.misconceptionTags)));
  const missingSkillIds = targetSkillIds.filter((skillId) => !diagnosticSkillIds.includes(skillId));
  const missingMisconceptions = targetMisconceptions.filter((tag) => diagnosticMisconceptions.length && !diagnosticMisconceptions.includes(tag));

  return {
    assignmentId: id(assignment._id || assignment.id),
    diagnosticSessionId: diagnostic?.diagnosticSessionId || '',
    targetSkillIds,
    diagnosticSkillIds,
    targetMisconceptions,
    diagnosticMisconceptions,
    missingSkillIds,
    missingMisconceptions,
    status: !diagnostic
      ? 'missing_recheck'
      : missingSkillIds.length || missingMisconceptions.length
        ? 'partial'
        : 'aligned',
  };
}

export function deriveAssignmentAssetMetadata({ skillIds = [], misconceptionIds = [], evidenceSource = {} } = {}) {
  const tags = unique([
    ...asArray(misconceptionIds),
    ...asArray(skillIds).flatMap(getMisconceptionsForSkill),
  ]);
  const interventionIds = tags.map((tag) => assetForMisconception(tag)?.misconceptionId).filter(Boolean);
  const flow = buildGuidedPracticeFlow({ misconceptionIds: tags, skillIds });
  const firstAsset = tags.map(assetForMisconception).find(Boolean);
  return {
    misconceptionIds: tags,
    interventionIds,
    evidenceSource: {
      sourceType: evidenceSource.sourceType || '',
      sourceId: evidenceSource.sourceId || '',
      studentExplanation: evidenceSource.studentExplanation
        || firstAsset?.studentExplanation
        || 'This Recovery Pack targets skills that need more practice.',
      skillIds: asArray(skillIds),
    },
    guidedPracticeFlow: flow,
  };
}

export async function getRecoveryPackAssetReport({ domainId = 'fractions', limit = 100 } = {}) {
  const [assignments, rechecks, papers, diagnostics] = await Promise.all([
    MathPathAssignment.find({ domainId }).sort({ createdAt: -1 }).limit(Number(limit) || 100).lean(),
    MathPathDiagnosticSession.find({ domainId, diagnosticPurpose: 'recheck' }).lean(),
    PaperAnalysis.find({ domainId }).limit(Number(limit) || 100).lean(),
    MathPathDiagnosticSession.find({ domainId, status: 'completed' }).limit(Number(limit) || 100).lean(),
  ]);
  const matrix = buildRecoveryPackAssetMatrix();
  const recheckMismatches = assignments
    .map((assignment) => validateRecheckTargets({
      assignment,
      diagnostic: rechecks.find((session) => id(session.assignmentId) === id(assignment._id) || session.diagnosticSessionId === assignment.recheck?.diagnosticSessionId),
    }))
    .filter((row) => row.status !== 'aligned');

  return {
    domainId,
    generatedAt: new Date().toISOString(),
    assetCoveragePercent: matrix.assetCoveragePercent,
    misconceptionCount: matrix.misconceptionCount,
    readyCount: matrix.readyCount,
    recoveryPackAssetMatrix: matrix.rows,
    missingAssets: matrix.missingAssets,
    missingWorkedExamples: matrix.missingWorkedExamples,
    missingVisualExplanations: matrix.missingVisualExplanations,
    missingRechecks: matrix.missingRechecks,
    recheckMismatches,
    assignmentCount: assignments.length,
    evidenceSourceCounts: {
      assignmentsWithMisconceptions: assignments.filter((assignment) => asArray(assignment.misconceptionIds).length).length,
      papersAvailable: papers.length,
      diagnosticsAvailable: diagnostics.length,
    },
    sampleAssets: listWorkedExamples().slice(0, 8),
  };
}

export default {
  assetForMisconception,
  listRecoveryPackAssets,
  buildRecoveryPackAssetMatrix,
  buildGuidedPracticeFlow,
  validateRecheckTargets,
  deriveAssignmentAssetMetadata,
  getRecoveryPackAssetReport,
};
