import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import Assignment from '../models/Assignment.js';
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import StudentGroup from '../models/StudentGroup.js';
import InterventionRecord from '../models/InterventionRecord.js';
import { buildSuggestedGroups } from '../utils/teacherGrouping.js';

const router = express.Router();
router.use(protect, requireWorkspace);

function ensureTeacherWorkspace(req, res) {
  if (req.workspaceRole !== 'teacher') { res.status(403).json({ error: 'Not a teacher workspace.' }); return false; }
  return true;
}

// A class the teacher owns in this workspace, or null (caller sends 404).
async function getOwnedClass(req) {
  return Class.findOne({ _id: req.params.id, workspaceId: req.workspaceId, teacherUserId: req.user.id });
}
async function rosterIds(classId) {
  const links = await ClassStudent.find({ classId, status: 'active' });
  return links.map((l) => l.studentId);
}

// Per-student mastery rolled up, plus weak skills (for grouping/mastery map).
async function studentMastery(studentIds) {
  const records = await MasteryRecord.find({ studentId: { $in: studentIds } })
    .populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const byStudent = new Map();
  for (const id of studentIds) byStudent.set(String(id), []);
  for (const r of records) byStudent.get(String(r.studentId))?.push(r);
  return byStudent;
}

function topicStatusForStudent(recordsInTopic) {
  if (!recordsInTopic.length) return 'not_started';
  if (recordsInTopic.some((r) => r.status === 'needs_review')) return 'needs_support';
  if (recordsInTopic.every((r) => r.status === 'mastered')) return 'mastered';
  return 'learning';
}

// ── Home ──────────────────────────────────────────────────────────
router.get('/home', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const classes = await Class.find({ workspaceId: req.workspaceId, teacherUserId: req.user.id, status: 'active' });
  const activeInterventions = await InterventionRecord.countDocuments({ workspaceId: req.workspaceId, status: { $in: ['needs_support', 'improving'] } });
  // Classes needing attention: any with students scoring needs_review.
  const attention = [];
  for (const c of classes) {
    const ids = await rosterIds(c._id);
    const recs = await MasteryRecord.find({ studentId: { $in: ids }, status: 'needs_review' });
    if (recs.length) attention.push({ classId: c._id, name: c.name, flagged: new Set(recs.map((r) => String(r.studentId))).size });
  }
  res.json({ classCount: classes.length, activeInterventions, attention });
});

// ── Classes ───────────────────────────────────────────────────────
router.get('/classes', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const classes = await Class.find({ workspaceId: req.workspaceId, teacherUserId: req.user.id }).sort({ createdAt: 1 });
  const out = await Promise.all(classes.map(async (c) => {
    const ids = await rosterIds(c._id);
    const recs = await MasteryRecord.find({ studentId: { $in: ids } }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
    const overall = recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : 0;
    const assignments = await Assignment.find({ studentId: { $in: ids } });
    const completion = assignments.length ? Math.round((assignments.filter((a) => a.status === 'completed').length / assignments.length) * 100) : 0;
    // Weakest topic = topic with lowest average score.
    const byTopic = {};
    for (const r of recs) { const t = r.skillId?.topicId?.name || '—'; (byTopic[t] ||= []).push(r.score); }
    const weakestTopic = Object.entries(byTopic).map(([t, arr]) => [t, arr.reduce((a, b) => a + b, 0) / arr.length]).sort((a, b) => a[1] - b[1])[0]?.[0] || null;
    return { classId: c._id, name: c.name, level: c.level, modules: c.modules, studentCount: ids.length, overallMastery: overall, completionRate: completion, weakestTopic };
  }));
  res.json({ classes: out });
});

router.get('/classes/:id', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const recs = await MasteryRecord.find({ studentId: { $in: ids } }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const overall = recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : 0;
  // Top weak topics by avg score.
  const byTopic = {};
  for (const r of recs) { const t = r.skillId?.topicId?.name || '—'; (byTopic[t] ||= []).push(r.score); }
  const topWeak = Object.entries(byTopic).map(([t, arr]) => ({ topic: t, avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })).sort((a, b) => a.avg - b.avg).slice(0, 3);
  // Students needing support.
  const byStudent = await studentMastery(ids);
  const students = await Student.find({ _id: { $in: ids } });
  const needSupport = students.filter((s) => (byStudent.get(String(s._id)) || []).some((r) => r.status === 'needs_review')).map((s) => ({ studentId: s._id, name: s.name }));
  res.json({ class: { id: c._id, name: c.name, level: c.level, modules: c.modules }, studentCount: ids.length, overallMastery: overall, topWeakTopics: topWeak, studentsNeedingSupport: needSupport });
});

// Class mastery map: topic × status counts, with affected (needs-support) students.
router.get('/classes/:id/mastery', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const math = await Subject.findOne({ key: 'math' });
  const topics = await Topic.find({ subjectId: math?._id }).sort({ order: 1 });
  const byStudent = await studentMastery(ids);
  const students = await Student.find({ _id: { $in: ids } });
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));

  const map = topics.map((t) => {
    const counts = { mastered: 0, learning: 0, needs_support: 0, not_started: 0 };
    const affected = [];
    for (const sid of ids) {
      const recs = (byStudent.get(String(sid)) || []).filter((r) => String(r.skillId?.topicId?._id) === String(t._id));
      const status = topicStatusForStudent(recs);
      counts[status]++;
      if (status === 'needs_support') affected.push({ studentId: sid, name: nameById[String(sid)] });
    }
    return { topicId: t._id, name: t.name, counts, affected };
  });
  res.json({ classId: c._id, topics: map });
});

router.get('/classes/:id/students', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const students = await Student.find({ _id: { $in: ids } });
  const byStudent = await studentMastery(ids);
  const interventions = await InterventionRecord.find({ classId: c._id });
  const intByStudent = Object.fromEntries(interventions.map((i) => [String(i.studentId), i.status]));
  const out = students.map((s) => {
    const recs = byStudent.get(String(s._id)) || [];
    const overall = recs.length ? Math.round(recs.reduce((a, r) => a + r.score, 0) / recs.length) : 0;
    const weak = recs.filter((r) => r.attempts > 0 && r.score < 40).sort((a, b) => a.score - b.score)[0];
    return { studentId: s._id, name: s.name, level: s.level, overallMastery: overall,
      weakestSkill: weak?.skillId?.name || null, status: recs.some((r) => r.status === 'needs_review') ? 'needs_support' : 'learning',
      interventionStatus: intByStudent[String(s._id)] || null };
  });
  res.json({ students: out });
});

// Single student detail (must be enrolled in a class in this workspace).
router.get('/students/:id', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const enrolled = await ClassStudent.findOne({ studentId: req.params.id, workspaceId: req.workspaceId });
  if (!enrolled) return res.status(403).json({ error: 'Student not in your classes.' });
  const student = await Student.findById(req.params.id);
  const recs = await MasteryRecord.find({ studentId: student._id }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const overall = recs.length ? Math.round(recs.reduce((a, r) => a + r.score, 0) / recs.length) : 0;
  const mistakes = await Mistake.find({ studentId: student._id, status: { $ne: 'resolved' } }).populate({ path: 'skillId', model: Skill }).sort({ occurredAt: -1 }).limit(10);
  const assignments = await Assignment.find({ studentId: student._id }).populate({ path: 'skillIds', model: Skill }).sort({ createdAt: -1 });
  res.json({
    student: { id: student._id, name: student.name, level: student.level },
    overallMastery: overall,
    weakTopics: recs.filter((r) => r.attempts > 0 && r.score < 70).sort((a, b) => a.score - b.score).slice(0, 5).map((r) => ({ skillName: r.skillId?.name, topicName: r.skillId?.topicId?.name, score: r.score, status: r.status })),
    mistakes: mistakes.map((m) => ({ id: m._id, skillName: m.skillId?.name, questionStem: m.questionStem, studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer })),
    assignments: assignments.map((a) => ({ id: a._id, module: a.module, status: a.status, score: a.score, skillNames: a.skillIds.map((s) => s.name) })),
  });
});

// ── Grouping ──────────────────────────────────────────────────────
router.get('/classes/:id/groups', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const byStudent = await studentMastery(ids);
  const students = await Student.find({ _id: { $in: ids } });
  const input = students.map((s) => ({
    studentId: s._id, name: s.name,
    weakSkills: (byStudent.get(String(s._id)) || []).filter((r) => r.attempts > 0).map((r) => ({ skillId: r.skillId?._id, skillName: r.skillId?.name, score: r.score })),
  }));
  const suggested = buildSuggestedGroups({ students: input });
  const saved = await StudentGroup.find({ classId: c._id });
  res.json({ classId: c._id, suggested, saved });
});

router.post('/classes/:id/groups', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const g = await StudentGroup.create({
    workspaceId: req.workspaceId, classId: c._id, teacherUserId: req.user.id,
    name: req.body.name || 'Group', basis: req.body.basis || 'weak_topic',
    targetSkillId: req.body.targetSkillId || null, studentIds: req.body.studentIds || [],
  });
  res.status(201).json({ group: g });
});

// ── Assign practice (class / group / individual) ──────────────────
router.post('/classes/:id/assign', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const { target = {}, module = 'MathPath', subject = 'Math', topicId = null, skillIds = [], difficulty = 'medium', questionCount = 10, dueDate = null } = req.body;

  let studentIds = [];
  if (target.type === 'class') studentIds = await rosterIds(c._id);
  else if (target.type === 'group') { const g = await StudentGroup.findOne({ _id: target.id, classId: c._id }); studentIds = g?.studentIds || []; }
  else if (target.type === 'student') studentIds = [target.id];
  if (!studentIds.length) return res.status(400).json({ error: 'No students in target.' });

  const docs = studentIds.map((sid) => ({
    workspaceId: req.workspaceId, studentId: sid, assignedByUserId: req.user.id, assignedByRole: 'teacher',
    module, subject, topicId, skillIds, difficulty, questionCount, dueDate, status: 'not_started',
  }));
  const created = await Assignment.insertMany(docs);
  res.status(201).json({ assigned: created.length });
});

// ── Intervention tracker ──────────────────────────────────────────
router.get('/classes/:id/interventions', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const list = await InterventionRecord.find({ classId: c._id }).populate({ path: 'targetSkillId', model: Skill });
  const students = await Student.find({ _id: { $in: list.map((i) => i.studentId) } });
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
  res.json({ interventions: list.map((i) => ({ id: i._id, studentId: i.studentId, studentName: nameById[String(i.studentId)] || '', targetSkill: i.targetSkillId?.name || null, status: i.status, notes: i.notes, nextAction: i.nextAction, startedAt: i.startedAt })) });
});

router.post('/classes/:id/interventions', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const i = await InterventionRecord.create({
    workspaceId: req.workspaceId, classId: c._id, studentId: req.body.studentId, teacherUserId: req.user.id,
    targetSkillId: req.body.targetSkillId || null, status: req.body.status || 'needs_support',
    notes: req.body.notes || '', nextAction: req.body.nextAction || '',
  });
  res.status(201).json({ intervention: i });
});

router.put('/interventions/:iid', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const i = await InterventionRecord.findOne({ _id: req.params.iid, workspaceId: req.workspaceId });
  if (!i) return res.status(404).json({ error: 'Intervention not found.' });
  for (const k of ['status', 'notes', 'nextAction']) if (req.body[k] !== undefined) i[k] = req.body[k];
  i.updatedAt = new Date();
  await i.save();
  res.json({ intervention: i });
});

// ── Simple report preview ─────────────────────────────────────────
router.get('/classes/:id/reports', async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const recs = await MasteryRecord.find({ studentId: { $in: ids } }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const assignments = await Assignment.find({ studentId: { $in: ids } });
  const overall = recs.length ? Math.round(recs.reduce((a, r) => a + r.score, 0) / recs.length) : 0;
  const byTopic = {};
  for (const r of recs) { const t = r.skillId?.topicId?.name || '—'; (byTopic[t] ||= []).push(r.score); }
  res.json({
    type: req.query.type || 'class_progress', className: c.name, generatedAt: new Date(),
    overallMastery: overall, studentCount: ids.length,
    assignmentCompletion: assignments.length ? Math.round((assignments.filter((a) => a.status === 'completed').length / assignments.length) * 100) : 0,
    topics: Object.entries(byTopic).map(([t, arr]) => ({ topic: t, avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })).sort((a, b) => a.avg - b.avg),
  });
});

export default router;
