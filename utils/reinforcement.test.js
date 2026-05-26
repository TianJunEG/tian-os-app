import { describe, it, expect } from 'vitest';
import { buildReinforcementWorksheet } from './reinforcement.js';

const OWNER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const STUDENT = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const source = {
  userId: OWNER,
  studentId: STUDENT,
  studentName: 'Sam',
  subject: 'Math',
  topic: 'Fractions',
  gradeLevel: 'Year 5',
  skillsToReinforce: ['adding fractions'],
};

const misconceptions = [{ title: 'Common denominators', description: 'd' }];
const questions = [
  { prompt: 'q1', answer: '1', difficulty: 'similar' },
  { prompt: 'q2', answer: '2', difficulty: 'harder' },
  { prompt: 'q3', answer: '3', difficulty: 'easier' },
];

describe('buildReinforcementWorksheet', () => {
  it('carries the student assignment forward so the student keeps access', () => {
    const ws = buildReinforcementWorksheet({ source, userId: OWNER, misconceptions, questions });
    expect(ws.studentId).toBe(STUDENT);
  });

  it('copies the descriptive fields from the source', () => {
    const ws = buildReinforcementWorksheet({ source, userId: OWNER, misconceptions, questions });
    expect(ws.userId).toBe(OWNER);
    expect(ws.studentName).toBe('Sam');
    expect(ws.subject).toBe('Math');
    expect(ws.topic).toBe('Fractions');
    expect(ws.gradeLevel).toBe('Year 5');
    expect(ws.skillsToReinforce).toEqual(['adding fractions']);
  });

  it('summarises the targeted misconceptions', () => {
    const ws = buildReinforcementWorksheet({ source, userId: OWNER, misconceptions, questions });
    expect(ws.overallSummary).toBe('Reinforcement practice targeting: Common denominators.');
  });

  it('falls back to the topic when no misconceptions are given', () => {
    const ws = buildReinforcementWorksheet({ source, userId: OWNER, misconceptions: [], questions });
    expect(ws.overallSummary).toBe('Reinforcement practice targeting: Fractions.');
  });

  it('builds spaced practice sessions from the generated questions', () => {
    const ws = buildReinforcementWorksheet({ source, userId: OWNER, misconceptions, questions });
    expect(ws.practiceSessions.length).toBeGreaterThan(0);
    const total = ws.practiceSessions.reduce((n, s) => n + s.questions.length, 0);
    expect(total).toBe(questions.length);
  });
});
