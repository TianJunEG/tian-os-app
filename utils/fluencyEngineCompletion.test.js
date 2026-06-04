import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import FluencyRecord from '../models/FluencyRecord.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import PracticeSession from '../models/PracticeSession.js';
import Skill from '../models/Skill.js';
import { updateFluencyCompletionForSession } from '../services/fluency/fluencyCompletionService.js';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    FluencyRecord.deleteMany({}),
    PracticeAttempt.deleteMany({}),
    PracticeSession.deleteMany({}),
    Skill.deleteMany({}),
  ]);
});

describe('fluency completion linkage', () => {
  it('updates FluencyRecord from a completed browser practice session', async () => {
    const student = { _id: new mongoose.Types.ObjectId(), workspaceId: new mongoose.Types.ObjectId() };
    const skill = await Skill.create({
      topicId: new mongoose.Types.ObjectId(),
      name: 'Times tables',
      slug: 'times_tables',
      metadata: { fluencyType: 'timed', fluency: { targetSeconds: 10 } },
    });
    const session = await PracticeSession.create({
      studentId: student._id,
      workspaceId: student.workspaceId,
      module: 'MathPath',
      feature: 'Fluency Practice',
      mode: 'fluency',
      skillIds: [skill._id],
    });
    await PracticeAttempt.create([
      { sessionId: session._id, studentId: student._id, questionId: new mongoose.Types.ObjectId(), skillId: skill._id, answer: '6', correct: true, timeMs: 6000, confidence: 'i_know_this' },
      { sessionId: session._id, studentId: student._id, questionId: new mongoose.Types.ObjectId(), skillId: skill._id, answer: '7', correct: false, timeMs: 9000, confidence: 'not_sure' },
    ]);

    const result = await updateFluencyCompletionForSession({ session, student, skill });

    expect(result.metrics).toMatchObject({
      totalQuestions: 2,
      correctAnswers: 1,
      accuracy: 50,
    });
    expect(result.metrics.fluencyScore).toBeGreaterThan(0);
    const record = await FluencyRecord.findOne({ studentId: student._id, skillId: skill._id }).lean();
    expect(record).toMatchObject({
      skillName: 'Times tables',
      totalQuestions: 2,
      correctAnswers: 1,
      fluencyStatus: 'developing',
    });
    expect(record.history).toHaveLength(1);
    expect(record.history[0].sessionId).toBe(String(session._id));
  });

  it('does not double-count FluencyRecord history for duplicate completion', async () => {
    const student = { _id: new mongoose.Types.ObjectId(), workspaceId: new mongoose.Types.ObjectId() };
    const skill = await Skill.create({
      topicId: new mongoose.Types.ObjectId(),
      name: 'Equivalent fractions',
      slug: 'equivalent_fractions',
      metadata: { fluencyType: 'timed', fluency: { targetSeconds: 10 } },
    });
    const session = await PracticeSession.create({
      studentId: student._id,
      workspaceId: student.workspaceId,
      module: 'MathPath',
      feature: 'Fluency Practice',
      mode: 'fluency',
      skillIds: [skill._id],
    });
    await PracticeAttempt.create({
      sessionId: session._id,
      studentId: student._id,
      questionId: new mongoose.Types.ObjectId(),
      skillId: skill._id,
      answer: '1/2',
      correct: true,
      timeMs: 5000,
      confidence: 'i_know_this',
    });

    await updateFluencyCompletionForSession({ session, student, skill });
    const duplicate = await updateFluencyCompletionForSession({ session, student, skill });

    expect(duplicate.alreadyRecorded).toBe(true);
    const record = await FluencyRecord.findOne({ studentId: student._id, skillId: skill._id }).lean();
    expect(record.history).toHaveLength(1);
  });
});
