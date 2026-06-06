import { describe, expect, it } from 'vitest';
import {
  buildParentRecommendations,
  buildSuccessCentreStory,
} from '../services/mathpath/parentRecommendationEngine.js';

describe('parentRecommendationEngine', () => {
  it('ranks recheck-ready recovery packs above other parent actions', () => {
    const recs = buildParentRecommendations({
      assignments: [
        {
          _id: 'assignment_1',
          title: 'Fractions Recovery Pack',
          status: 'completed',
          recheck: { recommended: true },
          completion: { questionsAttempted: 12, accuracy: 75 },
        },
      ],
      papers: [{ _id: 'paper_1', status: 'needs_review' }],
      growth: { remainingWeakSkills: ['F015'] },
    });

    expect(recs[0]).toMatchObject({
      type: 'run_recheck',
      priority: 'critical',
      title: 'Run Recheck',
    });
    expect(recs).toHaveLength(3);
  });

  it('builds improvement journey and current concerns for the dashboard card', () => {
    const story = buildSuccessCentreStory({
      student: { _id: 'student_1', name: 'Ava', level: 'P4' },
      growth: {
        baseline: { diagnosticSessionId: 'd1', readinessScore: 42, completedAt: '2026-06-01' },
        latest: { diagnosticSessionId: 'd2', readinessScore: 79, completedAt: '2026-06-05' },
        overallImprovement: 37,
        remainingWeakSkills: ['F019'],
        perSkillGrowth: [
          { skillId: 'F010', skillName: 'Equivalent Fractions', beforeScore: 31, currentScore: 85, improvement: 54 },
          { skillId: 'F019', skillName: 'Subtract Different Denominators', beforeScore: 45, currentScore: 52, improvement: 7 },
        ],
      },
      assignments: [{ _id: 'a1', title: 'Recovery Pack', status: 'completed', completion: { questionsAttempted: 12 }, targetQuestionCount: 12 }],
      recommendations: [{ title: 'Assign Recovery Pack' }],
    });

    expect(story.currentStatus.improvement).toBe(37);
    expect(story.improvementJourney.recheck.readinessScore).toBe(79);
    expect(story.topImprovements[0].skillId).toBe('F010');
    expect(story.currentConcerns[0]).toMatchObject({
      skillId: 'F019',
      currentReadiness: 52,
      suggestedAction: 'Assign Recovery Pack',
    });
  });
});
