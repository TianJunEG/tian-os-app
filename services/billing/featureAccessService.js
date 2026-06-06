import BillingPlan from '../../models/BillingPlan.js';
import Subscription from '../../models/Subscription.js';

export const DEFAULT_PLAN_CATALOG = {
  free: {
    name: 'Free',
    planType: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { students: 1, staff: 0, diagnosticsPerMonth: 2, paperUploadsPerMonth: 0, worksheetsPerMonth: 2, recoveryPacksPerMonth: 0, reportsPerMonth: 0 },
    features: { diagnostics: true, paperAnalysis: false, recoveryPacks: false, worksheets: true, tutorLessonPrep: false, studentCareDashboard: false, teacherMode: false, impactReports: false },
  },
  parent_basic: {
    name: 'Parent Basic',
    planType: 'parent_basic',
    monthlyPrice: 29,
    yearlyPrice: 290,
    limits: { students: 1, staff: 0, diagnosticsPerMonth: 6, paperUploadsPerMonth: 2, worksheetsPerMonth: 10, recoveryPacksPerMonth: 4, reportsPerMonth: 2 },
    features: { diagnostics: true, paperAnalysis: true, recoveryPacks: true, worksheets: true, tutorLessonPrep: false, studentCareDashboard: false, teacherMode: false, impactReports: true },
  },
  parent_plus: {
    name: 'Parent Plus',
    planType: 'parent_plus',
    monthlyPrice: 59,
    yearlyPrice: 590,
    limits: { students: 3, staff: 0, diagnosticsPerMonth: 15, paperUploadsPerMonth: 8, worksheetsPerMonth: 30, recoveryPacksPerMonth: 12, reportsPerMonth: 6 },
    features: { diagnostics: true, paperAnalysis: true, recoveryPacks: true, worksheets: true, tutorLessonPrep: false, studentCareDashboard: false, teacherMode: false, impactReports: true },
  },
  tutor_pro: {
    name: 'Tutor Pro',
    planType: 'tutor_pro',
    monthlyPrice: 99,
    yearlyPrice: 990,
    limits: { students: 25, staff: 1, diagnosticsPerMonth: 80, paperUploadsPerMonth: 40, worksheetsPerMonth: 120, recoveryPacksPerMonth: 80, reportsPerMonth: 25 },
    features: { diagnostics: true, paperAnalysis: true, recoveryPacks: true, worksheets: true, tutorLessonPrep: true, studentCareDashboard: false, teacherMode: false, impactReports: true },
  },
  student_care_pilot: {
    name: 'Student Care Pilot',
    planType: 'student_care_pilot',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    limits: { students: 80, staff: 8, diagnosticsPerMonth: 200, paperUploadsPerMonth: 120, worksheetsPerMonth: 250, recoveryPacksPerMonth: 180, reportsPerMonth: 80 },
    features: { diagnostics: true, paperAnalysis: true, recoveryPacks: true, worksheets: true, tutorLessonPrep: false, studentCareDashboard: true, teacherMode: false, impactReports: true },
  },
  centre_pro: {
    name: 'Centre Pro',
    planType: 'centre_pro',
    monthlyPrice: 399,
    yearlyPrice: 3990,
    limits: { students: 250, staff: 25, diagnosticsPerMonth: 800, paperUploadsPerMonth: 400, worksheetsPerMonth: 1000, recoveryPacksPerMonth: 700, reportsPerMonth: 250 },
    features: { diagnostics: true, paperAnalysis: true, recoveryPacks: true, worksheets: true, tutorLessonPrep: true, studentCareDashboard: true, teacherMode: false, impactReports: true },
  },
  school_pilot: {
    name: 'School Pilot',
    planType: 'school_pilot',
    monthlyPrice: 599,
    yearlyPrice: 5990,
    limits: { students: 500, staff: 60, diagnosticsPerMonth: 1600, paperUploadsPerMonth: 800, worksheetsPerMonth: 2000, recoveryPacksPerMonth: 1200, reportsPerMonth: 500 },
    features: { diagnostics: true, paperAnalysis: true, recoveryPacks: true, worksheets: true, tutorLessonPrep: false, studentCareDashboard: false, teacherMode: true, impactReports: true },
  },
  internal_admin: {
    name: 'Internal Admin',
    planType: 'internal_admin',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { students: null, staff: null, diagnosticsPerMonth: null, paperUploadsPerMonth: null, worksheetsPerMonth: null, recoveryPacksPerMonth: null, reportsPerMonth: null },
    features: { diagnostics: true, paperAnalysis: true, recoveryPacks: true, worksheets: true, tutorLessonPrep: true, studentCareDashboard: true, teacherMode: true, impactReports: true },
  },
};

const FEATURE_TO_KEY = {
  canUseDiagnostics: 'diagnostics',
  canUsePaperAnalysis: 'paperAnalysis',
  canAssignRecoveryPack: 'recoveryPacks',
  canUseWorksheetGenerator: 'worksheets',
  canUseTutorLessonPrep: 'tutorLessonPrep',
  canUseStudentCareDashboard: 'studentCareDashboard',
  canUseTeacherMode: 'teacherMode',
  canViewImpactReports: 'impactReports',
};

function nowMs() {
  return Date.now();
}

function isPilotOverrideActive(subscription = {}) {
  const type = subscription?.pilotOverride?.type || '';
  if (!type) return false;
  const expiresAt = subscription?.pilotOverride?.expiresAt ? new Date(subscription.pilotOverride.expiresAt).getTime() : null;
  return !expiresAt || expiresAt >= nowMs();
}

function fallbackPlanForRole(role = '') {
  if (role === 'admin') return DEFAULT_PLAN_CATALOG.internal_admin;
  if (role === 'tutor') return DEFAULT_PLAN_CATALOG.tutor_pro;
  if (role === 'teacher') return DEFAULT_PLAN_CATALOG.school_pilot;
  if (role === 'student_care') return DEFAULT_PLAN_CATALOG.student_care_pilot;
  return DEFAULT_PLAN_CATALOG.free;
}

function mergePlanAndSubscription(plan = {}, subscription = {}) {
  const raw = typeof plan?.toObject === 'function' ? plan.toObject() : plan;
  const sub = typeof subscription?.toObject === 'function' ? subscription.toObject() : subscription;
  const features = { ...(raw.features || {}), ...(sub.featureFlags || {}) };
  const limits = {
    ...(raw.limits || {}),
    ...(sub.studentLimit !== null && sub.studentLimit !== undefined ? { students: sub.studentLimit } : {}),
    ...(sub.staffLimit !== null && sub.staffLimit !== undefined ? { staff: sub.staffLimit } : {}),
  };
  if (isPilotOverrideActive(sub)) {
    Object.keys(features).forEach((key) => { features[key] = true; });
    Object.keys(limits).forEach((key) => {
      if (sub.pilotOverride.type === 'internal_pilot') limits[key] = null;
    });
  }
  return { ...raw, features, limits };
}

export async function ensureDefaultBillingPlans() {
  const ops = Object.values(DEFAULT_PLAN_CATALOG).map((plan) => ({
    updateOne: {
      filter: { planType: plan.planType },
      update: { $setOnInsert: plan },
      upsert: true,
    },
  }));
  if (ops.length) await BillingPlan.bulkWrite(ops, { ordered: false });
  return BillingPlan.find({}).sort({ monthlyPrice: 1 }).lean();
}

export async function getBillingContext({ ownerType = 'user', ownerId = '', role = '' } = {}) {
  const subscription = await Subscription.findOne({ ownerType, ownerId: String(ownerId || '') }).populate('planId').lean();
  if (subscription?.planId) {
    return {
      subscription,
      plan: mergePlanAndSubscription(subscription.planId, subscription),
      source: 'subscription',
      pilotOverrideActive: isPilotOverrideActive(subscription),
    };
  }
  return {
    subscription: null,
    plan: fallbackPlanForRole(role),
    source: 'role_default',
    pilotOverrideActive: false,
  };
}

export function checkFeatureAccess({ billingContext, feature, usage = {}, requested = 1 } = {}) {
  const plan = billingContext?.plan || DEFAULT_PLAN_CATALOG.free;
  const limitKey = {
    canAddStudent: 'students',
    canAddStaff: 'staff',
  }[feature];
  if (limitKey) {
    const limit = plan.limits?.[limitKey];
    const current = Number(usage?.[limitKey] || 0);
    if (limit !== null && limit !== undefined && current + Number(requested || 1) > Number(limit)) {
      return {
        allowed: false,
        reason: 'limit_reached',
        message: 'This plan has reached its current usage limit.',
        limit,
        current,
        planType: plan.planType,
      };
    }
    return { allowed: true, reason: 'within_limit', planType: plan.planType, limit, current };
  }
  const featureKey = FEATURE_TO_KEY[feature] || feature;
  const allowed = Boolean(plan.features?.[featureKey]);
  if (!allowed) {
    return {
      allowed: false,
      reason: 'feature_not_included',
      message: 'This feature is not included in the current plan.',
      planType: plan.planType,
    };
  }
  return { allowed: true, reason: 'included', planType: plan.planType };
}

export function buildFeatureAccessSummary({ billingContext, usage = {} } = {}) {
  return Object.keys(FEATURE_TO_KEY).reduce((acc, feature) => {
    acc[feature] = checkFeatureAccess({ billingContext, feature, usage });
    return acc;
  }, {
    canAddStudent: checkFeatureAccess({ billingContext, feature: 'canAddStudent', usage }),
    canAddStaff: checkFeatureAccess({ billingContext, feature: 'canAddStaff', usage }),
  });
}

export async function upsertSubscription({
  ownerType,
  ownerId,
  planType,
  status = 'trial',
  studentLimit,
  staffLimit,
  pilotOverride = {},
  updatedByUserId = '',
} = {}) {
  await ensureDefaultBillingPlans();
  const plan = await BillingPlan.findOne({ planType });
  if (!plan) {
    const err = new Error('Billing plan not found.');
    err.status = 404;
    throw err;
  }
  const override = pilotOverride?.type ? {
    type: pilotOverride.type,
    reason: pilotOverride.reason || '',
    expiresAt: pilotOverride.expiresAt || null,
    updatedByUserId,
    updatedAt: new Date(),
  } : undefined;
  const update = {
    planId: plan._id,
    status,
    ...(studentLimit !== undefined ? { studentLimit } : {}),
    ...(staffLimit !== undefined ? { staffLimit } : {}),
    ...(override ? { pilotOverride: override } : {}),
  };
  if (status === 'trial') {
    update.trialStart = new Date();
    update.trialEnd = pilotOverride?.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  } else if (status === 'active') {
    update.currentPeriodStart = new Date();
    update.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  return Subscription.findOneAndUpdate(
    { ownerType, ownerId: String(ownerId || '') },
    update,
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('planId').lean();
}

export default {
  DEFAULT_PLAN_CATALOG,
  ensureDefaultBillingPlans,
  getBillingContext,
  checkFeatureAccess,
  buildFeatureAccessSummary,
  upsertSubscription,
};
