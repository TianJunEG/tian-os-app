import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

// studentMathAnalytics must count a student's WHOLE math workload. Domain practice
// + fluency land in MathPathAttempt (disjoint from PracticeAttempt), so the fix
// folds them in. These mocks stand in for the two attempt collections.
const masteryRecord = { find: vi.fn() };
const practiceAttempt = { find: vi.fn() };
const mathPathAttempt = { find: vi.fn() };
const question = { find: vi.fn() };
const mathPathSkill = { find: vi.fn() };

vi.mock('../models/MasteryRecord.js', () => ({ default: masteryRecord }));
vi.mock('../models/PracticeAttempt.js', () => ({ default: practiceAttempt }));
vi.mock('../models/mathpath/MathPathAttempt.js', () => ({ default: mathPathAttempt }));
vi.mock('../models/Question.js', () => ({ default: question }));
vi.mock('../models/mathpath/MathPathSkill.js', () => ({ default: mathPathSkill }));

let studentMathAnalytics;
beforeAll(async () => { ({ studentMathAnalytics } = await import('./analytics.js')); });
afterEach(() => vi.clearAllMocks());

const DAY = '2026-07-07T10:00:00.000Z';

describe('studentMathAnalytics — folds in MathPath domain attempts', () => {
  it('counts PracticeAttempt AND non-diagnostic MathPathAttempt in volume/accuracy/timing', async () => {
    masteryRecord.find.mockResolvedValueOnce([]);
    // PracticeAttempt: 1 correct @ 4000ms, 1 wrong @ 2000ms.
    practiceAttempt.find.mockResolvedValueOnce([
      { correct: true, timeMs: 4000, createdAt: DAY, questionId: 'q1' },
      { correct: false, timeMs: 2000, createdAt: DAY, questionId: 'q2' },
    ]);
    // MathPathAttempt (domain practice): 2 correct @ 10s, 1 wrong @ 5s. Seconds → ms.
    mathPathAttempt.find.mockReturnValueOnce({
      lean: () => Promise.resolve([
        { correct: true, timeSpentSeconds: 10, createdAt: DAY, sessionType: 'practice' },
        { correct: true, timeSpentSeconds: 10, createdAt: DAY, sessionType: 'fluency' },
        { correct: false, timeSpentSeconds: 5, createdAt: DAY, sessionType: 'practice' },
      ]),
    });
    question.find.mockResolvedValueOnce([]);

    const out = await studentMathAnalytics('stu1', { sinceDays: 30 });

    // 2 practice + 3 mathpath = 5 (was 2 before the fix)
    expect(out.attempts).toBe(5);
    // 3 correct / 5 = 0.6
    expect(out.accuracy).toBe(0.6);
    // correct times in ms: [4000, 10000, 10000] → median 10000
    expect(out.medianResponseMs).toBe(10000);
    // all same calendar day
    expect(out.activeDays).toBe(1);

    // diagnostics are deliberately excluded from this practice view
    expect(mathPathAttempt.find).toHaveBeenCalledWith(
      expect.objectContaining({ sessionType: { $ne: 'diagnostic' } }),
    );
  });

  it('still works (no crash, zeroed) when the student has no attempts at all', async () => {
    masteryRecord.find.mockResolvedValueOnce([]);
    practiceAttempt.find.mockResolvedValueOnce([]);
    mathPathAttempt.find.mockReturnValueOnce({ lean: () => Promise.resolve([]) });
    question.find.mockResolvedValueOnce([]);

    const out = await studentMathAnalytics('stu2', { sinceDays: 30 });
    expect(out.attempts).toBe(0);
    expect(out.accuracy).toBe(0);
    expect(out.activeDays).toBe(0);
  });
});
