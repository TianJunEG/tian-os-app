/**
 * Create or verify the controlled 5-student MathPath pilot account set.
 *
 * Real run:
 *   PILOT_PARENT_PASSWORD=... \
 *   PILOT_TUTOR_PASSWORD=... \
 *   PILOT_STUDENT_PASSWORD=... \
 *   CONFIRM_PILOT_SETUP=true \
 *   node scripts/createMathPathPilotAccounts.js
 *
 * Dry run:
 *   node scripts/createMathPathPilotAccounts.js --dry-run
 *
 * Verify only:
 *   node scripts/createMathPathPilotAccounts.js --verify-only
 *
 * The script is idempotent. It creates missing pilot users/students/workspaces
 * and relinks existing pilot records without deleting or duplicating unrelated
 * data. It does not seed mastery, attempts, mistakes, or fake progress.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import StudentAccountLink, { DEFAULT_SHARED_SCOPES } from '../models/StudentAccountLink.js';

dotenv.config();

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run') || process.env.DRY_RUN === '1';
const VERIFY_ONLY = args.has('--verify-only');
const RESET_EXISTING_PASSWORDS = args.has('--reset-existing-passwords') || process.env.PILOT_RESET_EXISTING_PASSWORDS === '1';

const URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';

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
  { email: 'pilot.student1@tianos.local', name: 'Pilot Student 1', level: 'Primary 4', assignedDomain: 'decimals', assignedDomainLabel: 'Decimals' },
  { email: 'pilot.student2@tianos.local', name: 'Pilot Student 2', level: 'Primary 5', assignedDomain: 'percentage', assignedDomainLabel: 'Percentages' },
  { email: 'pilot.student3@tianos.local', name: 'Pilot Student 3', level: 'Primary 5', assignedDomain: 'ratio', assignedDomainLabel: 'Ratio & Rate' },
  { email: 'pilot.student4@tianos.local', name: 'Pilot Student 4', level: 'Primary 4', assignedDomain: 'number_sense', assignedDomainLabel: 'Number Sense' },
  { email: 'pilot.student5@tianos.local', name: 'Pilot Student 5', level: 'Primary 4', assignedDomain: 'four_operations', assignedDomainLabel: 'Operations' },
];

function validateMode() {
  if (DRY_RUN || VERIFY_ONLY) return;
  if (process.env.CONFIRM_PILOT_SETUP !== 'true') {
    throw new Error('Set CONFIRM_PILOT_SETUP=true to create or update real pilot accounts.');
  }
  const missing = [
    !process.env.PILOT_PARENT_PASSWORD && 'PILOT_PARENT_PASSWORD',
    !process.env.PILOT_TUTOR_PASSWORD && 'PILOT_TUTOR_PASSWORD',
    !process.env.PILOT_STUDENT_PASSWORD && 'PILOT_STUDENT_PASSWORD',
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function roleList(role, existing = []) {
  return [...new Set([...(Array.isArray(existing) ? existing : []), role])];
}

function pilotProfile(spec) {
  return {
    mainFocus: 'MathPath',
    modulesUsed: ['MathPath'],
    studentVisualMode: spec.level.includes('Primary 3') ? 'lower_primary' : 'upper_primary',
    pilotProfile: `pilot_${spec.assignedDomain}`,
    pilotDescription: `Pilot student assigned to ${spec.assignedDomainLabel} + Fractions`,
  };
}

function safeId(doc) {
  return doc?._id ? String(doc._id) : '(missing)';
}

async function ensureUser({ email, name, role, password }) {
  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  const existed = Boolean(user);
  if (!user) {
    user = new User({ email: normalizedEmail, name, role, roles: [role], password });
  } else {
    user.name = name;
    user.role = role;
    user.roles = roleList(role, user.roles);
    if (password && RESET_EXISTING_PASSWORDS) user.password = password;
  }
  user.status = 'active';
  user.is_test_account = false;
  if (!DRY_RUN) await user.save();
  return { user, existed };
}

async function ensureWorkspace({ user, type, workspaceName, role }) {
  let workspace = user?._id ? await Workspace.findOne({ ownerUserId: user._id, role }) : null;
  const existed = Boolean(workspace);
  if (!workspace) {
    workspace = new Workspace({ type, name: workspaceName, role, ownerUserId: user._id });
    if (!DRY_RUN) await workspace.save();
  } else {
    workspace.type = type;
    workspace.name = workspaceName;
    workspace.role = role;
    if (!DRY_RUN) await workspace.save();
  }

  if (!DRY_RUN) {
    await WorkspaceMember.findOneAndUpdate(
      { workspaceId: workspace._id, userId: user._id },
      { workspaceId: workspace._id, userId: user._id, role, status: 'active' },
      { upsert: true, setDefaultsOnInsert: true }
    );
    if (!user.defaultWorkspace || String(user.defaultWorkspace) !== String(workspace._id)) {
      user.defaultWorkspace = workspace._id;
      await user.save();
    }
  }

  return { workspace, existed };
}

async function ensureStudent({ spec, parentUser, parentWorkspace }) {
  const { user: studentUser, existed: userExisted } = await ensureUser({
    email: spec.email,
    name: spec.name,
    role: 'student',
    password: process.env.PILOT_STUDENT_PASSWORD,
  });

  studentUser.linkedTo = parentUser._id;
  studentUser.defaultWorkspace = parentWorkspace._id;
  studentUser.studentLevel = spec.level;
  if (!DRY_RUN) await studentUser.save();

  let student = studentUser?._id && parentWorkspace?._id
    ? await Student.findOne({ userId: studentUser._id, workspaceId: parentWorkspace._id })
    : null;
  const studentExisted = Boolean(student);
  if (!student) {
    student = new Student({
      name: spec.name,
      level: spec.level,
      workspaceId: parentWorkspace._id,
      userId: studentUser._id,
      createdByUserId: parentUser._id,
      profile: pilotProfile(spec),
    });
    if (!DRY_RUN) await student.save();
  } else {
    student.name = spec.name;
    student.level = spec.level;
    student.userId = studentUser._id;
    student.createdByUserId = student.createdByUserId || parentUser._id;
    student.profile = { ...(student.profile?.toObject?.() || student.profile || {}), ...pilotProfile(spec) };
    if (!DRY_RUN) await student.save();
  }

  return { user: studentUser, student, userExisted, studentExisted, spec };
}

async function linkParentToStudent({ parent, student, workspaceId }) {
  if (DRY_RUN) return;
  await StudentGuardian.findOneAndUpdate(
    { studentId: student._id, guardianUserId: parent._id },
    {
      studentId: student._id,
      guardianUserId: parent._id,
      workspaceId,
      relation: 'parent',
      accessLevel: 'full',
      source: 'direct',
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function linkTutorToStudent({ tutor, tutorWorkspace, parent, student }) {
  if (DRY_RUN) return;
  await TutorStudentLink.findOneAndUpdate(
    { workspaceId: tutorWorkspace._id, studentId: student._id },
    {
      workspaceId: tutorWorkspace._id,
      tutorUserId: tutor._id,
      studentId: student._id,
      focusArea: 'MathPath',
      status: 'active',
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
  await StudentAccountLink.findOneAndUpdate(
    { tutorUserId: tutor._id, studentId: student._id, workspaceId: tutorWorkspace._id },
    {
      studentId: student._id,
      studentUserId: student.userId || null,
      fromContext: 'parent',
      toContext: 'tutor',
      tutorUserId: tutor._id,
      workspaceId: tutorWorkspace._id,
      status: 'active',
      sharedScopes: DEFAULT_SHARED_SCOPES,
      requestedByUserId: tutor._id,
      consentByUserId: parent._id,
      consentAt: new Date(),
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function loadPilotState() {
  const [parent, tutor, studentUsers] = await Promise.all([
    User.findOne({ email: PILOT_PARENT.email }),
    User.findOne({ email: PILOT_TUTOR.email }),
    User.find({ email: { $in: PILOT_STUDENTS.map((s) => s.email) } }),
  ]);
  const parentWorkspace = parent ? await Workspace.findOne({ ownerUserId: parent._id, role: 'parent' }) : null;
  const tutorWorkspace = tutor ? await Workspace.findOne({ ownerUserId: tutor._id, role: 'tutor' }) : null;
  const students = parentWorkspace
    ? await Student.find({ workspaceId: parentWorkspace._id, userId: { $in: studentUsers.map((u) => u._id) } })
    : [];
  return { parent, tutor, parentWorkspace, tutorWorkspace, studentUsers, students };
}

async function verifyPilotState() {
  const state = await loadPilotState();
  const errors = [];
  const warnings = [];

  if (!state.parent) errors.push(`Missing parent user ${PILOT_PARENT.email}`);
  if (!state.tutor) errors.push(`Missing tutor user ${PILOT_TUTOR.email}`);
  if (!state.parentWorkspace) errors.push('Missing parent workspace');
  if (!state.tutorWorkspace) errors.push('Missing tutor workspace');

  const usersByEmail = new Map(state.studentUsers.map((u) => [u.email, u]));
  const studentsByUserId = new Map(state.students.map((s) => [String(s.userId), s]));
  const expectedStudentIds = [];

  for (const spec of PILOT_STUDENTS) {
    const user = usersByEmail.get(spec.email);
    if (!user) {
      errors.push(`Missing student user ${spec.email}`);
      continue;
    }
    const student = studentsByUserId.get(String(user._id));
    if (!student) {
      errors.push(`Missing Student record for ${spec.email}`);
      continue;
    }
    expectedStudentIds.push(String(student._id));
    if (String(student.userId) !== String(user._id)) errors.push(`${spec.email} Student.userId mismatch`);
    if (String(student.workspaceId) !== String(state.parentWorkspace?._id)) errors.push(`${spec.email} Student.workspaceId mismatch`);
    if (user.role !== 'student') errors.push(`${spec.email} role is ${user.role}, expected student`);
    if (!user.roles?.includes('student')) warnings.push(`${spec.email} roles[] does not include student`);
  }

  const [guardianLinks, tutorLinks, accountLinks] = await Promise.all([
    state.parent ? StudentGuardian.find({ guardianUserId: state.parent._id }) : [],
    state.tutor && state.tutorWorkspace ? TutorStudentLink.find({ tutorUserId: state.tutor._id, workspaceId: state.tutorWorkspace._id, status: 'active' }) : [],
    state.tutor && state.tutorWorkspace ? StudentAccountLink.find({ tutorUserId: state.tutor._id, workspaceId: state.tutorWorkspace._id, status: 'active' }) : [],
  ]);

  for (const studentId of expectedStudentIds) {
    if (!guardianLinks.some((link) => String(link.studentId) === studentId)) {
      errors.push(`Parent missing StudentGuardian link for studentId=${studentId}`);
    }
    if (!tutorLinks.some((link) => String(link.studentId) === studentId)) {
      errors.push(`Tutor missing TutorStudentLink for studentId=${studentId}`);
    }
    if (!accountLinks.some((link) => String(link.studentId) === studentId)) {
      warnings.push(`Tutor missing StudentAccountLink consent record for studentId=${studentId}`);
    }
  }

  return {
    ...state,
    expectedStudentIds,
    guardianLinkCount: guardianLinks.filter((link) => expectedStudentIds.includes(String(link.studentId))).length,
    tutorLinkCount: tutorLinks.filter((link) => expectedStudentIds.includes(String(link.studentId))).length,
    accountLinkCount: accountLinks.filter((link) => expectedStudentIds.includes(String(link.studentId))).length,
    errors,
    warnings,
  };
}

async function dryRunSummary() {
  const state = await loadPilotState();
  const existingEmails = new Set([
    state.parent?.email,
    state.tutor?.email,
    ...state.studentUsers.map((u) => u.email),
  ].filter(Boolean));
  console.log('DRY RUN: no database writes will be made.');
  console.log(`Target database: ${URI}`);
  console.log('\nPlanned accounts:');
  for (const account of [PILOT_PARENT, PILOT_TUTOR, ...PILOT_STUDENTS]) {
    console.log(`- ${account.email} (${account.role || 'student'}) ${existingEmails.has(account.email) ? 'exists' : 'will be created'}`);
  }
  console.log('\nPlanned relationships:');
  console.log('- Parent workspace + active WorkspaceMember for pilot.parent@tianos.local');
  console.log('- Tutor workspace + active WorkspaceMember for pilot.tutor@tianos.local');
  console.log('- 5 Student records in the parent workspace');
  console.log('- 5 StudentGuardian links');
  console.log('- 5 TutorStudentLink records');
  console.log('- 5 active StudentAccountLink consent records');
}

async function createOrUpdatePilotAccounts() {
  const { user: parent, existed: parentExisted } = await ensureUser({
    ...PILOT_PARENT,
    password: process.env.PILOT_PARENT_PASSWORD,
  });
  const { workspace: parentWorkspace, existed: parentWorkspaceExisted } = await ensureWorkspace({
    user: parent,
    type: 'parent',
    workspaceName: 'Pilot Family Workspace',
    role: 'parent',
  });

  const { user: tutor, existed: tutorExisted } = await ensureUser({
    ...PILOT_TUTOR,
    password: process.env.PILOT_TUTOR_PASSWORD,
  });
  const { workspace: tutorWorkspace, existed: tutorWorkspaceExisted } = await ensureWorkspace({
    user: tutor,
    type: 'tutor',
    workspaceName: 'Pilot Tutor Workspace',
    role: 'tutor',
  });

  const students = [];
  for (const spec of PILOT_STUDENTS) {
    const row = await ensureStudent({ spec, parentUser: parent, parentWorkspace });
    await linkParentToStudent({ parent, student: row.student, workspaceId: parentWorkspace._id });
    await linkTutorToStudent({ tutor, tutorWorkspace, parent, student: row.student });
    students.push(row);
  }

  return {
    parent,
    tutor,
    parentWorkspace,
    tutorWorkspace,
    parentExisted,
    tutorExisted,
    parentWorkspaceExisted,
    tutorWorkspaceExisted,
    students,
  };
}

function printCreationSummary(result, verification) {
  console.log('\nMathPath pilot accounts ready.');
  console.log(`Parent: ${PILOT_PARENT.email} (${result.parentExisted ? 'reused' : 'created'}) workspace=${safeId(result.parentWorkspace)}`);
  console.log(`Tutor: ${PILOT_TUTOR.email} (${result.tutorExisted ? 'reused' : 'created'}) workspace=${safeId(result.tutorWorkspace)}`);
  console.log('\nStudent assignment table:');
  for (const row of result.students) {
    console.log(`- ${row.spec.name}: ${row.user.email} | studentId=${safeId(row.student)} | ${row.spec.assignedDomainLabel} + Fractions | user=${row.userExisted ? 'reused' : 'created'} student=${row.studentExisted ? 'reused' : 'created'}`);
  }
  console.log('\nVerification:');
  console.log(`- Parent pilot child links: ${verification.guardianLinkCount}/5`);
  console.log(`- Tutor pilot student links: ${verification.tutorLinkCount}/5`);
  console.log(`- Tutor consent records: ${verification.accountLinkCount}/5`);
  if (verification.warnings.length) {
    console.log('\nWarnings:');
    verification.warnings.forEach((warning) => console.log(`- ${warning}`));
  }
  console.log('\nPasswords were not printed. Store credentials in a password manager or vault.');
}

async function main() {
  validateMode();
  await mongoose.connect(URI);

  if (DRY_RUN) {
    await dryRunSummary();
    await mongoose.disconnect();
    return;
  }

  if (VERIFY_ONLY) {
    const verification = await verifyPilotState();
    if (verification.errors.length) {
      console.error('Verification failed:');
      verification.errors.forEach((error) => console.error(`- ${error}`));
      if (verification.warnings.length) {
        console.error('Warnings:');
        verification.warnings.forEach((warning) => console.error(`- ${warning}`));
      }
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log('Verification passed.');
    console.log(`- Parent pilot child links: ${verification.guardianLinkCount}/5`);
    console.log(`- Tutor pilot student links: ${verification.tutorLinkCount}/5`);
    console.log(`- Tutor consent records: ${verification.accountLinkCount}/5`);
    if (verification.warnings.length) {
      console.log('Warnings:');
      verification.warnings.forEach((warning) => console.log(`- ${warning}`));
    }
    await mongoose.disconnect();
    return;
  }

  const result = await createOrUpdatePilotAccounts();
  const verification = await verifyPilotState();
  if (verification.errors.length) {
    console.error('Verification failed after provisioning:');
    verification.errors.forEach((error) => console.error(`- ${error}`));
    await mongoose.disconnect();
    process.exit(1);
  }
  printCreationSummary(result, verification);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error(`Pilot account setup failed: ${err.message}`);
    try { await mongoose.disconnect(); } catch (_) { /* noop */ }
    process.exit(1);
  });
}
