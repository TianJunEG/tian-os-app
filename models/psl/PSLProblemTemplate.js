import mongoose from 'mongoose';

const pslProblemTemplateSchema = new mongoose.Schema({
  templateId: { type: String, unique: true, required: true },
  skillId: { type: String, required: true, index: true },
  level: { type: String, default: 'P3' },
  heuristic: { type: String, default: 'bar-model' },
  structure: { type: String, enum: ['partWhole', 'comparison', 'twoStep', 'beforeAfter', 'workBackwards', 'multiStep', 'guessCheck', 'ratio', 'dataInterpretation', 'excessShortage', 'comparisonMultiples', 'substitution', 'simultaneousChange'], required: true },
  unknownPosition: { type: String, default: '' },
  operations: { type: [String], default: [] },
  difficulty: { type: Number, default: 1, min: 1, max: 3 },
  contexts: { type: [mongoose.Schema.Types.Mixed], default: [] },
  constraints: { type: mongoose.Schema.Types.Mixed, default: {} },
  storyTemplate: { type: String, required: true },
  solutionTemplate: { type: String, default: '' },
  scaffold: { type: mongoose.Schema.Types.Mixed, default: {} },
  misconceptions: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('PSLProblemTemplate', pslProblemTemplateSchema, 'psl_problem_templates');
