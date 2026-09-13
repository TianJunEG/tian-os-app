import express from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Announcement from '../models/Announcement.js';
import AnnouncementComment from '../models/AnnouncementComment.js';
import StudentGuardian from '../models/StudentGuardian.js';
import ClassStudent from '../models/ClassStudent.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import User from '../models/User.js';
import {
  canAccessAnnouncement,
  notifyNewComment,
  publicAnnouncement,
  publicComment,
} from '../services/announcements/announcementService.js';

// Reader/commenter side (parents + the author). Auth by user id + guardian link —
// NOT workspace-scoped, since a parent lives in their own workspace.
const router = express.Router();
router.use(protect);

// Feed: announcements for every class/tutor my children are linked to.
router.get('/', asyncHandler(async (req, res) => {
  const guardianLinks = await StudentGuardian.find({ guardianUserId: req.user.id }).select('studentId').lean();
  const studentIds = guardianLinks.map((g) => g.studentId);
  if (!studentIds.length) return res.json({ announcements: [] });
  const [classLinks, tutorLinks] = await Promise.all([
    ClassStudent.find({ studentId: { $in: studentIds }, status: 'active' }).select('classId').lean(),
    TutorStudentLink.find({ studentId: { $in: studentIds }, status: 'active' }).select('tutorUserId').lean(),
  ]);
  const classIds = [...new Set(classLinks.map((c) => String(c.classId)))];
  const tutorIds = [...new Set(tutorLinks.map((t) => String(t.tutorUserId)))];
  const list = await Announcement.find({
    $or: [
      { sourceType: 'class', sourceId: { $in: classIds } },
      { sourceType: 'tutor', sourceId: { $in: tutorIds } },
    ],
  }).sort({ createdAt: -1 }).limit(50).lean();
  return res.json({ announcements: list.map(publicAnnouncement) });
}));

// One announcement + its comments (author or a linked parent).
router.get('/:id', asyncHandler(async (req, res) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Announcement not found.' });
  if (!(await canAccessAnnouncement(req.user.id, a))) return res.status(403).json({ error: 'This announcement is not available to you.' });
  const comments = await AnnouncementComment.find({ announcementId: a._id }).sort({ createdAt: 1 }).lean();
  return res.json({ announcement: publicAnnouncement(a), comments: comments.map(publicComment) });
}));

// Post a comment (parent, or the author replying).
router.post('/:id/comments', asyncHandler(async (req, res) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Announcement not found.' });
  if (a.allowComments === false) return res.status(403).json({ error: 'Comments are turned off for this announcement.' });
  if (!(await canAccessAnnouncement(req.user.id, a))) return res.status(403).json({ error: 'This announcement is not available to you.' });
  const content = String(req.body?.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Write a comment first.' });

  const isAuthor = String(a.authorId) === String(req.user.id);
  const user = await User.findById(req.user.id).select('name');
  const comment = await AnnouncementComment.create({
    announcementId: a._id,
    authorId: req.user.id,
    authorName: user?.name || (isAuthor ? 'Teacher' : 'Parent'),
    authorRole: isAuthor ? (a.sourceType === 'tutor' ? 'tutor' : 'teacher') : 'parent',
    content: content.slice(0, 2000),
  });
  await Announcement.updateOne({ _id: a._id }, { $inc: { commentCount: 1 } });
  notifyNewComment(a, comment, req.user.id).catch(() => {});
  return res.status(201).json({ comment: publicComment(comment) });
}));

export default router;
