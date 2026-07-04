import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const practiceSession = { find: vi.fn() };
const practiceAttempt = { aggregate: vi.fn() };

vi.mock('../../models/ClassDiagnosticSession.js', () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../../models/ClassStudent.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../models/Student.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../models/mathpath/MathPathDiagnosticSession.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../models/PracticeSession.js', () => ({ default: practiceSession }));
vi.mock('../../models/PracticeAttempt.js', () => ({ default: practiceAttempt }));

// Import lazily (after the mock consts initialise) — the factories above close
// over them, matching the kiosk route test's pattern.
let buildKioskStatus;
beforeAll(async () => { ({ buildKioskStatus } = await import('./classDiagnosticService.js')); });

describe('buildKioskStatus — practice branch', () => {
  afterEach(() => vi.clearAllMocks());

  it('reports live per-student answered + score from attempts, plus the roster summary', async () => {
    const session = {
      _id: 'cds1', code: 'ABC', type: 'practice', domainId: 'numberSense',
      practiceConfig: { skillName: '2-digit addition', questionCount: 5 },
      status: 'open', expiresAt: new Date(),
      roster: [
        { studentId: 's1', name: 'Aisha', status: 'completed', practiceSessionId: 'ps1' },
        { studentId: 's2', name: 'Ben', status: 'in_progress', practiceSessionId: 'ps2' },
        { studentId: 's3', name: 'Cara', status: 'not_started', practiceSessionId: '' },
      ],
    };
    practiceSession.find.mockReturnValueOnce({
      select: () => ({
        lean: () => Promise.resolve([
          { _id: 'ps1', summary: { total: 5, correct: 4, scorePct: 80 }, status: 'completed' },
          { _id: 'ps2', summary: { total: 0, correct: 0, scorePct: 0 }, status: 'active' }, // default summary
        ]),
      }),
    });
    practiceAttempt.aggregate.mockResolvedValueOnce([
      { _id: 'ps1', answered: 5, correct: 4 },
      { _id: 'ps2', answered: 2, correct: 1 },
    ]);

    const out = await buildKioskStatus(session);
    expect(out.type).toBe('practice');
    expect(out.skillName).toBe('2-digit addition');

    const byName = Object.fromEntries(out.students.map((s) => [s.name, s]));
    expect(byName.Aisha).toMatchObject({ attemptStatus: 'completed', answeredCount: 5, readinessScore: 80 });
    // The in-progress student's default summary is scorePct:0 — must show the LIVE 1/2 = 50%, not 0.
    expect(byName.Ben).toMatchObject({ attemptStatus: 'in_progress', answeredCount: 2, readinessScore: 50 });
    expect(byName.Cara).toMatchObject({ attemptStatus: 'not_started', answeredCount: 0, readinessScore: null });
    expect(out.summary).toEqual({ notStarted: 1, inProgress: 1, completed: 1, total: 3 });
  });
});
