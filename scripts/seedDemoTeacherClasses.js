// Demo teacher seed: two full classes (Sec 1 G1 + Primary 4 Maths) with:
//   - Student User accounts (username login, no personal email)
//   - Parent User accounts tied to each student (school-invite guardian link)
//   - Varied math background profiles per student
//   - Mastery records, open mistakes, and interventions
//   - Practice sessions, fluency records, and retention reviews
//
//   node scripts/seedDemoTeacherClasses.js   (or: npm run seed:demo-classes)
//
// Depends on: seed:foundation (creates demo.teacher account + P4 skills).
// Idempotent: clears and re-creates only the two named classes and their users.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import InterventionRecord from '../models/InterventionRecord.js';
import PracticeSession from '../models/PracticeSession.js';
import FluencyRecord from '../models/FluencyRecord.js';
import RetentionReview from '../models/RetentionReview.js';
import Assignment from '../models/Assignment.js';
import StudentNote from '../models/StudentNote.js';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run in production.');
  process.exit(1);
}

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const STUDENT_PASSWORD = 'Learn2026!';
const PARENT_PASSWORD  = 'Parent2026!';

// ─── Name pools ──────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Aiden','Brianna','Caleb','Diana','Ethan','Fiona','Gabriel','Hannah','Isaac','Jasmine',
  'Kai','Layla','Marcus','Natalie','Oliver','Priya','Ryan','Sophie','Tristan','Uma',
  'Vivian','Wayne','Xin Yi','Yusof','Zara','Aaron','Beth','Chester','Denise','Eugene',
  'Felicia','Glenn','Huiling','Ivan','Jean','Kenneth','Lisa','Michael','Nina','Owen',
  'Patricia','Qian','Reuben','Serena','Timothy','Ursula','Victor','Wendy',
];
const SURNAMES = [
  'Lim','Tan','Ng','Chua','Wong','Lee','Koh','Yeo','Teo','Ong',
  'Chen','Goh','Sim','Rajan','Lau','Khoo','Binte Noor','Krishnan','Siew','Heng',
  'Yap','Chew','Wee','Ho','Phua','Seah','Low','Tay','Quek','Boon',
];

function makeName(i) {
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${SURNAMES[i % SURNAMES.length]}`;
}

// Class codes used in usernames
const S1_CODE = 's1g1';
const P4_CODE = 'p4m';

function makeUsername(classCode, fullName, idx) {
  const first = fullName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  return `${classCode}.${first}.${String(idx + 1).padStart(2, '0')}`;
}

// ─── Mastery helpers ──────────────────────────────────────────────────────────

const statusFor = (s) => (s >= 80 ? 'mastered' : s < 50 ? 'needs_review' : 'learning');
const masteryStateFor = (s) =>
  s >= 90 ? 'retained' : s >= 80 ? 'mastered' : s >= 65 ? 'secure' : s >= 50 ? 'developing' : 'emerging';

function scoreFor(studentIdx, skillIdx, classSize) {
  const band = studentIdx / classSize;
  const jitter = ((studentIdx * 7 + skillIdx * 13) % 15) - 7;
  const base = band < 0.15 ? 90 : band < 0.70 ? 68 : 36;
  return Math.min(98, Math.max(20, base + jitter - skillIdx * 2));
}

// ─── Math profile descriptions ────────────────────────────────────────────────

const S1_TOP = [
  'Top of class; masters algebraic manipulation and geometric reasoning with ease.',
  'Exceptional accuracy; fluent in solving linear equations and angle problems.',
  'High achiever; extends Sec 1 concepts beyond syllabus and explains workings clearly.',
  'Strong in both algebra and geometry; consistently scores above 85 across all skills.',
  'Excellent abstract thinking; navigates symbolic algebra and proofs confidently.',
  'Star performer; first to attempt challenge questions; strongest in the cohort.',
];
const S1_MID = [
  'Solid grasp of variables; building confidence with linear equations.',
  'Comfortable with angle properties; developing algebraic manipulation skills.',
  'Average progress; understands structured examples but needs prompting on novel problems.',
  'Good conceptual base; makes occasional sign errors in algebraic working.',
  'Steady improvement; stronger in geometry than algebra; needs more equation practice.',
];
const S1_WEAK = [
  'Needs support: persistent gaps in simplifying expressions; avoids abstract problems.',
  'Struggling with equation-solving; relies on substitution guessing rather than method.',
  'Needs support: confuses angle rules; low accuracy in geometric problems.',
  'Very weak foundation in algebra; requires scaffolded tasks and concrete examples.',
];

const P4_TOP = [
  'Mastered all P4 topics; models fraction word problems independently.',
  'Top of class; exceptional number sense and accurate across all four operations.',
  'Strong in fractions and decimals; handles multi-step problems with confidence.',
  'Excellent P4 foundation; ready for P5 extension work.',
  'High achiever; fluent in mental math and area calculations.',
  'Star performer; extends naturally into P5 territory; fast and accurate.',
];
const P4_MID = [
  'Good whole-number skills; still developing fraction equivalence concepts.',
  'Comfortable with decimals; building confidence with perimeter and area problems.',
  'Average progress; solid on straightforward problems, struggles with multi-step.',
  'On track; understands place value well, working on fraction-decimal conversions.',
  'Steady learner; stronger in whole numbers than fractions; needs fraction practice.',
];
const P4_WEAK = [
  'Needs support: gaps in equivalent fractions and mixed-number operations.',
  'Struggling with decimal place value; confuses tenths and hundredths regularly.',
  'Needs support: below expected P4 level in fractions; intervention sessions ongoing.',
  'Very weak in fraction and decimal work; relies on counting strategies for multiplication.',
];

function mathProfile(idx, classSize, profiles) {
  const band = idx / classSize;
  const topCut  = Math.ceil(classSize * 0.15);
  const midCut  = Math.ceil(classSize * 0.70);
  if (idx < topCut)  return profiles.top[idx % profiles.top.length];
  if (idx < midCut)  return profiles.mid[(idx - topCut) % profiles.mid.length];
  return profiles.weak[(idx - midCut) % profiles.weak.length];
}

// ─── Secondary 1 skill setup ──────────────────────────────────────────────────

async function ensureS1Skills(mathSubject) {
  const MAP = [
    { topic: 'Algebra',  skills: ['Variables and expressions','Simplifying algebraic terms','Solving linear equations'] },
    { topic: 'Geometry', skills: ['Angles on a straight line','Properties of triangles','Area of composite figures'] },
  ];
  const all = [];
  for (let t = 0; t < MAP.length; t++) {
    const def = MAP[t];
    let topic = await Topic.findOne({ subjectId: mathSubject._id, name: def.topic });
    if (!topic) topic = await Topic.create({ subjectId: mathSubject._id, name: def.topic, moeLevel: 'Secondary 1', order: 100 + t });
    for (let s = 0; s < def.skills.length; s++) {
      let skill = await Skill.findOne({ topicId: topic._id, name: def.skills[s] });
      if (!skill) skill = await Skill.create({ topicId: topic._id, name: def.skills[s], moeLevel: 'Secondary 1', order: s });
      all.push(skill);
    }
  }
  return all;
}

// ─── Progress helpers ─────────────────────────────────────────────────────────

const SESSION_MODES = {
  top:  ['fluency', 'mastery_check', 'practice', 'fluency', 'mastery_check', 'practice'],
  mid:  ['practice', 'practice', 'mastery_check', 'practice'],
  weak: ['remediation', 'practice', 'remediation'],
};
const FLUENCY_STATUS = { top: 'fluent', mid: 'developing', weak: 'not_fluent' };

function tierOf(idx, classSize) {
  const b = idx / classSize;
  return b < 0.15 ? 'top' : b < 0.70 ? 'mid' : 'weak';
}

async function seedProgressData({ student, usedSkills, idx, classSize, ws }) {
  const tier    = tierOf(idx, classSize);
  const modes   = SESSION_MODES[tier];
  const baseAcc = tier === 'top' ? 88 : tier === 'weak' ? 38 : 66;

  // ── Practice sessions ──────────────────────────────────────────────────────
  // Spread sessions back over the past 28 days; top students practice more often.
  const sessionDayGaps = tier === 'top' ? [2, 5, 9, 14, 19, 26]
                       : tier === 'weak' ? [4, 18]
                       : [3, 9, 17, 26];

  for (let s = 0; s < modes.length; s++) {
    const daysAgo   = sessionDayGaps[s] ?? 28;
    const startedAt = new Date(Date.now() - daysAgo * 86400000 - idx * 3600000);
    const durationMs = (12 + s * 4) * 60000;
    const endedAt   = new Date(startedAt.getTime() + durationMs);
    const jitter    = ((idx * 5 + s * 11) % 14) - 7;
    const scorePct  = Math.min(100, Math.max(18, baseAcc + jitter));
    const total     = 8 + (s % 5);
    const correct   = Math.round(total * scorePct / 100);
    const skillSlice = usedSkills.slice(s % usedSkills.length, (s % usedSkills.length) + 2);

    await PracticeSession.create({
      studentId: student._id, workspaceId: ws._id, module: 'MathPath',
      mode: modes[s], skillIds: skillSlice.map((sk) => sk._id),
      status: 'completed', startedAt, endedAt,
      summary: {
        total, correct, scorePct,
        avgTimeMs: tier === 'top' ? 9000 + s * 500 : tier === 'weak' ? 22000 + s * 1000 : 14000 + s * 800,
        fluencyScore: tier === 'top' ? 82 + (s % 12) : tier === 'weak' ? 28 + s * 3 : 56 + s * 4,
        fluencyStatus: tier === 'top' ? 'automatic' : tier === 'weak' ? 'effortful' : 'developing',
      },
    });
  }

  // ── Fluency records (one per skill) ────────────────────────────────────────
  for (let j = 0; j < usedSkills.length; j++) {
    const sk       = usedSkills[j];
    const baseScore = scoreFor(idx, j, classSize);
    const totalQ   = tier === 'top' ? 72 + j * 4 : tier === 'weak' ? 18 + j * 2 : 40 + j * 3;
    const accuracy = Math.min(0.98, Math.max(0.18, baseScore / 100));
    const fluencyScore = Math.round(accuracy * 100 * (tier === 'top' ? 0.95 : tier === 'weak' ? 0.5 : 0.75));
    const becameFluentAt = tier === 'top' && j < 3 ? new Date(Date.now() - (30 - j * 5) * 86400000) : null;

    await FluencyRecord.create({
      studentId: student._id, skillId: sk._id,
      skillName: sk.name, skillCode: sk._id.toString().slice(-6),
      totalQuestions: totalQ,
      correctAnswers: Math.round(totalQ * accuracy),
      accuracy: Math.round(accuracy * 100) / 100,
      averageTimeSeconds: tier === 'top' ? 8 + j : tier === 'weak' ? 28 + j * 2 : 16 + j,
      confidenceAverage: Math.round(accuracy * 10) / 10,
      workingSubmissionRate: tier === 'top' ? 0.7 : tier === 'weak' ? 0.2 : 0.45,
      fluencyScore,
      fluencyStatus: FLUENCY_STATUS[tier],
      becameFluentAt,
    });
  }

  // ── Retention reviews (SRS schedule) ───────────────────────────────────────
  // Three spaced intervals: 1-day, 7-day, 14-day — seeded for the first 3 skills.
  const intervals = [1, 7, 14];
  for (let j = 0; j < Math.min(3, usedSkills.length); j++) {
    const sk = usedSkills[j];
    for (const intervalDays of intervals) {
      const reviewDate = new Date(Date.now() - (28 - intervalDays - j * 2) * 86400000);
      const isPast = reviewDate < new Date();
      const completed = tier === 'top' ? true : tier === 'weak' ? intervalDays === 1 : intervalDays <= 7;
      const retained  = completed && tier !== 'weak';
      const status    = !completed ? 'scheduled'
                      : retained  ? 'completed'
                      : 'retention_risk';

      await RetentionReview.create({
        studentId: student._id, skillId: sk._id,
        skillName: sk.name, skillCode: sk._id.toString().slice(-6),
        reviewDate, completed, retained, status, intervalDays,
        completedAt: completed ? new Date(reviewDate.getTime() + 3600000) : null,
        metrics: completed ? { score: scoreFor(idx, j, classSize), attempts: 5 } : null,
      });
    }
  }
}

// ─── Teacher notes & assignments ─────────────────────────────────────────────

const NOTES = {
  top: [
    'Consistently strong performer. Working independently at a high level — consider nominating for enrichment or competition.',
    'Excellent conceptual grasp and tidy working. A reliable anchor in group discussions.',
    'Top of the cohort this term. Rarely makes careless errors; can explain reasoning clearly to peers.',
    'Shows initiative — often attempts extension questions without prompting. Good candidate for peer tutoring.',
    'Strong across all assessed skills. Continue with challenge-level problems to maintain engagement.',
    'Self-directed learner. Marks her own work carefully and corrects mistakes before submitting.',
  ],
  mid: [
    'Making steady progress. Watch the second skill cluster — mild hesitation observed in recent sessions.',
    'Generally on track. Encourage more written working; tends to skip steps when confident.',
    'Average performer with a good attitude. Benefits from worked examples before attempting independently.',
    'Solid foundations. Needs targeted practice on the later skills before the next assessment.',
    'Consistent effort. Would benefit from a fluency drill session to consolidate automaticity.',
  ],
  weak: [
    'Falling behind on core skills. Assigned targeted practice pack. Parent contacted — follow up after next session.',
    'Significant gaps emerging. Placed in small-group support. Reassess in two weeks.',
    'Struggles to transfer concept understanding to independent practice. Requires scaffolded tasks.',
    'Attendance gaps may be a factor. Coordinate with form teacher. Intervention pack assigned.',
  ],
};

const ASSIGNMENT_TEMPLATES = {
  weak: [
    { module: 'MathPath', interventionType: 'practice_pack',   priority: 'high',   difficulty: 'easy',   questionCount: 8,  title: 'Skill Gap Repair — Core Practice' },
    { module: 'MathPath', interventionType: 'fluency_drill',   priority: 'high',   difficulty: 'easy',   questionCount: 10, title: 'Fluency Builder — Foundational Skills' },
  ],
  mid: [
    { module: 'MathPath', interventionType: 'fluency_drill',   priority: 'medium', difficulty: 'medium', questionCount: 10, title: 'Fluency Drill — Consolidation' },
    { module: 'MathPath', interventionType: 'retention_review',priority: 'medium', difficulty: 'medium', questionCount: 8,  title: 'Spaced Review — Key Skills' },
  ],
  top: [
    { module: 'MathPath', interventionType: 'retention_review',priority: 'low',    difficulty: 'hard',   questionCount: 12, title: 'Challenge Practice — Extension' },
  ],
};

async function seedNotesAndAssignments({ student, teacher, ws, usedSkills, idx, classSize }) {
  const tier = tierOf(idx, classSize);

  // ── Teacher observation note ───────────────────────────────────────────────
  const noteTexts = NOTES[tier];
  await StudentNote.create({
    studentId: student._id, workspaceId: ws._id,
    subjectKey: 'math', topicName: usedSkills[0]?.name ?? '',
    heading: 'Teacher Observation',
    text: noteTexts[idx % noteTexts.length],
  });

  // ── Assignment(s) ──────────────────────────────────────────────────────────
  const templates = ASSIGNMENT_TEMPLATES[tier];
  // Weak: two assignments; mid/top: one each (stagger mid so not all get one)
  const toAssign = tier === 'weak' ? templates
                 : tier === 'mid'  ? (idx % 3 !== 2 ? [templates[idx % templates.length]] : [])
                 : [templates[0]];

  const now = Date.now();
  for (let a = 0; a < toAssign.length; a++) {
    const tmpl = toAssign[a];
    const dueDays  = tier === 'weak' ? 5 + a * 3 : tier === 'mid' ? 10 : 14;
    const dueDate  = new Date(now + dueDays * 86400000);
    // Top tier: mark one as completed (assigned 12 days ago, completed 3 days ago)
    const isCompleted = tier === 'top';
    const assignedAt  = new Date(now - (isCompleted ? 12 : 2) * 86400000);

    await Assignment.create({
      workspaceId: ws._id, studentId: student._id,
      assignedByUserId: teacher._id, assignedByRole: 'teacher',
      module: tmpl.module, subject: 'Math',
      skillIds: usedSkills.slice(0, 2).map((sk) => sk._id),
      questionCount: tmpl.questionCount, difficulty: tmpl.difficulty,
      interventionType: tmpl.interventionType, priority: tmpl.priority,
      dueDate: isCompleted ? null : dueDate,
      status: isCompleted ? 'completed' : 'not_started',
      score: isCompleted ? scoreFor(idx, 0, classSize) : null,
      timestamps: {
        assignedAt,
        completedAt: isCompleted ? new Date(now - 3 * 86400000) : null,
      },
      completionDate: isCompleted ? new Date(now - 3 * 86400000) : null,
      nextAction: tier === 'weak' ? 'Reassess after completion.' : '',
    });
  }
}

// ─── Seed one class ───────────────────────────────────────────────────────────

async function seedClass({ ws, teacher, classCode, className, level, nameOffset, count, skills, profiles, manifest }) {
  // Clean existing class data (students, users, guardian links)
  const prevClass = await Class.findOne({ workspaceId: ws._id, name: className });
  if (prevClass) {
    const prevLinks = await ClassStudent.find({ classId: prevClass._id });
    const prevStudentIds = prevLinks.map((l) => l.studentId);
    const prevStudents = await Student.find({ _id: { $in: prevStudentIds } });
    const prevUserIds  = prevStudents.filter((s) => s.userId).map((s) => s.userId);
    // Parent users: look up guardian records
    const guardianLinks = await StudentGuardian.find({ studentId: { $in: prevStudentIds } });
    const prevParentIds = guardianLinks.map((g) => g.guardianUserId);
    await MasteryRecord.deleteMany({ studentId: { $in: prevStudentIds } });
    await Mistake.deleteMany({ studentId: { $in: prevStudentIds } });
    await PracticeSession.deleteMany({ studentId: { $in: prevStudentIds } });
    await FluencyRecord.deleteMany({ studentId: { $in: prevStudentIds } });
    await RetentionReview.deleteMany({ studentId: { $in: prevStudentIds } });
    await Assignment.deleteMany({ studentId: { $in: prevStudentIds } });
    await StudentNote.deleteMany({ studentId: { $in: prevStudentIds } });
    await InterventionRecord.deleteMany({ classId: prevClass._id });
    await StudentGuardian.deleteMany({ studentId: { $in: prevStudentIds } });
    await ClassStudent.deleteMany({ classId: prevClass._id });
    await Student.deleteMany({ _id: { $in: prevStudentIds } });
    await User.deleteMany({ _id: { $in: [...prevUserIds, ...prevParentIds] } });
    await Class.deleteOne({ _id: prevClass._id });
  }

  const klass = await Class.create({
    workspaceId: ws._id, teacherUserId: teacher._id,
    name: className, level, modules: ['MathPath'], academicYear: '2026', status: 'active',
  });

  const usedSkills = skills.slice(0, 6);
  let firstWeakStudentId = null;
  let weakCount = 0;

  const MISTAKE_STEMS = {
    'Secondary 1': ['Simplify: 3x + 2x − x', 'Solve: 2a + 5 = 13', 'Find 4y when y = 3'],
    'Primary 4':   ['Find the equivalent fraction: 2/3 = ?/12', 'Add: 0.7 + 0.45', 'Area of rectangle 8 cm × 5 cm = ?'],
  };
  const stems = MISTAKE_STEMS[level] || MISTAKE_STEMS['Primary 4'];

  for (let i = 0; i < count; i++) {
    const fullName = makeName(i + nameOffset);
    const username = makeUsername(classCode, fullName, i);
    const studentEmail = `${username}@students.tianos.test`;
    const parentEmail  = `parent.${username}@demo.tianos.test`;

    // Parent user
    const parent = await User.create({
      name: `Parent of ${fullName}`, email: parentEmail,
      password: PARENT_PASSWORD, role: 'parent', is_test_account: true,
    });

    // Student user
    const studentUser = await User.create({
      name: fullName, email: studentEmail, username,
      password: STUDENT_PASSWORD, role: 'student',
      studentLevel: level, linkedTo: parent._id, is_test_account: true,
    });

    const profile = mathProfile(i, count, profiles);

    const student = await Student.create({
      name: fullName, level,
      workspaceId: ws._id,
      userId: studentUser._id,
      createdByUserId: teacher._id,
      profile: {
        mainFocus: 'MathPath', modulesUsed: ['MathPath'],
        mathBackground: profile,
      },
    });

    await ClassStudent.create({ workspaceId: ws._id, classId: klass._id, studentId: student._id, status: 'active' });

    await StudentGuardian.create({
      studentId: student._id, guardianUserId: parent._id,
      workspaceId: ws._id, relation: 'parent',
      accessLevel: 'view_only', source: 'school_invite',
    });

    // Mastery records
    for (let j = 0; j < usedSkills.length; j++) {
      const score = scoreFor(i, j, count);
      await MasteryRecord.create({
        studentId: student._id, skillId: usedSkills[j]._id, workspaceId: ws._id,
        score, attempts: 4 + j, status: statusFor(score),
        masteryState: masteryStateFor(score),
        confidence: Math.round((score / 100) * 10) / 10,
        lastPracticedAt: new Date(Date.now() - (i + j) * 86400000),
      });
    }

    // Practice sessions, fluency records, retention reviews
    await seedProgressData({ student, usedSkills, idx: i, classSize: count, ws });

    // Teacher notes and assignments
    await seedNotesAndAssignments({ student, teacher, ws, usedSkills, idx: i, classSize: count });

    // Mistakes for weak students
    if (scoreFor(i, 0, count) < 50) {
      weakCount++;
      if (!firstWeakStudentId) firstWeakStudentId = student._id;
      for (let k = 0; k < 3; k++) {
        await Mistake.create({
          studentId: student._id, workspaceId: ws._id,
          skillId: usedSkills[0]._id, module: 'MathPath',
          questionId: new mongoose.Types.ObjectId(),
          questionStem: stems[k % stems.length],
          studentAnswer: '?', correctAnswer: 'See worked solution',
          mistakeType: 'concept_gap', status: 'open', seeded: true,
        });
      }
    }

    manifest.push({ class: className, idx: i + 1, name: fullName, level, username, profile });
  }

  if (firstWeakStudentId) {
    await InterventionRecord.create({
      workspaceId: ws._id, classId: klass._id,
      studentId: firstWeakStudentId, teacherUserId: teacher._id,
      targetSkillId: usedSkills[0]._id, status: 'needs_support',
      notes: `${weakCount} student(s) need support on ${usedSkills[0].name}. Small-group sessions started.`,
      nextAction: 'Reassess after 2 practice sessions.',
    });
  }

  console.log(`   ✅ ${className} — ${count} students (${weakCount} flagged weak, 1 intervention)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(URI);

  const teacher = await User.findOne({ email: 'demo.teacher@tianos.test' });
  if (!teacher) { console.error('Run `npm run seed:foundation` first.'); process.exit(1); }
  const ws = await Workspace.findOne({ ownerUserId: teacher._id, type: 'school' });
  if (!ws) { console.error('No school workspace found.'); process.exit(1); }

  const math = await Subject.findOne({ key: 'math' });
  if (!math) { console.error('Run `npm run seed:foundation` first.'); process.exit(1); }

  console.log(`\nSeeding demo classes in workspace: ${ws.name}`);

  const [p4Skills, s1Skills] = await Promise.all([
    Skill.find({ moeLevel: 'Primary 4' }).sort({ order: 1 }).limit(6),
    ensureS1Skills(math),
  ]);
  if (p4Skills.length < 3) { console.error('Not enough P4 skills — run seed:foundation first.'); process.exit(1); }

  const manifest = [];

  await seedClass({
    ws, teacher,
    classCode: S1_CODE, className: 'Sec 1 G1', level: 'Secondary 1',
    nameOffset: 0, count: 36,
    skills: s1Skills,
    profiles: { top: S1_TOP, mid: S1_MID, weak: S1_WEAK },
    manifest,
  });

  await seedClass({
    ws, teacher,
    classCode: P4_CODE, className: 'Primary 4 Maths', level: 'Primary 4',
    nameOffset: 4, count: 40,
    skills: p4Skills,
    profiles: { top: P4_TOP, mid: P4_MID, weak: P4_WEAK },
    manifest,
  });

  // ── Print manifest ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(110));
  console.log('STUDENT MANIFEST');
  console.log('═'.repeat(110));
  console.log('  Passwords:  students → Learn2026!   parents → Parent2026!');
  console.log('  Login:      POST /api/auth/login  { identifier: "<username>", password: "..." }');
  console.log('═'.repeat(110));

  let currentClass = '';
  for (const s of manifest) {
    if (s.class !== currentClass) {
      currentClass = s.class;
      console.log(`\n── ${s.class} (${s.level}) ──`);
      console.log(`  ${'#'.padEnd(3)} ${'Name'.padEnd(22)} ${'Username'.padEnd(24)} ${'Math background'}`);
      console.log(`  ${'─'.repeat(3)} ${'─'.repeat(22)} ${'─'.repeat(24)} ${'─'.repeat(55)}`);
    }
    console.log(`  ${String(s.idx).padEnd(3)} ${s.name.padEnd(22)} ${s.username.padEnd(24)} ${s.profile}`);
  }

  console.log('\n' + '═'.repeat(110));
  console.log(`  Teacher login:  demo.teacher@tianos.test  /  Passw0rd!`);
  console.log('═'.repeat(110) + '\n');

  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
