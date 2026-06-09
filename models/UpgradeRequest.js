import mongoose from 'mongoose';

// A parent's request to activate (or renew) Premium Home, paid by PayNow.
// The parent pays out-of-band; an admin verifies the payment the next business
// day and activates a 12-month access period. Status drives the pending queue.
const upgradeRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  planType: { type: String, default: 'parent_plus' },
  amountSgd: { type: Number, required: true, min: 0 },
  // Whether this was billed at the early-renewal (discounted) price.
  earlyRenewal: { type: Boolean, default: false },
  // The unique code the parent quotes in their PayNow comment so you can match it.
  reference: { type: String, required: true, unique: true, index: true },
  paymentMethod: { type: String, default: 'paynow' },
  status: { type: String, enum: ['pending', 'activated', 'rejected'], default: 'pending', index: true },
  note: { type: String, default: '' },
  activatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activatedAt: { type: Date, default: null },
  periodEnd: { type: Date, default: null }, // the access end date this request granted
  createdAt: { type: Date, default: Date.now },
});

upgradeRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('UpgradeRequest', upgradeRequestSchema);
