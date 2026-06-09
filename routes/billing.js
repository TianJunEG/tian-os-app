import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import { resolveEntitlements } from '../services/billing/entitlements.js';
import { upsertSubscription, DEFAULT_PLAN_CATALOG } from '../services/billing/featureAccessService.js';

const router = express.Router();

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
router.get('/me', protect, async (req, res) => {
  res.json({ entitlements: await entitlementsFor(req) });
});

// POST /api/billing/start-trial — begin a 14-day Premium Home trial.
router.post('/start-trial', protect, async (req, res) => {
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
});

// POST /api/billing/checkout/premium-home — create a Stripe Checkout session.
router.post('/checkout/premium-home', protect, async (req, res) => {
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
});

// POST /api/billing/checkout/confirm — verify a completed session and activate.
// Used by the success page so activation works without a webhook in dev.
router.post('/checkout/confirm', protect, async (req, res) => {
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
});

// POST /api/billing/dev/activate-premium-home — DEV ONLY shortcut so the upgrade
// flow is demoable without Stripe keys. Disabled in production.
router.post('/dev/activate-premium-home', protect, async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found.' });
  await upsertSubscription({ ownerType: 'user', ownerId: req.user.id, planType: PREMIUM_HOME_PLAN, status: 'active' });
  res.json({ entitlements: await entitlementsFor(req) });
});

export default router;
