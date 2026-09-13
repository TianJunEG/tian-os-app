import express from 'express';
import ELPathProgress from '../models/ELPathProgress.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const MODULES = ['cloze', 'vocab'];

router.use(protect);

router.get('/progress', asyncHandler(async (req, res) => {
  const { module } = req.query;
  if (!module || !MODULES.includes(module)) {
    return res.status(400).json({ error: `module must be one of: ${MODULES.join(', ')}` });
  }
  const doc = await ELPathProgress.findOne({ userId: req.user.id, module }).lean();
  res.json({ module, state: doc?.state ?? null, updatedAt: doc?.updatedAt ?? null });
}));

router.put('/progress', asyncHandler(async (req, res) => {
  const { module, state } = req.body;
  if (!module || !MODULES.includes(module)) {
    return res.status(400).json({ error: `module must be one of: ${MODULES.join(', ')}` });
  }
  if (state === undefined) {
    return res.status(400).json({ error: 'state is required' });
  }
  const doc = await ELPathProgress.findOneAndUpdate(
    { userId: req.user.id, module },
    { state, updatedAt: new Date() },
    { upsert: true, new: true },
  );
  res.json({ module, state: doc.state, updatedAt: doc.updatedAt });
}));

export default router;
