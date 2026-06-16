import { describe, it, expect, vi, beforeEach } from 'vitest';

const mistakeFOAU = vi.fn().mockResolvedValue({});
const recordFOAU = vi.fn().mockResolvedValue({});

vi.mock('../../models/Mistake.js', () => ({ default: { findOneAndUpdate: (...a) => mistakeFOAU(...a) } }));
vi.mock('../../models/mathpath/MathPathMistakeRecord.js', () => ({ default: { findOneAndUpdate: (...a) => recordFOAU(...a) } }));

const { persistDomainPracticeMistakes } = await import('./domainMistakePersistence.js');

const student = { _id: 'stud1', workspaceId: 'ws1' };

beforeEach(() => {
  mistakeFOAU.mockClear();
  recordFOAU.mockClear();
});

describe('persistDomainPracticeMistakes', () => {
  it('writes both an aggregate record and a per-question Mistake doc for each wrong answer', async () => {
    const scored = {
      mistakes: [
        { questionId: 'CI001_FAM_0', questionFamilyId: 'CI001_FAM', skillId: 'CI001', studentAnswer: '10', correctAnswer: '12π', confidence: 'unsure', timeTaken: 8, misconceptionTag: 'forgot_pi' },
      ],
    };
    const questions = [{ questionId: 'CI001_FAM_0', prompt: 'Area of circle r=… ?', solutionSteps: ['A = πr²'] }];

    const res = await persistDomainPracticeMistakes({ student, domainId: 'circles', sessionId: 'sess1', scored, questions });

    expect(res).toEqual({ aggregateCount: 1, mistakeCount: 1 });
    expect(recordFOAU).toHaveBeenCalledTimes(1);
    expect(mistakeFOAU).toHaveBeenCalledTimes(1);

    const [filter, update] = mistakeFOAU.mock.calls[0];
    // Deduped per student/skill/question-family, never resolved.
    expect(filter).toMatchObject({ studentId: 'stud1', module: 'MathPath', skillCode: 'CI001', questionId: 'CI001_FAM' });
    expect(filter.status).toEqual({ $ne: 'resolved' });
    // Snapshot carries the question text + answers + curriculum skill code so it
    // renders in review and matches the 'mathpath' curriculum-code filter.
    expect(update.$set).toMatchObject({
      workspaceId: 'ws1', module: 'MathPath', skillCode: 'CI001',
      questionStem: 'Area of circle r=… ?', studentAnswer: '10', correctAnswer: '12π',
      answerCorrect: false, source: 'practice-incorrect', status: 'open',
    });
    expect(update.$setOnInsert).toMatchObject({ questionId: 'CI001_FAM' });
  });

  it('uses the domain id for the aggregate misconception tag/source fallback', async () => {
    const scored = { mistakes: [{ questionId: 'q1', skillId: 'GE001', studentAnswer: 'x', correctAnswer: 'y' }] };
    await persistDomainPracticeMistakes({ student, domainId: 'geometry', sessionId: 's', scored, questions: [] });
    const [, update] = recordFOAU.mock.calls[0];
    expect(update.$push.evidence.source).toBe('geometry-practice-incorrect');
    expect(update.$set.mistakeName).toBe('geometry_error');
  });

  it('does nothing when there are no mistakes', async () => {
    const res = await persistDomainPracticeMistakes({ student, domainId: 'circles', scored: { mistakes: [] }, questions: [] });
    expect(res).toEqual({ aggregateCount: 0, mistakeCount: 0 });
    expect(mistakeFOAU).not.toHaveBeenCalled();
    expect(recordFOAU).not.toHaveBeenCalled();
  });
});
