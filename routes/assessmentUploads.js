import express from 'express';
import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import UploadedAssessment from '../models/mathpath/UploadedAssessment.js';
import AssessmentBlueprint from '../models/mathpath/AssessmentBlueprint.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import ClassStudent from '../models/ClassStudent.js';
import Class from '../models/Class.js';
import {
  REQUIRED_UPLOAD_CONSENT,
  createBlueprintFromUpload,
  deleteTemporaryUploadFile,
  extractAssessmentMetadataFromBuffer,
  normalizeUploadConsent,
  writeTemporaryUploadFile,
} from '../services/mathpath/assessmentAnalysisService.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ]);
    if (!allowed.has(file.mimetype)) {
      cb(new Error('Only PDF and image files are supported.'));
      return;
    }
    cb(null, true);
  },
});

function roleSet(user) {
  return new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
}

function toObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

function normalizeOwnerType(req) {
  const requested = String(req.body?.ownerType || req.user?.role || '').trim();
  const roles = roleSet(req.user);
  if (requested && roles.has(requested)) return requested;
  if (roles.has('admin')) return 'admin';
  if (roles.has('teacher')) return 'teacher';
  if (roles.has('tutor')) return 'tutor';
  if (roles.has('parent')) return 'parent';
  return '';
}

async function appendLog(uploadDoc, stage, message, details = null) {
  uploadDoc.processingLogs = uploadDoc.processingLogs || [];
  uploadDoc.processingLogs.push({
    at: new Date(),
    stage,
    message,
    details,
  });
  if (uploadDoc.processingLogs.length > 300) {
    uploadDoc.processingLogs = uploadDoc.processingLogs.slice(-300);
  }
  await uploadDoc.save();
}

async function validateOwnership(req, ownerType) {
  const workspaceId = req.header('X-Workspace-Id') || req.query.workspaceId || req.body?.workspaceId || null;
  const studentId = toObjectId(req.body?.studentId);
  const classId = toObjectId(req.body?.classId);

  if (ownerType === 'parent') {
    if (!studentId) {
      return { ok: false, status: 400, error: 'Parent upload requires a valid studentId.' };
    }
    const guardian = await StudentGuardian.findOne({
      guardianUserId: req.user.id,
      studentId,
    });
    if (!guardian) {
      const fallbackStudent = await Student.findOne({ _id: studentId, createdByUserId: req.user.id });
      if (!fallbackStudent) {
        return { ok: false, status: 403, error: 'Parent can only upload for linked children.' };
      }
      return {
        ok: true,
        scope: {
          workspaceId: fallbackStudent.workspaceId || null,
          studentId,
          classId: null,
        },
      };
    }
    return {
      ok: true,
      scope: {
        workspaceId: guardian.workspaceId || null,
        studentId,
        classId: null,
      },
    };
  }

  if (ownerType === 'tutor') {
    if (!workspaceId) return { ok: false, status: 400, error: 'Tutor uploads require X-Workspace-Id.' };
    if (!studentId) return { ok: false, status: 400, error: 'Tutor upload requires a valid studentId.' };
    const link = await TutorStudentLink.findOne({
      workspaceId,
      tutorUserId: req.user.id,
      studentId,
      status: 'active',
    });
    if (!link) return { ok: false, status: 403, error: 'Tutor can only upload for assigned students.' };
    return {
      ok: true,
      scope: {
        workspaceId: link.workspaceId,
        studentId,
        classId: null,
      },
    };
  }

  if (ownerType === 'teacher') {
    if (!workspaceId) return { ok: false, status: 400, error: 'Teacher uploads require X-Workspace-Id.' };
    if (!classId) return { ok: false, status: 400, error: 'Teacher upload requires a valid classId.' };
    const ownedClass = await Class.findOne({
      _id: classId,
      workspaceId,
      teacherUserId: req.user.id,
    });
    if (!ownedClass) return { ok: false, status: 403, error: 'Teacher can only upload for own classes.' };

    if (studentId) {
      const enrollment = await ClassStudent.findOne({
        workspaceId,
        classId,
        studentId,
        status: 'active',
      });
      if (!enrollment) return { ok: false, status: 403, error: 'Student is not active in this class.' };
    }

    return {
      ok: true,
      scope: {
        workspaceId: ownedClass.workspaceId,
        studentId: studentId || null,
        classId,
      },
    };
  }

  if (ownerType === 'admin') {
    return {
      ok: true,
      scope: {
        workspaceId: workspaceId || null,
        studentId: studentId || null,
        classId: classId || null,
      },
    };
  }

  return { ok: false, status: 403, error: 'Unsupported user role for assessment upload.' };
}

function canReadUpload(req, uploadDoc) {
  const roles = roleSet(req.user);
  if (roles.has('admin')) return true;
  return String(uploadDoc.ownerId || '') === String(req.user?.id || '');
}

function buildUploadSummary(uploadDoc) {
  return {
    uploadId: String(uploadDoc._id),
    ownerType: uploadDoc.ownerType,
    status: uploadDoc.status,
    uploadDate: uploadDoc.uploadDate,
    analysisStartedAt: uploadDoc.analysisStartedAt,
    analysisCompletedAt: uploadDoc.analysisCompletedAt,
    deleteCompletedAt: uploadDoc.deleteCompletedAt,
    deletionVerified: Boolean(uploadDoc.deletionVerified),
    fileName: uploadDoc.fileName,
    fileMimeType: uploadDoc.fileMimeType,
    fileSizeBytes: uploadDoc.fileSizeBytes,
    studentId: uploadDoc.studentId || null,
    classId: uploadDoc.classId || null,
    blueprintId: uploadDoc.blueprintId || null,
    extractedAssessmentType: uploadDoc.extractedAssessmentType || '',
    extractedDurationMinutes: uploadDoc.extractedDurationMinutes || 0,
    extractedTotalMarks: uploadDoc.extractedTotalMarks || 0,
    extractedSectionCount: uploadDoc.extractedSectionCount || 0,
    extractedQuestionCount: uploadDoc.extractedQuestionCount || 0,
  };
}

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const roles = roleSet(req.user);
    const query = {};
    if (!roles.has('admin')) {
      query.ownerId = req.user.id;
    }
    if (req.query.status) query.status = String(req.query.status);
    if (req.query.ownerType) query.ownerType = String(req.query.ownerType);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const uploads = await UploadedAssessment.find(query).sort({ uploadDate: -1 }).limit(limit).lean();
    return res.json({ uploads: uploads.map(buildUploadSummary) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list uploads.' });
  }
});

router.post('/', upload.single('paper'), async (req, res) => {
  const consentAccepted = normalizeUploadConsent(req.body?.consentAccepted ?? req.body?.consent);
  if (!consentAccepted) {
    return res.status(400).json({
      error: 'Consent required before upload.',
      requiredConsent: REQUIRED_UPLOAD_CONSENT,
    });
  }
  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'Upload file is required.' });
  }

  const ownerType = normalizeOwnerType(req);
  const scope = await validateOwnership(req, ownerType);
  if (!scope.ok) {
    return res.status(scope.status).json({ error: scope.error });
  }

  const uploadDoc = await UploadedAssessment.create({
    ownerId: req.user.id,
    ownerType,
    workspaceId: scope.scope.workspaceId,
    studentId: scope.scope.studentId,
    classId: scope.scope.classId,
    fileName: req.file.originalname || 'assessment-upload',
    fileMimeType: req.file.mimetype || '',
    fileSizeBytes: req.file.size || 0,
    status: 'uploaded',
    consentAccepted,
    processingLogs: [],
  });

  let tempFilePath = '';
  try {
    await appendLog(uploadDoc, 'upload.received', 'File upload accepted.', {
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    uploadDoc.status = 'processing';
    uploadDoc.analysisStartedAt = new Date();
    await appendLog(uploadDoc, 'analysis.started', 'Analysis started.');

    const ext = path.extname(req.file.originalname || '') || '.pdf';
    tempFilePath = await writeTemporaryUploadFile(req.file.buffer, ext);
    await appendLog(uploadDoc, 'storage.temp', 'Temporary file stored for analysis.', {
      tempFileName: path.basename(tempFilePath),
    });

    const context = {
      title: req.body?.title,
      level: req.body?.level,
      subject: req.body?.subject || 'Math',
      school: req.body?.school,
      assessmentType: req.body?.assessmentType,
      durationMinutes: req.body?.durationMinutes,
      totalMarks: req.body?.totalMarks,
      calculatorAllowed: req.body?.calculatorAllowed,
      timed: req.body?.timed,
      createdBy: req.user.id,
      createdByUserId: req.user.id,
      workspaceId: scope.scope.workspaceId || null,
      sourceType: 'uploadDerived',
      status: 'draft',
    };

    const extracted = await extractAssessmentMetadataFromBuffer(req.file.buffer, context);
    await appendLog(uploadDoc, 'analysis.extracted', 'Assessment metadata extracted.', {
      sectionCount: extracted.analysisSummary.sectionCount,
      questionCount: extracted.analysisSummary.questionCount,
      topicsDetected: extracted.analysisSummary.topicDistribution.length,
    });

    const { blueprintDoc, schoolProfile } = await createBlueprintFromUpload(extracted, {
      actorUserId: req.user.id,
      workspaceId: scope.scope.workspaceId || null,
    });
    await appendLog(uploadDoc, 'blueprint.created', 'Assessment blueprint created from upload.', {
      blueprintId: String(blueprintDoc._id),
    });

    uploadDoc.analysisCompletedAt = new Date();
    uploadDoc.status = 'completed';
    uploadDoc.blueprintId = blueprintDoc._id;
    uploadDoc.extractedAssessmentType = extracted.analysisSummary.assessmentType;
    uploadDoc.extractedDurationMinutes = extracted.analysisSummary.durationMinutes;
    uploadDoc.extractedCalculatorAllowed = extracted.analysisSummary.calculatorAllowed;
    uploadDoc.extractedTotalMarks = extracted.analysisSummary.totalMarks;
    uploadDoc.extractedSectionCount = extracted.analysisSummary.sectionCount;
    uploadDoc.extractedQuestionCount = extracted.analysisSummary.questionCount;
    uploadDoc.extractedTopicDistribution = extracted.analysisSummary.topicDistribution;
    uploadDoc.extractedDifficultyProfile = extracted.analysisSummary.difficultyProfile;
    uploadDoc.extractedQuestionStyles = extracted.analysisSummary.questionStyles;
    uploadDoc.questionMetadata = extracted.questionMetadata;
    uploadDoc.diagramMetadata = extracted.diagramMetadata;
    await uploadDoc.save();

    const deletion = await deleteTemporaryUploadFile(tempFilePath);
    uploadDoc.deleteCompletedAt = deletion.verified ? new Date() : null;
    uploadDoc.deletionVerified = Boolean(deletion.verified);
    uploadDoc.status = deletion.verified ? 'deleted' : 'failed';
    if (!deletion.verified) {
      uploadDoc.errorMessage = 'Temporary file deletion could not be verified.';
    }
    await appendLog(
      uploadDoc,
      'delete.completed',
      deletion.verified ? 'Original upload deleted and verified.' : 'Original upload deletion verification failed.',
      { deleted: deletion.deleted, verified: deletion.verified }
    );

    return res.status(201).json({
      upload: buildUploadSummary(uploadDoc),
      analysisSummary: extracted.analysisSummary,
      questionMetadata: uploadDoc.questionMetadata,
      diagramMetadata: uploadDoc.diagramMetadata,
      blueprint: blueprintDoc,
      schoolProfile,
      originalFileDeleted: deletion.verified,
    });
  } catch (err) {
    if (tempFilePath) {
      try {
        const deletion = await deleteTemporaryUploadFile(tempFilePath);
        uploadDoc.deletionVerified = Boolean(deletion.verified);
        uploadDoc.deleteCompletedAt = deletion.verified ? new Date() : null;
      } catch {
        // best effort cleanup
      }
    }
    uploadDoc.status = 'failed';
    uploadDoc.errorMessage = err.message || 'Upload analysis failed.';
    await appendLog(uploadDoc, 'analysis.failed', uploadDoc.errorMessage);
    return res.status(500).json({ error: uploadDoc.errorMessage });
  }
});

router.get('/:uploadId/status', async (req, res) => {
  try {
    const uploadDoc = await UploadedAssessment.findById(req.params.uploadId);
    if (!uploadDoc) return res.status(404).json({ error: 'Uploaded assessment not found.' });
    if (!canReadUpload(req, uploadDoc)) return res.status(403).json({ error: 'Not authorized to view this upload.' });
    return res.json({
      upload: buildUploadSummary(uploadDoc),
      processingLogs: uploadDoc.processingLogs || [],
      errorMessage: uploadDoc.errorMessage || '',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to read upload status.' });
  }
});

router.get('/:uploadId/blueprint', async (req, res) => {
  try {
    const uploadDoc = await UploadedAssessment.findById(req.params.uploadId);
    if (!uploadDoc) return res.status(404).json({ error: 'Uploaded assessment not found.' });
    if (!canReadUpload(req, uploadDoc)) return res.status(403).json({ error: 'Not authorized to view this upload.' });
    if (!uploadDoc.blueprintId) return res.status(404).json({ error: 'No generated blueprint for this upload.' });
    const blueprint = await AssessmentBlueprint.findById(uploadDoc.blueprintId).lean();
    if (!blueprint) return res.status(404).json({ error: 'Generated blueprint was not found.' });
    return res.json({
      upload: buildUploadSummary(uploadDoc),
      blueprint,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to load generated blueprint.' });
  }
});

router.get('/:uploadId/metadata', async (req, res) => {
  try {
    const uploadDoc = await UploadedAssessment.findById(req.params.uploadId);
    if (!uploadDoc) return res.status(404).json({ error: 'Uploaded assessment not found.' });
    if (!canReadUpload(req, uploadDoc)) return res.status(403).json({ error: 'Not authorized to view this upload.' });
    return res.json({
      upload: buildUploadSummary(uploadDoc),
      topicsDetected: uploadDoc.extractedTopicDistribution || [],
      questionMetadata: uploadDoc.questionMetadata || [],
      diagramMetadata: uploadDoc.diagramMetadata || [],
      difficultyProfile: uploadDoc.extractedDifficultyProfile || {},
      questionStyles: uploadDoc.extractedQuestionStyles || [],
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to load extracted metadata.' });
  }
});

router.get('/:uploadId/deletion-logs', async (req, res) => {
  try {
    const uploadDoc = await UploadedAssessment.findById(req.params.uploadId);
    if (!uploadDoc) return res.status(404).json({ error: 'Uploaded assessment not found.' });
    if (!canReadUpload(req, uploadDoc)) return res.status(403).json({ error: 'Not authorized to view this upload.' });
    const logs = (uploadDoc.processingLogs || []).filter((row) => String(row.stage || '').startsWith('delete'));
    return res.json({
      upload: buildUploadSummary(uploadDoc),
      deletionVerified: Boolean(uploadDoc.deletionVerified),
      logs,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to load deletion logs.' });
  }
});

export default router;
