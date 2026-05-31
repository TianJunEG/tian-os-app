import mongoose from 'mongoose';

const distributionRowSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  value: { type: Number, required: true, min: 0 },
}, { _id: false });

const profileMapSchema = new mongoose.Schema({
  entries: { type: [distributionRowSchema], default: [] },
  notes: { type: String, default: '' },
}, { _id: false });

const schoolAssessmentProfileSchema = new mongoose.Schema({
  school: { type: String, required: true, trim: true },
  level: { type: String, required: true, trim: true },
  subject: { type: String, required: true, default: 'Math', trim: true },
  assessmentType: { type: String, default: '', trim: true },
  difficultyProfile: { type: profileMapSchema, default: () => ({ entries: [] }) },
  diagramProfile: { type: profileMapSchema, default: () => ({ entries: [] }) },
  questionStyleProfile: { type: profileMapSchema, default: () => ({ entries: [] }) },
  assessmentStyleProfile: { type: profileMapSchema, default: () => ({ entries: [] }) },
  sectionStructure: {
    type: [{
      name: String,
      marks: Number,
      questionCount: Number,
      questionTypes: [String],
    }],
    default: [],
  },
  difficultyDistribution: { type: [distributionRowSchema], default: [] },
  topicDistribution: { type: [distributionRowSchema], default: [] },
  questionStyleTendencies: { type: [distributionRowSchema], default: [] },
  sampleSize: { type: Number, default: 1, min: 1 },
  lastBlueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentBlueprint', default: null },
}, { timestamps: true, collection: 'mathpath_school_assessment_profiles' });

schoolAssessmentProfileSchema.index({ school: 1, level: 1, subject: 1, assessmentType: 1 }, { unique: true });

export default mongoose.model('SchoolAssessmentProfile', schoolAssessmentProfileSchema);
