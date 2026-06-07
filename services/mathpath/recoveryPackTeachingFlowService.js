import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import GeneratedQuestion from '../../models/mathpath/GeneratedQuestion.js';
import { getVisualModelMetadata, isSupportedVisualType } from './visualModelRegistry.js';
import { getSkillDisplayName } from './skillDisplayNameService.js';
import { evaluateRecheckRecommendation } from './mathPathAssignmentService.js';

const TEACHING_STAGES = [
  'what_learning',
  'worked_example',
  'visual_explanation',
  'guided_practice',
  'independent_practice',
  'mastery_check',
  'recheck_ready',
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function shapeAssignment(assignment) {
  if (!assignment) return null;
  const raw = typeof assignment.toObject === 'function' ? assignment.toObject() : assignment;
  return {
    ...raw,
    id: String(raw._id || raw.id || ''),
    _id: raw._id ? String(raw._id) : raw._id,
  };
}

function primarySkillLabel(assignment = {}) {
  const skillId = asArray(assignment.skillIds)[0] || '';
  return getSkillDisplayName(skillId).shortStudentLabel || 'this fraction skill';
}

function questionIdsFromSteps(steps = [], type = '') {
  return steps
    .filter((step) => step.type === type)
    .flatMap((step) => [
      step.practiceId,
      ...asArray(step.practiceIds),
      ...asArray(step.recheckQuestionIds),
    ])
    .filter(Boolean);
}

async function findQuestionByReference(referenceId = '') {
  if (!referenceId) return null;
  return GeneratedQuestion.findOne({
    $or: [
      { sourceQuestionId: referenceId },
      { fingerprint: referenceId },
      { templateId: referenceId },
      { questionFamilyId: referenceId },
    ],
    isActive: true,
  }).lean();
}

function fallbackQuestion({ referenceId = '', stageType = 'guided_practice', assignment = {} } = {}) {
  const skillLabel = primarySkillLabel(assignment);
  const guided = stageType === 'guided_practice';
  const mastery = stageType === 'mastery_check';
  return {
    questionId: referenceId,
    referenceId,
    source: 'fallback',
    prompt: mastery
      ? `Use the method from this Recovery Pack to solve one more ${skillLabel} question.`
      : guided
        ? `Try this ${skillLabel} step with help. Explain the first step you would take.`
        : `Now try a ${skillLabel} question on your own. Write your answer and one checking step.`,
    scaffold: guided
      ? 'Hint: start by naming the whole, the equal parts, or the operation before calculating.'
      : '',
    answerFormat: 'text',
    expectedAnswer: '',
    feedback: guided
      ? 'Good. Clear first steps help you avoid the same mistake.'
      : 'Nice effort. Check that your final line answers the question.',
  };
}

function shapeGeneratedQuestion(question = {}, referenceId = '') {
  if (!question) return null;
  return {
    questionId: question.sourceQuestionId || question.fingerprint || String(question._id || referenceId),
    referenceId,
    source: 'generated_question',
    prompt: question.prompt,
    scaffold: asArray(question.solutionSteps)[0] || '',
    answerFormat: question.answerFormat || 'text',
    expectedAnswer: question.finalAnswer || question.answer?.display || question.acceptedAnswers?.[0] || '',
    feedback: question.explanation || 'Check your method before moving on.',
  };
}

async function resolveQuestions({ ids = [], stageType = '', assignment = {} } = {}) {
  const questions = [];
  const warnings = [];
  for (const referenceId of unique(ids)) {
    const found = await findQuestionByReference(referenceId);
    if (found) {
      questions.push(shapeGeneratedQuestion(found, referenceId));
    } else {
      warnings.push({
        type: 'missing_question_record',
        referenceId,
        stageType,
        message: `No generated question record found for ${referenceId}; using a teaching-flow fallback.`,
      });
      questions.push(fallbackQuestion({ referenceId, stageType, assignment }));
    }
  }
  return { questions, warnings };
}

function progressMap(rows = []) {
  return new Map(asArray(rows).map((row) => [String(row.questionId), row]));
}

function applyProgress(questions = [], rows = []) {
  const map = progressMap(rows);
  return questions.map((question) => ({
    ...question,
    progress: map.get(String(question.questionId || question.referenceId)) || null,
  }));
}

function completed(rows = [], ids = []) {
  if (!ids.length) return false;
  const map = progressMap(rows);
  return ids.every((id) => map.get(String(id))?.answered);
}

function masteryPassed(assignment = {}) {
  return Boolean(assignment.masteryCheckProgress?.passed);
}

function isRecheckReady(assignment = {}) {
  const completedStages = new Set(asArray(assignment.completedStages));
  return [
    'worked_example',
    'visual_explanation',
    'guided_practice',
    'independent_practice',
    'mastery_check',
  ].every((stage) => completedStages.has(stage)) && masteryPassed(assignment);
}

export async function buildRecoveryPackTeachingFlow(assignmentInput = {}) {
  const assignment = shapeAssignment(assignmentInput);
  const steps = asArray(assignment.guidedPracticeFlow?.steps);
  const workedStep = steps.find((step) => step.type === 'worked_example') || {};
  const visualStep = steps.find((step) => step.type === 'visual_explanation') || {};
  const guidedIds = questionIdsFromSteps(steps, 'guided_question');
  const independentIds = questionIdsFromSteps(steps, 'independent_practice');
  const masteryIds = questionIdsFromSteps(steps, 'mastery_check');
  const [guided, independent, mastery] = await Promise.all([
    resolveQuestions({ ids: guidedIds, stageType: 'guided_practice', assignment }),
    resolveQuestions({ ids: independentIds, stageType: 'independent_practice', assignment }),
    resolveQuestions({ ids: masteryIds, stageType: 'mastery_check', assignment }),
  ]);
  const visualType = visualStep.visualModelType || workedStep.visualModelType || '';
  const visualModel = getVisualModelMetadata(visualType);
  const visualRenderable = Boolean(visualType && isSupportedVisualType(visualType));
  const skillLabels = asArray(assignment.skillIds).map((skillId) => getSkillDisplayName(skillId).shortStudentLabel);
  const completedStages = unique(asArray(assignment.completedStages));
  const recheckReady = isRecheckReady(assignment);

  return {
    assignment: {
      id: assignment.id,
      title: assignment.title || 'Recovery Pack',
      description: assignment.description || '',
      status: assignment.status,
      currentStage: assignment.currentStage || 'what_learning',
      completedStages,
      skillLabels,
      evidenceSource: {
        sourceType: assignment.evidenceSource?.sourceType || '',
        studentExplanation: assignment.evidenceSource?.studentExplanation || '',
      },
      recheck: assignment.recheck || {},
    },
    stages: TEACHING_STAGES.map((stageId) => ({
      stageId,
      completed: completedStages.includes(stageId) || (stageId === 'recheck_ready' && recheckReady),
      locked: stageId === 'recheck_ready' && !recheckReady,
    })),
    whatLearning: {
      title: 'What you are learning',
      explanation: assignment.evidenceSource?.studentExplanation
        || `This Recovery Pack helps you get stronger at ${skillLabels[0] || 'fractions'}.`,
      skillLabels,
    },
    workedExample: {
      title: workedStep.title || 'Worked Example',
      content: workedStep.content || {},
    },
    visualExplanation: {
      visualModelType: visualType,
      visualModel,
      renderable: visualRenderable,
      explanation: visualStep.explanation || workedStep.content?.visualExplanation || 'Use the model to see the relationship before calculating.',
      fallbackText: visualRenderable
        ? ''
        : 'The visual model is not renderable yet, so read the explanation and draw a simple model on paper.',
    },
    guidedPractice: {
      questionIds: guidedIds,
      questions: applyProgress(guided.questions, assignment.guidedPracticeProgress),
      completed: completed(assignment.guidedPracticeProgress, guided.questions.map((q) => q.questionId)),
    },
    independentPractice: {
      questionIds: independentIds,
      questions: applyProgress(independent.questions, assignment.independentPracticeProgress),
      completed: completed(assignment.independentPracticeProgress, independent.questions.map((q) => q.questionId)),
    },
    masteryCheck: {
      questionIds: masteryIds,
      questions: applyProgress(mastery.questions, []),
      progress: assignment.masteryCheckProgress || {},
      passed: masteryPassed(assignment),
    },
    recheckReady,
    warnings: [...guided.warnings, ...independent.warnings, ...mastery.warnings],
  };
}

export async function getRecoveryPackTeachingFlow({ assignmentId } = {}) {
  const assignment = await MathPathAssignment.findById(assignmentId).lean();
  if (!assignment) {
    const err = new Error('Recovery Pack not found.');
    err.status = 404;
    throw err;
  }
  return buildRecoveryPackTeachingFlow(assignment);
}

function updateQuestionRows(rows = [], questionId = '', correct = false) {
  const now = new Date();
  const source = asArray(rows).map((row) => ({ ...row }));
  const existing = source.find((row) => String(row.questionId) === String(questionId));
  if (existing) {
    existing.answered = true;
    existing.correct = Boolean(correct);
    existing.attempts = Number(existing.attempts || 0) + 1;
    existing.updatedAt = now;
    return source;
  }
  return [...source, {
    questionId: String(questionId),
    answered: true,
    correct: Boolean(correct),
    attempts: 1,
    updatedAt: now,
  }];
}

function markStage(assignment, stageId = '', evidenceType = 'teaching_flow') {
  if (!stageId) return;
  const aliases = {
    what_learning: 'concept_introduction',
    visual_explanation: 'visual_understanding',
  };
  assignment.completedStages = unique([
    ...(assignment.completedStages || []),
    stageId,
    aliases[stageId],
  ]);
  assignment.stageHistory = [
    ...(assignment.stageHistory || []),
    { stageId, completedAt: new Date(), evidenceType },
  ];
}

function nextStageFor(completedStages = []) {
  return TEACHING_STAGES.find((stageId) => !completedStages.includes(stageId) && stageId !== 'recheck_ready') || 'recheck_ready';
}

export async function updateRecoveryPackTeachingProgress({
  assignmentId,
  stageId,
  questionId = '',
  correct = false,
} = {}) {
  const assignment = await MathPathAssignment.findById(assignmentId);
  if (!assignment) {
    const err = new Error('Recovery Pack not found.');
    err.status = 404;
    throw err;
  }
  const flow = await buildRecoveryPackTeachingFlow(assignment);

  if (['what_learning', 'worked_example', 'visual_explanation'].includes(stageId)) {
    markStage(assignment, stageId, 'viewed');
  }

  if (stageId === 'guided_practice' && questionId) {
    assignment.guidedPracticeProgress = updateQuestionRows(assignment.guidedPracticeProgress, questionId, correct);
    const ids = flow.guidedPractice.questions.map((q) => q.questionId);
    if (completed(assignment.guidedPracticeProgress, ids)) markStage(assignment, 'guided_practice', 'guided_question');
  }

  if (stageId === 'independent_practice' && questionId) {
    assignment.independentPracticeProgress = updateQuestionRows(assignment.independentPracticeProgress, questionId, correct);
    const ids = flow.independentPractice.questions.map((q) => q.questionId);
    if (completed(assignment.independentPracticeProgress, ids)) markStage(assignment, 'independent_practice', 'independent_question');
  }

  if (stageId === 'mastery_check' && questionId) {
    const existing = Number(assignment.masteryCheckProgress?.attempted || 0);
    const correctCount = Number(assignment.masteryCheckProgress?.correctCount || 0) + (correct ? 1 : 0);
    const attempted = existing + 1;
    const target = Math.max(1, flow.masteryCheck.questions.length);
    const passed = attempted >= target && correctCount / attempted >= 0.8;
    assignment.masteryCheckProgress = {
      attempted,
      correctCount,
      passed,
      updatedAt: new Date(),
    };
    if (passed) markStage(assignment, 'mastery_check', 'mastery_check');
  }

  const attempted = asArray(assignment.guidedPracticeProgress).filter((row) => row.answered).length
    + asArray(assignment.independentPracticeProgress).filter((row) => row.answered).length
    + Number(assignment.masteryCheckProgress?.attempted || 0);
  const correctCount = asArray(assignment.guidedPracticeProgress).filter((row) => row.correct).length
    + asArray(assignment.independentPracticeProgress).filter((row) => row.correct).length
    + Number(assignment.masteryCheckProgress?.correctCount || 0);
  assignment.completion = {
    ...(assignment.completion || {}),
    questionsAssigned: assignment.completion?.questionsAssigned || assignment.targetQuestionCount || attempted,
    questionsAttempted: attempted,
    correctCount,
    accuracy: attempted ? Math.round((correctCount / attempted) * 100) : 0,
    completedAt: assignment.completion?.completedAt || null,
  };
  if (assignment.status === 'assigned' && attempted > 0) assignment.status = 'in_progress';
  if (isRecheckReady(assignment)) {
    assignment.currentStage = 'recheck_ready';
    assignment.status = 'completed';
    assignment.completion.completedAt = assignment.completion.completedAt || new Date();
  } else {
    assignment.currentStage = nextStageFor(assignment.completedStages || []);
  }

  await assignment.save();
  if (assignment.status === 'completed') {
    await evaluateRecheckRecommendation({ assignmentId: assignment._id });
  }
  return getRecoveryPackTeachingFlow({ assignmentId: assignment._id });
}

export default {
  buildRecoveryPackTeachingFlow,
  getRecoveryPackTeachingFlow,
  updateRecoveryPackTeachingProgress,
};
