import express from 'express';
import fs from 'fs/promises';
import Worksheet from '../models/Worksheet.js';
import { protect, authorize } from '../middleware/auth.js';
import uploadWorksheet from '../middleware/uploadWorksheet.js';
import { analyzeAndGenerateWorksheet } from '../utils/aiService.js';

const router = express.Router();

// Map any failure to a safe HTTP response. Critically, never return 401/403 here:
// the frontend axios interceptor force-logs-out on 401, and an upstream AI auth
// error is a server config problem, not the user's session expiring.
function sendAiError(res, err) {
  console.error('Worksheet generation error:', err.status || '', err.message);
  let status = err.status || 500;
  let message = err.message || 'Failed to generate worksheet';

  if (status === 401 || status === 403) {
    status = 503;
    message = 'The AI service is unavailable right now. Please try again later.';
  } else if (status === 429) {
    message = 'The AI service is busy. Please try again in a moment.';
  } else if (status === 413) {
    status = 400;
    message = 'The image is too large to analyze. Try a smaller or clearer photo.';
  } else if (status >= 500 && status !== 502 && status !== 503) {
    status = 502;
    message = 'The AI service had a problem. Please try again.';
  }
  return res.status(status).json({ error: message });
}

// @route   POST /api/worksheets/generate
// @desc    Upload a photo of marked math work; diagnose misconceptions and
//          generate targeted practice questions.
// @access  Private (tutor or parent)
router.post(
  '/generate',
  protect,
  authorize('tutor', 'parent'),
  uploadWorksheet.single('work'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a photo of the marked work.' });
    }

    const { studentName, gradeLevel, topicHint, numQuestions } = req.body;

    try {
      const buffer = await fs.readFile(req.file.path);
      const imageBase64 = buffer.toString('base64');

      const result = await analyzeAndGenerateWorksheet({
        imageBase64,
        mimeType: req.file.mimetype,
        gradeLevel,
        topicHint,
        numQuestions
      });

      const worksheet = await Worksheet.create({
        userId: req.user.id,
        studentName: studentName ? String(studentName).slice(0, 100) : undefined,
        subject: 'Math',
        topic: result.topic,
        gradeLevel,
        sourceImageUrl: `/uploads/worksheets/${req.file.filename}`,
        overallSummary: result.overallSummary,
        misconceptions: Array.isArray(result.misconceptions) ? result.misconceptions : [],
        skillsToReinforce: Array.isArray(result.skillsToReinforce) ? result.skillsToReinforce : [],
        questions: Array.isArray(result.questions) ? result.questions : []
      });

      return res.status(201).json({ success: true, worksheet, readable: result.readable !== false });
    } catch (err) {
      return sendAiError(res, err);
    }
  }
);

// @route   GET /api/worksheets
// @desc    List the current user's generated worksheets (summary fields only)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const worksheets = await Worksheet.find({ userId: req.user.id })
      .select('studentName subject topic gradeLevel overallSummary createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, count: worksheets.length, worksheets });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/worksheets/:id
// @desc    Get a single worksheet with full questions
// @access  Private (owner only)
router.get('/:id', protect, async (req, res) => {
  try {
    const worksheet = await Worksheet.findOne({ _id: req.params.id, userId: req.user.id });
    if (!worksheet) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }
    return res.json({ success: true, worksheet });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/worksheets/:id
// @desc    Delete a worksheet
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const worksheet = await Worksheet.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!worksheet) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }
    return res.json({ success: true, message: 'Worksheet deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
