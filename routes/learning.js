// routes/learning.js — the unified learning profile API.
// GET /api/learning/profile returns ONE normalised profile for the logged-in learner, aggregated
// across every learning source. Spelling is wired now; Math (MathPath/heuristics) and Science slot
// in here as those apps persist results server-side — the dashboards read this single endpoint.

import express from 'express';
import SpellingAttempt from '../models/SpellingAttempt.js';
import { computeWordStats } from '../utils/spellingStats.js';
import { spellingContribution, buildProfile } from '../utils/learningProfile.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// Build the Spelling contribution for a user from their recorded attempts.
async function spellingStatsFor(userId) {
  const attempts = await SpellingAttempt.find({ user: userId }).sort({ createdAt: -1 }).limit(2000);
  const all = [...computeWordStats(attempts).values()];
  return {
    total: attempts.length,
    correct: attempts.filter((a) => a.correct).length,
    accuracy: attempts.length ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100) : 0,
    uniqueWords: all.length,
    mastery: {
      mastered: all.filter((s) => s.mastered).length,
      learning: all.filter((s) => !s.mastered && !s.weak).length,
      weak: all.filter((s) => s.weak).length,
    },
    weakWords: all.filter((s) => s.weak).map((s) => ({ word: s.word, misses: s.misses })),
  };
}

router.get('/profile', async (req, res) => {
  try {
    const contributions = [];
    const spelling = await spellingStatsFor(req.user.id);
    if (spelling.total) contributions.push(spellingContribution(spelling, 'eng'));
    // Math (MathPath / Math-Heuristics) and Science contributions plug in here once those apps
    // persist results to the backend — same buildProfile() assembly, no dashboard changes needed.
    res.json({ success: true, profile: buildProfile(req.user.id, contributions) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
