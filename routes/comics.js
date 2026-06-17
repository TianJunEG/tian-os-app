import express from 'express';
import { protect } from '../middleware/auth.js';
import ComicProgress from '../models/ComicProgress.js';
import { recordAttempt } from '../utils/masteryEngine.js';

const router = express.Router();
router.use(protect);

// POST /api/comics/:episodeId/complete
// Body: { problems: [{ problemId, correct }] }
router.post('/:episodeId/complete', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { problems = [] } = req.body;
    const studentId = req.user._id;
    const workspaceId = req.user.workspaceId;

    // Upsert progress record
    await ComicProgress.findOneAndUpdate(
      { studentId, episodeId },
      { studentId, episodeId, workspaceId, problems, completedAt: new Date() },
      { upsert: true, new: true },
    );

    // Write correct answers to MasteryRecord (skill tag comes from episode data on the client,
    // but we don't want to trust the client — skill mapping lives here as a static map).
    const SKILL_MAP = {
      // Episode 1 — Hawker Heroes
      'p1-q1': 'addition-within-100',
      'p2-q1': 'money-addition',
      'p3-q1': 'money-subtraction',
      // Episode 2 — Sticker Squad
      'e2-p1-q1': 'division-equal-sharing',
      'e2-p2-q1': 'division-within-tables',
      'e2-p3-q1': 'division-with-remainder',
      // Episode 3 — Party Planner
      'e3-p1-q1': 'money-addition',
      'e3-p2-q1': 'money-multiplication',
      'e3-p3-q1': 'money-subtraction',
      // Episode 4 — Pattern Detective
      'e4-p1-q1': 'number-patterns',
      'e4-p2-q1': 'number-patterns',
      'e4-p3-q1': 'number-patterns',
      // Episode 5 — Measure Up
      'e5-p1-q1': 'measurement-length-addition',
      'e5-p2-q1': 'measurement-length-subtraction',
      'e5-p3-q1': 'measurement-conversion-cm-m',
      // Episode 6 — Beat the Clock
      'e6-p1-q1': 'time-duration',
      'e6-p2-q1': 'time-multiplication',
      'e6-p3-q1': 'time-conversion-min-to-hour',
      // Episode 7 — Chart Champions
      'e7-p1-q1': 'data-bar-chart-difference',
      'e7-p2-q1': 'data-addition',
      'e7-p3-q1': 'data-total',
    };

    await Promise.allSettled(
      problems.map(({ problemId, correct }) => {
        const skillId = SKILL_MAP[problemId];
        if (!skillId) return Promise.resolve();
        return recordAttempt({
          studentId,
          skillId,
          workspaceId,
          correct,
          module: 'Comics',
          subject: 'Math',
        });
      }),
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('comics complete error', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// GET /api/comics/progress — list completed episode IDs for current student
router.get('/progress', async (req, res) => {
  try {
    const records = await ComicProgress.find(
      { studentId: req.user._id },
      { episodeId: 1, completedAt: 1 },
    ).lean();
    res.json({ completed: records.map((r) => ({ episodeId: r.episodeId, completedAt: r.completedAt })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
