import mongoose from 'mongoose';

// A recurring charge PAID BY THE TUTOR that settles to the agency's Stripe
// connected account (direct charge, platform application fee = 0 — the
// platform's margin is the wholesale licence). No refunds by design.
export const AGENCY_CHARGE_STATUSES = ['pending', 'succeeded', 'failed'];

const agencyTutorChargeSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerOrganisation', required: true, index: true },
    tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    agencyTutorPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgencyTutorPlan', default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SGD', trim: true },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    stripePaymentIntentId: { type: String, default: '', trim: true },
    connectAccountId: { type: String, default: '', trim: true }, // agency acct_… charged on
    applicationFee: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: AGENCY_CHARGE_STATUSES, default: 'pending', index: true },
  },
  { timestamps: true, collection: 'agency_tutor_charges' }
);

agencyTutorChargeSchema.index({ organisationId: 1, createdAt: -1 });
agencyTutorChargeSchema.index({ tutorUserId: 1, createdAt: -1 });

export default mongoose.model('AgencyTutorCharge', agencyTutorChargeSchema);
