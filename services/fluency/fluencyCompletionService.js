import FluencyRecord from '../../models/FluencyRecord.js';
import PracticeAttempt from '../../models/PracticeAttempt.js';
import RetentionReview from '../../models/RetentionReview.js';
import Skill from '../../models/Skill.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import {
  buildRetentionReviews,
  calculateFluencyMetrics,
  FLUENCY_STATUS,
} from '../../utils/fluencyEngine.js';

const SKILL_CODE = /^F\d{3}$/i;

export function skillCodeFor(skill) {
  return skill?.metadata?.mathPathSkillId || skill?.metadata?.frameworkCode || skill?.slug || String(skill?._id || '');
}

export async function resolveFluencySkill(ref) {
  const value = String(ref || '').trim();
  if (!value) return null;
  if (SKILL_CODE.test(value)) {
    return Skill.findOne({
      $or: [
        { 'metadata.mathPathSkillId': value.toUpperCase() },
        { 'metadata.frameworkCode': value.toUpperCase() },
        { slug: value.toUpperCase() },
      ],
    });
  }
  return Skill.findById(value);
}

function fluencyLevelFromStatus(fluencyStatus) {
  if (fluencyStatus === FLUENCY_STATUS.FLUENT) return 'gold';
  if (fluencyStatus === FLUENCY_STATUS.DEVELOPING) return 'silver';
  return 'bronze';
}

async function upsertRetentionReviews({ student, skill, skillCode, fluentAt }) {
  const reviews = buildRetentionReviews({
    studentId: String(student._id),
    skillId: skill._id,
    skillCode,
    fluentAt,
  });
  for (const review of reviews) {
    await RetentionReview.updateOne(
      { studentId: student._id, skillId: skill._id, intervalDays: review.intervalDays },
      {
        $setOnInsert: {
          ...review,
          studentId: student._id,
          skillId: skill._id,
          skillName: skill.name,
        },
      },
      { upsert: true }
    );
  }
  // Mirror retention schedule onto skill state for fractions skills (F-code).
  const firstReview = reviews[0];
  if (firstReview && SKILL_CODE.test(skillCode)) {
    await MathPathStudentSkillState.findOneAndUpdate(
      { studentId: String(student._id), domainId: 'fractions', skillId: skillCode },
      { $set: { retentionStatus: 'reviewScheduled', nextReviewDate: firstReview.reviewDate } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

export function attemptsForFluencyMetrics(attempts = []) {
  return attempts.map((attempt) => ({
    questionId: String(attempt.questionId || ''),
    answer: attempt.answer,
    correct: attempt.correct,
    confidence: attempt.confidence,
    skipped: attempt.skipped,
    workingSubmitted: attempt.workingSubmitted || attempt.workingUploaded || attempt.fullscreenWorkingSubmitted,
    timeMs: attempt.timeMs,
    timeTakenSeconds: attempt.timeTakenSeconds,
    questionStartTime: attempt.questionStartTime,
    questionSubmitTime: attempt.questionSubmitTime,
  }));
}

export async function updateFluencyCompletionForSession({ session, student, skill = null, completedAt = new Date() } = {}) {
  if (!session || session.mode !== 'fluency') return null;
  const resolvedSkill = skill || await Skill.findById(session.skillIds?.[0]);
  if (!resolvedSkill) return null;

  const storedAttempts = await PracticeAttempt.find({ sessionId: session._id }).lean();
  const skillCode = skillCodeFor(resolvedSkill);
  const targetSeconds = resolvedSkill?.metadata?.fluency?.targetSeconds || 10;
  const metrics = calculateFluencyMetrics({
    skillCode,
    attempts: attemptsForFluencyMetrics(storedAttempts),
    targetSeconds,
  });
  const previous = await FluencyRecord.findOne({ studentId: student._id, skillId: resolvedSkill._id });
  const history = Array.isArray(previous?.history) ? previous.history : [];
  const alreadyRecorded = history.some((entry) => String(entry?.sessionId || '') === String(session._id));
  const becameFluentNow = !alreadyRecorded
    && metrics.fluencyStatus === FLUENCY_STATUS.FLUENT
    && previous?.fluencyStatus !== FLUENCY_STATUS.FLUENT;

  const update = {
    $set: {
      skillCode,
      skillName: resolvedSkill.name,
      totalQuestions: metrics.totalQuestions,
      correctAnswers: metrics.correctAnswers,
      accuracy: metrics.accuracy,
      averageTimeSeconds: metrics.averageTimeSeconds,
      confidenceAverage: metrics.confidenceAverage,
      workingSubmissionRate: metrics.workingSubmissionRate,
      fluencyScore: metrics.fluencyScore,
      fluencyStatus: metrics.fluencyStatus,
      ...(becameFluentNow ? { becameFluentAt: completedAt } : {}),
    },
  };

  if (!alreadyRecorded) {
    update.$push = {
      history: {
        sessionId: String(session._id),
        completedAt,
        ...metrics,
      },
    };
  }

  const record = await FluencyRecord.findOneAndUpdate(
    { studentId: student._id, skillId: resolvedSkill._id },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Mirror fluency level onto skill state for fractions skills (F-code).
  if (SKILL_CODE.test(skillCode)) {
    const skillStateSet = {
      fluencyLevel: fluencyLevelFromStatus(metrics.fluencyStatus),
      ...(becameFluentNow ? { fluentAt: completedAt, status: 'fluent' } : {}),
    };
    await MathPathStudentSkillState.findOneAndUpdate(
      { studentId: String(student._id), domainId: 'fractions', skillId: skillCode },
      { $set: skillStateSet },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (becameFluentNow) {
    await upsertRetentionReviews({ student, skill: resolvedSkill, skillCode, fluentAt: completedAt });
  }

  return {
    skill: resolvedSkill,
    metrics,
    record,
    retentionScheduled: becameFluentNow,
    alreadyRecorded,
  };
}
