import mongoose from 'mongoose';
import Mistake from '../../models/Mistake.js';
import Student from '../../models/Student.js';
import MathPathWorkingIntelligence from '../../models/mathpath/MathPathWorkingIntelligence.js';

export function createLinkId(prefix = 'link') {
  return `${prefix}_${new mongoose.Types.ObjectId().toString()}`;
}

export function normalizeLinkId(value = '') {
  return String(value || '').trim();
}

export function attemptIdFromAttempt(attempt = {}) {
  return normalizeLinkId(attempt.attemptId || attempt._id || attempt.id);
}

export function directWorkingLookupForMistake(mistake = {}) {
  const workingId = normalizeLinkId(mistake.workingId);
  if (workingId) return { query: { workingId }, strategy: 'workingId' };

  const attemptId = normalizeLinkId(mistake.attemptId);
  if (attemptId) return { query: { attemptId }, strategy: 'attemptId' };

  const mistakeId = normalizeLinkId(mistake.mistakeId || mistake._id || mistake.id);
  if (mistakeId) return { query: { mistakeId }, strategy: 'mistakeId' };

  return { query: null, strategy: 'missing_direct_link' };
}

export function legacyWorkingLookupForMistake(mistake = {}, studentId = '') {
  const student = normalizeLinkId(studentId || mistake.studentId);
  const questionId = normalizeLinkId(mistake.questionId);
  if (!student || !questionId) return null;
  return {
    studentId: student,
    questionId,
    ...(mistake.sessionId ? { sessionId: normalizeLinkId(mistake.sessionId) } : {}),
  };
}

async function legacyStudentIdCandidates(studentId = '') {
  const canonical = normalizeLinkId(studentId);
  if (!canonical) return [];
  const ids = [canonical];
  if (mongoose.Types.ObjectId.isValid(canonical)) {
    const student = await Student.findById(canonical).select('userId').lean();
    if (student?.userId) ids.push(String(student.userId));
  }
  return [...new Set(ids.filter(Boolean))];
}

export async function findWorkingInsightForMistake(mistake = {}, studentId = '') {
  const direct = directWorkingLookupForMistake(mistake);
  if (direct.query) {
    const record = await MathPathWorkingIntelligence.findOne(direct.query).sort({ updatedAt: -1 }).lean();
    if (record) {
      console.info('[working-linkage] working_link_created', {
        strategy: direct.strategy,
        mistakeId: normalizeLinkId(mistake._id || mistake.id || mistake.mistakeId),
        workingId: record.workingId,
        attemptId: record.attemptId || '',
      });
      return record;
    }
  }

  const legacy = legacyWorkingLookupForMistake(mistake, studentId);
  if (!legacy) {
    console.warn('[working-linkage] working_link_missing', {
      reason: 'no_direct_or_legacy_keys',
      mistakeId: normalizeLinkId(mistake._id || mistake.id || mistake.mistakeId),
    });
    return null;
  }

  const studentIds = await legacyStudentIdCandidates(legacy.studentId);
  const record = await MathPathWorkingIntelligence.findOne({
    ...legacy,
    // TODO(working-linkage-migration): remove User-id fallback once legacy working records are backfilled.
    studentId: { $in: studentIds.length ? studentIds : [legacy.studentId] },
  }).sort({ updatedAt: -1 }).lean();
  if (!record) {
    console.warn('[working-linkage] working_link_missing', {
      reason: 'legacy_lookup_empty',
      mistakeId: normalizeLinkId(mistake._id || mistake.id || mistake.mistakeId),
      questionId: legacy.questionId,
      sessionId: legacy.sessionId || '',
    });
    return null;
  }

  console.warn('[working-linkage] working_link_created', {
    strategy: 'legacy_student_question_session',
    mistakeId: normalizeLinkId(mistake._id || mistake.id || mistake.mistakeId),
    workingId: record.workingId,
    attemptId: record.attemptId || '',
  });
  return record;
}

export function shapeWorkingLinkFields(record = {}) {
  const insight = record.workingInsight || record.workingAnalysisResult || null;
  return {
    attemptId: normalizeLinkId(record.attemptId),
    workingId: normalizeLinkId(record.workingId || insight?.workingId),
    workingPreviewImage: record.workingPreviewImage || record.rawImage || record.rawImages?.[0] || '',
    extractedWorkingText: record.extractedWorkingText || insight?.extractedWorkingText || record.ocrOutput?.rawText || '',
    workingInsight: insight,
    workingAnalysisResult: record.workingAnalysisResult || insight,
    workingQualityScore: record.workingQualityScore ?? insight?.workingQualityScore ?? null,
    workingQualityBand: record.workingQualityBand || record.qualityBand || insight?.qualityBand || '',
  };
}

export async function linkWorkingInsightToMistake(record = {}) {
  if (record.answerCorrect === true) return null;

  const workingId = normalizeLinkId(record.workingId);
  const attemptId = normalizeLinkId(record.attemptId);
  const mistakeId = normalizeLinkId(record.mistakeId);
  const directQueries = [
    attemptId ? { attemptId } : null,
    mistakeId ? { _id: mistakeId } : null,
    mistakeId ? { mistakeId } : null,
    workingId ? { workingId } : null,
  ].filter(Boolean);

  let mistake = null;
  let strategy = '';
  for (const query of directQueries) {
    mistake = await Mistake.findOne(query);
    if (mistake) {
      strategy = Object.keys(query)[0];
      break;
    }
  }

  if (!mistake) {
    const legacy = legacyWorkingLookupForMistake(record, record.studentId);
    if (legacy) {
      mistake = await Mistake.findOne(legacy);
      strategy = mistake ? 'legacy_student_question_session' : '';
    }
  }

  if (!mistake) {
    console.warn('[working-linkage] mistake_link_missing', {
      workingId,
      attemptId,
      questionId: normalizeLinkId(record.questionId),
      sessionId: normalizeLinkId(record.sessionId || record.practiceSessionId || record.assessmentSessionId || record.workingSessionId),
    });
    return null;
  }

  Object.assign(mistake, {
    attemptId: attemptId || mistake.attemptId || '',
    workingId,
    workingPreviewImage: record.rawImage || record.rawImages?.[0] || mistake.workingPreviewImage || '',
    extractedWorkingText: record.workingInsight?.extractedWorkingText || record.ocrOutput?.rawText || mistake.extractedWorkingText || '',
    workingInsight: record.workingInsight || mistake.workingInsight || null,
    workingAnalysisResult: record.workingInsight || mistake.workingAnalysisResult || null,
    workingQualityScore: record.workingQualityScore ?? record.workingInsight?.workingQualityScore ?? mistake.workingQualityScore ?? null,
    workingQualityBand: record.qualityBand || record.workingInsight?.qualityBand || mistake.workingQualityBand || '',
  });
  await mistake.save();

  if (workingId) {
    await MathPathWorkingIntelligence.updateOne(
      { workingId },
      {
        $set: {
          mistakeId: String(mistake._id),
          attemptId: attemptId || mistake.attemptId || '',
        },
      }
    );
  }

  console.info('[working-linkage] mistake_link_created', {
    strategy,
    mistakeId: String(mistake._id),
    workingId,
    attemptId: attemptId || mistake.attemptId || '',
  });

  return mistake;
}

export function validateLearningChain({ attempt = null, working = null, mistake = null, remediation = null } = {}) {
  const broken = [];
  const attemptId = attemptIdFromAttempt(attempt || {});
  if (working && attemptId && normalizeLinkId(working.attemptId) !== attemptId) broken.push('working_attempt_mismatch');
  if (mistake && attemptId && normalizeLinkId(mistake.attemptId) !== attemptId) broken.push('mistake_attempt_mismatch');
  if (mistake && working && normalizeLinkId(mistake.workingId) && normalizeLinkId(mistake.workingId) !== normalizeLinkId(working.workingId)) {
    broken.push('mistake_working_mismatch');
  }
  if (remediation && mistake && normalizeLinkId(remediation.mistakeId) && normalizeLinkId(remediation.mistakeId) !== normalizeLinkId(mistake._id || mistake.id || mistake.mistakeId)) {
    broken.push('remediation_mistake_mismatch');
  }
  return { ok: broken.length === 0, broken };
}
