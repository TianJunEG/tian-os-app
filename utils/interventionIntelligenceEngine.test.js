import { beforeEach, describe, expect, it, vi } from 'vitest';

const recommendationCreateMock = vi.fn();
const recommendationFindMock = vi.fn();

vi.mock('../models/InterventionRecommendation.js', () => ({
  default: {
    create: (...args) => recommendationCreateMock(...args),
    find: (...args) => recommendationFindMock(...args),
  },
}));

vi.mock('../models/mathpath/MathPathAssignment.js', () => ({
  default: { find: vi.fn() },
}));

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: { find: vi.fn() },
}));

vi.mock('../models/mathpath/MathPathMistakeRecord.js', () => ({
  default: { find: vi.fn() },
}));

vi.mock('../models/mathpath/MathPathWorkingIntelligence.js', () => ({
  default: { find: vi.fn() },
}));

const {
  auditDecisionLogic,
  buildInterventionEffectivenessStats,
  buildInterventionIntelligence,
  buildRecommendedActions,
  buildSkillPriorityRows,
  persistInterventionRecommendations,
} = await import('../services/intervention/interventionIntelligenceEngine.js');
const {
  evaluateStudentReadiness,
} = await import('../services/intervention/readinessEngine.js');
const {
  buildParentRecommendations,
} = await import('../services/mathpath/parentRecommendationEngine.js');

describe('intervention intelligence engine', () => {
  beforeEach(() => {
    recommendationCreateMock.mockReset();
    recommendationFindMock.mockReset();
  });

  it('scores intervention priority from diagnostic, paper, assignment, misconception and working evidence', () => {
    const rows = buildSkillPriorityRows({
      growth: {
        latest: { completedAt: '2026-06-06T00:00:00.000Z' },
        remainingWeakSkills: ['F011'],
        perSkillGrowth: [{ skillId: 'F011', beforeScore: 42, currentScore: 32, improvement: -10 }],
      },
      papers: [{
        _id: 'paper1',
        status: 'reviewed',
        weakSkillIds: ['F011'],
        detectedQuestions: [{ adultConfirmedWrong: true, misconceptionTags: ['equivalence_scale_error'] }],
        reviewedAt: '2026-06-06T01:00:00.000Z',
      }],
      assignments: [{
        _id: 'assignment1',
        status: 'completed',
        title: 'F011 Recovery Pack',
        skillIds: ['F011'],
        completion: { accuracy: 55, questionsAttempted: 12, questionsAssigned: 12 },
        updatedAt: '2026-06-06T02:00:00.000Z',
      }],
      mistakes: [{
        skillId: 'F011',
        mistakeCode: 'equivalence_scale_error',
        mistakeName: 'Scaling numerator only',
        frequency: 4,
        severity: 'high',
      }],
      workings: [{
        workingId: 'working1',
        skillId: 'F011',
        qualityBand: 'INSUFFICIENT',
      }],
    });

    expect(rows[0]).toMatchObject({
      skillId: 'F011',
      priorityScore: 100,
    });
    expect(rows[0].evidence.map((item) => item.type)).toEqual(expect.arrayContaining([
      'diagnostic_weakness',
      'paper_analysis_weakness',
      'assignment_performance',
      'misconception_frequency',
      'working_evidence_quality',
    ]));
  });

  it('generates next-best actions with evidence', () => {
    const actions = buildRecommendedActions({
      priorityRows: [{
        skillId: 'F011',
        priorityScore: 88,
        evidence: [
          { type: 'paper_analysis_weakness', reason: 'Paper analysis confirmed weakness in F011.' },
          { type: 'misconception_frequency', reason: 'Scaling numerator only appeared 4 times.', frequency: 4, severity: 'high' },
        ],
      }],
      readiness: { recheck: { ready: false }, advancement: { ready: false }, enrichment: { ready: false } },
      assignments: [],
      papers: [],
      growth: {},
    });

    expect(actions.map((item) => item.action)).toEqual(expect.arrayContaining([
      'assign_recovery_pack',
      'generate_worksheet',
      'tutor_support',
    ]));
    expect(actions[0].why.length).toBeGreaterThan(0);
  });

  it('evaluates readiness for recheck, advancement and enrichment', () => {
    const ready = evaluateStudentReadiness({
      growth: {
        latest: { readinessScore: 91 },
        remainingWeakSkills: [],
        perSkillGrowth: [{ skillId: 'F011', currentScore: 88 }],
      },
      assignments: [{
        _id: 'assignment1',
        status: 'completed',
        title: 'Recovery Pack',
        skillIds: ['F011'],
        completion: { questionsAttempted: 12, questionsAssigned: 12, accuracy: 82 },
      }],
    });

    expect(ready.recheck.ready).toBe(true);
    expect(ready.advancement.ready).toBe(true);
    expect(ready.enrichment.ready).toBe(true);
  });

  it('persists recommendation history with evidence and reasons', async () => {
    recommendationCreateMock.mockImplementation(async (doc) => ({ _id: 'rec1', ...doc }));
    const intelligence = buildInterventionIntelligence({
      studentId: '507f1f77bcf86cd799439011',
      growth: {
        latest: { readinessScore: 40, completedAt: '2026-06-06T00:00:00.000Z' },
        remainingWeakSkills: ['F011'],
        perSkillGrowth: [{ skillId: 'F011', currentScore: 35, improvement: -5 }],
      },
      assignments: [],
      papers: [],
      mistakes: [],
      workings: [],
    });

    const saved = await persistInterventionRecommendations({
      intelligence,
      studentId: '507f1f77bcf86cd799439011',
    });

    expect(saved[0]).toMatchObject({
      interventionAction: 'assign_recovery_pack',
      targetSkillIds: ['F011'],
    });
    expect(recommendationCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      interventionAction: 'assign_recovery_pack',
      supportingEvidence: expect.any(Array),
      reasons: expect.any(Array),
    }));
  });

  it('tracks intervention effectiveness by action and outcome', () => {
    const stats = buildInterventionEffectivenessStats([
      { interventionAction: 'assign_recovery_pack', status: 'accepted', outcome: { outcomeType: 'improved', metricDelta: 22 } },
      { interventionAction: 'assign_recovery_pack', status: 'accepted', outcome: { outcomeType: 'stable', metricDelta: 0 } },
      { interventionAction: 'generate_worksheet', status: 'rejected', outcome: { outcomeType: 'unknown' } },
    ]);

    expect(stats.find((row) => row.interventionAction === 'assign_recovery_pack')).toMatchObject({
      assignedCount: 2,
      acceptedCount: 2,
      improvedCount: 1,
      successRate: 50,
      averageMetricDelta: 11,
    });
  });

  it('returns explainable recommendations that answer why', () => {
    const intelligence = buildInterventionIntelligence({
      studentId: 'student1',
      growth: {
        latest: { readinessScore: 35, completedAt: '2026-06-06T00:00:00.000Z' },
        remainingWeakSkills: ['F011'],
        perSkillGrowth: [{ skillId: 'F011', beforeScore: 42, currentScore: 32, improvement: -10 }],
      },
      papers: [{ status: 'reviewed', weakSkillIds: ['F011'], detectedQuestions: [{ adultConfirmedWrong: true }] }],
      assignments: [],
      mistakes: [{ skillId: 'F011', mistakeCode: 'equivalence_scale_error', frequency: 3, severity: 'high' }],
      workings: [],
    });

    expect(intelligence.recommendedActions[0]).toMatchObject({
      action: 'assign_recovery_pack',
      title: 'Assign Recovery Pack',
      targetSkillId: 'F011',
    });
    expect(intelligence.recommendedActions[0].why.join(' ')).toMatch(/F011|Paper analysis|appeared/i);
    expect(intelligence.supportingEvidence.audit).toEqual(auditDecisionLogic());
  });

  it('keeps the existing parent recommendation system working', () => {
    const recommendations = buildParentRecommendations({
      growth: { remainingWeakSkills: ['F011'], latest: { completedAt: '2026-06-06T00:00:00.000Z' } },
      assignments: [],
      papers: [],
      mistakes: [],
    });

    expect(recommendations[0]).toMatchObject({
      type: 'assign_recovery_pack',
      skillId: 'F011',
    });
  });
});
