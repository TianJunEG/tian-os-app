import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getTopicsByLevel,
  getSkillsByTopic,
  getSkillsByLevel,
  getExamPrepTopics,
  getWeaknessDrillSkills,
  getAllLevels,
  getTaxonomyStats,
  SKILLS,
  TOPICS,
} from '../shared/mathpath/curriculum/primaryMathTaxonomy.js';

const router = express.Router();

router.get('/levels', protect, (_req, res) => {
  res.json({ levels: getAllLevels(), stats: getTaxonomyStats() });
});

router.get('/topics', protect, (req, res) => {
  const { level } = req.query;
  if (!level) return res.json({ topics: TOPICS });
  res.json({ topics: getTopicsByLevel(level) });
});

router.get('/skills', protect, (req, res) => {
  const { level, topicId } = req.query;
  if (topicId) return res.json({ skills: getSkillsByTopic(topicId) });
  if (level) return res.json({ skills: getSkillsByLevel(level) });
  res.json({ skills: SKILLS });
});

router.get('/exam-prep', protect, (req, res) => {
  const { level } = req.query;
  if (!level) return res.status(400).json({ error: 'level is required' });
  res.json({ topics: getExamPrepTopics(level) });
});

router.get('/weakness-drill', protect, (req, res) => {
  const { level, tags } = req.query;
  if (!level) return res.status(400).json({ error: 'level is required' });
  const tagList = tags ? String(tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
  res.json({ skills: getWeaknessDrillSkills(level, tagList) });
});

export default router;
