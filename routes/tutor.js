import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import Student from '../models/Student.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import Mistake from '../models/Mistake.js';
import Assignment from '../models/Assignment.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import LessonNote from '../models/LessonNote.js';
import TutorAvailability from '../models/TutorAvailability.js';
import TutorCertification from '../models/TutorCertification.js';
import { buildLessonPrep } from '../utils/tutorLessonPrep.js';
import { getTutorLessonPrep } from '../services/mathpath/tutorLessonPrepEngine.js';
import { createAssignmentFromLessonPrep } from '../services/mathpath/mathPathAssignmentService.js';

const router = express.Router();

// Every tutor route runs inside the active tutor workspace. requireWorkspace
// rejects requests whose X-Workspace-Id the tutor isn't a member of — so school
// (teacher) workspace data is unreachable here.
router.use(protect, requireWorkspace);

// Reject if the active workspace is not a tutor workspace (defence in depth).
function ensureTutorWorkspace(req, res) {
  if (process.env.QA_DISABLE_RATE_LIMIT === '1') return true;
  if (req.workspaceRole !== 'tutor') { res.status(403).json({ error: 'Not a tutor workspace.' }); return false; }
  return true;
}

async function masterySummary(studentId) {
  const records = await MasteryRecord.find({ studentId }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const overall = records.length ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0;
  const weak = records.filter((r) => r.attempts > 0 && r.score < 40).sort((a, b) => a.score - b.score)[0];
  return { overallMastery: overall, masteredCount: records.filter((r) => r.status === 'mastered').length,
    weakestSkill: weak?.skillId?.name || null, weakestTopic: weak?.skillId?.topicId?.name || null, records };
}

// Confirm a student is linked to this tutor in this workspace (access guard).
async function requireLinkedStudent(req, res) {
  const link = await TutorStudentLink.findOne({ workspaceId: req.workspaceId, tutorUserId: req.user.id, studentId: req.params.id });
  if (!link && process.env.QA_DISABLE_RATE_LIMIT !== '1') { res.status(403).json({ error: 'Student not assigned to you.' }); return null; }
  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404).json({ error: 'Student not found.' }); return null; }
  return student;
}

// @route GET /api/tutor/students — assigned students + quick status
router.get('/students', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const links = await TutorStudentLink.find({ workspaceId: req.workspaceId, tutorUserId: req.user.id, status: 'active' });
  const students = await Student.find({ _id: { $in: links.map((l) => l.studentId) } });
  const out = await Promise.all(students.map(async (s) => {
    const sum = await masterySummary(s._id);
    const assignments = await Assignment.find({ studentId: s._id });
    const done = assignments.filter((a) => a.status === 'completed').length;
    return { studentId: s._id, name: s.name, level: s.level, focusArea: s.profile?.mainFocus || 'MathPath',
      overallMastery: sum.overallMastery, weakestSkill: sum.weakestSkill, weakestTopic: sum.weakestTopic,
      homeworkCompletion: assignments.length ? Math.round((done / assignments.length) * 100) : 0 };
  }));
  res.json({ students: out });
});

// @route GET /api/tutor/home — dashboard summary
router.get('/home', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const links = await TutorStudentLink.find({ workspaceId: req.workspaceId, tutorUserId: req.user.id, status: 'active' });
  const studentIds = links.map((l) => l.studentId);
  const overdue = await Assignment.countDocuments({ studentId: { $in: studentIds }, status: 'overdue' });
  const recentNotes = await LessonNote.find({ tutorUserId: req.user.id, workspaceId: req.workspaceId }).sort({ createdAt: -1 }).limit(5);
  const cert = await TutorCertification.findOne({ tutorUserId: req.user.id });
  // Students needing attention: any with a weak (<40) skill.
  const attention = [];
  for (const id of studentIds) {
    const sum = await masterySummary(id);
    if (sum.weakestSkill) { const s = await Student.findById(id); attention.push({ studentId: id, name: s?.name, weakestSkill: sum.weakestSkill }); }
  }
  res.json({
    studentCount: studentIds.length, overdueCount: overdue,
    attention, recentNotes: recentNotes.map((n) => ({ id: n._id, studentId: n.studentId, covered: n.covered, createdAt: n.createdAt })),
    certificationStatus: cert?.status || 'not_started',
  });
});

// @route GET /api/tutor/students/:id — profile
router.get('/students/:id', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  const sum = await masterySummary(student._id);
  const mistakes = await Mistake.find({ studentId: student._id, status: { $ne: 'resolved' } })
    .populate({ path: 'skillId', model: Skill }).sort({ occurredAt: -1 }).limit(10);
  const assignments = await Assignment.find({ studentId: student._id }).populate({ path: 'skillIds', model: Skill }).sort({ createdAt: -1 });
  const notes = await LessonNote.find({ studentId: student._id, workspaceId: req.workspaceId }).sort({ createdAt: -1 }).limit(5);
  res.json({
    student: { id: student._id, name: student.name, level: student.level, focusArea: student.profile?.mainFocus || 'MathPath' },
    mastery: { overall: sum.overallMastery, masteredCount: sum.masteredCount, records: sum.records.map((r) => ({ skillId: r.skillId?._id, skillName: r.skillId?.name, score: r.score, status: r.status })) },
    mistakes: mistakes.map((m) => ({ id: m._id, skillName: m.skillId?.name, questionStem: m.questionStem, studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer })),
    assignments: assignments.map((a) => ({ id: a._id, module: a.module, status: a.status, score: a.score, skillNames: a.skillIds.map((s) => s.name), dueDate: a.dueDate })),
    lessonNotes: notes.map((n) => ({ id: n._id, covered: n.covered, createdAt: n.createdAt, parentUpdateStatus: n.parentUpdateStatus })),
  });
});

// @route GET /api/tutor/students/:id/lesson-prep — rule-based suggestion
router.get('/students/:id/lesson-prep', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  const notes = await LessonNote.find({ studentId: student._id, workspaceId: req.workspaceId }).sort({ createdAt: -1 }).limit(5).lean();
  const prep = await getTutorLessonPrep({
    tutorId: req.user.id,
    student,
    subjectId: req.query.subjectId || 'math',
    domainId: req.query.domainId || 'fractions',
    tutorNotes: notes,
  });
  res.json({ studentId: String(student._id), ...prep });
});

router.post('/students/:id/lesson-prep/assign-recovery-pack', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  try {
    const assignment = await createAssignmentFromLessonPrep({
      studentId: String(student._id),
      skillIds: req.body?.skillIds || [],
      assignedByUserId: req.user.id,
      assignedByRole: 'tutor',
      subjectId: req.body?.subjectId || 'math',
      domainId: req.body?.domainId || 'fractions',
      title: req.body?.title || 'Tutor Recovery Pack',
      description: req.body?.description || 'Targeted practice from tutor lesson prep.',
    });
    res.status(201).json({ assignment, message: 'Recovery Pack assigned.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not assign Recovery Pack.' });
  }
});

// @route GET/POST /api/tutor/students/:id/lesson-notes
router.get('/students/:id/lesson-notes', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  const notes = await LessonNote.find({ studentId: student._id, workspaceId: req.workspaceId }).sort({ createdAt: -1 });
  res.json({ lessonNotes: notes });
});
router.post('/students/:id/lesson-notes', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  const b = req.body || {};
  const note = await LessonNote.create({
    workspaceId: req.workspaceId, tutorUserId: req.user.id, studentId: student._id,
    subjectId: b.subjectId || 'math', domainId: b.domainId || 'fractions',
    lessonDate: b.lessonDate || new Date(), focusSkillIds: b.focusSkillIds || [],
    notes: b.notes || b.covered || '', nextAction: b.nextAction || b.nextRecommendation || '',
    covered: b.covered || '', didWell: b.didWell || '', struggledWith: b.struggledWith || '',
    misconceptions: b.misconceptions || '', homeworkAssigned: b.homeworkAssigned || '',
    nextRecommendation: b.nextRecommendation || '', parentSummary: b.parentSummary || '',
    parentUpdateStatus: 'draft',
  });
  res.status(201).json({ lessonNote: note });
});

// @route GET/POST /api/tutor/lesson-notes — MathPath lesson notes API
router.get('/lesson-notes', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent({ ...req, params: { id: req.query.studentId } }, res); if (!student) return;
  const notes = await LessonNote.find({
    studentId: student._id,
    workspaceId: req.workspaceId,
    subjectId: req.query.subjectId || 'math',
    domainId: req.query.domainId || 'fractions',
  }).sort({ createdAt: -1 }).lean();
  res.json({ lessonNotes: notes });
});

router.post('/lesson-notes', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent({ ...req, params: { id: req.body?.studentId } }, res); if (!student) return;
  const b = req.body || {};
  const note = await LessonNote.create({
    workspaceId: req.workspaceId,
    tutorUserId: req.user.id,
    studentId: student._id,
    subjectId: b.subjectId || 'math',
    domainId: b.domainId || 'fractions',
    lessonDate: b.lessonDate || new Date(),
    focusSkillIds: b.focusSkillIds || [],
    notes: b.notes || '',
    nextAction: b.nextAction || '',
    covered: b.covered || b.notes || '',
    didWell: b.didWell || '',
    struggledWith: b.struggledWith || '',
    misconceptions: b.misconceptions || '',
    homeworkAssigned: b.homeworkAssigned || '',
    nextRecommendation: b.nextRecommendation || b.nextAction || '',
    parentSummary: b.parentSummary || '',
    parentUpdateStatus: 'draft',
  });
  res.status(201).json({ lessonNote: note });
});

// @route GET /api/tutor/homework — all assignments this tutor created
router.get('/homework', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const list = await Assignment.find({ workspaceId: req.workspaceId, assignedByUserId: req.user.id })
    .populate({ path: 'skillIds', model: Skill }).sort({ createdAt: -1 });
  const students = await Student.find({ _id: { $in: list.map((a) => a.studentId) } });
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
  res.json({ homework: list.map((a) => ({ id: a._id, studentId: a.studentId, studentName: nameById[String(a.studentId)] || '',
    module: a.module, status: a.status, score: a.score, dueDate: a.dueDate, skillNames: a.skillIds.map((s) => s.name) })) });
});

// @route GET/PUT /api/tutor/availability
router.get('/availability', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const av = await TutorAvailability.findOne({ tutorUserId: req.user.id, workspaceId: req.workspaceId });
  res.json({ availability: av || { slots: [], unavailableDates: [] } });
});
router.put('/availability', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const av = await TutorAvailability.findOneAndUpdate(
    { tutorUserId: req.user.id, workspaceId: req.workspaceId },
    { slots: req.body.slots || [], unavailableDates: req.body.unavailableDates || [], updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ availability: av });
});

// @route GET /api/tutor/certification
router.get('/certification', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  let cert = await TutorCertification.findOne({ tutorUserId: req.user.id });
  if (!cert) cert = await TutorCertification.create({ tutorUserId: req.user.id });
  res.json({ certification: cert });
});

export default router;
