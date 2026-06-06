import mongoose from 'mongoose';

export const BILLING_USAGE_EVENT_TYPES = [
  'diagnostic_completed',
  'paper_uploaded',
  'worksheet_generated',
  'recovery_pack_assigned',
  'impact_report_generated',
  'impact_report_viewed',
  'staff_added',
  'student_added',
];

const billingUsageEventSchema = new mongoose.Schema(
  {
    ownerType: { type: String, enum: ['user', 'partner'], required: true, index: true },
    ownerId: { type: String, required: true, trim: true, index: true },
    eventType: { type: String, enum: BILLING_USAGE_EVENT_TYPES, required: true, index: true },
    quantity: { type: Number, default: 1, min: 1 },
    subjectId: { type: String, default: '', trim: true },
    domainId: { type: String, default: '', trim: true },
    sourceType: { type: String, default: '', trim: true },
    sourceId: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: 'billing_usage_events' }
);

billingUsageEventSchema.index({ ownerType: 1, ownerId: 1, eventType: 1, occurredAt: -1 });

export default mongoose.model('BillingUsageEvent', billingUsageEventSchema);
