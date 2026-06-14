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

const router = express.Router();

router.get('/home', protect, async (req, res) => {
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
});

router.get('/skills/:skillId/readiness', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const result = await checkPrerequisites(req.params.skillId, student._id, student.workspaceId);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/sessions', protect, async (req, res) => {
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
});

router.get('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await getSession(req.params.sessionId, { studentId: student._id });
    res.json(session);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/sessions/:sid/problems/:pid/step', protect, async (req, res) => {
  try {
    const { stepId, response, timeSpentMs } = req.body;
    const result = await submitStep({
      sessionId: req.params.sid,
      problemId: req.params.pid,
      stepId,
      response,
      timeSpentMs,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/sessions/:sid/problems/:pid/hint', protect, async (req, res) => {
  try {
    const { stepId } = req.body;
    const session = await PSLSession.findOne({ sessionId: req.params.sid });
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
});

router.post('/sessions/:sid/problems/:pid/complete', protect, async (req, res) => {
  try {
    const result = await completeProblem({
      sessionId: req.params.sid,
      problemId: req.params.pid,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/sessions/:sid/complete', protect, async (req, res) => {
  try {
    const result = await completeSession(req.params.sid);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/sessions/:sid/abandon', protect, async (req, res) => {
  try {
    const result = await abandonSession(req.params.sid);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/sessions/:sid/problems/:pid/solution', protect, async (req, res) => {
  try {
    const session = await PSLSession.findOne({ sessionId: req.params.sid }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const problem = session.problems.find((p) => p.problemId === req.params.pid);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const attempt = await PSLAttempt.findOne({
      sessionId: req.params.sid,
      problemId: req.params.pid,
    }).lean();

    const wrongSteps = (attempt?.steps || []).filter((s) => !s.correct && !s.partial).length;
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
});

router.get('/mistakes', protect, async (req, res) => {
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
});

export default router;
