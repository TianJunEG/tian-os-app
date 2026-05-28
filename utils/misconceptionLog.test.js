// Per-student misconception logging from the AI analyze result. Pure shaping is
// tested without a DB; the persistence round-trip uses an in-memory Mongo.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { buildMisconceptionDocs, normalizeKey, logDiagnosedMisconceptions } from './misconceptionLog.js';
import DiagnosedMisconception from '../models/DiagnosedMisconception.js';

const owner = new mongoose.Types.ObjectId();
const student = new mongoose.Types.ObjectId();
const worksheet = new mongoose.Types.ObjectId();

const result = {
  topic: 'Ordering Fractions',
  skillsToReinforce: ['Comparing fractions', 'Common denominators'],
  misconceptions: [
    { title: 'Adds denominators', description: 'Adds numerators and denominators.', evidence: '1/2 + 1/3 = 2/5' },
    { title: 'Improper conversion', description: 'Mishandles 5/3.', evidence: 'wrote 5/3 as 1 2/3 wrongly' },
    { title: '', description: '' }, // empty → skipped
  ],
};

describe('buildMisconceptionDocs (pure)', () => {
  it('shapes one doc per non-empty misconception with owner/student/worksheet context', () => {
    const docs = buildMisconceptionDocs({ result, ownerUserId: owner, studentUserId: student, studentName: 'Ada', worksheetId: worksheet });
    expect(docs).toHaveLength(2); // the empty one is dropped
    expect(docs[0]).toMatchObject({
      ownerUserId: owner, studentUserId: student, studentName: 'Ada', worksheetId: worksheet,
      subject: 'Math', topic: 'Ordering Fractions', title: 'Adds denominators',
      source: 'worksheet-photo',
    });
    expect(docs[0].skills).toEqual(['Comparing fractions', 'Common denominators']);
    expect(docs[0].normalizedKey).toBe('ordering fractions::adds denominators');
  });

  it('defaults the title and tolerates a missing misconceptions array', () => {
    expect(buildMisconceptionDocs({ result: {}, ownerUserId: owner })).toEqual([]);
    const docs = buildMisconceptionDocs({ result: { misconceptions: [{ description: 'no title here' }] }, ownerUserId: owner });
    expect(docs[0].title).toBe('Misconception');
  });

  it('normalizeKey lowercases and collapses whitespace', () => {
    expect(normalizeKey('Ordering   Fractions', '  Adds  Denominators ')).toBe('ordering fractions::adds denominators');
  });
});

describe('logDiagnosedMisconceptions (in-memory Mongo)', () => {
  let mongo;
  beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
  afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
  beforeEach(async () => { await DiagnosedMisconception.deleteMany({}); });

  it('persists one row per misconception and is queryable by student', async () => {
    const created = await logDiagnosedMisconceptions({ result, ownerUserId: owner, studentUserId: student, studentName: 'Ada', worksheetId: worksheet });
    expect(created).toHaveLength(2);
    const forStudent = await DiagnosedMisconception.find({ studentUserId: student }).sort({ title: 1 });
    expect(forStudent.map((d) => d.title)).toEqual(['Adds denominators', 'Improper conversion']);
    expect(forStudent[0].status).toBe('open');
  });

  it('writes nothing when there are no misconceptions', async () => {
    const created = await logDiagnosedMisconceptions({ result: { topic: 't', misconceptions: [] }, ownerUserId: owner });
    expect(created).toEqual([]);
    expect(await DiagnosedMisconception.countDocuments({})).toBe(0);
  });
});
