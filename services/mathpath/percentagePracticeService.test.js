import { describe, it, expect } from 'vitest';
import {
  buildPercentagePracticeSession,
  toClientQuestions,
} from './percentagePracticeService.js';

// Skill P002 owns both "Percentage → Decimal" and "Percentage → Fraction"
// (both use the pctConvert generator). The fraction family must carry
// answerFormat:'fraction' so the client renders the stacked numerator/
// denominator input (FractionAnswerInput) rather than a plain text box.
describe('buildPercentagePracticeSession — answerFormat propagation', () => {
  it('tags percent→fraction questions with answerFormat:"fraction" and forwards it to the client', () => {
    const session = buildPercentagePracticeSession({ targetSkillId: 'P002', questionCount: 6 });
    const clientQuestions = toClientQuestions(session.questions);

    const fractionQuestions = clientQuestions.filter((q) => /as a fraction/i.test(q.prompt));
    const decimalQuestions = clientQuestions.filter((q) => /as a decimal/i.test(q.prompt));

    // The fraction family is reachable for skill P002.
    expect(fractionQuestions.length).toBeGreaterThan(0);
    for (const q of fractionQuestions) {
      expect(q.answerFormat).toBe('fraction');
      // Stripping must not leak the answer to the client.
      expect(q.answer).toBeUndefined();
      expect(q.acceptedAnswers).toBeUndefined();
    }

    // Decimal-answer questions must NOT be mislabelled as fractions.
    for (const q of decimalQuestions) {
      expect(q.answerFormat).toBeUndefined();
    }
  });
});
