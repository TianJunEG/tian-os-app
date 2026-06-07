import mongoose from 'mongoose';

export const MISCONCEPTION_ASSET_STATUS = [
  'draft',
  'ready',
  'retired',
];

const workedExampleSchema = new mongoose.Schema(
  {
    incorrectMethod: { type: String, default: '' },
    whyIncorrect: { type: String, default: '' },
    correctMethod: { type: String, default: '' },
    visualExplanation: { type: String, default: '' },
    keyTakeaway: { type: String, default: '' },
  },
  { _id: false }
);

const misconceptionAssetSchema = new mongoose.Schema(
  {
    misconceptionId: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    explanation: { type: String, required: true },
    visualModelType: { type: String, default: '', trim: true },
    workedExample: { type: workedExampleSchema, default: () => ({}) },
    guidedPracticeIds: { type: [String], default: [] },
    independentPracticeIds: { type: [String], default: [] },
    recheckQuestionIds: { type: [String], default: [] },
    status: { type: String, enum: MISCONCEPTION_ASSET_STATUS, default: 'draft', index: true },
  },
  { timestamps: true, collection: 'mathpath_misconception_assets' }
);

export default mongoose.model('MisconceptionAsset', misconceptionAssetSchema);
