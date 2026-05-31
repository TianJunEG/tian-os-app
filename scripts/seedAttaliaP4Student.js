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
const ATTALIA = {
  name: 'Attalia',
  email: 'attalia.p4@tianos.test',
  level: 'Primary 4',
};

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

  await WorkspaceMember.updateOne(
    { workspaceId: workspace._id, userId: parent._id },
    { $set: { role: 'parent', status: 'active' } },
    { upsert: true }
  );

  if (!parent.defaultWorkspace || String(parent.defaultWorkspace) !== String(workspace._id)) {
    parent.defaultWorkspace = workspace._id;
    await parent.save();
  }

  return { parent, workspace };
}

async function upsertAttalia({ parent, workspace }) {
  let user = await User.findOne({ email: ATTALIA.email });
  if (!user) {
    user = new User({
      name: ATTALIA.name,
      email: ATTALIA.email,
      role: 'student',
      roles: ['student'],
      password: PASSWORD,
    });
  }

  user.name = ATTALIA.name;
  user.role = 'student';
  user.roles = ['student'];
  user.linkedTo = parent._id;
  user.defaultWorkspace = workspace._id;
  user.password = PASSWORD;
  await user.save();

  let student = await Student.findOne({ userId: user._id, workspaceId: workspace._id });
  if (!student) {
    student = await Student.create({
      name: ATTALIA.name,
      level: ATTALIA.level,
      workspaceId: workspace._id,
      userId: user._id,
      createdByUserId: parent._id,
      profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
    });
  } else {
    student.name = ATTALIA.name;
    student.level = ATTALIA.level;
    student.profile = { mainFocus: 'MathPath', modulesUsed: ['MathPath'] };
    await student.save();
  }

  await StudentGuardian.updateOne(
    { studentId: student._id, guardianUserId: parent._id, workspaceId: workspace._id },
    { $set: { relation: 'parent' } },
    { upsert: true }
  );

  return { user, student };
}

async function main() {
  await mongoose.connect(URI);
  const { parent, workspace } = await ensureParentWorkspace();
  const { user, student } = await upsertAttalia({ parent, workspace });

  console.log('✅ Seeded Attalia P4 student account');
  console.log(`   Student: ${user.name} (${user.email})`);
  console.log(`   Password: ${PASSWORD}`);
  console.log(`   Level: ${student.level}`);
  console.log(`   Workspace: ${workspace.name} (${workspace._id})`);
  console.log(`   Parent link: ${parent.email}`);
  console.log(`   studentId=${student._id}`);

  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error('❌ Failed to seed Attalia P4 account:', err.message);
    try { await mongoose.disconnect(); } catch (_) { /* noop */ }
    process.exit(1);
  });
}
