import { getBillingContext } from './featureAccessService.js';

// ── Product tiers ───────────────────────────────────────────────────────────
// The school product is sold as three account types. Each maps onto one or more
// underlying BillingPlan.planType values (which the billing/limits system already
// understands). This module is the single place the rest of the app asks
// "what can this account do?" in product terms, so UI and server agree.
//
//   School        → a school buys it; HOD/IT get an admin console, teachers get
//                   class dashboards, parents are invited free as VIEW-ONLY.
//   Premium Home  → a parent buys it; FULL parent dashboard incl. assign-practice.
//   Trial         → free/limited; PREVIEW parent dashboard, no per-skill flags or
//                   exportable reports; upsell to Premium Home / School.
export const PRODUCT_TIERS = Object.freeze({
  TRIAL: 'trial',
  PREMIUM_HOME: 'premium_home',
  SCHOOL: 'school',
});

const SCHOOL_PLAN_TYPES = new Set(['school_pilot', 'centre_pro', 'student_care_pilot', 'internal_admin']);
const PREMIUM_HOME_PLAN_TYPES = new Set(['parent_basic', 'parent_plus', 'tutor_pro']);

// Parent dashboard access level by tier.
export const PARENT_DASHBOARD = Object.freeze({
  NONE: 'none',
  PREVIEW: 'preview', // summary bands only, no per-skill drill-down, no assign
  VIEW_ONLY: 'view_only', // full read-only progress (school parents)
  FULL: 'full', // drill-down + assign practice (premium home)
});

export function tierForPlanType(planType = '') {
  if (SCHOOL_PLAN_TYPES.has(planType)) return PRODUCT_TIERS.SCHOOL;
  if (PREMIUM_HOME_PLAN_TYPES.has(planType)) return PRODUCT_TIERS.PREMIUM_HOME;
  return PRODUCT_TIERS.TRIAL; // free / unknown / no subscription
}

// The capability set every surface keys off. Derived from tier so there is one
// rule, not many scattered checks. `parentDashboard` is a level, the rest boolean.
export function capabilitiesForTier(tier, { role = '' } = {}) {
  const isSchool = tier === PRODUCT_TIERS.SCHOOL;
  const isPremiumHome = tier === PRODUCT_TIERS.PREMIUM_HOME;
  const isPaid = isSchool || isPremiumHome;

  let parentDashboard;
  if (isSchool) parentDashboard = PARENT_DASHBOARD.VIEW_ONLY;
  else if (isPremiumHome) parentDashboard = PARENT_DASHBOARD.FULL;
  else parentDashboard = PARENT_DASHBOARD.PREVIEW;

  return {
    // School-only management surfaces.
    schoolAdminConsole: isSchool,
    teacherDashboard: isSchool,
    bulkOnboarding: isSchool, // CSV roster import + join codes
    // Parent surfaces.
    parentDashboard,
    parentAssignPractice: isPremiumHome, // school parents are view-only
    inviteParents: isPaid, // school admins + premium-home parents can invite
    // Reports & remediation (gated to paid tiers).
    perSkillRemediationFlags: isPaid,
    exportableReports: isPaid,
  };
}

// Resolve the full entitlement picture for an account.
// ownerType/ownerId match the Subscription model (usually 'user' + userId, or
// 'partner' + orgId for school-level subscriptions). `role` informs the
// role-default plan when there is no subscription on record.
export async function resolveEntitlements({ ownerType = 'user', ownerId = '', role = '' } = {}) {
  const billingContext = await getBillingContext({ ownerType, ownerId, role });
  const plan = billingContext?.plan || {};
  const planType = plan.planType || 'free';
  const subscription = billingContext?.subscription || null;

  const now = Date.now();
  const windowInfo = (endValue) => {
    const endMs = new Date(endValue).getTime();
    if (!Number.isFinite(endMs)) return null;
    return { expired: endMs < now, endsAt: endValue, daysLeft: Math.max(0, Math.ceil((endMs - now) / 86400000)) };
  };

  let effectiveTier = tierForPlanType(planType);

  // Trial: an active trial grants the trialled plan's tier; once trialEnd passes
  // the account drops to the Trial tier (paid capabilities switch off).
  let trial = null;
  if (subscription && subscription.status === 'trial' && subscription.trialEnd) {
    const w = windowInfo(subscription.trialEnd);
    if (w) {
      trial = { active: !w.expired, expired: w.expired, endsAt: w.endsAt, daysLeft: w.daysLeft };
      if (w.expired) effectiveTier = PRODUCT_TIERS.TRIAL;
    }
  }

  // Paid annual access: a Premium Home year. When currentPeriodEnd passes, access
  // is hard-locked back to the Trial tier (paid features blocked immediately).
  // `renewal` powers reminder + early-renewal prompts before expiry.
  let renewal = null;
  if (subscription && subscription.status === 'active' && subscription.currentPeriodEnd) {
    const w = windowInfo(subscription.currentPeriodEnd);
    if (w) {
      renewal = { active: !w.expired, expired: w.expired, endsAt: w.endsAt, daysLeft: w.daysLeft };
      if (w.expired) effectiveTier = PRODUCT_TIERS.TRIAL;
    }
  }

  const capabilities = capabilitiesForTier(effectiveTier, { role });
  let status = subscription?.status || (billingContext?.source === 'subscription' ? 'active' : 'none');
  if (trial?.expired || renewal?.expired) status = 'expired';

  return {
    tier: effectiveTier,
    planType,
    planName: plan.name || '',
    source: billingContext?.source || 'role_default',
    status,
    trial,
    renewal,
    pilotOverrideActive: Boolean(billingContext?.pilotOverrideActive),
    limits: plan.limits || {},
    features: plan.features || {},
    capabilities,
  };
}

// Read a capability by dotted key. Booleans return as-is; `parentDashboard`
// returns its level string. Used by the middleware + tests.
export function hasCapability(entitlements, key) {
  const cap = entitlements?.capabilities || {};
  if (key === 'parentDashboard') return cap.parentDashboard && cap.parentDashboard !== PARENT_DASHBOARD.NONE;
  return Boolean(cap[key]);
}

export default {
  PRODUCT_TIERS,
  PARENT_DASHBOARD,
  tierForPlanType,
  capabilitiesForTier,
  resolveEntitlements,
  hasCapability,
};
