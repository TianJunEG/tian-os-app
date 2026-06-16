import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
const fluencyMock = vi.fn();
const retentionMock = vi.fn();

vi.mock('../../models/MasteryRecord.js', () => ({ default: { find: (...a) => masteryFind(...a) } }));
vi.mock('../../models/Skill.js', () => ({ default: { find: (...a) => skillFind(...a) } }));
vi.mock('../../models/Mistake.js', () => ({ default: { find: (...a) => mistakeFind(...a) } }));
vi.mock('../../routes/fluency.js', () => ({
  publicFluencySummary: (...a) => fluencyMock(...a),
  publicRetentionSummary: (...a) => retentionMock(...a),
}));

const MASTERY_RECORDS = [
  { _id: 'm1', status: 'mastered', skillId: { _id: 's1', name: 'Equivalent Fractions', slug: 'fr.equivalent' } },
  { _id: 'm2', status: 'weak', skillId: { _id: 's2', name: 'Add Unlike Denominators', slug: 'fr.add.unlike' } },
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

beforeEach(() => {
  masteryFind.mockReturnValue(query(MASTERY_RECORDS));
  skillFind.mockReturnValue(query(SKILLS));
  mistakeFind.mockReturnValue(query(MISTAKES));
  fluencyMock.mockResolvedValue({
    fluentSkills: [{ skillId: 's1', skillName: 'Equivalent Fractions' }],
    developingSkills: [{ skillId: 's2', skillName: 'Add Unlike Denominators' }],
    needsPracticeSkills: [],
  });
  retentionMock.mockResolvedValue({ upcomingReviews: [{ skillName: 'Simplify Fractions' }], overdueReviews: [], retentionHistory: [] });
});

afterEach(() => { vi.clearAllMocks(); });

describe('buildParentMathPathDashboard', () => {
  beforeEach(async () => {
    const mod = await import('./parentDashboardAggregator.js');
    aggregator = mod;
  });

  it('aggregates fractions data scoped to the requested domain', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'fractions' });

    expect(res.domainId).toBe('fractions');
    expect(res.domain.displayNoun).toBe('fraction');
    // 3 fractions skills (fr.*), 1 mastered → 33.3%. pct.of is excluded.
    expect(res.masteryProgress.totalSkills).toBe(3);
    expect(res.masteryProgress.percentageMastered).toBe(33.3);
    expect(res.masteryProgress.weakSkills).toContain('Add Unlike Denominators');
    expect(res.weakSkills.map((w) => w.skillName)).toContain('Add Unlike Denominators');
    // Only fractions mistakes, not the percentage one.
    expect(res.recentMistakes).toHaveLength(1);
    expect(res.recentMistakes[0].skillName).toBe('Add Unlike Denominators');
    // Fluency framing reused from the shared builder.
    expect(res.fluencySummary.fluentAreas).toContain('Equivalent Fractions');
    expect(res.fluencySummary.accurateButSlowAreas).toContain('Add Unlike Denominators');
    expect(res.recommendedNextPractice.skillName).toBe('Add Unlike Denominators');
  });

  it('keeps the fractions copy noun (parity with the live pilot)', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'fractions' });
    expect(res.weeklyActionPlan.parentChecklist.some((line) => line.includes('fraction skill'))).toBe(true);
  });

  it('uses a domain-aware copy noun for a non-fractions domain', async () => {
    const res = await aggregator.buildParentMathPathDashboard({ student: { _id: 'stu_1' }, domainId: 'percentage' });
    expect(res.domainId).toBe('percentage');
    expect(res.domain.displayNoun).toBe('percentage');
    // 1 percentage skill (pct.of), mastered → 100%.
    expect(res.masteryProgress.totalSkills).toBe(1);
    expect(res.masteryProgress.percentageMastered).toBe(100);
    expect(res.weeklyActionPlan.parentChecklist.some((line) => line.includes('percentage skill'))).toBe(true);
  });
});

describe('listChildMathPathDomains', () => {
  beforeEach(async () => {
    const mod = await import('./parentDashboardAggregator.js');
    aggregator = mod;
  });

  it('returns only domains the child has mastery activity in', async () => {
    const res = await aggregator.listChildMathPathDomains({ student: { _id: 'stu_1' } });
    const ids = res.map((d) => d.domainId);
    expect(ids).toContain('fractions');
    expect(ids).toContain('percentage');
    // Domains with no records (e.g. geometry) are excluded.
    expect(ids).not.toContain('geometry');
  });
});
