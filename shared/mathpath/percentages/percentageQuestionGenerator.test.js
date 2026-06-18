import { describe, expect, it } from 'vitest';
import { buildPercentagePracticeSession, scorePercentageSubmission } from '../../../services/mathpath/percentagePracticeService.js';

const SKILL_IDS = ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008', 'P009', 'P010'];

describe('percentage question generator quality', () => {
  it('generates answerable questions with worked solutions and misconception tags', () => {
    const questions = SKILL_IDS.flatMap((targetSkillId) => (
      buildPercentagePracticeSession({ targetSkillId, questionCount: 8 }).questions
    ));

    const correctResponses = questions.map((q) => ({
      questionId: q.questionId,
      answer: q.answer.display,
      confidence: 'i_know_this',
    }));
    const wrongResponses = questions.map((q) => ({
      questionId: q.questionId,
      answer: '__definitely_wrong__',
      confidence: 'i_know_this',
    }));

    const correct = scorePercentageSubmission({ questions, responses: correctResponses });
    const wrong = scorePercentageSubmission({ questions, responses: wrongResponses });

    expect(questions.length).toBeGreaterThan(0);
    expect(correct.results.every((r) => r.correct)).toBe(true);
    expect(wrong.results.some((r) => r.correct)).toBe(false);
    for (const q of questions) {
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method|Placeholder/i);
      expect(q.solutionSteps.length).toBeGreaterThan(0);
      expect(q.misconceptionTag).toMatch(/^pct\//);
      expect(q.answer.display).toBeTruthy();
    }
  });
});
