import express from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathWorkingSession from '../models/mathpath/MathPathWorkingSession.js';
import {
  buildQuestionWorkingMap,
  generateWorkingCode,
  isValidAnalysisStatus,
  summarizeWorkingSessionForReview,
} from '../services/mathpath/workingCodeService.js';

const router = express.Router();
const WORKING_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'mathpath-working');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);
    if (!allowed.has(file.mimetype)) {
      cb(new Error('Only PDF, JPG and PNG working uploads are supported.'));
      return;
    }
    cb(null, true);
  },
});

function roleSet(user) {
  return new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
}

function getSubmittedByRole(user) {
  const roles = roleSet(user);
  if (roles.has('admin')) return 'admin';
  if (roles.has('teacher')) return 'teacher';
  if (roles.has('tutor')) return 'tutor';
  if (roles.has('parent')) return 'parent';
  if (roles.has('student')) return 'student';
  return user?.role || 'user';
}

function canActForStudent(req, studentId) {
  const roles = roleSet(req.user);
  if (roles.has('admin') || roles.has('teacher') || roles.has('tutor') || roles.has('parent')) return true;
  return String(req.user?.id || req.user?._id || '') === String(studentId || '');
}

function publicSession(session = {}) {
  return {
    workingSessionId: session.workingSessionId,
    studentId: session.studentId,
    practiceSessionId: session.practiceSessionId || null,
    assessmentSessionId: session.assessmentSessionId || null,
    domainId: session.domainId,
    skillIds: session.skillIds || [],
    questionIds: session.questionIds || [],
    inputMethod: session.inputMethod,
    status: session.status,
    questionWorkingMap: session.questionWorkingMap || [],
    fileMetadata: session.fileMetadata || [],
    uploadedImages: session.uploadedImages || [],
    canvasImage: session.canvasImage || '',
    canvasStrokeData: session.canvasStrokeData || [],
    doodleOverlayData: session.doodleOverlayData || [],
    digitalInkData: session.digitalInkData || null,
    submittedByRole: session.submittedByRole || '',
    submittedByUserId: session.submittedByUserId || '',
    submissionTimestamp: session.submissionTimestamp || null,
    submittedAt: session.submittedAt || null,
    analysisStatus: session.analysisStatus || 'pending_analysis',
    analysisEvidence: session.analysisEvidence || [],
    analysisSummary: session.analysisSummary || '',
    interventionRecommendation: session.interventionRecommendation || '',
    createdAt: session.createdAt || null,
    updatedAt: session.updatedAt || null,
  };
}

function normalizeSkillLabel(skillId = '') {
  return String(skillId || '').trim() || 'Unmapped skill';
}

async function writeWorkingFiles(workingSessionId, files = []) {
  if (!files.length) return [];
  const safeSessionId = String(workingSessionId || 'working').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = path.join(WORKING_UPLOAD_DIR, safeSessionId);
  await fs.mkdir(dir, { recursive: true });
  const uploadedAt = new Date();
  const written = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const ext = path.extname(file.originalname || '') || (
      file.mimetype === 'application/pdf' ? '.pdf'
        : file.mimetype === 'image/png' ? '.png'
          : '.jpg'
    );
    const fileName = `${uploadedAt.getTime()}-${index + 1}${ext}`;
    const diskPath = path.join(dir, fileName);
    await fs.writeFile(diskPath, file.buffer);
    written.push({
      fileName: file.originalname || fileName,
      mimeType: file.mimetype || '',
      sizeBytes: file.size || 0,
      storageRef: `/uploads/mathpath-working/${safeSessionId}/${fileName}`,
      uploadedAt,
    });
  }
  return written;
}

async function buildHelpRequestSummary({ studentId = '', studentIds = [] } = {}) {
  const query = { helpRequested: true };
  const ids = studentId ? [studentId] : studentIds;
  if (ids.length) query.studentId = { $in: ids.map((id) => String(id)) };
  const attempts = await MathPathAttempt.find(query).sort({ createdAt: -1 }).limit(500).lean();
  const bySkill = new Map();
  attempts.forEach((attempt) => {
    const key = normalizeSkillLabel(attempt.skillId);
    if (!bySkill.has(key)) {
      bySkill.set(key, {
        skillId: key,
        count: 0,
        latestAt: null,
        wrongCount: 0,
        correctCount: 0,
        studentIds: new Set(),
        priorityRemediationCandidate: false,
        escalation: 'monitor',
      });
    }
    const row = bySkill.get(key);
    row.count += 1;
    row.studentIds.add(String(attempt.studentId || ''));
    if (attempt.correct) row.correctCount += 1;
    else row.wrongCount += 1;
    const createdAt = attempt.createdAt || attempt.timestamp || new Date();
    if (!row.latestAt || new Date(createdAt) > new Date(row.latestAt)) row.latestAt = createdAt;
  });

  return [...bySkill.values()]
    .map((row) => {
      const count = row.count;
      let escalation = 'monitor';
      if (count >= 10) escalation = 'priority_remediation';
      else if (count >= 8) escalation = 'diagnostic_assessment';
      else if (count >= 5) escalation = 'tutor_intervention';
      else if (count >= 3) escalation = 'parent_notify';
      return {
        ...row,
        studentIds: [...row.studentIds].filter(Boolean),
        escalation,
        priorityRemediationCandidate: count >= 10,
      };
    })
    .sort((a, b) => b.count - a.count || new Date(b.latestAt || 0) - new Date(a.latestAt || 0));
}

function buildWorkingQueueSummary(sessions = []) {
  return {
    pendingUploadCount: sessions.filter((s) => s.status === 'pending' || !(s.fileUrls || []).length).length,
    pendingAnalysisCount: sessions.filter((s) => s.analysisStatus === 'pending_analysis').length,
    needsReviewCount: sessions.filter((s) => s.analysisStatus === 'needs_review').length,
    analysedCount: sessions.filter((s) => s.analysisStatus === 'analysed').length,
  };
}

router.use(protect);

router.post('/sessions', async (req, res) => {
  try {
    const studentId = String(req.body?.studentId || req.user?.id || '').trim();
    if (!studentId) return res.status(400).json({ error: 'studentId is required.' });
    if (!canActForStudent(req, studentId)) return res.status(403).json({ error: 'Not allowed to create working sessions for this student.' });

    const practiceSessionId = req.body?.practiceSessionId || req.body?.sessionId || null;
    const assessmentSessionId = req.body?.assessmentSessionId || null;
    const domainId = String(req.body?.domainId || 'fractions').trim();
    const questionRefs = Array.isArray(req.body?.questionRefs) ? req.body.questionRefs : [];
    const questionWorkingMap = buildQuestionWorkingMap(questionRefs, {
      domainId,
      sessionId: practiceSessionId || assessmentSessionId || '',
      workingRequired: true,
    });
    const skillIds = [...new Set([
      ...(Array.isArray(req.body?.skillIds) ? req.body.skillIds : []),
      ...questionWorkingMap.map((row) => row.skillId),
    ].filter(Boolean))];
    const questionIds = [...new Set([
      ...(Array.isArray(req.body?.questionIds) ? req.body.questionIds : []),
      ...questionWorkingMap.map((row) => row.questionId),
    ].filter(Boolean))];

    const existingQuery = { studentId, domainId };
    if (practiceSessionId) existingQuery.practiceSessionId = practiceSessionId;
    if (assessmentSessionId) existingQuery.assessmentSessionId = assessmentSessionId;
    const existing = (practiceSessionId || assessmentSessionId)
      ? await MathPathWorkingSession.findOne(existingQuery).lean()
      : null;
    if (existing) return res.json({ workingSession: publicSession(existing), reused: true });

    const workingSessionId = req.body?.workingSessionId
      || `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const session = await MathPathWorkingSession.create({
      workingSessionId,
      studentId,
      practiceSessionId,
      assessmentSessionId,
      domainId,
      skillIds,
      questionIds,
      inputMethod: req.body?.inputMethod || 'paper',
      status: 'pending',
      questionWorkingMap,
      analysisStatus: 'pending_analysis',
    });

    return res.status(201).json({ workingSession: publicSession(session.toObject()), reused: false });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to create working session.', details: err.message });
  }
});

router.post('/codes', async (req, res) => {
  try {
    const code = generateWorkingCode({
      domainId: req.body?.domainId || 'fractions',
      skillId: req.body?.skillId || '',
      level: req.body?.level || '',
    });
    return res.json({ workingCode: code });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to create working code.', details: err.message });
  }
});

router.get('/code/:workingCode', async (req, res) => {
  try {
    const workingCode = String(req.params.workingCode || '').trim().toUpperCase();
    const session = await MathPathWorkingSession.findOne({ 'questionWorkingMap.workingCode': workingCode }).lean();
    if (!session) return res.status(404).json({ error: 'Working code not found.' });
    if (!canActForStudent(req, session.studentId)) return res.status(403).json({ error: 'Not allowed to view this working code.' });
    const mapping = (session.questionWorkingMap || []).find((row) => row.workingCode === workingCode) || null;
    return res.json({ workingSession: publicSession(session), mapping });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to look up working code.', details: err.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const roles = roleSet(req.user);
    const query = {};
    if (!roles.has('admin') && !roles.has('teacher') && !roles.has('tutor') && !roles.has('parent')) {
      query.studentId = String(req.user?.id || '');
    } else if (req.query.studentId) {
      query.studentId = String(req.query.studentId);
    }
    if (req.query.status) query.status = String(req.query.status);
    if (req.query.analysisStatus) query.analysisStatus = String(req.query.analysisStatus);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const sessions = await MathPathWorkingSession.find(query).sort({ updatedAt: -1 }).limit(limit).lean();
    return res.json({ workingSessions: sessions.map(publicSession) });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to list working sessions.', details: err.message });
  }
});

router.get('/review-summary', async (req, res) => {
  try {
    const roles = roleSet(req.user);
    const query = {};
    if (!roles.has('admin') && !roles.has('teacher') && !roles.has('tutor') && !roles.has('parent')) {
      query.studentId = String(req.user?.id || '');
    } else if (req.query.studentId) {
      query.studentId = String(req.query.studentId);
    }
    if (req.query.analysisStatus) query.analysisStatus = String(req.query.analysisStatus);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const sessions = await MathPathWorkingSession.find(query).sort({ updatedAt: -1 }).limit(limit).lean();
    const helpRequests = await buildHelpRequestSummary({
      studentId: req.query.studentId ? String(req.query.studentId) : '',
      studentIds: sessions.map((session) => session.studentId).filter(Boolean),
    });
    return res.json({
      summary: buildWorkingQueueSummary(sessions),
      workingSessions: sessions.map(publicSession),
      helpRequests,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to load working review summary.', details: err.message });
  }
});

router.get('/help-requests', async (req, res) => {
  try {
    const roles = roleSet(req.user);
    const studentId = req.query.studentId ? String(req.query.studentId) : '';
    if (!studentId && !roles.has('admin') && !roles.has('teacher') && !roles.has('tutor') && !roles.has('parent')) {
      const helpRequests = await buildHelpRequestSummary({ studentId: String(req.user?.id || '') });
      return res.json({ helpRequests });
    }
    const helpRequests = await buildHelpRequestSummary({ studentId });
    return res.json({ helpRequests });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to load help requests.', details: err.message });
  }
});

router.get('/:workingSessionId', async (req, res) => {
  try {
    const session = await MathPathWorkingSession.findOne({ workingSessionId: req.params.workingSessionId }).lean();
    if (!session) return res.status(404).json({ error: 'Working session not found.' });
    if (!canActForStudent(req, session.studentId)) return res.status(403).json({ error: 'Not allowed to view this working session.' });
    return res.json({ workingSession: publicSession(session) });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to load working session.', details: err.message });
  }
});

router.post('/:workingSessionId/upload', upload.array('working', 10), async (req, res) => {
  try {
    const session = await MathPathWorkingSession.findOne({ workingSessionId: req.params.workingSessionId });
    if (!session) return res.status(404).json({ error: 'Working session not found.' });
    if (!canActForStudent(req, session.studentId)) return res.status(403).json({ error: 'Not allowed to upload working for this student.' });

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length && !req.body?.digitalInkData) {
      return res.status(400).json({ error: 'Upload at least one working file or digital ink payload.' });
    }

    const metadata = await writeWorkingFiles(session.workingSessionId, files);
    const uploadedAt = metadata[0]?.uploadedAt || new Date();

    session.fileMetadata = [...(session.fileMetadata || []), ...metadata];
    session.fileUrls = [...(session.fileUrls || []), ...metadata.map((file) => file.storageRef)];
    session.uploadedImages = [
      ...(session.uploadedImages || []),
      ...metadata
        .filter((file) => String(file.mimeType || '').startsWith('image/'))
        .map((file) => file.storageRef),
    ];
    if (req.body?.canvasImage) session.canvasImage = String(req.body.canvasImage);
    if (req.body?.canvasStrokeData) {
      try {
        session.canvasStrokeData = typeof req.body.canvasStrokeData === 'string'
          ? JSON.parse(req.body.canvasStrokeData)
          : req.body.canvasStrokeData;
      } catch (_) {
        session.canvasStrokeData = req.body.canvasStrokeData;
      }
    }
    if (req.body?.doodleOverlayData) {
      try {
        session.doodleOverlayData = typeof req.body.doodleOverlayData === 'string'
          ? JSON.parse(req.body.doodleOverlayData)
          : req.body.doodleOverlayData;
      } catch (_) {
        session.doodleOverlayData = req.body.doodleOverlayData;
      }
    }
    if (req.body?.digitalInkData) session.digitalInkData = req.body.digitalInkData;
    session.status = 'submitted';
    session.submittedByRole = getSubmittedByRole(req.user);
    session.submittedByUserId = String(req.user?.id || req.user?._id || '');
    session.submissionTimestamp = uploadedAt;
    session.submittedAt = uploadedAt;
    const summary = summarizeWorkingSessionForReview(session.toObject());
    session.analysisStatus = summary.analysisStatus;
    session.analysisEvidence = summary.evidence;
    session.analysisSummary = 'Working uploaded and queued for review.';
    session.interventionRecommendation = summary.recommendation;
    await session.save();

    return res.json({ workingSession: publicSession(session.toObject()) });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to upload working.', details: err.message });
  }
});

router.post('/:workingSessionId/no-working', async (req, res) => {
  try {
    const session = await MathPathWorkingSession.findOne({ workingSessionId: req.params.workingSessionId });
    if (!session) return res.status(404).json({ error: 'Working session not found.' });
    if (!canActForStudent(req, session.studentId)) return res.status(403).json({ error: 'Not allowed to update this working session.' });

    const questionId = String(req.body?.questionId || '').trim();
    if (!questionId) return res.status(400).json({ error: 'questionId is required.' });

    const mapRow = (session.questionWorkingMap || []).find((row) => row.questionId === questionId);
    if (!mapRow) return res.status(404).json({ error: 'Question is not mapped to this working session.' });

    mapRow.noWorkingRequiredChecked = true;
    mapRow.workingReason = String(req.body?.reason || 'student_declared_no_working').trim();
    mapRow.mappingStatus = mapRow.mappingStatus === 'unmapped' ? 'manuallyMapped' : mapRow.mappingStatus;
    session.status = session.status === 'pending' ? 'mapped' : session.status;
    await session.save();

    return res.json({ workingSession: publicSession(session.toObject()) });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to mark no working needed.', details: err.message });
  }
});

router.post('/:workingSessionId/analysis', async (req, res) => {
  try {
    const roles = roleSet(req.user);
    if (!roles.has('admin') && !roles.has('teacher') && !roles.has('tutor')) {
      return res.status(403).json({ error: 'Only adults can update working analysis.' });
    }
    const session = await MathPathWorkingSession.findOne({ workingSessionId: req.params.workingSessionId });
    if (!session) return res.status(404).json({ error: 'Working session not found.' });
    const nextStatus = String(req.body?.analysisStatus || '').trim();
    if (nextStatus && !isValidAnalysisStatus(nextStatus)) {
      return res.status(400).json({ error: 'Invalid analysis status.' });
    }
    session.analysisStatus = nextStatus || session.analysisStatus || 'needs_review';
    session.analysisEvidence = Array.isArray(req.body?.analysisEvidence) ? req.body.analysisEvidence : session.analysisEvidence;
    session.analysisSummary = req.body?.analysisSummary == null ? session.analysisSummary : String(req.body.analysisSummary);
    session.interventionRecommendation = req.body?.interventionRecommendation == null
      ? session.interventionRecommendation
      : String(req.body.interventionRecommendation);
    await session.save();
    return res.json({ workingSession: publicSession(session.toObject()) });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to update working analysis.', details: err.message });
  }
});

export default router;
