import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.js';
import PaperAnalysis from '../models/mathpath/PaperAnalysis.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { resolveStudent } from '../utils/studentContext.js';
import {
  buildPaperAnalysisRecommendations,
  mapPaperQuestionToSkills,
} from '../services/mathpath/paperAnalysisSkillMapper.js';
import {
  mapPaperQuestionToSkills as mapDecimalsPaperQuestion,
} from '../services/mathpath/decimalsPaperAnalysisMapper.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  applyAdultReviewOverrides,
  resumeFromOcrConfirmation,
  runPaperAnalysisPipeline,
} from '../services/mathpath/paperAnalysisPipeline.js';
import {
  buildPaperAnalysisRecommendations as buildReviewRecommendations,
} from '../services/mathpath/paperAnalysisRecommendationEngine.js';
import {
  createAssignmentFromPaperAnalysis,
  createRecheckForAssignment,
  getStudentAssignments,
} from '../services/mathpath/mathPathAssignmentService.js';
import { getQueue, isQueueEnabled, QUEUE_NAMES } from '../config/queue.js';

const router = express.Router();

// Enqueue the analysis pipeline for the background worker. Returns true when the
// job was queued; false when the queue is disabled/unavailable so the caller falls
// back to running the pipeline synchronously. The worker reads the uploaded file
// from the saved storageKey, so the job payload carries only references.
async function enqueuePaperAnalysis(analysis, file) {
  if (!isQueueEnabled()) return false;
  const queue = getQueue(QUEUE_NAMES.paperAnalysis);
  if (!queue) return false;
  await queue.add('run', {
    analysisId: String(analysis._id),
    mimeType: file.mimetype,
    filename: file.originalname,
  });
  return true;
}

// Enqueue the analysis pipeline for the background worker. Returns true when the
// job was queued; false when the queue is disabled/unavailable so the caller falls
// back to running the pipeline synchronously. The worker reads the uploaded file
// from the saved storageKey, so the job payload carries only references.
async function enqueuePaperAnalysis(analysis, file) {
  if (!isQueueEnabled()) return false;
  const queue = getQueue(QUEUE_NAMES.paperAnalysis);
  if (!queue) return false;
  await queue.add('run', {
    analysisId: String(analysis._id),
    mimeType: file.mimetype,
    filename: file.originalname,
  });
  return true;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);
    if (!allowed.has(file.mimetype)) {
      cb(new Error('Only PDF, JPG and PNG paper uploads are supported.'));
      return;
    }
    cb(null, true);
  },
});

function roleSet(user) {
  return new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
}

function uploadedByRole(user) {
  const roles = roleSet(user);
  if (roles.has('admin')) return 'admin';
  if (roles.has('teacher')) return 'teacher';
  if (roles.has('tutor')) return 'tutor';
  if (roles.has('parent')) return 'parent';
  if (roles.has('student_care')) return 'student_care';
  return user?.role || 'user';
}

function assertAdultUploader(req) {
  const roles = roleSet(req.user);
  if (roles.has('admin') || roles.has('teacher') || roles.has('tutor') || roles.has('parent') || roles.has('student_care')) return;
  const err = new Error('Paper analysis uploads are currently available to parents, tutors, teachers, student care staff and admins.');
  err.status = 403;
  throw err;
}

function hasRole(user, role) {
  return roleSet(user).has(role);
}

async function resolvePaperAnalysisStudent(req, explicitId) {
  if (!hasRole(req.user, 'admin')) return resolveStudent(req, explicitId);

  const studentId = explicitId || req.body?.studentId || req.query?.studentId;
  if (!studentId) return resolveStudent(req, explicitId);
  const student = await Student.findById(studentId);
  if (!student) throw { status: 404, message: 'Student not found.' };
  const linkedUsers = [student.userId, student.createdByUserId].filter(Boolean);
  const testOwner = linkedUsers.length
    ? await User.findOne({ _id: { $in: linkedUsers }, is_test_account: true }).select('_id')
    : null;
  const adminIsTest = Boolean(req.user?.is_test_account || /^pilot\.|^demo\./i.test(req.user?.email || ''));
  if (testOwner || adminIsTest) return student;
  throw { status: 403, message: 'Admin paper analysis access is limited to pilot/test students.' };
}

async function saveUpload(file) {
  const ext = path.extname(file.originalname || '') || '.bin';
  const filename = `paper_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  // Writes to R2 when configured (so the worker can read it), else local disk.
  const saved = await putUpload({
    namespace: 'mathpath-paper-analysis',
    filename,
    buffer: file.buffer,
    contentType: file.mimetype,
  });
  return { originalFilename: file.originalname || filename, ...saved };
}

function normalizeDetectedQuestions(rawQuestions = [], { domainId = 'fractions' } = {}) {
  const mapper = domainId === 'decimals' ? mapDecimalsPaperQuestion : mapPaperQuestionToSkills;
  return (Array.isArray(rawQuestions) ? rawQuestions : []).map((question, index) => {
    const mapped = mapper(question);
    return {
      questionNumber: String(question.questionNumber || index + 1),
      questionText: question.questionText || '',
      marks: Number.isFinite(Number(question.marks)) ? Number(question.marks) : null,
      pageNumber: Math.max(1, Number(question.pageNumber || 1)),
      detectedSkillIds: question.detectedSkillIds?.length ? question.detectedSkillIds : mapped.detectedSkillIds,
      skillMappingReasons: Array.isArray(question.skillMappingReasons) ? question.skillMappingReasons : (mapped.reasons || []),
      studentAnswer: question.studentAnswer || '',
      studentAnswerConfidence: Number.isFinite(Number(question.studentAnswerConfidence)) ? Number(question.studentAnswerConfidence) : 0,
      teacherMarkedCorrect: typeof question.teacherMarkedCorrect === 'boolean' ? question.teacherMarkedCorrect : null,
      teacherMark: question.teacherMark || '',
      teacherMarkConfidence: Number.isFinite(Number(question.teacherMarkConfidence)) ? Number(question.teacherMarkConfidence) : 0,
      detectedMarks: Number.isFinite(Number(question.detectedMarks)) ? Number(question.detectedMarks) : null,
      detectedMarksConfidence: Number.isFinite(Number(question.detectedMarksConfidence)) ? Number(question.detectedMarksConfidence) : 0,
      selectedOption: question.selectedOption || '',
      selectedOptionConfidence: Number.isFinite(Number(question.selectedOptionConfidence)) ? Number(question.selectedOptionConfidence) : 0,
      skillMappingConfidence: Number.isFinite(Number(question.skillMappingConfidence)) ? Number(question.skillMappingConfidence) : 0,
      skillMappingSource: question.skillMappingSource || '',
      adultConfirmedCorrect: Boolean(question.adultConfirmedCorrect),
      adultConfirmedWrong: Boolean(question.adultConfirmedWrong),
      adultIgnored: Boolean(question.adultIgnored),
      adultNotes: question.adultNotes || '',
      workingEvidenceUrl: question.workingEvidenceUrl || '',
      misconceptionTags: Array.isArray(question.misconceptionTags) ? question.misconceptionTags : [],
      misconceptionEvidence: Array.isArray(question.misconceptionEvidence) ? question.misconceptionEvidence : [],
      confidence: Number.isFinite(Number(question.confidence)) ? Number(question.confidence) : mapped.confidence,
      needsAdultReview: question.needsAdultReview !== undefined ? Boolean(question.needsAdultReview) : mapped.needsAdultReview,
      dataQualityWarnings: Array.isArray(question.dataQualityWarnings) ? question.dataQualityWarnings : [],
    };
  });
}

router.post('/upload', protect, upload.single('paper'), asyncHandler(async (req, res) => {
  try {
    assertAdultUploader(req);
    const student = await resolvePaperAnalysisStudent(req, req.body?.studentId);
    if (!req.file) return res.status(400).json({ error: 'Upload a PDF, JPG or PNG paper.' });

    const saved = await saveUpload(req.file);
    let rawQuestions = [];
    try {
      rawQuestions = req.body?.detectedQuestions ? JSON.parse(req.body.detectedQuestions) : [];
    } catch {
      return res.status(400).json({ error: 'Detected questions must be valid JSON.' });
    }
    const domainId = req.body?.domainId || 'fractions';
    const detectedQuestions = normalizeDetectedQuestions(rawQuestions, { domainId });
    const recommendations = buildPaperAnalysisRecommendations(detectedQuestions);
    const analysis = await PaperAnalysis.create({
      studentId: String(student._id),
      uploadedByUserId: String(req.user?.id || req.user?._id || ''),
      uploadedByRole: uploadedByRole(req.user),
      subjectId: req.body?.subjectId || 'math',
      domainId,
      uploadType: req.body?.uploadType || 'completed_unmarked',
      sourceType: req.body?.sourceType || 'adult_upload',
      pageCount: Math.max(1, Number(req.body?.pageCount || 1)),
      status: detectedQuestions.length ? 'needs_review' : 'uploaded',
      detectedQuestions,
      weakSkillIds: recommendations.weakSkillIds,
      recommendedActions: recommendations.recommendedActions,
      ...saved,
    });
    if (req.body?.runAnalysis === 'false' || detectedQuestions.length) {
      return res.status(201).json({ analysis });
    }
    // Prefer the background worker: enqueue and return 202 so the request does not
    // block on OCR/AI. The client polls GET /:id for the status transition.
    try {
      if (await enqueuePaperAnalysis(analysis, req.file)) {
        return res.status(202).json({ analysis, queued: true });
      }
    } catch {
      // Enqueue failed (e.g. Redis down) — fall back to running it inline below.
    }
    try {
      const analysed = await runPaperAnalysisPipeline({
        analysisId: analysis._id,
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        filename: req.file.originalname,
      });
      return res.status(201).json({ analysis: analysed });
    } catch (pipelineErr) {
      return res.status(201).json({
        analysis: await PaperAnalysis.findById(analysis._id).lean(),
        warning: pipelineErr.message || 'Paper uploaded, but automatic analysis needs manual review.',
      });
    }
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not upload paper analysis.' });
  }
}));

// Student self-upload: students can upload their own marked papers.
// No assertAdultUploader — resolveStudent(req) returns their own record.
router.post('/student-upload', protect, upload.single('paper'), asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    if (!req.file) return res.status(400).json({ error: 'Upload a PDF, JPG or PNG of your test paper.' });

    const saved = await saveUpload(req.file);
    const analysis = await PaperAnalysis.create({
      studentId: String(student._id),
      uploadedByUserId: String(req.user?.id || req.user?._id || ''),
      uploadedByRole: 'student',
      sourceType: 'student_upload',
      subjectId: req.body?.subjectId || 'math',
      domainId: req.body?.domainId || 'fractions',
      uploadType: req.body?.uploadType || 'marked_script',
      pageCount: Math.max(1, Number(req.body?.pageCount || 1)),
      status: 'uploaded',
      detectedQuestions: [],
      ...saved,
    });
    // Prefer the background worker; fall back to running the pipeline inline.
    try {
      if (await enqueuePaperAnalysis(analysis, req.file)) {
        return res.status(202).json({ analysis, queued: true });
      }
    } catch {
      // Enqueue failed — fall back to running it inline below.
    }
    try {
      const analysed = await runPaperAnalysisPipeline({
        analysisId: analysis._id,
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        filename: req.file.originalname,
      });
      return res.status(201).json({ analysis: analysed });
    } catch (pipelineErr) {
      return res.status(201).json({
        analysis: await PaperAnalysis.findById(analysis._id).lean(),
        warning: 'Paper uploaded! Your teacher or parent will review it shortly.',
      });
    }
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not upload paper.' });
  }
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const analysis = await PaperAnalysis.findById(req.params.id).lean();
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    await resolvePaperAnalysisStudent(req, analysis.studentId);
    return res.json({ analysis });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load paper analysis.' });
  }
}));

// POST /:id/confirm-ocr
// Parent/tutor submits corrections for uncertain OCR fields. Applies them to
// detectedQuestions, sets status to questions_confirmed, then resumes the pipeline
// (via queue or inline) to run skill mapping on the corrected data.
router.post('/:id/confirm-ocr', protect, asyncHandler(async (req, res) => {
  try {
    assertAdultUploader(req);
    const analysis = await PaperAnalysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    if (analysis.status !== 'needs_ocr_confirmation') {
      return res.status(409).json({ error: `Analysis is not awaiting OCR confirmation (status: ${analysis.status}).` });
    }
    await resolvePaperAnalysisStudent(req, analysis.studentId);

    // Apply corrections — only provided fields are overwritten.
    const corrections = Array.isArray(req.body?.corrections) ? req.body.corrections : [];
    if (corrections.length) {
      analysis.detectedQuestions = analysis.detectedQuestions.map((q) => {
        const c = corrections.find((x) => x.questionNumber === q.questionNumber);
        if (!c) return q;
        const updated = q.toObject ? q.toObject() : { ...q };
        if (c.questionText !== undefined) updated.questionText = String(c.questionText);
        if (c.studentAnswer !== undefined) updated.studentAnswer = String(c.studentAnswer);
        if (c.teacherMarkedCorrect !== undefined) updated.teacherMarkedCorrect = Boolean(c.teacherMarkedCorrect);
        if (c.teacherMark !== undefined) updated.teacherMark = String(c.teacherMark);
        updated.humanCorrected = true;
        updated.needsAdultReview = true; // still needs the normal adult review after skill mapping
        return updated;
      });
    }

    analysis.status = 'questions_confirmed';
    analysis.pipelineLog.push({
      stage: 'questions_confirmed',
      message: 'OCR corrections applied by adult.',
      metadata: { correctionCount: corrections.length },
      at: new Date(),
    });
    await analysis.save();

    // Resume skill mapping via queue (async) or inline (sync fallback).
    if (isQueueEnabled()) {
      const queue = getQueue(QUEUE_NAMES.paperAnalysis);
      if (queue) {
        await queue.add('resume', {
          analysisId: String(analysis._id),
          resumeFrom: 'questions_confirmed',
        });
        return res.status(202).json({ queued: true, analysis: { _id: analysis._id, status: analysis.status } });
      }
    }
    const result = await resumeFromOcrConfirmation(String(analysis._id));
    return res.json({ queued: false, analysis: result });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not apply OCR corrections.' });
  }
}));

router.patch('/:id/review', protect, asyncHandler(async (req, res) => {
  try {
    assertAdultUploader(req);
    const analysis = await PaperAnalysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    await resolvePaperAnalysisStudent(req, analysis.studentId);

    const detectedQuestions = applyAdultReviewOverrides(normalizeDetectedQuestions(req.body?.detectedQuestions || analysis.detectedQuestions, { domainId: analysis.domainId || 'fractions' }));
    const analysisObject = typeof analysis.toObject === 'function' ? analysis.toObject() : analysis;
    const recommendations = buildReviewRecommendations({ ...analysisObject, detectedQuestions });
    analysis.detectedQuestions = detectedQuestions;
    analysis.weakSkillIds = recommendations.report.weakSkills || [];
    analysis.recommendedActions = recommendations.recommendedActions;
    analysis.reportSummary = recommendations.report;
    analysis.dataQualityWarnings = [
      ...new Set([
        ...detectedQuestions.flatMap((question) => question.dataQualityWarnings || []),
        ...((recommendations.report.weakSkills || []).length ? [] : ['No confirmed weak skills yet. Confirm wrong questions before assigning interventions.']),
      ]),
    ];
    analysis.status = 'reviewed';
    analysis.reviewedAt = new Date();
    analysis.analysisNotes = req.body?.analysisNotes || analysis.analysisNotes || '';
    await analysis.save();
    return res.json({ analysis });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not review paper analysis.' });
  }
}));

router.post('/:id/assign-practice', protect, asyncHandler(async (req, res) => {
  try {
    assertAdultUploader(req);
    const analysis = await PaperAnalysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    await resolvePaperAnalysisStudent(req, analysis.studentId);
    const weakSkillIds = (analysis.weakSkillIds || []).filter(Boolean);
    const confirmedWrong = (analysis.detectedQuestions || []).some((q) => q.adultConfirmedWrong || q.teacherMarkedCorrect === false);
    if (!weakSkillIds.length && !confirmedWrong) {
      return res.status(409).json({
        analysisId: String(analysis._id),
        assigned: false,
        message: 'Confirm at least one wrong question before assigning targeted practice.',
        recommendedActions: analysis.recommendedActions || [],
      });
    }
    const assignment = await createAssignmentFromPaperAnalysis({
      paperAnalysisId: analysis._id,
      assignedByUserId: String(req.user?.id || req.user?._id || ''),
      assignedByRole: uploadedByRole(req.user),
    });
    return res.status(201).json({
      analysisId: String(analysis._id),
      assigned: true,
      assignmentId: assignment.id,
      assignment,
      message: 'Recovery Pack assigned.',
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not assign paper-analysis practice.' });
  }
}));

router.post('/:id/create-recheck', protect, asyncHandler(async (req, res) => {
  try {
    assertAdultUploader(req);
    const analysis = await PaperAnalysis.findById(req.params.id).lean();
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    await resolvePaperAnalysisStudent(req, analysis.studentId);
    const assignments = await getStudentAssignments({ studentId: analysis.studentId });
    const linked = assignments.find((assignment) => (
      assignment.sourceType === 'paper_analysis'
      && String(assignment.sourceId) === String(analysis._id)
    ));
    if (!linked) {
      return res.status(409).json({
        analysisId: String(analysis._id),
        created: false,
        message: 'Assign and complete the Recovery Pack before creating a recheck.',
        weakSkillIds: analysis.weakSkillIds || [],
      });
    }
    try {
      const result = await createRecheckForAssignment({
        assignmentId: linked.id,
        requestedByUserId: String(req.user?.id || req.user?._id || ''),
      });
      return res.status(result.created ? 201 : 200).json({
        analysisId: String(analysis._id),
        ...result,
      });
    } catch (assignmentErr) {
      if (assignmentErr.status === 409) {
        return res.status(409).json({
          analysisId: String(analysis._id),
          assignmentId: linked.id,
          created: false,
          message: assignmentErr.message,
          weakSkillIds: analysis.weakSkillIds || [],
        });
      }
      throw assignmentErr;
    }
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not create paper-analysis recheck.' });
  }
}));

export default router;
