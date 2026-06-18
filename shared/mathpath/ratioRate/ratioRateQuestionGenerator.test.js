import { describe, expect, it } from 'vitest';
import { buildRatioRatePracticeSession, scoreRatioRateSubmission } from '../../../services/mathpath/ratioRatePracticeService.js';

const SKILL_IDS = [
  'R001', 'R002', 'R003', 'R004', 'R005',
  'R006', 'R007', 'R008', 'R009', 'R010',
  'R011', 'R012', 'R013', 'R014', 'R015',
];

describe('ratio & rate question generator quality', () => {
  it('generates answerable questions with worked solutions and misconception tags', () => {
    const questions = SKILL_IDS.flatMap((targetSkillId) => (
      buildRatioRatePracticeSession({ targetSkillId, questionCount: 8 }).questions
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

    const correct = scoreRatioRateSubmission({ questions, responses: correctResponses });
    const wrong = scoreRatioRateSubmission({ questions, responses: wrongResponses });

    expect(questions.length).toBeGreaterThan(0);
    expect(correct.results.every((r) => r.correct)).toBe(true);
    expect(wrong.results.some((r) => r.correct)).toBe(false);
    for (const q of questions) {
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method|Placeholder/i);
      expect(q.solutionSteps.length).toBeGreaterThan(0);
      expect(q.misconceptionTag).toMatch(/^rr\//);
      expect(q.answer.display).toBeTruthy();
    }
  });

  it('emits bar-model diagrams for visual ratio and sharing families', () => {
    const visualSkills = ['R001', 'R006', 'R007', 'R008'];
    const questions = visualSkills.flatMap((targetSkillId) => (
      buildRatioRatePracticeSession({ targetSkillId, questionCount: 8 }).questions
    ));
    const visualQuestions = questions.filter((q) => q.diagram);

    expect(visualQuestions.length).toBeGreaterThan(0);
    for (const q of visualQuestions) {
      expect(q.diagram.kind).toBe('bar-model');
    }
  });
});
