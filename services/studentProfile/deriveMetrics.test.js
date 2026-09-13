import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// deriveMetrics folds fluency + generic + kiosk MathPath practice (which live in
// the PracticeSession/PracticeAttempt collections) into the profile so they earn
// XP, count toward questions-solved, and keep daily streaks alive — WITHOUT
// double-counting (fluency → fluencySessions only; other practice → practiceSessions).

const Skill = { findOne: vi.fn(), countDocuments: vi.fn() };
const MasteryRecord = { find: vi.fn() };
const MathPathAttempt = { countDocuments: vi.fn(), distinct: vi.fn(), find: vi.fn() };
const MathPathAssessmentSession = { countDocuments: vi.fn() };
const MathPathDiagnosticSession = { countDocuments: vi.fn(), find: vi.fn() };
const MathPathPracticeSession = { countDocuments: vi.fn(), find: vi.fn() };
const PracticeSession = { find: vi.fn() };
const PracticeAttempt = { countDocuments: vi.fn() };
const MathPathStudentSkillState = { find: vi.fn(), findOne: vi.fn() };
const MathPathSkill = { countDocuments: vi.fn() };
const MathPathWorkingSession = { countDocuments: vi.fn() };

vi.mock('../../models/Skill.js', () => ({ default: Skill }));
vi.mock('../../models/MasteryRecord.js', () => ({ default: MasteryRecord }));
vi.mock('../../models/mathpath/MathPathAttempt.js', () => ({ default: MathPathAttempt }));
vi.mock('../../models/mathpath/MathPathAssessmentSession.js', () => ({ default: MathPathAssessmentSession }));
vi.mock('../../models/mathpath/MathPathDiagnosticSession.js', () => ({ default: MathPathDiagnosticSession }));
vi.mock('../../models/mathpath/MathPathPracticeSession.js', () => ({ default: MathPathPracticeSession }));
vi.mock('../../models/PracticeSession.js', () => ({ default: PracticeSession }));
vi.mock('../../models/PracticeAttempt.js', () => ({ default: PracticeAttempt }));
vi.mock('../../models/mathpath/MathPathStudentSkillState.js', () => ({ default: MathPathStudentSkillState }));
vi.mock('../../models/mathpath/MathPathSkill.js', () => ({ default: MathPathSkill }));
vi.mock('../../models/mathpath/MathPathWorkingSession.js', () => ({ default: MathPathWorkingSession }));
vi.mock('../../models/studentProfile/StudentXP.js', () => ({ default: {} }));
vi.mock('../../models/studentProfile/StudentAchievement.js', () => ({ default: {} }));
vi.mock('../../models/studentProfile/StudentLearningEvent.js', () => ({ default: {} }));
vi.mock('../../utils/skillSlugDomain.js', () => ({ domainIdFromSlug: () => 'fractions' }));
vi.mock('../mathpath/domainSkillGraphServer.js', () => ({ getDomainSkillGraph: () => ({ totalSkills: 0 }) }));

// Chainable query mock: select/sort/limit/populate all no-op, lean() resolves.
const q = (value) => {
  const chain = {
    select: () => chain, sort: () => chain, limit: () => chain, populate: () => chain,
    lean: () => Promise.resolve(value),
  };
  return chain;
};

let deriveMetrics;
beforeAll(async () => { ({ deriveMetrics } = await import('./studentProfileService.js')); });

afterEach(() => vi.clearAllMocks());

describe('deriveMetrics — folds PracticeSession/PracticeAttempt activity into the profile', () => {
  it('counts fluency & generic practice for XP-metrics, disjointly, and for streak', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);

    // ---- MathPath* base values (the pre-existing sources) ----
    MathPathAttempt.countDocuments.mockResolvedValue(10); // questionsSolved base (+ workingAttempts)
    MathPathAttempt.distinct.mockResolvedValue([]);        // legacy in-MathPathAttempt fluency: none
    MathPathAttempt.find.mockReturnValue(q([]));           // recentAttempts
    MathPathDiagnosticSession.countDocuments.mockResolvedValue(1);
    MathPathDiagnosticSession.find.mockReturnValue(q([])); // exclusion + recentDiagnostics
    MathPathPracticeSession.countDocuments.mockResolvedValue(3); // practiceSessions base (domain practice)
    MathPathPracticeSession.find.mockReturnValue(q([]));   // completedForAwards + recentPracticeSessions
    MathPathAssessmentSession.countDocuments.mockResolvedValue(0);
    MathPathWorkingSession.countDocuments.mockResolvedValue(0);
    MathPathStudentSkillState.find.mockReturnValue(q([]));
    MathPathStudentSkillState.findOne.mockReturnValue(q(null));
    MasteryRecord.find.mockReturnValue(q([]));
    Skill.findOne.mockReturnValue(q({ name: 'Fractions' }));
    Skill.countDocuments.mockResolvedValue(26);

    // ---- NEW: the PracticeSession/PracticeAttempt fold-in ----
    PracticeSession.find.mockReturnValue(q([
      { _id: 'p1', mode: 'fluency', status: 'completed', endedAt: now },        // fluency ✓
      { _id: 'p2', mode: 'fluency', status: 'completed', endedAt: now },        // fluency ✓
      { _id: 'p3', mode: 'practice', status: 'completed', endedAt: yesterday }, // generic practice ✓
      { _id: 'p4', mode: 'practice', status: 'active', endedAt: null },         // not completed → not a session
      { _id: 'p5', mode: 'diagnostic', status: 'completed', endedAt: now },     // diagnostic → NOT a practice session
    ]));
    PracticeAttempt.countDocuments.mockResolvedValue(7); // questions answered across those sessions

    const m = await deriveMetrics({ _id: 'stu1' });

    // questionsSolved = MathPathAttempt base (10) + PracticeAttempt (7)
    expect(m.questionsSolved).toBe(17);
    // fluency counts ONLY the two completed fluency sessions (not p4 active)
    expect(m.fluencySessions).toBe(2);
    // practiceSessions = MathPathPracticeSession base (3) + generic p3 only
    // (fluency p1/p2 and diagnostic p5 are excluded to keep buckets disjoint)
    expect(m.practiceSessions).toBe(4);
    // streak: p1/p2/p5 today + p3 yesterday = two consecutive active days
    expect(m.streak).toBe(2);

    // scoping: PracticeSession was queried module:'MathPath' (excludes spelling)
    expect(PracticeSession.find).toHaveBeenCalledWith(
      expect.objectContaining({ module: 'MathPath' }),
    );
    // PracticeAttempt was scoped to this student's MathPath session ids
    expect(PracticeAttempt.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: { $in: ['p1', 'p2', 'p3', 'p4', 'p5'] } }),
    );
  });

  it('adds nothing when the student has no PracticeSession activity', async () => {
    MathPathAttempt.countDocuments.mockResolvedValue(4);
    MathPathAttempt.distinct.mockResolvedValue([]);
    MathPathAttempt.find.mockReturnValue(q([]));
    MathPathDiagnosticSession.countDocuments.mockResolvedValue(0);
    MathPathDiagnosticSession.find.mockReturnValue(q([]));
    MathPathPracticeSession.countDocuments.mockResolvedValue(2);
    MathPathPracticeSession.find.mockReturnValue(q([]));
    MathPathAssessmentSession.countDocuments.mockResolvedValue(0);
    MathPathWorkingSession.countDocuments.mockResolvedValue(0);
    MathPathStudentSkillState.find.mockReturnValue(q([]));
    MathPathStudentSkillState.findOne.mockReturnValue(q(null));
    MasteryRecord.find.mockReturnValue(q([]));
    Skill.findOne.mockReturnValue(q({ name: 'Fractions' }));
    Skill.countDocuments.mockResolvedValue(26);
    PracticeSession.find.mockReturnValue(q([])); // no fluency/practice
    PracticeAttempt.countDocuments.mockResolvedValue(0);

    const m = await deriveMetrics({ _id: 'stu2' });
    expect(m.questionsSolved).toBe(4);
    expect(m.fluencySessions).toBe(0);
    expect(m.practiceSessions).toBe(2);
    // no completed practice sessions → PracticeAttempt count is skipped entirely
    expect(PracticeAttempt.countDocuments).not.toHaveBeenCalled();
  });
});
