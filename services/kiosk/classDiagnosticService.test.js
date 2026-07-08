import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const practiceSession = { find: vi.fn(), findById: vi.fn() };
const practiceAttempt = { aggregate: vi.fn(), find: vi.fn() };
const mpDiag = { find: vi.fn(), findOne: vi.fn() };
const mpAttempt = { find: vi.fn() };
const question = { find: vi.fn() };
const skill = { find: vi.fn() };

vi.mock('../../models/ClassDiagnosticSession.js', () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../../models/ClassStudent.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../models/Student.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../models/mathpath/MathPathDiagnosticSession.js', () => ({ default: mpDiag }));
vi.mock('../../models/mathpath/MathPathAttempt.js', () => ({ default: mpAttempt }));
vi.mock('../../models/PracticeSession.js', () => ({ default: practiceSession }));
vi.mock('../../models/PracticeAttempt.js', () => ({ default: practiceAttempt }));
vi.mock('../../models/Question.js', () => ({ default: question }));
vi.mock('../../models/Skill.js', () => ({ default: skill }));

// Import lazily (after the mock consts initialise) — the factories above close
// over them, matching the kiosk route test's pattern.
let buildKioskStatus;
let buildKioskStudentDetail;
let buildKioskWeakGroups;
beforeAll(async () => { ({ buildKioskStatus, buildKioskStudentDetail, buildKioskWeakGroups } = await import('./classDiagnosticService.js')); });

const chain = (val) => ({ select: () => ({ lean: () => Promise.resolve(val) }) });

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

describe('buildKioskStudentDetail — diagnostic branch', () => {
  afterEach(() => vi.clearAllMocks());

  it('shapes overall stats, named weak skills, and per-question with workings', async () => {
    const session = { _id: 'cds1', type: 'diagnostic', roster: [{ studentId: 's1', name: 'Aisha', status: 'completed' }] };
    mpDiag.findOne.mockReturnValueOnce(chain({
      diagnosticSessionId: 'diag1',
      startedAt: new Date('2026-07-04T00:00:00Z'),
      completedAt: new Date('2026-07-04T00:03:00Z'),
      readinessScore: 40,
      result: { readinessScore: 40, readinessBand: 'developing', weakSkillIds: ['NS009'] },
      perSkillSnapshot: [{ skillId: 'NS009', readinessScore: 30 }, { skillId: 'NS010', readinessScore: 80 }],
      adaptiveState: { responses: [
        { questionId: 'q1', skillId: 'NS009', correct: false, timeTakenMs: 8000, studentAnswer: '<', detectedErrorTags: ['compare/leading-digit'] },
        { questionId: 'q2', skillId: 'NS010', correct: true, timeTakenMs: 5000, studentAnswer: '>' },
      ] },
    }));
    skill.find.mockReturnValueOnce(chain([
      { name: 'Compare to 100', metadata: { mathPathSkillId: 'NS009' } },
      { name: 'Compare to 100000', metadata: { mathPathSkillId: 'NS010' } },
    ]));
    mpAttempt.find.mockReturnValueOnce(chain([
      { questionId: 'q1', correctAnswer: '>', studentAnswer: '<', workingImage: 'data:img1', timeTaken: 8000 },
    ]));

    const d = await buildKioskStudentDetail(session, 's1');
    expect(d.started).toBe(true);
    expect(d.overall).toMatchObject({ readinessScore: 40, readinessBand: 'developing', answered: 2, correct: 1, accuracy: 50, timeSpentSeconds: 180 });
    expect(d.skills.find((s) => s.skillId === 'NS009')).toMatchObject({ name: 'Compare to 100', score: 30, weak: true });
    expect(d.skills.find((s) => s.skillId === 'NS010')).toMatchObject({ name: 'Compare to 100000', weak: false });
    // per-question: named skill, wrong answer + correct answer, working image, misconception
    expect(d.questions[0]).toMatchObject({ skillName: 'Compare to 100', correct: false, studentAnswer: '<', correctAnswer: '>', workingImage: 'data:img1', misconceptions: ['compare/leading-digit'] });
    expect(d.questions[1]).toMatchObject({ skillName: 'Compare to 100000', correct: true });
  });

  it('returns started:false when the student has no attempt, and null when off-roster', async () => {
    mpDiag.findOne.mockReturnValueOnce(chain(null));
    const d = await buildKioskStudentDetail({ _id: 'cds1', type: 'diagnostic', roster: [{ studentId: 's1', name: 'Aisha', status: 'in_progress' }] }, 's1');
    expect(d.started).toBe(false);
    expect(await buildKioskStudentDetail({ roster: [] }, 'sX')).toBeNull();
  });
});

describe('buildKioskWeakGroups — post-session groups to pull', () => {
  afterEach(() => vi.clearAllMocks());

  it('groups finished students by shared weak skill, named + sorted by size', async () => {
    const session = {
      _id: 'cds1', type: 'diagnostic',
      roster: [
        { studentId: 's1', name: 'Aisha' },
        { studentId: 's2', name: 'Ben' },
        { studentId: 's3', name: 'Cara' },
      ],
    };
    mpDiag.find.mockReturnValueOnce(chain([
      { studentId: 's1', result: { readinessScore: 40, weakSkillIds: ['NS009', 'NS010'] }, completedAt: new Date() },
      { studentId: 's2', result: { readinessScore: 60, weakSkillIds: ['NS009'] }, completedAt: new Date() },
      { studentId: 's3', result: { readinessScore: 90, weakSkillIds: [] }, completedAt: new Date() }, // aced it
    ]));
    skill.find.mockReturnValueOnce(chain([
      { name: 'Compare to 100', metadata: { mathPathSkillId: 'NS009' } },
      { name: 'Compare to 100000', metadata: { mathPathSkillId: 'NS010' } },
    ]));

    const out = await buildKioskWeakGroups(session);
    expect(out.analysedStudents).toBe(3);
    // NS009 (2 students) sorts before NS010 (1 student)
    expect(out.groups[0]).toEqual({ skillId: 'NS009', skillName: 'Compare to 100', studentCount: 2, students: ['Aisha', 'Ben'] });
    expect(out.groups[1]).toEqual({ skillId: 'NS010', skillName: 'Compare to 100000', studentCount: 1, students: ['Aisha'] });
  });

  it('returns nothing for a practice-type session (no per-skill weakness)', async () => {
    const out = await buildKioskWeakGroups({ _id: 'cds1', type: 'practice', roster: [] });
    expect(out).toEqual({ groups: [], analysedStudents: 0 });
    expect(mpDiag.find).not.toHaveBeenCalled();
  });
});
