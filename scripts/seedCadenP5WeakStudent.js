import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import Skill from '../models/Skill.js';
import MasteryRecord from '../models/MasteryRecord.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const PASSWORD = 'Passw0rd!';

const CADEN = {
  name: 'Caden Tan',
  email: 'caden.p5@tianos.test',
  level: 'Primary 5',
};

const WEAK_FRACTIONS_SKILLS = [
  { code: 'F001', score: 28, attempts: 4, status: 'needs_review' },
  { code: 'F002', score: 24, attempts: 4, status: 'needs_review' },
  { code: 'F006', score: 35, attempts: 5, status: 'needs_review' },
  { code: 'F011', score: 42, attempts: 5, status: 'learning' },
  { code: 'F012', score: 38, attempts: 6, status: 'needs_review' },
  { code: 'F015', score: 33, attempts: 5, status: 'needs_review' },
  { code: 'F018', score: 40, attempts: 4, status: 'learning' },
  { code: 'F023', score: 31, attempts: 4, status: 'needs_review' },
];

async function ensureParentWorkspace() {
  let parent = await User.findOne({ email: 'demo.parent@tianos.test' });
  if (!parent) {
    parent = await User.create({
      name: 'Demo Parent',
      email: 'demo.parent@tianos.test',
      role: 'parent',
      roles: ['parent'],
      password: PASSWORD,
    });
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

async function upsertStudent({ parent, workspace }) {
  let user = await User.findOne({ email: CADEN.email });
  if (!user) {
    user = new User({
      name: CADEN.name,
      email: CADEN.email,
      role: 'student',
      roles: ['student'],
      password: PASSWORD,
    });
  }

  user.name = CADEN.name;
  user.role = 'student';
  user.roles = ['student'];
  user.linkedTo = parent._id;
  user.defaultWorkspace = workspace._id;
  user.password = PASSWORD;
  await user.save();

  let student = await Student.findOne({ userId: user._id, workspaceId: workspace._id });
  if (!student) {
    student = await Student.create({
      name: CADEN.name,
      level: CADEN.level,
      workspaceId: workspace._id,
      userId: user._id,
      createdByUserId: parent._id,
      profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
    });
  } else {
    student.name = CADEN.name;
    student.level = CADEN.level;
    student.profile = { mainFocus: 'MathPath', modulesUsed: ['MathPath'] };
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

async function upsertWeakMastery(student, workspace) {
  const skillCodes = WEAK_FRACTIONS_SKILLS.map((s) => s.code);
  const skills = await Skill.find({
    $or: [
      { 'metadata.mathPathSkillId': { $in: skillCodes } },
      { 'metadata.frameworkCode': { $in: skillCodes } },
    ],
  });

  const byCode = new Map();
  for (const skill of skills) {
    const code = String(skill?.metadata?.mathPathSkillId || skill?.metadata?.frameworkCode || '').toUpperCase();
    if (code) byCode.set(code, skill);
  }

  const rows = [];
  for (const spec of WEAK_FRACTIONS_SKILLS) {
    const skill = byCode.get(spec.code);
    if (!skill) {
      rows.push({ code: spec.code, status: 'missing-skill' });
      continue;
    }

    await MasteryRecord.updateOne(
      { studentId: student._id, skillId: skill._id },
      {
        $set: {
          studentId: student._id,
          skillId: skill._id,
          workspaceId: workspace._id,
          module: 'MathPath',
          subject: 'Math',
          score: spec.score,
          attempts: spec.attempts,
          status: spec.status,
          fluencyStatus: 'effortful',
          confidence: 0.35,
          lastPracticedAt: new Date(),
        },
      },
      { upsert: true }
    );
    rows.push({ code: spec.code, score: spec.score, status: spec.status, skillName: skill.name });
  }
  return rows;
}

async function main() {
  await mongoose.connect(URI);
  const { parent, workspace } = await ensureParentWorkspace();
  const { user, student } = await upsertStudent({ parent, workspace });
  const seeded = await upsertWeakMastery(student, workspace);

  console.log('✅ Seeded Caden weak student profile');
  console.log(`   Student: ${user.name} (${user.email})`);
  console.log(`   Level: ${student.level}`);
  console.log(`   Linked parent: ${parent.email}`);
  console.log(`   Password: ${PASSWORD}`);
  console.log('   Fractions mastery seeds:');
  seeded.forEach((row) => {
    if (row.status === 'missing-skill') {
      console.log(`   - ${row.code}: skill not found in DB`);
      return;
    }
    console.log(`   - ${row.code} ${row.skillName}: score=${row.score}, status=${row.status}`);
  });

  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error('❌ Failed to seed Caden profile:', err.message);
    try { await mongoose.disconnect(); } catch (_) { /* noop */ }
    process.exit(1);
  });
}
