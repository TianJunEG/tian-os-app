// routes/science.js — serves the P6 Science revision bank (open-ended Q&A,
// MOE-aligned) loaded once from data/p6Science.json. Results are recorded
// through the unified learning profile (POST /api/learning/result), not here.
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTIONS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/p6Science.json'), 'utf8')
);

const TOPICS = [...new Set(QUESTIONS.map((q) => q.topic))]
  .sort()
  .map((topic) => ({ topic, count: QUESTIONS.filter((q) => q.topic === topic).length }));

const router = express.Router();
router.use(protect);

// Topics + how many questions each has, for the practice picker.
router.get('/topics', (req, res) => {
  res.json({ success: true, topics: TOPICS });
});

// A shuffled set of questions, optionally filtered by topic.
router.get('/questions', (req, res) => {
  const { topic } = req.query;
  const pool = topic ? QUESTIONS.filter((q) => q.topic === topic) : QUESTIONS;
  const limit = Math.max(1, Math.min(30, Number(req.query.limit) || 10));
  const questions = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
  res.json({ success: true, topic: topic || 'All topics', total: pool.length, questions });
});

export default router;
