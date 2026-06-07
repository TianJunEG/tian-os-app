import { describe, expect, it } from 'vitest';
import {
  applyMistakeLearningAction,
  auditMasteryInflationRisk,
  buildMistakeCorrectionFlow,
  shapeMistakeLearningFields,
} from '../services/mathpath/mistakeCorrectionFlow.js';

function mistake(overrides = {}) {
  return {
    _id: 'mistake_1',
    status: 'open',
    reviewed: false,
    studentAnswer: '2/5',
    correctAnswer: '5/6',
    mistakeType: 'method_error',
    misconceptionTag: 'adds_denominators_directly',
    ...overrides,
  };
}

describe('mistakeCorrectionFlow', () => {
  it('acknowledging a mistake does not mark it mastered', () => {
    const m = mistake();
    const result = applyMistakeLearningAction(m, { action: 'acknowledge', userId: 'user_1' });

    expect(result.learningStatus).toBe('acknowledged');
    expect(m.reviewed).toBe(true);
    expect(m.status).toBe('reviewed');
    expect(m.resolved).not.toBe(true);
    expect(m.masteryEvidence?.evidenceType).toBeUndefined();
  });

  it('requires reflection before correction can progress', () => {
    const m = mistake();

    expect(() => applyMistakeLearningAction(m, {
      action: 'correct',
      reflection: '',
      correctionAttempt: '5/6',
    })).toThrow(/reflection/i);
  });

  it('requires a correction attempt before understanding', () => {
    const m = mistake({ learningStatus: 'acknowledged' });

    expect(() => applyMistakeLearningAction(m, {
      action: 'understand',
      understandingAnswer: 'I need a common denominator.',
    })).toThrow(/Correct the mistake/i);
  });

  it('moves from corrected to understood after a lightweight understanding check', () => {
    const m = mistake();

    const corrected = applyMistakeLearningAction(m, {
      action: 'correct',
      reflection: 'I added the denominators directly.',
      correctionAttempt: '5/6',
    });
    expect(corrected.learningStatus).toBe('corrected');

    const understood = applyMistakeLearningAction(m, {
      action: 'understand',
      understandingAnswer: 'I should make both fractions into sixths before adding.',
    });
    expect(understood.learningStatus).toBe('understood');
    expect(m.understandingCheck.passed).toBe(true);
  });

  it('requires mastery evidence before mastered status', () => {
    const m = mistake({ learningStatus: 'understood' });

    expect(() => applyMistakeLearningAction(m, { action: 'master', masteryEvidence: {} }))
      .toThrow(/Mastery needs/i);

    const mastered = applyMistakeLearningAction(m, {
      action: 'master',
      masteryEvidence: { evidenceType: 'successful_correction', sourceId: 'mistake_1' },
    });
    expect(mastered.learningStatus).toBe('mastered');
    expect(m.status).toBe('resolved');
    expect(m.masteryEvidence.evidenceType).toBe('successful_correction');
  });

  it('shapes parent and tutor visible distinct states', () => {
    const fields = shapeMistakeLearningFields(mistake({ learningStatus: 'understood' }));

    expect(fields.learningStatus).toBe('understood');
    expect(fields.learningStatusLabel).toBe('You showed understanding.');
    expect(fields.correctionFlow.masteryRule).toMatch(/Mastery needs/i);
  });

  it('flags mastery inflation risk when reviewed has no evidence', () => {
    const audit = auditMasteryInflationRisk({
      mistakes: [
        mistake({ reviewed: true, learningStatus: 'acknowledged' }),
        mistake({ status: 'resolved', resolved: true, learningStatus: 'mastered' }),
      ],
    });

    expect(audit.reviewedWithoutEvidenceCount).toBe(1);
    expect(audit.resolvedWithoutEvidenceCount).toBe(1);
    expect(audit.risk).toBe('high');
  });

  it('builds age-appropriate correction prompts', () => {
    const flow = buildMistakeCorrectionFlow(mistake());

    expect(flow.reflectionPrompt).toBe('What was the mistake?');
    expect(flow.correctionPrompt).toBe('Write the corrected answer.');
    expect(flow.understandingPrompt).toMatch(/Which step/i);
  });
});
