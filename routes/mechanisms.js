import express from 'express';
import { protect } from '../middleware/auth.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import PracticeSession from '../models/PracticeSession.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import { resolveStudent } from '../utils/studentContext.js';
import { recordAttempt } from '../utils/masteryEngine.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Mechanisms Playground (Secondary D&T) wired into the shared Tian OS core. The
// interactive sims stay client-side; completing a mechanism's concept check
// records a PracticeSession + per-question attempts/mistakes and updates mastery
// — tagged module='Mechanisms Playground', subject='Design & Technology', keyed by
// the mechanism's Skill. Isolated from MathPath (which filters module='MathPath').
const router = express.Router();
const MODULE = 'Mechanisms Playground';
const SUBJECT = 'Design & Technology';

// mechanism route key → seeded Skill name
const SKILL_NAME = { gears: 'Gears', levers: 'Levers', pulleys: 'Pulleys', linkages: 'Linkages' };
const KEY_BY_NAME = Object.fromEntries(Object.entries(SKILL_NAME).map(([k, v]) => [v, k]));

// Load the D&T skills (Gears/Levers/Pulleys/Linkages) once per request.
async function loadSkills() {
  const subject = await Subject.findOne({ key: 'dt' });
  if (!subject) return { subject: null, skills: [] };
  const topic = await Topic.findOne({ subjectId: subject._id, name: 'Mechanisms' });
  if (!topic) return { subject, skills: [] };
  const skills = await Skill.find({ topicId: topic._id });
  return { subject, skills };
}

// @route GET /api/mechanisms/progress — per-mechanism mastery for the student
// Returns { progress: { gears: { status, score }, ... }, seeded: boolean }
router.get('/progress', protect, asyncHandler(async (req, res) => {
  try {
    const { skills } = await loadSkills();
    const seeded = skills.length > 0;
    const student = await resolveStudent(req).catch(() => null);
    const progress = {};
    if (student && seeded) {
      const recs = await MasteryRecord.find({ studentId: student._id, module: MODULE, skillId: { $in: skills.map((s) => s._id) } });
      const recBySkill = Object.fromEntries(recs.map((r) => [String(r.skillId), r]));
      for (const s of skills) {
        const key = KEY_BY_NAME[s.name];
        if (key) { const r = recBySkill[String(s._id)]; progress[key] = { status: r?.status || 'not_started', score: r?.score || 0 }; }
      }
    }
    res.json({ seeded, progress });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to load progress.' }); }
}));

// @route POST /api/mechanisms/:key/complete — record a finished concept check
// Body: { answers: [{ index, correct }] } in the same order the sim presents them.
// Grades are taken from the client (low-stakes self-check); mastery + mistakes are
// recorded against the mechanism's Skill. Maps `index` → seeded Question (by _id
// order) so attempts/mistakes carry a real questionId.
router.post('/:key/complete', protect, asyncHandler(async (req, res) => {
  try {
    const key = req.params.key;
    if (!SKILL_NAME[key]) return res.status(404).json({ error: 'Unknown mechanism.' });
    const student = await resolveStudent(req);
    const { skills } = await loadSkills();
    const skill = skills.find((s) => s.name === SKILL_NAME[key]);
    if (!skill) return res.status(409).json({ error: 'Mechanisms not seeded. Run: npm run seed:mechanisms' });

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (!answers.length) return res.status(400).json({ error: 'No answers submitted.' });

    const questions = await Question.find({ skillId: skill._id, source: 'seed' }).sort({ _id: 1 });

    const session = await PracticeSession.create({
      studentId: student._id, workspaceId: student.workspaceId, module: MODULE, feature: 'Concept check',
      mode: 'independent', skillIds: [skill._id], status: 'active',
    });

    let correctCount = 0;
    for (const a of answers) {
      const correct = !!a.correct;
      if (correct) correctCount += 1;
      // Update mastery at the skill level (questionId not required for mastery).
      await recordAttempt({ studentId: student._id, skillId: skill._id, workspaceId: student.workspaceId, correct, module: MODULE, subject: SUBJECT });
      const q = questions[a.index];
      if (q) {
        await PracticeAttempt.create({
          sessionId: session._id, studentId: student._id, questionId: q._id, skillId: skill._id,
          answer: '', correct,
        });
        if (!correct) {
          await Mistake.create({
            studentId: student._id, workspaceId: student.workspaceId, questionId: q._id, skillId: skill._id,
            module: MODULE, questionStem: q.stem, workedSolution: q.explanation || '', correctAnswer: q.answer,
            mistakeType: 'concept_gap', status: 'open',
          });
        }
      }
    }

    const total = answers.length;
    const scorePct = total ? Math.round((correctCount / total) * 100) : 0;
    session.status = 'completed';
    session.endedAt = new Date();
    session.summary = { total, correct: correctCount, scorePct };
    await session.save();

    const rec = await MasteryRecord.findOne({ studentId: student._id, skillId: skill._id });
    res.json({ summary: session.summary, mastery: { status: rec?.status || 'learning', score: rec?.score || 0 } });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to record concept check.' }); }
}));

export default router;
