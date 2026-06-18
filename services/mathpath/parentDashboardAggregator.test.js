import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Chainable + awaitable query stub: supports .populate/.sort/.limit/.select
// (return self) and resolves to `value` when awaited or via .lean().
function query(value) {
  const q = {
    populate: () => q,
    sort: () => q,
    limit: () => q,
    select: () => q,
    lean: () => Promise.resolve(value),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return q;
}

const mpStateFind = vi.fn();
const mpStateDistinct = vi.fn();
const mpMistakeFind = vi.fn();

vi.mock('../../models/mathpath/MathPathStudentSkillState.js', () => ({
  default: { find: (...a) => mpStateFind(...a), distinct: (...a) => mpStateDistinct(...a) },
}));
vi.mock('../../models/mathpath/MathPathMistakeRecord.js', () => ({ default: { find: (...a) => mpMistakeFind(...a) } }));

const FRACTIONS_STATES = [
  { skillId: 'F010', domainId: 'fractions', status: 'accurate', accuracy: 88, attemptCount: 8, fluencyLevel: 'gold', retentionStatus: 'reviewScheduled', averageTime: 6 },
  { skillId: 'F020', domainId: 'fractions', status: 'needsReview', accuracy: 42, attemptCount: 5, fluencyLevel: 'notReady', retentionStatus: 'needsReview', nextReviewDate: new Date('2026-06-01') },
  { skillId: 'F030', domainId: 'fractions', status: 'notStarted', accuracy: 0, attemptCount: 0, fluencyLevel: 'notReady', retentionStatus: 'reviewScheduled' },
];

let aggregator;

// Import once — pulls in the 15 shared domain skill graphs; cold transform is
// heavy enough that a per-test import blows the default 10s hook timeout.
beforeAll(async () => {
  aggregator = await import('./parentDashboardAggregator.js');
}, 30000);

beforeEach(() => {
  mpStateFind.mockReturnValue(query([]));
  mpStateDistinct.mockResolvedValue([]);
  mpMistakeFind.mockReturnValue(query([]));
});

afterEach(() => { vi.clearAllMocks(); });

describe('buildParentMathPathDashboard — Fractions via skill-state store', () => {
  it('aggregates fractions data from MathPathStudentSkillState', async () => {
    mpStateFind.mockReturnValue(query(FRACTIONS_STATES));

    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'fractions' });

    expect(res.dataSource).toBe('mathpath');
    expect(res.domain.displayNoun).toBe('fraction');
    expect(res.masteryProgress.masteredSkills).toHaveLength(1); // F010 accurate
    expect(res.weakSkills[0].skillId).toBe('F020');
    expect(res.recommendedNextPractice.skillId).toBe('F020');
    expect(res.retentionSummary.skillsDueForReview.length).toBeGreaterThan(0);
  });

  it('keeps the fractions copy noun (parity with the live pilot)', async () => {
    mpStateFind.mockReturnValue(query(FRACTIONS_STATES));
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'fractions' });
    expect(res.weeklyActionPlan.parentChecklist.some((line) => line.includes('fraction skill'))).toBe(true);
  });

  it('returns a valid empty payload when fractions has no data', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'fractions' });
    expect(res.dataSource).toBe('none');
    expect(res.masteryProgress.masteredSkills).toHaveLength(0);
  });
});

describe('buildParentMathPathDashboard — non-fractions domains', () => {
  it('reads Ratio data from MathPathStudentSkillState', async () => {
    mpStateFind.mockReturnValue(query([
      { skillId: 'RR001', domainId: 'ratio', status: 'fluent', accuracy: 92, attemptCount: 6, fluencyLevel: 'gold', retentionStatus: 'reviewScheduled', averageTime: 8 },
      { skillId: 'RR002', domainId: 'ratio', status: 'weak', accuracy: 35, attemptCount: 4, fluencyLevel: 'notReady', retentionStatus: 'needsReview', nextReviewDate: new Date('2026-06-01') },
    ]));
    mpMistakeFind.mockReturnValue(query([
      { _id: 'rm1', domainId: 'ratio', skillId: 'RR002', mistakeCode: 'rr_inverts_ratio', mistakeName: 'Inverts the ratio', lastSeenAt: new Date('2026-06-10'), evidence: [{ questionText: 'Simplify 6:4', studentAnswer: '4:6', correctAnswer: '3:2' }] },
    ]));

    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'ratio' });

    expect(res.dataSource).toBe('mathpath');
    expect(res.masteryProgress.masteredSkills).toHaveLength(1);
    expect(res.weakSkills[0].skillId).toBe('RR002');
    expect(res.recommendedNextPractice.skillId).toBe('RR002');
    expect(res.fluency.fluentSkills).toHaveLength(1);
    expect(res.retentionSummary.skillsDueForReview.length).toBeGreaterThan(0);
    expect(res.recentMistakes[0].misconceptionTag).toBe('rr_inverts_ratio');
  });

  it('returns a valid empty payload when a domain has no data', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'geometry' });
    expect(res.dataSource).toBe('none');
    expect(res.masteryProgress.masteredSkills).toHaveLength(0);
    expect(res.weakSkills).toHaveLength(0);
    expect(res.recentMistakes).toHaveLength(0);
  });
});

describe('listChildMathPathDomains', () => {
  it('returns only domains present in MathPathStudentSkillState', async () => {
    mpStateDistinct.mockResolvedValue(['fractions', 'ratio', 'geometry']);
    const res = await aggregator.listChildMathPathDomains({ student: { _id: 'stu_1' } });
    const ids = res.map((d) => d.domainId);
    expect(ids).toContain('fractions');
    expect(ids).toContain('ratio');
    expect(ids).toContain('geometry');
    expect(ids).not.toContain('algebra'); // no activity
  });

  it('returns empty list when student has no skill-state activity', async () => {
    const res = await aggregator.listChildMathPathDomains({ student: { _id: 'stu_1' } });
    expect(res).toHaveLength(0);
  });
});
