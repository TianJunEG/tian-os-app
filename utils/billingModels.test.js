import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import BillingPlan from '../models/BillingPlan.js';
import Subscription from '../models/Subscription.js';

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

describe('billing models', () => {
  it('validates billing plan types and stores limits/features', async () => {
    const plan = await BillingPlan.create({
      name: 'Parent Plus',
      planType: 'parent_plus',
      monthlyPrice: 59,
      yearlyPrice: 590,
      limits: { students: 3 },
      features: { diagnostics: true },
    });

    expect(plan.planType).toBe('parent_plus');
    expect(plan.limits.students).toBe(3);
    await expect(BillingPlan.create({ name: 'Bad', planType: 'bad_plan' })).rejects.toThrow();
  });

  it('validates subscription owner, status and pilot override', async () => {
    const plan = await BillingPlan.create({ name: 'Free', planType: 'free' });
    const subscription = await Subscription.create({
      ownerType: 'user',
      ownerId: 'user_1',
      planId: plan._id,
      status: 'trial',
      pilotOverride: { type: 'free_pilot', reason: 'Pilot account' },
    });

    expect(subscription.ownerType).toBe('user');
    expect(subscription.pilotOverride.type).toBe('free_pilot');
    await expect(Subscription.create({
      ownerType: 'school',
      ownerId: 'owner_2',
      planId: plan._id,
    })).rejects.toThrow();
  });
});
