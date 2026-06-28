// MathPath core logic: answer checking (fraction/decimal equivalence) and the
// mastery engine (score progression, status thresholds, mistake resolution).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { isCorrect, isCorrectWithContext } from './answerCheck.js';
import { recordAttempt } from './masteryEngine.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';

describe('isCorrect — answer checking', () => {
  it('accepts equivalent fractions', () => {
    expect(isCorrect('1/2', '2/4')).toBe(true);
    expect(isCorrect('3/6', '1/2')).toBe(true);
    expect(isCorrect('2/4', '1/2')).toBe(true);
  });
  it('accepts mixed fraction input', () => {
    expect(isCorrect('1 1/2', '3/2')).toBe(true);
    expect(isCorrect('2 1/6', '13/6')).toBe(true);
    expect(isCorrect('-1 1/2', '-3/2')).toBe(true);
  });
  it('accepts improper, mixed, and equivalent answers for the same value', () => {
    expect(isCorrect('7/6', '7/6')).toBe(true);
    expect(isCorrect('1 1/6', '7/6')).toBe(true);
    expect(isCorrect('14/12', '7/6')).toBe(true);
  });
  it('rejects zero denominator fraction answers', () => {
    expect(isCorrect('1/0', '7/6')).toBe(false);
    expect(isCorrect('1 1/0', '7/6')).toBe(false);
  });
  it('accepts numeric/decimal formatting variants', () => {
    expect(isCorrect('0.50', '0.5')).toBe(true);
    expect(isCorrect(' 12 ', '12')).toBe(true);
  });
  it('rejects wrong answers', () => {
    expect(isCorrect('5', '6')).toBe(false);
    expect(isCorrect('1/3', '1/2')).toBe(false);
    expect(isCorrect('', '4')).toBe(false);
  });
  it('matches exact text/MCQ answers case-insensitively', () => {
    expect(isCorrect('Yes', 'yes')).toBe(true);
  });
  it('accepts numerator-only input when stem fixes denominator', () => {
    const stem = '1/2 + 3/4 = ? (over 4)';
    expect(isCorrectWithContext('5', '5/4', stem)).toBe(true);
    expect(isCorrectWithContext('4', '5/4', stem)).toBe(false);
  });
  it('does not mark a correct number wrong over its unit', () => {
    // A unit on one side only must not fail a correct value (the unit is a
    // fixed input adornment, not part of the graded answer).
    expect(isCorrect('38 cm', '38')).toBe(true);     // student typed the unit
    expect(isCorrect('38', '38 cm')).toBe(true);     // expected carries the unit
    expect(isCorrect('165', '165 min')).toBe(true);
    expect(isCorrect('$60', '60')).toBe(true);
    // Still rejects a genuinely different value, with or without units.
    expect(isCorrect('40 cm', '38')).toBe(false);
    expect(isCorrect('40', '38 cm')).toBe(false);
    // Genuinely conflicting units on a same value remain a mismatch.
    expect(isCorrect('3 cm', '3 m')).toBe(false);
  });
});

describe('masteryEngine.recordAttempt', () => {
  let mongo;
  const studentId = new mongoose.Types.ObjectId();
  const workspaceId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      instance: { ip: '127.0.0.1' },
    });
    await mongoose.connect(mongo.getUri());
  }, 60000);
  afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

  it('raises score on a correct attempt and starts a record', async () => {
    const skillId = new mongoose.Types.ObjectId();
    const { before, after } = await recordAttempt({ studentId, skillId, workspaceId, correct: true });
    expect(before.score).toBe(0);
    expect(after.score).toBeGreaterThan(0);
    const rec = await MasteryRecord.findOne({ studentId, skillId });
    expect(rec.attempts).toBe(1);
  });

  it('marks needs_review after an incorrect attempt on a fresh skill', async () => {
    const skillId = new mongoose.Types.ObjectId();
    const { after } = await recordAttempt({ studentId, skillId, workspaceId, correct: false });
    expect(after.status).toBe('needs_review');
  });

  it('reaches mastered after sustained correct answers and resolves open mistakes', async () => {
    const skillId = new mongoose.Types.ObjectId();
    await Mistake.create({ studentId, workspaceId, questionId: new mongoose.Types.ObjectId(), skillId, status: 'open' });
    let last;
    for (let i = 0; i < 6; i++) last = await recordAttempt({ studentId, skillId, workspaceId, correct: true });
    expect(last.after.status).toBe('mastered');
    const open = await Mistake.countDocuments({ studentId, skillId, status: { $ne: 'resolved' } });
    expect(open).toBe(0);
  });
});
