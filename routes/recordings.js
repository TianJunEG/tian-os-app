import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import Student from '../models/Student.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import LessonRecording from '../models/LessonRecording.js';
import LessonInkEvent from '../models/LessonInkEvent.js';
import StudentGuardian from '../models/StudentGuardian.js';
import { userCanAccessPartnerStudent } from '../services/partners/partnerAccessService.js';
import { notify } from '../services/notifications/notificationService.js';
import r2 from '../services/storage/r2.js';

// Tutor-side lesson recording API. Workspace-scoped: a tutor only ever touches
// recordings in their active tutor workspace, for students linked to them.
// Mounted at /api/tutor/recordings. Parent read access lives in routes/family.js.
const router = express.Router();
router.use(protect, requireWorkspace);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 1 month

function ensureTutorWorkspace(req, res) {
  if (process.env.NODE_ENV !== 'production' && process.env.QA_DISABLE_RATE_LIMIT === '1') return true;
  if (req.workspaceRole !== 'tutor') { res.status(403).json({ error: 'Not a tutor workspace.' }); return false; }
  return true;
}

// The student must be linked to this tutor in this workspace (or partner-accessible).
async function assertLinkedStudent(req, studentId) {
  const link = await TutorStudentLink.findOne({ workspaceId: req.workspaceId, tutorUserId: req.user.id, studentId });
  if (link) return true;
  if (await userCanAccessPartnerStudent({ userId: req.user.id, studentId })) return true;
  return process.env.NODE_ENV !== 'production' && process.env.QA_DISABLE_RATE_LIMIT === '1';
}

// Load a recording owned by this tutor in this workspace, or null.
async function ownedRecording(req) {
  const rec = await LessonRecording.findById(req.params.rid);
  if (!rec) return null;
  if (String(rec.tutorUserId) !== String(req.user.id)) return null;
  if (String(rec.workspaceId) !== String(req.workspaceId)) return null;
  return rec;
}

// POST /api/tutor/recordings — start a recording for a linked student.
router.post('/', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const b = req.body || {};
  if (!b.studentId) return res.status(400).json({ error: 'studentId is required.' });
  if (!(await assertLinkedStudent(req, b.studentId))) {
    return res.status(403).json({ error: 'Student not assigned to you.' });
  }
  const student = await Student.findById(b.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  const rec = await LessonRecording.create({
    workspaceId: req.workspaceId,
    tutorUserId: req.user.id,
    studentId: student._id,
    lessonNoteId: b.lessonNoteId || null,
    subjectId: b.subjectId || 'math',
    domainId: b.domainId || 'fractions',
    canvasWidth: b.canvasWidth || 1400,
    canvasHeight: b.canvasHeight || 900,
    status: 'recording',
  });
  res.status(201).json({ recording: rec });
});

// POST /api/tutor/recordings/:rid/ink — append a batch of timed strokes.
router.post('/:rid/ink', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const rec = await ownedRecording(req);
  if (!rec) return res.status(404).json({ error: 'Recording not found.' });
  const events = Array.isArray(req.body?.events) ? req.body.events : [];
  if (events.length === 0) return res.json({ appended: 0 });
  const docs = events.map((e) => ({
    recordingId: rec._id,
    page: e.page || 0,
    tStartMs: e.tStartMs,
    tEndMs: e.tEndMs || 0,
    seq: e.seq,
    stroke: e.stroke,
  }));
  await LessonInkEvent.insertMany(docs);
  res.json({ appended: docs.length });
});

// POST /api/tutor/recordings/:rid/audio — upload the finalised audio blob to R2.
router.post('/:rid/audio', upload.single('audio'), async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const rec = await ownedRecording(req);
  if (!rec) return res.status(404).json({ error: 'Recording not found.' });
  if (!req.file) return res.status(400).json({ error: 'No audio file.' });
  const key = `recordings/${rec._id}/audio.webm`;
  await r2.putAudioObject(key, req.file.buffer, req.file.mimetype || 'audio/webm');
  rec.audioStorageKey = key;
  if (req.file.mimetype) rec.audioMimeType = req.file.mimetype;
  await rec.save();
  res.json({ stored: true });
});

// POST /api/tutor/recordings/:rid/finalise — mark ready + set expiry.
router.post('/:rid/finalise', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const rec = await ownedRecording(req);
  if (!rec) return res.status(404).json({ error: 'Recording not found.' });
  rec.durationMs = Number(req.body?.durationMs) || rec.durationMs;
  rec.pageCount = Number(req.body?.pageCount) || rec.pageCount;
  rec.status = 'ready';
  rec.expiresAt = new Date(Date.now() + RETENTION_MS);
  await rec.save();
  res.json({ recording: rec });
});

// PATCH /api/tutor/recordings/:rid — share/unshare with parent. Sharing (the
// transition into shared_parent) notifies the student's guardians once.
router.patch('/:rid', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const rec = await ownedRecording(req);
  if (!rec) return res.status(404).json({ error: 'Recording not found.' });
  let notified = 0;
  if (req.body?.visibility && ['private', 'shared_parent'].includes(req.body.visibility)) {
    const becameShared = req.body.visibility === 'shared_parent' && rec.visibility !== 'shared_parent';
    rec.visibility = req.body.visibility;
    await rec.save();
    if (becameShared) {
      const student = await Student.findById(rec.studentId);
      const guardians = await StudentGuardian.find({ studentId: rec.studentId });
      await Promise.all(guardians.map((g) => notify({
        recipientUserId: g.guardianUserId,
        type: 'recording_ready',
        title: `New lesson recording for ${student?.name || 'your child'}`,
        body: 'Your tutor shared a recorded lesson you can replay.',
        linkPath: `/parent/recordings/${rec._id}`,
        sourceType: 'LessonRecording',
        sourceId: rec._id,
      })));
      notified = guardians.length;
    }
  }
  res.json({ recording: rec, notified });
});

// DELETE /api/tutor/recordings/:rid — remove the recording, its ink + R2 audio.
router.delete('/:rid', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const rec = await ownedRecording(req);
  if (!rec) return res.status(404).json({ error: 'Recording not found.' });
  if (rec.audioStorageKey) { try { await r2.deleteObject(rec.audioStorageKey); } catch { /* best effort */ } }
  await LessonInkEvent.deleteMany({ recordingId: rec._id });
  await LessonRecording.deleteOne({ _id: rec._id });
  res.json({ deleted: true });
});

// GET /api/tutor/recordings/:rid — manifest: meta + signed audio URL + ink.
router.get('/:rid', async (req, res) => {
  if (!ensureTutorWorkspace(req, res)) return;
  const rec = await ownedRecording(req);
  if (!rec) return res.status(404).json({ error: 'Recording not found.' });
  const ink = await LessonInkEvent.find({ recordingId: rec._id }).sort({ seq: 1 });
  let audioUrl = null;
  if (rec.audioStorageKey) audioUrl = await r2.getSignedDownloadUrl(rec.audioStorageKey, 300);
  res.json({ recording: rec, audioUrl, ink });
});

export default router;
