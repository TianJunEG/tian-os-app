// Verifies reconcileDomains.js's dry-run mode (preview only, no writes) and the
// real mode (data is migrated and student progress preserved). The migration is
// what fixes legacy "Place value to 100 000"-style records that the production
// brand-new-student recommendation dead-ends on.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import MasteryRecord from '../models/MasteryRecord.js';
import { main as reconcileDomains } from './reconcileDomains.js';

describe('reconcileDomains', () => {
  let mongo;
  const studentId = new mongoose.Types.ObjectId();
  const workspaceId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
    process.env.MONGODB_URI = mongo.getUri();
    await mongoose.connect(mongo.getUri());
  }, 60000);

  afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

  async function seedFixture() {
    await Promise.all([Subject.deleteMany({}), Topic.deleteMany({}), Skill.deleteMany({}), MasteryRecord.deleteMany({})]);
    const math = await Subject.create({ key: 'math', name: 'Maths' });
    const legacyTopic = await Topic.create({ subjectId: math._id, name: 'Number Fluency', order: 99 });
    const canonicalTopic = await Topic.create({ subjectId: math._id, name: 'Number Sense', order: 5 });
    // Exactly the production case: a legacy slug-less skill that maps to a canonical one in LEGACY_MAP.
    const legacySkill = await Skill.create({
      topicId: legacyTopic._id, name: 'Place value to 100 000', slug: '', metadata: {},
    });
    const canonicalSkill = await Skill.create({
      topicId: canonicalTopic._id, name: 'Place value to 100 000', slug: 'ns.pv.4-5-digit',
      metadata: { mathPathSkillId: 'NS-PV-01' },
    });
    // A student with progress on the legacy skill — the migration must move it.
    await MasteryRecord.create({ studentId, workspaceId, skillId: legacySkill._id, module: 'MathPath', score: 70, status: 'learning' });
    return { legacySkill, canonicalSkill, legacyTopic };
  }

  beforeEach(seedFixture);

  it('dry-run reports what would change without writing', async () => {
    const before = {
      skills: await Skill.countDocuments(),
      records: await MasteryRecord.countDocuments(),
      topics: await Topic.countDocuments(),
    };
    await reconcileDomains({ dryRun: true });

    expect(await Skill.countDocuments()).toBe(before.skills);
    expect(await MasteryRecord.countDocuments()).toBe(before.records);
    expect(await Topic.countDocuments()).toBe(before.topics);
    // The legacy skill is still there with its mastery record intact.
    const legacy = await Skill.findOne({ slug: '' });
    expect(legacy).not.toBeNull();
    expect(await MasteryRecord.findOne({ skillId: legacy._id })).not.toBeNull();
  });

  it('real run migrates legacy skill and preserves student progress', async () => {
    // beforeEach already seeded; grab the fixture refs by query
    const fixture = {
      legacySkill: await Skill.findOne({ slug: '' }),
      canonicalSkill: await Skill.findOne({ slug: 'ns.pv.4-5-digit' }),
      legacyTopic: await Topic.findOne({ name: 'Number Fluency' }),
    };
    await reconcileDomains({ dryRun: false });

    // Legacy skill is gone, canonical remains.
    expect(await Skill.findById(fixture.legacySkill._id)).toBeNull();
    expect(await Skill.findById(fixture.canonicalSkill._id)).not.toBeNull();
    // The student's mastery record was MOVED to the canonical skill (score preserved).
    const mr = await MasteryRecord.findOne({ studentId });
    expect(mr).not.toBeNull();
    expect(String(mr.skillId)).toBe(String(fixture.canonicalSkill._id));
    expect(mr.score).toBe(70);
    // Legacy topic was removed (it had only the one legacy skill).
    expect(await Topic.findById(fixture.legacyTopic._id)).toBeNull();
  });
});
