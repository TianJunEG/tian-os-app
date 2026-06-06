import User from '../../models/User.js';
import PartnerOrganisation from '../../models/PartnerOrganisation.js';
import Subscription from '../../models/Subscription.js';
import {
  buildFeatureAccessSummary,
  ensureDefaultBillingPlans,
  getBillingContext,
  upsertSubscription,
} from './featureAccessService.js';
import {
  compareUsageToLimits,
  getUsageSummary,
} from './usageTrackingService.js';

function shapeSubscription(subscription = null) {
  if (!subscription) return null;
  const raw = typeof subscription.toObject === 'function' ? subscription.toObject() : subscription;
  return {
    id: String(raw._id || raw.id || ''),
    ownerType: raw.ownerType,
    ownerId: raw.ownerId,
    status: raw.status,
    trialStart: raw.trialStart,
    trialEnd: raw.trialEnd,
    currentPeriodStart: raw.currentPeriodStart,
    currentPeriodEnd: raw.currentPeriodEnd,
    studentLimit: raw.studentLimit,
    staffLimit: raw.staffLimit,
    pilotOverride: raw.pilotOverride || null,
  };
}

async function billingRow({ ownerType, owner, role = '' }) {
  const ownerId = String(owner._id || owner.id);
  const [billingContext, usage] = await Promise.all([
    getBillingContext({ ownerType, ownerId, role }),
    getUsageSummary({ ownerType, ownerId }),
  ]);
  return {
    ownerType,
    ownerId,
    name: owner.name,
    email: owner.email || owner.contactEmail || '',
    role: owner.role || owner.type || role,
    status: owner.status || (owner.isActive === false ? 'inactive' : 'active'),
    plan: {
      name: billingContext.plan.name,
      planType: billingContext.plan.planType,
      monthlyPrice: billingContext.plan.monthlyPrice,
      yearlyPrice: billingContext.plan.yearlyPrice,
      limits: billingContext.plan.limits,
      features: billingContext.plan.features,
      source: billingContext.source,
    },
    subscription: shapeSubscription(billingContext.subscription),
    pilotOverrideActive: billingContext.pilotOverrideActive,
    usage,
    usageLimits: compareUsageToLimits(usage, billingContext.plan.limits),
    featureAccess: buildFeatureAccessSummary({ billingContext, usage }),
  };
}

export async function getAdminBillingOverview({ ownerType = '', limit = 30 } = {}) {
  const plans = await ensureDefaultBillingPlans();
  const rows = [];
  if (!ownerType || ownerType === 'user') {
    const users = await User.find({ role: { $in: ['parent', 'tutor', 'teacher', 'student_care', 'admin'] } })
      .select('name email role status isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit || 30))
      .lean();
    rows.push(...await Promise.all(users.map((user) => billingRow({ ownerType: 'user', owner: user, role: user.role }))));
  }
  if (!ownerType || ownerType === 'partner') {
    const partners = await PartnerOrganisation.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(Number(limit || 30))
      .lean();
    rows.push(...await Promise.all(partners.map((partner) => billingRow({ ownerType: 'partner', owner: partner, role: partner.type }))));
  }
  const subscriptions = await Subscription.countDocuments({});
  return {
    plans,
    subscriptions,
    rows,
    summary: {
      owners: rows.length,
      trial: rows.filter((row) => row.subscription?.status === 'trial').length,
      active: rows.filter((row) => row.subscription?.status === 'active').length,
      pilotOverrides: rows.filter((row) => row.pilotOverrideActive).length,
      overLimit: rows.filter((row) => row.usageLimits.some((limitRow) => !limitRow.withinLimit)).length,
    },
  };
}

export async function getPartnerBillingSummary(partnerId) {
  const partner = await PartnerOrganisation.findById(partnerId).lean();
  if (!partner) {
    const err = new Error('Partner not found.');
    err.status = 404;
    throw err;
  }
  return billingRow({ ownerType: 'partner', owner: partner, role: partner.type });
}

export async function setBillingSubscription(input = {}) {
  return upsertSubscription(input);
}

export default {
  getAdminBillingOverview,
  getPartnerBillingSummary,
  setBillingSubscription,
};
