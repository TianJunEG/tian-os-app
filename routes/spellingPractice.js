import express from 'express';
import { protect } from '../middleware/auth.js';
import SpellingList from '../models/SpellingList.js';
import PracticeSession from '../models/PracticeSession.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';
import Assignment from '../models/Assignment.js';
import LearningResult from '../models/LearningResult.js';
import Student from '../models/Student.js';
import { resolveStudent } from '../utils/studentContext.js';
import { recordAttempt } from '../utils/masteryEngine.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Spelling Practice wired into the shared Tian OS core. It reuses
// PracticeSession / PracticeAttempt / MasteryRecord / Mistake — tagged
// module='Spelling Practice', subject='English' — and SpellingList as the word
// bank. Mastery is tracked per (student, word list) via MasteryRecord with
// skillId = the list id. English = Spelling only (no reading/comprehension/etc.).
const router = express.Router();
const MODULE = 'Spelling Practice';

// Exact match after trimming, lowercasing, and stripping edge punctuation.
function spellingCorrect(given, expected) {
  const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
  return norm(given) !== '' && norm(given) === norm(expected);
}

const listMastery = (rec) => (rec ? { score: rec.score, status: rec.status } : { score: 0, status: 'not_started' });

// @route GET /api/spelling-practice/lists — library lists + this student's mastery
router.get('/lists', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req).catch(() => null);
    const lists = await SpellingList.find({ isShared: true }).sort({ level: 1, title: 1 });
    let recByList = {};
    if (student) {
      const recs = await MasteryRecord.find({ studentId: student._id, module: MODULE, skillId: { $in: lists.map((l) => l._id) } });
      recByList = Object.fromEntries(recs.map((r) => [String(r.skillId), r]));
    }
    res.json({ lists: lists.map((l) => ({
      listId: l._id, title: l.title, level: l.level, description: l.description,
      wordCount: l.words.length, ...listMastery(recByList[String(l._id)]),
    })) });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to load lists.' }); }
}));

// @route GET /api/spelling-practice/home — recommended list + recent accuracy + misspelt count
router.get('/home', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req).catch(() => null);
    const lists = await SpellingList.find({ isShared: true }).sort({ level: 1, title: 1 });
    if (!student) return res.json({ recommended: lists[0] ? { listId: lists[0]._id, title: lists[0].title } : null, recentAccuracy: null, misspeltCount: 0 });

    const recs = await MasteryRecord.find({ studentId: student._id, module: MODULE });
    const recByList = Object.fromEntries(recs.map((r) => [String(r.skillId), r]));
    // Recommend the lowest-mastery practised list, else the first library list.
    const practised = lists.filter((l) => recByList[String(l._id)]).sort((a, b) => recByList[String(a._id)].score - recByList[String(b._id)].score);
    const rec = practised[0] || lists[0];
    const recentSessions = await PracticeSession.find({ studentId: student._id, module: MODULE, status: 'completed' }).sort({ endedAt: -1 }).limit(5);
    const recentAccuracy = recentSessions.length ? Math.round(recentSessions.reduce((s, x) => s + (x.summary?.scorePct || 0), 0) / recentSessions.length) : null;
    const misspeltCount = await Mistake.countDocuments({ studentId: student._id, module: MODULE, status: { $ne: 'resolved' } });
    res.json({ recommended: rec ? { listId: rec._id, title: rec.title } : null, recentAccuracy, misspeltCount });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to load spelling home.' }); }
}));

// @route GET /api/spelling-practice/lists/:id — words for Learn mode
router.get('/lists/:id', protect, asyncHandler(async (req, res) => {
  const list = await SpellingList.findById(req.params.id);
  if (!list || !list.isShared) return res.status(404).json({ error: 'List not found.' });
  res.json({ listId: list._id, title: list.title, level: list.level,
    words: list.words.map((w) => ({ wordId: w._id, word: w.word, sentence: w.sentence, definition: w.definition })) });
}));

// @route POST /api/spelling-practice/sessions — start a self-test on a list
router.post('/sessions', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req, undefined, { write: true });
    // Launched from an assignment? Take its list (stored in skillIds[0]).
    let listId = req.body.listId;
    const assignmentId = req.body.assignmentId || null;
    if (assignmentId && !listId) {
      const a = await Assignment.findById(assignmentId);
      if (a) listId = a.skillIds?.[0];
    }
    const list = await SpellingList.findById(listId);
    if (!list) return res.status(404).json({ error: 'List not found.' });
    const session = await PracticeSession.create({
      studentId: student._id, workspaceId: student.workspaceId, module: MODULE, feature: 'Spelling',
      mode: 'independent', skillIds: [list._id], assignmentId, status: 'active',
    });
    if (assignmentId) await Assignment.findByIdAndUpdate(assignmentId, { status: 'in_progress', sessionId: session._id });
    res.json({ session_id: session._id, listTitle: list.title,
      items: list.words.map((w) => ({ wordId: w._id, word: w.word, sentence: w.sentence, definition: w.definition })) });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to start session.' }); }
}));

// @route POST /api/spelling-practice/sessions/:id/attempts — grade one word
router.post('/sessions/:id/attempts', protect, asyncHandler(async (req, res) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const student = await resolveStudent(req, session.studentId, { write: true });
    const listId = session.skillIds[0];
    const list = await SpellingList.findById(listId);
    const word = list?.words.id(req.body.wordId);
    if (!word) return res.status(404).json({ error: 'Word not found.' });

    const correct = spellingCorrect(req.body.answer, word.word);
    await PracticeAttempt.create({
      sessionId: session._id, studentId: student._id, questionId: word._id, skillId: listId,
      answer: String(req.body.answer ?? ''), correct, timeMs: req.body.timeMs ?? null,
    });
    await recordAttempt({ studentId: student._id, skillId: listId, workspaceId: student.workspaceId, correct, module: MODULE, subject: 'English' });
    if (!correct) {
      await Mistake.create({
        studentId: student._id, workspaceId: student.workspaceId, questionId: word._id, skillId: listId,
        module: MODULE, questionStem: word.sentence || `Spell: ${word.word}`, studentAnswer: String(req.body.answer ?? ''),
        correctAnswer: word.word, mistakeType: 'careless', status: 'open',
      });
    }
    res.json({ correct, correctAnswer: word.word, sentence: word.sentence });
  } catch (err) { res.status(err.status || 500).json({ error: err.message || 'Failed to log attempt.' }); }
}));

// @route POST /api/spelling-practice/sessions/:id/complete
router.post('/sessions/:id/complete', protect, asyncHandler(async (req, res) => {
  const session = await PracticeSession.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const attempts = await PracticeAttempt.find({ sessionId: session._id });
  const total = attempts.length, correct = attempts.filter((a) => a.correct).length;
  session.status = 'completed'; session.endedAt = new Date();
  const scorePct = total ? Math.round((correct / total) * 100) : 0;
  session.summary = { total, correct, scorePct };
  await session.save();
  if (session.assignmentId) {
    await Assignment.findByIdAndUpdate(session.assignmentId, { status: 'completed', completionDate: new Date(), score: scorePct });
  }
  const minutes = Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000));
  const studentDoc = await Student.findById(session.studentId).select('userId').lean();
  if (studentDoc?.userId) {
    await LearningResult.create({
      user: studentDoc.userId,
      source: 'spelling',
      subject: 'english',
      topic: session.listTitle || 'spelling',
      accuracy: scorePct,
      mastered: scorePct >= 85,
      minutes,
    }).catch(() => {});
  }
  res.json({ session_id: session._id, summary: session.summary });
}));

// @route GET /api/spelling-practice/sessions/:id — results (missed words)
router.get('/sessions/:id', protect, asyncHandler(async (req, res) => {
  const session = await PracticeSession.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const attempts = await PracticeAttempt.find({ sessionId: session._id });
  const list = await SpellingList.findById(session.skillIds[0]);
  const wordById = Object.fromEntries((list?.words || []).map((w) => [String(w._id), w.word]));
  const total = attempts.length, correct = attempts.filter((a) => a.correct).length;
  res.json({
    listTitle: list?.title || 'Spelling',
    stats: { total, correct, incorrect: total - correct, accuracy: total ? Math.round((correct / total) * 100) : 0 },
    missed: attempts.filter((a) => !a.correct).map((a) => ({ yourAnswer: a.answer, correct: wordById[String(a.questionId)] || '' })),
  });
}));

// @route GET /api/spelling-practice/mistakes — misspelt words to review
router.get('/mistakes', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req).catch(() => null);
  if (!student) return res.json({ mistakes: [] });
  const mistakes = await Mistake.find({ studentId: student._id, module: MODULE, status: { $ne: 'resolved' } }).sort({ occurredAt: -1 }).limit(100);
  res.json({ mistakes: mistakes.map((m) => ({ id: m._id, correctSpelling: m.correctAnswer, studentSpelling: m.studentAnswer, sentence: m.questionStem, status: m.status })) });
}));

export default router;
