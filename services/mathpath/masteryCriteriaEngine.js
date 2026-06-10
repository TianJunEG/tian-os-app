export const DEFAULT_LEARNING_PATH_STAGES = Object.freeze([
  {
    stageId: 'concept_introduction',
    stageType: 'concept_introduction',
    title: 'Understand the mistake',
    description: 'Name the idea and the common trap.',
    order: 1,
  },
  {
    stageId: 'visual_understanding',
    stageType: 'visual_understanding',
    title: 'Learn the concept visually',
    description: 'Use a model or diagram to see why the method works.',
    order: 2,
  },
  {
    stageId: 'worked_example',
    stageType: 'worked_example',
    title: 'See a worked example',
    description: 'Compare the wrong method with the correct method.',
    order: 3,
  },
  {
    stageId: 'guided_practice',
    stageType: 'guided_practice',
    title: 'Practice with support',
    description: 'Try similar questions with scaffolding.',
    order: 4,
  },
  {
    stageId: 'independent_practice',
    stageType: 'independent_practice',
    title: 'Practice independently',
    description: 'Solve without step-by-step support.',
    order: 5,
  },
  {
    stageId: 'mastery_check',
    stageType: 'mastery_check',
    title: 'Mastery check',
    description: 'Show that the skill is secure.',
    order: 6,
  },
  {
    stageId: 'recheck_ready',
    stageType: 'recheck_ready',
    title: 'Ready for recheck',
    description: 'The recovery path has enough evidence for reassessment.',
    order: 7,
  },
]);

export const DEFAULT_MASTERY_CRITERIA = Object.freeze({
  minAccuracy: 75,
  minStageCompletion: 1,
  requiresMisconceptionResolved: true,
  requiresConfidenceImproved: false,
  requiresMasteryCheck: true,
});

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function normaliseStages(stages = DEFAULT_LEARNING_PATH_STAGES) {
  const source = arr(stages).length ? stages : DEFAULT_LEARNING_PATH_STAGES;
  return source
    .map((stage, index) => ({
      stageId: stage.stageId || stage.stageType || `stage_${index + 1}`,
      stageType: stage.stageType || stage.stageId || `stage_${index + 1}`,
      title: stage.title || stage.stageId || `Stage ${index + 1}`,
      description: stage.description || '',
      order: num(stage.order, index + 1),
      required: stage.required !== false,
      criteria: stage.criteria || {},
    }))
    .sort((a, b) => a.order - b.order);
}

export function getLearningPathProgress({ assignment = {}, learningPath = null } = {}) {
  const stages = normaliseStages(learningPath?.stages);
  const requiredStages = stages.filter((stage) => stage.required !== false);
  const completedStages = unique(arr(assignment.completedStages));
  const completedRequired = requiredStages.filter((stage) => completedStages.includes(stage.stageId));
  const completionRatio = requiredStages.length
    ? completedRequired.length / requiredStages.length
    : 0;
  const currentStage = assignment.currentStage
    || stages.find((stage) => !completedStages.includes(stage.stageId))?.stageId
    || stages[0]?.stageId
    || '';
  const nextStage = stages.find((stage) => !completedStages.includes(stage.stageId))?.stageId || '';

  return {
    stages,
    completedStages,
    completionRatio,
    currentStage,
    nextStage,
    completedRequiredCount: completedRequired.length,
    requiredStageCount: requiredStages.length,
  };
}

export function markStageCompleted({ assignment = {}, stageId = '', learningPath = null } = {}) {
  const progress = getLearningPathProgress({ assignment, learningPath });
  const targetStageId = String(stageId || progress.currentStage || '').trim();
  const completedStages = unique([...progress.completedStages, targetStageId]);
  const nextStage = progress.stages.find((stage) => !completedStages.includes(stage.stageId))?.stageId || 'recheck_ready';
  return {
    ...assignment,
    completedStages,
    currentStage: nextStage,
  };
}

export function inferCompletedStagesFromProgress({ assignment = {}, learningPath = null } = {}) {
  const stages = normaliseStages(learningPath?.stages);
  const completion = assignment.completion || {};
  const attempted = num(completion.questionsAttempted);
  const target = num(assignment.targetQuestionCount || completion.questionsAssigned);
  const accuracy = num(completion.accuracy);
  const existing = arr(assignment.completedStages);
  const inferred = [...existing];

  if (attempted > 0) inferred.push('concept_introduction', 'visual_understanding');
  if (target > 0 && attempted >= Math.ceil(target * 0.25)) inferred.push('worked_example');
  if (target > 0 && attempted >= Math.ceil(target * 0.5)) inferred.push('guided_practice');
  if (target > 0 && attempted >= Math.ceil(target * 0.8)) inferred.push('independent_practice');

  const validStageIds = new Set(stages.map((stage) => stage.stageId));
  const completedStages = unique(inferred).filter((stageId) => validStageIds.has(stageId));
  const currentStage = stages.find((stage) => !completedStages.includes(stage.stageId))?.stageId || 'recheck_ready';
  return {
    completedStages,
    currentStage,
  };
}

export function evaluateMasteryCriteria({
  assignment = {},
  learningPath = null,
  evidence = {},
} = {}) {
  const criteria = {
    ...DEFAULT_MASTERY_CRITERIA,
    ...(learningPath?.masteryCriteria || {}),
  };
  const progress = getLearningPathProgress({ assignment, learningPath });
  const completion = assignment.completion || {};
  const accuracy = num(evidence.accuracy ?? completion.accuracy);
  const masteryCheckCompleted = progress.completedStages.includes('mastery_check');
  const misconceptionResolved = Boolean(evidence.misconceptionResolved || assignment.misconceptionResolved);
  const confidenceImproved = Boolean(evidence.confidenceImproved || assignment.confidenceImproved);

  const criteriaMet = {
    stageCompletion: progress.completionRatio >= num(criteria.minStageCompletion, 1),
    accuracy: accuracy >= num(criteria.minAccuracy, 75),
    masteryCheck: !criteria.requiresMasteryCheck || masteryCheckCompleted,
    misconceptionResolved: !criteria.requiresMisconceptionResolved || misconceptionResolved,
    confidenceImproved: !criteria.requiresConfidenceImproved || confidenceImproved,
  };
  const missingCriteria = Object.entries(criteriaMet)
    .filter(([, met]) => !met)
    .map(([key]) => key);

  return {
    readyForRecheck: missingCriteria.length === 0,
    criteriaMet,
    missingCriteria,
    completionRatio: progress.completionRatio,
    completedStages: progress.completedStages,
    currentStage: progress.currentStage,
    nextStage: progress.nextStage,
    accuracy,
    masteryCriteria: criteria,
  };
}

export function buildLearningPathAnalytics({ assignments = [] } = {}) {
  const stageIds = DEFAULT_LEARNING_PATH_STAGES.map((stage) => stage.stageId);
  const rows = stageIds.map((stageId) => {
    const completed = assignments.filter((assignment) => arr(assignment.completedStages).includes(stageId)).length;
    return {
      stageId,
      completed,
      completionRate: assignments.length ? Math.round((completed / assignments.length) * 100) : 0,
      dropOff: assignments.length - completed,
    };
  });
  return {
    assignmentCount: assignments.length,
    stageCompletion: rows,
    highDropOffStages: rows.filter((row) => row.dropOff > 0 && row.completionRate < 50),
  };
}

export default {
  DEFAULT_LEARNING_PATH_STAGES,
  DEFAULT_MASTERY_CRITERIA,
  normaliseStages,
  getLearningPathProgress,
  markStageCompleted,
  inferCompletedStagesFromProgress,
  evaluateMasteryCriteria,
  buildLearningPathAnalytics,
};
