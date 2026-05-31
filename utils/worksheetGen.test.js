// Worksheet Generator core (utils/worksheetGen.js). Covers the question
// selection algorithm and the per-mode skill resolution + content assembly, with
// an in-memory Mongo (matching utils/recommendation.test.js). No AI path here —
// this is the rule-based generator that selects from the shared question bank.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { selectSimilarQuestions, generateWorksheet } from './worksheetGen.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import Mistake from '../models/Mistake.js';
import MasteryRecord from '../models/MasteryRecord.js';
import PracticeAttempt from '../models/PracticeAttempt.js';

let mongo, subject, topic, skillA, skillB, ws, studentId;

// Helper: a question on a skill at a difficulty, with a unique stem by default.
const makeQ = (skillId, difficulty, stem, extra = {}) =>
  Question.create({ subjectId: subject._id, topicId: topic._id, skillId, difficulty, stem, answer: '42', ...extra });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    instance: { ip: '127.0.0.1' },
  });
  await mongoose.connect(mongo.getUri());
  subject = await Subject.create({ key: 'math', name: 'Mathematics', order: 0 });
  topic = await Topic.create({ subjectId: subject._id, name: 'Fractions', moeLevel: 'Primary 5', order: 0 });
  skillA = await Skill.create({ topicId: topic._id, name: 'Adding fractions', slug: 'fr.add', moeLevel: 'Primary 5', order: 0 });
  skillB = await Skill.create({ topicId: topic._id, name: 'Subtracting fractions', slug: 'fr.sub', moeLevel: 'Primary 5', order: 1 });
  ws = new mongoose.Types.ObjectId();
});
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

beforeEach(async () => {
  studentId = new mongoose.Types.ObjectId();
  await Promise.all([Question.deleteMany({}), Mistake.deleteMany({}), MasteryRecord.deleteMany({}), PracticeAttempt.deleteMany({})]);
});

describe('selectSimilarQuestions', () => {
  it('returns nothing when no skills are given', async () => {
    expect(await selectSimilarQuestions({ studentId, skillIds: [], difficulty: 'medium', count: 5 })).toEqual([]);
  });

  it('keeps only neighbouring difficulties (easy excludes hard)', async () => {
    await makeQ(skillA._id, 'easy', 'e1');
    await makeQ(skillA._id, 'medium', 'm1');
    await makeQ(skillA._id, 'hard', 'h1');
    const out = await selectSimilarQuestions({ studentId, skillIds: [skillA._id], difficulty: 'easy', count: 10 });
    expect(out.map((q) => q.difficulty).sort()).toEqual(['easy', 'medium']);
  });

  it('excludes questions in excludeQuestionIds', async () => {
    const keep = await makeQ(skillA._id, 'medium', 'keep');
    const drop = await makeQ(skillA._id, 'medium', 'drop');
    const out = await selectSimilarQuestions({ studentId, skillIds: [skillA._id], difficulty: 'medium', count: 10, excludeQuestionIds: [drop._id] });
    const ids = out.map((q) => String(q._id));
    expect(ids).toContain(String(keep._id));
    expect(ids).not.toContain(String(drop._id));
  });

  it('de-duplicates by stem', async () => {
    await makeQ(skillA._id, 'medium', 'same stem');
    await makeQ(skillA._id, 'medium', 'same stem');
    await makeQ(skillB._id, 'medium', 'same stem');
    const out = await selectSimilarQuestions({ studentId, skillIds: [skillA._id, skillB._id], difficulty: 'medium', count: 10 });
    expect(out).toHaveLength(1);
  });

  it('caps the result at count', async () => {
    for (let i = 0; i < 8; i++) await makeQ(skillA._id, 'medium', `q${i}`);
    const out = await selectSimilarQuestions({ studentId, skillIds: [skillA._id], difficulty: 'medium', count: 3 });
    expect(out).toHaveLength(3);
  });

  it('ranks an exact-difficulty match ahead of a neighbouring one', async () => {
    await makeQ(skillA._id, 'medium', 'exact');
    await makeQ(skillA._id, 'easy', 'neighbour');
    const [first] = await selectSimilarQuestions({ studentId, skillIds: [skillA._id], difficulty: 'medium', count: 1 });
    expect(first.stem).toBe('exact');
  });

  it('de-prioritises recently-attempted questions', async () => {
    const recent = await makeQ(skillA._id, 'medium', 'recent');
    const fresh = await makeQ(skillA._id, 'medium', 'fresh');
    await PracticeAttempt.create({ sessionId: new mongoose.Types.ObjectId(), studentId, questionId: recent._id, skillId: skillA._id, correct: false });
    const [first] = await selectSimilarQuestions({ studentId, skillIds: [skillA._id], difficulty: 'medium', count: 1 });
    expect(first.stem).toBe('fresh');
  });

  it('spreads picks across skills instead of draining one bucket first', async () => {
    // skillA has a deep pool, skillB has a thin one. A naive top-N picker
    // would saturate the result with skillA; the round-robin should still
    // include skillB's question early.
    for (let i = 0; i < 6; i++) await makeQ(skillA._id, 'medium', `a${i}`);
    await makeQ(skillB._id, 'medium', 'b0');
    const out = await selectSimilarQuestions({ studentId, skillIds: [skillA._id, skillB._id], difficulty: 'medium', count: 4 });
    const skillsHit = new Set(out.map((q) => String(q.skillId._id || q.skillId)));
    expect(skillsHit.has(String(skillB._id))).toBe(true);
    expect(out.length).toBe(4);
  });
});

describe('generateWorksheet — modes', () => {
  it('selected_topic with explicit skillIds targets those skills', async () => {
    await makeQ(skillA._id, 'medium', 'qA');
    const r = await generateWorksheet({ mode: 'selected_topic', studentId, skillIds: [skillA._id], questionCount: 5 });
    expect(r.skillIds).toEqual([String(skillA._id)]);
    expect(r.content.questions.length).toBe(1);
    expect(r.content.title).toMatch(/Selected topic/);
    expect(r.content.title).toMatch(/Fractions/);
  });

  it('selected_topic with a topicId resolves all skills under the topic', async () => {
    await makeQ(skillA._id, 'medium', 'qA');
    await makeQ(skillB._id, 'medium', 'qB');
    const r = await generateWorksheet({ mode: 'selected_topic', studentId, topicId: topic._id, questionCount: 10 });
    expect(r.skillIds.sort()).toEqual([String(skillA._id), String(skillB._id)].sort());
    expect(r.content.questions.length).toBe(2);
  });

  it('recent_mistakes targets the skills of unresolved mistakes', async () => {
    await makeQ(skillB._id, 'medium', 'qB');
    await Mistake.create({ studentId, workspaceId: ws, questionId: new mongoose.Types.ObjectId(), skillId: skillB._id, status: 'open' });
    await Mistake.create({ studentId, workspaceId: ws, questionId: new mongoose.Types.ObjectId(), skillId: skillA._id, status: 'resolved' }); // ignored
    const r = await generateWorksheet({ mode: 'recent_mistakes', studentId, questionCount: 5 });
    expect(r.skillIds).toEqual([String(skillB._id)]);
  });

  it('weak_skills targets low-scoring needs_review / learning records', async () => {
    await makeQ(skillA._id, 'medium', 'qA');
    await MasteryRecord.create({ studentId, skillId: skillA._id, workspaceId: ws, module: 'MathPath', status: 'needs_review', score: 20 });
    await MasteryRecord.create({ studentId, skillId: skillB._id, workspaceId: ws, module: 'MathPath', status: 'mastered', score: 95 }); // ignored
    const r = await generateWorksheet({ mode: 'weak_skills', studentId, questionCount: 5 });
    expect(r.skillIds).toEqual([String(skillA._id)]);
  });

  it('recent_mistakes with subject=Science only pulls Science-module mistakes', async () => {
    await makeQ(skillA._id, 'medium', 'qA');
    await makeQ(skillB._id, 'medium', 'qB');
    // Math mistake on skillA, Science mistake on skillB — Science worksheet
    // should target only skillB.
    await Mistake.create({ studentId, workspaceId: ws, questionId: new mongoose.Types.ObjectId(), skillId: skillA._id, module: 'MathPath', status: 'open' });
    await Mistake.create({ studentId, workspaceId: ws, questionId: new mongoose.Types.ObjectId(), skillId: skillB._id, module: 'Science Adaptive Revision', status: 'open' });
    const sci = await generateWorksheet({ mode: 'recent_mistakes', studentId, subject: 'Science', questionCount: 5 });
    expect(sci.skillIds).toEqual([String(skillB._id)]);
    // The Math worksheet stays Math-only — Science mistakes are excluded.
    const math = await generateWorksheet({ mode: 'recent_mistakes', studentId, subject: 'Math', questionCount: 5 });
    expect(math.skillIds).toEqual([String(skillA._id)]);
  });

  it('weak_skills with subject=Science only pulls Science mastery records', async () => {
    await makeQ(skillA._id, 'medium', 'qA');
    await makeQ(skillB._id, 'medium', 'qB');
    await MasteryRecord.create({ studentId, skillId: skillA._id, workspaceId: ws, module: 'MathPath', subject: 'Math', status: 'needs_review', score: 20 });
    await MasteryRecord.create({ studentId, skillId: skillB._id, workspaceId: ws, module: 'Science Adaptive Revision', subject: 'Science', status: 'needs_review', score: 30 });
    const sci = await generateWorksheet({ mode: 'weak_skills', studentId, subject: 'Science', questionCount: 5 });
    expect(sci.skillIds).toEqual([String(skillB._id)]);
    const math = await generateWorksheet({ mode: 'weak_skills', studentId, subject: 'Math', questionCount: 5 });
    expect(math.skillIds).toEqual([String(skillA._id)]);
  });
});

describe('generateWorksheet — content options', () => {
  it('omits worked solutions when includesSolutions is false', async () => {
    await makeQ(skillA._id, 'medium', 'qA', { workedSolution: 'because 1+1=2' });
    const r = await generateWorksheet({ mode: 'selected_topic', studentId, skillIds: [skillA._id], includesSolutions: false });
    expect(r.content.questions.every((q) => q.workedSolution === '')).toBe(true);
  });

  it('includes worked solutions by default', async () => {
    await makeQ(skillA._id, 'medium', 'qA', { workedSolution: 'because 1+1=2' });
    const r = await generateWorksheet({ mode: 'selected_topic', studentId, skillIds: [skillA._id] });
    expect(r.content.questions[0].workedSolution).toBe('because 1+1=2');
  });

  it('adds a mistake-review section from unresolved mistakes on the targeted skills', async () => {
    await makeQ(skillA._id, 'medium', 'qA');
    await Mistake.create({ studentId, workspaceId: ws, questionId: new mongoose.Types.ObjectId(), skillId: skillA._id, status: 'open', questionStem: 'wrong one', studentAnswer: '3', correctAnswer: '4', workedSolution: 'add carefully' });
    const r = await generateWorksheet({ mode: 'selected_topic', studentId, skillIds: [skillA._id], includesMistakeReview: true });
    expect(r.content.reviewSection).toHaveLength(1);
    expect(r.content.reviewSection[0]).toMatchObject({ stem: 'wrong one', yourAnswer: '3', correctAnswer: '4', skillName: 'Adding fractions' });
  });
});
