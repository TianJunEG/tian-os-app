import express from 'express';
import { protect } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// User-scoped, NOT workspace-scoped: a parent's feed spans all their children
// across contexts, so notifications are keyed to the recipient user only.
const router = express.Router();
router.use(protect);

// GET /api/notifications — the caller's feed, newest first.
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const items = await Notification.find({ recipientUserId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ notifications: items });
}));

// GET /api/notifications/unread-count — badge count.
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipientUserId: req.user.id,
    readAt: null,
  });
  res.json({ count });
}));

// POST /api/notifications/:id/read — mark one read. Scoped to the caller so a
// 404 (not a 403) is returned for another user's id, leaking nothing.
router.post('/:id/read', asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientUserId: req.user.id },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found.' });
  }
  res.json({ notification });
}));

export default router;
