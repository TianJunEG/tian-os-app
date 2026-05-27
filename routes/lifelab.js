import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import LifeLabActivity from '../models/LifeLabActivity.js';
import LifeLabSubmission from '../models/LifeLabSubmission.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import StudentGroup from '../models/StudentGroup.js';
import { resolveStudent } from '../utils/studentContext.js';

const router = express.Router();

// ── Activity library (any signed-in user, for pickers) ────────────
router.get('/activities', protect, async (req, res) => {
  const filter = { $or: [{ isLibrary: true }] };
  const acts = await LifeLabActivity.find(filter).sort({ subject: 1, title: 1 });
  res.json({ activities: acts });
});

// ── Teacher: assign an activity to a class / group / student ──────
router.post('/assign', protect, requireWorkspace, async (req, res) => {
  if (req.workspaceRole !== 'teacher') return res.status(403).json({ error: 'Not a teacher workspace.' });
  const { classId, target = { type: 'class' }, activityId } = req.body;
  const klass = await Class.findOne({ _id: classId, workspaceId: req.workspaceId, teacherUserId: req.user.id });
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const activity = await LifeLabActivity.findById(activityId);
  if (!activity) return res.status(404).json({ error: 'Activity not found.' });

  let studentIds = [];
  if (target.type === 'class') studentIds = (await ClassStudent.find({ classId, status: 'active' })).map((l) => l.studentId);
  else if (target.type === 'group') { const g = await StudentGroup.findOne({ _id: target.id, classId }); studentIds = g?.studentIds || []; }
  else if (target.type === 'student') studentIds = [target.id];
  if (!studentIds.length) return res.status(400).json({ error: 'No students in target.' });

  const docs = studentIds.map((sid) => ({
    workspaceId: req.workspaceId, activityId: activity._id, studentId: sid, classId,
    assignedByUserId: req.user.id, status: 'not_started',
  }));
  const created = await LifeLabSubmission.insertMany(docs);
  res.status(201).json({ assigned: created.length });
});

// ── Teacher: submissions for a class (review) ─────────────────────
router.get('/submissions', protect, requireWorkspace, async (req, res) => {
  if (req.workspaceRole !== 'teacher') return res.status(403).json({ error: 'Not a teacher workspace.' });
  const { classId } = req.query;
  const klass = await Class.findOne({ _id: classId, workspaceId: req.workspaceId, teacherUserId: req.user.id });
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const subs = await LifeLabSubmission.find({ classId }).populate({ path: 'activityId', model: LifeLabActivity });
  const students = await Student.find({ _id: { $in: subs.map((s) => s.studentId) } });
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
  res.json({ submissions: subs.map((s) => ({
    id: s._id, studentName: nameById[String(s.studentId)] || '', activityTitle: s.activityId?.title,
    subject: s.activityId?.subject, dataRecorded: s.dataRecorded, reflectionResponse: s.reflectionResponse,
    evidenceUrl: s.evidenceUrl, teacherFeedback: s.teacherFeedback, status: s.status,
  })) });
});

// ── Teacher: give feedback ────────────────────────────────────────
router.post('/submissions/:id/feedback', protect, requireWorkspace, async (req, res) => {
  if (req.workspaceRole !== 'teacher') return res.status(403).json({ error: 'Not a teacher workspace.' });
  const sub = await LifeLabSubmission.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });
  sub.teacherFeedback = req.body.feedback || '';
  sub.status = 'reviewed';
  sub.updatedAt = new Date();
  await sub.save();
  res.json({ submission: { id: sub._id, status: sub.status, teacherFeedback: sub.teacherFeedback } });
});

// ── Student: my assigned LifeLab activities ───────────────────────
router.get('/me', protect, async (req, res) => {
  const student = await resolveStudent(req).catch(() => null);
  if (!student) return res.json({ submissions: [] });
  const subs = await LifeLabSubmission.find({ studentId: student._id }).populate({ path: 'activityId', model: LifeLabActivity }).sort({ createdAt: -1 });
  res.json({ submissions: subs.map((s) => ({
    id: s._id, status: s.status, teacherFeedback: s.teacherFeedback,
    activity: s.activityId, dataRecorded: s.dataRecorded, reflectionResponse: s.reflectionResponse,
  })) });
});

// ── Student: submit a response ────────────────────────────────────
router.post('/submissions/:id/submit', protect, async (req, res) => {
  const sub = await LifeLabSubmission.findById(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });
  await resolveStudent(req, sub.studentId); // access check (student or guardian/member)
  sub.dataRecorded = req.body.dataRecorded || '';
  sub.reflectionResponse = req.body.reflectionResponse || '';
  sub.evidenceUrl = req.body.evidenceUrl || '';
  sub.status = 'submitted';
  sub.updatedAt = new Date();
  await sub.save();
  res.json({ submission: { id: sub._id, status: sub.status } });
});

export default router;
