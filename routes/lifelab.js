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
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, 'lifelab-' + req.params.id + '-' + Date.now() + '.' + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|mp4|webm|mov/;
    const ok = allowed.test(file.mimetype.split('/').pop()) || allowed.test(file.originalname.split('.').pop().toLowerCase());
    cb(ok ? null : new Error('File type not allowed'), ok);
  },
});


const buildCompetencyStats = (subs) => {
  const rows = {};
  const normalizeArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  subs.forEach((s) => {
    const act = s.activityId;
    if (!act || s.status === 'not_started') return;
    const primary = normalizeArray(act.primaryE21cc);
    const secondary = normalizeArray(act.secondaryE21cc);
    const competencies = [...new Set([...primary, ...secondary])];
    competencies.forEach((competency) => {
      if (!competency) return;
      if (!rows[competency]) {
        rows[competency] = {
          competency,
          primary: primary.includes(competency),
          secondary: secondary.includes(competency),
          activities: 0,
          score: 0,
        };
      }
      rows[competency].activities += 1;
      rows[competency].score += 1;
    });
  });
  return Object.values(rows).sort((a, b) => b.score - a.score);
};

// ── Activity library (any signed-in user, for pickers) ────────────
router.get('/activities', protect, asyncHandler(async (req, res) => {
  const filter = { isLibrary: true };
  if (req.query.competency) {
    filter.$or = [
      { primaryE21cc: req.query.competency },
      { secondaryE21cc: req.query.competency },
    ];
  }
  if (req.query.subject) {
    filter.subject = req.query.subject;
  }
  const acts = await LifeLabActivity.find(filter).sort({ subject: 1, title: 1 });
  res.json({ activities: acts });
}));

router.get('/competencies', protect, asyncHandler(async (req, res) => {
  const docs = await LifeLabActivity.find({
    $or: [
      { primaryE21cc: { $exists: true, $ne: [] } },
      { secondaryE21cc: { $exists: true, $ne: [] } },
    ],
  }).select('primaryE21cc secondaryE21cc');

  const competencies = new Set();
  docs.forEach((doc) => {
    const primary = Array.isArray(doc.primaryE21cc) ? doc.primaryE21cc : doc.primaryE21cc ? [doc.primaryE21cc] : [];
    const secondary = Array.isArray(doc.secondaryE21cc) ? doc.secondaryE21cc : doc.secondaryE21cc ? [doc.secondaryE21cc] : [];
    primary.forEach((c) => competencies.add(c));
    secondary.forEach((c) => competencies.add(c));
  });

  res.json({ competencies: Array.from(competencies).sort() });
}));

router.get('/student/:studentId', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req, req.params.studentId);
  const subs = await LifeLabSubmission.find({ studentId: student._id }).populate({ path: 'activityId', model: LifeLabActivity }).sort({ createdAt: -1 });
  res.json({
    submissions: subs.map((s) => ({
      id: s._id,
      status: s.status,
      teacherFeedback: s.teacherFeedback,
      activity: s.activityId,
      dataRecorded: s.dataRecorded,
      reflectionResponse: s.reflectionResponse,
      evidenceUrl: s.evidenceUrl,
    })),
    competencies: buildCompetencyStats(subs),
  });
}));

// ── Teacher: assign an activity to a class / group / student ──────
router.post('/assign', protect, requireWorkspace, asyncHandler(async (req, res) => {
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
}));

// ── Teacher: submissions for a class (review) ─────────────────────
router.get('/submissions', protect, requireWorkspace, asyncHandler(async (req, res) => {
  if (req.workspaceRole !== 'teacher') return res.status(403).json({ error: 'Not a teacher workspace.' });
  const { classId } = req.query;
  const klass = await Class.findOne({ _id: classId, workspaceId: req.workspaceId, teacherUserId: req.user.id });
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const subs = await LifeLabSubmission.find({ classId }).populate({ path: 'activityId', model: LifeLabActivity });
  const students = await Student.find({ _id: { $in: subs.map((s) => s.studentId) } });
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
  res.json({
    submissions: subs.map((s) => ({
      id: s._id, studentName: nameById[String(s.studentId)] || '', activityTitle: s.activityId?.title,
      subject: s.activityId?.subject, dataRecorded: s.dataRecorded, reflectionResponse: s.reflectionResponse,
      evidenceUrl: s.evidenceUrl, teacherFeedback: s.teacherFeedback, status: s.status,
    })),
    competencies: buildCompetencyStats(subs),
  });
}));

// ── Teacher: give feedback ────────────────────────────────────────
router.post('/submissions/:id/feedback', protect, requireWorkspace, asyncHandler(async (req, res) => {
  if (req.workspaceRole !== 'teacher') return res.status(403).json({ error: 'Not a teacher workspace.' });
  const sub = await LifeLabSubmission.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });
  sub.teacherFeedback = req.body.feedback || '';
  sub.status = 'reviewed';
  sub.updatedAt = new Date();
  await sub.save();
  res.json({ submission: { id: sub._id, status: sub.status, teacherFeedback: sub.teacherFeedback } });
}));

// ── Student: my assigned LifeLab activities ───────────────────────
router.get('/me', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req).catch(() => null);
  if (!student) return res.json({ submissions: [] });
  const subs = await LifeLabSubmission.find({ studentId: student._id }).populate({ path: 'activityId', model: LifeLabActivity }).sort({ createdAt: -1 });
  res.json({
    submissions: subs.map((s) => ({
      id: s._id,
      status: s.status,
      teacherFeedback: s.teacherFeedback,
      activity: s.activityId,
      dataRecorded: s.dataRecorded,
      reflectionResponse: s.reflectionResponse,
      evidenceUrl: s.evidenceUrl,
    })),
    competencies: buildCompetencyStats(subs),
  });
}));

// ── Student: submit a response ────────────────────────────────────
router.post('/submissions/:id/submit', protect, asyncHandler(async (req, res) => {
  const sub = await LifeLabSubmission.findById(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });
  await resolveStudent(req, sub.studentId, { write: true }); // access check; view-only guardians may not submit
  sub.dataRecorded = req.body.dataRecorded || '';
  sub.reflectionResponse = req.body.reflectionResponse || '';
  sub.evidenceUrl = req.body.evidenceUrl || '';
  sub.status = 'submitted';
  sub.updatedAt = new Date();
  await sub.save();
  res.json({ submission: { id: sub._id, status: sub.status } });
}));


// -- Student: upload evidence file for a submission -----------------------
router.post('/submissions/:id/evidence', protect, upload.single('evidence'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const sub = await LifeLabSubmission.findById(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });
  await resolveStudent(req, sub.studentId, { write: true });
  sub.evidenceUrl = '/uploads/' + req.file.filename;
  sub.updatedAt = new Date();
  await sub.save();
  res.json({ evidenceUrl: sub.evidenceUrl });
}));

export default router;
