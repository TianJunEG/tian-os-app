// Recommendation / placement / mastery-v2 logic. Pure-function scenarios run
// with no DB (fast, deterministic); the engine round-trip uses an in-memory
// Mongo (matching utils/mathpath.test.js). Ports scripts/test-recommendation-
// scenarios.js + scripts/qa-e2e.js assertions into a committed suite.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { deriveMastery, isStale, fluencyLabel, recordAttempt, recommendNextSkill } from './masteryEngine.js';
import { analysePlacement } from './placementEngine.js';
import { studentMathAnalytics } from './analytics.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import MasteryRecord from '../models/MasteryRecord.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Question from '../models/Question.js';

const DAY = 86400000;

describe('deriveMastery — 5-state ladder + decay', () => {
  it('maps score/attempts/fluency to the ladder', () => {
    expect(deriveMastery({ attempts: 0 })).toBe('not_started');
    expect(deriveMastery({ score: 30, attempts: 4 })).toBe('developing');
    expect(deriveMastery({ score: 65, attempts: 6 })).toBe('practising');
    expect(deriveMastery({ score: 90, attempts: 6, fluencyStatus: 'developing' })).toBe('fluent');
    expect(deriveMastery({ score: 90, attempts: 6, fluencyStatus: 'automatic' })).toBe('mastered');
  });
  it('decays a long-unpractised top skill back to practising', () => {
    const stale = { score: 95, attempts: 8, fluencyStatus: 'automatic', lastPracticedAt: new Date(Date.now() - 90 * DAY) };
    expect(deriveMastery(stale)).toBe('practising');
    expect(isStale(stale)).toBe(true);
    expect(isStale({ score: 95, lastPracticedAt: new Date(Date.now() - 5 * DAY) })).toBe(false);
  });
  it('labels fluency slow/steady/fast', () => {
    expect(fluencyLabel('effortful')).toBe('slow');
    expect(fluencyLabel('developing')).toBe('steady');
    expect(fluencyLabel('automatic')).toBe('fast');
  });
});

describe('analysePlacement — student scenarios (pure)', () => {
  // minimal graph fixtures (plain objects, no DB)
  const skills = [
    { _id: 'c20', slug: 'ns.count.to-20', domain: 'Number Sense', moeLevel: 'P1', order: 0, prerequisiteSkillIds: [], metadata: { fluency: { targetSeconds: 2 }, __order: 0 } },
    { _id: 'mf', slug: 'op.mult.facts', domain: 'Operations', moeLevel: 'P3', order: 2, prerequisiteSkillIds: ['c20'], metadata: { fluency: { targetSeconds: 3 }, remediation: { reinforce: ['ns.count.to-20'] }, __order: 2 } },
    { _id: 'fa', slug: 'fr.add.unlike', domain: 'Fractions', moeLevel: 'P5', order: 5, prerequisiteSkillIds: ['mf'], metadata: { __order: 5 } },
  ];
  const att = (slug, correct, responseMs, extra = {}) => ({ slug, correct, responseMs, ...extra });
  const profOf = (p, slug) => p.masteryProfile.find((x) => x.slug === slug) || {};

  it('high accuracy + fast → mastered/automatic, no fluency drill', () => {
    const p = analysePlacement(Array.from({ length: 6 }, () => att('op.mult.facts', true, 2400)), skills);
    expect(profOf(p, 'op.mult.facts').mastery).toBe('mastered');
    expect(profOf(p, 'op.mult.facts').fluency).toBe('automatic');
    expect(p.fluencyRecommendations.some((f) => f.slug === 'op.mult.facts')).toBe(false);
  });
  it('high accuracy + slow → accurate-but-slow, fluency drill triggers', () => {
    const p = analysePlacement(Array.from({ length: 6 }, () => att('op.mult.facts', true, 9000)), skills);
    expect(profOf(p, 'op.mult.facts').mastery).toBe('accurate-but-slow');
    expect(p.fluencyRecommendations.some((f) => f.slug === 'op.mult.facts')).toBe(true);
    expect(p.remediationPathways.some((r) => r.slug === 'op.mult.facts')).toBe(false);
  });
  it('low accuracy → not-secure, remediation + prerequisite reinforcement', () => {
    const p = analysePlacement([att('op.mult.facts', false, 12000), att('op.mult.facts', true, 11000), att('op.mult.facts', false, 13000), att('op.mult.facts', false, 10000)], skills);
    expect(profOf(p, 'op.mult.facts').mastery).toBe('not-secure');
    const rem = p.remediationPathways.find((r) => r.slug === 'op.mult.facts');
    expect(rem).toBeTruthy();
    expect(rem.reinforce.length).toBeGreaterThan(0);
  });
  it('repeated misconception is detected and carried into remediation', () => {
    const p = analysePlacement(Array.from({ length: 4 }, () => att('op.mult.facts', false, 8000, { misconceptionTag: 'mult/adjacent-fact' })), skills);
    expect(profOf(p, 'op.mult.facts').misconception?.tag).toBe('mult/adjacent-fact');
    expect(p.remediationPathways.find((r) => r.slug === 'op.mult.facts').misconception?.tag).toBe('mult/adjacent-fact');
  });
  it('inconsistent performance lowers confidence', () => {
    const p = analysePlacement([att('op.mult.facts', true, 2500), att('op.mult.facts', false, 14000, { retries: 2 }), att('op.mult.facts', true, 3000), att('op.mult.facts', false, 12000, { retries: 1, hesitationMs: 8000 })], skills);
    expect(profOf(p, 'op.mult.facts').confidence).toBeLessThan(0.6);
  });
  it('traces a weak skill to its deepest un-mastered prerequisite', () => {
    const p = analysePlacement([att('fr.add.unlike', false, 15000), att('fr.add.unlike', false, 14000)], skills);
    const gap = p.prerequisiteGaps.find((g) => g.slug === 'fr.add.unlike');
    expect(gap?.rootGap).toBe('ns.count.to-20');   // nothing mastered → root of the chain
  });
});

describe('mastery engine round-trip (in-memory Mongo)', () => {
  let mongo, ws, count20, multFacts;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    const math = await Subject.create({ key: 'math', name: 'Mathematics', order: 0 });
    const topic = await Topic.create({ subjectId: math._id, name: 'Operations', moeLevel: 'Primary 3', order: 1 });
    count20 = await Skill.create({ topicId: topic._id, name: 'Counting to 20', slug: 'ns.count.to-20', domain: 'Number Sense', moeLevel: 'Primary 1', order: 0, prerequisiteSkillIds: [] });
    multFacts = await Skill.create({ topicId: topic._id, name: 'Multiplication facts', slug: 'op.mult.facts', domain: 'Operations', moeLevel: 'Primary 3', order: 1, prerequisiteSkillIds: [count20._id], metadata: { fluency: { targetSeconds: 3 } } });
    ws = new mongoose.Types.ObjectId();
  });
  afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

  it('recordAttempt tracks fluency, streak, confidence and consistency', async () => {
    const sid = new mongoose.Types.ObjectId();
    for (const c of [true, true, false, true, true, true]) await recordAttempt({ studentId: sid, skillId: multFacts._id, workspaceId: ws, correct: c, timeMs: 2200 });
    const r = await MasteryRecord.findOne({ studentId: sid, skillId: multFacts._id });
    expect(r.streak).toBe(3);
    expect(r.bestStreak).toBeGreaterThanOrEqual(3);
    expect(r.fluencyStatus).toBe('automatic');
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.consistency).toBeGreaterThan(0);
    expect(deriveMastery(r)).toBe('mastered');
  });

  it('recommendNextSkill is prerequisite-aware with an explanation and mode', async () => {
    const sid = new mongoose.Types.ObjectId();
    const rec = await recommendNextSkill(sid);              // blank slate
    expect(rec.skill.slug).toBe('ns.count.to-20');          // earliest, prereq-ready
    expect(rec.reason).toMatch(/ready to start/i);
    expect(['independent', 'fluency', 'remediation']).toContain(rec.mode);
    expect(rec.masteryState).toBe('not_started');
  });

  it('analytics returns a clean dashboard structure', async () => {
    const sid = new mongoose.Types.ObjectId();
    const q = await Question.create({ subjectId: multFacts.topicId, topicId: multFacts.topicId, skillId: multFacts._id, stem: '3 x 4', answer: '12', misconceptionTag: 'mult/adjacent-fact', source: 'seed' });
    for (const c of [true, true, false, true]) {
      await PracticeAttempt.create({ sessionId: new mongoose.Types.ObjectId(), studentId: sid, questionId: q._id, skillId: multFacts._id, correct: c, timeMs: c ? 2200 : 9000 });
      await recordAttempt({ studentId: sid, skillId: multFacts._id, workspaceId: ws, correct: c, timeMs: c ? 2200 : 9000 });
    }
    const a = await studentMathAnalytics(sid, { sinceDays: 30 });
    expect(a.attempts).toBe(4);
    expect(a.accuracy).toBeCloseTo(0.75, 2);
    expect(a.medianResponseMs).toBe(2200);
    expect(a.misconceptionFrequency[0].tag).toBe('mult/adjacent-fact');
    expect(a.masteryDistribution).toBeTypeOf('object');
  });
});
