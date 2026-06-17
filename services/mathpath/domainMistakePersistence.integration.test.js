// Real DB round-trip for the domain mistake write-path. The unit test
// (domainMistakePersistence.test.js) mocks the models; this one runs the helper
// against an in-memory Mongo with the real Mongoose models and verifies the
// docs actually persist, dedupe, and match the /mistakes ?domain=mathpath
// curriculum-code filter that surfaces them in Mistake-to-Mastery.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { persistDomainPracticeMistakes } from './domainMistakePersistence.js';
import Mistake from '../../models/Mistake.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';

// Same pattern the backend /mistakes endpoint uses for ?domain=mathpath.
const CURRICULUM_CODE = /^[A-Z]{1,3}\d{2,3}$/i;

const student = { _id: new mongoose.Types.ObjectId(), workspaceId: new mongoose.Types.ObjectId() };

const scored = {
  mistakes: [
    {
      questionId: 'CI001_FAM_0', questionFamilyId: 'CI001_FAM', skillId: 'CI001',
      studentAnswer: '10', correctAnswer: '12π', confidence: 'i_know_this', timeTaken: 9,
      misconceptionTag: 'forgot_pi',
    },
  ],
};
const questions = [{ questionId: 'CI001_FAM_0', prompt: 'Area of a circle, r = …?', solutionSteps: ['A = πr²'] }];

let mongo;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
beforeEach(async () => { await Mistake.deleteMany({}); await MathPathMistakeRecord.deleteMany({}); });

describe('persistDomainPracticeMistakes (DB round-trip)', () => {
  it('persists a per-question Mistake doc that surfaces under the mathpath filter', async () => {
    await persistDomainPracticeMistakes({ student, domainId: 'circles', sessionId: 'sess1', scored, questions });

    const docs = await Mistake.find({ studentId: student._id, module: 'MathPath' }).lean();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      skillCode: 'CI001', module: 'MathPath', questionStem: 'Area of a circle, r = …?',
      studentAnswer: '10', correctAnswer: '12π', answerCorrect: false, status: 'open', source: 'practice-incorrect',
    });
    // The endpoint filter that powers MistakesHome/MistakeReview must match it.
    expect(CURRICULUM_CODE.test(docs[0].skillCode)).toBe(true);

    const agg = await MathPathMistakeRecord.find({ studentId: String(student._id), domainId: 'circles' }).lean();
    expect(agg).toHaveLength(1);
    expect(agg[0].mistakeCode).toBe('forgot_pi');
  });

  it('dedupes on re-attempt of the same question family (no flooding)', async () => {
    await persistDomainPracticeMistakes({ student, domainId: 'circles', sessionId: 'sess1', scored, questions });
    // Re-attempt: a fresh session, new per-question id, same family.
    const retry = { mistakes: [{ ...scored.mistakes[0], questionId: 'CI001_FAM_1' }] };
    await persistDomainPracticeMistakes({ student, domainId: 'circles', sessionId: 'sess2', scored: retry, questions: [{ ...questions[0], questionId: 'CI001_FAM_1' }] });

    const docs = await Mistake.find({ studentId: student._id, module: 'MathPath' }).lean();
    expect(docs).toHaveLength(1); // still one — updated, not duplicated
    expect(docs[0].frequency).toBe(2);
  });

  it('does not collapse mistakes from different skills', async () => {
    const two = { mistakes: [
      { questionId: 'CI001_0', questionFamilyId: 'CI001_F', skillId: 'CI001', studentAnswer: 'a', correctAnswer: 'b' },
      { questionId: 'CI004_0', questionFamilyId: 'CI004_F', skillId: 'CI004', studentAnswer: 'c', correctAnswer: 'd' },
    ] };
    await persistDomainPracticeMistakes({ student, domainId: 'circles', sessionId: 's', scored: two, questions: [] });
    const docs = await Mistake.find({ studentId: student._id, module: 'MathPath' }).lean();
    expect(docs).toHaveLength(2);
    expect(docs.map((d) => d.skillCode).sort()).toEqual(['CI001', 'CI004']);
  });
});
