import mongoose from 'mongoose';

export const PARTNER_ORGANISATION_TYPES = [
  'student_care',
  'tuition_centre',
  'school',
  'pilot_partner',
  'internal',
];

export const PARTNER_ORGANISATION_STATUSES = [
  'prospect',
  'pilot',
  'active',
  'paused',
  'archived',
];

const partnerOrganisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, enum: PARTNER_ORGANISATION_TYPES, required: true, index: true },
    status: { type: String, enum: PARTNER_ORGANISATION_STATUSES, default: 'prospect', index: true },
    contactName: { type: String, default: '', trim: true, maxlength: 120 },
    contactEmail: { type: String, default: '', trim: true, lowercase: true, maxlength: 180 },
    contactPhone: { type: String, default: '', trim: true, maxlength: 40 },
    address: { type: String, default: '', trim: true, maxlength: 500 },
    notes: { type: String, default: '', trim: true, maxlength: 4000 },
    // Stripe Connect (Gap B): tutor payments settle to the agency's own account.
    stripeConnectAccountId: { type: String, default: '', trim: true },
    connectStatus: { type: String, enum: ['not_started', 'onboarding', 'active', 'restricted'], default: 'not_started' },
    connectOnboardedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'partner_organisations' }
);

partnerOrganisationSchema.index({ name: 1 });
partnerOrganisationSchema.index({ status: 1, type: 1 });

export default mongoose.model('PartnerOrganisation', partnerOrganisationSchema);
