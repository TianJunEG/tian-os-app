import mongoose from 'mongoose';

// In-app notification record. N1 writes the in-app feed only; the weekly email
// digest (N2) and premium WhatsApp push (N3) layer on later over these same
// records (see TUTOR_DASHBOARD_ARCHITECTURE.md §6).
export const NOTIFICATION_TYPES = [
  'lesson_summary',
  'recording_ready',
  'trial_ending',
  'link_request',
  'generic',
];

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'whatsapp'];

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: '', trim: true, maxlength: 2000 },
    linkPath: { type: String, default: '', trim: true, maxlength: 500 },
    sourceType: { type: String, default: '', trim: true, maxlength: 80 },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    channels: { type: [String], default: ['in_app'] },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'notifications' }
);

notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
