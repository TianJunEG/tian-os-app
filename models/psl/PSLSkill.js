import mongoose from 'mongoose';

const pslSkillSchema = new mongoose.Schema({
  skillId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  level: { type: String, required: true },
  heuristic: {
    type: String,
    enum: ['bar-model', 'find-pattern', 'substitution', 'make-list', 'guess-check', 'work-backwards'],
    required: true,
  },
  structure: { type: String, enum: ['partWhole', 'comparison', 'twoStep', 'beforeAfter', 'workBackwards', 'multiStep', 'guessCheck', 'ratio', 'dataInterpretation', 'excessShortage', 'comparisonMultiples', 'substitution', 'simultaneousChange'], default: null },
  planType: {
    type: String,
    enum: ['model', 'table_setup', 'equation_setup', 'list_candidates', 'guess_setup', 'reverse_steps'],
    default: 'model',
  },
  solveType: {
    type: String,
    enum: ['expression', 'twoStep', 'find_rule', 'eliminate', 'list_check', 'guess_table', 'reverse_chain'],
    default: 'expression',
  },
  unknownPosition: { type: String, default: '' },
  difficulty: { type: Number, default: 1, min: 1, max: 3 },
  mathPathPrerequisites: { type: [String], default: [] },
  pslPrerequisites: { type: [String], default: [] },
  mastery: {
    type: mongoose.Schema.Types.Mixed,
    default: { minimumAccuracy: 85, minimumQuestions: 10, speedGrace: 3.0 },
  },
  commonMisconceptions: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('PSLSkill', pslSkillSchema, 'psl_skills');
