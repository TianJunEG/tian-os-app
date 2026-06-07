import { describe, expect, it } from 'vitest';
import { auditQuestionVisualCoverage } from '../services/mathpath/visualQualityAuditService.js';

describe('visualQualityAuditService', () => {
  it('summarizes missing visual coverage by question and skill', () => {
    const audit = auditQuestionVisualCoverage([
      {
        id: 'q1',
        skillId: 'F005',
        questionText: 'Place 3/4 on the number line.',
        metadata: { visualType: 'number_line' },
        moeLevel: 'P4',
      },
      {
        id: 'q2',
        skillId: 'F025',
        questionText: 'A class completed 1/2 of the cards and then 1/3 of the remainder. How many were left?',
        moeLevel: 'P6',
      },
    ]);

    expect(audit.totalQuestions).toBe(2);
    expect(audit.visualCoveragePercent).toBe(50);
    expect(audit.missingQuestionVisuals[0]).toMatchObject({
      questionId: 'q2',
      skillId: 'F025',
      missingVisualTypes: expect.arrayContaining(['bar_model']),
    });
    expect(audit.barModelFindings.find((row) => row.skillId === 'F025').recommendation).toMatch(/bar_model/);
  });
});
