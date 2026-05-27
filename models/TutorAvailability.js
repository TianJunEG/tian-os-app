import mongoose from 'mongoose';

// One availability doc per tutor per workspace. MVP: a weekly slot list + a few
// unavailable dates. No booking/payment integration yet.
const slotSchema = new mongoose.Schema({
  day: { type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], required: true },
  start: { type: String, default: '16:00' },   // "HH:MM"
  end: { type: String, default: '18:00' },
  mode: { type: String, enum: ['online', 'home', 'centre', 'consult'], default: 'online' },
}, { _id: false });

const tutorAvailabilitySchema = new mongoose.Schema({
  tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  slots: { type: [slotSchema], default: [] },
  unavailableDates: { type: [Date], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

tutorAvailabilitySchema.index({ tutorUserId: 1, workspaceId: 1 }, { unique: true });

export default mongoose.model('TutorAvailability', tutorAvailabilitySchema);
