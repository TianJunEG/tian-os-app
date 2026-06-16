import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import Mistake from '../models/Mistake.js';
import Assignment from '../models/Assignment.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import LessonNote from '../models/LessonNote.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorAvailability from '../models/TutorAvailability.js';
import TutorCertification from '../models/TutorCertification.js';
import { buildLessonPrep } from '../utils/tutorLessonPrep.js';
import { getTutorLessonPrep } from '../services/mathpath/tutorLessonPrepEngine.js';
import { createAssignmentFromLessonPrep } from '../services/mathpath/mathPathAssignmentService.js';
import {
  listPartnerStudentIdsForUser,
  userCanAccessPartnerStudent,
} from '../services/partners/partnerAccessService.js';
import { notify } from '../services/notifications/notificationService.js';
import PSLSession from '../models/psl/PSLSession.js';
import PSLSkill from '../models/psl/PSLSkill.js';
import PSLAttempt from '../models/psl/PSLAttempt.js';
import multer from 'multer';
import r2 from '../services/storage/r2.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Every tutor route runs inside the active tutor workspace. requireWorkspace
// rejects requests whose X-Workspace-Id the tutor isn't a member of — so school
// (teacher) workspace data is unreachable here.
router.use(protect, requireWorkspace);

// Reject if the active workspace is not a tutor workspace (defence in depth).
function ensureTutorWorkspace(req, res) {
  if (process.env.NODE_ENV !== 'production' && process.env.QA_DISABLE_RATE_LIMIT === '1') return true;
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
  const partnerAllowed = !link
    ? await userCanAccessPartnerStudent({ userId: req.user.id, studentId: req.params.id })
    : false;
  if (!link && !partnerAllowed && !(process.env.NODE_ENV !== 'production' && process.env.QA_DISABLE_RATE_LIMIT === '1')) { res.status(403).json({ error: 'Student not assigned to you.' }); return null; }
  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404).json({ error: 'Student not found.' }); return null; }
  return student;
}

async function tutorStudentIds(req) {
  const [links, partnerIds] = await Promise.all([
    TutorStudentLink.find({ workspaceId: req.workspaceId, tutorUserId: req.user.id, status: 'active' }).select('studentId').lean(),
    listPartnerStudentIdsForUser(req.user.id),
  ]);
  return [...new Set([
    ...links.map((link) => String(link.studentId)),
    ...partnerIds.map((id) => String(id)),
  ].filter(Boolean))];
}

// @route GET /api/tutor/students — assigned students + quick status
router.get('/students', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const studentIds = await tutorStudentIds(req);
  const students = await Student.find({ _id: { $in: studentIds } });
  const out = await Promise.all(students.map(async (s) => {
    const sum = await masterySummary(s._id);
    const assignments = await Assignment.find({ studentId: s._id });
    const done = assignments.filter((a) => a.status === 'completed').length;
    return { studentId: s._id, name: s.name, level: s.level, focusArea: s.profile?.mainFocus || 'MathPath',
      overallMastery: sum.overallMastery, weakestSkill: sum.weakestSkill, weakestTopic: sum.weakestTopic,
      homeworkCompletion: assignments.length ? Math.round((done / assignments.length) * 100) : 0 };
  }));
  res.json({ students: out });
}));

// @route GET /api/tutor/home — dashboard summary
router.get('/home', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const [studentIds, tutorUser, recentNotes, cert] = await Promise.all([
    tutorStudentIds(req),
    User.findById(req.user.id).select('name').lean(),
    LessonNote.find({ tutorUserId: req.user.id, workspaceId: req.workspaceId }).sort({ createdAt: -1 }).limit(5),
    TutorCertification.findOne({ tutorUserId: req.user.id }),
  ]);
  const overdue = await Assignment.countDocuments({ studentId: { $in: studentIds }, status: 'overdue' });

  // Fetch all students + their mastery in parallel (avoids N+1 serial loop).
  const studentDocs = await Student.find({ _id: { $in: studentIds } }).lean();
  const summaries = await Promise.all(studentDocs.map((s) => masterySummary(s._id)));

  const students = studentDocs.map((s, i) => {
    const sum = summaries[i];
    return {
      studentId: s._id,
      name: s.name,
      level: s.level,
      weakestSkill: sum.weakestSkill,
      status: sum.weakestSkill ? 'needs_review' : 'on_track',
      reason: sum.weakestSkill ? `${sum.weakestSkill} needs review` : null,
    };
  });
  const attention = students.filter((s) => s.status === 'needs_review');

  res.json({
    tutorName: tutorUser?.name || null,
    studentCount: studentIds.length,
    sessionsToday: 0,
    overdueCount: overdue,
    students,
    attention,
    recentNotes: recentNotes.map((n) => ({ id: n._id, studentId: n.studentId, covered: n.covered, createdAt: n.createdAt })),
    certificationStatus: cert?.status || 'not_started',
  });
}));

// @route GET /api/tutor/students/:id — profile
router.get('/students/:id', asyncHandler(async (req, res) => {
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
    mistakes: mistakes.map((m) => ({
      id: m._id,
      skillName: m.skillId?.name,
      questionStem: m.questionStem,
      studentAnswer: m.studentAnswer,
      correctAnswer: m.correctAnswer,
      learningStatus: m.learningStatus || (m.reviewed ? 'acknowledged' : 'new'),
      masteryEvidence: m.masteryEvidence || {},
      hasTutorExplanation: Boolean(m.tutorExplanation?.recordedAt),
      explanationFeedback: m.tutorExplanation?.feedback || null,
    })),
    assignments: assignments.map((a) => ({ id: a._id, module: a.module, status: a.status, score: a.score, skillNames: a.skillIds.map((s) => s.name), dueDate: a.dueDate })),
    lessonNotes: notes.map((n) => ({ id: n._id, covered: n.covered, createdAt: n.createdAt, parentUpdateStatus: n.parentUpdateStatus })),
  });
}));

// @route GET /api/tutor/students/:id/lesson-prep — rule-based suggestion
router.get('/students/:id/lesson-prep', asyncHandler(async (req, res) => {
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
}));

router.post('/students/:id/lesson-prep/assign-recovery-pack', asyncHandler(async (req, res) => {
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
}));

// @route GET/POST /api/tutor/students/:id/lesson-notes
router.get('/students/:id/lesson-notes', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  const notes = await LessonNote.find({ studentId: student._id, workspaceId: req.workspaceId }).sort({ createdAt: -1 });
  res.json({ lessonNotes: notes });
}));
router.post('/students/:id/lesson-notes', asyncHandler(async (req, res) => {
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
}));

// @route POST /api/tutor/students/:id/lesson-notes/:noteId/send
// Delivers a lesson note's parent summary to the student's guardians as an
// in-app notification and marks it sent. Idempotent: re-sending a 'sent' note
// notifies no one again.
router.post('/students/:id/lesson-notes/:noteId/send', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  const note = await LessonNote.findOne({
    _id: req.params.noteId, studentId: student._id, workspaceId: req.workspaceId,
  });
  if (!note) return res.status(404).json({ error: 'Lesson note not found.' });
  if (note.parentUpdateStatus === 'sent') {
    return res.json({ lessonNote: note, notified: 0, alreadySent: true });
  }
  const guardians = await StudentGuardian.find({ studentId: student._id });
  await Promise.all(guardians.map((g) => notify({
    recipientUserId: g.guardianUserId,
    type: 'lesson_summary',
    title: `New lesson update for ${student.name}`,
    body: note.parentSummary || note.covered || 'Your tutor shared a lesson update.',
    linkPath: `/parent/children/${student._id}/progress`,
    sourceType: 'LessonNote',
    sourceId: note._id,
  })));
  note.parentUpdateStatus = 'sent';
  await note.save();
  res.json({ lessonNote: note, notified: guardians.length });
}));

// ── Tutor Explanation Recording ──────────────────────────────────────────
// Tutors record a visual canvas explanation for how to solve a specific
// mistake. Parents see the replay in MistakeCard.

// @route GET /api/tutor/students/:id/mistakes/:mistakeId — full mistake detail
router.get('/students/:id/mistakes/:mistakeId', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  try {
    const mistake = await Mistake.findOne({ _id: req.params.mistakeId, studentId: student._id })
      .populate({ path: 'skillId', model: Skill });
    if (!mistake) return res.status(404).json({ error: 'Mistake not found.' });
    res.json({
      mistake: {
        id: mistake._id,
        skillName: mistake.skillId?.name || '',
        skillCode: mistake.skillCode,
        questionStem: mistake.questionStem,
        questionText: mistake.questionText,
        studentAnswer: mistake.studentAnswer,
        correctAnswer: mistake.correctAnswer,
        workedSolution: mistake.workedSolution,
        workingImage: mistake.workingImage,
        workingStrokes: mistake.workingStrokes,
        learningStatus: mistake.learningStatus,
        mistakeType: mistake.mistakeType,
        mistakeCategory: mistake.mistakeCategory,
        severity: mistake.severity,
        tutorExplanation: mistake.tutorExplanation?.recordedAt ? {
          strokes: mistake.tutorExplanation.strokes,
          image: mistake.tutorExplanation.image,
          recordedAt: mistake.tutorExplanation.recordedAt,
          durationMs: mistake.tutorExplanation.durationMs,
        } : null,
        occurredAt: mistake.occurredAt,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistake.' });
  }
}));

// @route POST /api/tutor/students/:id/mistakes/:mistakeId/explanation
// Save a tutor's visual explanation for a mistake (canvas strokes + snapshot).
router.post('/students/:id/mistakes/:mistakeId/explanation', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res); if (!student) return;
  try {
    const mistake = await Mistake.findOne({ _id: req.params.mistakeId, studentId: student._id });
    if (!mistake) return res.status(404).json({ error: 'Mistake not found.' });

    const { strokes, image, durationMs } = req.body || {};
    if (!Array.isArray(strokes) || !strokes.length) {
      return res.status(400).json({ error: 'At least one stroke is required.' });
    }

    mistake.tutorExplanation = {
      strokes,
      image: image || '',
      recordedAt: new Date(),
      recordedByUserId: req.user.id,
      durationMs: typeof durationMs === 'number' ? durationMs : null,
    };
    await mistake.save();

    // Notify guardians (fire-and-forget — don't let notification failure block the response).
    StudentGuardian.find({ studentId: student._id }).then((guardians) =>
      Promise.all(guardians.map((g) => notify({
        recipientUserId: g.guardianUserId,
        type: 'tutor_explanation',
        title: `Tutor explanation for ${student.name}`,
        body: `Your tutor recorded an explanation for: ${mistake.questionStem?.slice(0, 80) || 'a recent mistake'}`,
        linkPath: `/parent/children/${student._id}/mistakes?highlight=${mistake._id}`,
        sourceType: 'Mistake',
        sourceId: mistake._id,
      })))
    ).catch((err) => console.error('[tutor] Failed to notify guardians of explanation:', err.message));

    res.json({ id: mistake._id, tutorExplanation: mistake.tutorExplanation });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to save explanation.' });
  }
}));

// @route POST /api/tutor/students/:id/mistakes/:mistakeId/explanation-audio
// Upload voice narration for a tutor explanation. Stored in R2 alongside strokes.
router.post('/students/:id/mistakes/:mistakeId/explanation-audio', audioUpload.single('audio'), asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res);
  if (!student) return;
  try {
    const mistake = await Mistake.findOne({ _id: req.params.mistakeId, studentId: student._id });
    if (!mistake) return res.status(404).json({ error: 'Mistake not found.' });
    if (!mistake.tutorExplanation?.recordedAt) {
      return res.status(400).json({ error: 'Save the drawing first before uploading audio.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No audio file.' });
    const key = `explanations/${mistake._id}/audio.webm`;
    await r2.putAudioObject(key, req.file.buffer, req.file.mimetype || 'audio/webm');
    mistake.tutorExplanation.audioStorageKey = key;
    mistake.tutorExplanation.audioMimeType = req.file.mimetype || 'audio/webm';
    await mistake.save();
    console.info('[tutor] Saved explanation audio', { mistakeId: String(mistake._id), key });
    res.json({ stored: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to upload explanation audio.' });
  }
}));

// @route GET/POST /api/tutor/lesson-notes — MathPath lesson notes API
router.get('/lesson-notes', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent({ ...req, params: { id: req.query.studentId } }, res); if (!student) return;
  const notes = await LessonNote.find({
    studentId: student._id,
    workspaceId: req.workspaceId,
    subjectId: req.query.subjectId || 'math',
    domainId: req.query.domainId || 'fractions',
  }).sort({ createdAt: -1 }).lean();
  res.json({ lessonNotes: notes });
}));

router.post('/lesson-notes', asyncHandler(async (req, res) => {
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
}));

// @route GET /api/tutor/homework — all assignments this tutor created
router.get('/homework', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const list = await Assignment.find({ workspaceId: req.workspaceId, assignedByUserId: req.user.id })
    .populate({ path: 'skillIds', model: Skill }).sort({ createdAt: -1 });
  const students = await Student.find({ _id: { $in: list.map((a) => a.studentId) } });
  const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name]));
  res.json({ homework: list.map((a) => ({ id: a._id, studentId: a.studentId, studentName: nameById[String(a.studentId)] || '',
    module: a.module, status: a.status, score: a.score, dueDate: a.dueDate, skillNames: a.skillIds.map((s) => s.name) })) });
}));

// @route GET/PUT /api/tutor/availability
router.get('/availability', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const av = await TutorAvailability.findOne({ tutorUserId: req.user.id, workspaceId: req.workspaceId });
  res.json({ availability: av || { slots: [], unavailableDates: [] } });
}));
router.put('/availability', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const av = await TutorAvailability.findOneAndUpdate(
    { tutorUserId: req.user.id, workspaceId: req.workspaceId },
    { slots: req.body.slots || [], unavailableDates: req.body.unavailableDates || [], updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ availability: av });
}));

// @route GET /api/tutor/certification
router.get('/certification', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  let cert = await TutorCertification.findOne({ tutorUserId: req.user.id });
  if (!cert) cert = await TutorCertification.create({ tutorUserId: req.user.id });
  res.json({ certification: cert });
}));

// ── PSL student dashboard (tutor view) ────────────────────────────────
router.get('/students/:id/psl/dashboard', asyncHandler(async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const student = await requireLinkedStudent(req, res);
  if (!student) return;
  const studentId = student._id;

  const [sessions, attempts, skills, masteryRecs] = await Promise.all([
    PSLSession.find({ studentId }).lean(),
    PSLAttempt.find({ studentId }).lean(),
    PSLSkill.find({ isActive: true }).lean(),
    MasteryRecord.find({ studentId, module: 'PSL' }).lean(),
  ]);

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const avgAccuracy = attempts.length
    ? Math.round((attempts.reduce((a, at) => a + at.overallScore, 0) / attempts.length) * 100)
    : 0;

  const skillMap = {};
  for (const sk of skills) {
    const skSessions = sessions.filter((s) => s.skillId === sk.skillId);
    const skAttempts = attempts.filter((a) => a.skillId === sk.skillId);
    if (!skSessions.length && !skAttempts.length) continue;
    const mastered = masteryRecs.find((r) => r.skillId?.toString() === sk.skillId && r.status === 'mastered');
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
      sessions: skSessions.length, mastered: Boolean(mastered), averageScore: avgScore, topMisconceptions,
    };
  }

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
  for (const sk of Object.values(skillMap)) {
    const h = sk.heuristic;
    if (!heuristicMap[h]) heuristicMap[h] = { heuristic: h, sessions: 0, _scores: [] };
    heuristicMap[h].sessions += sk.sessions;
    const skAttempts = attempts.filter((a) => a.skillId === sk.skillId);
    heuristicMap[h]._scores.push(...skAttempts.map((a) => a.overallScore));
  }
  const heuristics = Object.values(heuristicMap).map((h) => ({
    heuristic: h.heuristic, sessions: h.sessions,
    avgScore: h._scores.length ? Math.round((h._scores.reduce((a, b) => a + b, 0) / h._scores.length) * 100) : 0,
  }));

  const miscCounts = {};
  for (const at of attempts) {
    for (const step of at.steps || []) {
      if (step.misconceptionTag) miscCounts[step.misconceptionTag] = (miscCounts[step.misconceptionTag] || 0) + 1;
    }
  }
  const topMisconceptions = Object.entries(miscCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));

  const recentSessions = completedSessions
    .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt))
    .slice(0, 10)
    .map((s) => {
      const sk = skills.find((sk) => sk.skillId === s.skillId);
      const sessionAttempts = attempts.filter((a) => a.sessionId === s.sessionId);
      const avgScore = sessionAttempts.length
        ? Math.round((sessionAttempts.reduce((a, at) => a + at.overallScore, 0) / sessionAttempts.length) * 100)
        : 0;
      return {
        sessionId: s.sessionId, skillId: s.skillId, skillName: sk?.name || s.skillId,
        heuristic: sk?.heuristic, date: s.completedAt || s.updatedAt, score: avgScore,
        problems: s.summary?.totalProblems || 0,
      };
    });

  res.json({
    student: { id: studentId, name: student.name, level: student.level },
    overview: {
      totalSessions: completedSessions.length, skillsAttempted: Object.keys(skillMap).length,
      skillsMastered: masteryRecs.filter((r) => r.status === 'mastered').length,
      averageAccuracy: avgAccuracy,
      hintUsageRate: attempts.length
        ? Math.round((attempts.filter((a) => (a.steps || []).some((s) => s.hintUsed)).length / attempts.length) * 100)
        : 0,
    },
    skills: Object.values(skillMap),
    heuristics,
    stepAnalytics,
    topMisconceptions,
    recentSessions,
  });
}));

export default router;
