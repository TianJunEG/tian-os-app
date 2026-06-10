import { describe, expect, it } from 'vitest';
import {
  buildLearningPathAnalytics,
  evaluateMasteryCriteria,
  inferCompletedStagesFromProgress,
  markStageCompleted,
} from '../services/mathpath/masteryCriteriaEngine.js';

describe('masteryCriteriaEngine', () => {
  it('advances a stage without losing completed stage history', () => {
    const updated = markStageCompleted({
      assignment: {
        currentStage: 'concept_introduction',
        completedStages: [],
      },
      stageId: 'concept_introduction',
    });

    expect(updated.completedStages).toEqual(['concept_introduction']);
    expect(updated.currentStage).toBe('visual_understanding');
  });

  it('infers stage progression from recovery pack completion evidence', () => {
    const progress = inferCompletedStagesFromProgress({
      assignment: {
        status: 'completed',
        targetQuestionCount: 10,
        completion: { questionsAttempted: 10, accuracy: 80 },
      },
    });

    expect(progress.completedStages).toContain('guided_practice');
    expect(progress.completedStages).toContain('independent_practice');
    expect(progress.completedStages).not.toContain('mastery_check');
    expect(progress.currentStage).toBe('mastery_check');
  });

  it('requires full path completion and mastery check before recheck', () => {
    const result = evaluateMasteryCriteria({
      assignment: {
        learningPathId: 'lp_1',
        completedStages: ['concept_introduction', 'worked_example'],
        completion: { accuracy: 90 },
      },
    });

    expect(result.readyForRecheck).toBe(false);
    expect(result.missingCriteria).toContain('stageCompletion');
    expect(result.missingCriteria).toContain('masteryCheck');
  });

  it('passes mastery criteria when all required evidence exists', () => {
    const result = evaluateMasteryCriteria({
      assignment: {
        learningPathId: 'lp_1',
        completedStages: [
          'concept_introduction',
          'visual_understanding',
          'worked_example',
          'guided_practice',
          'independent_practice',
          'mastery_check',
          'recheck_ready',
        ],
        completion: { accuracy: 82 },
      },
      evidence: { misconceptionResolved: true },
    });

    expect(result.readyForRecheck).toBe(true);
    expect(result.missingCriteria).toEqual([]);
  });

  it('tracks learning path analytics and stage drop-off', () => {
    const analytics = buildLearningPathAnalytics({
      assignments: [
        { completedStages: ['concept_introduction', 'visual_understanding'] },
        { completedStages: ['concept_introduction'] },
      ],
    });

    expect(analytics.stageCompletion.find((row) => row.stageId === 'concept_introduction').completionRate).toBe(100);
    expect(analytics.highDropOffStages.some((row) => row.stageId === 'worked_example')).toBe(true);
  });
});
