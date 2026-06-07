import { describe, expect, it } from 'vitest';
import { evaluateRecheckReadiness } from '../services/mathpath/recheckRecommendationService.js';

describe('recheckRecommendationService', () => {
  it('recommends recheck when a legacy recovery pack is completed', () => {
    const result = evaluateRecheckReadiness({
      status: 'completed',
      targetQuestionCount: 12,
      completion: { questionsAttempted: 12, accuracy: 50 },
    });

    expect(result.recommended).toBe(true);
    expect(result.reason).toContain('Recovery pack completed.');
  });

  it('recommends recheck after 80 percent completion with 70 percent accuracy', () => {
    const result = evaluateRecheckReadiness({
      status: 'in_progress',
      targetQuestionCount: 10,
      completion: { questionsAttempted: 8, accuracy: 75 },
    });

    expect(result.recommended).toBe(true);
    expect(result.reason).toContain('80% complete');
  });

  it('blocks recheck for learning path assignments until mastery criteria are met', () => {
    const result = evaluateRecheckReadiness({
      status: 'completed',
      learningPathId: 'lp_fractions_f018_common_denominator_missing',
      targetQuestionCount: 12,
      completedStages: ['concept_introduction', 'visual_understanding', 'worked_example'],
      currentStage: 'guided_practice',
      completion: { questionsAttempted: 12, accuracy: 90 },
    });

    expect(result.recommended).toBe(false);
    expect(result.learningPathReady).toBe(false);
    expect(result.reason).toContain('Complete the learning path');
    expect(result.mastery.missingCriteria).toContain('stageCompletion');
  });

  it('recommends recheck when learning path stage and mastery criteria are met', () => {
    const result = evaluateRecheckReadiness({
      status: 'completed',
      learningPathId: 'lp_fractions_f018_common_denominator_missing',
      targetQuestionCount: 12,
      completedStages: [
        'concept_introduction',
        'visual_understanding',
        'worked_example',
        'guided_practice',
        'independent_practice',
        'mastery_check',
        'recheck_ready',
      ],
      currentStage: 'recheck_ready',
      completion: { questionsAttempted: 12, accuracy: 85 },
    });

    expect(result.recommended).toBe(true);
    expect(result.learningPathReady).toBe(true);
    expect(result.reason).toContain('Learning path criteria met');
  });

  it('does not recommend recheck before enough evidence exists', () => {
    const result = evaluateRecheckReadiness({
      status: 'in_progress',
      targetQuestionCount: 10,
      completion: { questionsAttempted: 4, accuracy: 100 },
    });

    expect(result.recommended).toBe(false);
    expect(result.reason).toBe('Keep practising before recheck.');
  });
});
