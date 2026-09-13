import mongoose from 'mongoose';

// A flat comment under an announcement — by a parent, or the author (teacher/tutor)
// replying. Threaded discussion is intentionally kept flat for v1.
const announcementCommentSchema = new mongoose.Schema({
  announcementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, default: '' },
  authorRole: { type: String, default: '' }, // 'parent' | 'teacher' | 'tutor'
  content: { type: String, required: true, trim: true },
}, { timestamps: true, collection: 'announcement_comments' });

announcementCommentSchema.index({ announcementId: 1, createdAt: 1 });

export default mongoose.model('AnnouncementComment', announcementCommentSchema);
