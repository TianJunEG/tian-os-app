import RemediationSession, { REMEDIATION_STEPS } from '../../models/mathpath/RemediationSession.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import RetentionReview from '../../models/RetentionReview.js';
import Skill from '../../models/Skill.js';
import { createAssignmentFromLessonPrep } from './mathPathAssignmentService.js';
import { getPrerequisites, getSkill } from '../../shared/mathpath/fractions/fractionSkillGraph.js';
import { buildRetentionReviews } from '../../utils/fluencyEngine.js';
import Skill from '../../models/Skill.js';

const SKILL_CODE = /^[A-Z0-9][-A-Z0-9]*$/i;

const SKILL_CODE = /^[A-Z0-9][-A-Z0-9]*$/i;

const WEAK_STATUSES = new Set(['notStarted', 'needsReview', 'weak', 'forgotten']);
const WEAK_ACCURACY_THRESHOLD = 70;

function initStepProgress() {
  return REMEDIATION_STEPS.map((step) => ({ step, status: 'not_started', startedAt: null, completedAt: null, metadata: null }));
}

function markStep(session, stepName, status, metadata = null) {
  const entry = session.stepProgress.find((s) => s.step === stepName);
  if (!entry) return;
  entry.status = status;
  if (status === 'in_progress' && !entry.startedAt) entry.startedAt = new Date();
  if (status === 'completed' || status === 'skipped') entry.completedAt = new Date();
  if (metadata) entry.metadata = metadata;
}

function shapeSession(session) {
  if (!session) return null;
  const raw = typeof session.toObject === 'function' ? session.toObject() : session;
  return { ...raw, id: String(raw._id || raw.id || '') };
}

function weakSkillsFromDiagnostic(diagnostic = {}) {
  const result = diagnostic.result || diagnostic.resultPayload || {};
  const ids = [
    ...(result.weakSkillIds || []),
    ...(result.remainingWeakSkills || []),
    ...(result.assignedPracticeSkillIds || []),
    ...(diagnostic.assignedPracticeSkillIds || []),
    ...((diagnostic.perSkillSnapshot || [])
      .filter((row) => Number(row.score) < WEAK_ACCURACY_THRESHOLD)
      .map((row) => row.skillId)),
  ];
  return [...new Set(ids.map((id) => String(id || '').trim().toUpperCase()).filter(Boolean))];
}

function misconceptionIdsFromDiagnostic(diagnostic = {}, skillIds = []) {
  const result = diagnostic.result || diagnostic.resultPayload || {};
  return [...new Set([
    ...(result.misconceptionTags || []),
    ...(result.misconceptions || []).map((m) => m.misconceptionId || m.id || m),
    ...((diagnostic.perSkillSnapshot || [])
      .filter((row) => !skillIds.length || skillIds.includes(String(row.skillId || '').toUpperCase()))
      .flatMap((row) => row.misconceptionTags || [])),
  ].map((tag) => String(tag || '').trim()).filter(Boolean))];
}

// ---------------------------------------------------------------------------
// Prerequisite evaluation
// ---------------------------------------------------------------------------

export async function evaluatePrerequisites({ studentId, targetSkillIds, domainId = 'fractions' }) {
  const allPrereqs = new Set();
  for (const skillId of targetSkillIds) {
    for (const prereqId of getPrerequisites(skillId)) {
      if (!targetSkillIds.includes(prereqId)) allPrereqs.add(prereqId);
    }
  }
  if (allPrereqs.size === 0) return [];

  const states = await MathPathStudentSkillState.find({
    studentId: String(studentId),
    domainId,
    skillId: { $in: [...allPrereqs] },
  }).lean();

  const stateMap = Object.fromEntries(states.map((s) => [s.skillId, s]));
  const results = [];

  for (const prereqId of allPrereqs) {
    const state = stateMap[prereqId];
    const skill = getSkill(prereqId);
    const isWeak = !state || WEAK_STATUSES.has(state.status) || (state.accuracy || 0) < WEAK_ACCURACY_THRESHOLD;
    results.push({
      skillId: prereqId,
      skillName: skill?.name || prereqId,
      status: isWeak ? 'pending' : 'mastered',
      reason: isWeak
        ? (!state ? 'not attempted' : `status: ${state.status}, accuracy: ${state.accuracy || 0}%`)
        : '',
      currentAccuracy: state?.accuracy || 0,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Start a remediation session from a completed diagnostic
// ---------------------------------------------------------------------------

export async function startRemediationSession({ studentId, diagnosticSessionId, assignedByUserId = '', maxReteachAttempts = 3 }) {
  const sid = String(studentId || '');
  const dsId = String(diagnosticSessionId || '');

  const diagnostic = await MathPathDiagnosticSession.findOne({ diagnosticSessionId: dsId, studentId: sid, status: 'completed' });
  if (!diagnostic) {
    const err = new Error('Completed diagnostic session not found.');
    err.status = 404;
    throw err;
  }

  const existing = await RemediationSession.findOne({ studentId: sid, diagnosticSessionId: dsId });
  if (existing) {
    const err = new Error('A remediation session already exists for this diagnostic.');
    err.status = 409;
    throw err;
  }

  const targetSkillIds = weakSkillsFromDiagnostic(diagnostic);
  if (!targetSkillIds.length) {
    const err = new Error('No weak skills found in the diagnostic.');
    err.status = 400;
    throw err;
  }

  const misconceptionIds = misconceptionIdsFromDiagnostic(diagnostic, targetSkillIds);
  const prereqResults = await evaluatePrerequisites({ studentId: sid, targetSkillIds, domainId: diagnostic.domainId || 'fractions' });
  const weakPrereqs = prereqResults.filter((p) => p.status === 'pending');

  const session = await RemediationSession.create({
    studentId: sid,
    diagnosticSessionId: dsId,
    subjectId: diagnostic.subjectId || 'math',
    domainId: diagnostic.domainId || 'fractions',
    targetSkillIds,
    misconceptionIds,
    stepProgress: initStepProgress(),
    prerequisites: weakPrereqs.map((p) => ({ skillId: p.skillId, skillName: p.skillName, status: 'pending', reason: p.reason })),
    maxReteachAttempts,
    currentStep: 'diagnose',
  });

  markStep(session, 'diagnose', 'completed', { diagnosticSessionId: dsId });

  if (weakPrereqs.length > 0) {
    session.currentStep = 'simplify';
    markStep(session, 'simplify', 'in_progress');
    for (const prereq of session.prerequisites) {
      const assignment = await createAssignmentFromLessonPrep({
        studentId: sid,
        skillIds: [prereq.skillId],
        assignedByUserId: assignedByUserId || sid,
        assignedByRole: 'system',
        sourceType: 'remediation',
        sourceId: String(session._id),
        title: `Prerequisite: ${prereq.skillName}`,
        description: 'Practice a prerequisite skill before the main remediation.',
      });
      prereq.assignmentId = String(assignment.id || assignment._id);
      prereq.status = 'in_progress';
    }
  } else {
    markStep(session, 'simplify', 'skipped');
    session.currentStep = 'reteach';
    markStep(session, 'reteach', 'in_progress');
    const assignment = await createReteachAssignmentInternal(session, sid, assignedByUserId || sid);
    session.currentAssignmentId = String(assignment.id || assignment._id);
  }

  await session.save();
  return shapeSession(session);
}

// ---------------------------------------------------------------------------
// Create reteach assignment (internal helper)
// ---------------------------------------------------------------------------

async function createReteachAssignmentInternal(session, studentId, assignedByUserId) {
  const attemptNumber = session.reteachAttempts.length + 1;
  const assignment = await createAssignmentFromLessonPrep({
    studentId,
    skillIds: session.targetSkillIds,
    assignedByUserId,
    assignedByRole: 'system',
    sourceType: 'remediation',
    sourceId: String(session._id),
    title: attemptNumber > 1 ? `Recovery Pack (attempt ${attemptNumber})` : 'Recovery Pack',
    description: 'Targeted practice from your remediation journey.',
  });
  session.reteachAttempts.push({
    attemptNumber,
    assignmentId: String(assignment.id || assignment._id),
    startedAt: new Date(),
  });
  return assignment;
}

export async function createReteachAssignment({ remediationSessionId, studentId, assignedByUserId = '' }) {
  const session = await RemediationSession.findById(remediationSessionId);
  if (!session) {
    const err = new Error('Remediation session not found.');
    err.status = 404;
    throw err;
  }
  const assignment = await createReteachAssignmentInternal(session, String(studentId || session.studentId), assignedByUserId || String(session.studentId));
  session.currentAssignmentId = String(assignment.id || assignment._id);
  session.currentStep = 'reteach';
  markStep(session, 'reteach', 'in_progress');
  await session.save();
  return { session: shapeSession(session), assignment, attemptNumber: session.reteachAttempts.length };
}

// ---------------------------------------------------------------------------
// Handle mastery check result — the core loop logic
// ---------------------------------------------------------------------------

export async function handleMasteryCheckResult({ remediationSessionId, passed }) {
  const session = await RemediationSession.findById(remediationSessionId);
  if (!session || session.status !== 'active') {
    const err = new Error('Active remediation session not found.');
    err.status = 404;
    throw err;
  }

  const currentAttempt = session.reteachAttempts[session.reteachAttempts.length - 1];
  if (currentAttempt) {
    currentAttempt.masteryPassed = Boolean(passed);
    currentAttempt.completedAt = new Date();
  }

  if (passed) {
    markStep(session, 'reteach', 'completed');
    markStep(session, 'check_understanding', 'completed');
    markStep(session, 'original_complexity', 'completed');
    session.currentStep = 'schedule_review';
    markStep(session, 'schedule_review', 'in_progress');
    await session.save();
    await scheduleRemediationRetention({ remediationSessionId: String(session._id) });
    const updated = await RemediationSession.findById(session._id);
    return { session: shapeSession(updated), action: 'advanced_to_review' };
  }

  if (currentAttempt) currentAttempt.failReason = 'mastery_check_failed';

  if (session.reteachAttempts.length >= session.maxReteachAttempts) {
    markStep(session, 'original_complexity', 'in_progress', { needsTutorIntervention: true });
    await session.save();
    return { session: shapeSession(session), action: 'needs_tutor' };
  }

  const prereqResults = await evaluatePrerequisites({
    studentId: session.studentId,
    targetSkillIds: session.targetSkillIds,
    domainId: session.domainId,
  });
  const newWeakPrereqs = prereqResults.filter((p) => p.status === 'pending' && !session.prerequisites.some((e) => e.skillId === p.skillId));

  if (newWeakPrereqs.length > 0) {
    if (currentAttempt) currentAttempt.prerequisiteRouted = true;
    for (const prereq of newWeakPrereqs) {
      const entry = { skillId: prereq.skillId, skillName: prereq.skillName, status: 'in_progress', reason: prereq.reason, assignmentId: '' };
      const assignment = await createAssignmentFromLessonPrep({
        studentId: session.studentId,
        skillIds: [prereq.skillId],
        assignedByUserId: session.studentId,
        assignedByRole: 'system',
        sourceType: 'remediation',
        sourceId: String(session._id),
        title: `Prerequisite: ${prereq.skillName}`,
        description: 'Practice a prerequisite skill before the main remediation.',
      });
      entry.assignmentId = String(assignment.id || assignment._id);
      session.prerequisites.push(entry);
    }
    session.currentStep = 'simplify';
    markStep(session, 'simplify', 'in_progress');
    await session.save();
    return { session: shapeSession(session), action: 'prerequisite_reroute' };
  }

  const assignment = await createReteachAssignmentInternal(session, session.studentId, session.studentId);
  session.currentAssignmentId = String(assignment.id || assignment._id);
  session.currentStep = 'reteach';
  markStep(session, 'reteach', 'in_progress');
  await session.save();
  return { session: shapeSession(session), action: 'reteach_loop' };
}

// ---------------------------------------------------------------------------
// Advance step — check child entities and transition
// ---------------------------------------------------------------------------

export async function advanceRemediationStep({ remediationSessionId }) {
  const session = await RemediationSession.findById(remediationSessionId);
  if (!session || session.status !== 'active') {
    const err = new Error('Active remediation session not found.');
    err.status = 404;
    throw err;
  }

  if (session.currentStep === 'simplify') {
    const allDone = session.prerequisites.every((p) => p.status === 'mastered' || p.status === 'skipped');
    if (allDone) {
      markStep(session, 'simplify', 'completed');
      session.currentStep = 'reteach';
      markStep(session, 'reteach', 'in_progress');
      const assignment = await createReteachAssignmentInternal(session, session.studentId, session.studentId);
      session.currentAssignmentId = String(assignment.id || assignment._id);
    }
  }

  if (session.currentStep === 'reteach' && session.currentAssignmentId) {
    const assignment = await MathPathAssignment.findById(session.currentAssignmentId).lean();
    if (assignment) {
      const pastVisual = (assignment.completedStages || []).some((s) => s === 'visual_explanation' || s === 'worked_example');
      if (pastVisual) {
        markStep(session, 'reteach', 'completed');
        session.currentStep = 'check_understanding';
        markStep(session, 'check_understanding', 'in_progress');
      }
    }
  }

  if (session.currentStep === 'check_understanding' && session.currentAssignmentId) {
    const assignment = await MathPathAssignment.findById(session.currentAssignmentId).lean();
    if (assignment && (assignment.completedStages || []).includes('guided_practice')) {
      markStep(session, 'check_understanding', 'completed');
      session.currentStep = 'original_complexity';
      markStep(session, 'original_complexity', 'in_progress');
    }
  }

  await session.save();
  return shapeSession(session);
}

// ---------------------------------------------------------------------------
// Retention scheduling
// ---------------------------------------------------------------------------

async function resolveSkillDoc(code) {
  const value = String(code || '').trim().toUpperCase();
  if (!value) return null;
  if (SKILL_CODE.test(value)) {
    return Skill.findOne({
      $or: [
        { 'metadata.mathPathSkillId': value },
        { 'metadata.frameworkCode': value },
        { slug: value },
      ],
    });
  }
  return Skill.findById(value);
}

export async function scheduleRemediationRetention({ remediationSessionId }) {
  const session = await RemediationSession.findById(remediationSessionId);
  if (!session) {
    const err = new Error('Remediation session not found.');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const entries = [];

  for (const skillCode of session.targetSkillIds) {
    const graphSkill = getSkill(skillCode);
    const skillDoc = await resolveSkillDoc(skillCode);
    if (!skillDoc) continue;

    const reviews = buildRetentionReviews({
      studentId: session.studentId,
      skillCode,
      skillId: skillDoc._id,
      fluentAt: now,
    });

    for (const review of reviews) {
      await RetentionReview.updateOne(
        { studentId: session.studentId, skillId: skillDoc._id, intervalDays: review.intervalDays },
        { $setOnInsert: { ...review, skillName: graphSkill?.name || skillDoc.name || skillCode } },
        { upsert: true },
      );
      const doc = await RetentionReview.findOne({ studentId: session.studentId, skillId: skillDoc._id, intervalDays: review.intervalDays }).lean();
      if (doc) {
        entries.push({ skillId: skillCode, retentionReviewId: String(doc._id), intervalDays: review.intervalDays, scheduledDate: review.reviewDate });
      }
    }
  }

  session.retentionEntries = entries;
  markStep(session, 'schedule_review', 'completed');
  session.status = 'completed';
  session.completedAt = now;
  await session.save();
  return { session: shapeSession(session), retentionReviews: entries };
}

// ---------------------------------------------------------------------------
// Skip prerequisite (tutor/parent action)
// ---------------------------------------------------------------------------

export async function skipPrerequisite({ remediationSessionId, skillId }) {
  const session = await RemediationSession.findById(remediationSessionId);
  if (!session || session.status !== 'active') {
    const err = new Error('Active remediation session not found.');
    err.status = 404;
    throw err;
  }
  const entry = session.prerequisites.find((p) => p.skillId === skillId);
  if (!entry) {
    const err = new Error('Prerequisite not found in this session.');
    err.status = 404;
    throw err;
  }
  entry.status = 'skipped';
  await session.save();
  return advanceRemediationStep({ remediationSessionId: String(session._id) });
}

// ---------------------------------------------------------------------------
// Notify hook — called when any assignment completes
// ---------------------------------------------------------------------------

export async function notifyRemediationOfAssignmentCompletion({ assignmentId }) {
  try {
    const session = await RemediationSession.findOne({ currentAssignmentId: String(assignmentId), status: 'active' });
    if (!session) {
      const prereqEntry = await RemediationSession.findOne({ 'prerequisites.assignmentId': String(assignmentId), status: 'active' });
      if (prereqEntry) {
        const entry = prereqEntry.prerequisites.find((p) => p.assignmentId === String(assignmentId));
        if (entry) {
          const prereqAssignment = await MathPathAssignment.findById(assignmentId).lean();
          const prereqPassed = prereqAssignment?.masteryCheckProgress?.passed === true;
          entry.status = prereqPassed ? 'mastered' : 'in_progress';
          await prereqEntry.save();
          if (prereqPassed) {
            await advanceRemediationStep({ remediationSessionId: String(prereqEntry._id) });
          }
        }
      }
      return;
    }

    const assignment = await MathPathAssignment.findById(assignmentId).lean();
    if (!assignment || assignment.status !== 'completed') return;

    const masteryPassed = assignment.masteryCheckProgress?.passed === true;
    await handleMasteryCheckResult({ remediationSessionId: String(session._id), passed: masteryPassed });
  } catch (err) {
    console.error('[remediationSession] notifyRemediationOfAssignmentCompletion error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export async function getRemediationSessionStatus({ remediationSessionId }) {
  const session = await RemediationSession.findById(remediationSessionId).lean();
  if (!session) {
    const err = new Error('Remediation session not found.');
    err.status = 404;
    throw err;
  }

  const completedCount = (session.stepProgress || []).filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  const totalSteps = REMEDIATION_STEPS.length;

  const steps = REMEDIATION_STEPS.map((step) => {
    const progress = (session.stepProgress || []).find((s) => s.step === step);
    return {
      step,
      label: stepLabel(step),
      status: progress?.status || 'not_started',
      startedAt: progress?.startedAt || null,
      completedAt: progress?.completedAt || null,
      metadata: progress?.metadata || null,
    };
  });

  return {
    session: { ...session, id: String(session._id) },
    steps,
    percentComplete: Math.round((completedCount / totalSteps) * 100),
    currentStep: session.currentStep,
    currentAssignmentId: session.currentAssignmentId || null,
  };
}

export async function getStudentRemediationSessions({ studentId, status }) {
  const filter = { studentId: String(studentId || '') };
  if (status) filter.status = status;
  const sessions = await RemediationSession.find(filter).sort({ createdAt: -1 }).lean();
  return sessions.map((s) => ({ ...s, id: String(s._id) }));
}

function stepLabel(step) {
  const labels = {
    diagnose: 'Diagnose',
    simplify: 'Simplify',
    reteach: 'Re-teach',
    check_understanding: 'Check Understanding',
    original_complexity: 'Original Complexity',
    schedule_review: 'Schedule Review',
  };
  return labels[step] || step;
}

export default {
  startRemediationSession,
  evaluatePrerequisites,
  createReteachAssignment,
  handleMasteryCheckResult,
  advanceRemediationStep,
  scheduleRemediationRetention,
  skipPrerequisite,
  notifyRemediationOfAssignmentCompletion,
  getRemediationSessionStatus,
  getStudentRemediationSessions,
};
