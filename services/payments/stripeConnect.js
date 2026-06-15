// Stripe Connect for agency→tutor billing. Config-gated: if STRIPE_SECRET_KEY
// isn't set, every function no-ops/returns a stub so the rest of Gap B works
// without live Stripe (mirrors the R2/WhatsApp pattern). The Stripe SDK is
// imported lazily so the module loads even when 'stripe' isn't installed.
//
// Agencies are Express connected accounts; tutor charges are DIRECT charges on
// the connected account with application_fee_amount = 0 (platform takes nothing
// here — its margin is the wholesale licence).

let _stripePromise = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function getStripe() {
  if (!isStripeConfigured()) return null;
  if (!_stripePromise) {
    // Pin the API version to Stripe SDK v11's default so the v22 SDK upgrade
    // is behavior-preserving for Connect accounts/charges.
    _stripePromise = import('stripe').then((m) => new m.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' }));
  }
  return _stripePromise;
}

// Create (or return) an Express connected account for the agency.
export async function createConnectedAccount({ email, name } = {}) {
  const stripe = await getStripe();
  if (!stripe) return { configured: false, accountId: '' };
  const account = await stripe.accounts.create({
    type: 'express',
    email: email || undefined,
    business_profile: name ? { name } : undefined,
    capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
  });
  return { configured: true, accountId: account.id };
}

// Hosted onboarding link the agency completes to activate payouts.
export async function createOnboardingLink({ accountId, refreshUrl, returnUrl } = {}) {
  const stripe = await getStripe();
  if (!stripe) return { configured: false, url: '' };
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return { configured: true, url: link.url };
}

// True once the connected account can accept charges + payouts.
export async function getAccountStatus(accountId) {
  const stripe = await getStripe();
  if (!stripe) return { configured: false, active: false };
  const acct = await stripe.accounts.retrieve(accountId);
  return { configured: true, active: Boolean(acct.charges_enabled && acct.payouts_enabled) };
}

// Direct charge on the agency's connected account; platform fee = 0.
export async function createDirectCharge({ accountId, amount, currency = 'sgd', description } = {}) {
  const stripe = await getStripe();
  if (!stripe) return { configured: false, paymentIntentId: '' };
  const intent = await stripe.paymentIntents.create(
    {
      amount: Math.round(amount * 100),
      currency,
      description,
      application_fee_amount: 0,
      automatic_payment_methods: { enabled: true },
    },
    { stripeAccount: accountId },
  );
  return { configured: true, paymentIntentId: intent.id, clientSecret: intent.client_secret };
}

export default { isStripeConfigured, createConnectedAccount, createOnboardingLink, getAccountStatus, createDirectCharge };
