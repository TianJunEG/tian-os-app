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
  const activeInterventions = await InterventionRecord.countDocuments({ workspaceId: req.workspaceId, status: { $in: ['needs_support', 'improving'] } });
  // Classes needing attention: any with students scoring needs_review.
  const attention = [];
  for (const c of classes) {
    const ids = await rosterIds(c._id);
    const recs = await MasteryRecord.find({ studentId: { $in: ids }, status: 'needs_review' });
    if (recs.length) attention.push({ classId: c._id, name: c.name, flagged: new Set(recs.map((r) => String(r.studentId))).size });
  }
  res.json({ classCount: classes.length, activeInterventions, attention });
}));

// ── Classes ───────────────────────────────────────────────────────
router.get('/classes', asyncHandler(async (req, res) => {
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
  const assignments = await Assignment.find({ studentId: student._id }).populate({ path: 'skillIds', model: Skill }).sort({ createdAt: -1 });
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
  const worksheetsGenerated = await Worksheet.countDocuments({
    workspaceId: req.workspaceId,
    generatedByRole: 'teacher',
    generatedFor: { $ne: null },
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
  const i = await InterventionRecord.findOne({ _id: req.params.iid, workspaceId: req.workspaceId });
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
  res.json({
    type: req.query.type || 'class_progress', className: c.name, generatedAt: new Date(),
    overallMastery: overall, studentCount: ids.length,
    assignmentCompletion: assignments.length ? Math.round((assignments.filter((a) => a.status === 'completed').length / assignments.length) * 100) : 0,
    topics: Object.entries(byTopic).map(([t, arr]) => ({ topic: t, avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })).sort((a, b) => a.avg - b.avg),
  });
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

  const skillMap = {};
  for (const sk of skills) {
    const skSessions = sessions.filter((s) => s.skillId === sk.skillId);
    const skAttempts = attempts.filter((a) => a.skillId === sk.skillId);
    const skStudents = new Set(skSessions.map((s) => String(s.studentId)));
    const skMastered = masteryRecs.filter((r) => r.skillId?.toString() === sk.skillId && r.status === 'mastered');
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
      sessions: skSessions.length, students: skStudents.size, mastered: skMastered.length,
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

export default router;
