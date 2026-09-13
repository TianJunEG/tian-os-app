import mongoose from 'mongoose';

// A teacher/tutor post to the parents of a class (or a tutor's students). Parents
// can comment if allowComments. sourceType/sourceId decide who receives it:
//   class → sourceId = classId  (parents of active students in that class)
//   tutor → sourceId = tutorUserId (parents of that tutor's active students)
const announcementSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  authorId: { type: String, required: true }, // teacher/tutor User id
  authorName: { type: String, default: '' }, // snapshot for display
  sourceType: { type: String, enum: ['class', 'tutor'], required: true },
  sourceId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  allowComments: { type: Boolean, default: true },
  commentCount: { type: Number, default: 0 },
  status: { type: String, enum: ['published'], default: 'published' },
}, { timestamps: true, collection: 'announcements' });

announcementSchema.index({ sourceType: 1, sourceId: 1, createdAt: -1 });
announcementSchema.index({ workspaceId: 1, authorId: 1, createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
