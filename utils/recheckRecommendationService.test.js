import { describe, expect, it } from 'vitest';
import { evaluateRecheckReadiness } from '../services/mathpath/recheckRecommendationService.js';

describe('recheckRecommendationService', () => {
  it('recommends recheck when the recovery pack is completed', () => {
    const result = evaluateRecheckReadiness({
      status: 'completed',
      targetQuestionCount: 12,
      completion: { questionsAttempted: 12, accuracy: 50 },
    });

    expect(result.recommended).toBe(true);
    expect(result.reason).toBe('Recovery pack completed.');
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
