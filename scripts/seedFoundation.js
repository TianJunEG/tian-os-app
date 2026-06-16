// Tian OS Phase 1 foundation seed.
//
//   node scripts/seedFoundation.js     (or: npm run seed:foundation)
//
// Creates the multi-role / multi-workspace demo so the unified shell, role
// switcher, and workspace switcher have real data — including one user who is
// BOTH a teacher and a private tutor (two workspaces, isolated data).
//
// Logins (all password: Passw0rd!):
//   demo.student@tianos.test   student
//   demo.student1@tianos.test  student
//   demo.parent@tianos.test    parent   → Parent workspace
//   demo.tutor@tianos.test     tutor    → Tutor workspace
//   demo.teacher@tianos.test   teacher  → School workspace
//   demo.dual@tianos.test      teacher + tutor → two workspaces
//
// Idempotent: wipes and re-creates only the @tianos.test demo graph.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('seedFoundation: refusing to run in production (NODE_ENV=production).');
  process.exit(1);
}

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const PASSWORD = 'Passw0rd!';

// Math starter map (Primary 4/5). Phase 2 adds questions per skill.
const MATH_MAP = [
  { topic: 'Whole Numbers', level: 'Primary 4', skills: ['Place value to 100 000', 'Multiplication facts', 'Long division'] },
  { topic: 'Fractions', level: 'Primary 4', skills: [
    'Equivalent fractions', 'Simplifying fractions', 'Adding like fractions',
    'Adding unlike fractions', 'Subtracting unlike fractions',
    'Multiplying fractions by whole numbers', 'Fraction word problems'
  ] },
  { topic: 'Decimals', level: 'Primary 4', skills: ['Decimal place value', 'Adding decimals', 'Decimals and fractions'] },
  { topic: 'Area and Perimeter', level: 'Primary 4', skills: ['Perimeter of rectangles', 'Area of rectangles'] },
  { topic: 'Word Problems', level: 'Primary 5', skills: ['Model drawing', 'Multi-step word problems'] }
];

async function makeUser(name, email, roles) {
  let u = await User.findOne({ email });
  if (!u) u = new User({ name, email, role: roles[0] });
  u.name = name;
  u.role = roles[0];
  u.roles = roles;
  u.password = PASSWORD; // pre-save hook hashes
  await u.save();
  return u;
}

async function makeWorkspace(type, name, role, owner) {
  const ws = await Workspace.create({ type, name, role, ownerUserId: owner._id });
  await WorkspaceMember.create({ workspaceId: ws._id, userId: owner._id, role, status: 'active' });
  return ws;
}

async function main() {
  await mongoose.connect(URI);

  // ---- clean the demo graph only ----
  const demoUsers = await User.find({ email: /@tianos\.test$/ });
  const demoUserIds = demoUsers.map((u) => u._id);
  const demoWs = await Workspace.find({ ownerUserId: { $in: demoUserIds } });
  const demoWsIds = demoWs.map((w) => w._id);
  await WorkspaceMember.deleteMany({ workspaceId: { $in: demoWsIds } });
  await Student.deleteMany({ workspaceId: { $in: demoWsIds } });
  await StudentGuardian.deleteMany({ workspaceId: { $in: demoWsIds } });
  await Workspace.deleteMany({ _id: { $in: demoWsIds } });

  // ---- users (one account per person; dual user has two roles) ----
  const student = await makeUser('Demo Student', 'demo.student@tianos.test', ['student']);
  const student1 = await makeUser('Demo Student 2', 'demo.student1@tianos.test', ['student']);
  const parent  = await makeUser('Demo Parent',  'demo.parent@tianos.test',  ['parent']);
  const tutor   = await makeUser('Demo Tutor',   'demo.tutor@tianos.test',   ['tutor']);
  const teacher = await makeUser('Demo Teacher', 'demo.teacher@tianos.test', ['teacher']);
  const dual    = await makeUser('Demo Teacher-Tutor', 'demo.dual@tianos.test', ['teacher', 'tutor']);

  // ---- workspaces ----
  const parentWs  = await makeWorkspace('parent', 'Family workspace',  'parent',  parent);
  const tutorWs   = await makeWorkspace('tutor',  'Private tuition',   'tutor',   tutor);
  const schoolWs  = await makeWorkspace('school', 'Greenwood Primary', 'teacher', teacher);
  // Dual user: a school workspace AND a private tutor workspace — kept separate.
  const dualSchool = await makeWorkspace('school', 'Riverside Secondary', 'teacher', dual);
  const dualTutor  = await makeWorkspace('tutor',  'After-school tuition', 'tutor',  dual);

  parent.defaultWorkspace = parentWs._id; await parent.save();
  tutor.defaultWorkspace = tutorWs._id;   await tutor.save();
  teacher.defaultWorkspace = schoolWs._id; await teacher.save();
  dual.defaultWorkspace = dualSchool._id; await dual.save();

  // ---- a student in the parent workspace, with the student account + guardian ----
  const child = await Student.create({
    name: 'Demo Student', level: 'Primary 4', workspaceId: parentWs._id,
    userId: student._id, createdByUserId: parent._id,
    profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] }
  });
  const child2 = await Student.create({
    name: 'Demo Student 2', level: 'Primary 4', workspaceId: parentWs._id,
    userId: student1._id, createdByUserId: parent._id,
    profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] }
  });
  await StudentGuardian.create({
    studentId: child._id, guardianUserId: parent._id, workspaceId: parentWs._id, relation: 'parent'
  });
  await StudentGuardian.create({
    studentId: child2._id, guardianUserId: parent._id, workspaceId: parentWs._id, relation: 'parent'
  });

  // Link the demo student login to the parent account and landing workspace.
  student.linkedTo = parent._id;
  student.defaultWorkspace = parentWs._id;
  await student.save();
  student1.linkedTo = parent._id;
  student1.defaultWorkspace = parentWs._id;
  await student1.save();

  // ---- subject / topic / skill map (Math) ----
  let mathSubject = await Subject.findOne({ key: 'math' });
  if (!mathSubject) mathSubject = await Subject.create({ key: 'math', name: 'Mathematics', order: 0 });

  let topicCount = 0, skillCount = 0;
  for (let t = 0; t < MATH_MAP.length; t++) {
    const def = MATH_MAP[t];
    let topic = await Topic.findOne({ subjectId: mathSubject._id, name: def.topic });
    if (!topic) topic = await Topic.create({ subjectId: mathSubject._id, name: def.topic, moeLevel: def.level, order: t });
    topicCount++;
    for (let s = 0; s < def.skills.length; s++) {
      const name = def.skills[s];
      const exists = await Skill.findOne({ topicId: topic._id, name });
      if (!exists) { await Skill.create({ topicId: topic._id, name, moeLevel: def.level, order: s }); skillCount++; }
    }
  }

  console.log('✅ Tian OS foundation seeded');
  console.log(`   Users: student, student1, parent, tutor, teacher, teacher+tutor (password: ${PASSWORD})`);
  console.log(`   Workspaces: parent, tutor, school + dual(school, tutor)`);
  console.log(`   Math map: ${topicCount} topics, ${skillCount} new skills`);
  console.log(`   Parent workspace id: ${parentWs._id}  child id: ${child._id}`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
