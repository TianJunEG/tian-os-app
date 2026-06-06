import mongoose from 'mongoose';

export const PARTNER_MEMBERSHIP_ROLES = [
  'owner',
  'manager',
  'student_care_staff',
  'tutor',
  'teacher',
  'admin',
];

export const PARTNER_MEMBERSHIP_STATUSES = ['active', 'invited', 'paused', 'removed'];

const partnerMembershipSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerOrganisation', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: PARTNER_MEMBERSHIP_ROLES, required: true, index: true },
    status: { type: String, enum: PARTNER_MEMBERSHIP_STATUSES, default: 'active', index: true },
  },
  { timestamps: true, collection: 'partner_memberships' }
);

partnerMembershipSchema.index({ organisationId: 1, userId: 1 }, { unique: true });

export default mongoose.model('PartnerMembership', partnerMembershipSchema);
