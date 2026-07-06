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
import MathPathAssignment from '../models/mathpath/MathPathAssignment.js';
import Worksheet from '../models/Worksheet.js';
import { buildSuggestedGroups } from '../utils/teacherGrouping.js';
import { buildWeakGroupsForClass } from '../services/teacher/weakGroupEngine.js';
import { buildClassDashboard } from '../services/teacher/classDashboardService.js';
import { createAssignmentFromLessonPrep, createRecheckForAssignment } from '../services/mathpath/mathPathAssignmentService.js';
import { userCanAccessPartnerStudent } from '../services/partners/partnerAccessService.js';
import { generateWorksheet } from '../utils/worksheetGen.js';
import PSLSession from '../models/psl/PSLSession.js';
import PSLSkill from '../models/psl/PSLSkill.js';
import PSLAttempt from '../models/psl/PSLAttempt.js';
import TestPaperSession from '../models/TestPaperSession.js';
import { projectMarkedSitting } from '../utils/testPaperSitting.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import ClassDiagnosticSession from '../models/ClassDiagnosticSession.js';
import { createClassDiagnosticSession, createClassPracticeSession, buildKioskStatus, buildKioskStudentDetail } from '../services/kiosk/classDiagnosticService.js';
import { getDiagnosticDomain } from '../services/diagnostics/diagnosticDomainRegistry.js';
import { parseRosterCsv, importRoster, createStudentRecord } from '../services/school/schoolAdminService.js';
import multer from 'multer';
import QuickMarkSession, { QUICK_MARK_STATUSES } from '../models/QuickMarkSession.js';
import { persistUploadFile } from '../services/storage/objectStore.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import AnnouncementComment from '../models/AnnouncementComment.js';
import { notifyNewAnnouncement, publicAnnouncement } from '../services/announcements/announcementService.js';
import { linkGuardianByEmail } from '../services/guardians/guardianLinkService.js';

const quickMarkPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image photos are supported.'));
  },
});

function publicQuickMark(session) {
  return {
    quickMarkId: String(session._id),
    classId: String(session.classId),
    title: session.title,
    status: session.status,
    createdAt: session.createdAt,
    marks: (session.marks || []).map((m) => ({
      studentId: String(m.studentId),
      name: m.name,
      status: m.status,
      note: m.note || '',
      photoUrl: m.photoUrl || '',
      markedAt: m.markedAt,
    })),
  };
}

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

async function resolveSkillDocumentIds(skillIds = []) {
  const codes = skillIds.map((value) => String(value || '').trim().toUpperCase()).filter(Boolean);
  if (!codes.length) return [];
  const skills = await Skill.find({
    $or: [
      { _id: { $in: codes.filter((code) => /^[a-f\d]{24}$/i.test(code)) } },
      { slug: { $in: codes } },
      { 'metadata.frameworkCode': { $in: codes } },
      { 'metadata.mathPathSkillId': { $in: codes } },
      { 'metadata.officialSkillCode': { $in: codes } },
    ],
  }).select('_id').lean();
  return skills.map((skill) => skill._id);
}

function topicStatusForStudent(recordsInTopic) {
  if (!recordsInTopic.length) return 'not_started';
  if (recordsInTopic.some((r) => r.status === 'needs_review')) return 'needs_support';
  if (recordsInTopic.every((r) => r.status === 'mastered')) return 'mastered';
  return 'learning';
}

// ── Home ──────────────────────────────────────────────────────────
router.get('/home', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const classes = await Class.find({ workspaceId: req.workspaceId, teacherUserId: req.user.id, status: 'active' });
  // Batch roster + mastery look-ups to avoid N+1.
  const classIds = classes.map((c) => c._id);
  // Scope the active-intervention count to THIS teacher's classes (not the whole workspace).
  const activeInterventions = await InterventionRecord.countDocuments({
    workspaceId: req.workspaceId,
    classId: { $in: classIds },
    status: { $in: ['needs_support', 'improving'] },
  });
  const allLinks = await ClassStudent.find({ classId: { $in: classIds }, status: 'active' }).select('classId studentId');
  const idsPerClass = new Map(classIds.map((id) => [String(id), []]));
  for (const l of allLinks) idsPerClass.get(String(l.classId))?.push(l.studentId);
  const allStudentIds = [...new Set(allLinks.map((l) => String(l.studentId)))];
  const reviewRecs = allStudentIds.length
    ? await MasteryRecord.find({ studentId: { $in: allStudentIds }, status: 'needs_review' }).select('studentId')
    : [];
  const reviewStudentSet = new Set(reviewRecs.map((r) => String(r.studentId)));
  const attention = [];
  for (const c of classes) {
    const ids = idsPerClass.get(String(c._id)) || [];
    const flagged = ids.filter((id) => reviewStudentSet.has(String(id))).length;
    if (flagged) attention.push({ classId: c._id, name: c.name, flagged });
  }
  res.json({ classCount: classes.length, activeInterventions, attention });
}));

// ── Classes ───────────────────────────────────────────────────────
router.get('/classes', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const classes = await Class.find({ workspaceId: req.workspaceId, teacherUserId: req.user.id }).sort({ createdAt: 1 });
  if (!classes.length) return res.json({ classes: [] });

  // Batch all roster + mastery + assignment queries — avoids N queries per class.
  const classIds = classes.map((c) => c._id);
  const allLinks = await ClassStudent.find({ classId: { $in: classIds }, status: 'active' }).select('classId studentId');
  const idsPerClass = new Map(classIds.map((id) => [String(id), []]));
  for (const l of allLinks) idsPerClass.get(String(l.classId))?.push(l.studentId);
  const allStudentIds = [...new Set(allLinks.map((l) => String(l.studentId)))];

  const [allRecs, allAssignments] = allStudentIds.length
    ? await Promise.all([
        MasteryRecord.find({ studentId: { $in: allStudentIds } }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } }),
        Assignment.find({ studentId: { $in: allStudentIds } }).select('studentId status'),
      ])
    : [[], []];

  const recsByStudent = new Map();
  for (const r of allRecs) { const k = String(r.studentId); if (!recsByStudent.has(k)) recsByStudent.set(k, []); recsByStudent.get(k).push(r); }
  const assignmentsByStudent = new Map();
  for (const a of allAssignments) { const k = String(a.studentId); if (!assignmentsByStudent.has(k)) assignmentsByStudent.set(k, []); assignmentsByStudent.get(k).push(a); }

  const out = classes.map((c) => {
    const ids = idsPerClass.get(String(c._id)) || [];
    const recs = ids.flatMap((id) => recsByStudent.get(String(id)) || []);
    const assignments = ids.flatMap((id) => assignmentsByStudent.get(String(id)) || []);
    const overall = recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : 0;
    const completion = assignments.length ? Math.round((assignments.filter((a) => a.status === 'completed').length / assignments.length) * 100) : 0;
    const byTopic = {};
    for (const r of recs) { const t = r.skillId?.topicId?.name || '—'; (byTopic[t] ||= []).push(r.score); }
    const weakestTopic = Object.entries(byTopic).map(([t, arr]) => [t, arr.reduce((a, b) => a + b, 0) / arr.length]).sort((a, b) => a[1] - b[1])[0]?.[0] || null;
    return { classId: c._id, name: c.name, level: c.level, modules: c.modules, studentCount: ids.length, overallMastery: overall, completionRate: completion, weakestTopic };
  });
  res.json({ classes: out });
}));

router.get('/classes/:id', asyncHandler(async (req, res) => {
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
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
  const needSupport = students.filter((s) => (byStudent.get(String(s._id)) || []).some((r) => r.status === 'needs_review')).map((s) => ({ studentId: s._id, name: s.name }));

  // Science Adaptive Revision aggregate — same shape, scoped to Science topics
  // so a teacher can see how the class is doing on Science alongside Math
  // without leaving the overview page.
  let science = { available: false, attemptedCount: 0, overallMastery: 0, topWeakTopics: [], needsSupport: [] };
  const sciSubject = await Subject.findOne({ key: 'science' });
  if (sciSubject) {
    const sciTopics = await Topic.find({ subjectId: sciSubject._id }).select('_id name');
    const sciTopicIds = new Set(sciTopics.map((t) => String(t._id)));
    const sciTopicNameById = Object.fromEntries(sciTopics.map((t) => [String(t._id), t.name]));
    const sciRecs = recs.filter((r) => sciTopicIds.has(String(r.skillId?.topicId?._id)));
    if (sciRecs.length) {
      const sciOverall = Math.round(sciRecs.reduce((s, r) => s + r.score, 0) / sciRecs.length);
      const sciByTopic = {};
      for (const r of sciRecs) {
        const t = sciTopicNameById[String(r.skillId?.topicId?._id)] || '—';
        (sciByTopic[t] ||= []).push(r.score);
      }
      const sciTopWeak = Object.entries(sciByTopic)
        .map(([t, arr]) => ({ topic: t, avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }))
        .sort((a, b) => a.avg - b.avg).slice(0, 3);
      const attemptedIds = new Set(sciRecs.map((r) => String(r.studentId)));
      const needSciSupport = [];
      for (const sid of attemptedIds) {
        const studentSciRecs = sciRecs.filter((r) => String(r.studentId) === sid);
        if (studentSciRecs.some((r) => r.status === 'needs_review')) {
          needSciSupport.push({ studentId: sid, name: nameById[sid] || '' });
        }
      }
      science = { available: true, attemptedCount: attemptedIds.size, overallMastery: sciOverall, topWeakTopics: sciTopWeak, needsSupport: needSciSupport };
    } else {
      science.available = true; // subject seeded but no class activity yet
    }
  }

  res.json({ class: { id: c._id, name: c.name, level: c.level, modules: c.modules }, studentCount: ids.length, overallMastery: overall, topWeakTopics: topWeak, studentsNeedingSupport: needSupport, science });
}));

// Class mastery map: topic × status counts, with affected (needs-support) students.
// Subject defaults to math for back-compat; pass ?subject=science to drill into
// the Science Adaptive Revision standing across the class.
router.get('/classes/:id/mastery', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const subjectKey = (req.query.subject || 'math').toLowerCase();
  const subject = await Subject.findOne({ key: subjectKey });
  if (!subject) return res.json({ classId: c._id, subject: subjectKey, topics: [] });
  const topics = await Topic.find({ subjectId: subject._id }).sort({ order: 1 });
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
    // Science topics carry the MOE level on the Topic itself (e.g. "Digestive
    // System" at P4 and P5); include it so the same-name topics across levels
    // are distinguishable in the UI.
    return { topicId: t._id, name: t.name, moeLevel: t.moeLevel || '', counts, affected };
  });
  res.json({ classId: c._id, subject: subjectKey, topics: map });
}));

router.get('/classes/:id/students', asyncHandler(async (req, res) => {
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
}));

// Corrections tracker: who has / hasn't done their corrections, and whether each
// correction was marked right. The Mistake "learning ladder" is:
//   new → acknowledged → corrected → understood → mastered
// plus correction_attempted (tried the correction but it was auto-marked wrong).
// A correction is "done" once learningStatus reaches corrected (or beyond); it is
// "outstanding" while still new / acknowledged / correction_attempted.
const CORRECTION_DONE = ['corrected', 'understood', 'mastered'];
router.get('/classes/:id/corrections', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const students = await Student.find({ _id: { $in: ids } }).select('name level').lean();

  const agg = await Mistake.aggregate([
    { $match: { studentId: { $in: ids }, status: { $ne: 'resolved' } } },
    { $group: {
      _id: '$studentId',
      total: { $sum: 1 },
      notStarted: { $sum: { $cond: [{ $eq: ['$learningStatus', 'new'] }, 1, 0] } },
      inProgress: { $sum: { $cond: [{ $eq: ['$learningStatus', 'acknowledged'] }, 1, 0] } },
      failed: { $sum: { $cond: [{ $eq: ['$learningStatus', 'correction_attempted'] }, 1, 0] } },
      done: { $sum: { $cond: [{ $in: ['$learningStatus', CORRECTION_DONE] }, 1, 0] } },
    } },
  ]);
  const byStudent = Object.fromEntries(agg.map((a) => [String(a._id), a]));

  const roster = students.map((s) => {
    const a = byStudent[String(s._id)] || {};
    const notStarted = a.notStarted || 0; const inProgress = a.inProgress || 0;
    const failed = a.failed || 0; const done = a.done || 0; const total = a.total || 0;
    const outstanding = notStarted + inProgress + failed;
    return {
      studentId: s._id, name: s.name, level: s.level,
      total, outstanding, done, notStarted, inProgress, failed,
      completionPct: total ? Math.round((done / total) * 100) : 100,
    };
  });
  // Most outstanding first; break ties by failed corrections (need help most).
  roster.sort((a, b) => b.outstanding - a.outstanding || b.failed - a.failed || a.name.localeCompare(b.name));

  res.json({
    class: { id: c._id, name: c.name, level: c.level },
    summary: {
      totalStudents: roster.length,
      studentsWithOutstanding: roster.filter((r) => r.outstanding > 0).length,
      studentsAllDone: roster.filter((r) => r.total > 0 && r.outstanding === 0).length,
      totalOutstanding: roster.reduce((s, r) => s + r.outstanding, 0),
      totalFailed: roster.reduce((s, r) => s + r.failed, 0),
    },
    students: roster,
  });
}));

// Drill-down: one student's outstanding (and recently corrected) mistakes, so the
// teacher can see exactly which corrections are pending or were marked wrong.
router.get('/classes/:id/corrections/:studentId', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = (await rosterIds(c._id)).map(String);
  if (!ids.includes(String(req.params.studentId))) return res.status(403).json({ error: 'Student not in this class.' });

  const mistakes = await Mistake.find({ studentId: req.params.studentId, status: { $ne: 'resolved' } })
    .populate({ path: 'skillId', model: Skill })
    .sort({ occurredAt: -1 })
    .limit(60)
    .lean();

  res.json({
    mistakes: mistakes.map((m) => ({
      id: m._id,
      skillName: m.skillId?.name || m.skillCode || 'Mistake',
      module: m.module,
      questionStem: m.questionStem || m.questionText || '',
      studentAnswer: m.studentAnswer,
      correctAnswer: m.correctAnswer,
      learningStatus: m.learningStatus || 'new',
      correctionAttempt: m.correctionAttempt || '',
      correctionDone: CORRECTION_DONE.includes(m.learningStatus),
      occurredAt: m.occurredAt || m.createdAt,
    })),
  });
}));

// ─── Test Papers — teacher visibility ───────────────────────────────────────
// Test papers are self-serve (a student sits any published paper; they are NOT
// assigned to a class), so the teacher view is by-student: which of my students
// have sat papers, how they scored, and a full per-question review of any sitting.

// Class roster with each student's completed-test-paper activity.
router.get('/classes/:id/test-papers', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const students = await Student.find({ _id: { $in: ids } }).select('name level').lean();

  const sittings = await TestPaperSession.find({ studentId: { $in: ids }, status: 'completed' })
    .select('studentId paperCode paperTitle category topic summary completedAt')
    .sort({ completedAt: -1 })
    .lean();
  const byStudent = new Map();
  for (const s of sittings) {
    const k = String(s.studentId);
    if (!byStudent.has(k)) byStudent.set(k, []);
    byStudent.get(k).push(s);
  }

  const roster = students.map((s) => {
    const list = byStudent.get(String(s._id)) || [];           // already newest-first
    const scores = list.map((l) => l.summary?.scorePct || 0);
    const latest = list[0] || null;
    return {
      studentId: s._id, name: s.name, level: s.level,
      sittingCount: list.length,
      papersAttempted: new Set(list.map((l) => l.paperCode)).size,
      bestScorePct: scores.length ? Math.max(...scores) : null,
      latestScorePct: latest ? (latest.summary?.scorePct ?? null) : null,
      latestPaperTitle: latest?.paperTitle || '',
      latestAt: latest?.completedAt || null,
    };
  });
  // Most active first; then most recent activity, then name.
  roster.sort((a, b) => b.sittingCount - a.sittingCount
    || (new Date(b.latestAt || 0) - new Date(a.latestAt || 0))
    || a.name.localeCompare(b.name));

  const allScores = sittings.map((s) => s.summary?.scorePct || 0);
  res.json({
    class: { id: c._id, name: c.name, level: c.level },
    summary: {
      totalStudents: roster.length,
      studentsWithSittings: byStudent.size,
      totalSittings: sittings.length,
      avgScorePct: allScores.length ? Math.round(allScores.reduce((s, n) => s + n, 0) / allScores.length) : null,
    },
    students: roster,
  });
}));

// One student's completed sittings (newest first).
router.get('/classes/:id/test-papers/:studentId', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = (await rosterIds(c._id)).map(String);
  if (!ids.includes(String(req.params.studentId))) return res.status(403).json({ error: 'Student not in this class.' });

  const student = await Student.findById(req.params.studentId).select('name level').lean();
  const sittings = await TestPaperSession.find({ studentId: req.params.studentId, status: 'completed' })
    .select('sessionId paperCode paperTitle level category topic durationMinutes summary completedAt')
    .sort({ completedAt: -1 })
    .lean();

  res.json({
    student: student ? { studentId: student._id, name: student.name, level: student.level } : null,
    sittings: sittings.map((s) => ({
      sessionId: s.sessionId,
      paperCode: s.paperCode,
      paperTitle: s.paperTitle,
      level: s.level,
      category: s.category || 'mock',
      topic: s.topic || '',
      durationMinutes: s.durationMinutes,
      summary: s.summary,
      completedAt: s.completedAt,
    })),
  });
}));

// Full per-question review of one sitting (what the student saw at submission).
router.get('/classes/:id/test-papers/:studentId/sittings/:sessionId', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = (await rosterIds(c._id)).map(String);
  if (!ids.includes(String(req.params.studentId))) return res.status(403).json({ error: 'Student not in this class.' });

  const session = await TestPaperSession.findOne({
    sessionId: req.params.sessionId, studentId: req.params.studentId, status: 'completed',
  }).lean();
  if (!session) return res.status(404).json({ error: 'Sitting not found.' });

  res.json({
    sessionId: session.sessionId,
    paperCode: session.paperCode,
    title: session.paperTitle,
    level: session.level,
    category: session.category || 'mock',
    topic: session.topic || '',
    summary: session.summary,
    completedAt: session.completedAt,
    questions: projectMarkedSitting(session.questions, session.answers),
  });
}));

// Real-data class dashboard: class overview, the "Needs you this week" flag list
// (students who need in-person remediation, the exact skill + reason), per-domain
// grasp, and a per-skill mastery heatmap. Replaces the synthetic client builders.
router.get('/classes/:id/dashboard', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const students = await Student.find({ _id: { $in: ids } }).select('name level').lean();
  const subjectKey = req.query.subject || 'Math';
  try {
    const dashboard = await buildClassDashboard({ studentIds: ids, students, subjectKey });
    res.json({
      class: { id: c._id, name: c.name, level: c.level, modules: c.modules },
      ...dashboard,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to build class dashboard.' });
  }
}));

// Single student detail (must be enrolled in a class in this workspace).
router.get('/students/:id', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const enrolled = await ClassStudent.findOne({ studentId: req.params.id, workspaceId: req.workspaceId });
  const partnerAllowed = !enrolled
    ? await userCanAccessPartnerStudent({ userId: req.user.id, studentId: req.params.id })
    : false;
  if (!enrolled && !partnerAllowed) return res.status(403).json({ error: 'Student not in your classes.' });
  const student = await Student.findById(req.params.id);
  const recs = await MasteryRecord.find({ studentId: student._id }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const overall = recs.length ? Math.round(recs.reduce((a, r) => a + r.score, 0) / recs.length) : 0;
  const mistakes = await Mistake.find({ studentId: student._id, status: { $ne: 'resolved' } }).populate({ path: 'skillId', model: Skill }).sort({ occurredAt: -1 }).limit(10);
  // Scope to THIS teacher's workspace. A shared/partner student can be enrolled in
  // classes across multiple workspaces; without this filter, assignments created in
  // another teacher's/partner's workspace would leak into this view.
  const assignments = await Assignment.find({ studentId: student._id, workspaceId: req.workspaceId }).populate({ path: 'skillIds', model: Skill }).sort({ createdAt: -1 });
  res.json({
    student: { id: student._id, name: student.name, level: student.level },
    overallMastery: overall,
    weakTopics: recs.filter((r) => r.attempts > 0 && r.score < 70).sort((a, b) => a.score - b.score).slice(0, 5).map((r) => ({ skillName: r.skillId?.name, topicName: r.skillId?.topicId?.name, score: r.score, status: r.status })),
    mistakes: mistakes.map((m) => ({ id: m._id, skillName: m.skillId?.name, questionStem: m.questionStem, studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer })),
    assignments: assignments.map((a) => ({ id: a._id, module: a.module, status: a.status, score: a.score, skillNames: a.skillIds.map((s) => s.name) })),
  });
}));

// ── Grouping ──────────────────────────────────────────────────────
router.get('/classes/:id/groups', asyncHandler(async (req, res) => {
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
}));

router.post('/classes/:id/groups', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const g = await StudentGroup.create({
    workspaceId: req.workspaceId, classId: c._id, teacherUserId: req.user.id,
    name: req.body.name || 'Group', basis: req.body.basis || 'weak_topic',
    targetSkillId: req.body.targetSkillId || null, studentIds: req.body.studentIds || [],
  });
  res.status(201).json({ group: g });
}));

// ── MathPath weak groups and intervention actions ─────────────────
router.get('/classes/:id/weak-groups', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const subjectId = String(req.query.subjectId || 'math');
  const domainId = String(req.query.domainId || 'fractions');
  const groups = await buildWeakGroupsForClass({ classId: c._id, subjectId, domainId });
  res.json({
    classId: c._id,
    subjectId,
    domainId,
    groups,
    summary: {
      groupCount: groups.length,
      highPriorityCount: groups.filter((group) => group.priority === 'high').length,
      affectedStudentCount: new Set(groups.flatMap((group) => group.studentIds || [])).size,
    },
  });
}));

router.get('/classes/:id/intervention-overview', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const subjectId = String(req.query.subjectId || 'math');
  const domainId = String(req.query.domainId || 'fractions');
  const ids = (await rosterIds(c._id)).map(String);
  const groups = await buildWeakGroupsForClass({ classId: c._id, subjectId, domainId });
  const assignments = await MathPathAssignment.find({ studentId: { $in: ids }, subjectId, domainId }).lean();
  const recoveryPacksInProgress = assignments.filter((assignment) => ['assigned', 'in_progress'].includes(assignment.status)).length;
  const recheckReadyAssignments = assignments.filter((assignment) => assignment.recheck?.recommended && !assignment.recheck?.diagnosticSessionId);
  // Scope the worksheet count to THIS class (mirrors how every other per-class
  // teacher stat is scoped by classId/roster). Group/class worksheets are stored
  // with the originating class on generatedFor.classId; without this filter the
  // stat counted every teacher worksheet across the whole workspace.
  const worksheetsGenerated = await Worksheet.countDocuments({
    workspaceId: req.workspaceId,
    generatedByRole: 'teacher',
    'generatedFor.classId': c._id,
    sourceMode: { $in: ['intervention_group', 'group', 'class'] },
  });
  const studentsNeedingAttention = Array.from(new Map(
    groups
      .filter((group) => group.priority !== 'low')
      .flatMap((group) => group.students || [])
      .map((student) => [student.studentId, student])
  ).values());
  res.json({
    classId: c._id,
    subjectId,
    domainId,
    studentsNeedingAttention,
    weakSkillGroups: groups.slice(0, 6),
    recoveryPacksInProgress,
    recheckReady: recheckReadyAssignments.map((assignment) => ({
      assignmentId: String(assignment._id),
      studentId: assignment.studentId,
      skillIds: assignment.skillIds || [],
      reason: assignment.recheck?.reason || 'Recovery pack is ready for recheck.',
    })),
    worksheetsGenerated,
    improvementSummary: {
      message: assignments.some((assignment) => assignment.status === 'completed')
        ? 'Completed recovery packs are ready to compare against recheck results.'
        : 'Improvement will appear after recovery packs and rechecks are completed.',
    },
  });
}));

router.post('/classes/:id/weak-groups/:skillId/assign-recovery', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const subjectId = String(req.body.subjectId || req.query.subjectId || 'math');
  const domainId = String(req.body.domainId || req.query.domainId || 'fractions');
  const skillId = String(req.params.skillId || '').toUpperCase();
  const groups = await buildWeakGroupsForClass({ classId: c._id, subjectId, domainId });
  const group = groups.find((item) => String(item.skillId).toUpperCase() === skillId);
  if (!group) return res.status(404).json({ error: 'Weak group not found for this skill.' });

  const assignments = [];
  for (const studentId of group.studentIds || []) {
    const assignment = await createAssignmentFromLessonPrep({
      studentId,
      skillIds: [group.skillId],
      assignedByUserId: req.user.id,
      assignedByRole: 'teacher',
      sourceType: 'teacher',
      sourceId: `class_${c._id}_${group.skillId}`,
      subjectId,
      domainId,
      title: `${group.skillName} Recovery Pack`,
      description: `Targeted recovery pack assigned from ${c.name} weak group evidence.`,
    });
    assignments.push(assignment);
  }

  res.status(201).json({ assigned: assignments.length, assignments });
}));

router.post('/classes/:id/weak-groups/:skillId/generate-worksheet', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const subjectId = String(req.body.subjectId || req.query.subjectId || 'math');
  const domainId = String(req.body.domainId || req.query.domainId || 'fractions');
  const skillId = String(req.params.skillId || '').toUpperCase();
  const groups = await buildWeakGroupsForClass({ classId: c._id, subjectId, domainId });
  const group = groups.find((item) => String(item.skillId).toUpperCase() === skillId);
  if (!group) return res.status(404).json({ error: 'Weak group not found for this skill.' });

  const primaryStudent = await Student.findById(group.studentIds?.[0]);
  if (!primaryStudent) return res.status(404).json({ error: 'No active student found for this weak group.' });
  const questionCount = Number(req.body.questionCount || 12);
  const worksheetSkillIds = await resolveSkillDocumentIds([group.skillId]);
  if (!worksheetSkillIds.length) {
    return res.status(400).json({ error: 'This weak group is ready for intervention, but the worksheet generator has no linked skill record yet.' });
  }
  const generated = await generateWorksheet({
    mode: 'intervention_group',
    worksheetType: 'intervention_group',
    studentId: primaryStudent._id,
    studentName: primaryStudent.name,
    skillIds: worksheetSkillIds,
    difficulty: req.body.difficulty || 'medium',
    questionCount,
    includesSolutions: true,
    includesMistakeReview: true,
    subject: subjectId === 'science' ? 'Science' : 'Math',
    domain: domainId,
    generatedFor: { classId: c._id, groupSkillId: group.skillId, studentIds: group.studentIds },
  });
  if (!generated.content?.questions?.length) {
    return res.status(400).json({ error: 'No worksheet questions are available for this weak group yet.' });
  }
  const worksheet = await Worksheet.create({
    userId: req.user.id,
    studentId: primaryStudent._id,
    studentName: primaryStudent.name,
    subject: subjectId === 'science' ? 'Science' : 'Math',
    workspaceId: req.workspaceId,
    generatedByUserId: req.user.id,
    generatedByRole: 'teacher',
    generatedFor: { classId: c._id, className: c.name, groupSkillId: group.skillId, skillName: group.skillName, studentIds: group.studentIds },
    topicIds: generated.topicIds || [],
    skillIds: generated.skillIds || [],
    sourceMode: generated.sourceMode || 'intervention_group',
    worksheetType: generated.worksheetType || 'intervention_group',
    domain: domainId,
    difficulty: req.body.difficulty || 'medium',
    questionCount,
    estimatedMinutes: generated.estimatedMinutes || 0,
    includesSolutions: true,
    includesMistakeReview: true,
    generatedContent: generated.content,
    answerKey: generated.answerKey || [],
    assignedStatus: 'unassigned',
  });
  res.status(201).json({
    worksheet: {
      id: worksheet._id,
      title: worksheet.generatedContent?.title || `${group.skillName} Worksheet`,
      skillName: group.skillName,
      questionCount: worksheet.questionCount,
      studentCount: group.studentIds.length,
    },
  });
}));

router.post('/classes/:id/weak-groups/:skillId/assign-recheck', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = (await rosterIds(c._id)).map(String);
  const skillId = String(req.params.skillId || '').toUpperCase();
  const assignments = await MathPathAssignment.find({
    studentId: { $in: ids },
    skillIds: skillId,
    status: 'completed',
    'recheck.recommended': true,
  }).lean();
  if (!assignments.length) {
    return res.status(409).json({ error: 'No completed recovery packs are ready for recheck for this weak group.' });
  }
  const rechecks = [];
  for (const assignment of assignments) {
    try {
      rechecks.push(await createRecheckForAssignment({ assignmentId: assignment._id, requestedByUserId: req.user.id }));
    } catch (err) {
      rechecks.push({ assignmentId: String(assignment._id), error: err.message });
    }
  }
  res.status(201).json({ created: rechecks.filter((item) => item.created).length, rechecks });
}));

// ── Assign practice (class / group / individual) ──────────────────
router.post('/classes/:id/assign', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const {
    target = {}, module = 'MathPath', subject = 'Math', topicId = null, skillIds = [],
    difficulty = 'medium', questionCount = 10, dueDate = null, interventionId = '',
    interventionType = '', linkedMisconceptions = [], priority = 'medium', templateId = '',
    playbookId = '', nextAction = '', schedule = {}, aiPlanningContext = {}
  } = req.body;

  let studentIds = [];
  if (target.type === 'class') studentIds = await rosterIds(c._id);
  else if (target.type === 'group') { const g = await StudentGroup.findOne({ _id: target.id, classId: c._id }); studentIds = g?.studentIds || []; }
  else if (target.type === 'student') studentIds = [target.id];
  if (!studentIds.length) return res.status(400).json({ error: 'No students in target.' });

  const docs = studentIds.map((sid) => ({
    workspaceId: req.workspaceId, studentId: sid, assignedByUserId: req.user.id, assignedByRole: 'teacher',
    module, subject, topicId, skillIds, difficulty, questionCount, dueDate, status: 'not_started',
    interventionId, interventionType, linkedMisconceptions, priority,
    assignedToType: target.type || 'student', assignedToId: target.id || sid,
    templateId, playbookId, nextAction, schedule, aiPlanningContext,
  }));
  const created = await Assignment.insertMany(docs);
  res.status(201).json({ assigned: created.length });
}));

// ── Intervention tracker ──────────────────────────────────────────
router.get('/classes/:id/interventions', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const list = await InterventionRecord.find({ classId: c._id }).populate({ path: 'targetSkillId', model: Skill });
  const students = await Student.find({ _id: { $in: list.map((i) => i.studentId) } });
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
  res.json({ interventions: list.map((i) => ({ id: i._id, studentId: i.studentId, studentName: nameById[String(i.studentId)] || '', targetSkill: i.targetSkillId?.name || null, status: i.status, notes: i.notes, nextAction: i.nextAction, startedAt: i.startedAt })) });
}));

router.post('/classes/:id/interventions', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const i = await InterventionRecord.create({
    workspaceId: req.workspaceId, classId: c._id, studentId: req.body.studentId, teacherUserId: req.user.id,
    targetSkillId: req.body.targetSkillId || null, status: req.body.status || 'needs_support',
    notes: req.body.notes || '', nextAction: req.body.nextAction || '',
  });
  res.status(201).json({ intervention: i });
}));

router.put('/interventions/:iid', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const i = await InterventionRecord.findOne({ _id: req.params.iid, workspaceId: req.workspaceId, teacherUserId: req.user.id });
  if (!i) return res.status(404).json({ error: 'Intervention not found.' });
  for (const k of ['status', 'notes', 'nextAction']) if (req.body[k] !== undefined) i[k] = req.body[k];
  i.updatedAt = new Date();
  await i.save();
  res.json({ intervention: i });
}));

// ── Simple report preview ─────────────────────────────────────────
router.get('/classes/:id/reports', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req); if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const recs = await MasteryRecord.find({ studentId: { $in: ids } }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const assignments = await Assignment.find({ studentId: { $in: ids } });
  const overall = recs.length ? Math.round(recs.reduce((a, r) => a + r.score, 0) / recs.length) : 0;
  const byTopic = {};
  for (const r of recs) { const t = r.skillId?.topicId?.name || '—'; (byTopic[t] ||= []).push(r.score); }
  const topics = Object.entries(byTopic)
    .map(([t, arr]) => ({ topic: t, avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }))
    .sort((a, b) => a.avg - b.avg);
  const assignmentCompletion = assignments.length
    ? Math.round((assignments.filter((a) => a.status === 'completed').length / assignments.length) * 100)
    : 0;

  // Base shape every report type returns, so the existing preview UI (StatTiles +
  // topic list) renders safely regardless of which report was requested.
  const base = {
    type: req.query.type || 'class_progress', className: c.name, generatedAt: new Date(),
    overallMastery: overall, studentCount: ids.length, assignmentCompletion, topics,
  };

  const type = req.query.type || 'class_progress';

  if (type === 'intervention_summary') {
    // Roll up active/closed interventions for this class by status, with a per-student list.
    const interventions = await InterventionRecord.find({ classId: c._id })
      .populate({ path: 'targetSkillId', model: Skill });
    const students = await Student.find({ _id: { $in: interventions.map((i) => i.studentId) } }).select('name');
    const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
    const byStatus = { needs_support: 0, improving: 0, stable: 0, mastered: 0 };
    for (const i of interventions) { byStatus[i.status] = (byStatus[i.status] || 0) + 1; }
    const activeCount = (byStatus.needs_support || 0) + (byStatus.improving || 0);
    return res.json({
      ...base,
      interventionSummary: {
        total: interventions.length,
        active: activeCount,
        byStatus,
        records: interventions.map((i) => ({
          studentId: i.studentId,
          studentName: nameById[String(i.studentId)] || 'Student',
          targetSkill: i.targetSkillId?.name || null,
          status: i.status,
          nextAction: i.nextAction || '',
          startedAt: i.startedAt,
        })),
      },
    });
  }

  if (type === 'parent_friendly') {
    // Per-student plain-language narrative parents can read without jargon.
    const students = await Student.find({ _id: { $in: ids } }).select('name');
    const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
    const byStudent = new Map(ids.map((id) => [String(id), []]));
    for (const r of recs) {
      const arr = byStudent.get(String(r.studentId));
      if (arr) arr.push(r);
    }
    const narratives = ids.map((id) => {
      const rs = byStudent.get(String(id)) || [];
      const avg = rs.length ? Math.round(rs.reduce((a, r) => a + r.score, 0) / rs.length) : 0;
      const mastered = rs.filter((r) => r.status === 'mastered').length;
      const needsReview = rs
        .filter((r) => r.status === 'needs_review')
        .map((r) => r.skillId?.name)
        .filter(Boolean);
      const name = nameById[String(id)] || 'Your child';
      let narrative;
      if (!rs.length) {
        narrative = `${name} has not started any practice yet. Encourage them to log in and try their first activity.`;
      } else if (avg >= 70) {
        narrative = `${name} is doing well, with strong understanding across ${mastered} skill${mastered === 1 ? '' : 's'} mastered so far. Keep up the steady practice!`;
      } else if (avg >= 50) {
        narrative = `${name} is making good progress and building confidence. A little extra practice on tricky topics will help them move ahead.`;
      } else {
        narrative = `${name} is working hard and would benefit from some extra support. Short, regular practice sessions make a big difference.`;
      }
      if (needsReview.length) {
        narrative += ` Topics to revisit together: ${needsReview.slice(0, 3).join(', ')}.`;
      }
      return { studentId: id, studentName: name, averageMastery: avg, masteredCount: mastered, narrative };
    });
    return res.json({ ...base, parentFriendly: { narratives } });
  }

  // Default: class progress report (unchanged shape).
  return res.json(base);
}));

// ── PSL class dashboard ─────────────────────────────────────────────
router.get('/classes/:id/psl/dashboard', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const c = await getOwnedClass(req);
  if (!c) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(c._id);
  const students = await Student.find({ _id: { $in: ids } }).select('name level').lean();

  const sessions = await PSLSession.find({ studentId: { $in: ids } }).lean();
  const attempts = await PSLAttempt.find({ studentId: { $in: ids } }).lean();
  const skills = await PSLSkill.find({ isActive: true }).lean();
  const masteryRecs = await MasteryRecord.find({ studentId: { $in: ids }, module: 'PSL' }).lean();

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const studentsAttempted = new Set(sessions.map((s) => String(s.studentId)));
  const studentsMastered = new Set(masteryRecs.filter((r) => r.status === 'mastered').map((r) => String(r.studentId)));
  const avgAccuracy = attempts.length
    ? Math.round((attempts.reduce((a, at) => a + at.overallScore, 0) / attempts.length) * 100)
    : 0;

  // PSL MasteryRecord.skillId is the PSLSkill document _id (ObjectId), not the
  // string slug. Bucket mastered records by String(_id) so per-skill counts work.
  const masteredCountBySkillObjId = {};
  for (const r of masteryRecs) {
    if (r.status === 'mastered' && r.skillId) {
      const key = String(r.skillId);
      masteredCountBySkillObjId[key] = (masteredCountBySkillObjId[key] || 0) + 1;
    }
  }

  const skillMap = {};
  for (const sk of skills) {
    const skSessions = sessions.filter((s) => s.skillId === sk.skillId);
    const skAttempts = attempts.filter((a) => a.skillId === sk.skillId);
    const skStudents = new Set(skSessions.map((s) => String(s.studentId)));
    const skMasteredCount = masteredCountBySkillObjId[String(sk._id)] || 0;
    const avgScore = skAttempts.length
      ? Math.round((skAttempts.reduce((a, at) => a + at.overallScore, 0) / skAttempts.length) * 100)
      : 0;
    const miscCounts = {};
    for (const at of skAttempts) {
      for (const step of at.steps || []) {
        if (step.misconceptionTag) miscCounts[step.misconceptionTag] = (miscCounts[step.misconceptionTag] || 0) + 1;
      }
    }
    const topMisconceptions = Object.entries(miscCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag, count]) => ({ tag, count }));
    skillMap[sk.skillId] = {
      skillId: sk.skillId, name: sk.name, heuristic: sk.heuristic, level: sk.level,
      sessions: skSessions.length, students: skStudents.size, mastered: skMasteredCount,
      averageScore: avgScore, topMisconceptions,
    };
  }

  const studentScores = {};
  for (const at of attempts) {
    const sid = String(at.studentId);
    (studentScores[sid] ||= []).push(at.overallScore);
  }
  const flaggedStudents = Object.entries(studentScores)
    .map(([sid, scores]) => ({ studentId: sid, avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) }))
    .filter((s) => s.avgScore < 60)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 10)
    .map((s) => {
      const stu = students.find((st) => String(st._id) === s.studentId);
      const stuAttempts = attempts.filter((a) => String(a.studentId) === s.studentId);
      const miscCounts = {};
      for (const at of stuAttempts) {
        for (const step of at.steps || []) {
          if (step.misconceptionTag) miscCounts[step.misconceptionTag] = (miscCounts[step.misconceptionTag] || 0) + 1;
        }
      }
      const topMisc = Object.entries(miscCounts).sort((a, b) => b[1] - a[1])[0];
      return { studentId: s.studentId, name: stu?.name || 'Unknown', avgScore: s.avgScore, topMisconception: topMisc?.[0] || null };
    });

  const classMiscCounts = {};
  for (const at of attempts) {
    for (const step of at.steps || []) {
      if (step.misconceptionTag) classMiscCounts[step.misconceptionTag] = (classMiscCounts[step.misconceptionTag] || 0) + 1;
    }
  }
  const topMisconceptions = Object.entries(classMiscCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));

  const STEP_IDS = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];
  const STEP_LABELS = { understand: 'Understand', identify_info: 'Identify Info', identify_question: 'Identify Question', plan: 'Plan', solve: 'Solve', check: 'Check' };
  const stepAgg = {};
  for (const sid of STEP_IDS) stepAgg[sid] = { total: 0, correct: 0, timeMs: 0, hints: 0, retries: 0, misconceptions: 0 };
  for (const at of attempts) {
    for (const step of at.steps || []) {
      const agg = stepAgg[step.stepId];
      if (!agg) continue;
      agg.total++;
      if (step.correct) agg.correct++;
      agg.timeMs += step.timeSpentMs || 0;
      if (step.hintUsed) agg.hints++;
      if (step.retried) agg.retries++;
      if (step.misconceptionTag) agg.misconceptions++;
    }
  }
  const stepAnalytics = STEP_IDS.map((sid) => {
    const a = stepAgg[sid];
    return {
      stepId: sid, label: STEP_LABELS[sid], total: a.total,
      errorRate: a.total ? Math.round(((a.total - a.correct) / a.total) * 100) : 0,
      avgTimeSec: a.total ? Math.round(a.timeMs / a.total / 1000) : 0,
      hintRate: a.total ? Math.round((a.hints / a.total) * 100) : 0,
      retryRate: a.total ? Math.round((a.retries / a.total) * 100) : 0,
      misconceptionRate: a.total ? Math.round((a.misconceptions / a.total) * 100) : 0,
    };
  });

  const heuristicMap = {};
  for (const sk of skills) {
    const h = sk.heuristic;
    if (!heuristicMap[h]) heuristicMap[h] = { heuristic: h, sessions: 0, avgScore: 0, _scores: [] };
    const skSessions = sessions.filter((s) => s.skillId === sk.skillId);
    const skAttempts = attempts.filter((a) => a.skillId === sk.skillId);
    heuristicMap[h].sessions += skSessions.length;
    heuristicMap[h]._scores.push(...skAttempts.map((a) => a.overallScore));
  }
  const heuristics = Object.values(heuristicMap).map((h) => ({
    heuristic: h.heuristic, sessions: h.sessions,
    avgScore: h._scores.length ? Math.round((h._scores.reduce((a, b) => a + b, 0) / h._scores.length) * 100) : 0,
  }));

  res.json({
    class: { id: c._id, name: c.name, level: c.level },
    classOverview: {
      totalStudents: ids.length, studentsAttempted: studentsAttempted.size,
      studentsMastered: studentsMastered.size, totalSessions: completedSessions.length,
      averageAccuracy: avgAccuracy,
      hintUsageRate: attempts.length
        ? Math.round((attempts.filter((a) => (a.steps || []).some((s) => s.hintUsed)).length / attempts.length) * 100)
        : 0,
    },
    skills: Object.values(skillMap),
    flaggedStudents,
    topMisconceptions,
    heuristics,
    stepAnalytics,
  });
}));

// ── PSL student session review ────────────────────────────────────
router.get('/students/:id/psl/sessions', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const enrolled = await ClassStudent.findOne({ studentId: req.params.id, workspaceId: req.workspaceId });
  const partnerAllowed = !enrolled
    ? await userCanAccessPartnerStudent({ userId: req.user.id, studentId: req.params.id })
    : false;
  if (!enrolled && !partnerAllowed) return res.status(403).json({ error: 'Student not in your classes.' });

  const student = await Student.findById(req.params.id).select('name level').lean();
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const sessions = await PSLSession.find({ studentId: req.params.id, status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(50)
    .lean();

  const skillIds = [...new Set(sessions.map((s) => s.skillId))];
  const skills = await PSLSkill.find({ skillId: { $in: skillIds } }).select('skillId name heuristic level').lean();
  const skillLookup = Object.fromEntries(skills.map((s) => [s.skillId, s]));

  res.json({
    student: { id: student._id, name: student.name, level: student.level },
    sessions: sessions.map((s) => {
      const sk = skillLookup[s.skillId] || {};
      return {
        sessionId: s.sessionId,
        skillId: s.skillId,
        skillName: sk.name || s.skillId,
        heuristic: sk.heuristic || '',
        level: sk.level || '',
        completedAt: s.completedAt,
        totalProblems: s.summary?.totalProblems || 0,
        overallScore: s.summary?.overallScore || 0,
        fullMarks: s.summary?.fullMarks || 0,
        misconceptionCounts: s.summary?.misconceptionCounts || {},
        targetDifficulty: s.targetDifficulty || 1,
      };
    }),
  });
}));

router.get('/students/:id/psl/sessions/:sessionId', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return;
  const enrolled = await ClassStudent.findOne({ studentId: req.params.id, workspaceId: req.workspaceId });
  const partnerAllowed = !enrolled
    ? await userCanAccessPartnerStudent({ userId: req.user.id, studentId: req.params.id })
    : false;
  if (!enrolled && !partnerAllowed) return res.status(403).json({ error: 'Student not in your classes.' });

  const session = await PSLSession.findOne({ sessionId: req.params.sessionId, studentId: req.params.id }).lean();
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  const attempts = await PSLAttempt.find({ sessionId: req.params.sessionId }).lean();
  const attemptsByProblem = Object.fromEntries(attempts.map((a) => [a.problemId, a]));

  const skill = await PSLSkill.findOne({ skillId: session.skillId }).select('skillId name heuristic level').lean();

  const problems = (session.problems || []).map((p) => {
    const attempt = attemptsByProblem[p.problemId];
    return {
      problemId: p.problemId,
      storyText: p.storyText,
      correctAnswer: p.correctAnswer,
      difficulty: p.difficulty || 1,
      status: p.status,
      steps: (attempt?.steps || []).map((step) => ({
        stepId: step.stepId,
        response: step.response,
        correct: step.correct,
        score: step.score,
        misconceptionTag: step.misconceptionTag || '',
        hintUsed: step.hintUsed || false,
        retried: step.retried || false,
        timeSpentMs: step.timeSpentMs || 0,
      })),
      overallCorrect: attempt?.overallCorrect ?? null,
      overallScore: attempt?.overallScore ?? null,
      totalTimeMs: attempt?.totalTimeMs ?? null,
    };
  });

  res.json({
    session: {
      sessionId: session.sessionId,
      skillId: session.skillId,
      skillName: skill?.name || session.skillId,
      heuristic: skill?.heuristic || '',
      level: skill?.level || '',
      status: session.status,
      targetDifficulty: session.targetDifficulty || 1,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      summary: session.summary || {},
    },
    problems,
  });
}));

// ── Class & roster management (teacher-owned) ─────────────────────────────
// Create a class in the teacher's own workspace.
router.post('/classes', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'A class name is required.' });
  const klass = await Class.create({
    workspaceId: req.workspaceId,
    teacherUserId: req.user.id,
    name,
    level: String(req.body?.level || '').trim(),
    modules: ['MathPath'],
    status: 'active',
  });
  return res.status(201).json({ class: { id: String(klass._id), name: klass.name, level: klass.level } });
}));

// Add a single student to a class.
router.post('/classes/:id/students', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Student name is required.' });
  const { student } = await createStudentRecord({
    workspaceId: req.workspaceId,
    createdByUserId: req.user.id,
    name,
    level: String(req.body?.level || '').trim(),
    classId: klass._id,
  });
  return res.status(201).json({ student: { studentId: String(student._id), name: student.name, level: student.level } });
}));

// Bulk-import a roster: pasted names (one per line) OR a CSV with a "name" header.
router.post('/classes/:id/import-roster', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const text = String(req.body?.text || '');
  if (!text.trim()) return res.status(400).json({ error: 'Paste some names, or upload a CSV.' });

  // A CSV has a header row containing a "name" column; otherwise treat each
  // non-empty line as a single student name ("paste names" mode).
  const firstCells = text.split(/\r?\n/)[0].split(',').map((s) => s.trim().toLowerCase());
  let rows;
  let parseErrors = [];
  if (firstCells.includes('name')) {
    const parsed = parseRosterCsv(text);
    rows = parsed.rows;
    parseErrors = parsed.errors || [];
  } else {
    rows = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((name) => ({ name }));
  }
  if (!rows.length) return res.status(400).json({ error: 'No student names found.', parseErrors });

  const out = await importRoster({
    workspaceId: req.workspaceId,
    createdByUserId: req.user.id,
    teacherUserId: req.user.id,
    rows,
    defaultClassId: klass._id,
    createMissingClasses: false,
  });
  return res.json({ ...out, parseErrors });
}));

// Delete a class the teacher owns, cascading its enrolments, announcements
// (+comments), and Quick-Mark / kiosk sessions. Students themselves are shared
// (workspace-scoped) and are kept.
router.delete('/classes/:id', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const classId = String(klass._id);
  const anns = await Announcement.find({ sourceType: 'class', sourceId: classId }).select('_id').lean();
  await Promise.all([
    ClassStudent.deleteMany({ classId: klass._id }),
    Announcement.deleteMany({ sourceType: 'class', sourceId: classId }),
    AnnouncementComment.deleteMany({ announcementId: { $in: anns.map((a) => a._id) } }),
    QuickMarkSession.deleteMany({ classId: klass._id }),
    ClassDiagnosticSession.deleteMany({ classId: klass._id }),
  ]);
  await klass.deleteOne();
  return res.json({ ok: true });
}));

// Quick-link a parent to a class student (so announcements/notifications reach them).
router.post('/classes/:id/students/:studentId/link-parent', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const inClass = await ClassStudent.findOne({ classId: klass._id, studentId: req.params.studentId, status: 'active' });
  if (!inClass) return res.status(404).json({ error: 'Student is not in this class.' });
  try {
    const result = await linkGuardianByEmail({
      studentId: req.params.studentId, workspaceId: req.workspaceId,
      email: req.body?.email, name: req.body?.name,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(Number(err?.status) || 500).json({ error: err?.message || 'Could not link the parent.' });
  }
}));

// ── Announcements to parents (class-scoped) ──────────────────────────────
// Post an announcement to the parents of a class → notifies them.
router.post('/classes/:id/announcements', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'A title is required.' });
  const author = await User.findById(req.user.id).select('name');
  const announcement = await Announcement.create({
    workspaceId: req.workspaceId,
    authorId: req.user.id,
    authorName: author?.name || 'Teacher',
    sourceType: 'class',
    sourceId: String(klass._id),
    title,
    body: String(req.body?.body || '').trim().slice(0, 5000),
    allowComments: req.body?.allowComments !== false,
  });
  notifyNewAnnouncement(announcement).catch(() => {}); // fire-and-forget fan-out
  return res.status(201).json({ announcement: publicAnnouncement(announcement) });
}));

// List a class's announcements.
router.get('/classes/:id/announcements', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const list = await Announcement.find({ sourceType: 'class', sourceId: String(klass._id) })
    .sort({ createdAt: -1 }).limit(50).lean();
  return res.json({ announcements: list.map(publicAnnouncement) });
}));

// Delete an announcement (author only) + its comments.
router.delete('/classes/:id/announcements/:aid', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const a = await Announcement.findOne({ _id: req.params.aid, sourceId: String(klass._id), authorId: req.user.id });
  if (!a) return res.status(404).json({ error: 'Announcement not found.' });
  await AnnouncementComment.deleteMany({ announcementId: a._id });
  await a.deleteOne();
  return res.json({ ok: true });
}));

// ── Quick Mark (fast triage of a physical worksheet stack) ───────────────
// Create a session — snapshots the class roster, all unmarked.
router.post('/classes/:id/quickmarks', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const ids = await rosterIds(klass._id);
  const students = await Student.find({ _id: { $in: ids } }).select('_id name').lean();
  const marks = students
    .map((s) => ({ studentId: s._id, name: s.name, status: 'not_done' }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const session = await QuickMarkSession.create({
    workspaceId: req.workspaceId,
    classId: klass._id,
    teacherUserId: req.user.id,
    title: String(req.body?.title || '').trim(),
    marks,
  });
  return res.status(201).json({ session: publicQuickMark(session) });
}));

// List recent sessions for a class.
router.get('/classes/:id/quickmarks', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const sessions = await QuickMarkSession.find({ classId: klass._id, workspaceId: req.workspaceId })
    .sort({ createdAt: -1 }).limit(20).lean();
  return res.json({
    sessions: sessions.map((s) => ({
      quickMarkId: String(s._id),
      title: s.title,
      status: s.status,
      createdAt: s.createdAt,
      total: s.marks?.length || 0,
      marked: (s.marks || []).filter((m) => m.status !== 'not_done').length,
    })),
  });
}));

// Get one session (full marks).
router.get('/classes/:id/quickmarks/:qid', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const session = await QuickMarkSession.findOne({ _id: req.params.qid, classId: klass._id, workspaceId: req.workspaceId });
  if (!session) return res.status(404).json({ error: 'Quick Mark session not found.' });
  return res.json({ session: publicQuickMark(session) });
}));

// Set a student's status/note.
router.patch('/classes/:id/quickmarks/:qid/mark', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const { studentId, status, note } = req.body || {};
  if (status && !QUICK_MARK_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Unknown status.' });
  }
  const set = { 'marks.$.markedAt': new Date() };
  if (status) set['marks.$.status'] = status;
  if (note !== undefined) set['marks.$.note'] = String(note).slice(0, 500);
  const session = await QuickMarkSession.findOneAndUpdate(
    { _id: req.params.qid, classId: klass._id, workspaceId: req.workspaceId, 'marks.studentId': studentId },
    { $set: set },
    { new: true },
  );
  if (!session) return res.status(404).json({ error: 'Session or student not found.' });
  return res.json({ session: publicQuickMark(session) });
}));

// Attach a photo of a student's pages (optional — useful for the weak group).
router.post('/classes/:id/quickmarks/:qid/mark/:studentId/photo', quickMarkPhotoUpload.single('photo'), asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded.' });
  const { fileUrl } = await persistUploadFile(req.file, 'quickmark');
  const session = await QuickMarkSession.findOneAndUpdate(
    { _id: req.params.qid, classId: klass._id, workspaceId: req.workspaceId, 'marks.studentId': req.params.studentId },
    { $set: { 'marks.$.photoUrl': fileUrl, 'marks.$.markedAt': new Date() } },
    { new: true },
  );
  if (!session) return res.status(404).json({ error: 'Session or student not found.' });
  return res.json({ photoUrl: fileUrl, session: publicQuickMark(session) });
}));

// ── In-class diagnostic kiosk (teacher side) ──────────────────────────────
// A1. Create a class diagnostic session → returns a short code + kiosk URL the
// teacher shows as a QR. Students join unauthenticated via routes/kioskDiagnostics.
router.post('/classes/:id/kiosk-sessions', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const { type = 'diagnostic', mode = 'core', studentLevel = '', subjectId = 'math' } = req.body || {};

  let session;
  if (type === 'practice') {
    // Practice: a fixed set of questions on ONE skill. Resolve the skill server-side
    // (so the client can't spoof it) and derive a domainId for the session.
    const { skillId, questionCount = 10 } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'A skill is required for a practice check-in.' });
    const skill = await Skill.findById(skillId).populate({ path: 'topicId', select: '_id' }).lean();
    if (!skill) return res.status(400).json({ error: 'That skill was not found.' });
    const count = Math.min(20, Math.max(3, Number(questionCount) || 10));
    session = await createClassPracticeSession({
      classId: klass._id,
      workspaceId: req.workspaceId,
      teacherUserId: req.user.id,
      subjectId,
      domainId: skill.domain || 'practice', // keep domainId populated (schema requires it)
      skillId: String(skill._id),
      skillName: skill.name || '',
      questionCount: count,
      studentLevel: studentLevel || klass.level || '',
    });
  } else {
    const { domainId } = req.body || {};
    if (!domainId) return res.status(400).json({ error: 'A diagnostic topic (domainId) is required.' });
    try {
      getDiagnosticDomain({ subjectId, domainId });
    } catch {
      return res.status(400).json({ error: `Unknown diagnostic topic: ${domainId}` });
    }
    session = await createClassDiagnosticSession({
      classId: klass._id,
      workspaceId: req.workspaceId,
      teacherUserId: req.user.id,
      subjectId,
      domainId,
      mode,
      studentLevel: studentLevel || klass.level || '',
    });
  }

  return res.status(201).json({
    sessionId: String(session._id),
    code: session.code,
    type: session.type,
    domainId: session.domainId,
    mode: session.mode,
    skillName: session.practiceConfig?.skillName || undefined,
    questionCount: session.type === 'practice' ? session.practiceConfig?.questionCount : undefined,
    status: session.status,
    kioskUrl: `/kiosk/${session.code}`,
    expiresAt: session.expiresAt,
    rosterCount: session.roster.length,
  });
}));

// A1b. List this class's recent kiosk sessions (so the teacher can reopen one).
router.get('/classes/:id/kiosk-sessions', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const sessions = await ClassDiagnosticSession
    .find({ classId: klass._id, workspaceId: req.workspaceId })
    .sort({ createdAt: -1 }).limit(20).lean();
  return res.json({
    sessions: sessions.map((s) => ({
      sessionId: String(s._id),
      code: s.code,
      type: s.type || 'diagnostic',
      domainId: s.domainId,
      mode: s.mode,
      skillName: s.practiceConfig?.skillName || undefined,
      status: s.status,
      rosterCount: s.roster?.length || 0,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })),
  });
}));

// A2. Live status for the teacher's polling view.
router.get('/classes/:id/kiosk-sessions/:sessionId', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const session = await ClassDiagnosticSession.findOne({
    _id: req.params.sessionId, classId: klass._id, workspaceId: req.workspaceId,
  });
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  return res.json(await buildKioskStatus(session));
}));

// A2b. Per-student results detail (teacher drill-down after a check-in): time,
// overall stats, weak skills, and the per-question breakdown incl. workings.
router.get('/classes/:id/kiosk-sessions/:sessionId/students/:studentId', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const session = await ClassDiagnosticSession.findOne({
    _id: req.params.sessionId, classId: klass._id, workspaceId: req.workspaceId,
  });
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const detail = await buildKioskStudentDetail(session, req.params.studentId);
  if (!detail) return res.status(404).json({ error: 'Student is not in this session.' });
  return res.json(detail);
}));

// A3. Close a session (blocks new joins; in-flight attempts can still finish).
router.post('/classes/:id/kiosk-sessions/:sessionId/close', asyncHandler(async (req, res) => {
  if (!ensureTeacherWorkspace(req, res)) return undefined;
  const klass = await getOwnedClass(req);
  if (!klass) return res.status(404).json({ error: 'Class not found.' });
  const session = await ClassDiagnosticSession.findOneAndUpdate(
    { _id: req.params.sessionId, classId: klass._id, workspaceId: req.workspaceId },
    { $set: { status: 'closed' } },
    { new: true },
  );
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  return res.json({ ok: true, status: session.status });
}));

export default router;
