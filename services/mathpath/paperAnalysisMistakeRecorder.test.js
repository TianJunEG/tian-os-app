import { describe, it, expect, vi, beforeEach } from 'vitest';

const mistakeUpdateOne = vi.fn();
const studentFindById = vi.fn();

vi.mock('../../models/Mistake.js', () => ({ default: { updateOne: (...a) => mistakeUpdateOne(...a) } }));
vi.mock('../../models/Student.js', () => ({ default: { findById: (...a) => studentFindById(...a) } }));

const { recordMistakesFromPaperAnalysis, isConfirmedWrong } = await import('./paperAnalysisMistakeRecorder.js');

const studentLean = (doc) => ({ select: () => ({ lean: () => Promise.resolve(doc) }) });

beforeEach(() => { vi.clearAllMocks(); mistakeUpdateOne.mockResolvedValue({ upsertedCount: 1 }); });

describe('recordMistakesFromPaperAnalysis', () => {
  it('isConfirmedWrong: adultConfirmedWrong OR teacherMarkedCorrect===false', () => {
    expect(isConfirmedWrong({ adultConfirmedWrong: true })).toBe(true);
    expect(isConfirmedWrong({ teacherMarkedCorrect: false })).toBe(true);
    expect(isConfirmedWrong({ teacherMarkedCorrect: true })).toBe(false);
    expect(isConfirmedWrong({})).toBe(false);
  });

  it('creates a Mistake per confirmed-wrong question, skips correct ones', async () => {
    studentFindById.mockReturnValueOnce(studentLean({ _id: 'stu1', workspaceId: 'ws1' }));
    const analysis = {
      _id: 'pa1', studentId: 'stu1',
      detectedQuestions: [
        { adultConfirmedWrong: true, detectedSkillIds: ['F003'], questionText: 'Q1', studentAnswer: '9', misconceptionTags: ['off_by_one'] },
        { teacherMarkedCorrect: true }, // correct → skip
        { teacherMarkedCorrect: false, questionText: 'Q3' },
      ],
    };
    const out = await recordMistakesFromPaperAnalysis(analysis);
    expect(out.created).toBe(2);
    expect(mistakeUpdateOne).toHaveBeenCalledTimes(2);
    const [filter, update] = mistakeUpdateOne.mock.calls[0];
    expect(String(filter.questionId)).toMatch(/^paper:pa1:/);
    expect(update.$setOnInsert).toMatchObject({
      workspaceId: 'ws1', skillCode: 'F003', questionText: 'Q1', studentAnswer: '9',
      misconceptionTag: 'off_by_one', source: 'other', module: 'MathPath', status: 'open',
    });
  });

  it('skips entirely when the student has no workspace', async () => {
    studentFindById.mockReturnValueOnce(studentLean({ _id: 'stu1' })); // no workspaceId
    const out = await recordMistakesFromPaperAnalysis({ _id: 'pa1', studentId: 'stu1', detectedQuestions: [{ adultConfirmedWrong: true }] });
    expect(out.created).toBe(0);
    expect(mistakeUpdateOne).not.toHaveBeenCalled();
  });

  it('never throws (returns created:0 on error)', async () => {
    studentFindById.mockImplementationOnce(() => { throw new Error('db down'); });
    const out = await recordMistakesFromPaperAnalysis({ _id: 'pa1', studentId: 'stu1', detectedQuestions: [] });
    expect(out).toEqual({ created: 0 });
  });
});
