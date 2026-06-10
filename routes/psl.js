import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import PSLSkill from '../models/psl/PSLSkill.js';
import PSLSession from '../models/psl/PSLSession.js';
import PSLAttempt from '../models/psl/PSLAttempt.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import { checkPrerequisites } from '../services/psl/prerequisiteChecker.js';
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
    const session = await getSession(req.params.sessionId);
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
