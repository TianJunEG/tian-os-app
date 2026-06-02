import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import Skill from '../models/Skill.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';

dotenv.config();

const URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';
const PASSWORD = 'Passw0rd!';

const PILOT_STUDENTS = [
  {
    profileKey: 'brand_new_p4',
    name: 'Pilot Student 1 Brand New',
    email: 'pilot.student1@tianos.test',
    level: 'Primary 4',
    description: 'Brand-new P4 student with no seeded MathPath history.',
  },
  {
    profileKey: 'weak_fractions_p4',
    name: 'Pilot Student 2 Weak Fractions',
    email: 'pilot.student2@tianos.test',
    level: 'Primary 4',
    description: 'P4 student with weak early fractions and open remediation items.',
  },
  {
    profileKey: 'strong_fractions_p4',
    name: 'Pilot Student 3 Strong Fractions',
    email: 'pilot.student3@tianos.test',
    level: 'Primary 4',
    description: 'P4 student with secure early fractions and higher readiness.',
  },
  {
    profileKey: 'careless_fast_p4',
    name: 'Pilot Student 4 Careless Fast',
    email: 'pilot.student4@tianos.test',
    level: 'Primary 4',
    description: 'P4 student with fast responses, overconfidence, and careless mistakes.',
  },
  {
    profileKey: 'slow_low_confidence_p4',
    name: 'Pilot Student 5 Slow Low Confidence',
    email: 'pilot.student5@tianos.test',
    level: 'Primary 4',
    description: 'P4 student with correct-but-slow attempts and low confidence.',
  },
];

async function ensureUser({ email, name, role }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email, name, role, roles: [role], password: PASSWORD });
  }
  user.name = name;
  user.role = role;
  user.roles = [role];
  user.is_test_account = true;
  if (!user.password || !String(user.password).startsWith('$2')) user.password = PASSWORD;
  await user.save();
  return user;
}

async function ensureWorkspace({ user, type, name, role }) {
  let workspace = await Workspace.findOne({ ownerUserId: user._id, role });
  if (!workspace) {
    workspace = await Workspace.create({ type, name, role, ownerUserId: user._id });
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

async function ensurePilotAdults() {
  const parent = await ensureUser({ email: 'pilot.parent@tianos.test', name: 'Pilot Parent', role: 'parent' });
  const tutor = await ensureUser({ email: 'pilot.tutor@tianos.test', name: 'Pilot Tutor', role: 'tutor' });
  const teacher = await ensureUser({ email: 'pilot.teacher@tianos.test', name: 'Pilot Teacher', role: 'teacher' });
  const parentWorkspace = await ensureWorkspace({ user: parent, type: 'parent', name: 'Pilot Family Workspace', role: 'parent' });
  const tutorWorkspace = await ensureWorkspace({ user: tutor, type: 'tutor', name: 'Pilot Tutor Workspace', role: 'tutor' });
  const teacherWorkspace = await ensureWorkspace({ user: teacher, type: 'teacher', name: 'Pilot Teacher Workspace', role: 'teacher' });
  return { parent, tutor, teacher, parentWorkspace, tutorWorkspace, teacherWorkspace };
}

async function findSkillByFrameworkCode(code) {
  return Skill.findOne({
    $or: [
      { 'metadata.frameworkCode': code },
      { 'metadata.mathPathSkillId': code },
      { slug: new RegExp(`${code}$`, 'i') },
      { slug: new RegExp(`\\.${code.toLowerCase()}$`, 'i') },
    ],
  });
}

async function skillMap(codes) {
  const entries = await Promise.all(codes.map(async (code) => [code, await findSkillByFrameworkCode(code)]));
  return Object.fromEntries(entries.filter(([, skill]) => skill));
}

function statusForScore(score) {
  if (score >= 70) return 'mastered';
  if (score >= 40) return 'learning';
  return 'needs_review';
}

async function upsertMastery({ student, workspaceId, skill, score, attempts, recentTimesMs = [], confidence = 0.6 }) {
  if (!skill) return false;
  await MasteryRecord.findOneAndUpdate(
    { studentId: student._id, skillId: skill._id },
    {
      studentId: student._id,
      skillId: skill._id,
      workspaceId,
      module: 'MathPath',
      subject: 'Math',
      score,
      status: statusForScore(score),
      masteryState: score >= 85 ? 'secure' : score >= 70 ? 'mastered' : score >= 40 ? 'developing' : 'emerging',
      attempts,
      recentTimesMs,
      medianTimeMs: recentTimesMs.length ? [...recentTimesMs].sort((a, b) => a - b)[Math.floor(recentTimesMs.length / 2)] : null,
      fluencyStatus: recentTimesMs.length && Math.max(...recentTimesMs) <= 12000 ? 'automatic' : recentTimesMs.length ? 'effortful' : 'unknown',
      confidence,
      lastPracticedAt: new Date(),
      recentOutcomes: Array.from({ length: Math.min(8, attempts) }, (_, idx) => idx < Math.round((score / 100) * Math.min(8, attempts))),
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return true;
}

async function addAttempt({ student, skillId, familyId, questionId, correct, answer, correctAnswer, seconds, confidenceLevel, skipped = false }) {
  await MathPathAttempt.create({
    studentId: String(student._id),
    domainId: 'fractions',
    skillId,
    questionFamilyId: familyId,
    questionId,
    sessionId: `pilot_seed_${student._id}`,
    sessionType: 'practice',
    answer,
    studentAnswer: answer,
    correctAnswer,
    correct,
    skipped,
    timeSpentSeconds: seconds,
    effectiveAnswerTimeSeconds: seconds,
    totalQuestionTimeSeconds: seconds,
    confidenceLevel,
    confidence: confidenceLevel,
    timestamp: new Date(),
    createdAt: new Date(),
  });
}

async function addMistake({ student, workspaceId, skill, source, stem, studentAnswer, correctAnswer, mistakeType, misconceptionTag }) {
  if (!skill) return false;
  await Mistake.create({
    studentId: student._id,
    workspaceId,
    questionId: new mongoose.Types.ObjectId(),
    skillId: skill._id,
    module: 'MathPath',
    questionStem: stem,
    studentAnswer,
    correctAnswer,
    mistakeType,
    misconceptionTag,
    status: 'open',
    source,
    occurredAt: new Date(),
  });
  return true;
}

async function resetPilotEvidence(student) {
  await Promise.all([
    MasteryRecord.deleteMany({ studentId: student._id, module: 'MathPath' }),
    Mistake.deleteMany({ studentId: student._id, module: 'MathPath' }),
    MathPathAttempt.deleteMany({ studentId: String(student._id), domainId: 'fractions' }),
  ]);
}

async function seedProfileEvidence({ spec, student, workspaceId, skills }) {
  await resetPilotEvidence(student);
  if (spec.profileKey === 'brand_new_p4') return { mastery: 0, mistakes: 0, attempts: 0 };

  let mastery = 0;
  let mistakes = 0;
  let attempts = 0;

  if (spec.profileKey === 'weak_fractions_p4') {
    mastery += await upsertMastery({ student, workspaceId, skill: skills.F001, score: 25, attempts: 4, confidence: 0.35 }) ? 1 : 0;
    mastery += await upsertMastery({ student, workspaceId, skill: skills.F003, score: 30, attempts: 5, confidence: 0.3 }) ? 1 : 0;
    mistakes += await addMistake({
      student, workspaceId, skill: skills.F003, source: 'diagnostic-incorrect',
      stem: 'A bar is split into 5 equal parts. 2 parts are shaded. What fraction is shaded?',
      studentAnswer: '5/2', correctAnswer: '2/5', mistakeType: 'concept_gap', misconceptionTag: 'denominator-confusion',
    }) ? 1 : 0;
  }

  if (spec.profileKey === 'strong_fractions_p4') {
    for (const code of ['F001', 'F002', 'F003', 'F004', 'F005', 'F006', 'F007', 'F008']) {
      mastery += await upsertMastery({ student, workspaceId, skill: skills[code], score: 88, attempts: 8, recentTimesMs: [6500, 7200, 7800], confidence: 0.9 }) ? 1 : 0;
    }
  }

  if (spec.profileKey === 'careless_fast_p4') {
    mastery += await upsertMastery({ student, workspaceId, skill: skills.F015, score: 58, attempts: 8, recentTimesMs: [3500, 4200, 3900], confidence: 0.55 }) ? 1 : 0;
    await addAttempt({ student, skillId: 'F015', familyId: 'pilot_like_fraction_addition', questionId: 'pilot_fast_q1', correct: false, answer: '4/10', correctAnswer: '4/5', seconds: 4, confidenceLevel: 'confident' });
    await addAttempt({ student, skillId: 'F015', familyId: 'pilot_like_fraction_addition', questionId: 'pilot_fast_q2', correct: true, answer: '3/7', correctAnswer: '3/7', seconds: 5, confidenceLevel: 'confident' });
    attempts += 2;
    mistakes += await addMistake({
      student, workspaceId, skill: skills.F015, source: 'practice-incorrect',
      stem: 'Find 2/5 + 2/5.', studentAnswer: '4/10', correctAnswer: '4/5',
      mistakeType: 'careless', misconceptionTag: 'simplify-final-answer',
    }) ? 1 : 0;
  }

  if (spec.profileKey === 'slow_low_confidence_p4') {
    mastery += await upsertMastery({ student, workspaceId, skill: skills.F017, score: 62, attempts: 6, recentTimesMs: [42000, 48000, 51000], confidence: 0.45 }) ? 1 : 0;
    await addAttempt({ student, skillId: 'F017', familyId: 'pilot_unlike_fraction_addition', questionId: 'pilot_slow_q1', correct: true, answer: '5/6', correctAnswer: '5/6', seconds: 49, confidenceLevel: 'unsure' });
    await addAttempt({ student, skillId: 'F017', familyId: 'pilot_unlike_fraction_addition', questionId: 'pilot_slow_q2', correct: true, answer: '7/12', correctAnswer: '7/12', seconds: 55, confidenceLevel: 'unsure' });
    attempts += 2;
  }

  return { mastery, mistakes, attempts };
}

async function upsertPilotStudent({ spec, adults, skills }) {
  let user = await User.findOne({ email: spec.email });
  if (!user) {
    user = new User({ name: spec.name, email: spec.email, role: 'student', roles: ['student'], password: PASSWORD });
  }
  user.name = spec.name;
  user.role = 'student';
  user.roles = ['student'];
  user.is_test_account = true;
  user.linkedTo = adults.parent._id;
  user.defaultWorkspace = adults.parentWorkspace._id;
  user.password = PASSWORD;
  await user.save();

  let student = await Student.findOne({ userId: user._id, workspaceId: adults.parentWorkspace._id });
  if (!student) {
    student = await Student.create({
      name: spec.name,
      level: spec.level,
      workspaceId: adults.parentWorkspace._id,
      userId: user._id,
      createdByUserId: adults.parent._id,
    });
  }
  student.name = spec.name;
  student.level = spec.level;
  student.profile = {
    ...(student.profile || {}),
    mainFocus: 'MathPath',
    modulesUsed: ['MathPath'],
    pilotProfile: spec.profileKey,
    pilotDescription: spec.description,
  };
  await student.save();

  await StudentGuardian.findOneAndUpdate(
    { studentId: student._id, guardianUserId: adults.parent._id, workspaceId: adults.parentWorkspace._id },
    { studentId: student._id, guardianUserId: adults.parent._id, workspaceId: adults.parentWorkspace._id, relation: 'parent' },
    { upsert: true, setDefaultsOnInsert: true }
  );
  await TutorStudentLink.findOneAndUpdate(
    { workspaceId: adults.tutorWorkspace._id, studentId: student._id },
    { workspaceId: adults.tutorWorkspace._id, tutorUserId: adults.tutor._id, studentId: student._id, focusArea: 'MathPath', status: 'active' },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const evidence = await seedProfileEvidence({ spec, student, workspaceId: adults.parentWorkspace._id, skills });
  return { user, student, evidence };
}

async function ensureTeacherClass(adults, students) {
  const klass = await Class.findOneAndUpdate(
    { workspaceId: adults.teacherWorkspace._id, teacherUserId: adults.teacher._id, name: 'Pilot Fractions P4' },
    {
      workspaceId: adults.teacherWorkspace._id,
      teacherUserId: adults.teacher._id,
      name: 'Pilot Fractions P4',
      level: 'Primary 4',
      modules: ['MathPath'],
      academicYear: '2026',
      status: 'active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  for (const student of students) {
    await ClassStudent.findOneAndUpdate(
      { classId: klass._id, studentId: student._id },
      { workspaceId: adults.teacherWorkspace._id, classId: klass._id, studentId: student._id, status: 'active' },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  return klass;
}

async function main() {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
  const adults = await ensurePilotAdults();
  const skills = await skillMap(['F001', 'F002', 'F003', 'F004', 'F005', 'F006', 'F007', 'F008', 'F015', 'F017']);
  const seeded = [];
  for (const spec of PILOT_STUDENTS) {
    seeded.push(await upsertPilotStudent({ spec, adults, skills }));
  }
  const klass = await ensureTeacherClass(adults, seeded.map((row) => row.student));

  console.log('✅ Seeded 5 pilot student accounts');
  console.log(`   Password for all pilot accounts: ${PASSWORD}`);
  console.log(`   Parent: ${adults.parent.email}`);
  console.log(`   Tutor: ${adults.tutor.email}`);
  console.log(`   Teacher: ${adults.teacher.email}`);
  console.log(`   Teacher class: ${klass.name} (${klass._id})`);
  seeded.forEach(({ user, student, evidence }) => {
    console.log(`   - ${user.email} | ${student.name} | ${student.level} | ${student.profile?.pilotProfile} | studentId=${student._id} | evidence=${JSON.stringify(evidence)}`);
  });
  const missingSkills = ['F001', 'F002', 'F003', 'F004', 'F005', 'F006', 'F007', 'F008', 'F015', 'F017'].filter((code) => !skills[code]);
  if (missingSkills.length) {
    console.log(`   Note: skipped some seeded mastery/mistake evidence because these skills were not found: ${missingSkills.join(', ')}`);
  }
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error('❌ Failed to seed pilot students:', err.message);
    try { await mongoose.disconnect(); } catch (_) { /* noop */ }
    process.exit(1);
  });
}
