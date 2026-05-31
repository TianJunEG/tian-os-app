import mongoose from 'mongoose';

const OWNER_TYPES = ['parent', 'tutor', 'teacher'];
const TARGET_TYPES = ['student', 'class'];
const STATUS = ['draft', 'active', 'archived'];
const SOURCE = ['parentProvided', 'teacherProvided', 'tutorProvided', 'manual'];
const TEST_OUTPUT_MODES = ['quickCheck', 'topicTest', 'miniPaper', 'fullPaper', 'schoolAlignedMock'];

const topicRowSchema = new mongoose.Schema(
  {
    topicName: { type: String, default: '' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    domainId: { type: String, default: '' },
    skillIds: { type: [String], default: [] },
    marks: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
    includeWordProblems: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const assessmentSpecificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
    ownerType: { type: String, enum: OWNER_TYPES, required: true },
    targetType: { type: String, enum: TARGET_TYPES, required: true },
    targetStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    targetClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    level: { type: String, default: '' },
    subject: { type: String, default: 'Math' },
    paperType: { type: String, default: 'paper1' },
    totalMarks: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    calculatorAllowed: { type: Boolean, default: false },
    timed: { type: Boolean, default: true },
    source: { type: String, enum: SOURCE, default: 'manual' },
    status: { type: String, enum: STATUS, default: 'draft' },
    assessmentBlueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentBlueprint', default: null },
    outputMode: { type: String, enum: TEST_OUTPUT_MODES, default: 'topicTest' },
    topics: { type: [topicRowSchema], default: [] },
  },
  { timestamps: true, collection: 'mathpath_assessment_specifications' }
);

assessmentSpecificationSchema.index({ createdByUserId: 1, ownerType: 1, status: 1 });
assessmentSpecificationSchema.index({ workspaceId: 1, ownerType: 1, status: 1 });
assessmentSpecificationSchema.index({ targetStudentId: 1, status: 1 });
assessmentSpecificationSchema.index({ targetClassId: 1, status: 1 });

export default mongoose.model('AssessmentSpecification', assessmentSpecificationSchema);
