import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import BillingPlan from '../models/BillingPlan.js';
import Subscription from '../models/Subscription.js';
import {
  checkFeatureAccess,
  ensureDefaultBillingPlans,
  getBillingContext,
  upsertSubscription,
} from '../services/billing/featureAccessService.js';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([BillingPlan.deleteMany({}), Subscription.deleteMany({})]);
});

describe('featureAccessService', () => {
  it('seeds default plans and blocks paper analysis on free plan', async () => {
    await ensureDefaultBillingPlans();
    const context = await getBillingContext({ ownerType: 'user', ownerId: 'user_1', role: 'parent' });

    expect(context.plan.planType).toBe('free');
    expect(checkFeatureAccess({ billingContext: context, feature: 'canUseDiagnostics' }).allowed).toBe(true);
    expect(checkFeatureAccess({ billingContext: context, feature: 'canUsePaperAnalysis' })).toMatchObject({
      allowed: false,
      message: 'This feature is not included in the current plan.',
    });
  });

  it('allows tutor lesson prep on tutor_pro subscriptions', async () => {
    const subscription = await upsertSubscription({
      ownerType: 'user',
      ownerId: 'tutor_1',
      planType: 'tutor_pro',
      status: 'active',
    });
    const context = await getBillingContext({ ownerType: 'user', ownerId: 'tutor_1', role: 'tutor' });

    expect(subscription.status).toBe('active');
    expect(checkFeatureAccess({ billingContext: context, feature: 'canUseTutorLessonPrep' }).allowed).toBe(true);
  });

  it('enforces student and staff limits', async () => {
    await upsertSubscription({
      ownerType: 'user',
      ownerId: 'parent_1',
      planType: 'parent_basic',
      status: 'active',
    });
    const context = await getBillingContext({ ownerType: 'user', ownerId: 'parent_1', role: 'parent' });

    expect(checkFeatureAccess({ billingContext: context, feature: 'canAddStudent', usage: { students: 1 } })).toMatchObject({
      allowed: false,
      reason: 'limit_reached',
    });
    expect(checkFeatureAccess({ billingContext: context, feature: 'canAddStaff', usage: { staff: 0 } })).toMatchObject({
      allowed: false,
      reason: 'limit_reached',
    });
  });

  it('applies active pilot override access', async () => {
    await upsertSubscription({
      ownerType: 'partner',
      ownerId: 'partner_1',
      planType: 'free',
      status: 'trial',
      pilotOverride: { type: 'internal_pilot', reason: 'Founder QA' },
    });
    const context = await getBillingContext({ ownerType: 'partner', ownerId: 'partner_1', role: 'pilot_partner' });

    expect(context.pilotOverrideActive).toBe(true);
    expect(checkFeatureAccess({ billingContext: context, feature: 'canUseTeacherMode' }).allowed).toBe(true);
    expect(checkFeatureAccess({ billingContext: context, feature: 'canAddStudent', usage: { students: 999 } }).allowed).toBe(true);
  });
});
