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
  return user?.role || 'user';
}

function assertAdultUploader(req) {
  const roles = roleSet(req.user);
  if (roles.has('admin') || roles.has('teacher') || roles.has('tutor') || roles.has('parent')) return;
  const err = new Error('Paper analysis uploads are currently available to parents, tutors, teachers and admins.');
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
      detectedSkillIds: question.detectedSkillIds?.length ? question.detectedSkillIds : mapped.detectedSkillIds,
      studentAnswer: question.studentAnswer || '',
      teacherMarkedCorrect: typeof question.teacherMarkedCorrect === 'boolean' ? question.teacherMarkedCorrect : null,
      adultConfirmedCorrect: Boolean(question.adultConfirmedCorrect),
      adultConfirmedWrong: Boolean(question.adultConfirmedWrong),
      workingEvidenceUrl: question.workingEvidenceUrl || '',
      misconceptionTags: Array.isArray(question.misconceptionTags) ? question.misconceptionTags : [],
      confidence: Number.isFinite(Number(question.confidence)) ? Number(question.confidence) : mapped.confidence,
    };
  });
}

router.post('/upload', protect, upload.single('paper'), async (req, res) => {
  try {
    assertAdultUploader(req);
    const student = await resolvePaperAnalysisStudent(req, req.body?.studentId);
    if (!req.file) return res.status(400).json({ error: 'Upload a PDF, JPG or PNG paper.' });

    const saved = await saveUpload(req.file);
    const detectedQuestions = normalizeDetectedQuestions(
      req.body?.detectedQuestions ? JSON.parse(req.body.detectedQuestions) : []
    );
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
    return res.status(201).json({ analysis });
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

    const detectedQuestions = normalizeDetectedQuestions(req.body?.detectedQuestions || analysis.detectedQuestions);
    const recommendations = buildPaperAnalysisRecommendations(detectedQuestions);
    analysis.detectedQuestions = detectedQuestions;
    analysis.weakSkillIds = recommendations.weakSkillIds;
    analysis.recommendedActions = recommendations.recommendedActions;
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
    analysis.status = 'reviewed';
    analysis.recommendedActions = (analysis.recommendedActions || []).map((action) => ({
      ...action,
      status: 'assignment_service_pending',
    }));
    await analysis.save();
    return res.status(202).json({
      analysisId: String(analysis._id),
      assigned: false,
      message: 'Practice assignment from paper analysis is not automated yet. Review the recommended skills and assign manually.',
      recommendedActions: analysis.recommendedActions,
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
    return res.status(202).json({
      analysisId: String(analysis._id),
      created: false,
      message: 'Mini diagnostic creation from paper analysis is not automated yet. Use Run Recheck from the diagnostic card.',
      weakSkillIds: analysis.weakSkillIds || [],
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not create paper-analysis recheck.' });
  }
});

export default router;
