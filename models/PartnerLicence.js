import mongoose from 'mongoose';

// Platform↔agency wholesale deal (set by platform admin only). Seats are bought
// in BLOCKS; an org may hold several active blocks whose seatCount sums to its
// entitlement. Exceeding seats is a hard block (buy another). See
// TUTOR_DASHBOARD_ARCHITECTURE.md §4.
export const LICENCE_PERIODS = ['monthly', 'annual'];
export const LICENCE_STATUSES = ['draft', 'active', 'paused', 'ended'];
export const LICENCE_PAYMENT_STATUSES = ['invoiced', 'paid', 'overdue'];

const partnerLicenceSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerOrganisation', required: true, index: true },
    seatCount: { type: Number, required: true, min: 1 },
    lumpSumAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SGD', trim: true },
    period: { type: String, enum: LICENCE_PERIODS, required: true },
    ratePerSeatSnapshot: { type: Number, default: 0, min: 0 }, // volume-negotiated; reference
    status: { type: String, enum: LICENCE_STATUSES, default: 'draft', index: true },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveTo: { type: Date, default: null },
    paymentStatus: { type: String, enum: LICENCE_PAYMENT_STATUSES, default: 'invoiced' },
    setByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: 'partner_licences' }
);

partnerLicenceSchema.index({ organisationId: 1, status: 1 });

export default mongoose.model('PartnerLicence', partnerLicenceSchema);
