import mongoose from 'mongoose';

// One stroke of a lesson recording's timed ink stream. Append-only: one doc per
// completed stroke keeps writes cheap during capture. `stroke` reuses the
// frontend drawingUtils stroke shape ({ tool, colour, size, points:[{x,y,t}] }).
// tStartMs/tEndMs are offsets from the recording's start, so replay can sync
// ink to the audio clock.
const lessonInkEventSchema = new mongoose.Schema(
  {
    recordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonRecording', required: true, index: true },
    page: { type: Number, default: 0 },
    tStartMs: { type: Number, required: true, min: 0 },
    tEndMs: { type: Number, default: 0, min: 0 },
    seq: { type: Number, required: true },
    stroke: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: 'lesson_ink_events' }
);

lessonInkEventSchema.index({ recordingId: 1, seq: 1 });

export default mongoose.model('LessonInkEvent', lessonInkEventSchema);
