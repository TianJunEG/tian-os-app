import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import SpellingList from '../models/SpellingList.js';
import SpellingAttempt from '../models/SpellingAttempt.js';
import { protect } from '../middleware/auth.js';
import { extractWordsFromFile } from '../utils/spellingExtract.js';
import { computeWordStats, byRevisionPriority } from '../utils/spellingStats.js';
import misspeltWords from '../data/misspeltWords.js';

const router = express.Router();

// All spelling routes require a logged-in user.
router.use(protect);

const LEVELS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'other'];

// In-memory upload so we can hand the buffer straight to the extractor.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Normalise an incoming words array into clean subdocuments.
const sanitizeWords = (words) => {
  if (!Array.isArray(words)) return [];
  return words
    .map((w) => ({
      word: typeof w.word === 'string' ? w.word.trim() : '',
      sentence: typeof w.sentence === 'string' ? w.sentence.trim() : '',
      definition: typeof w.definition === 'string' ? w.definition.trim() : '',
      notes: typeof w.notes === 'string' ? w.notes.trim() : ''
    }))
    .filter((w) => w.word.length > 0)
    .slice(0, 300);
};

// @route   POST /api/spelling/extract
// @desc    Extract candidate words from an uploaded PDF / DOCX / image / text file
// @access  Private
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { words, sourceType, warning } = await extractWordsFromFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json({
      success: true,
      sourceType,
      warning,
      fileName: req.file.originalname,
      words
    });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: 'Failed to read the uploaded file' });
  }
});

// @route   GET /api/spelling/lists
// @desc    Get the current user's spelling lists
// @access  Private
router.get('/lists', async (req, res) => {
  try {
    const lists = await SpellingList.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: lists.length, lists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/spelling/library
// @desc    Browse spelling lists shared by all users
// @access  Private
router.get('/library', async (req, res) => {
  try {
    const { level, q, page = 1, limit = 24 } = req.query;
    const filter = { isShared: true };
    if (level && LEVELS.includes(level)) filter.level = level;
    if (q && q.trim()) {
      const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: safe, $options: 'i' };
    }

    const perPage = Math.min(parseInt(limit, 10) || 24, 60);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;

    const [lists, total] = await Promise.all([
      SpellingList.find(filter)
        .populate('owner', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(perPage),
      SpellingList.countDocuments(filter)
    ]);

    res.json({ success: true, total, page: Number(page), lists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/spelling/misspelt
// @desc    Commonly misspelt words grouped by difficulty
// @access  Private
router.get('/misspelt', (req, res) => {
  const { difficulty } = req.query;
  if (difficulty && misspeltWords[difficulty]) {
    return res.json({ success: true, difficulty, words: misspeltWords[difficulty] });
  }
  res.json({ success: true, difficulties: Object.keys(misspeltWords), data: misspeltWords });
});

// @route   GET /api/spelling/surprise
// @desc    Pull a random selection of words from the user's lists, weighted
//          toward words they find tricky (more misses => more likely).
// @access  Private
router.get('/surprise', async (req, res) => {
  try {
    const count = Math.min(Math.max(parseInt(req.query.count, 10) || 10, 1), 50);
    const [lists, attempts] = await Promise.all([
      SpellingList.find({ owner: req.user.id }).select('title words'),
      SpellingAttempt.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(2000)
    ]);
    const stats = computeWordStats(attempts);

    // Flatten every word across the user's lists, weighting by past misses.
    const pool = [];
    for (const list of lists) {
      for (const w of list.words) {
        if (!w.word) continue;
        const s = stats.get(w.word.toLowerCase());
        let weight = 1 + (s ? s.misses * 2 : 0);
        if (s && s.mastered) weight *= 0.4; // de-prioritise mastered words
        pool.push({
          word: w.word,
          sentence: w.sentence || '',
          definition: w.definition || '',
          listTitle: list.title,
          listId: list._id,
          weight: Math.max(weight, 0.1)
        });
      }
    }

    if (pool.length === 0) {
      return res.json({ success: true, words: [], message: 'No words yet. Create a list first!' });
    }

    // Weighted sampling without replacement.
    const items = pool.slice();
    const picked = [];
    const n = Math.min(count, items.length);
    for (let k = 0; k < n; k++) {
      const totalW = items.reduce((sum, it) => sum + it.weight, 0);
      let r = Math.random() * totalW;
      let idx = 0;
      for (; idx < items.length - 1; idx++) {
        r -= items[idx].weight;
        if (r <= 0) break;
      }
      picked.push(items.splice(idx, 1)[0]);
    }

    res.json({ success: true, words: picked.map(({ weight, ...w }) => w), poolSize: pool.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/spelling/revision
// @desc    Words the student should revise (attempted, missed, not yet
//          mastered), joined with list data so they carry sentence/definition.
// @access  Private
router.get('/revision', async (req, res) => {
  try {
    const count = Math.min(Math.max(parseInt(req.query.count, 10) || 15, 1), 50);
    const attempts = await SpellingAttempt.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(2000);
    const weak = [...computeWordStats(attempts).values()].filter((s) => s.weak).sort(byRevisionPriority);

    if (weak.length === 0) {
      return res.json({ success: true, words: [], message: 'No words need revision right now.' });
    }

    // Recover sentence/definition from the user's lists where available.
    const lists = await SpellingList.find({ owner: req.user.id }).select('title words');
    const info = new Map();
    for (const list of lists) {
      for (const w of list.words) {
        if (!w.word) continue;
        const key = w.word.toLowerCase();
        const existing = info.get(key);
        if (!existing || (!existing.sentence && w.sentence)) {
          info.set(key, { sentence: w.sentence || '', definition: w.definition || '', listTitle: list.title });
        }
      }
    }

    const words = weak.slice(0, count).map((s) => {
      const extra = info.get(s.word.toLowerCase()) || {};
      return {
        word: s.word,
        sentence: extra.sentence || '',
        definition: extra.definition || '',
        misses: s.misses,
        listTitle: extra.listTitle || null
      };
    });

    res.json({ success: true, words, weakCount: weak.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/spelling/stats
// @desc    Lightweight practice stats for the current user
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const attempts = await SpellingAttempt.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(2000);

    const total = attempts.length;
    const correct = attempts.filter((a) => a.correct).length;

    const all = [...computeWordStats(attempts).values()];
    const masteredWords = all.filter((s) => s.mastered).map((s) => s.word);
    const weakWords = all
      .filter((s) => s.weak)
      .sort(byRevisionPriority)
      .map((s) => ({ word: s.word, misses: s.misses }));
    const learning = all.filter((s) => !s.mastered && !s.weak).length;

    res.json({
      success: true,
      total,
      correct,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      uniqueWords: all.length,
      mastery: { mastered: masteredWords.length, learning, weak: weakWords.length },
      masteredWords,
      weakWords,
      // Kept for backward compatibility with the home screen.
      trickyWords: weakWords.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/spelling/attempts
// @desc    Record one or more practice attempts
// @access  Private
router.post('/attempts', async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.attempts) ? req.body.attempts : [req.body];
    const docs = incoming
      .filter((a) => a && typeof a.word === 'string' && a.word.trim())
      .slice(0, 100)
      .map((a) => ({
        user: req.user.id,
        list: isValidId(a.list) ? a.list : null,
        mode: a.mode || 'mock',
        word: a.word.trim(),
        correct: !!a.correct
      }));

    if (docs.length === 0) {
      return res.status(400).json({ error: 'No valid attempts provided' });
    }

    await SpellingAttempt.insertMany(docs);
    res.status(201).json({ success: true, recorded: docs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/spelling/lists/:id
// @desc    Get a single list (owner, or anyone if it is shared)
// @access  Private
router.get('/lists/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid list id' });
    const list = await SpellingList.findById(req.params.id).populate('owner', 'name');
    if (!list) return res.status(404).json({ error: 'List not found' });

    const isOwner = list.owner._id.toString() === req.user.id;
    if (!isOwner && !list.isShared) {
      return res.status(403).json({ error: 'This list is private' });
    }

    res.json({ success: true, list, isOwner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/spelling/lists
// @desc    Create a new spelling list
// @access  Private
router.post(
  '/lists',
  [body('title', 'Please give the list a title').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, description = '', level = 'other', sourceType = 'manual', isShared = false } = req.body;
      const words = sanitizeWords(req.body.words);

      const list = await SpellingList.create({
        owner: req.user.id,
        title: title.trim(),
        description,
        level: LEVELS.includes(level) ? level : 'other',
        sourceType,
        isShared: !!isShared,
        words
      });

      res.status(201).json({ success: true, list });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   PUT /api/spelling/lists/:id
// @desc    Update a list (owner only)
// @access  Private
router.put('/lists/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid list id' });
    const list = await SpellingList.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (list.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own lists' });
    }

    const { title, description, level, isShared } = req.body;
    if (typeof title === 'string' && title.trim()) list.title = title.trim();
    if (typeof description === 'string') list.description = description;
    if (LEVELS.includes(level)) list.level = level;
    if (typeof isShared === 'boolean') list.isShared = isShared;
    if (req.body.words !== undefined) list.words = sanitizeWords(req.body.words);

    await list.save();
    res.json({ success: true, list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/spelling/lists/:id/share
// @desc    Toggle sharing and set the level for the library
// @access  Private
router.put('/lists/:id/share', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid list id' });
    const list = await SpellingList.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (list.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only share your own lists' });
    }

    const { isShared, level } = req.body;
    if (typeof isShared === 'boolean') list.isShared = isShared;
    if (LEVELS.includes(level)) list.level = level;
    await list.save();

    res.json({ success: true, list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/spelling/lists/:id/copy
// @desc    Copy a shared list into the current user's own lists
// @access  Private
router.post('/lists/:id/copy', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid list id' });
    const source = await SpellingList.findById(req.params.id);
    if (!source) return res.status(404).json({ error: 'List not found' });

    const isOwner = source.owner.toString() === req.user.id;
    if (!isOwner && !source.isShared) {
      return res.status(403).json({ error: 'This list is private' });
    }

    const copy = await SpellingList.create({
      owner: req.user.id,
      title: `${source.title} (copy)`,
      description: source.description,
      level: source.level,
      sourceType: source.sourceType,
      isShared: false,
      copiedFrom: source._id,
      words: source.words.map((w) => ({
        word: w.word,
        sentence: w.sentence,
        definition: w.definition,
        notes: w.notes
      }))
    });

    if (!isOwner) {
      source.copyCount = (source.copyCount || 0) + 1;
      await source.save();
    }

    res.status(201).json({ success: true, list: copy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/spelling/lists/:id
// @desc    Delete a list (owner only)
// @access  Private
router.delete('/lists/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid list id' });
    const list = await SpellingList.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (list.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own lists' });
    }

    await list.deleteOne();
    res.json({ success: true, message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
