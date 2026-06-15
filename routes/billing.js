import crypto from 'crypto';
import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import { resolveEntitlements } from '../services/billing/entitlements.js';
import { upsertSubscription, DEFAULT_PLAN_CATALOG } from '../services/billing/featureAccessService.js';
import { getPremiumHomePricing, getPayNowDetails } from '../services/billing/premiumHomePricing.js';
import Subscription from '../models/Subscription.js';
import UpgradeRequest from '../models/UpgradeRequest.js';
import User from '../models/User.js';

const router = express.Router();

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Premium Home is a home (B2C) purchase paid to the company, so reconciling
// PayNow payments and activating access is a platform-admin task — not a school
// HOD's. This matches the frontend route guard (FeatureGuard feature="admin").
function isBillingAdmin(req) {
  return req.user?.role === 'admin';
}

// Short, human-readable reference a parent quotes in their PayNow comment.
function makeReference() {
  return `PH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Is this caller renewing early? Eligible for the discount when they currently
// hold active access whose remaining days fall within the early-renewal window.
function earlyRenewalEligible(entitlements, windowDays) {
  const r = entitlements?.renewal;
  return Boolean(r && r.active && !r.expired && r.daysLeft <= windowDays);
}

// Premium Home maps onto the parent_plus billing plan.
const PREMIUM_HOME_PLAN = 'parent_plus';
const TRIAL_PLAN = 'parent_plus'; // trial gives a taste of Premium Home

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey) : null;

function appBase() {
  return (process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

async function entitlementsFor(req) {
  return resolveEntitlements({ ownerType: 'user', ownerId: req.user.id, role: req.user.role || '' });
}

// GET /api/billing/me — the caller's current entitlements (incl. trial info).
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ entitlements: await entitlementsFor(req) });
}));

// POST /api/billing/start-trial — begin a 14-day Premium Home trial.
router.post('/start-trial', protect, asyncHandler(async (req, res) => {
  try {
    const current = await entitlementsFor(req);
    if (current.tier === 'premium_home' && current.status === 'active') {
      return res.status(400).json({ error: 'You already have an active plan.' });
    }
    await upsertSubscription({ ownerType: 'user', ownerId: req.user.id, planType: TRIAL_PLAN, status: 'trial' });
    res.json({ entitlements: await entitlementsFor(req) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not start trial.' });
  }
}));

// POST /api/billing/checkout/premium-home — create a Stripe Checkout session.
router.post('/checkout/premium-home', protect, asyncHandler(async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Billing is not configured on this server.', billingConfigured: false });
  }
  try {
    const plan = DEFAULT_PLAN_CATALOG[PREMIUM_HOME_PLAN];
    const billing = String(req.body?.billing || 'monthly');
    const amount = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const interval = billing === 'yearly' ? 'year' : 'month';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'sgd',
          unit_amount: Math.round(amount * 100),
          recurring: { interval },
          product_data: { name: `${plan.name} (${interval}ly)` },
        },
      }],
      success_url: `${appBase()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBase()}/parent`,
      client_reference_id: String(req.user.id),
      metadata: { userId: String(req.user.id), planType: PREMIUM_HOME_PLAN },
    });
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not start checkout.' });
  }
}));

// POST /api/billing/checkout/confirm — verify a completed session and activate.
// Used by the success page so activation works without a webhook in dev.
router.post('/checkout/confirm', protect, asyncHandler(async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Billing is not configured on this server.' });
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (String(session.metadata?.userId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'This checkout does not belong to your account.' });
    }
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(402).json({ error: 'Payment not completed yet.' });
    }
    await upsertSubscription({ ownerType: 'user', ownerId: req.user.id, planType: session.metadata?.planType || PREMIUM_HOME_PLAN, status: 'active' });
    res.json({ entitlements: await entitlementsFor(req) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not confirm checkout.' });
  }
}));

// POST /api/billing/dev/activate-premium-home — DEV ONLY shortcut so the upgrade
// flow is demoable without Stripe keys. Disabled in production.
router.post('/dev/activate-premium-home', protect, asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found.' });
  await upsertSubscription({ ownerType: 'user', ownerId: req.user.id, planType: PREMIUM_HOME_PLAN, status: 'active' });
  res.json({ entitlements: await entitlementsFor(req) });
}));

// ── Annual PayNow flow (primary parent path: prepaid yearly fee, no recurring) ──

// GET /api/billing/premium-home/offer — price + PayNow details + early-renewal
// eligibility for the current caller.
router.get('/premium-home/offer', protect, asyncHandler(async (req, res) => {
  const pricing = getPremiumHomePricing();
  const entitlements = await entitlementsFor(req);
  const early = earlyRenewalEligible(entitlements, pricing.earlyRenewalWindowDays);
  res.json({
    pricing,
    payNow: getPayNowDetails(),
    earlyRenewalEligible: early,
    amountSgd: early ? pricing.earlyRenewalSgd : pricing.annualSgd,
    renewal: entitlements.renewal || null,
    tier: entitlements.tier,
  });
}));

// POST /api/billing/premium-home/request — parent records that they will PayNow.
// Creates a pending request with a reference to quote; an admin activates it
// the next business day after confirming the payment landed.
router.post('/premium-home/request', protect, asyncHandler(async (req, res) => {
  try {
    const pricing = getPremiumHomePricing();
    const entitlements = await entitlementsFor(req);
    const early = earlyRenewalEligible(entitlements, pricing.earlyRenewalWindowDays);
    const amountSgd = early ? pricing.earlyRenewalSgd : pricing.annualSgd;

    // One open request at a time — reuse it so re-clicking doesn't spawn dupes.
    let request = await UpgradeRequest.findOne({ userId: req.user.id, status: 'pending' });
    if (!request) {
      const me = await User.findById(req.user.id).select('name email');
      request = await UpgradeRequest.create({
        userId: req.user.id,
        userName: me?.name || '',
        userEmail: me?.email || '',
        planType: PREMIUM_HOME_PLAN,
        amountSgd,
        earlyRenewal: early,
        reference: makeReference(),
        paymentMethod: 'paynow',
        status: 'pending',
      });
    }
    res.status(201).json({
      reference: request.reference,
      amountSgd: request.amountSgd,
      earlyRenewal: request.earlyRenewal,
      payNow: getPayNowDetails(),
      message: 'We’ll verify your PayNow payment the next business day and activate your access.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not create the upgrade request.' });
  }
}));

// GET /api/billing/premium-home/pending — admin queue of payments to verify.
router.get('/premium-home/pending', protect, asyncHandler(async (req, res) => {
  if (!isBillingAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });
  const pending = await UpgradeRequest.find({ status: 'pending' }).sort({ createdAt: 1 }).lean();
  res.json({ requests: pending });
}));

// POST /api/billing/premium-home/requests/:id/activate — admin confirms payment.
// Grants a 12-month period; an early renewal extends from the current end date.
router.post('/premium-home/requests/:id/activate', protect, asyncHandler(async (req, res) => {
  if (!isBillingAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });
  const request = await UpgradeRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  if (request.status !== 'pending') return res.status(400).json({ error: `Request already ${request.status}.` });

  const now = new Date();
  const existing = await Subscription.findOne({ ownerType: 'user', ownerId: String(request.userId) });
  const base = (existing && existing.status === 'active' && existing.currentPeriodEnd && new Date(existing.currentPeriodEnd) > now)
    ? new Date(existing.currentPeriodEnd) // early renewal stacks on top
    : now;
  const periodEnd = new Date(base.getTime() + YEAR_MS);

  await upsertSubscription({ ownerType: 'user', ownerId: String(request.userId), planType: request.planType, status: 'active' });
  await Subscription.updateOne(
    { ownerType: 'user', ownerId: String(request.userId) },
    { $set: { currentPeriodStart: now, currentPeriodEnd: periodEnd } }
  );

  request.status = 'activated';
  request.activatedByUserId = req.user.id;
  request.activatedAt = now;
  request.periodEnd = periodEnd;
  await request.save();

  res.json({ activated: true, userId: request.userId, periodEnd });
}));

// POST /api/billing/premium-home/requests/:id/reject — admin dismisses a request.
router.post('/premium-home/requests/:id/reject', protect, asyncHandler(async (req, res) => {
  if (!isBillingAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });
  const request = await UpgradeRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  request.status = 'rejected';
  request.note = String(req.body?.note || '');
  await request.save();
  res.json({ rejected: true });
}));

export default router;
