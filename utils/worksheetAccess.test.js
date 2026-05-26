import { describe, it, expect } from 'vitest';
import {
  canViewWorksheet,
  canManageWorksheet,
  redactWorksheetForViewer,
} from './worksheetAccess.js';

const OWNER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const STUDENT = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const STRANGER = 'cccccccccccccccccccccccc';

describe('canViewWorksheet', () => {
  it('lets the owner view', () => {
    expect(canViewWorksheet({ userId: OWNER, studentId: STUDENT }, OWNER)).toBe(true);
  });

  it('lets the assigned student view', () => {
    expect(canViewWorksheet({ userId: OWNER, studentId: STUDENT }, STUDENT)).toBe(true);
  });

  it('denies an unrelated user', () => {
    expect(canViewWorksheet({ userId: OWNER, studentId: STUDENT }, STRANGER)).toBe(false);
  });

  it('denies a non-owner when there is no assigned student', () => {
    expect(canViewWorksheet({ userId: OWNER, studentId: null }, STRANGER)).toBe(false);
  });
});

describe('canManageWorksheet', () => {
  it('lets only the owner manage', () => {
    expect(canManageWorksheet({ userId: OWNER }, OWNER)).toBe(true);
    expect(canManageWorksheet({ userId: OWNER, studentId: STUDENT }, STUDENT)).toBe(false);
  });
});

describe('redactWorksheetForViewer', () => {
  const makeWorksheet = () => ({
    userId: OWNER,
    studentId: STUDENT,
    practiceSessions: [
      {
        questions: [
          { prompt: 'Q1', answer: '42', workedSolution: 'because', markedAt: new Date() },
          { prompt: 'Q2', answer: '7', workedSolution: 'steps', markedAt: null },
        ],
      },
    ],
  });

  it('returns full answers to the owner', () => {
    const qs = redactWorksheetForViewer(makeWorksheet(), OWNER).practiceSessions[0].questions;
    expect(qs[0].answer).toBe('42');
    expect(qs[1].answer).toBe('7');
    expect(qs[1].workedSolution).toBe('steps');
  });

  it('hides answer and workedSolution for un-attempted questions from a student', () => {
    const qs = redactWorksheetForViewer(makeWorksheet(), STUDENT).practiceSessions[0].questions;
    expect(qs[1].answer).toBeUndefined();
    expect(qs[1].workedSolution).toBeUndefined();
    expect(qs[1].prompt).toBe('Q2'); // the question itself is still delivered
  });

  it('still reveals answers for already-marked questions to a student', () => {
    const qs = redactWorksheetForViewer(makeWorksheet(), STUDENT).practiceSessions[0].questions;
    expect(qs[0].answer).toBe('42');
    expect(qs[0].workedSolution).toBe('because');
  });

  it('does not mutate the source worksheet', () => {
    const ws = makeWorksheet();
    redactWorksheetForViewer(ws, STUDENT);
    expect(ws.practiceSessions[0].questions[1].answer).toBe('7');
  });

  it('reads through a mongoose-style document via toObject()', () => {
    const plain = makeWorksheet();
    const doc = { toObject: () => structuredClone(plain) };
    const qs = redactWorksheetForViewer(doc, STUDENT).practiceSessions[0].questions;
    expect(qs[1].answer).toBeUndefined();
    expect(qs[0].answer).toBe('42');
  });
});
