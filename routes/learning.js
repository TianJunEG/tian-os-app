// routes/learning.js — the unified learning profile API.
// GET /api/learning/profile returns ONE normalised profile for the logged-in learner, aggregated
// across every learning source. Spelling is wired now; Math (MathPath/heuristics) and Science slot
// in here as those apps persist results server-side — the dashboards read this single endpoint.

import express from 'express';
import SpellingAttempt from '../models/SpellingAttempt.js';
import LearningResult from '../models/LearningResult.js';
import { computeWordStats } from '../utils/spellingStats.js';
import { spellingContribution, resultsToContributions, buildProfile } from '../utils/learningProfile.js';
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

// Any learning app posts a normalised result here (Math Heuristics, MathPath, Science…).
router.post('/result', async (req, res) => {
  try {
    const { source, subject, topic = '', accuracy = 0, mastered = false, minutes = 0 } = req.body || {};
    if (!source || !subject) return res.status(400).json({ error: 'source and subject are required' });
    const doc = await LearningResult.create({
      user: req.user.id, source, subject, topic,
      accuracy: Math.max(0, Math.min(100, Math.round(accuracy))), mastered: !!mastered, minutes: Math.round(minutes),
    });
    res.status(201).json({ success: true, id: doc._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const contributions = [];
    const spelling = await spellingStatsFor(req.user.id);
    if (spelling.total) contributions.push(spellingContribution(spelling, 'eng'));
    // Math (Math-Heuristics / MathPath) and Science: aggregated from posted LearningResult records.
    const results = await LearningResult.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(2000);
    contributions.push(...resultsToContributions(results));
    res.json({ success: true, profile: buildProfile(req.user.id, contributions) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
