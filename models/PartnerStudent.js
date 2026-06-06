import mongoose from 'mongoose';

export const PARTNER_STUDENT_RELATIONSHIP_TYPES = [
  'enrolled',
  'pilot',
  'tuition',
  'student_care',
];

export const PARTNER_STUDENT_STATUSES = ['active', 'paused', 'ended', 'removed'];

const partnerStudentSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerOrganisation', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    relationshipType: { type: String, enum: PARTNER_STUDENT_RELATIONSHIP_TYPES, default: 'enrolled', index: true },
    status: { type: String, enum: PARTNER_STUDENT_STATUSES, default: 'active', index: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
  },
  { timestamps: true, collection: 'partner_students' }
);

partnerStudentSchema.index({ organisationId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('PartnerStudent', partnerStudentSchema);
