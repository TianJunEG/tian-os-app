import mongoose from 'mongoose';

// What an agency charges ITS tutors (agency owner/manager sets this). The agency
// keeps the margin between this price and its wholesale licence cost. Trials are
// granted freely since seats are prepaid via PartnerLicence.
export const AGENCY_PLAN_PERIODS = ['monthly', 'annual'];
export const AGENCY_PLAN_STATUSES = ['active', 'archived'];

const agencyTutorPlanSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerOrganisation', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    priceToTutor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SGD', trim: true },
    period: { type: String, enum: AGENCY_PLAN_PERIODS, default: 'monthly' },
    trialDays: { type: Number, default: 14, min: 0 },
    status: { type: String, enum: AGENCY_PLAN_STATUSES, default: 'active', index: true },
  },
  { timestamps: true, collection: 'agency_tutor_plans' }
);

export default mongoose.model('AgencyTutorPlan', agencyTutorPlanSchema);
