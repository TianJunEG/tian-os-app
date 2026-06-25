// The generate-and-persist fallback that lets non-fractions students practise:
// when a skill has no seeded DB questions (its domain generates rather than
// stores), generate a bank from the skill's metadata.questionStructures and
// persist it so grading + future selection work.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import { ensureQuestionsForSkills } from './practice.js';

describe('ensureQuestionsForSkills — practice generation fallback', () => {
  let mongo;
  let skill;
  let topic;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
    await mongoose.connect(mongo.getUri());
    const subject = await Subject.create({ key: 'math', name: 'Maths' });
    topic = await Topic.create({ subjectId: subject._id, name: 'Whole Numbers' });
    // A non-fractions skill with an EMPTY slug (the real-world legacy case) that
    // carries questionStructures in metadata but has NO seeded Question docs.
    skill = await Skill.create({
      topicId: topic._id,
      name: 'Place value to 100 000',
      slug: '',
      domain: 'whole_numbers',
      moeLevel: 'Primary 2',
      metadata: {
        mathPathSkillId: 'P4-WN-01',
        questionStructures: [
          { mode: 'short_answer', type: 'short_answer', difficulty: 'medium', stem: '{a} + {b} = ?', answerRule: 'a+b' },
        ],
      },
    });
  }, 60000);

  afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

  it('generates + persists questions for a skill that has no DB questions', async () => {
    expect(await Question.countDocuments({ skillId: skill._id })).toBe(0);

    const out = await ensureQuestionsForSkills([skill._id], 5);

    expect(out.length).toBeGreaterThanOrEqual(1);
    // Persisted so grading (Question.findById) can find them later.
    expect(await Question.countDocuments({ skillId: skill._id })).toBeGreaterThanOrEqual(1);
    const q = out[0];
    expect(String(q.stem)).toMatch(/\d/);          // real numbers substituted
    expect(String(q.answer)).not.toBe('');         // has an answer to grade against
    expect(q.source).toBe('generated');
    expect(String(q.skillId?._id || q.skillId)).toBe(String(skill._id));
  });

  it('returns nothing for a skill with no questionStructures (truly un-generatable)', async () => {
    const bare = await Skill.create({ topicId: topic._id, name: 'Bare skill', metadata: {} });
    const out = await ensureQuestionsForSkills([bare._id]);
    expect(out).toEqual([]);
  });
});
