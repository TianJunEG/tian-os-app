import mongoose from 'mongoose';

export const BILLING_PLAN_TYPES = [
  'free',
  'parent_basic',
  'parent_plus',
  'tutor_pro',
  'student_care_pilot',
  'centre_pro',
  'school_pilot',
  'internal_admin',
];

export const BILLING_PLAN_STATUSES = ['draft', 'active', 'archived'];

const billingPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    planType: { type: String, enum: BILLING_PLAN_TYPES, required: true, unique: true, index: true },
    monthlyPrice: { type: Number, default: 0, min: 0 },
    yearlyPrice: { type: Number, default: 0, min: 0 },
    limits: { type: mongoose.Schema.Types.Mixed, default: {} },
    features: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: BILLING_PLAN_STATUSES, default: 'active', index: true },
  },
  { timestamps: true, collection: 'billing_plans' }
);

export default mongoose.model('BillingPlan', billingPlanSchema);
