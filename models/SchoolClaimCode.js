import mongoose from 'mongoose';

// Two-email account-claim (resolved 2026-06-09): when a child's school account
// and a parent's account are separate logins, the school issues a short-lived
// code bound to the school student; the guardian redeems it to prove ownership,
// which establishes their guardianship of the school account. See §5.6.
export const CLAIM_CODE_STATUSES = ['active', 'redeemed', 'expired'];

function generateCode() {
  // Human-enterable: 8 chars, no ambiguous 0/O/1/I.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const schoolClaimCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true, default: generateCode },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    schoolUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // issuer (teacher/admin)
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerOrganisation', default: null },
    status: { type: String, enum: CLAIM_CODE_STATUSES, default: 'active', index: true },
    expiresAt: { type: Date, required: true },
    redeemedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    redeemedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'school_claim_codes' }
);

export { generateCode };
export default mongoose.model('SchoolClaimCode', schoolClaimCodeSchema);
