import express from 'express';
import { protect } from '../middleware/auth.js';
import Mistake from '../models/Mistake.js';
import Skill from '../models/Skill.js';
import { resolveStudent } from '../utils/studentContext.js';

const router = express.Router();

const MISCONCEPTION_LABELS = {
  'frac/add-without-common': 'Added numerators and denominators directly',
  'frac/add-denominators': 'Added numerators and denominators directly',
};

function normalizeMistakePayload(raw = {}) {
  const questionId = String(raw.questionId || raw.questionCode || '').trim();
  const skillCode = String(raw.skillCode || raw.skillId || '').trim();
  return {
    questionId,
    sessionId: String(raw.sessionId || raw.practiceSessionId || '').trim(),
    skillCode,
    questionStem: String(raw.questionText || raw.questionStem || raw.prompt || '').trim(),
    studentAnswer: String(raw.studentAnswer ?? raw.answer ?? '').trim(),
    correctAnswer: String(raw.correctAnswer ?? '').trim(),
    confidence: String(raw.confidence || raw.confidenceLevel || raw.reflection || '').trim(),
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
router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const filter = { studentId: student._id };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    else if (!req.query.status) filter.status = { $ne: 'resolved' };
    if (req.query.skillId) filter.skillId = req.query.skillId;
    if (req.query.source) filter.source = req.query.source;
    // Default to MathPath mistakes; other modules (e.g. Spelling) pass ?module=.
    filter.module = req.query.module || 'MathPath';

    const mistakes = await Mistake.find(filter)
      .populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } })
      .sort({ occurredAt: -1 }).limit(100);

    const shaped = mistakes.map((m) => ({
      id: m._id, questionId: m.questionId, sessionId: m.sessionId || '',
      skillId: m.skillId?._id || null, skillCode: m.skillCode || '',
      skillName: m.skillId?.name || m.skillCode || 'Unknown skill',
      topicName: m.skillId?.topicId?.name || '', module: m.module,
      questionStem: m.questionStem, studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer,
      workedSolution: m.workedSolution, mistakeType: m.mistakeType, misconceptionTag: m.misconceptionTag, source: m.source || 'other',
      mistakeTypeLabel: MISCONCEPTION_LABELS[m.misconceptionTag] || '',
      confidence: m.confidence || '',
      status: m.status, reviewed: m.reviewed, reviewedAt: m.reviewedAt, occurredAt: m.occurredAt, timestamp: m.timestamp || m.occurredAt,
    }));

    // Group by skill for the home/weak-skills view.
    const bySkill = {};
    for (const m of shaped) {
      const key = String(m.skillId || m.skillCode || 'unknown');
      if (!bySkill[key]) bySkill[key] = { skillId: m.skillId, skillCode: m.skillCode, skillName: m.skillName, topicName: m.topicName, count: 0 };
      bySkill[key].count++;
    }

    console.info('[mistakes] loaded', {
      studentId: String(student._id),
      count: shaped.length,
      weakSkillCount: Object.keys(bySkill).length,
    });
    res.json({ studentId: student._id, mistakes: shaped, weakSkills: Object.values(bySkill).sort((a, b) => b.count - a.count) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistakes.' });
  }
});

// @route POST /api/mistakes/bulk
// @desc  Capture generated MathPath mistakes that do not have Mongo question ids.
// @access Private
router.post('/bulk', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
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
        skillId,
        skillCode: normalized.skillCode,
        module: raw.module || 'MathPath',
        questionStem: normalized.questionStem,
        workedSolution: normalized.workedSolution,
        studentAnswer: normalized.studentAnswer,
        correctAnswer: normalized.correctAnswer,
        confidence: normalized.confidence,
        timestamp: normalized.occurredAt,
        mistakeType: raw.mistakeType || 'unknown',
        misconceptionTag: normalized.misconceptionTag,
        status: 'open',
        source: raw.source || 'practice-incorrect',
        occurredAt: normalized.occurredAt,
      });
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
});

// @route GET /api/mistakes/:id
// @desc  One mistake (detail page).
// @access Private
router.get('/:id', protect, async (req, res) => {
  try {
    const m = await Mistake.findById(req.params.id).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId); // access check
    res.json({
      id: m._id, questionId: m.questionId, sessionId: m.sessionId || '',
      skillId: m.skillId?._id || null, skillCode: m.skillCode || '',
      skillName: m.skillId?.name || m.skillCode || 'Unknown skill', topicName: m.skillId?.topicId?.name || '',
      questionStem: m.questionStem, studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer,
      workedSolution: m.workedSolution, mistakeType: m.mistakeType, misconceptionTag: m.misconceptionTag, source: m.source || 'other',
      mistakeTypeLabel: MISCONCEPTION_LABELS[m.misconceptionTag] || '',
      confidence: m.confidence || '',
      status: m.status, reviewed: m.reviewed, reviewedAt: m.reviewedAt, occurredAt: m.occurredAt, timestamp: m.timestamp || m.occurredAt,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistake.' });
  }
});

// @route POST /api/mistakes/:id/review
// @desc  Mark a mistake reviewed. body: { source: student|parent|tutor|teacher, mistakeType? }
// @access Private
router.post('/:id/review', protect, async (req, res) => {
  try {
    const m = await Mistake.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId); // access check

    m.reviewed = true;
    m.reviewedAt = new Date();
    m.reviewedByUserId = req.user.id;
    m.reviewSource = req.body.source || 'student';
    if (m.status === 'open') m.status = 'reviewed';
    if (req.body.mistakeType) m.mistakeType = req.body.mistakeType;
    await m.save();
    res.json({ id: m._id, status: m.status, reviewed: true, reviewedAt: m.reviewedAt });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to mark reviewed.' });
  }
});

export default router;
