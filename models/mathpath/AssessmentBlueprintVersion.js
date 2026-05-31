import mongoose from 'mongoose';

const assessmentBlueprintVersionSchema = new mongoose.Schema({
  blueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentBlueprint', required: true, index: true },
  versionGroupId: { type: String, default: '', index: true },
  versionNumber: { type: Number, required: true, min: 1 },
  changeType: { type: String, enum: ['create', 'update', 'archive', 'duplicate', 'seed'], default: 'update' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true, collection: 'mathpath_assessment_blueprint_versions' });

assessmentBlueprintVersionSchema.index({ blueprintId: 1, versionNumber: -1 });
assessmentBlueprintVersionSchema.index({ versionGroupId: 1, versionNumber: -1 });

export default mongoose.model('AssessmentBlueprintVersion', assessmentBlueprintVersionSchema);
