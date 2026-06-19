/**
 * createMathPathPilotAccounts.js
 *
 * Creates or updates the 5-student MathPath controlled pilot account set.
 * Idempotent: safe to run multiple times. Existing accounts are updated/relinked,
 * not duplicated. No mastery data is seeded — pilot students start fresh.
 *
 * Required env vars:
 *   PILOT_PARENT_PASSWORD   — password for pilot.parent@tianos.local
 *   PILOT_TUTOR_PASSWORD    — password for pilot.tutor@tianos.local
 *   PILOT_STUDENT_PASSWORD  — shared password for all 5 pilot student accounts
 *   CONFIRM_PILOT_SETUP=true — explicit confirmation required to run
 *
 * Usage:
 *   PILOT_PARENT_PASSWORD=... PILOT_TUTOR_PASSWORD=... PILOT_STUDENT_PASSWORD=... \
 *     CONFIRM_PILOT_SETUP=true node scripts/createMathPathPilotAccounts.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorStudentLink from '../models/TutorStudentLink.js';

dotenv.config();

// ── Safety checks ─────────────────────────────────────────────────────────────

if (process.env.CONFIRM_PILOT_SETUP !== 'true') {
  console.error('❌  Set CONFIRM_PILOT_SETUP=true to run this script.');
  console.error('    This creates real pilot accounts against the configured MONGODB_URI.');
  process.exit(1);
}

const PARENT_PASSWORD = process.env.PILOT_PARENT_PASSWORD;
const TUTOR_PASSWORD = process.env.PILOT_TUTOR_PASSWORD;
const STUDENT_PASSWORD = process.env.PILOT_STUDENT_PASSWORD;
const missing = [
  !PARENT_PASSWORD && 'PILOT_PARENT_PASSWORD',
  !TUTOR_PASSWORD && 'PILOT_TUTOR_PASSWORD',
  !STUDENT_PASSWORD && 'PILOT_STUDENT_PASSWORD',
].filter(Boolean);
if (missing.length) {
  console.error(`❌  Missing required environment variables: ${missing.join(', ')}`);
  console.error('    Set each variable before running this script.');
  process.exit(1);
}

const URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';

// ── Pilot account definitions ──────────────────────────────────────────────────

const PILOT_PARENT = {
  email: 'pilot.parent@tianos.local',
  name: 'Pilot Parent',
  role: 'parent',
};

const PILOT_TUTOR = {
  email: 'pilot.tutor@tianos.local',
  name: 'Pilot Tutor',
  role: 'tutor',
};

const PILOT_STUDENTS = [
  { email: 'pilot.student1@tianos.local', name: 'Pilot Student 1', level: 'Primary 4', assignedDomain: 'decimals',      assignedDomainLabel: 'Decimals' },
  { email: 'pilot.student2@tianos.local', name: 'Pilot Student 2', level: 'Primary 5', assignedDomain: 'percentage',    assignedDomainLabel: 'Percentages' },
  { email: 'pilot.student3@tianos.local', name: 'Pilot Student 3', level: 'Primary 5', assignedDomain: 'ratio',         assignedDomainLabel: 'Ratio & Rate' },
  { email: 'pilot.student4@tianos.local', name: 'Pilot Student 4', level: 'Primary 4', assignedDomain: 'number_sense',  assignedDomainLabel: 'Number Sense' },
  { email: 'pilot.student5@tianos.local', name: 'Pilot Student 5', level: 'Primary 4', assignedDomain: 'four_operations', assignedDomainLabel: 'Operations' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

async function ensureUser({ email, name, role, password }) {
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = new User({ email, name, role, roles: [role], password });
  } else {
    user.name = name;
    user.role = role;
    user.roles = [role];
    user.password = password;
  }
  user.is_test_account = false;
  await user.save();
  return user;
}

async function ensureWorkspace({ user, type, workspaceName, role }) {
  let workspace = await Workspace.findOne({ ownerUserId: user._id, role });
  if (!workspace) {
    workspace = await Workspace.create({ type, name: workspaceName, role, ownerUserId: user._id });
  }
  await WorkspaceMember.findOneAndUpdate(
    { workspaceId: workspace._id, userId: user._id },
    { workspaceId: workspace._id, userId: user._id, role, status: 'active' },
    { upsert: true, setDefaultsOnInsert: true }
  );
  if (!user.defaultWorkspace || String(user.defaultWorkspace) !== String(workspace._id)) {
    user.defaultWorkspace = workspace._id;
    await user.save();
  }
  return workspace;
}

async function ensureStudentUser({ spec, parentUser, parentWorkspace }) {
  const studentUser = await ensureUser({
    email: spec.email,
    name: spec.name,
    role: 'student',
    password: STUDENT_PASSWORD,
  });
  studentUser.linkedTo = parentUser._id;
  studentUser.defaultWorkspace = parentWorkspace._id;
  studentUser.studentLevel = spec.level;
  await studentUser.save();

  let student = await Student.findOne({ userId: studentUser._id, workspaceId: parentWorkspace._id });
  if (!student) {
    student = await Student.create({
      name: spec.name,
      level: spec.level,
      workspaceId: parentWorkspace._id,
      userId: studentUser._id,
      createdByUserId: parentUser._id,
      profile: {
        mainFocus: 'MathPath',
        modulesUsed: ['MathPath'],
        pilotProfile: `pilot_${spec.assignedDomain}`,
        pilotDescription: `Pilot student assigned to ${spec.assignedDomainLabel} + Fractions`,
      },
    });
  } else {
    student.name = spec.name;
    student.level = spec.level;
    student.profile = student.profile || {};
    student.profile.mainFocus = 'MathPath';
    student.profile.modulesUsed = ['MathPath'];
    student.profile.pilotProfile = `pilot_${spec.assignedDomain}`;
    student.profile.pilotDescription = `Pilot student assigned to ${spec.assignedDomainLabel} + Fractions`;
    await student.save();
  }
  return { user: studentUser, student };
}

async function linkParentToStudent({ parent, student, workspaceId }) {
  await StudentGuardian.findOneAndUpdate(
    { studentId: student._id, guardianUserId: parent._id, workspaceId },
    { studentId: student._id, guardianUserId: parent._id, workspaceId, relation: 'parent', accessLevel: 'full', source: 'direct' },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function linkTutorToStudent({ tutor, tutorWorkspace, student }) {
  await TutorStudentLink.findOneAndUpdate(
    { workspaceId: tutorWorkspace._id, studentId: student._id },
    { workspaceId: tutorWorkspace._id, tutorUserId: tutor._id, studentId: student._id, focusArea: 'MathPath', status: 'active' },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

// ── Verification ───────────────────────────────────────────────────────────────

async function verify({ parent, tutor, parentWorkspace, tutorWorkspace, students }) {
  const errors = [];

  const guardianLinks = await StudentGuardian.find({ guardianUserId: parent._id, workspaceId: parentWorkspace._id });
  if (guardianLinks.length !== students.length) {
    errors.push(`Parent has ${guardianLinks.length} StudentGuardian links, expected ${students.length}`);
  }

  const tutorLinks = await TutorStudentLink.find({ tutorUserId: tutor._id, workspaceId: tutorWorkspace._id });
  if (tutorLinks.length !== students.length) {
    errors.push(`Tutor has ${tutorLinks.length} TutorStudentLink records, expected ${students.length}`);
  }

  for (const { user, student } of students) {
    if (!user._id) errors.push(`${user.email} has no _id`);
    if (!student._id) errors.push(`Student record for ${user.email} has no _id`);
    if (String(student.userId) !== String(user._id)) errors.push(`${user.email} userId mismatch on Student record`);
    if (String(student.workspaceId) !== String(parentWorkspace._id)) errors.push(`${user.email} student not in parent workspace`);

    const hasGuardian = guardianLinks.some((g) => String(g.studentId) === String(student._id));
    if (!hasGuardian) errors.push(`${user.email} missing StudentGuardian link`);

    const hasTutorLink = tutorLinks.some((t) => String(t.studentId) === String(student._id));
    if (!hasTutorLink) errors.push(`${user.email} missing TutorStudentLink`);
  }

  return errors;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀  MathPath pilot account setup starting…');
  await mongoose.connect(URI);

  // Parent
  const parent = await ensureUser({ ...PILOT_PARENT, password: PARENT_PASSWORD });
  const parentWorkspace = await ensureWorkspace({ user: parent, type: 'parent', workspaceName: 'Pilot Family Workspace', role: 'parent' });
  console.log(`   ✓ Parent: ${parent.email} (workspace ${parentWorkspace._id})`);

  // Tutor
  const tutor = await ensureUser({ ...PILOT_TUTOR, password: TUTOR_PASSWORD });
  const tutorWorkspace = await ensureWorkspace({ user: tutor, type: 'tutor', workspaceName: 'Pilot Tutor Workspace', role: 'tutor' });
  console.log(`   ✓ Tutor: ${tutor.email} (workspace ${tutorWorkspace._id})`);

  // Students
  const students = [];
  for (const spec of PILOT_STUDENTS) {
    const { user, student } = await ensureStudentUser({ spec, parentUser: parent, parentWorkspace });
    await linkParentToStudent({ parent, student, workspaceId: parentWorkspace._id });
    await linkTutorToStudent({ tutor, tutorWorkspace, student });
    students.push({ user, student, spec });
    console.log(`   ✓ Student: ${user.email} | studentId=${student._id} | domain=${spec.assignedDomainLabel}`);
  }

  // Verify
  const errors = await verify({ parent, tutor, parentWorkspace, tutorWorkspace, students });
  if (errors.length) {
    console.error('\n❌  Verification failed:');
    errors.forEach((e) => console.error(`   - ${e}`));
    await mongoose.disconnect();
    process.exit(1);
  }

  // Summary
  console.log('\n✅  All pilot accounts created and verified.');
  console.log('\n📋  Student assignment table:');
  console.log('   ┌──────────────────────────────────────┬──────────────────────────────────────┬────────────────────┐');
  console.log('   │ Email                                │ Student ID                           │ Assigned Domain    │');
  console.log('   ├──────────────────────────────────────┼──────────────────────────────────────┼────────────────────┤');
  for (const { user, student, spec } of students) {
    const email = user.email.padEnd(36);
    const id = String(student._id).padEnd(36);
    const domain = spec.assignedDomainLabel.padEnd(18);
    console.log(`   │ ${email} │ ${id} │ ${domain} │`);
  }
  console.log('   └──────────────────────────────────────┴──────────────────────────────────────┴────────────────────┘');
  console.log('\n   Note: All 5 students should also complete one Fractions session during the pilot.');
  console.log('   ⚠️   Store credentials securely outside this repository (password manager or vault).');
  console.log('   ⚠️   Do not commit .env files or passwords.');

  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error('❌  Setup failed:', err.message);
    try { await mongoose.disconnect(); } catch (_) { /* noop */ }
    process.exit(1);
  });
}
