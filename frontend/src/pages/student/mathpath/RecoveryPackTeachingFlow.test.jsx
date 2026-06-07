import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecoveryPackTeachingFlow from './RecoveryPackTeachingFlow.jsx';

const mocks = vi.hoisted(() => ({
  teachingFlow: vi.fn(),
  updateProgress: vi.fn(),
  createRecheck: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    mathPathRecoveryPackTeachingFlow: (...args) => mocks.teachingFlow(...args),
    updateMathPathRecoveryPackTeachingProgress: (...args) => mocks.updateProgress(...args),
    createAssignmentRecheck: (...args) => mocks.createRecheck(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ assignmentId: 'assignment_1' }),
    useNavigate: () => mocks.navigate,
  };
});

const recoveryPack = {
  assignment: {
    id: 'assignment_1',
    title: 'Fractions Recovery Pack',
    status: 'in_progress',
    currentStage: 'worked_example',
    completedStages: ['what_learning'],
    skillLabels: ['Adding fractions with different denominators'],
  },
  stages: [
    { stageId: 'what_learning', completed: true },
    { stageId: 'worked_example', completed: false },
    { stageId: 'visual_explanation', completed: false },
    { stageId: 'guided_practice', completed: false },
    { stageId: 'independent_practice', completed: false },
    { stageId: 'mastery_check', completed: false },
    { stageId: 'recheck_ready', completed: false, locked: true },
  ],
  whatLearning: {
    explanation: 'This Recovery Pack teaches the method before practice.',
    skillLabels: ['Adding fractions with different denominators'],
  },
  workedExample: {
    title: 'Adding denominators directly',
    content: {
      incorrectMethod: '1/2 + 1/3 = 2/5',
      whyIncorrect: 'Halves and thirds are not the same-sized parts.',
      correctMethod: 'Rename both fractions as sixths before adding.',
      keyTakeaway: 'Make the parts the same size first.',
    },
  },
  visualExplanation: {
    visualModelType: 'fraction_strip',
    visualModel: { label: 'Fraction Strip' },
    renderable: true,
    explanation: 'Line up the strips.',
  },
  guidedPractice: {
    questions: [{
      questionId: 'guided_missing_1',
      source: 'fallback',
      prompt: 'Try this step with help.',
      scaffold: 'Hint: make equal parts first.',
      expectedAnswer: '',
    }],
  },
  independentPractice: {
    questions: [{
      questionId: 'independent_missing_1',
      source: 'fallback',
      prompt: 'Now try one on your own.',
      expectedAnswer: '',
    }],
  },
  masteryCheck: {
    questions: [{
      questionId: 'recheck_missing_1',
      source: 'fallback',
      prompt: 'Use the method from this Recovery Pack.',
      expectedAnswer: '',
    }],
    progress: {},
    passed: false,
  },
  recheckReady: false,
  warnings: [{ type: 'missing_question_record', referenceId: 'guided_missing_1' }],
};

describe('RecoveryPackTeachingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.teachingFlow.mockResolvedValue({ data: { recoveryPack } });
    mocks.updateProgress.mockResolvedValue({
      data: {
        recoveryPack: {
          ...recoveryPack,
          assignment: {
            ...recoveryPack.assignment,
            completedStages: ['what_learning', 'worked_example'],
          },
        },
      },
    });
  });

  it('renders the teaching sequence and saves stage progress without raw internal IDs', async () => {
    render(<RecoveryPackTeachingFlow />);

    expect(await screen.findByText('Fractions Recovery Pack')).toBeInTheDocument();
    expect(screen.getByText('What you are learning')).toBeInTheDocument();
    expect(screen.getByText('Worked Example')).toBeInTheDocument();
    expect(screen.getByText(/1\/2 \+ 1\/3 = 2\/5/i)).toBeInTheDocument();
    expect(screen.getByText(/Rename both fractions as sixths/i)).toBeInTheDocument();
    expect(screen.getByText('Visual Explanation')).toBeInTheDocument();
    expect(screen.getByText('Fraction Strip')).toBeInTheDocument();
    expect(screen.getByText('Try this with help')).toBeInTheDocument();
    expect(screen.getByText('Now try on your own')).toBeInTheDocument();
    expect(screen.getByText('Mastery Check')).toBeInTheDocument();
    expect(screen.getByText(/safe fallbacks/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Recheck/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /I understand this example/i }));

    await waitFor(() => {
      expect(mocks.updateProgress).toHaveBeenCalledWith('assignment_1', {
        stageId: 'worked_example',
        questionId: '',
        correct: true,
      });
    });
    expect(document.body.textContent).not.toMatch(/\bF\d{3}\b|adds_denominators_directly/i);
  });

  it('records guided question completion from the teaching flow', async () => {
    render(<RecoveryPackTeachingFlow />);

    await screen.findByText('Try this step with help.');
    fireEvent.change(screen.getAllByPlaceholderText(/Type your answer/i)[0], {
      target: { value: 'make equal parts first' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Check/i })[0]);

    await waitFor(() => {
      expect(mocks.updateProgress).toHaveBeenCalledWith('assignment_1', {
        stageId: 'guided_practice',
        questionId: 'guided_missing_1',
        correct: true,
      });
    });
  });
});
