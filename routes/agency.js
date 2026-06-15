import express from 'express';
import { protect } from '../middleware/auth.js';
import PartnerOrganisation from '../models/PartnerOrganisation.js';
import PartnerMembership from '../models/PartnerMembership.js';
import AgencyTutorPlan from '../models/AgencyTutorPlan.js';
import AgencyTutorCharge from '../models/AgencyTutorCharge.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { getUserPartnerMemberships } from '../services/partners/partnerAccessService.js';
import { seatSummary, grantTutorTrial, chargeTutor } from '../services/billing/agencyBillingService.js';
import { createConnectedAccount, createOnboardingLink, getAccountStatus } from '../services/payments/stripeConnect.js';

const router = express.Router();
router.use(protect);

// Resolve the org the caller administers (owner/manager). 403 if none.
async function requireAgencyAdmin(req, res) {
  const memberships = await getUserPartnerMemberships(req.user.id);
  const admin = memberships.find((m) => ['owner', 'manager', 'admin'].includes(m.role));
  if (!admin) { res.status(403).json({ error: 'Not an agency administrator.' }); return null; }
  const org = await PartnerOrganisation.findById(admin.organisationId);
  if (!org) { res.status(404).json({ error: 'Organisation not found.' }); return null; }
  return org;
}

// ── Agency admin ─────────────────────────────────────────────────────────

// GET /api/agency/overview — seats + connect status + tutor count.
router.get('/overview', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  const seats = await seatSummary(org._id);
  res.json({
    organisation: { id: org._id, name: org.name, type: org.type, status: org.status },
    seats,
    connect: { status: org.connectStatus, accountId: org.stripeConnectAccountId ? 'set' : '' },
  });
}));

// GET /api/agency/tutors — roster with plan + subscription status.
router.get('/tutors', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  const members = await PartnerMembership.find({ organisationId: org._id, role: 'tutor', status: 'active' }).lean();
  const tutors = await Promise.all(members.map(async (m) => {
    const [user, sub] = await Promise.all([
      User.findById(m.userId).select('name email').lean(),
      Subscription.findOne({ ownerType: 'user', ownerId: String(m.userId) }).lean(),
    ]);
    return {
      userId: m.userId,
      name: user?.name || '',
      email: user?.email || '',
      subscriptionStatus: sub?.status || 'none',
      trialEnd: sub?.trialEnd || null,
      onAgencyPlan: String(sub?.originOrganisationId || '') === String(org._id),
    };
  }));
  res.json({ tutors });
}));

// GET/POST /api/agency/tutor-plans — what the agency charges its tutors.
router.get('/tutor-plans', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  const plans = await AgencyTutorPlan.find({ organisationId: org._id }).sort({ createdAt: -1 });
  res.json({ plans });
}));
router.post('/tutor-plans', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  const b = req.body || {};
  if (!b.name || b.priceToTutor == null) return res.status(400).json({ error: 'name and priceToTutor are required.' });
  const plan = await AgencyTutorPlan.create({
    organisationId: org._id,
    name: b.name,
    priceToTutor: b.priceToTutor,
    currency: b.currency || 'SGD',
    period: b.period === 'annual' ? 'annual' : 'monthly',
    trialDays: b.trialDays != null ? b.trialDays : 14,
  });
  res.status(201).json({ plan });
}));

// POST /api/agency/tutors/:tutorUserId/grant-trial — seat-checked.
router.post('/tutors/:tutorUserId/grant-trial', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  const plan = await AgencyTutorPlan.findOne({ _id: req.body?.planId, organisationId: org._id });
  if (!plan) return res.status(404).json({ error: 'Plan not found.' });
  try {
    const subscription = await grantTutorTrial({ organisationId: org._id, tutorUserId: req.params.tutorUserId, plan, grantedByUserId: req.user.id });
    res.status(201).json({ subscription });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}));

// Stripe Connect onboarding for the agency.
router.post('/connect/onboard', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  try {
    if (!org.stripeConnectAccountId) {
      const created = await createConnectedAccount({ email: org.contactEmail, name: org.name });
      if (!created.configured) return res.status(503).json({ error: 'Stripe is not configured on this deployment.' });
      org.stripeConnectAccountId = created.accountId;
      org.connectStatus = 'onboarding';
      await org.save();
    }
    const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const link = await createOnboardingLink({
      accountId: org.stripeConnectAccountId,
      refreshUrl: `${base}/agency/connect`,
      returnUrl: `${base}/agency/connect?done=1`,
    });
    res.json({ url: link.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}));

router.get('/connect/status', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  if (!org.stripeConnectAccountId) return res.json({ status: org.connectStatus });
  try {
    const { configured, active } = await getAccountStatus(org.stripeConnectAccountId);
    if (configured && active && org.connectStatus !== 'active') {
      org.connectStatus = 'active'; org.connectOnboardedAt = new Date(); await org.save();
    }
    res.json({ status: org.connectStatus, active });
  } catch (e) {
    res.json({ status: org.connectStatus, error: e.message });
  }
}));

// GET /api/agency/charges — money the agency collects from its tutors.
router.get('/charges', asyncHandler(async (req, res) => {
  const org = await requireAgencyAdmin(req, res); if (!org) return;
  const charges = await AgencyTutorCharge.find({ organisationId: org._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ charges });
}));

// ── Tutor self-service ─────────────────────────────────────────────────────

// GET /api/agency/membership — the tutor's own agency/plan/trial status.
router.get('/membership', asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ ownerType: 'user', ownerId: String(req.user.id) }).lean();
  if (!sub?.originOrganisationId) return res.json({ membership: null });
  const [org, plan] = await Promise.all([
    PartnerOrganisation.findById(sub.originOrganisationId).select('name').lean(),
    sub.agencyTutorPlanId ? AgencyTutorPlan.findById(sub.agencyTutorPlanId).lean() : null,
  ]);
  const daysLeft = sub.trialEnd ? Math.max(0, Math.ceil((new Date(sub.trialEnd).getTime() - Date.now()) / 86400000)) : null;
  res.json({ membership: { organisation: org?.name || '', status: sub.status, trialEnd: sub.trialEnd, daysLeft, price: plan?.priceToTutor ?? null, currency: plan?.currency || 'SGD', period: plan?.period || 'monthly' } });
}));

// POST /api/agency/membership/pay — tutor self-pays to convert trial → active.
router.post('/membership/pay', asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ ownerType: 'user', ownerId: String(req.user.id) }).lean();
  if (!sub?.originOrganisationId) return res.status(404).json({ error: 'No agency subscription to pay.' });
  try {
    const result = await chargeTutor({ organisationId: sub.originOrganisationId, tutorUserId: req.user.id });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}));

export default router;
