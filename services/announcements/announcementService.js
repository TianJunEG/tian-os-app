import ClassStudent from '../../models/ClassStudent.js';
import StudentGuardian from '../../models/StudentGuardian.js';
import TutorStudentLink from '../../models/TutorStudentLink.js';
import AnnouncementComment from '../../models/AnnouncementComment.js';
import { notify } from '../notifications/notificationService.js';

// The active students an announcement targets.
async function studentIdsFor(a) {
  if (a.sourceType === 'class') {
    const links = await ClassStudent.find({ classId: a.sourceId, status: 'active' }).select('studentId').lean();
    return links.map((l) => l.studentId);
  }
  if (a.sourceType === 'tutor') {
    const links = await TutorStudentLink.find({ tutorUserId: a.sourceId, status: 'active' }).select('studentId').lean();
    return links.map((l) => l.studentId);
  }
  return [];
}

// Distinct guardian (parent) User ids who should receive an announcement.
export async function parentIdsForAnnouncement(a) {
  const studentIds = await studentIdsFor(a);
  if (!studentIds.length) return [];
  const guardians = await StudentGuardian.find({ studentId: { $in: studentIds } }).select('guardianUserId').lean();
  return [...new Set(guardians.map((g) => String(g.guardianUserId)).filter(Boolean))];
}

// The author, or a parent of a targeted student, may view/comment.
export async function canAccessAnnouncement(userId, a) {
  if (!a) return false;
  if (String(a.authorId) === String(userId)) return true;
  const parents = await parentIdsForAnnouncement(a);
  return parents.includes(String(userId));
}

export function publicAnnouncement(a) {
  return {
    announcementId: String(a._id),
    title: a.title,
    body: a.body || '',
    authorName: a.authorName || '',
    authorId: String(a.authorId),
    sourceType: a.sourceType,
    sourceId: String(a.sourceId),
    allowComments: a.allowComments !== false,
    commentCount: a.commentCount || 0,
    createdAt: a.createdAt,
  };
}

export function publicComment(c) {
  return {
    commentId: String(c._id),
    authorName: c.authorName || '',
    authorRole: c.authorRole || '',
    content: c.content,
    createdAt: c.createdAt,
  };
}

function authorLinkPath(a) {
  return a.sourceType === 'class'
    ? `/teacher/classes/${a.sourceId}/announcements`
    : '/tutor/announcements';
}

// Notify every targeted parent that a new announcement was posted.
export async function notifyNewAnnouncement(a) {
  const parentIds = await parentIdsForAnnouncement(a);
  await Promise.all(parentIds.map((pid) => notify({
    recipientUserId: pid,
    type: 'generic',
    title: `New announcement: ${a.title}`,
    body: String(a.body || '').slice(0, 140),
    linkPath: `/parent/announcements/${a._id}`,
    sourceType: 'announcement',
    sourceId: String(a._id),
  }).catch(() => {})));
}

// On a new comment, notify the author + everyone who has commented (except the commenter).
export async function notifyNewComment(a, comment, commenterId) {
  const commenters = await AnnouncementComment.find({ announcementId: a._id }).distinct('authorId');
  const recipients = new Set([String(a.authorId), ...commenters.map(String)]);
  recipients.delete(String(commenterId));
  const preview = `${comment.authorName || 'Someone'}: ${String(comment.content).slice(0, 100)}`;
  await Promise.all([...recipients].map((uid) => notify({
    recipientUserId: uid,
    type: 'generic',
    title: `New comment on "${a.title}"`,
    body: preview,
    linkPath: String(a.authorId) === uid ? authorLinkPath(a) : `/parent/announcements/${a._id}`,
    sourceType: 'announcement_comment',
    sourceId: String(comment._id),
  }).catch(() => {})));
}

export default {
  parentIdsForAnnouncement,
  canAccessAnnouncement,
  publicAnnouncement,
  publicComment,
  notifyNewAnnouncement,
  notifyNewComment,
};
