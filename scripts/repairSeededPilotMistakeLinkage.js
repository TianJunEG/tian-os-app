import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import Mistake from '../models/Mistake.js';
import Skill from '../models/Skill.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathWorkingIntelligence from '../models/mathpath/MathPathWorkingIntelligence.js';

const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';

function text(value = '') {
  return String(value || '').trim();
}

export function isSeededPilotOrDemoRecord({ student = null, user = null } = {}) {
  const email = text(user?.email).toLowerCase();
  const name = text(student?.name).toLowerCase();
  const pilotProfile = text(student?.profile?.pilotProfile);
  return Boolean(
    user?.is_test_account
    || email.endsWith('@tianos.test')
    || pilotProfile
    || name.startsWith('pilot student')
    || name === 'demo student'
  );
}

export function repairAttemptIdForMistake(mistakeId = '') {
  return `attempt_repair_mistake_${text(mistakeId)}`;
}

async function resolveSkillCode(mistake) {
  if (mistake.skillCode) return mistake.skillCode;
  if (!mistake.skillId) return 'unknown_skill';
  const skill = await Skill.findById(mistake.skillId).select('metadata slug code name').lean();
  return text(skill?.metadata?.frameworkCode)
    || text(skill?.metadata?.mathPathSkillId)
    || text(skill?.code)
    || text(skill?.slug)
    || text(skill?.name)
    || 'unknown_skill';
}

async function hydrateBrokenMistake(mistake) {
  const student = mistake?.studentId ? await Student.findById(mistake.studentId).lean() : null;
  const user = student?.userId ? await User.findById(student.userId).lean() : null;
  const existingAttempt = mistake?.attemptId
    ? await MathPathAttempt.findOne({ attemptId: mistake.attemptId }).lean()
    : null;
  const working = mistake?.workingId
    ? await MathPathWorkingIntelligence.findOne({ workingId: mistake.workingId }).lean()
    : null;
  const skillCode = await resolveSkillCode(mistake);
  return {
    mistake,
    student,
    user,
    existingAttempt,
    working,
    skillCode,
    safeSeededRecord: isSeededPilotOrDemoRecord({ student, user }),
  };
}

export async function findBrokenSeededPilotMistakes() {
  const mistakes = await Mistake.find({ module: 'MathPath' }).sort({ occurredAt: -1 }).lean();
  const broken = [];
  for (const mistake of mistakes) {
    const attempt = mistake.attemptId
      ? await MathPathAttempt.findOne({ attemptId: mistake.attemptId }).lean()
      : null;
    if (mistake.attemptId && attempt) continue;
    broken.push(await hydrateBrokenMistake(mistake));
  }
  return broken;
}

function publicRecord(row) {
  return {
    student: {
      id: text(row.student?._id),
      name: row.student?.name || '',
      pilotProfile: row.student?.profile?.pilotProfile || '',
    },
    user: {
      email: row.user?.email || '',
      is_test_account: Boolean(row.user?.is_test_account),
    },
    mistake: {
      id: text(row.mistake?._id),
      attemptId: row.mistake?.attemptId || '',
      workingId: row.mistake?.workingId || '',
      questionId: text(row.mistake?.questionId),
      sessionId: row.mistake?.sessionId || '',
      skillCode: row.skillCode,
      questionStem: row.mistake?.questionStem || '',
      studentAnswer: row.mistake?.studentAnswer || '',
      correctAnswer: row.mistake?.correctAnswer || '',
      source: row.mistake?.source || '',
    },
    safeSeededRecord: row.safeSeededRecord,
    missing: {
      attempt: !row.existingAttempt,
      working: Boolean(row.mistake?.workingId && !row.working),
    },
  };
}

export async function repairSeededPilotMistakeLinkage({ dryRun = true } = {}) {
  const rows = await findBrokenSeededPilotMistakes();
  const report = {
    dryRun,
    inspected: rows.length,
    repaired: 0,
    refused: 0,
    alreadyLinked: 0,
    actions: [],
  };

  for (const row of rows) {
    const record = publicRecord(row);
    if (!row.safeSeededRecord) {
      report.refused += 1;
      report.actions.push({ action: 'refuse_non_seeded_record', ...record });
      continue;
    }

    const attemptId = row.mistake.attemptId || repairAttemptIdForMistake(row.mistake._id);
    const sessionId = row.mistake.sessionId || `seeded_repair_${text(row.student?._id)}`;
    const questionId = text(row.mistake.questionId) || `seeded_repair_question_${text(row.mistake._id)}`;
    const now = new Date();
    const attemptPayload = {
      attemptId,
      studentId: text(row.mistake.studentId),
      domainId: 'fractions',
      skillId: row.skillCode,
      questionFamilyId: `seeded_repair_${row.skillCode || 'mathpath'}`,
      questionId,
      sessionId,
      sessionType: row.mistake.source?.startsWith('diagnostic') ? 'diagnostic' : 'practice',
      answer: row.mistake.studentAnswer || '',
      studentAnswer: row.mistake.studentAnswer || '',
      correctAnswer: row.mistake.correctAnswer || '',
      correct: false,
      answerCorrect: false,
      confidence: row.mistake.confidence || '',
      confidenceLevel: row.mistake.confidence || '',
      timestamp: row.mistake.occurredAt || row.mistake.timestamp || now,
      createdAt: row.mistake.occurredAt || now,
      workingSubmitted: Boolean(row.mistake.workingId),
      workingUploaded: Boolean(row.mistake.workingId),
      workingId: row.mistake.workingId || '',
      mistakeId: text(row.mistake._id),
    };

    report.actions.push({
      action: dryRun ? 'would_create_or_update_repair_attempt' : 'created_or_updated_repair_attempt',
      attemptId,
      ...record,
    });

    if (!dryRun) {
      await MathPathAttempt.findOneAndUpdate(
        { attemptId },
        { $setOnInsert: attemptPayload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await Mistake.updateOne(
        { _id: row.mistake._id },
        {
          $set: {
            attemptId,
            sessionId,
            questionId,
            skillCode: row.mistake.skillCode || row.skillCode,
          },
          $push: {
            auditTrail: {
              type: 'mistake_link_created',
              source: 'repairSeededPilotMistakeLinkage',
              attemptId,
              repairedAt: now,
            },
          },
        }
      );
      if (row.mistake.workingId) {
        await MathPathWorkingIntelligence.updateOne(
          { workingId: row.mistake.workingId },
          {
            $set: {
              attemptId,
              mistakeId: text(row.mistake._id),
              studentId: text(row.mistake.studentId),
              questionId,
              sessionId,
            },
          }
        );
      }
    }
    report.repaired += 1;
  }
  return report;
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const apply = process.argv.includes('--apply') || process.env.APPLY_REPAIR === '1';
  const report = await repairSeededPilotMistakeLinkage({ dryRun: !apply });
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
