import crypto from 'crypto';
import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import PSLSkill from '../models/psl/PSLSkill.js';
import PSLSession from '../models/psl/PSLSession.js';
import PSLAttempt from '../models/psl/PSLAttempt.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import { checkPrerequisites } from '../services/psl/prerequisiteChecker.js';
import { getHintsForStep } from '../services/psl/hintGenerator.js';
import {
  startSession,
  getSession,
  submitStep,
  completeProblem,
  completeSession,
  abandonSession,
} from '../services/psl/sessionOrchestrator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/home', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = student._id;
    const workspaceId = student.workspaceId;
    const skills = await PSLSkill.find({ isActive: true }).lean();

    const masteryRecords = await MasteryRecord.find({
      studentId, module: 'PSL', workspaceId,
    }).lean();
    const masteryMap = {};
    for (const rec of masteryRecords) {
      masteryMap[rec.skillId?.toString()] = rec;
    }

    const skillsWithMastery = skills.map((s) => {
      const rec = Object.values(masteryMap).find((r) =>
        r.skillId?.toString() === s._id?.toString()
      );
      return {
        ...s,
        mastery: rec ? { score: rec.score, status: rec.status, attempts: rec.attempts } : null,
      };
    });

    const recommended = skillsWithMastery.find(
      (s) => !s.mastery || s.mastery.status !== 'mastered'
    ) || skillsWithMastery[0];

    res.json({ skills: skillsWithMastery, recommended: recommended?.skillId || null });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.get('/skills/:skillId/readiness', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const result = await checkPrerequisites(req.params.skillId, student._id, student.workspaceId);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.post('/sessions', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { skillId, problemCount = 5 } = req.body;
    const result = await startSession({
      studentId: student._id,
      skillId,
      workspaceId: student.workspaceId,
      problemCount,
      assignmentId: req.body.assignmentId || null,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.get('/sessions/:sessionId', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await getSession(req.params.sessionId, { studentId: student._id });
    res.json(session);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.post('/sessions/:sid/problems/:pid/step', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { stepId, response, timeSpentMs } = req.body;
    const result = await submitStep({
      sessionId: req.params.sid,
      problemId: req.params.pid,
      stepId,
      response,
      timeSpentMs,
      studentId: student._id,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.post('/sessions/:sid/problems/:pid/hint', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { stepId } = req.body;
    const session = await PSLSession.findOne({ sessionId: req.params.sid, studentId: student._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const problem = session.problems.find((p) => p.problemId === req.params.pid);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    let attempt = await PSLAttempt.findOne({ sessionId: req.params.sid, problemId: req.params.pid });
    if (!attempt) {
      attempt = new PSLAttempt({
        attemptId: crypto.randomUUID(),
        sessionId: req.params.sid,
        studentId: session.studentId,
        skillId: session.skillId,
        problemId: req.params.pid,
        steps: [],
      });
    }

    let stepEntry = attempt.steps.find((s) => s.stepId === stepId);
    if (!stepEntry) {
      attempt.steps.push({ stepId, hintsUsed: 0, hintUsed: false });
      stepEntry = attempt.steps[attempt.steps.length - 1];
    }

    const result = getHintsForStep(stepId, problem.heuristic, stepEntry.hintsUsed || 0);

    if (result.hint) {
      stepEntry.hintsUsed = (stepEntry.hintsUsed || 0) + 1;
      stepEntry.hintUsed = true;
      await attempt.save();
    }

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.post('/sessions/:sid/problems/:pid/complete', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const result = await completeProblem({
      sessionId: req.params.sid,
      problemId: req.params.pid,
      studentId: student._id,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.post('/sessions/:sid/complete', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const result = await completeSession(req.params.sid, { studentId: student._id });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.patch('/sessions/:sid/abandon', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const result = await abandonSession(req.params.sid, { studentId: student._id });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.get('/sessions/:sid/problems/:pid/solution', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await PSLSession.findOne({ sessionId: req.params.sid, studentId: student._id }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const problem = session.problems.find((p) => p.problemId === req.params.pid);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const attempt = await PSLAttempt.findOne({
      sessionId: req.params.sid,
      problemId: req.params.pid,
    }).lean();

    const wrongSteps = (attempt?.steps || []).filter((s) => s.response !== undefined && !s.correct && !s.partial).length;
    const totalHints = (attempt?.steps || []).reduce((sum, s) => sum + (s.hintsUsed || 0), 0);

    if (wrongSteps < 2 && totalHints < 2) {
      return res.status(403).json({ error: 'Keep trying! You can do this.' });
    }

    res.json({
      solutionText: problem.solutionText || '',
      visualSpec: problem.visualSpec || null,
      heuristic: problem.heuristic || '',
      structure: problem.structure || '',
      unknownPosition: problem.unknownPosition || '',
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.get('/mistakes', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const mistakes = await Mistake.find({
      studentId: student._id,
      module: 'PSL',
    }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ mistakes });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

router.get('/dashboard', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
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

    const skillRows = [];
    for (const sk of skills) {
      const skSessions = sessions.filter((s) => s.skillId === sk.skillId);
      const skAttempts = attempts.filter((a) => a.skillId === sk.skillId);
      if (!skSessions.length && !skAttempts.length) continue;
      const mastered = masteryRecs.find((r) => r.skillId?.toString() === sk._id?.toString() && r.status === 'mastered');
      const avgScore = skAttempts.length
        ? Math.round((skAttempts.reduce((a, at) => a + at.overallScore, 0) / skAttempts.length) * 100)
        : 0;
      skillRows.push({
        skillId: sk.skillId, name: sk.name, heuristic: sk.heuristic, level: sk.level,
        sessions: skSessions.length, mastered: Boolean(mastered), averageScore: avgScore,
      });
    }

    const STEP_IDS_LIST = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];
    const STEP_LABELS_MAP = { understand: 'Understand', identify_info: 'Find Clues', identify_question: 'Find Question', plan: 'Plan', solve: 'Solve', check: 'Check' };
    const stepAgg = {};
    for (const sid of STEP_IDS_LIST) stepAgg[sid] = { total: 0, correct: 0 };
    for (const at of attempts) {
      for (const step of at.steps || []) {
        const agg = stepAgg[step.stepId];
        if (!agg) continue;
        agg.total++;
        if (step.correct) agg.correct++;
      }
    }
    const stepPerformance = STEP_IDS_LIST.map((sid) => {
      const a = stepAgg[sid];
      return {
        stepId: sid, label: STEP_LABELS_MAP[sid],
        accuracy: a.total ? Math.round((a.correct / a.total) * 100) : 0,
      };
    });

    const miscCounts = {};
    for (const at of attempts) {
      for (const step of at.steps || []) {
        if (step.misconceptionTag) miscCounts[step.misconceptionTag] = (miscCounts[step.misconceptionTag] || 0) + 1;
      }
    }
    const topMisconceptions = Object.entries(miscCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));

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
          sessionId: s.sessionId, skillName: sk?.name || s.skillId,
          heuristic: sk?.heuristic, date: s.completedAt || s.updatedAt, score: avgScore,
          problems: s.summary?.totalProblems || 0,
        };
      });

    res.json({
      student: { id: studentId, name: student.name, level: student.level },
      overview: {
        totalSessions: completedSessions.length,
        skillsAttempted: skillRows.length,
        skillsMastered: masteryRecs.filter((r) => r.status === 'mastered').length,
        averageAccuracy: avgAccuracy,
      },
      skills: skillRows,
      stepPerformance,
      topMisconceptions,
      recentSessions,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}));

export default router;
