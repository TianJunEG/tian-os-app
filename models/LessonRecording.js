import mongoose from 'mongoose';

// A tutor's recorded lesson: timed vector ink (stored as LessonInkEvent docs)
// plus a single compressed audio object in R2. Scoped to the tutor workspace +
// student. Native recordings auto-expire after 1 month (expiresAt); parents can
// export an MP4 before then. See TUTOR_DASHBOARD_ARCHITECTURE.md §3.
export const RECORDING_STATUSES = ['recording', 'processing', 'ready', 'failed'];
export const RECORDING_VISIBILITY = ['private', 'shared_parent'];

const lessonRecordingSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    lessonNoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonNote', default: null },
    subjectId: { type: String, default: 'math', trim: true },
    domainId: { type: String, default: 'fractions', trim: true },
    status: { type: String, enum: RECORDING_STATUSES, default: 'recording', index: true },
    durationMs: { type: Number, default: 0, min: 0 },
    audioStorageKey: { type: String, default: '' }, // opaque R2 key, never a public URL
    audioMimeType: { type: String, default: 'audio/webm;codecs=opus' },
    canvasWidth: { type: Number, default: 1400 },
    canvasHeight: { type: Number, default: 900 },
    pageCount: { type: Number, default: 1, min: 1 },
    visibility: { type: String, enum: RECORDING_VISIBILITY, default: 'private', index: true },
    expiresAt: { type: Date, default: null, index: true }, // createdAt + 1 month; cron purges
  },
  { timestamps: true, collection: 'lesson_recordings' }
);

lessonRecordingSchema.index({ studentId: 1, createdAt: -1 });
lessonRecordingSchema.index({ tutorUserId: 1, workspaceId: 1, createdAt: -1 });

export default mongoose.model('LessonRecording', lessonRecordingSchema);
