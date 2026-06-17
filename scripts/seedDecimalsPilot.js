// Seed two Decimals pilot students for QA and demo purposes.
//
//   node scripts/seedDecimalsPilot.js   (or: npm run seed:decimals-pilot)
//
// Idempotent: upserts users by email, clears and re-seeds skill states.
// Run AFTER seed:fractions-alpha-pack so the workspace/student infra exists.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Student from '../models/Student.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';

dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutor-match';
const PASSWORD = 'Passw0rd!';
const DOMAIN_ID = 'decimals';

// D001–D006 skill IDs (P4 and one P5 foundation)
const P4_SKILLS = ['D001', 'D002', 'D003', 'D004', 'D006'];
const ALL_SKILLS = ['D001', 'D002', 'D003', 'D004', 'D005', 'D006', 'D007', 'D008', 'D009', 'D010', 'D011', 'D012', 'D013', 'D014'];

const PILOT_STUDENTS = [
  {
    name: 'Decimals Pilot Brand New P4',
    email: 'decimals.pilot1@tianos.test',
    level: 'Primary 4',
    description: 'Brand-new P4 student — no decimals history. First diagnostic will run.',
    skillStates: [],
  },
  {
    name: 'Decimals Pilot Weak P4',
    email: 'decimals.pilot2@tianos.test',
    level: 'Primary 4',
    description: 'P4 student who has attempted D001–D004 but struggles with D003/D004.',
    skillStates: [
      { skillId: 'D001', status: 'accurate', accuracy: 88, attemptCount: 15, correctCount: 13, fluencyLevel: 'bronze' },
      { skillId: 'D002', status: 'accurate', accuracy: 82, attemptCount: 12, correctCount: 10, fluencyLevel: 'notReady' },
      { skillId: 'D003', status: 'weak',     accuracy: 45, attemptCount: 10, correctCount: 4,  fluencyLevel: 'notReady' },
      { skillId: 'D004', status: 'weak',     accuracy: 52, attemptCount: 10, correctCount: 5,  fluencyLevel: 'notReady' },
      { skillId: 'D006', status: 'notStarted', accuracy: 0, attemptCount: 0, correctCount: 0 },
    ],
  },
  {
    name: 'Decimals Pilot Strong P5',
    email: 'decimals.pilot3@tianos.test',
    level: 'Primary 5',
    description: 'P5 student with secure P4 decimals, now working through P5 skills.',
    skillStates: [
      { skillId: 'D001', status: 'fluent',   accuracy: 95, attemptCount: 20, correctCount: 19, fluencyLevel: 'gold', masteredAt: new Date() },
      { skillId: 'D002', status: 'fluent',   accuracy: 92, attemptCount: 18, correctCount: 17, fluencyLevel: 'silver', masteredAt: new Date() },
      { skillId: 'D003', status: 'accurate', accuracy: 87, attemptCount: 15, correctCount: 13, fluencyLevel: 'bronze' },
      { skillId: 'D004', status: 'accurate', accuracy: 86, attemptCount: 14, correctCount: 12, fluencyLevel: 'bronze' },
      { skillId: 'D005', status: 'learning', accuracy: 68, attemptCount: 8,  correctCount: 5,  fluencyLevel: 'notReady' },
      { skillId: 'D006', status: 'fluent',   accuracy: 90, attemptCount: 16, correctCount: 14, fluencyLevel: 'silver', masteredAt: new Date() },
      { skillId: 'D007', status: 'learning', accuracy: 60, attemptCount: 6,  correctCount: 4,  fluencyLevel: 'notReady' },
      { skillId: 'D010', status: 'notStarted', accuracy: 0, attemptCount: 0, correctCount: 0 },
      { skillId: 'D012', status: 'notStarted', accuracy: 0, attemptCount: 0, correctCount: 0 },
    ],
  },
];

async function ensureUser(email, name) {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ name, email, role: 'student', password: PASSWORD });
    await user.save();
    console.log(`  Created user: ${email}`);
  }
  return user;
}

async function ensureWorkspaceAndStudent(user) {
  let workspace = await Workspace.findOne({ ownerId: user._id, type: 'personal' });
  if (!workspace) {
    workspace = await Workspace.create({ name: `${user.name}'s Space`, ownerId: user._id, type: 'personal' });
    await WorkspaceMember.create({ workspaceId: workspace._id, userId: user._id, role: 'owner' });
  }
  let student = await Student.findOne({ userId: user._id, workspaceId: workspace._id });
  if (!student) {
    student = await Student.create({ name: user.name, userId: user._id, workspaceId: workspace._id, createdByUserId: user._id });
  }
  return { workspace, student };
}

async function seedStudent(spec) {
  console.log(`\nSeeding: ${spec.name}`);
  const user = await ensureUser(spec.email, spec.name);
  user.level = spec.level;
  await user.save();
  const { student } = await ensureWorkspaceAndStudent(user);

  // Clear existing decimals skill states for a clean re-seed.
  await MathPathStudentSkillState.deleteMany({ studentId: String(student._id), domainId: DOMAIN_ID });

  // Seed skill states from spec.
  for (const state of spec.skillStates) {
    await MathPathStudentSkillState.create({
      studentId: String(student._id),
      domainId: DOMAIN_ID,
      skillId: state.skillId,
      status: state.status,
      accuracy: state.accuracy ?? 0,
      attemptCount: state.attemptCount ?? 0,
      correctCount: state.correctCount ?? 0,
      fluencyLevel: state.fluencyLevel ?? 'notReady',
      masteredAt: state.masteredAt ?? null,
      lastPractisedAt: state.attemptCount ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
    });
  }

  console.log(`  Student _id: ${student._id}`);
  console.log(`  Skill states seeded: ${spec.skillStates.length}`);
  console.log(`  Description: ${spec.description}`);
}

async function main() {
  await mongoose.connect(URI);
  console.log('Connected to MongoDB');
  for (const spec of PILOT_STUDENTS) {
    await seedStudent(spec);
  }
  console.log('\nDone. Decimals pilot students seeded.');
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
