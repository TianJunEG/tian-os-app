// Phase 5 teacher seed: a class with students, mastery spread (some weak), a few
// mistakes, and one intervention — so the Teacher Dashboard has real data.
// Run AFTER seed:foundation (+ seed:questions).
//
//   node scripts/seedTeacher.js     (or: npm run seed:teacher)
//
// Idempotent: clears and re-creates only the school workspace's seeded data.
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
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import InterventionRecord from '../models/InterventionRecord.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const NAMES = ['Aisha', 'Ben', 'Chloe', 'Darren', 'Eve', 'Faiz', 'Grace', 'Hao'];
const statusFor = (s) => (s >= 80 ? 'mastered' : s < 50 ? 'needs_review' : 'learning');

async function main() {
  await mongoose.connect(URI);
  const teacher = await User.findOne({ email: 'demo.teacher@tianos.test' });
  if (!teacher) { console.error('Run `npm run seed:foundation` first.'); process.exit(1); }
  const ws = await Workspace.findOne({ ownerUserId: teacher._id, type: 'school' });
  if (!ws) { console.error('No school workspace.'); process.exit(1); }

  const math = await Subject.findOne({ key: 'math' });
  const topics = await Topic.find({ subjectId: math._id });
  const skills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } }).sort({ order: 1 }).limit(6);

  // Clean prior school-workspace seed.
  const prevStudents = await Student.find({ workspaceId: ws._id });
  const prevIds = prevStudents.map((s) => s._id);
  await MasteryRecord.deleteMany({ studentId: { $in: prevIds } });
  await Mistake.deleteMany({ studentId: { $in: prevIds } });
  await ClassStudent.deleteMany({ workspaceId: ws._id });
  await InterventionRecord.deleteMany({ workspaceId: ws._id });
  await Class.deleteMany({ workspaceId: ws._id });
  await Student.deleteMany({ _id: { $in: prevIds } });

  const klass = await Class.create({
    workspaceId: ws._id, teacherUserId: teacher._id, name: 'P5 Foundation Math',
    level: 'Primary 5', modules: ['MathPath'], academicYear: '2026', status: 'active',
  });

  let weakStudentId = null;
  for (let i = 0; i < NAMES.length; i++) {
    const student = await Student.create({
      name: `${NAMES[i]} ${String.fromCharCode(65 + i)}.`, level: 'Primary 5',
      workspaceId: ws._id, createdByUserId: teacher._id, profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
    });
    await ClassStudent.create({ workspaceId: ws._id, classId: klass._id, studentId: student._id, status: 'active' });

    // Vary mastery: first two students are weak on skill[0].
    for (let j = 0; j < skills.length; j++) {
      let score = 50 + ((i * 7 + j * 11) % 50); // 50–99 spread
      if (i < 3 && j === 0) score = 25 + i * 5;  // weak cohort on the first skill
      await MasteryRecord.create({ studentId: student._id, skillId: skills[j]._id, workspaceId: ws._id, score, attempts: 5, status: statusFor(score), lastPracticedAt: new Date() });
    }
    if (i < 3) {
      weakStudentId = weakStudentId || student._id;
      const q = await Question.findOne({ skillId: skills[0]._id });
      for (let k = 0; k < 3; k++) {
        await Mistake.create({ studentId: student._id, workspaceId: ws._id, questionId: q?._id || new mongoose.Types.ObjectId(), skillId: skills[0]._id, module: 'MathPath', questionStem: q?.stem || 'Practice question', studentAnswer: '?', correctAnswer: q?.answer || '', mistakeType: 'concept_gap', status: 'open', seeded: true });
      }
    }
  }

  await InterventionRecord.create({
    workspaceId: ws._id, classId: klass._id, studentId: weakStudentId, teacherUserId: teacher._id,
    targetSkillId: skills[0]._id, status: 'needs_support',
    notes: 'Struggling with the first skill; small-group support started.', nextAction: 'Reassess after 2 sessions.',
  });

  console.log('✅ Teacher workspace seeded');
  console.log(`   Teacher: demo.teacher@tianos.test  workspace: ${ws.name}`);
  console.log(`   Class: ${klass.name} with ${NAMES.length} students (3 weak on ${skills[0].name})`);
  console.log('   1 intervention seeded');
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
