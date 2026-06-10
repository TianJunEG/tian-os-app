// routes/science.js — Science Adaptive Revision content beyond practice:
// topic notes (Mermaid mind maps), structured/auto-built lessons, and the
// shared inline SVG diagrams. Practice flows through the unified
// /api/practice/sessions; this module serves the supporting content.
//
// Legacy compatibility: GET /topics + GET /questions still answer from
// data/p6Science.json so the static /science Lab page keeps working.
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import Subject from '../models/Subject.js';
import StudentNote from '../models/StudentNote.js';
import { resolveStudent } from '../utils/studentContext.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loadJson = (rel) => JSON.parse(fs.readFileSync(path.join(__dirname, rel), 'utf8'));

const LEGACY_QUESTIONS = loadJson('../data/p6Science.json');
const TOPIC_MIND_MAPS = loadJson('../data/scienceNotes.json');
const STRUCTURED_LESSONS = loadJson('../data/scienceLessons.json');
const DIAGRAMS = loadJson('../data/scienceDiagrams.json');
// Map of `${topic}::${heading}` → diagram key. Built from the legacy
// QUESTIONS array which carries q.diagram on ~94 questions; the join lets the
// auto-built lesson reader pick up the right inline SVG per concept page.
const QUESTION_DIAGRAMS = loadJson('../data/scienceQuestionDiagrams.json');

const LEGACY_TOPICS = [...new Set(LEGACY_QUESTIONS.map((q) => q.topic))]
  .sort()
  .map((topic) => ({ topic, count: LEGACY_QUESTIONS.filter((q) => q.topic === topic).length }));

const router = express.Router();
router.use(protect);

// --- Legacy /science static lab endpoints (kept for backwards-compat) ---
router.get('/topics', (req, res) => {
  res.json({ success: true, topics: LEGACY_TOPICS });
});

router.get('/questions', (req, res) => {
  const { topic } = req.query;
  const pool = topic ? LEGACY_QUESTIONS.filter((q) => q.topic === topic) : LEGACY_QUESTIONS;
  const limit = Math.max(1, Math.min(30, Number(req.query.limit) || 10));
  const questions = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
  res.json({ success: true, topic: topic || 'All topics', total: pool.length, questions });
});

// --- New content endpoints for the unified /student/science module ---

// Resolve a Topic by id (preferred) or by topicName (fallback). Notes/lessons
// are keyed by topic name in the legacy data, so we accept either.
async function resolveTopic({ topicId, topicName }) {
  if (topicId) {
    const t = await Topic.findById(topicId);
    if (t) return t;
  }
  if (topicName) {
    const science = await Subject.findOne({ key: 'science' });
    if (!science) return null;
    return Topic.findOne({ subjectId: science._id, name: topicName });
  }
  return null;
}

// @route GET /api/science/notes?topicId=… (or ?topic=name)
// @desc  Returns the topic mind map (Mermaid source) for the requested topic.
router.get('/notes', async (req, res) => {
  try {
    const topic = await resolveTopic({ topicId: req.query.topicId, topicName: req.query.topic });
    if (!topic) return res.status(404).json({ error: 'Topic not found.' });
    const mermaid = TOPIC_MIND_MAPS[topic.name] || null;
    if (!mermaid) return res.json({ topic: topic.name, moeLevel: topic.moeLevel, mermaid: null, available: false });
    res.json({ topic: topic.name, moeLevel: topic.moeLevel, mermaid, available: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load notes.' });
  }
});

// @route GET /api/science/lessons?topicId=… (or ?topic=name)
// @desc  Returns a paged lesson for the topic. Prefers the curated
//        STRUCTURED_LESSONS entry; otherwise auto-builds pages from the
//        shared question bank (one page per question, in stable order).
router.get('/lessons', async (req, res) => {
  try {
    const topic = await resolveTopic({ topicId: req.query.topicId, topicName: req.query.topic });
    if (!topic) return res.status(404).json({ error: 'Topic not found.' });

    const structured = STRUCTURED_LESSONS[topic.name];
    if (structured && Array.isArray(structured.sections) && structured.sections.length) {
      const pages = structured.sections.map((s, i) => ({
        index: i, total: structured.sections.length,
        kind: 'section', heading: `${topic.name} §${i + 1}`,
        title: s.title, body: s.body, terms: s.terms || '',
        diagram: s.diagram && DIAGRAMS[s.diagram] ? DIAGRAMS[s.diagram] : null,
      }));
      return res.json({ topic: topic.name, moeLevel: topic.moeLevel, kind: 'structured', pages });
    }

    // Auto-build: one page per question for the topic's skills, in skill+order.
    const skills = await Skill.find({ topicId: topic._id }).select('_id name order').sort({ order: 1 });
    const skillIds = skills.map((s) => s._id);
    const qs = await Question.find({ skillId: { $in: skillIds } })
      .select('stem answer explanation modelAnswer keyPoints difficulty');
    qs.sort((a, b) => (a.explanation || '').localeCompare(b.explanation || ''));
    const pages = qs.map((q, i) => {
      const heading = q.explanation || '';
      const dKey = QUESTION_DIAGRAMS[`${topic.name}::${heading}`];
      return {
        index: i, total: qs.length,
        kind: 'concept', heading,
        title: q.stem, body: q.modelAnswer || q.answer || '',
        terms: Array.isArray(q.keyPoints) ? q.keyPoints.join(', ') : '',
        diagram: dKey && DIAGRAMS[dKey] ? DIAGRAMS[dKey] : null,
      };
    });
    res.json({ topic: topic.name, moeLevel: topic.moeLevel, kind: pages.length ? 'auto' : 'empty', pages });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load lesson.' });
  }
});

// @route GET /api/science/diagrams/:key
// @desc  Returns one inline SVG diagram from the shared library.
router.get('/diagrams/:key', (req, res) => {
  const svg = DIAGRAMS[req.params.key];
  if (!svg) return res.status(404).json({ error: 'Diagram not found.' });
  res.json({ key: req.params.key, svg });
});

// --- Personal study notes (per-student, per-concept heading) ---

// @route GET /api/science/student-notes
// @desc  All Science notes for the resolved student, returned as a map keyed
//        by heading so the client can hydrate every visible NoteWidget at once.
router.get('/student-notes', async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const notes = await StudentNote.find({ studentId: student._id, subjectKey: 'science' })
      .select('heading topicName text updatedAt')
      .sort({ updatedAt: -1 });
    const byHeading = {};
    for (const n of notes) byHeading[n.heading] = { text: n.text, topicName: n.topicName, updatedAt: n.updatedAt };
    res.json({ notes: byHeading, list: notes });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load notes.' });
  }
});

// @route PUT /api/science/student-notes
// @desc  Upsert a single note. body: { heading, text, topicName? }.
//        Empty/whitespace text deletes the note (so saving an empty textarea
//        from the widget naturally clears it).
router.put('/student-notes', async (req, res) => {
  try {
    const student = await resolveStudent(req, undefined, { write: true });
    const { heading, text = '', topicName = '' } = req.body || {};
    if (!heading || typeof heading !== 'string') return res.status(400).json({ error: 'heading is required.' });
    const trimmed = String(text).trim();
    if (!trimmed) {
      await StudentNote.deleteOne({ studentId: student._id, subjectKey: 'science', heading });
      return res.json({ heading, deleted: true });
    }
    const note = await StudentNote.findOneAndUpdate(
      { studentId: student._id, subjectKey: 'science', heading },
      { $set: { text: trimmed, topicName }, $setOnInsert: { workspaceId: student.workspaceId } },
      { new: true, upsert: true }
    );
    res.json({ heading: note.heading, text: note.text, topicName: note.topicName, updatedAt: note.updatedAt });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to save note.' });
  }
});

export default router;
