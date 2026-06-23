import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';

dotenv.config();

// Valerie is a real student, so by default we allow this to run against the
// production database (Railway). Pass ALLOW_PROD=0 to keep the usual guard.
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD === '0') {
  console.error('seedValerieStudent: refusing to run in production (ALLOW_PROD=0).');
  process.exit(1);
}

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

// Overridable via env so the same script works for tweaks without code edits.
const STUDENT = {
  name: process.env.VALERIE_NAME || 'Valerie',
  email: (process.env.VALERIE_EMAIL || 'valeria@tianos.app').toLowerCase(),
  level: process.env.VALERIE_LEVEL || 'Primary 4',
  password: process.env.VALERIE_PASSWORD || 'Passw0rd!',
};

// The guardian/owner workspace Valerie is provisioned under. Override with an
// existing parent's email to attach her to a real family workspace.
const GUARDIAN_EMAIL = (process.env.VALERIE_GUARDIAN_EMAIL || 'demo.parent@tianos.app').toLowerCase();
const GUARDIAN_NAME = process.env.VALERIE_GUARDIAN_NAME || 'Valerie’s Parent';

async function ensureGuardianWorkspace() {
  let parent = await User.findOne({ email: GUARDIAN_EMAIL });
  if (!parent) {
    parent = new User({
      name: GUARDIAN_NAME,
      email: GUARDIAN_EMAIL,
      role: 'parent',
      roles: ['parent'],
      password: STUDENT.password,
    });
    await parent.save();
    console.log(`   Created guardian account: ${parent.email}`);
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

async function upsertValerie({ parent, workspace }) {
  let user = await User.findOne({ email: STUDENT.email });
  const isNew = !user;
  if (!user) {
    user = new User({
      name: STUDENT.name,
      email: STUDENT.email,
      role: 'student',
      roles: ['student'],
      password: STUDENT.password,
    });
  }

  user.name = STUDENT.name;
  user.role = 'student';
  user.roles = ['student'];
  user.linkedTo = parent._id;
  user.defaultWorkspace = workspace._id;
  user.studentLevel = STUDENT.level;
  // Reset password every run so the login below is guaranteed to work even if
  // the account already existed with a forgotten/broken hash.
  user.password = STUDENT.password;
  await user.save();

  let student = await Student.findOne({ userId: user._id, workspaceId: workspace._id });
  if (!student) {
    student = await Student.create({
      name: STUDENT.name,
      level: STUDENT.level,
      workspaceId: workspace._id,
      userId: user._id,
      createdByUserId: parent._id,
      profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
    });
  } else {
    student.name = STUDENT.name;
    student.level = STUDENT.level;
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

  return { user, student, isNew };
}

async function main() {
  await mongoose.connect(URI);
  const { parent, workspace } = await ensureGuardianWorkspace();
  const { user, student, isNew } = await upsertValerie({ parent, workspace });

  console.log(`✅ ${isNew ? 'Created' : 'Updated'} student account for ${user.name}`);
  console.log(`   Login email:  ${user.email}`);
  console.log(`   Password:     ${STUDENT.password}`);
  console.log(`   Level:        ${student.level}`);
  console.log(`   Role:         ${user.role}`);
  console.log(`   userId:       ${user._id}`);
  console.log(`   studentId:    ${student._id}`);
  console.log(`   Workspace:    ${workspace.name} (${workspace._id})`);
  console.log(`   Guardian:     ${parent.email}`);

  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error('❌ Failed to seed Valerie:', err.message);
    try { await mongoose.disconnect(); } catch (_) { /* noop */ }
    process.exit(1);
  });
}

export { main };
