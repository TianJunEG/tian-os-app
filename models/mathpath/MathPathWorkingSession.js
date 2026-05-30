import mongoose from 'mongoose';

const INPUT_METHODS = ['paper', 'stylus', 'hybrid'];
const STATUS = ['pending', 'submitted', 'mapped', 'analysisReady'];
const MAP_STATUS = ['unmapped', 'autoMapped', 'manuallyMapped', 'missing'];

const questionWorkingMapSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    pageNumber: { type: Number, default: null },
    detectedLabel: { type: String, default: '' },
    mappingStatus: { type: String, enum: MAP_STATUS, default: 'unmapped' },
    workingRequired: { type: Boolean, default: false },
    noWorkingRequiredChecked: { type: Boolean, default: false },
  },
  { _id: false }
);

const mathPathWorkingSessionSchema = new mongoose.Schema(
  {
    workingSessionId: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    practiceSessionId: { type: String, default: null },
    assessmentSessionId: { type: String, default: null },
    domainId: { type: String, required: true, trim: true },
    skillIds: { type: [String], default: [] },
    questionIds: { type: [String], default: [] },
    inputMethod: { type: String, enum: INPUT_METHODS, default: 'paper' },
    fileUrls: { type: [String], default: [] },
    digitalInkData: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: STATUS, default: 'pending' },
    questionWorkingMap: { type: [questionWorkingMapSchema], default: [] },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'mathpath_working_sessions' }
);

mathPathWorkingSessionSchema.index({ studentId: 1, domainId: 1 });
mathPathWorkingSessionSchema.index({ workingSessionId: 1 }, { unique: true });
mathPathWorkingSessionSchema.index({ practiceSessionId: 1 });
mathPathWorkingSessionSchema.index({ assessmentSessionId: 1 });
mathPathWorkingSessionSchema.index({ status: 1 });

export default mongoose.model('MathPathWorkingSession', mathPathWorkingSessionSchema);

