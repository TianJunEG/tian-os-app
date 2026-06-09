// Gap B agency billing: seat accounting + agency-granted trials + tutor charges.
import PartnerLicence from '../../models/PartnerLicence.js';
import PartnerMembership from '../../models/PartnerMembership.js';
import AgencyTutorPlan from '../../models/AgencyTutorPlan.js';
import AgencyTutorCharge from '../../models/AgencyTutorCharge.js';
import Subscription from '../../models/Subscription.js';
import PartnerOrganisation from '../../models/PartnerOrganisation.js';
import { createDirectCharge } from '../payments/stripeConnect.js';

// Total licensed seats = sum of seatCount across the org's ACTIVE licence blocks.
export async function seatsTotal(organisationId) {
  const blocks = await PartnerLicence.find({ organisationId, status: 'active' });
  return blocks.reduce((sum, b) => sum + (b.seatCount || 0), 0);
}

// Seats consumed = active tutor memberships (a granted trial occupies a seat too,
// because the tutor is an active member while trialling).
export async function seatsUsed(organisationId) {
  return PartnerMembership.countDocuments({ organisationId, role: 'tutor', status: 'active' });
}

export async function seatSummary(organisationId) {
  const [total, used] = await Promise.all([seatsTotal(organisationId), seatsUsed(organisationId)]);
  return { seatsTotal: total, seatsUsed: used, seatsRemaining: Math.max(0, total - used) };
}

// True if the org can take on one more tutor (hard block when full).
export async function hasFreeSeat(organisationId) {
  const { seatsRemaining } = await seatSummary(organisationId);
  return seatsRemaining > 0;
}

// Put a tutor on an agency plan in trial. Reuses Subscription with provenance +
// the existing extended_trial pilot override. Throws on no free seat.
export async function grantTutorTrial({ organisationId, tutorUserId, plan, grantedByUserId }) {
  if (!(await hasFreeSeat(organisationId))) {
    const err = new Error('No free seats. Purchase another licence block before onboarding more tutors.');
    err.status = 409;
    throw err;
  }
  const trialEnd = new Date(Date.now() + (plan.trialDays || 0) * 86400000);
  const sub = await Subscription.findOneAndUpdate(
    { ownerType: 'user', ownerId: String(tutorUserId) },
    {
      $set: {
        status: 'trial',
        trialStart: new Date(),
        trialEnd,
        originOrganisationId: organisationId,
        agencyTutorPlanId: plan._id,
        pilotOverride: { type: 'extended_trial', reason: 'agency-granted trial', expiresAt: trialEnd, updatedByUserId: String(grantedByUserId || ''), updatedAt: new Date() },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return sub;
}

// Tutor self-pays to convert from trial → active. Creates a direct charge on the
// agency's connected account (config-gated) and an AgencyTutorCharge record.
export async function chargeTutor({ organisationId, tutorUserId }) {
  const org = await PartnerOrganisation.findById(organisationId);
  const sub = await Subscription.findOne({ ownerType: 'user', ownerId: String(tutorUserId) });
  if (!sub || String(sub.originOrganisationId) !== String(organisationId)) {
    const err = new Error('No agency subscription for this tutor.'); err.status = 404; throw err;
  }
  const plan = sub.agencyTutorPlanId ? await AgencyTutorPlan.findById(sub.agencyTutorPlanId) : null;
  if (!plan) { const err = new Error('Agency plan not found.'); err.status = 404; throw err; }
  if (!org?.stripeConnectAccountId || org.connectStatus !== 'active') {
    const err = new Error('Agency has not completed Stripe Connect onboarding.'); err.status = 409; throw err;
  }

  const periodStart = new Date();
  const periodEnd = new Date(Date.now() + (plan.period === 'annual' ? 365 : 30) * 86400000);
  const result = await createDirectCharge({
    accountId: org.stripeConnectAccountId,
    amount: plan.priceToTutor,
    currency: (plan.currency || 'SGD').toLowerCase(),
    description: `Tutor subscription — ${org.name}`,
  });

  const charge = await AgencyTutorCharge.create({
    organisationId,
    tutorUserId,
    subscriptionId: sub._id,
    agencyTutorPlanId: plan._id,
    amount: plan.priceToTutor,
    currency: plan.currency || 'SGD',
    periodStart,
    periodEnd,
    stripePaymentIntentId: result.paymentIntentId || '',
    connectAccountId: org.stripeConnectAccountId,
    applicationFee: 0,
    status: result.configured ? 'pending' : 'pending',
  });

  // Activate the subscription period (payment confirmation webhook would finalise
  // in production; here we advance optimistically for the self-pay flow).
  sub.status = 'active';
  sub.currentPeriodStart = periodStart;
  sub.currentPeriodEnd = periodEnd;
  await sub.save();

  return { charge, subscription: sub, clientSecret: result.clientSecret || null, stripeConfigured: result.configured };
}

export default { seatsTotal, seatsUsed, seatSummary, hasFreeSeat, grantTutorTrial, chargeTutor };
