import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import Student from '../models/Student.js';
import Worksheet from '../models/Worksheet.js';
import MathPathAssignment from '../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../models/mathpath/PaperAnalysis.js';
import {
  generateInterventionWorksheet,
  getInterventionWorksheetHistory,
} from '../services/mathpath/worksheetGenerationEngine.js';

let mongo;
let subject;
let topic;
let skill;
let student;
let userId;
let workspaceId;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    Subject.deleteMany({}),
    Topic.deleteMany({}),
    Skill.deleteMany({}),
    Question.deleteMany({}),
    Student.deleteMany({}),
    Worksheet.deleteMany({}),
    MathPathAssignment.deleteMany({}),
    PaperAnalysis.deleteMany({}),
  ]);
  userId = new mongoose.Types.ObjectId();
  workspaceId = new mongoose.Types.ObjectId();
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
  student = await Student.create({
    name: 'Pilot Student',
    level: 'Primary 4',
    workspaceId,
    createdByUserId: userId,
  });
  for (let i = 0; i < 8; i++) await makeQuestion('easy', `Foundation ${i}`);
  for (let i = 0; i < 5; i++) await makeQuestion('medium', `Guided ${i}`);
  for (let i = 0; i < 3; i++) await makeQuestion('hard', `Mastery ${i}`);
});

function makeQuestion(difficulty, stem, extra = {}) {
  return Question.create({
    subjectId: subject._id,
    topicId: topic._id,
    skillId: skill._id,
    difficulty,
    stem,
    answer: '6',
    workedSolution: 'Find the remainder first.',
    worksheetCompatible: true,
    ...extra,
  });
}

describe('worksheetGenerationEngine', () => {
  it('generates a recovery worksheet from a Recovery Pack assignment', async () => {
    const assignment = await MathPathAssignment.create({
      studentId: String(student._id),
      assignedByUserId: String(userId),
      assignedByRole: 'tutor',
      sourceType: 'tutor',
      sourceId: 'lesson_1',
      skillIds: ['F025'],
      targetQuestionCount: 12,
    });

    const result = await generateInterventionWorksheet({
      studentId: student._id,
      sourceType: 'recovery_pack',
      sourceId: assignment._id,
      generatedByUserId: userId,
      generatedByRole: 'tutor',
      questionCount: 10,
    });

    expect(result.worksheet.worksheetType).toBe('recovery_worksheet');
    expect(result.worksheet.interventionSourceType).toBe('recovery_pack');
    expect(result.worksheet.content.sections.map((section) => section.title)).toEqual([
      'Section A: Foundation Practice',
      'Section B: Guided Practice',
      'Section C: Challenge Questions',
    ]);
    expect(result.worksheet.content.personalization.notRandom).toBe(true);
    expect(result.worksheet.answerKey).toHaveLength(10);
  });

  it('generates a misconception-targeted worksheet from paper analysis', async () => {
    await makeQuestion('easy', 'Original quantity trap', { misconceptionTag: 'uses_original_instead_of_remainder' });
    const paper = await PaperAnalysis.create({
      studentId: String(student._id),
      uploadedByUserId: String(userId),
      uploadedByRole: 'parent',
      uploadType: 'marked_script',
      status: 'reviewed',
      weakSkillIds: ['F025'],
      detectedQuestions: [{
        questionNumber: '3',
        questionText: 'Find 1/3 of the remainder.',
        detectedSkillIds: ['F025'],
        adultConfirmedWrong: true,
        misconceptionTags: ['uses_original_instead_of_remainder'],
      }],
    });

    const result = await generateInterventionWorksheet({
      studentId: student._id,
      sourceType: 'paper_analysis',
      sourceId: paper._id,
      generatedByUserId: userId,
      generatedByRole: 'parent',
      questionCount: 6,
    });

    expect(result.worksheet.title).toMatch(/Paper Review/);
    expect(result.rationale.misconceptionTags).toContain('uses_original_instead_of_remainder');
    expect(result.worksheet.interventionRationale.whyGenerated).toMatch(/uploaded paper/i);
  });

  it('stores intervention worksheet history for regeneration/audit', async () => {
    const generated = await generateInterventionWorksheet({
      studentId: student._id,
      sourceType: 'manual',
      sourceId: 'manual_1',
      skillIds: ['F025'],
      worksheetType: 'practice_worksheet',
      generatedByUserId: userId,
      generatedByRole: 'student_care',
      questionCount: 5,
    });

    const history = await getInterventionWorksheetHistory({
      studentId: student._id,
      sourceType: 'manual',
      sourceId: 'manual_1',
    });

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(generated.worksheet.id);
    expect(history[0].interventionSourceType).toBe('manual');
  });

  it('rejects intervention worksheets when no skills can be resolved', async () => {
    await expect(generateInterventionWorksheet({
      studentId: student._id,
      sourceType: 'manual',
      skillIds: ['F999'],
      generatedByUserId: userId,
    })).rejects.toThrow(/No linked worksheet skills/);
  });
});
