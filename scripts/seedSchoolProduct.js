// Seed a complete, clickable demo of the school product surfaces: a school
// admin (HOD/IT), a teacher with a class whose mastery data lights up the
// dashboard flags, parents on Premium Home / trial / school-invited view-only,
// a pending PayNow upgrade in the admin queue, a parent invite, and a class
// join code.
//
//   npm run seed:foundation        (first — creates the math subject + skills)
//   node scripts/seedSchoolProduct.js
//
// Idempotent: clears and re-creates only the @schooldemo.test graph.
//
// Logins (password for all): Password123
//   hod@schooldemo.test        school admin   → /school-admin, /admin/pending-upgrades
//   teacher@schooldemo.test    teacher        → /teacher/classes
//   premium@schooldemo.test    parent (Premium Home, active annual)
//   trial@schooldemo.test      parent (mid-trial)
//   viewonly@schooldemo.test   parent (school-invited, view-only)
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import ClassJoinCode from '../models/ClassJoinCode.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import MasteryRecord from '../models/MasteryRecord.js';
import FluencyRecord from '../models/FluencyRecord.js';
import Mistake from '../models/Mistake.js';
import ParentInvite from '../models/ParentInvite.js';
import UpgradeRequest from '../models/UpgradeRequest.js';
import Subscription from '../models/Subscription.js';
import { upsertSubscription } from '../services/billing/featureAccessService.js';
import { getPremiumHomePricing } from '../services/billing/premiumHomePricing.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const PASSWORD = 'Password123';
const DOMAIN = '@schooldemo.test';
const DAY = 86400000;
const statusFor = (s) => (s >= 80 ? 'mastered' : s < 50 ? 'needs_review' : 'learning');

async function makeUser(name, email, roles) {
  let u = await User.findOne({ email });
  if (!u) u = new User({ name, email });
  u.name = name;
  u.role = roles[0];
  u.roles = roles;
  u.password = PASSWORD; // pre-save hook hashes
  await u.save();
  return u;
}

async function setSubscription(userId, planType, status, periodEndDays) {
  await upsertSubscription({ ownerType: 'user', ownerId: String(userId), planType, status });
  const set = {};
  if (status === 'trial') set.trialEnd = new Date(Date.now() + periodEndDays * DAY);
  if (status === 'active') { set.currentPeriodStart = new Date(); set.currentPeriodEnd = new Date(Date.now() + periodEndDays * DAY); }
  await Subscription.updateOne({ ownerType: 'user', ownerId: String(userId) }, { $set: set });
}

async function cleanup() {
  const demoUsers = await User.find({ email: new RegExp(`${DOMAIN.replace('.', '\\.')}$`) });
  const ids = demoUsers.map((u) => u._id);
  const idStrings = ids.map(String);
  const ws = await Workspace.find({ ownerUserId: { $in: ids } });
  const wsIds = ws.map((w) => w._id);
  const students = await Student.find({ workspaceId: { $in: wsIds } });
  const studentIds = students.map((s) => s._id);
  await Promise.all([
    MasteryRecord.deleteMany({ studentId: { $in: studentIds } }),
    FluencyRecord.deleteMany({ studentId: { $in: studentIds } }),
    Mistake.deleteMany({ studentId: { $in: studentIds } }),
    ClassStudent.deleteMany({ workspaceId: { $in: wsIds } }),
    ClassJoinCode.deleteMany({ workspaceId: { $in: wsIds } }),
    Class.deleteMany({ workspaceId: { $in: wsIds } }),
    StudentGuardian.deleteMany({ workspaceId: { $in: wsIds } }),
    ParentInvite.deleteMany({ workspaceId: { $in: wsIds } }),
    UpgradeRequest.deleteMany({ userId: { $in: ids } }),
    Subscription.deleteMany({ ownerId: { $in: idStrings } }),
    WorkspaceMember.deleteMany({ workspaceId: { $in: wsIds } }),
  ]);
  await Student.deleteMany({ _id: { $in: studentIds } });
  await Workspace.deleteMany({ _id: { $in: wsIds } });
  await User.deleteMany({ _id: { $in: ids } });
}

async function main() {
  await mongoose.connect(URI);

  const math = await Subject.findOne({ key: 'math' });
  if (!math) { console.error('Run `npm run seed:foundation` first (no math subject found).'); process.exit(1); }
  const topics = await Topic.find({ subjectId: math._id });
  const skills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } }).sort({ order: 1 }).limit(6);
  if (skills.length < 3) { console.error('Not enough skills seeded. Run `npm run seed:mathpath` first.'); process.exit(1); }

  await cleanup();

  // ── Accounts ────────────────────────────────────────────────────────────
  const hod = await makeUser('Mrs Lim (HOD)', `hod${DOMAIN}`, ['school_admin']);
  const teacher = await makeUser('Mr Tan (Teacher)', `teacher${DOMAIN}`, ['teacher']);
  const premiumParent = await makeUser('Premium Parent', `premium${DOMAIN}`, ['parent']);
  const trialParent = await makeUser('Trial Parent', `trial${DOMAIN}`, ['parent']);
  const viewOnlyParent = await makeUser('School-Invited Parent', `viewonly${DOMAIN}`, ['parent']);

  // ── School workspace (owned by the HOD; teacher is a member) ─────────────
  const schoolWs = await Workspace.create({ type: 'school', name: 'Greenwood Primary', role: 'school_admin', ownerUserId: hod._id });
  await WorkspaceMember.create({ workspaceId: schoolWs._id, userId: hod._id, role: 'school_admin', status: 'active' });
  await WorkspaceMember.create({ workspaceId: schoolWs._id, userId: teacher._id, role: 'teacher', status: 'active' });
  hod.defaultWorkspace = schoolWs._id; await hod.save();
  teacher.defaultWorkspace = schoolWs._id; await teacher.save();

  // Entitlements: the HOD needs the School tier to reach the admin console.
  await setSubscription(hod._id, 'school_pilot', 'active', 365);

  // ── Class + students with dashboard-flag-worthy data ─────────────────────
  const klass = await Class.create({
    workspaceId: schoolWs._id, teacherUserId: teacher._id, name: 'P5 Diligence',
    level: 'Primary 5', modules: ['MathPath'], academicYear: '2026', status: 'active',
  });

  // Profiles engineered to exercise each flag rule + the healthy states.
  const profiles = [
    { name: 'Ana Tan', kind: 'low_stuck' },     // overall <40 + stuck skill → high, in-person
    { name: 'Cara Wong', kind: 'slow_recurring' }, // accurate-but-slow + critical recurring → high
    { name: 'Ben Lee', kind: 'strong' },        // mastered + retained → extension
    { name: 'Dewi Sari', kind: 'ok' },
    { name: 'Eshan Rao', kind: 'ok' },
    { name: 'Faith Goh', kind: 'mid' },
  ];

  const createdStudents = [];
  for (const p of profiles) {
    const student = await Student.create({
      name: p.name, level: 'Primary 5', workspaceId: schoolWs._id, createdByUserId: teacher._id,
      profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
    });
    await ClassStudent.create({ workspaceId: schoolWs._id, classId: klass._id, studentId: student._id, status: 'active' });
    createdStudents.push({ student, kind: p.kind });

    for (let j = 0; j < skills.length; j++) {
      let score = 60 + ((j * 13) % 30); // baseline 60–89
      let status = statusFor(score);
      let masteryState = score >= 80 ? 'mastered' : 'developing';
      let attempts = 4;
      if (p.kind === 'low_stuck') {
        score = j === 0 ? 28 : 30 + j * 2; // overall < 40 → high severity / in-person
        status = statusFor(score);
        if (j === 0) { status = 'needs_review'; attempts = 5; } // stuck after repeated attempts
      } else if (p.kind === 'slow_recurring') {
        score = 60 + j; // ~mid 60s overall
      } else if (p.kind === 'strong') {
        score = 88 + (j % 6); masteryState = 'retained'; status = 'mastered';
      } else if (p.kind === 'mid') {
        score = 50 + j * 2;
      }
      await MasteryRecord.create({
        studentId: student._id, skillId: skills[j]._id, workspaceId: schoolWs._id, subject: 'Math',
        score, attempts, status, masteryState,
        fluencyStatus: p.kind === 'strong' ? 'automatic' : 'developing', lastPracticedAt: new Date(),
      });
    }

    // Fluency signal for Cara: accurate but slow on the first skill.
    if (p.kind === 'slow_recurring') {
      await FluencyRecord.create({
        studentId: student._id, skillId: skills[0]._id, skillCode: skills[0].slug || '', skillName: skills[0].name,
        totalQuestions: 10, correctAnswers: 8, accuracy: 80, averageTimeSeconds: 31, fluencyScore: 55, fluencyStatus: 'developing',
      });
      // Recurring critical mistake → drives the "repeated mistake" flag.
      await Mistake.create({
        studentId: student._id, workspaceId: schoolWs._id, questionId: new mongoose.Types.ObjectId(),
        skillId: skills[0]._id, module: 'MathPath', questionStem: skills[0].name, studentAnswer: '?', correctAnswer: '',
        frequency: 4, severity: 'critical', mistakeCategory: 'conceptual_misconception', status: 'open',
      });
    }
    if (p.kind === 'strong') {
      await FluencyRecord.create({
        studentId: student._id, skillId: skills[0]._id, skillName: skills[0].name,
        totalQuestions: 10, correctAnswers: 10, accuracy: 98, averageTimeSeconds: 11, fluencyScore: 95, fluencyStatus: 'fluent',
      });
    }
  }

  // ── Join code for the class (student self-enrolment screen /join) ────────
  await ClassJoinCode.create({
    workspaceId: schoolWs._id, classId: klass._id, code: 'DEMO42', createdByUserId: hod._id,
    expiresAt: new Date(Date.now() + 30 * DAY), status: 'active',
  });

  // ── School-invited, view-only parent → links to Ana (a school student) ───
  const ana = createdStudents.find((s) => s.kind === 'low_stuck').student;
  const voWs = await Workspace.create({ type: 'parent', name: 'Family workspace', role: 'parent', ownerUserId: viewOnlyParent._id });
  await WorkspaceMember.create({ workspaceId: voWs._id, userId: viewOnlyParent._id, role: 'parent', status: 'active' });
  viewOnlyParent.defaultWorkspace = voWs._id; await viewOnlyParent.save();
  await StudentGuardian.create({
    studentId: ana._id, guardianUserId: viewOnlyParent._id, workspaceId: schoolWs._id,
    relation: 'parent', accessLevel: 'view_only', source: 'school_invite',
  });

  // A pending invite too, so the invite-accept flow has a live token.
  await ParentInvite.create({
    token: 'demo-parent-invite-token', workspaceId: schoolWs._id, studentId: ana._id, invitedByUserId: teacher._id,
    studentName: ana.name, schoolName: schoolWs.name, email: `newparent${DOMAIN}`, status: 'pending',
    expiresAt: new Date(Date.now() + 30 * DAY),
  });

  // ── Premium Home parent (active annual) with their own child ─────────────
  const premWs = await Workspace.create({ type: 'parent', name: 'Family workspace', role: 'parent', ownerUserId: premiumParent._id });
  await WorkspaceMember.create({ workspaceId: premWs._id, userId: premiumParent._id, role: 'parent', status: 'active' });
  premiumParent.defaultWorkspace = premWs._id; await premiumParent.save();
  const premChild = await Student.create({ name: 'Sam (P4)', level: 'Primary 4', workspaceId: premWs._id, createdByUserId: premiumParent._id, profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] } });
  await StudentGuardian.create({ studentId: premChild._id, guardianUserId: premiumParent._id, workspaceId: premWs._id, relation: 'parent' });
  for (let j = 0; j < Math.min(4, skills.length); j++) {
    const score = 55 + j * 8;
    await MasteryRecord.create({ studentId: premChild._id, skillId: skills[j]._id, workspaceId: premWs._id, subject: 'Math', score, attempts: 3, status: statusFor(score), lastPracticedAt: new Date() });
  }
  await setSubscription(premiumParent._id, 'parent_plus', 'active', 200); // 200 days left

  // ── Trial parent (mid-trial) + a pending PayNow upgrade in the admin queue ─
  const trialWs = await Workspace.create({ type: 'parent', name: 'Family workspace', role: 'parent', ownerUserId: trialParent._id });
  await WorkspaceMember.create({ workspaceId: trialWs._id, userId: trialParent._id, role: 'parent', status: 'active' });
  trialParent.defaultWorkspace = trialWs._id; await trialParent.save();
  await setSubscription(trialParent._id, 'parent_plus', 'trial', 5); // 5 days left
  const pricing = getPremiumHomePricing();
  await UpgradeRequest.create({
    userId: trialParent._id, userName: trialParent.name, userEmail: trialParent.email, planType: 'parent_plus',
    amountSgd: pricing.annualSgd, earlyRenewal: false, reference: 'PH-DEMO01', paymentMethod: 'paynow', status: 'pending',
  });

  console.log('✅ School product demo seeded.');
  console.log(`   School: ${schoolWs.name} · Class: ${klass.name} (${createdStudents.length} students, flags on Ana + Cara)`);
  console.log(`   Join code: DEMO42 · Parent invite token: demo-parent-invite-token`);
  console.log('   Logins (password Password123):');
  console.log(`     HOD/admin   hod${DOMAIN}      → /school-admin, /admin/pending-upgrades`);
  console.log(`     Teacher     teacher${DOMAIN}  → /teacher/classes`);
  console.log(`     Premium     premium${DOMAIN}`);
  console.log(`     Trial       trial${DOMAIN}`);
  console.log(`     View-only   viewonly${DOMAIN}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
