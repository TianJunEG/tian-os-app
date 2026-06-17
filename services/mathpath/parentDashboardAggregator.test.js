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

const masteryFind = vi.fn();
const skillFind = vi.fn();
const mistakeFind = vi.fn();
const mpStateFind = vi.fn();
const mpStateDistinct = vi.fn();
const mpMistakeFind = vi.fn();
const fluencyMock = vi.fn();
const retentionMock = vi.fn();

vi.mock('../../models/MasteryRecord.js', () => ({ default: { find: (...a) => masteryFind(...a) } }));
vi.mock('../../models/Skill.js', () => ({ default: { find: (...a) => skillFind(...a) } }));
vi.mock('../../models/Mistake.js', () => ({ default: { find: (...a) => mistakeFind(...a) } }));
vi.mock('../../models/mathpath/MathPathStudentSkillState.js', () => ({
  default: { find: (...a) => mpStateFind(...a), distinct: (...a) => mpStateDistinct(...a) },
}));
vi.mock('../../models/mathpath/MathPathMistakeRecord.js', () => ({ default: { find: (...a) => mpMistakeFind(...a) } }));
vi.mock('../../routes/fluency.js', () => ({
  publicFluencySummary: (...a) => fluencyMock(...a),
  publicRetentionSummary: (...a) => retentionMock(...a),
}));

const MASTERY_RECORDS = [
  { _id: 'm1', status: 'mastered', skillId: { _id: 's1', name: 'Equivalent Fractions', slug: 'fr.equivalent' } },
  { _id: 'm2', status: 'needs_review', skillId: { _id: 's2', name: 'Add Unlike Denominators', slug: 'fr.add.unlike' } },
  { _id: 'm3', status: 'mastered', skillId: { _id: 's3', name: 'Percent of a Number', slug: 'pct.of' } },
];
const SKILLS = [
  { _id: 's1', name: 'Equivalent Fractions', slug: 'fr.equivalent' },
  { _id: 's2', name: 'Add Unlike Denominators', slug: 'fr.add.unlike' },
  { _id: 's4', name: 'Simplify Fractions', slug: 'fr.simplify' },
  { _id: 's3', name: 'Percent of a Number', slug: 'pct.of' },
];
const MISTAKES = [
  { _id: 'mi1', skillId: { _id: 's2', name: 'Add Unlike Denominators', slug: 'fr.add.unlike' }, misconceptionTag: 'added_denominators', questionText: '1/2 + 1/3', studentAnswer: '2/5', correctAnswer: '5/6', occurredAt: new Date('2026-06-01') },
  { _id: 'mi2', skillId: { _id: 's3', name: 'Percent of a Number', slug: 'pct.of' }, misconceptionTag: '', questionText: '10% of 50', studentAnswer: '500', correctAnswer: '5', occurredAt: new Date('2026-06-02') },
];

let aggregator;

// Import once — pulls in the 5 shared domain skill graphs, which are heavy to
// transform on a cold cache; a per-test import would blow the default 10s hook.
beforeAll(async () => {
  aggregator = await import('./parentDashboardAggregator.js');
}, 30000);

beforeEach(() => {
  masteryFind.mockReturnValue(query(MASTERY_RECORDS));
  skillFind.mockReturnValue(query(SKILLS));
  mistakeFind.mockReturnValue(query(MISTAKES));
  mpStateFind.mockReturnValue(query([]));
  mpStateDistinct.mockResolvedValue([]);
  mpMistakeFind.mockReturnValue(query([]));
  fluencyMock.mockResolvedValue({
    fluentSkills: [{ skillId: 's1', skillName: 'Equivalent Fractions' }],
    developingSkills: [{ skillId: 's2', skillName: 'Add Unlike Denominators' }],
    needsPracticeSkills: [],
  });
  retentionMock.mockResolvedValue({ upcomingReviews: [{ skillName: 'Simplify Fractions' }], overdueReviews: [], retentionHistory: [] });
});

afterEach(() => { vi.clearAllMocks(); });

describe('buildParentMathPathDashboard — legacy MasteryRecord source (Fractions)', () => {
  it('aggregates fractions data scoped to the requested domain', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'fractions' });

    expect(res.dataSource).toBe('mastery');
    expect(res.domain.displayNoun).toBe('fraction');
    // 3 fractions skills (fr.*), 1 mastered → 33.3%. pct.of is excluded.
    expect(res.masteryProgress.totalSkills).toBe(3);
    expect(res.masteryProgress.percentageMastered).toBe(33.3);
    expect(res.masteryProgress.weakSkills).toContain('Add Unlike Denominators');
    expect(res.weakSkills.map((w) => w.skillName)).toContain('Add Unlike Denominators');
    expect(res.recentMistakes).toHaveLength(1);
    expect(res.recentMistakes[0].skillName).toBe('Add Unlike Denominators');
    expect(res.fluencySummary.fluentAreas).toContain('Equivalent Fractions');
    expect(res.recommendedNextPractice.skillName).toBe('Add Unlike Denominators');
  });

  it('keeps the fractions copy noun (parity with the live pilot)', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'fractions' });
    expect(res.weeklyActionPlan.parentChecklist.some((line) => line.includes('fraction skill'))).toBe(true);
  });

  it('uses a domain-aware copy noun when a non-fractions domain has legacy records', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'percentage' });
    expect(res.dataSource).toBe('mastery');
    expect(res.domain.displayNoun).toBe('percentage');
    expect(res.masteryProgress.totalSkills).toBe(1);
    expect(res.masteryProgress.percentageMastered).toBe(100);
    expect(res.weeklyActionPlan.parentChecklist.some((line) => line.includes('percentage skill'))).toBe(true);
  });
});

describe('buildParentMathPathDashboard — MathPath per-domain source (Ratio)', () => {
  it('falls back to MathPathStudentSkillState when no legacy records exist', async () => {
    // No legacy ratio records (MASTERY_RECORDS has none) → MathPath store is used.
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
    expect(res.recentMistakes).toHaveLength(1);
    expect(res.recentMistakes[0].misconceptionTag).toBe('rr_inverts_ratio');
  });

  it('returns a valid empty payload when a domain has no data anywhere', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'geometry' });
    expect(res.dataSource).toBe('none');
    expect(res.masteryProgress.masteredSkills).toHaveLength(0);
    expect(res.weakSkills).toHaveLength(0);
    expect(res.recentMistakes).toHaveLength(0);
  });
});

describe('listChildMathPathDomains', () => {
  it('unions legacy (MasteryRecord) and MathPath (skill-state) activity', async () => {
    mpStateDistinct.mockResolvedValue(['ratio', 'geometry']);
    const res = await aggregator.listChildMathPathDomains({ student: { _id: 'stu_1' } });
    const ids = res.map((d) => d.domainId);
    expect(ids).toContain('fractions');   // from MasteryRecord (fr.*)
    expect(ids).toContain('percentage');  // from MasteryRecord (pct.of)
    expect(ids).toContain('ratio');       // from MathPathStudentSkillState
    expect(ids).toContain('geometry');    // from MathPathStudentSkillState
    expect(ids).not.toContain('algebra'); // no activity in either store
  });
});
