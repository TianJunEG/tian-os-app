import express from 'express';
import fs from 'fs/promises';
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
  applyAdultReviewOverrides,
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

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'mathpath-paper-analysis');

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
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname || '') || '.bin';
  const filename = `paper_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const diskPath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(diskPath, file.buffer);
  return {
    originalFilename: file.originalname || filename,
    storageKey: diskPath,
    fileUrl: `/uploads/mathpath-paper-analysis/${filename}`,
  };
}

function normalizeDetectedQuestions(rawQuestions = []) {
  return (Array.isArray(rawQuestions) ? rawQuestions : []).map((question, index) => {
    const mapped = mapPaperQuestionToSkills(question);
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

router.post('/upload', protect, upload.single('paper'), async (req, res) => {
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
    const detectedQuestions = normalizeDetectedQuestions(rawQuestions);
    const recommendations = buildPaperAnalysisRecommendations(detectedQuestions);
    const analysis = await PaperAnalysis.create({
      studentId: String(student._id),
      uploadedByUserId: String(req.user?.id || req.user?._id || ''),
      uploadedByRole: uploadedByRole(req.user),
      subjectId: req.body?.subjectId || 'math',
      domainId: req.body?.domainId || 'fractions',
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
});

router.get('/:id', protect, async (req, res) => {
  try {
    const analysis = await PaperAnalysis.findById(req.params.id).lean();
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    await resolvePaperAnalysisStudent(req, analysis.studentId);
    return res.json({ analysis });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load paper analysis.' });
  }
});

router.patch('/:id/review', protect, async (req, res) => {
  try {
    assertAdultUploader(req);
    const analysis = await PaperAnalysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    await resolvePaperAnalysisStudent(req, analysis.studentId);

    const detectedQuestions = applyAdultReviewOverrides(normalizeDetectedQuestions(req.body?.detectedQuestions || analysis.detectedQuestions));
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
});

router.post('/:id/assign-practice', protect, async (req, res) => {
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
});

router.post('/:id/create-recheck', protect, async (req, res) => {
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
});

export default router;
