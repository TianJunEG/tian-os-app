import mongoose from 'mongoose';

export const SUBSCRIPTION_OWNER_TYPES = ['user', 'partner'];
export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'paused', 'cancelled', 'expired'];
export const PILOT_OVERRIDE_TYPES = ['', 'internal_pilot', 'free_pilot', 'paid_pilot', 'extended_trial'];

const subscriptionSchema = new mongoose.Schema(
  {
    ownerType: { type: String, enum: SUBSCRIPTION_OWNER_TYPES, required: true, index: true },
    ownerId: { type: String, required: true, trim: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillingPlan', required: true, index: true },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: 'trial', index: true },
    trialStart: { type: Date, default: null },
    trialEnd: { type: Date, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    studentLimit: { type: Number, default: null, min: 0 },
    staffLimit: { type: Number, default: null, min: 0 },
    featureFlags: { type: mongoose.Schema.Types.Mixed, default: {} },
    pilotOverride: {
      type: { type: String, enum: PILOT_OVERRIDE_TYPES, default: '' },
      reason: { type: String, default: '', trim: true },
      expiresAt: { type: Date, default: null },
      updatedByUserId: { type: String, default: '', trim: true },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true, collection: 'subscriptions' }
);

subscriptionSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
