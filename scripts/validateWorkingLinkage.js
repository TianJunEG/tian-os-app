import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathWorkingIntelligence from '../models/mathpath/MathPathWorkingIntelligence.js';
import Mistake from '../models/Mistake.js';
import Student from '../models/Student.js';
import LearningTelemetryEvent from '../models/LearningTelemetryEvent.js';

const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';

async function main() {
  await mongoose.connect(uri);
  const requestedStudentId = process.env.STUDENT_ID || process.argv[2] || '';
  const student = requestedStudentId
    ? await Student.findById(requestedStudentId).select('_id userId').lean()
    : null;
  const canonicalStudentId = student?._id ? String(student._id) : requestedStudentId;
  const legacyUserId = student?.userId ? String(student.userId) : '';
  const mistakes = await Mistake.find({ module: 'MathPath' }).sort({ occurredAt: -1 }).limit(Number(process.env.LINKAGE_LIMIT || 1000)).lean();
  const broken = [];

  for (const mistake of mistakes) {
    const attempt = mistake.attemptId
      ? await MathPathAttempt.findOne({ attemptId: mistake.attemptId }).lean()
      : null;
    const working = mistake.workingId
      ? await MathPathWorkingIntelligence.findOne({ workingId: mistake.workingId }).lean()
      : null;
    if (!mistake.attemptId) broken.push({ mistakeId: String(mistake._id), issue: 'missing_attemptId' });
    else if (!attempt) broken.push({ mistakeId: String(mistake._id), attemptId: mistake.attemptId, issue: 'attempt_not_found' });
    if (mistake.workingId && !working) broken.push({ mistakeId: String(mistake._id), workingId: mistake.workingId, issue: 'working_not_found' });
    if (working?.attemptId && mistake.attemptId && working.attemptId !== mistake.attemptId) {
      broken.push({ mistakeId: String(mistake._id), workingId: mistake.workingId, issue: 'working_attempt_mismatch' });
    }
  }

  const report = {
    studentId: canonicalStudentId || '',
    workingRecordsByStudentId: canonicalStudentId
      ? await MathPathWorkingIntelligence.countDocuments({ studentId: canonicalStudentId })
      : null,
    legacyWorkingRecordsByUserId: legacyUserId
      ? await MathPathWorkingIntelligence.countDocuments({ studentId: legacyUserId })
      : null,
    mistakesLinkedToWorking: canonicalStudentId
      ? await Mistake.countDocuments({ studentId: canonicalStudentId, workingId: { $exists: true, $ne: '' } })
      : null,
    parentVisibleWorkingRecords: canonicalStudentId
      ? await MathPathWorkingIntelligence.countDocuments({
        $or: [
          { studentId: canonicalStudentId },
          ...(legacyUserId ? [{ studentId: legacyUserId }] : []),
        ],
      })
      : null,
    remediationRecordsUsingWorkingInsight: canonicalStudentId
      ? await LearningTelemetryEvent.countDocuments({
        studentId: canonicalStudentId,
        eventType: 'working_used_for_remediation',
      })
      : null,
    checkedMistakes: mistakes.length,
    brokenChains: broken.length,
    ok: broken.length === 0,
    broken,
  };
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
