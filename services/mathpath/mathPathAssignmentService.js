import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import Student from '../../models/Student.js';
import { startAdaptiveDiagnostic } from '../diagnostics/diagnosticRuntime.js';
import { evaluateRecheckReadiness } from './recheckRecommendationService.js';
import {
  attachLearningPathToAssignmentPayload,
  getOrCreateLearningPathForSkillMisconception,
  updateAssignmentLearningPathProgress,
} from './learningPathService.js';
import { deriveAssignmentAssetMetadata } from './recoveryPackAssetService.js';

function uniqueSkillIds(values = []) {
  return [...new Set((values || [])
    .map((value) => String(value || '').trim().toUpperCase())
    .filter(Boolean))];
}

function roleFor(user = {}, fallback = '') {
  return String(fallback || user.role || 'system');
}

function targetCountFor(skillIds = []) {
  const count = skillIds.length;
  if (count <= 1) return 12;
  if (count <= 3) return 16;
  return 20;
}

function weakSkillsFromDiagnostic(session = {}) {
  const result = session.result || session.resultPayload || {};
  return uniqueSkillIds([
    ...(result.weakSkillIds || []),
    ...(result.remainingWeakSkills || []),
    ...(result.assignedPracticeSkillIds || []),
    ...(session.assignedPracticeSkillIds || []),
    ...((session.perSkillSnapshot || [])
      .filter((row) => Number(row.score) < 70)
      .map((row) => row.skillId)),
  ]);
}

function weakSkillsFromPaper(analysis = {}) {
  const confirmed = (analysis.detectedQuestions || [])
    .filter((question) => question.adultConfirmedWrong || question.teacherMarkedCorrect === false)
    .flatMap((question) => question.detectedSkillIds || []);
  return uniqueSkillIds([...(analysis.weakSkillIds || []), ...confirmed]);
}

function misconceptionFromDiagnostic(session = {}, skillId = '') {
  const row = (session.perSkillSnapshot || []).find((item) => item.skillId === skillId);
  return row?.misconceptionTags?.[0] || '';
}

function misconceptionFromPaper(analysis = {}, skillId = '') {
  const row = (analysis.detectedQuestions || []).find((question) => {
    const skills = question.detectedSkillIds || [];
    return skills.includes(skillId) && (question.adultConfirmedWrong || question.teacherMarkedCorrect === false);
  });
  return row?.misconceptionTags?.[0] || '';
}

async function withPersistedLearningPath(payload = {}, { misconceptionId = '' } = {}) {
  const firstSkillId = payload.skillIds?.[0] || '';
  const enriched = attachLearningPathToAssignmentPayload(payload, { misconceptionId });
  if (!firstSkillId) return enriched;
  await getOrCreateLearningPathForSkillMisconception({
    skillId: firstSkillId,
    misconceptionId,
    subjectId: enriched.subjectId || 'math',
    domainId: enriched.domainId || 'fractions',
  });
  return enriched;
}

function misconceptionIdsFromDiagnostic(session = {}, skillIds = []) {
  const result = session.result || session.resultPayload || {};
  return [...new Set([
    ...(result.misconceptionTags || []),
    ...(result.misconceptions || []).map((item) => item.misconceptionId || item.id || item),
    ...((session.perSkillSnapshot || [])
      .filter((row) => !skillIds.length || skillIds.includes(String(row.skillId || '').toUpperCase()))
      .flatMap((row) => row.misconceptionTags || [])),
  ].map((tag) => String(tag || '').trim()).filter(Boolean))];
}

function misconceptionIdsFromPaper(analysis = {}, skillIds = []) {
  return [...new Set((analysis.detectedQuestions || [])
    .filter((question) => !skillIds.length || (question.detectedSkillIds || []).some((skillId) => skillIds.includes(String(skillId || '').toUpperCase())))
    .flatMap((question) => question.misconceptionTags || [])
    .map((tag) => String(tag || '').trim())
    .filter(Boolean))];
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

export async function createAssignmentFromDiagnostic({
  studentId,
  diagnosticSessionId,
  assignedByUserId,
  assignedByRole = 'system',
} = {}) {
  const diagnostic = await MathPathDiagnosticSession.findOne({
    diagnosticSessionId,
    studentId: String(studentId || ''),
    status: 'completed',
  });
  if (!diagnostic) {
    const err = new Error('Completed diagnostic session not found.');
    err.status = 404;
    throw err;
  }
  const skillIds = weakSkillsFromDiagnostic(diagnostic);
  if (!skillIds.length) {
    const err = new Error('No weak skills are available for this diagnostic.');
    err.status = 400;
    throw err;
  }
  const assetMetadata = deriveAssignmentAssetMetadata({
    skillIds,
    misconceptionIds: misconceptionIdsFromDiagnostic(diagnostic, skillIds),
    evidenceSource: {
      sourceType: 'diagnostic',
      sourceId: String(diagnostic.diagnosticSessionId),
      studentExplanation: 'Your diagnostic found skills that need more practice. This Recovery Pack starts with an example, then gives guided practice before a recheck.',
    },
  });
  const payload = await withPersistedLearningPath({
    studentId: String(studentId),
    assignedByUserId: String(assignedByUserId || ''),
    assignedByRole,
    sourceType: 'diagnostic',
    sourceId: String(diagnostic.diagnosticSessionId),
    subjectId: diagnostic.subjectId || 'math',
    domainId: diagnostic.domainId || 'fractions',
    title: 'Fractions Recovery Pack',
    description: 'Targeted practice based on the latest diagnostic weak skills.',
    skillIds,
    ...assetMetadata,
    targetQuestionCount: targetCountFor(skillIds),
    completion: {
      questionsAssigned: targetCountFor(skillIds),
      questionsAttempted: 0,
      correctCount: 0,
      accuracy: 0,
    },
  }, { misconceptionId: misconceptionFromDiagnostic(diagnostic, skillIds[0]) });
  const assignment = await MathPathAssignment.create(payload);
  return shapeAssignment(assignment);
}

export async function createAssignmentFromPaperAnalysis({
  paperAnalysisId,
  assignedByUserId,
  assignedByRole = 'system',
} = {}) {
  const analysis = await PaperAnalysis.findById(paperAnalysisId);
  if (!analysis) {
    const err = new Error('Paper analysis not found.');
    err.status = 404;
    throw err;
  }
  const skillIds = weakSkillsFromPaper(analysis);
  if (!skillIds.length) {
    const err = new Error('Confirm at least one wrong question before assigning practice.');
    err.status = 400;
    throw err;
  }
  const status = String(analysis.status || '');
  if (!['needs_review', 'reviewed', 'assigned'].includes(status)) {
    const err = new Error('Review the paper analysis before assigning practice.');
    err.status = 409;
    throw err;
  }
  const assetMetadata = deriveAssignmentAssetMetadata({
    skillIds,
    misconceptionIds: misconceptionIdsFromPaper(analysis, skillIds),
    evidenceSource: {
      sourceType: 'paper_analysis',
      sourceId: String(analysis._id),
      studentExplanation: 'An uploaded paper showed questions to strengthen. This Recovery Pack teaches the method, then checks it again.',
    },
  });
  const payload = await withPersistedLearningPath({
    studentId: String(analysis.studentId),
    assignedByUserId: String(assignedByUserId || ''),
    assignedByRole,
    sourceType: 'paper_analysis',
    sourceId: String(analysis._id),
    subjectId: analysis.subjectId || 'math',
    domainId: analysis.domainId || 'fractions',
    title: 'Paper Recovery Pack',
    description: 'Targeted practice based on confirmed wrong questions from an uploaded paper.',
    skillIds,
    ...assetMetadata,
    targetQuestionCount: targetCountFor(skillIds),
    completion: {
      questionsAssigned: targetCountFor(skillIds),
      questionsAttempted: 0,
      correctCount: 0,
      accuracy: 0,
    },
  }, { misconceptionId: misconceptionFromPaper(analysis, skillIds[0]) });
  const assignment = await MathPathAssignment.create(payload);
  analysis.status = 'assigned';
  analysis.weakSkillIds = skillIds;
  analysis.recommendedActions = (analysis.recommendedActions || []).map((action) => {
    const row = typeof action?.toObject === 'function' ? action.toObject() : action;
    return row.type === 'assign_practice'
      ? { ...row, status: 'assigned' }
      : action
  });
  analysis.linkedPracticeAssignmentIds = [...new Set([
    ...(analysis.linkedPracticeAssignmentIds || []).map(String),
    String(assignment._id),
  ])];
  await analysis.save();
  return shapeAssignment(assignment);
}

export async function createAssignmentFromLessonPrep({
  studentId,
  skillIds = [],
  assignedByUserId,
  assignedByRole = 'tutor',
  sourceType = 'tutor',
  sourceId = '',
  subjectId = 'math',
  domainId = 'fractions',
  title = 'Tutor Recovery Pack',
  description = 'Targeted practice assigned from tutor lesson prep.',
} = {}) {
  const normalizedSkillIds = uniqueSkillIds(skillIds);
  if (!normalizedSkillIds.length) {
    const err = new Error('At least one weak skill is required before assigning a Recovery Pack.');
    err.status = 400;
    throw err;
  }
  const targetQuestionCount = targetCountFor(normalizedSkillIds);
  const assetMetadata = deriveAssignmentAssetMetadata({
    skillIds: normalizedSkillIds,
    evidenceSource: {
      sourceType,
      sourceId: sourceId || `lesson_prep_${Date.now()}`,
      studentExplanation: 'This Recovery Pack was chosen from your lesson plan to help you practise the next skill clearly.',
    },
  });
  const payload = await withPersistedLearningPath({
    studentId: String(studentId || ''),
    assignedByUserId: String(assignedByUserId || ''),
    assignedByRole,
    sourceType,
    sourceId: assetMetadata.evidenceSource.sourceId,
    subjectId,
    domainId,
    title,
    description,
    skillIds: normalizedSkillIds,
    ...assetMetadata,
    targetQuestionCount,
    completion: {
      questionsAssigned: targetQuestionCount,
      questionsAttempted: 0,
      correctCount: 0,
      accuracy: 0,
    },
  });
  const assignment = await MathPathAssignment.create(payload);
  return shapeAssignment(assignment);
}

export async function getStudentAssignments({ studentId, status } = {}) {
  const filter = { studentId: String(studentId || '') };
  if (status) filter.status = status;
  const assignments = await MathPathAssignment.find(filter).sort({ createdAt: -1 }).lean();
  return assignments.map(shapeAssignment);
}

export async function getAssignmentById(assignmentId) {
  const assignment = await MathPathAssignment.findById(assignmentId).lean();
  return shapeAssignment(assignment);
}

export async function updateAssignmentProgress({ assignmentId, attempt } = {}) {
  const assignment = await MathPathAssignment.findById(assignmentId);
  if (!assignment) {
    const err = new Error('MathPath assignment not found.');
    err.status = 404;
    throw err;
  }
  const attempts = attempt
    ? [attempt]
    : await MathPathAttempt.find({ assignmentId: String(assignment._id) }).lean();
  const existingAttempted = Number(assignment.completion?.questionsAttempted || 0);
  const existingCorrect = Number(assignment.completion?.correctCount || 0);
  const attempted = attempt ? existingAttempted + 1 : attempts.length;
  const correct = attempt
    ? existingCorrect + (attempt.answerCorrect || attempt.correct ? 1 : 0)
    : attempts.filter((row) => row.answerCorrect || row.correct).length;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  assignment.completion = {
    ...(assignment.completion || {}),
    questionsAssigned: assignment.completion?.questionsAssigned || assignment.targetQuestionCount,
    questionsAttempted: attempted,
    correctCount: correct,
    accuracy,
    completedAt: assignment.completion?.completedAt || null,
  };
  if (assignment.status === 'assigned') assignment.status = 'in_progress';
  if (attempted >= Number(assignment.targetQuestionCount || 0)) {
    assignment.status = 'completed';
    assignment.completion.completedAt = assignment.completion.completedAt || new Date();
  }
  await updateAssignmentLearningPathProgress(assignment);
  await assignment.save();
  await evaluateRecheckRecommendation({ assignmentId: assignment._id });
  return shapeAssignment(await MathPathAssignment.findById(assignment._id).lean());
}

export async function evaluateRecheckRecommendation({ assignmentId } = {}) {
  const assignment = await MathPathAssignment.findById(assignmentId);
  if (!assignment) {
    const err = new Error('MathPath assignment not found.');
    err.status = 404;
    throw err;
  }
  await updateAssignmentLearningPathProgress(assignment);
  const readiness = evaluateRecheckReadiness(assignment);
  const { recommended, reason } = readiness;
  if (recommended && !assignment.recheck?.recommended) {
    assignment.recheck = {
      ...(assignment.recheck || {}),
      recommended: true,
      recommendedAt: new Date(),
      reason,
    };
    await assignment.save();
  }
  return {
    recommended,
    reason: reason || assignment.recheck?.reason || 'Keep practising before recheck.',
    readiness,
    assignment: shapeAssignment(assignment),
  };
}

export async function createRecheckForAssignment({ assignmentId, requestedByUserId } = {}) {
  const assignment = await MathPathAssignment.findById(assignmentId);
  if (!assignment) {
    const err = new Error('MathPath assignment not found.');
    err.status = 404;
    throw err;
  }
  const recommendation = await evaluateRecheckRecommendation({ assignmentId });
  if (!recommendation.recommended) {
    const err = new Error('Complete the recovery pack before creating a recheck.');
    err.status = 409;
    err.payload = recommendation;
    throw err;
  }
  const student = await Student.findById(assignment.studentId);
  if (!student) {
    const err = new Error('Student not found.');
    err.status = 404;
    throw err;
  }
  if (assignment.recheck?.diagnosticSessionId) {
    return {
      created: false,
      diagnosticSessionId: assignment.recheck.diagnosticSessionId,
      assignment: shapeAssignment(assignment),
      message: 'Recheck already exists for this assignment.',
    };
  }
  const diagnostic = await startAdaptiveDiagnostic({
    student,
    userId: requestedByUserId || assignment.assignedByUserId,
    subjectId: assignment.subjectId || 'math',
    domainId: assignment.domainId || 'fractions',
    startSkillId: assignment.skillIds?.[0] || '',
    diagnosticPurpose: 'recheck',
    enforceReplay: false,
  });
  assignment.recheck = {
    ...(assignment.recheck || {}),
    recommended: true,
    recommendedAt: assignment.recheck?.recommendedAt || new Date(),
    diagnosticSessionId: diagnostic.sessionId,
    reason: assignment.recheck?.reason || 'Recovery pack is ready for recheck.',
  };
  await assignment.save();
  await MathPathDiagnosticSession.findOneAndUpdate(
    { diagnosticSessionId: diagnostic.sessionId },
    {
      $set: {
        assignmentId: String(assignment._id),
        sourceType: 'assignment',
        sourceId: String(assignment._id),
        targetSkillIds: assignment.skillIds || [],
      },
    }
  );
  return {
    created: true,
    diagnosticSessionId: diagnostic.sessionId,
    diagnostic,
    assignment: shapeAssignment(assignment),
  };
}

export function resolveAssignedByRole(req) {
  return roleFor(req?.user, req?.body?.assignedByRole);
}
