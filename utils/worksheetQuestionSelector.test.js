import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import {
  allocateWorksheetSections,
  selectWorksheetQuestions,
} from '../services/mathpath/worksheetQuestionSelector.js';

let mongo;
let subject;
let topic;
let skill;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
  await mongoose.connect(mongo.getUri());
  subject = await Subject.create({ key: 'math', name: 'Mathematics', order: 0 });
  topic = await Topic.create({ subjectId: subject._id, name: 'Fractions', moeLevel: 'Primary 4', order: 0 });
  skill = await Skill.create({
    topicId: topic._id,
    name: 'Fraction of a remainder',
    slug: 'f025',
    moeLevel: 'Primary 4',
    order: 0,
    metadata: { mathPathSkillId: 'F025', frameworkCode: 'F025' },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await Question.deleteMany({});
});

function makeQuestion(difficulty, stem, extra = {}) {
  return Question.create({
    subjectId: subject._id,
    topicId: topic._id,
    skillId: skill._id,
    difficulty,
    stem,
    answer: '6',
    worksheetCompatible: true,
    ...extra,
  });
}

describe('worksheetQuestionSelector', () => {
  it('allocates recovery worksheets as foundation/guided/mastery practice', () => {
    expect(allocateWorksheetSections({ worksheetType: 'recovery_worksheet', questionCount: 10 }).map((section) => [section.key, section.count])).toEqual([
      ['foundation', 6],
      ['guided', 3],
      ['mastery', 1],
    ]);
  });

  it('selects sectioned worksheet questions by difficulty', async () => {
    for (let i = 0; i < 6; i++) await makeQuestion('easy', `Foundation ${i}`);
    for (let i = 0; i < 3; i++) await makeQuestion('medium', `Guided ${i}`);
    await makeQuestion('hard', 'Mastery 1');

    const result = await selectWorksheetQuestions({
      skillIds: [skill._id],
      worksheetType: 'recovery_worksheet',
      questionCount: 10,
    });

    expect(result.questions).toHaveLength(10);
    expect(result.sections.map((section) => [section.key, section.questions.length])).toEqual([
      ['foundation', 6],
      ['guided', 3],
      ['mastery', 1],
    ]);
  });

  it('prioritises misconception-targeted questions inside a section', async () => {
    await makeQuestion('medium', 'Generic guided');
    await makeQuestion('medium', 'Remainder misconception', { misconceptionTag: 'uses_original_instead_of_remainder' });

    const result = await selectWorksheetQuestions({
      skillIds: [skill._id],
      worksheetType: 'tutor_lesson_worksheet',
      questionCount: 1,
      misconceptionTags: ['uses_original_instead_of_remainder'],
    });

    expect(result.questions[0].stem).toBe('Remainder misconception');
  });
});
