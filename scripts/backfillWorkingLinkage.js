import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathWorkingIntelligence from '../models/mathpath/MathPathWorkingIntelligence.js';
import Mistake from '../models/Mistake.js';
import Student from '../models/Student.js';

const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';

function id(value = '') {
  return String(value || '').trim();
}

async function ensureAttemptId(attempt = null) {
  if (!attempt?._id) return '';
  if (attempt.attemptId) return attempt.attemptId;
  const attemptId = `attempt_${String(attempt._id)}`;
  await MathPathAttempt.updateOne({ _id: attempt._id }, { $set: { attemptId } });
  return attemptId;
}

async function main() {
  await mongoose.connect(uri);
  const report = {
    scanned: 0,
    updated: 0,
    alreadyCanonical: 0,
    unresolved: 0,
    linkedRecords: 0,
    unlinkedRecords: 0,
    confidence: { high: 0, medium: 0, low: 0 },
    missing: [],
  };

  const allWorkings = await MathPathWorkingIntelligence.find({}).lean();
  report.scanned = allWorkings.length;
  for (const working of allWorkings) {
    const currentStudentId = id(working.studentId);
    const existingStudent = mongoose.Types.ObjectId.isValid(currentStudentId)
      ? await Student.findById(currentStudentId).select('_id').lean()
      : null;
    if (existingStudent) {
      report.alreadyCanonical += 1;
      continue;
    }

    const resolvedStudent = mongoose.Types.ObjectId.isValid(currentStudentId)
      ? await Student.findOne({ userId: currentStudentId }).select('_id userId').lean()
      : null;
    if (!resolvedStudent) {
      report.unresolved += 1;
      report.missing.push({ type: 'working_student_id', workingId: working.workingId, studentId: currentStudentId });
      continue;
    }

    await MathPathWorkingIntelligence.updateOne(
      { _id: working._id },
      {
        $set: {
          userId: currentStudentId,
          studentId: String(resolvedStudent._id),
          linkageMetadata: {
            ...(working.linkageMetadata || {}),
            legacyStudentId: currentStudentId,
            migratedAt: new Date().toISOString(),
            migration: 'working_user_to_student_id',
          },
        },
      }
    );
    report.updated += 1;
  }

  const workings = await MathPathWorkingIntelligence.find({ $or: [{ attemptId: '' }, { attemptId: { $exists: false } }] }).lean();
  for (const working of workings) {
    const attempt = await MathPathAttempt.findOne({
      studentId: id(working.studentId),
      questionId: id(working.questionId),
      sessionId: { $in: [id(working.sessionId), id(working.practiceSessionId), id(working.assessmentSessionId), id(working.workingSessionId)].filter(Boolean) },
    }).sort({ createdAt: -1 }).lean();
    const attemptId = await ensureAttemptId(attempt);
    if (attemptId) {
      await MathPathWorkingIntelligence.updateOne({ workingId: working.workingId }, { $set: { attemptId } });
      report.linkedRecords += 1;
      report.confidence.medium += 1;
    } else {
      report.unlinkedRecords += 1;
      report.missing.push({ type: 'working_attempt', workingId: working.workingId, questionId: working.questionId });
    }
  }

  const mistakes = await Mistake.find({
    $or: [
      { attemptId: '' },
      { attemptId: { $exists: false } },
      { workingId: '' },
      { workingId: { $exists: false } },
    ],
  }).lean();
  for (const mistake of mistakes) {
    const attempt = mistake.attemptId ? null : await MathPathAttempt.findOne({
      studentId: id(mistake.studentId),
      questionId: id(mistake.questionId),
      ...(mistake.sessionId ? { sessionId: id(mistake.sessionId) } : {}),
    }).sort({ createdAt: -1 }).lean();
    const working = mistake.workingId ? null : await MathPathWorkingIntelligence.findOne({
      $or: [
        ...(attempt?.attemptId ? [{ attemptId: attempt.attemptId }] : []),
        {
          studentId: id(mistake.studentId),
          questionId: id(mistake.questionId),
          ...(mistake.sessionId ? { sessionId: id(mistake.sessionId) } : {}),
        },
      ],
    }).sort({ updatedAt: -1 }).lean();

    const attemptId = await ensureAttemptId(attempt);
    const $set = {};
    if (!mistake.attemptId && attemptId) $set.attemptId = attemptId;
    if (!mistake.workingId && working?.workingId) $set.workingId = working.workingId;
    if (Object.keys($set).length) {
      await Mistake.updateOne({ _id: mistake._id }, { $set });
      if ($set.workingId) await MathPathWorkingIntelligence.updateOne({ workingId: $set.workingId }, { $set: { mistakeId: String(mistake._id), attemptId: $set.attemptId || mistake.attemptId || '' } });
      report.linkedRecords += 1;
      report.confidence[$set.attemptId && $set.workingId ? 'high' : 'medium'] += 1;
    } else {
      report.unlinkedRecords += 1;
      report.missing.push({ type: 'mistake_links', mistakeId: String(mistake._id), questionId: mistake.questionId });
    }
  }

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}
