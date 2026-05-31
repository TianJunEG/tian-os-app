import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const PASSWORD = 'Passw0rd!';

const TEST_STUDENTS = [
  { name: 'Test Student One', email: 'test.student1@tianos.test', level: 'Primary 3' },
  { name: 'Test Student Two', email: 'test.student2@tianos.test', level: 'Primary 4' },
  { name: 'Test Student Three', email: 'test.student3@tianos.test', level: 'Primary 5' },
];

async function ensureParentWorkspace() {
  let parent = await User.findOne({ email: 'demo.parent@tianos.test' });
  if (!parent) {
    parent = new User({
      name: 'Demo Parent',
      email: 'demo.parent@tianos.test',
      role: 'parent',
      roles: ['parent'],
      password: PASSWORD,
    });
    await parent.save();
  }

  let workspace = await Workspace.findOne({ ownerUserId: parent._id, role: 'parent' });
  if (!workspace) {
    workspace = await Workspace.create({
      type: 'parent',
      name: 'Family workspace',
      role: 'parent',
      ownerUserId: parent._id,
    });
  }

  const member = await WorkspaceMember.findOne({ workspaceId: workspace._id, userId: parent._id });
  if (!member) {
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: parent._id,
      role: 'parent',
      status: 'active',
    });
  }

  if (!parent.defaultWorkspace || String(parent.defaultWorkspace) !== String(workspace._id)) {
    parent.defaultWorkspace = workspace._id;
    await parent.save();
  }

  return { parent, workspace };
}

async function upsertStudentAccount({ parent, workspace, spec }) {
  let user = await User.findOne({ email: spec.email });
  if (!user) {
    user = new User({
      name: spec.name,
      email: spec.email,
      role: 'student',
      roles: ['student'],
      password: PASSWORD,
    });
  }

  user.name = spec.name;
  user.role = 'student';
  user.roles = ['student'];
  user.is_test_account = true;
  user.linkedTo = parent._id;
  user.defaultWorkspace = workspace._id;
  user.password = PASSWORD; // Keep deterministic for pilot test logins.
  await user.save();

  let student = await Student.findOne({ userId: user._id, workspaceId: workspace._id });
  if (!student) {
    student = await Student.create({
      name: spec.name,
      level: spec.level,
      workspaceId: workspace._id,
      userId: user._id,
      createdByUserId: parent._id,
      profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
    });
  } else {
    student.name = spec.name;
    student.level = spec.level;
    await student.save();
  }

  const guardian = await StudentGuardian.findOne({
    studentId: student._id,
    guardianUserId: parent._id,
    workspaceId: workspace._id,
  });
  if (!guardian) {
    await StudentGuardian.create({
      studentId: student._id,
      guardianUserId: parent._id,
      workspaceId: workspace._id,
      relation: 'parent',
    });
  }

  return { user, student };
}

async function main() {
  await mongoose.connect(URI);
  const { parent, workspace } = await ensureParentWorkspace();
  const created = [];
  for (const spec of TEST_STUDENTS) {
    const row = await upsertStudentAccount({ parent, workspace, spec });
    created.push({
      name: row.user.name,
      email: row.user.email,
      role: row.user.role,
      studentId: String(row.student._id),
      level: row.student.level,
    });
  }

  console.log('✅ Seeded 3 test student accounts');
  console.log(`   Workspace: ${workspace.name} (${workspace._id})`);
  console.log(`   Parent link: ${parent.email}`);
  console.log(`   Password for all test students: ${PASSWORD}`);
  created.forEach((u) => {
    console.log(`   - ${u.email} | ${u.name} | ${u.level} | studentId=${u.studentId}`);
  });

  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error('❌ Failed to seed test accounts:', err.message);
    try { await mongoose.disconnect(); } catch (_) { /* noop */ }
    process.exit(1);
  });
}
