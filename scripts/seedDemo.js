// Demo seed for the launch video. Creates a parent with two children and realistic cross-app
// progress (Spelling + Math + Science) engineered to land in varied readiness bands — so the
// Tian OS dashboards show rich, multi-coloured rings on camera.
//
//   node scripts/seedDemo.js
//   login: demo.parent@tianos.test / Passw0rd!  → film /children
//
// Idempotent: only touches the demo account (re-running resets its data).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import SpellingAttempt from '../models/SpellingAttempt.js';
import LearningResult from '../models/LearningResult.js';
import LifeLabActivity from '../models/LifeLabActivity.js';
import LifeLabSubmission from '../models/LifeLabSubmission.js';
import { buildSpellingAttempts, buildResults, ETHAN_WORDS, MAYA_WORDS, ETHAN_RESULTS, MAYA_RESULTS } from './seedData.js';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('seedDemo: refusing to run in production (NODE_ENV=production).');
  process.exit(1);
}

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const EMAIL = 'demo.parent@tianos.test';
const PASSWORD = 'Passw0rd!';

async function main() {
  await mongoose.connect(URI);
  let parent = await User.findOne({ email: EMAIL });
  if (!parent) parent = new User({ name: 'Demo Parent', email: EMAIL, role: 'parent' });
  parent.password = PASSWORD; // pre-save hook hashes it; guarantees the documented login works
  parent.children = [{ name: 'Ethan', level: 'Secondary 1' }, { name: 'Maya', level: 'Primary 4' }];
  await parent.save();
  const [ethan, maya] = parent.children;

  const studentUser = await User.findOne({ email: 'demo.student@tianos.test' });
  const parentWs = await Workspace.findOne({ ownerUserId: parent._id, type: 'parent' });
  if (!parentWs) { console.error('No parent workspace found for demo parent. Run seedFoundation first.'); process.exit(1); }

  async function ensureChildStudent(name, level) {
    let record = await Student.findOne({ workspaceId: parentWs._id, name });
    if (!record) {
      record = await Student.create({
        name,
        level,
        workspaceId: parentWs._id,
        createdByUserId: parent._id,
        profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] }
      });
    } else {
      record.level = level;
      await record.save();
    }

    const link = await StudentGuardian.findOne({ studentId: record._id, guardianUserId: parent._id, workspaceId: parentWs._id });
    if (!link) {
      await StudentGuardian.create({
        studentId: record._id,
        guardianUserId: parent._id,
        workspaceId: parentWs._id,
        relation: 'parent'
      });
    }
    return record;
  }

  const ethanStudentRecord = await ensureChildStudent(ethan.name, ethan.level);
  const mayaStudentRecord = await ensureChildStudent(maya.name, maya.level);

  await SpellingAttempt.deleteMany({ user: parent._id });
  await LearningResult.deleteMany({ user: parent._id });

  await SpellingAttempt.insertMany([
    ...buildSpellingAttempts(ETHAN_WORDS, { user: parent._id, child: ethan._id }),
    ...buildSpellingAttempts(MAYA_WORDS, { user: parent._id, child: maya._id }),
  ]);
  await LearningResult.insertMany([
    ...buildResults({ user: parent._id, child: ethan._id }, ETHAN_RESULTS),
    ...buildResults({ user: parent._id, child: maya._id }, MAYA_RESULTS),
  ]);

  if (studentUser) {
    await SpellingAttempt.insertMany([
      ...buildSpellingAttempts(ETHAN_WORDS, { user: studentUser._id, child: null }),
      ...buildSpellingAttempts(MAYA_WORDS, { user: studentUser._id, child: null }),
    ]);
    await LearningResult.insertMany([
      ...buildResults({ user: studentUser._id, child: null }, ETHAN_RESULTS),
      ...buildResults({ user: studentUser._id, child: null }, MAYA_RESULTS),
    ]);
  }

  const activity = await LifeLabActivity.findOne({ isLibrary: true }).sort({ title: 1 });
  if (activity) {
    await LifeLabSubmission.deleteMany({ workspaceId: parentWs._id, studentId: { $in: [ethanStudentRecord._id, mayaStudentRecord._id] } });
    const submissions = [
      {
        workspaceId: parentWs._id,
        activityId: activity._id,
        studentId: mayaStudentRecord._id,
        assignedByUserId: parent._id,
        status: 'submitted',
        dataRecorded: 'Calculated unit prices for different pack sizes and chose the best buy.',
        reflectionResponse: 'The cheapest pack was not always the best value because of portion size and waste.',
        evidenceUrl: 'https://example.com/lifelab/maya-bestbuy.jpg'
      }
    ];
    if (studentUser) {
      const demoStudentRecord = await Student.findOne({ workspaceId: parentWs._id, userId: studentUser._id });
      if (demoStudentRecord) {
        submissions.push({
          workspaceId: parentWs._id,
          activityId: activity._id,
          studentId: demoStudentRecord._id,
          assignedByUserId: parent._id,
          status: 'reviewed',
          dataRecorded: 'Measured a room and calculated area at $25 per square metre.',
          reflectionResponse: 'The area doubled when the length doubled, and the cost scaled accordingly.',
          teacherFeedback: 'Good work — remember to keep the units consistent.',
          evidenceUrl: 'https://example.com/lifelab/demo-student-room.jpg'
        });
      }
    }
    await LifeLabSubmission.insertMany(submissions);
  }

  console.log(`✅ Seeded ${EMAIL} (password: ${PASSWORD})`);
  console.log(`   Children: Ethan (${ethan._id}), Maya (${maya._id})`);
  console.log('   Log in, open "My Children", and film /children → tap a child.');
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
