// Phase 4 tutor seed: give the tutor workspace assigned students with mastery,
// mistakes, availability, certification, and a lesson note — so the Tutor
// Dashboard has real data. Run AFTER seed:foundation (+ seed:questions).
//
//   node scripts/seedTutor.js     (or: npm run seed:tutor)
//
// Idempotent: clears and re-creates only the tutor workspace's seeded students.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import TutorAvailability from '../models/TutorAvailability.js';
import TutorCertification from '../models/TutorCertification.js';
import LessonNote from '../models/LessonNote.js';

dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

function statusFor(score) {
  if (score >= 80) return 'mastered';
  if (score < 50) return 'needs_review';
  return 'learning';
}

async function seedStudent({ tutor, ws, name, level, skillScores, skills }) {
  const student = await Student.create({
    name, level, workspaceId: ws._id, createdByUserId: tutor._id,
    profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
  });
  await TutorStudentLink.create({ workspaceId: ws._id, tutorUserId: tutor._id, studentId: student._id, focusArea: 'MathPath' });

  for (let i = 0; i < skillScores.length && i < skills.length; i++) {
    const skill = skills[i];
    const score = skillScores[i];
    await MasteryRecord.create({
      studentId: student._id, skillId: skill._id, workspaceId: ws._id,
      score, attempts: 6, status: statusFor(score), lastPracticedAt: new Date(Date.now() - i * 86400000),
    });
    // Add a couple of open mistakes on the weakest skill for lesson prep.
    if (score < 50) {
      const q = await Question.findOne({ skillId: skill._id });
      for (let k = 0; k < 3; k++) {
        await Mistake.create({
          studentId: student._id, workspaceId: ws._id,
          questionId: q?._id || new mongoose.Types.ObjectId(), skillId: skill._id, module: 'MathPath',
          questionStem: q?.stem || `Practice question for ${skill.name}`,
          workedSolution: q?.workedSolution || '', studentAnswer: '?', correctAnswer: q?.answer || '',
          mistakeType: 'concept_gap', status: 'open', seeded: true,
        });
      }
    }
  }
  return student;
}

async function main() {
  await mongoose.connect(URI);

  const tutor = await User.findOne({ email: 'demo.tutor@tianos.test' });
  if (!tutor) { console.error('Run `npm run seed:foundation` first (no demo tutor).'); process.exit(1); }
  const ws = await Workspace.findOne({ ownerUserId: tutor._id, type: 'tutor' });
  if (!ws) { console.error('No tutor workspace found.'); process.exit(1); }

  const math = await Subject.findOne({ key: 'math' });
  const topics = await Topic.find({ subjectId: math._id });
  const skills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } }).sort({ order: 1 }).limit(8);
  if (!skills.length) { console.error('No skills — run `npm run seed:foundation`.'); process.exit(1); }

  // Clean previous tutor-seeded students in this workspace.
  const existing = await Student.find({ workspaceId: ws._id });
  const ids = existing.map((s) => s._id);
  await MasteryRecord.deleteMany({ studentId: { $in: ids } });
  await Mistake.deleteMany({ studentId: { $in: ids } });
  await TutorStudentLink.deleteMany({ workspaceId: ws._id });
  await LessonNote.deleteMany({ workspaceId: ws._id });
  await Student.deleteMany({ _id: { $in: ids } });

  const a = await seedStudent({ tutor, ws, name: 'Aaron Lim', level: 'Primary 5', skills, skillScores: [28, 55, 72, 90, 45] });
  await seedStudent({ tutor, ws, name: 'Bea Tan', level: 'Primary 4', skills, skillScores: [60, 35] });

  await LessonNote.create({
    workspaceId: ws._id, tutorUserId: tutor._id, studentId: a._id,
    covered: 'Equivalent fractions — models and number line.',
    didWell: 'Spotted patterns quickly once shown the model.',
    struggledWith: 'Simplifying fractions with larger numbers.',
    misconceptions: 'Thinks a bigger denominator always means a bigger fraction.',
    homeworkAssigned: '10 equivalent-fraction questions.',
    nextRecommendation: 'Move to adding unlike fractions once simplifying is secure.',
    parentSummary: 'Aaron made good progress on fractions today and has a short practice set to consolidate.',
    parentUpdateStatus: 'draft',
  });

  await TutorAvailability.findOneAndUpdate(
    { tutorUserId: tutor._id, workspaceId: ws._id },
    { slots: [
      { day: 'tue', start: '16:00', end: '18:00', mode: 'online' },
      { day: 'thu', start: '16:00', end: '18:00', mode: 'home' },
      { day: 'sat', start: '10:00', end: '12:00', mode: 'centre' },
    ], unavailableDates: [] },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await TutorCertification.findOneAndUpdate(
    { tutorUserId: tutor._id },
    { status: 'in_training',
      trainingModules: [
        { title: 'Tian OS teaching method', status: 'completed' },
        { title: 'Using mastery & mistake data', status: 'in_progress' },
        { title: 'Parent communication', status: 'not_started' },
      ],
      assessmentStatus: 'not_started', interviewStatus: 'not_scheduled',
      approvedLevels: ['Primary 4', 'Primary 5'], approvedModules: ['MathPath'],
      trainingFeeStatus: 'not_required', updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('✅ Tutor workspace seeded');
  console.log(`   Tutor: demo.tutor@tianos.test  workspace: ${ws.name} (${ws._id})`);
  console.log('   Students: Aaron Lim, Bea Tan (+ mastery, mistakes, 1 lesson note)');
  console.log('   Availability + certification (in_training) seeded');
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
