import mongoose from 'mongoose';

const INPUT_METHODS = ['paper', 'stylus', 'hybrid'];
const STATUS = ['pending', 'submitted', 'mapped', 'analysisReady'];
const ANALYSIS_STATUS = ['pending_analysis', 'analysed', 'needs_review', 'failed_analysis'];
const MAP_STATUS = ['unmapped', 'autoMapped', 'manuallyMapped', 'missing'];

const questionWorkingMapSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    workingCode: { type: String, default: '', trim: true },
    skillId: { type: String, default: '', trim: true },
    domainId: { type: String, default: '', trim: true },
    sessionId: { type: String, default: '', trim: true },
    exerciseId: { type: String, default: '', trim: true },
    pageNumber: { type: Number, default: null },
    detectedLabel: { type: String, default: '' },
    mappingStatus: { type: String, enum: MAP_STATUS, default: 'unmapped' },
    workingRequired: { type: Boolean, default: false },
    noWorkingRequiredChecked: { type: Boolean, default: false },
    workingReason: { type: String, default: '' },
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
    fileMetadata: {
      type: [
        {
          fileName: { type: String, default: '' },
          mimeType: { type: String, default: '' },
          sizeBytes: { type: Number, default: 0 },
          storageRef: { type: String, default: '' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    digitalInkData: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: STATUS, default: 'pending' },
    questionWorkingMap: { type: [questionWorkingMapSchema], default: [] },
    submittedByRole: { type: String, default: '' },
    submittedByUserId: { type: String, default: '' },
    submissionTimestamp: { type: Date, default: null },
    analysisStatus: { type: String, enum: ANALYSIS_STATUS, default: 'pending_analysis' },
    analysisEvidence: { type: [String], default: [] },
    analysisSummary: { type: String, default: '' },
    interventionRecommendation: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'mathpath_working_sessions' }
);

mathPathWorkingSessionSchema.index({ studentId: 1, domainId: 1 });
mathPathWorkingSessionSchema.index({ workingSessionId: 1 }, { unique: true });
mathPathWorkingSessionSchema.index({ practiceSessionId: 1 });
mathPathWorkingSessionSchema.index({ assessmentSessionId: 1 });
mathPathWorkingSessionSchema.index({ status: 1 });
mathPathWorkingSessionSchema.index({ analysisStatus: 1 });
mathPathWorkingSessionSchema.index({ 'questionWorkingMap.workingCode': 1 });

export default mongoose.model('MathPathWorkingSession', mathPathWorkingSessionSchema);
