import express from 'express';
import { protect } from '../middleware/auth.js';
import Mistake from '../models/Mistake.js';
import Skill from '../models/Skill.js';
import { resolveStudent } from '../utils/studentContext.js';
import {
  findWorkingInsightForMistake,
  shapeWorkingLinkFields,
} from '../services/mathpath/workingLinkageService.js';
import {
  applyMistakeLearningAction,
  shapeMistakeLearningFields,
} from '../services/mathpath/mistakeCorrectionFlow.js';
import r2 from '../services/storage/r2.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const MISCONCEPTION_LABELS = {
  'frac/add-without-common': 'Added numerators and denominators directly',
  'frac/add-denominators': 'Added numerators and denominators directly',
};

export function isHighConfidence(confidence = '') {
  return ['high', 'i_know_this', 'very_confident', 'confident'].includes(String(confidence || '').toLowerCase());
}

export function buildWeakSkillAggregation(mistakes = []) {
  const bySkill = {};
  for (const m of mistakes) {
    const key = String(m.skillId || m.skillCode || 'unknown');
    if (!bySkill[key]) {
      bySkill[key] = {
        skillId: m.skillId,
        skillCode: m.skillCode,
        skillName: m.skillName,
        topicName: m.topicName,
        count: 0,
        latestMistakeDate: null,
        confidenceRiskCount: 0,
      };
    }
    bySkill[key].count++;
    if (isHighConfidence(m.confidence)) bySkill[key].confidenceRiskCount++;
    const occurred = m.timestamp || m.occurredAt;
    if (occurred && (!bySkill[key].latestMistakeDate || new Date(occurred) > new Date(bySkill[key].latestMistakeDate))) {
      bySkill[key].latestMistakeDate = occurred;
    }
  }
  return Object.values(bySkill).sort((a, b) => b.count - a.count);
}

function shapeWorkingFields(source = {}) {
  return shapeWorkingLinkFields(source);
}

async function loadWorkingInsightForMistake(mistake, studentId) {
  if (mistake.workingInsight || mistake.workingId) return shapeWorkingFields(mistake);
  const record = await findWorkingInsightForMistake(mistake, studentId);
  return record ? shapeWorkingFields(record) : shapeWorkingFields({});
}

function normalizeMistakePayload(raw = {}) {
  const questionId = String(raw.questionId || raw.questionCode || '').trim();
  const skillCode = String(raw.skillCode || raw.skillId || '').trim();
  return {
    questionId,
    sessionId: String(raw.sessionId || raw.practiceSessionId || '').trim(),
    skillCode,
    attemptId: String(raw.attemptId || '').trim(),
    questionStem: String(raw.questionText || raw.questionStem || raw.prompt || '').trim(),
    studentAnswer: String(raw.studentAnswer ?? raw.answer ?? '').trim(),
    correctAnswer: String(raw.correctAnswer ?? '').trim(),
    confidence: String(raw.confidence || raw.confidenceLevel || raw.reflection || '').trim(),
    ...shapeWorkingFields(raw),
    workedSolution: String(raw.workedSolution || '').trim(),
    misconceptionTag: String(raw.misconceptionTag || '').trim(),
    occurredAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
  };
}

async function resolveSkillForMistake(skillCode) {
  if (!skillCode) return null;
  if (/^[0-9a-fA-F]{24}$/.test(skillCode)) {
    const byId = await Skill.findById(skillCode).select('_id');
    if (byId?._id) return byId._id;
  }
  const byCode = await Skill.findOne({
    $or: [
      { 'metadata.mathPathSkillId': skillCode },
      { 'metadata.frameworkCode': skillCode },
      { slug: skillCode },
      { name: skillCode },
    ],
  }).select('_id');
  return byCode?._id || null;
}

// @route GET /api/mistakes?studentId=&status=&skillId=&source=
// @desc  Recent mistakes for a student (grouped by skill), for Mistake-to-Mastery.
// @access Private
router.get('/', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const filter = { studentId: student._id };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    else if (!req.query.status) filter.status = { $ne: 'resolved' };
    if (req.query.skillId) filter.skillId = req.query.skillId;
    if (req.query.source) filter.source = req.query.source;
    // Default to MathPath mistakes; other modules (e.g. Spelling) pass ?module=.
    filter.module = req.query.module || 'MathPath';
    // Exclude demo/test data created by seed scripts unless explicitly requested.
    if (req.query.includeSeeded !== 'true') filter.seeded = { $ne: true };
    // The Fractions intervention pilot review must show fraction mistakes only.
    // Fraction practice mistakes carry a framework skill code (F001–F026); fluency
    // drills (e.g. "7 + 4", "8 × 11") and other DB-served items do not. Scoping by
    // ?domain=fractions keeps times-table/fluency slips out of the fractions review
    // so they are not mistaken for fraction gaps. Opt-in, so other callers are
    // unaffected. Fluency slips are surfaced separately by the fluency module.
    if (String(req.query.domain || '').toLowerCase() === 'fractions') {
      filter.skillCode = { $regex: /^F\d{3}$/i };
    }

    const mistakes = await Mistake.find(filter)
      .populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } })
      .sort({ occurredAt: -1 }).limit(100);

    const shaped = await Promise.all(mistakes.map(async (m) => ({
      id: m._id, questionId: m.questionId, sessionId: m.sessionId || '', attemptId: m.attemptId || '',
      skillId: m.skillId?._id || null, skillCode: m.skillCode || '',
      skillName: m.skillId?.name || m.skillCode || 'Unknown skill',
      topicName: m.skillId?.topicId?.name || '', module: m.module,
      questionText: m.questionText || m.questionStem,
      questionStem: m.questionStem || m.questionText,
      studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer,
      answerCorrect: Boolean(m.answerCorrect),
      workedSolution: m.workedSolution, mistakeType: m.mistakeType, misconceptionTag: m.misconceptionTag, source: m.source || 'other',
      mistakeTypeLabel: MISCONCEPTION_LABELS[m.misconceptionTag] || '',
      confidence: m.confidence || '',
      workingSubmitted: Boolean(m.workingSubmitted),
      workingOnPaper: Boolean(m.workingOnPaper),
      workingNotNeeded: Boolean(m.workingNotNeeded),
      workingSessionId: m.workingSessionId || '',
      workingImage: m.workingImage || '',
      workingStrokes: Array.isArray(m.workingStrokes) ? m.workingStrokes : [],
      timeTaken: m.timeTaken,
      ...(await loadWorkingInsightForMistake(m, student._id)),
      ...shapeMistakeLearningFields(m),
      status: m.status, reviewed: m.reviewed, reviewedAt: m.reviewedAt, occurredAt: m.occurredAt, timestamp: m.timestamp || m.occurredAt,
      // Tutor explanation for list view: include strokes for inline replay but
      // omit the heavy base64 image (only needed as fallback in the detail view).
      tutorExplanation: m.tutorExplanation?.recordedAt ? {
        strokes: m.tutorExplanation.strokes || [],
        recordedAt: m.tutorExplanation.recordedAt,
        durationMs: m.tutorExplanation.durationMs || null,
        hasAudio: Boolean(m.tutorExplanation.audioStorageKey),
        feedback: m.tutorExplanation.feedback || null,
      } : null,
    })));

    // Group by skill for the home/weak-skills view.
    const weakSkills = buildWeakSkillAggregation(shaped);

    console.info('[mistakes] loaded', {
      studentId: String(student._id),
      count: shaped.length,
      weakSkillCount: weakSkills.length,
    });
    res.json({ studentId: student._id, mistakes: shaped, weakSkills });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistakes.' });
  }
}));

// @route POST /api/mistakes/bulk
// @desc  Capture generated MathPath mistakes that do not have Mongo question ids.
// @access Private
router.post('/bulk', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req, undefined, { write: true });
    const rows = Array.isArray(req.body?.mistakes) ? req.body.mistakes : [];
    const docs = [];

    for (const raw of rows) {
      const normalized = normalizeMistakePayload(raw);
      if (!normalized.questionId || !normalized.questionStem) continue;
      const skillId = await resolveSkillForMistake(normalized.skillCode);
      docs.push({
        studentId: student._id,
        workspaceId: student.workspaceId,
        questionId: normalized.questionId,
        sessionId: normalized.sessionId,
        attemptId: normalized.attemptId,
        skillId,
        skillCode: normalized.skillCode,
        module: raw.module || 'MathPath',
        questionStem: normalized.questionStem,
        workedSolution: normalized.workedSolution,
        studentAnswer: normalized.studentAnswer,
        correctAnswer: normalized.correctAnswer,
        confidence: normalized.confidence,
        workingId: normalized.workingId,
        workingPreviewImage: normalized.workingPreviewImage,
        extractedWorkingText: normalized.extractedWorkingText,
        workingInsight: normalized.workingInsight,
        workingAnalysisResult: normalized.workingAnalysisResult,
        workingQualityScore: normalized.workingQualityScore,
        workingQualityBand: normalized.workingQualityBand,
        timestamp: normalized.occurredAt,
        mistakeType: raw.mistakeType || 'unknown',
        misconceptionTag: normalized.misconceptionTag,
        status: 'open',
        source: raw.source || 'practice-incorrect',
        occurredAt: normalized.occurredAt,
      });
    }

    // Link each new mistake to the most recent unresolved mistake for the same skill.
    if (docs.length) {
      const skillIds = [...new Set(docs.map((d) => d.skillId).filter(Boolean))];
      const existing = skillIds.length
        ? await Mistake.find(
            { studentId: student._id, skillId: { $in: skillIds }, status: { $ne: 'resolved' } },
            { _id: 1, skillId: 1 },
            { sort: { createdAt: -1 } },
          )
        : [];
      const originBySkill = new Map();
      for (const m of existing) {
        const key = String(m.skillId);
        if (!originBySkill.has(key)) originBySkill.set(key, m._id);
      }
      for (const doc of docs) {
        doc.originMistakeId = (doc.skillId && originBySkill.get(String(doc.skillId))) || null;
      }
    }

    const created = docs.length ? await Mistake.insertMany(docs, { ordered: false }) : [];
    console.info('[mistakes] created', {
      studentId: String(student._id),
      count: created.length,
      sessionIds: [...new Set(created.map((m) => m.sessionId).filter(Boolean))],
    });
    res.status(201).json({ created: created.length, mistakes: created.map((m) => ({ id: m._id, questionId: m.questionId })) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to save mistakes.' });
  }
}));

// @route GET /api/mistakes/:id
// @desc  One mistake (detail page).
// @access Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const m = await Mistake.findById(req.params.id).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId); // access check
    console.info('[mistakes] detail_viewed', {
      mistakeId: String(m._id), studentId: String(m.studentId),
      learningStatus: m.learningStatus || 'new', role: req.user.role,
    });
    res.json({
      id: m._id, questionId: m.questionId, sessionId: m.sessionId || '', attemptId: m.attemptId || '',
      skillId: m.skillId?._id || null, skillCode: m.skillCode || '',
      skillName: m.skillId?.name || m.skillCode || 'Unknown skill', topicName: m.skillId?.topicId?.name || '',
      questionText: m.questionText || m.questionStem,
      questionStem: m.questionStem || m.questionText,
      studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer,
      answerCorrect: Boolean(m.answerCorrect),
      workedSolution: m.workedSolution, mistakeType: m.mistakeType, misconceptionTag: m.misconceptionTag, source: m.source || 'other',
      mistakeTypeLabel: MISCONCEPTION_LABELS[m.misconceptionTag] || '',
      confidence: m.confidence || '',
      workingSubmitted: Boolean(m.workingSubmitted),
      workingOnPaper: Boolean(m.workingOnPaper),
      workingNotNeeded: Boolean(m.workingNotNeeded),
      workingSessionId: m.workingSessionId || '',
      workingImage: m.workingImage || '',
      workingStrokes: Array.isArray(m.workingStrokes) ? m.workingStrokes : [],
      timeTaken: m.timeTaken,
      ...(await loadWorkingInsightForMistake(m, m.studentId)),
      ...shapeMistakeLearningFields(m),
      status: m.status, reviewed: m.reviewed, reviewedAt: m.reviewedAt, occurredAt: m.occurredAt, timestamp: m.timestamp || m.occurredAt,
      tutorExplanation: m.tutorExplanation?.recordedAt ? {
        strokes: m.tutorExplanation.strokes || [],
        image: m.tutorExplanation.image || '',
        recordedAt: m.tutorExplanation.recordedAt,
        durationMs: m.tutorExplanation.durationMs || null,
        hasAudio: Boolean(m.tutorExplanation.audioStorageKey),
        feedback: m.tutorExplanation.feedback || null,
      } : null,
      explanationAudioUrl: await (async () => {
        const key = m.tutorExplanation?.audioStorageKey;
        if (!key) return null;
        try { return await r2.getSignedDownloadUrl(key, 300); } catch { return null; }
      })(),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistake.' });
  }
}));

// @route PATCH /api/mistakes/:id/explanation-feedback
// @desc  Parent submits thumbs-up / thumbs-down on a tutor explanation.
// @access Private (parent)
router.patch('/:id/explanation-feedback', protect, asyncHandler(async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!['helpful', 'not_helpful'].includes(feedback)) {
      return res.status(400).json({ error: 'feedback must be "helpful" or "not_helpful".' });
    }
    const m = await Mistake.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId); // access check
    if (!m.tutorExplanation?.recordedAt) {
      return res.status(400).json({ error: 'No tutor explanation to rate.' });
    }
    m.tutorExplanation.feedback = feedback;
    m.tutorExplanation.feedbackAt = new Date();
    m.tutorExplanation.feedbackByUserId = req.user.id;
    await m.save();
    console.info('[mistakes] explanation feedback', { mistakeId: String(m._id), feedback });
    res.json({ id: m._id, feedback });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to save feedback.' });
  }
}));

// @route POST /api/mistakes/:id/review
// @desc  Deprecated for students — adult roles can still acknowledge directly.
// @access Private
router.post('/:id/review', protect, asyncHandler(async (req, res) => {
  try {
    const m = await Mistake.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId, { write: true }); // access check

    const isAdult = ['parent', 'tutor', 'teacher', 'admin'].includes(req.user.role);
    if (!isAdult) {
      return res.status(400).json({
        error: 'Use PATCH /api/mistakes/:id/learning to progress through the correction flow.',
        code: 'USE_LEARNING_ENDPOINT',
      });
    }

    applyMistakeLearningAction(m, {
      action: 'acknowledge',
      userId: req.user.id,
      source: req.body.source || req.user.role,
    });
    if (req.body.mistakeType) m.mistakeType = req.body.mistakeType;
    await m.save();
    console.info('[mistakes] learning_action', {
      mistakeId: String(m._id), studentId: String(m.studentId),
      action: 'acknowledge', learningStatus: m.learningStatus,
      source: req.body.source || req.user.role, role: req.user.role,
    });
    res.json({
      id: m._id,
      status: m.status,
      reviewed: true,
      reviewedAt: m.reviewedAt,
      ...shapeMistakeLearningFields(m),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to mark reviewed.' });
  }
}));

// @route PATCH /api/mistakes/:id/learning
// @desc  Progress mistake learning evidence: acknowledge -> correct -> understand -> master.
// @access Private
router.patch('/:id/learning', protect, asyncHandler(async (req, res) => {
  try {
    const m = await Mistake.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId, { write: true });

    const result = applyMistakeLearningAction(m, {
      action: req.body?.action,
      reflection: req.body?.reflection,
      correctionAttempt: req.body?.correctionAttempt,
      understandingAnswer: req.body?.understandingAnswer,
      masteryEvidence: req.body?.masteryEvidence,
      userId: req.user.id,
      source: req.body?.source || 'student',
    });
    if (req.body?.mistakeType) m.mistakeType = req.body.mistakeType;
    await m.save();
    console.info('[mistakes] learning_action', {
      mistakeId: String(m._id), studentId: String(m.studentId),
      action: req.body?.action, learningStatus: m.learningStatus,
      correctionCorrect: result.correctionCorrect,
      understandingPassed: result.understandingPassed,
      mastered: result.mastered,
      source: req.body?.source || 'student', role: req.user.role,
    });
    res.json({
      id: m._id,
      status: m.status,
      reviewed: m.reviewed,
      reviewedAt: m.reviewedAt,
      ...shapeMistakeLearningFields(m),
      correctionCorrect: result.correctionCorrect,
      understandingPassed: result.understandingPassed,
      mastered: result.mastered,
      message: result.message,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to update mistake learning evidence.',
      code: err.code,
    });
  }
}));

export default router;
