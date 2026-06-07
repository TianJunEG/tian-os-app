import LearningPath from '../../models/mathpath/LearningPath.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import { getInterventionForMisconception, listMisconceptionInterventions } from './misconceptionInterventionMap.js';
import { getMisconceptionsForSkill, getSkillMisconceptionEntry, listSkillMisconceptionEntries } from './skillMisconceptionMap.js';
import {
  DEFAULT_LEARNING_PATH_STAGES,
  DEFAULT_MASTERY_CRITERIA,
  buildLearningPathAnalytics,
  inferCompletedStagesFromProgress,
  markStageCompleted,
  normaliseStages,
} from './masteryCriteriaEngine.js';

function clean(value = '') {
  return String(value || '').trim();
}

function keyPart(value = '') {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'general';
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function buildLearningPathId({ skillId, misconceptionId = '', domainId = 'fractions' } = {}) {
  return `lp_${keyPart(domainId)}_${keyPart(skillId)}_${keyPart(misconceptionId || 'general')}`;
}

export function resolvePrimaryMisconception(skillId = '', misconceptionId = '') {
  if (misconceptionId) return clean(misconceptionId);
  const entry = getSkillMisconceptionEntry(skillId);
  return entry?.primary?.[0] || getMisconceptionsForSkill(skillId)[0] || '';
}

function stageDescriptionFor({ stage, intervention }) {
  const focus = intervention?.workedExampleFocus || [];
  const byStage = {
    concept_introduction: intervention?.description || 'Understand the key idea before practising again.',
    visual_understanding: `Use ${intervention?.interventionType || 'a visual model'} to make the concept visible.`,
    worked_example: focus.length ? focus.join('; ') : 'Study one correct example and the common trap.',
    guided_practice: 'Practise with prompts before moving to independent questions.',
    independent_practice: 'Solve similar questions without step-by-step support.',
    mastery_check: `Check mastery using ${intervention?.recheckStrategy || 'a focused mastery item'}.`,
    recheck_ready: 'Enough evidence has been collected for a recheck.',
  };
  return byStage[stage.stageId] || stage.description;
}

export function buildDefaultLearningPath({
  skillId,
  skillName = '',
  misconceptionId = '',
  subjectId = 'math',
  domainId = 'fractions',
} = {}) {
  const resolvedMisconceptionId = resolvePrimaryMisconception(skillId, misconceptionId);
  const intervention = getInterventionForMisconception(resolvedMisconceptionId);
  const mappedSkill = getSkillMisconceptionEntry(skillId);
  const titleSkill = skillName || mappedSkill?.skillName || clean(skillId) || 'Targeted skill';
  const misconceptionName = intervention?.misconceptionName || resolvedMisconceptionId || 'targeted review';
  const stages = normaliseStages(DEFAULT_LEARNING_PATH_STAGES).map((stage) => ({
    ...stage,
    description: stageDescriptionFor({ stage, intervention }),
    criteria: {
      interventionStage: intervention?.guidedPracticeSequence?.find((item) => item.includes(stage.stageId.split('_')[0])) || '',
    },
  }));
  return {
    learningPathId: buildLearningPathId({ skillId, misconceptionId: resolvedMisconceptionId, domainId }),
    subjectId,
    domainId,
    skillId: clean(skillId).toUpperCase(),
    misconceptionId: resolvedMisconceptionId,
    title: `${titleSkill}: ${misconceptionName}`,
    stages,
    masteryCriteria: { ...DEFAULT_MASTERY_CRITERIA },
    status: 'active',
  };
}

export async function getOrCreateLearningPathForSkillMisconception({
  skillId,
  skillName = '',
  misconceptionId = '',
  subjectId = 'math',
  domainId = 'fractions',
} = {}) {
  const template = buildDefaultLearningPath({ skillId, skillName, misconceptionId, subjectId, domainId });
  const existing = await LearningPath.findOne({ learningPathId: template.learningPathId }).lean();
  if (existing) return existing;
  return LearningPath.create(template);
}

export function buildLearningPathAssignmentFields({
  skillIds = [],
  misconceptionId = '',
  subjectId = 'math',
  domainId = 'fractions',
} = {}) {
  const firstSkillId = clean(skillIds[0]).toUpperCase();
  const resolvedMisconceptionId = resolvePrimaryMisconception(firstSkillId, misconceptionId);
  const path = buildDefaultLearningPath({
    skillId: firstSkillId,
    misconceptionId: resolvedMisconceptionId,
    subjectId,
    domainId,
  });
  return {
    learningPathId: path.learningPathId,
    currentStage: path.stages[0]?.stageId || 'concept_introduction',
    completedStages: [],
    stageHistory: [],
  };
}

export function attachLearningPathToAssignmentPayload(payload = {}, options = {}) {
  const skillIds = unique(payload.skillIds || options.skillIds || []);
  if (!skillIds.length) return payload;
  return {
    ...payload,
    ...buildLearningPathAssignmentFields({
      skillIds,
      misconceptionId: options.misconceptionId,
      subjectId: payload.subjectId || options.subjectId || 'math',
      domainId: payload.domainId || options.domainId || 'fractions',
    }),
  };
}

export function advanceLearningPathStage({ assignment = {}, completedStageId = '', learningPath = null, evidence = {} } = {}) {
  const updated = completedStageId
    ? markStageCompleted({ assignment, stageId: completedStageId, learningPath })
    : { ...assignment, ...inferCompletedStagesFromProgress({ assignment, learningPath }) };
  const stageHistory = [
    ...(assignment.stageHistory || []),
    ...(completedStageId ? [{
      stageId: completedStageId,
      completedAt: evidence.completedAt || new Date(),
      evidenceType: evidence.evidenceType || 'practice_progress',
    }] : []),
  ];
  return { ...updated, stageHistory };
}

export async function updateAssignmentLearningPathProgress(assignment) {
  if (!assignment?.learningPathId) return assignment;
  const path = await LearningPath.findOne({ learningPathId: assignment.learningPathId }).lean();
  const progress = inferCompletedStagesFromProgress({ assignment, learningPath: path });
  assignment.completedStages = progress.completedStages;
  assignment.currentStage = progress.currentStage;
  return assignment;
}

export function buildRecoveryPathReadinessMatrix() {
  const rows = listSkillMisconceptionEntries().map((entry) => {
    const misconceptions = unique([...(entry.primary || []), ...(entry.secondary || [])]);
    const primaryPath = buildDefaultLearningPath({
      skillId: entry.skillId,
      skillName: entry.skillName,
      misconceptionId: misconceptions[0],
    });
    const missing = [
      misconceptions.length ? null : 'misconception_missing',
      primaryPath.stages.length >= 7 ? null : 'stage_sequence_incomplete',
      primaryPath.stages.some((stage) => stage.stageId === 'worked_example') ? null : 'worked_example_stage_missing',
      primaryPath.stages.some((stage) => stage.stageId === 'guided_practice') ? null : 'guided_practice_stage_missing',
      primaryPath.stages.some((stage) => stage.stageId === 'mastery_check') ? null : 'mastery_check_stage_missing',
    ].filter(Boolean);
    return {
      skillId: entry.skillId,
      skillName: entry.skillName,
      misconceptionIds: misconceptions,
      learningPathId: primaryPath.learningPathId,
      stageCount: primaryPath.stages.length,
      masteryCriteria: primaryPath.masteryCriteria,
      readinessStatus: missing.length ? 'partial' : 'ready',
      missing,
    };
  });
  return {
    domainId: 'fractions',
    skillCount: rows.length,
    readyCount: rows.filter((row) => row.readinessStatus === 'ready').length,
    partialCount: rows.filter((row) => row.readinessStatus !== 'ready').length,
    rows,
  };
}

export async function getLearningPathQualityReport({ domainId = 'fractions', limit = 100 } = {}) {
  const [paths, assignments] = await Promise.all([
    LearningPath.find({ domainId }).lean().catch(() => []),
    MathPathAssignment.find({ domainId }).sort({ createdAt: -1 }).limit(Number(limit) || 100).lean().catch(() => []),
  ]);
  const readinessMatrix = buildRecoveryPathReadinessMatrix();
  const interventions = listMisconceptionInterventions();
  const pathKeys = new Set(paths.map((path) => `${path.skillId}:${path.misconceptionId}`));
  const expectedKeys = new Set(readinessMatrix.rows.flatMap((row) => row.misconceptionIds.map((id) => `${row.skillId}:${id}`)));
  const misconceptionsWithoutLearningPaths = [...expectedKeys]
    .filter((key) => !pathKeys.has(key))
    .map((key) => {
      const [skillId, misconceptionId] = key.split(':');
      const skill = getSkillMisconceptionEntry(skillId);
      const intervention = getInterventionForMisconception(misconceptionId);
      return {
        skillId,
        skillName: skill?.skillName || skillId,
        misconceptionId,
        misconceptionName: intervention?.misconceptionName || misconceptionId,
      };
    });
  const incompleteLearningPaths = paths.filter((path) => normaliseStages(path.stages).length < 7);
  const weakMasteryCriteria = paths.filter((path) => {
    const criteria = path.masteryCriteria || {};
    return Number(criteria.minAccuracy || 0) < 70 || criteria.requiresMasteryCheck === false;
  });
  const analytics = buildLearningPathAnalytics({ assignments });

  return {
    domainId,
    pathCount: paths.length,
    expectedPathCount: expectedKeys.size,
    readinessMatrix,
    misconceptionsWithoutLearningPaths,
    incompleteLearningPaths,
    weakMasteryCriteria,
    highDropOffStages: analytics.highDropOffStages,
    assignmentStageAnalytics: analytics,
    interventionCount: interventions.length,
  };
}

export default {
  buildLearningPathId,
  resolvePrimaryMisconception,
  buildDefaultLearningPath,
  getOrCreateLearningPathForSkillMisconception,
  buildLearningPathAssignmentFields,
  attachLearningPathToAssignmentPayload,
  advanceLearningPathStage,
  updateAssignmentLearningPathProgress,
  buildRecoveryPathReadinessMatrix,
  getLearningPathQualityReport,
};
