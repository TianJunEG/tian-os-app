import express from 'express';
import { protect } from '../middleware/auth.js';
import PracticeSession from '../models/PracticeSession.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Question from '../models/Question.js';
import Skill from '../models/Skill.js';
import Mistake from '../models/Mistake.js';
import Assignment from '../models/Assignment.js';
import Worksheet from '../models/Worksheet.js';
import { resolveStudent } from '../utils/studentContext.js';
import { recordAttempt } from '../utils/masteryEngine.js';
import { isCorrectWithContext, checkKeyPoints } from '../utils/answerCheck.js';
import { markOpenEnded } from '../utils/aiMarking.js';
import { selectSimilarQuestions } from '../utils/worksheetGen.js';
import { normalizeConfidence, recordLearningEvents } from '../services/telemetry/learningTelemetryService.js';

const router = express.Router();
const FRAMEWORK_SKILL_ID_PATTERN = /^F\d{3}$/i;

function answerInputTypeFor(answer = '') {
  const raw = String(answer || '').trim();
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(raw)) return 'mixed';
  if (/^-?\d+\s*\/\s*-?\d+$/.test(raw)) return 'fraction';
  return '';
}

async function resolveSkillRefToIds(refs = []) {
  const out = [];
  for (const refRaw of refs || []) {
    if (!refRaw) continue;
    const ref = String(refRaw).trim();
    if (!ref) continue;
    if (FRAMEWORK_SKILL_ID_PATTERN.test(ref)) {
      const code = ref.toUpperCase();
      const matched = await Skill.findOne({
        $or: [
          { 'metadata.mathPathSkillId': code },
          { 'metadata.frameworkCode': code },
        ],
      }).select('_id');
      if (matched?._id) out.push(String(matched._id));
      continue;
    }
    out.push(ref);
  }
  return [...new Set(out)];
}

// Shape a question for the client (never leak the answer mid-session).
const clientQuestion = (q) => ({
  questionId: q._id, stem: q.stem, type: q.type, choices: q.choices,
  difficulty: q.difficulty, skillId: q.skillId?._id || q.skillId,
  skillName: q.skillId?.name, topicId: q.skillId?.topicId,
  visual: q.visual || null,
  answerInputType: answerInputTypeFor(q.answer),
  hasFigure: !!q.hasFigure,
  figureUrl: q.figureUrl || '',
  figureAlt: q.figureAlt || '',
});

// @route POST /api/practice/sessions
// @desc  Start a practice session. body: { studentId?, mode, feature?, skillIds[]?,
//        skillId?, questionCount?, assignmentId?, excludeQuestionId? }
// @access Private
router.post('/sessions', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const {
      mode = 'independent', feature = null, skillId, skillIds = [], topicId = null,
      questionCount = 10, assignmentId = null, excludeQuestionId = null,
      questionIds = null,
    } = req.body;

    let sessionFeature = feature;
    let questions = [];
    let targetSkillIds = skillIds.length ? skillIds : (skillId ? [skillId] : []);
    targetSkillIds = await resolveSkillRefToIds(targetSkillIds);

    // Topic-level session (e.g. Science): pull across all of a topic's skills for variety.
    if (topicId && !targetSkillIds.length) {
      const topicSkills = await Skill.find({ topicId }).select('_id');
      targetSkillIds = await resolveSkillRefToIds(topicSkills.map((s) => String(s._id)));
    }

    // Digital answering of an assigned Mastery Worksheet: run the worksheet's
    // EXACT generated questions through the shared session (not a re-selection).
    // Also nudge sessionFeature so the module-derivation below picks the right
    // module for the assignment — without this, a Science assignment opened
    // without an explicit feature would default to MathPath.
    let explicitIds = questionIds;
    if (assignmentId) {
      const a = await Assignment.findById(assignmentId);
      if (a) {
        targetSkillIds = await resolveSkillRefToIds(a.skillIds.map(String));
        if (a.module === 'Mastery Worksheet') {
          const ws = await Worksheet.findOne({ linkedAssignmentId: a._id });
          // Science worksheets carry subject='Science' on the Worksheet (and
          // on the Assignment). Route the session through the Science feature
          // so the sessionModule regex below buckets mistakes/mastery under
          // Science Adaptive Revision instead of MathPath.
          const isScience = ws?.subject === 'Science' || a.subject === 'Science';
          sessionFeature = sessionFeature || (isScience ? 'Science Adaptive Revision' : 'Mastery Worksheet');
          const wsQ = ws?.generatedContent?.questions || [];
          if (wsQ.length) explicitIds = wsQ.map((q) => q.questionId).filter(Boolean);
        } else if (a.module === 'Science Adaptive Revision') {
          sessionFeature = sessionFeature || 'Science Adaptive Revision';
        }
      }
    }

    if (explicitIds?.length) {
      // Preserve worksheet order.
      const docs = await Question.find({ _id: { $in: explicitIds } }).populate('skillId');
      const byId = new Map(docs.map((d) => [String(d._id), d]));
      questions = explicitIds.map((id) => byId.get(String(id))).filter(Boolean);
      targetSkillIds = [...new Set(questions.map((q) => String(q.skillId?._id || q.skillId)))];
    } else {
      targetSkillIds = await resolveSkillRefToIds(targetSkillIds);
      if (!targetSkillIds.length) return res.status(400).json({ error: 'No skill selected.' });
      questions = await selectSimilarQuestions({
        studentId: student._id, skillIds: targetSkillIds, difficulty: 'medium',
        count: questionCount, excludeQuestionIds: excludeQuestionId ? [excludeQuestionId] : [],
      });
    }
    if (!questions.length) return res.status(400).json({ error: 'No questions available for this skill yet.' });

    // Science is its own top-level module; all MathPath features stay 'MathPath'
    // so their mistakes share the MathPath review bucket.
    const sessionModule = /science/i.test(sessionFeature || '') ? 'Science Adaptive Revision' : 'MathPath';
    const session = await PracticeSession.create({
      studentId: student._id, workspaceId: student.workspaceId,
      module: sessionModule, feature: sessionFeature, mode, skillIds: targetSkillIds, assignmentId,
      status: 'active',
    });
    if (assignmentId) await Assignment.findByIdAndUpdate(assignmentId, { status: 'in_progress', sessionId: session._id });

    const domain = /science/i.test(sessionModule) ? 'science' : 'mathpath';
    await recordLearningEvents([
      {
        studentId: String(student._id),
        eventType: 'session_started',
        domain,
        sessionId: String(session._id),
        metadata: { mode, feature: sessionFeature, module: sessionModule },
      },
      {
        studentId: String(student._id),
        eventType: mode === 'fluency' ? 'fluency_started' : 'practice_started',
        domain,
        sessionId: String(session._id),
        metadata: { mode, feature: sessionFeature, module: sessionModule, questionCount: questions.length },
      },
      ...questions.map((q) => ({
        studentId: String(student._id),
        eventType: 'question_viewed',
        domain,
        skillCode: String(q.skillId?._id || q.skillId || ''),
        questionId: String(q._id),
        sessionId: String(session._id),
        metadata: { mode, feature: sessionFeature, difficulty: q.difficulty, questionType: q.type },
      })),
    ]);

    res.json({ session_id: session._id, mode, feature: sessionFeature, items: questions.map(clientQuestion) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start session.' });
  }
});

// @route POST /api/practice/sessions/:id/attempts
// @desc  Log one attempt. body: { questionId, answer, timeMs?, hintsUsed? }
//        Saves PracticeAttempt, updates mastery, saves a Mistake if wrong.
// @access Private
router.post('/sessions/:id/attempts', protect, async (req, res) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const student = await resolveStudent(req, session.studentId);

    const { questionId, answer, timeMs = null, hintsUsed = 0 } = req.body;
    const q = await Question.findById(questionId);
    if (!q) return res.status(404).json({ error: 'Question not found.' });

    // Open-ended (Science): try AI marking first — it handles paraphrases,
    // synonyms, and spelling slips far better than keyword matching, and
    // returns warm per-answer feedback. Falls back to the keyword path when
    // no AI provider is configured or the call fails, so the route stays
    // resilient with or without an API key.
    let correct, partial = false, missing = [], openEnded = q.type === 'open_ended', aiFeedback = '';
    if (openEnded) {
      let r = null;
      try {
        r = await markOpenEnded({
          question: q.stem, modelAnswer: q.modelAnswer || q.answer || '',
          keyPoints: q.keyPoints || [], studentAnswer: answer,
        });
      } catch (e) {
        // Provider configured but the call failed — log and fall back so the
        // student isn't blocked from submitting.
        console.warn('[ai-marking] provider error, falling back to keyword match:', e.message);
      }
      if (!r) r = checkKeyPoints(answer, q.keyPoints);
      correct = r.correct; partial = r.partial; missing = r.missing;
      aiFeedback = r.aiFeedback || '';
    } else {
      correct = isCorrectWithContext(answer, q.answer, q.stem);
    }

    await PracticeAttempt.create({
      sessionId: session._id, studentId: student._id, questionId: q._id, skillId: q.skillId,
      answer: String(answer ?? ''), correct, timeMs, hintsUsed,
    });

    // Mastery counts a fully-correct attempt; partial does not (but is not a "wrong" mistake-only signal).
    const sessModule = session.module || 'MathPath';
    const subject = /science/i.test(sessModule) ? 'Science' : 'Math';
    const mastery = await recordAttempt({ studentId: student._id, skillId: q.skillId, workspaceId: student.workspaceId, correct, timeMs, module: sessModule, subject });
    const confidence = normalizeConfidence(req.body?.confidence || req.body?.confidenceLevel || req.body?.reflection || '');
    const domain = /science/i.test(sessModule) ? 'science' : 'mathpath';

    const telemetryEvents = [
      {
        studentId: String(student._id),
        eventType: req.body?.skipped ? 'question_skipped' : 'question_answered',
        domain,
        skillCode: String(q.skillId || ''),
        questionId: String(q._id),
        sessionId: String(session._id),
        metadata: {
          answerCorrect: Boolean(correct),
          confidence,
          timeTakenSeconds: Number.isFinite(Number(timeMs)) ? Math.round(Number(timeMs) / 1000) : null,
          workingSubmitted: Boolean(req.body?.workingSubmitted || req.body?.workingUploaded || req.body?.fullscreenWorkingSubmitted),
          workingNotNeeded: Boolean(req.body?.workingNotNeeded),
          helpRequested: Boolean(req.body?.helpRequested),
          skipped: Boolean(req.body?.skipped),
          hintsUsed,
        },
      },
    ];
    if (confidence) {
      telemetryEvents.push({
        studentId: String(student._id),
        eventType: 'confidence_selected',
        domain,
        skillCode: String(q.skillId || ''),
        questionId: String(q._id),
        sessionId: String(session._id),
        metadata: { confidence },
      });
    }
    if (mastery.masteredNow) {
      telemetryEvents.push({
        studentId: String(student._id),
        eventType: 'skill_mastered',
        domain,
        skillCode: String(q.skillId || ''),
        sessionId: String(session._id),
        metadata: { masteryScore: mastery.after?.score, module: sessModule },
      });
    }
    await recordLearningEvents(telemetryEvents);

    // Save a mistake when incorrect, or partially correct on an open-ended item.
    if (!correct) {
      const mistakeType = q.misconceptionTag === 'frac/add-without-common' || q.misconceptionTag === 'frac/add-denominators'
        ? 'method_error'
        : 'unknown';
      await Mistake.create({
        studentId: student._id, workspaceId: student.workspaceId, questionId: q._id, skillId: q.skillId,
        module: session.module || 'MathPath',
        questionStem: q.stem, workedSolution: q.modelAnswer || q.workedSolution,
        studentAnswer: String(answer ?? ''), correctAnswer: q.modelAnswer || q.answer,
        mistakeType, misconceptionTag: q.misconceptionTag || '', status: 'open',
        source: 'practice-incorrect',
      });
    }

    res.json({
      correct, partial,
      correctAnswer: openEnded ? '' : q.answer,
      workedSolution: q.workedSolution,
      // Open-ended feedback:
      modelAnswer: openEnded ? q.modelAnswer : '',
      keyPoints: openEnded ? q.keyPoints : [],
      missingKeyPoints: openEnded ? missing : [],
      aiFeedback: openEnded ? aiFeedback : '',
      explanation: q.explanation || '',
      mastery: { skillId: q.skillId, ...mastery.after, masteredNow: mastery.masteredNow },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to log attempt.' });
  }
});

// @route POST /api/practice/sessions/:id/complete
// @desc  Finalize: compute summary, mark a linked assignment complete.
// @access Private
router.post('/sessions/:id/complete', protect, async (req, res) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const attempts = await PracticeAttempt.find({ sessionId: session._id });
    const total = attempts.length;
    const correct = attempts.filter((a) => a.correct).length;
    const times = attempts.map((a) => a.timeMs).filter((t) => typeof t === 'number');
    const scorePct = total ? Math.round((correct / total) * 100) : 0;

    session.status = 'completed';
    session.endedAt = new Date();
    session.summary = { total, correct, scorePct };
    await session.save();

    if (session.assignmentId) {
      await Assignment.findByIdAndUpdate(session.assignmentId, {
        status: 'completed', completionDate: new Date(), score: scorePct,
      });
    }
    const domain = /science/i.test(session.module || '') ? 'science' : 'mathpath';
    const sessionLengthSeconds = session.startedAt && session.endedAt
      ? Math.max(0, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000))
      : null;
    await recordLearningEvents([
      {
        studentId: String(session.studentId),
        eventType: 'session_completed',
        domain,
        sessionId: String(session._id),
        metadata: { total, correct, scorePct, sessionLengthSeconds, mode: session.mode, feature: session.feature },
      },
      {
        studentId: String(session.studentId),
        eventType: session.mode === 'fluency' ? 'fluency_completed' : 'practice_completed',
        domain,
        sessionId: String(session._id),
        metadata: { total, correct, scorePct, sessionLengthSeconds, mode: session.mode, feature: session.feature },
      },
    ]);

    res.json({
      session_id: session._id,
      summary: {
        total, correct, incorrect: total - correct, scorePct,
        totalTimeMs: times.reduce((s, t) => s + t, 0),
        avgTimeMs: times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete session.' });
  }
});

// @route GET /api/practice/sessions/:id
// @desc  Session + attempts + mistakes saved this session (for the results page).
// @access Private
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const attempts = await PracticeAttempt.find({ sessionId: session._id }).populate({ path: 'skillId', model: Skill });
    const skillIds = [...new Set(attempts.map((a) => String(a.skillId?._id || a.skillId)))];
    const mistakes = await Mistake.find({ studentId: session.studentId, skillId: { $in: skillIds }, occurredAt: { $gte: session.startedAt } });
    const total = attempts.length, correct = attempts.filter((a) => a.correct).length;
    const times = attempts.map((a) => a.timeMs).filter((t) => typeof t === 'number');

    res.json({
      session: {
        id: session._id, module: session.module, mode: session.mode, feature: session.feature, status: session.status,
        startedAt: session.startedAt, endedAt: session.endedAt, summary: session.summary,
      },
      skills: attempts.reduce((acc, a) => {
        const id = String(a.skillId?._id || a.skillId);
        if (!acc.find((s) => s.id === id)) acc.push({ id, name: a.skillId?.name || '' });
        return acc;
      }, []),
      stats: {
        total, correct, incorrect: total - correct,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        avgTimeMs: times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null,
        totalTimeMs: times.reduce((s, t) => s + t, 0),
      },
      mistakes: mistakes.map((m) => ({ id: m._id, stem: m.questionStem, yourAnswer: m.studentAnswer, correctAnswer: m.correctAnswer })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session.' });
  }
});

// @route PATCH /api/practice/sessions/:id/abandon
// @desc  Mark a practice session abandoned for pilot telemetry.
// @access Private
router.patch('/sessions/:id/abandon', protect, async (req, res) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    await resolveStudent(req, session.studentId);

    session.status = 'abandoned';
    session.endedAt = new Date();
    await session.save();
    const domain = /science/i.test(session.module || '') ? 'science' : 'mathpath';
    const sessionLengthSeconds = session.startedAt && session.endedAt
      ? Math.max(0, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000))
      : null;
    await recordLearningEvents([
      {
        studentId: String(session.studentId),
        eventType: 'session_abandoned',
        domain,
        sessionId: String(session._id),
        metadata: { sessionLengthSeconds, mode: session.mode, feature: session.feature },
      },
      {
        studentId: String(session.studentId),
        eventType: 'practice_abandoned',
        domain,
        sessionId: String(session._id),
        metadata: { sessionLengthSeconds, mode: session.mode, feature: session.feature },
      },
    ]);

    res.json({ session_id: session._id, status: session.status });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to abandon session.' });
  }
});

export default router;
