// Cross-student common-mistakes aggregation over DiagnosedMisconception rows.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { commonMistakes } from './commonMistakes.js';
import DiagnosedMisconception from '../models/DiagnosedMisconception.js';

const owner = new mongoose.Types.ObjectId();
const otherOwner = new mongoose.Types.ObjectId();
const s1 = new mongoose.Types.ObjectId();
const s2 = new mongoose.Types.ObjectId();
const s3 = new mongoose.Types.ObjectId();

// Helper to insert a diagnosed misconception row.
const row = (o, student, topic, title, extra = {}) => ({
  ownerUserId: o, studentUserId: student, topic, title,
  normalizedKey: `${topic.toLowerCase()}::${title.toLowerCase()}`,
  evidence: extra.evidence || '', skills: extra.skills || [], createdAt: extra.createdAt || new Date(),
});

let mongo;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
beforeEach(async () => { await DiagnosedMisconception.deleteMany({}); });

describe('commonMistakes', () => {
  it('groups by misconception, counting occurrences and distinct students, ranked by frequency', async () => {
    await DiagnosedMisconception.insertMany([
      // "adds denominators" — 3 occurrences across 2 students (s1 twice, s2 once)
      row(owner, s1, 'Fractions', 'Adds denominators', { createdAt: new Date('2026-05-01') }),
      row(owner, s1, 'Fractions', 'Adds denominators', { createdAt: new Date('2026-05-10') }),
      row(owner, s2, 'Fractions', 'Adds denominators'),
      // "place value slip" — 1 occurrence, 1 student
      row(owner, s3, 'Decimals', 'Place value slip'),
      // a different owner's row must not bleed in
      row(otherOwner, s1, 'Fractions', 'Adds denominators'),
    ]);

    const rows = await commonMistakes({ ownerUserId: owner });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ title: 'Adds denominators', count: 3, studentCount: 2 }); // most frequent first
    expect(rows[1]).toMatchObject({ title: 'Place value slip', count: 1, studentCount: 1 });
  });

  it('scopes to the owner and supports a topic / student filter', async () => {
    await DiagnosedMisconception.insertMany([
      row(owner, s1, 'Fractions', 'Adds denominators'),
      row(owner, s2, 'Decimals', 'Place value slip'),
      row(owner, s1, 'Decimals', 'Place value slip'),
    ]);
    expect(await commonMistakes({ ownerUserId: otherOwner })).toEqual([]); // owner isolation
    const decimals = await commonMistakes({ ownerUserId: owner, topic: 'Decimals' });
    expect(decimals).toHaveLength(1);
    expect(decimals[0]).toMatchObject({ title: 'Place value slip', count: 2, studentCount: 2 });
    const justS1 = await commonMistakes({ ownerUserId: owner, studentUserId: s1 });
    expect(justS1.map((r) => r.title).sort()).toEqual(['Adds denominators', 'Place value slip']);
  });

  it('counts a null student (unlinked upload) as zero distinct students', async () => {
    await DiagnosedMisconception.insertMany([
      row(owner, null, 'Fractions', 'Adds denominators'),
      row(owner, null, 'Fractions', 'Adds denominators'),
    ]);
    const rows = await commonMistakes({ ownerUserId: owner });
    expect(rows[0]).toMatchObject({ count: 2, studentCount: 0 });
  });
});
