import { beforeEach, describe, expect, it, vi } from 'vitest';

const generatedQuestionFindOne = vi.fn();
const assignmentFindById = vi.fn();
const evaluateRecheckRecommendation = vi.fn();

vi.mock('../models/mathpath/GeneratedQuestion.js', () => ({
  default: {
    findOne: (...args) => generatedQuestionFindOne(...args),
  },
}));

vi.mock('../models/mathpath/MathPathAssignment.js', () => ({
  default: {
    findById: (...args) => assignmentFindById(...args),
  },
}));

vi.mock('../services/mathpath/mathPathAssignmentService.js', () => ({
  evaluateRecheckRecommendation: (...args) => evaluateRecheckRecommendation(...args),
}));

const service = await import('../services/mathpath/recoveryPackTeachingFlowService.js');

const assignment = {
  _id: 'assignment_1',
  title: 'Fractions Recovery Pack',
  status: 'assigned',
  skillIds: ['F018'],
  completedStages: [],
  guidedPracticeProgress: [],
  independentPracticeProgress: [],
  masteryCheckProgress: {},
  evidenceSource: {
    studentExplanation: 'This Recovery Pack teaches the method before practice.',
  },
  guidedPracticeFlow: {
    status: 'ready',
    steps: [
      {
        type: 'worked_example',
        title: 'Adding denominators directly',
        content: {
          incorrectMethod: '1/2 + 1/3 = 2/5',
          whyIncorrect: 'Halves and thirds are not the same-sized parts.',
          correctMethod: 'Rename both fractions as sixths before adding.',
          visualExplanation: 'Use fraction strips.',
          keyTakeaway: 'Make the parts the same size first.',
        },
      },
      { type: 'visual_explanation', visualModelType: 'fraction_strip', explanation: 'Line up the strips.' },
      { type: 'guided_question', practiceId: 'guided_missing_1', title: 'Guided Question 1' },
      { type: 'independent_practice', practiceIds: ['independent_missing_1'], title: 'Independent Practice' },
      { type: 'mastery_check', recheckQuestionIds: ['recheck_missing_1'], title: 'Mastery Check' },
    ],
  },
};

function missingQuestionQuery() {
  return { lean: vi.fn().mockResolvedValue(null) };
}

describe('recoveryPackTeachingFlowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generatedQuestionFindOne.mockReturnValue(missingQuestionQuery());
  });

  it('builds a teaching flow with worked example, visual explanation, fallback questions and warnings', async () => {
    const flow = await service.buildRecoveryPackTeachingFlow(assignment);

    expect(flow.assignment.title).toBe('Fractions Recovery Pack');
    expect(flow.whatLearning.skillLabels).toContain('Adding fractions with different denominators');
    expect(flow.workedExample.content.correctMethod).toMatch(/sixths/i);
    expect(flow.visualExplanation.renderable).toBe(true);
    expect(flow.guidedPractice.questions[0]).toMatchObject({
      questionId: 'guided_missing_1',
      source: 'fallback',
    });
    expect(flow.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'missing_question_record', referenceId: 'guided_missing_1' }),
    ]));
    expect(JSON.stringify(flow)).not.toMatch(/\bF\d{3}\b/);
  });

  it('persists stage progress and advances the assignment current stage', async () => {
    const doc = {
      ...assignment,
      _id: 'assignment_1',
      completedStages: [],
      stageHistory: [],
      completion: {},
      save: vi.fn().mockResolvedValue(undefined),
      toObject() { return this; },
    };
    assignmentFindById
      .mockResolvedValueOnce(doc)
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(doc) });

    const flow = await service.updateRecoveryPackTeachingProgress({
      assignmentId: 'assignment_1',
      stageId: 'worked_example',
    });

    expect(doc.completedStages).toContain('worked_example');
    expect(doc.currentStage).toBe('what_learning');
    expect(doc.save).toHaveBeenCalled();
    expect(flow.assignment.completedStages).toContain('worked_example');
  });
});
