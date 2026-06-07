import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MistakeDetail from './MistakeDetail.jsx';

const mocks = vi.hoisted(() => ({
  mistake: vi.fn(),
  updateMistakeLearning: vi.fn(),
  startSession: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    mistake: (...args) => mocks.mistake(...args),
    updateMistakeLearning: (...args) => mocks.updateMistakeLearning(...args),
    startSession: (...args) => mocks.startSession(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ mistakeId: 'mistake_1' }),
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('../../../mathpath/fractions/fractionMistakeToMasteryEngine', () => ({
  getModelDrawingTrainerForMistake: () => null,
}));

function mistake(overrides = {}) {
  return {
    id: 'mistake_1',
    skillId: 'skill_1',
    skillName: 'Adding fractions with different denominators',
    questionStem: '1/2 + 1/3 = ?',
    studentAnswer: '2/5',
    correctAnswer: '5/6',
    mistakeType: 'method_error',
    status: 'open',
    learningStatus: 'acknowledged',
    workedSolution: 'Find a common denominator first.',
    correctionFlow: {
      reflectionPrompt: 'What was the mistake?',
      correctionPrompt: 'Write the corrected answer.',
      understandingPrompt: 'Which step should you change next time?',
    },
    ...overrides,
  };
}

describe('MistakeDetail learning enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mistake.mockResolvedValue({ data: mistake() });
    mocks.updateMistakeLearning.mockResolvedValue({
      data: { learningStatus: 'corrected', message: 'You fixed the mistake.' },
    });
  });

  it('requires a reflection and correction before progressing mistake learning', async () => {
    render(<MistakeDetail />);

    expect(await screen.findByText('Mistake Learning')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mark as reviewed/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/wrong denominator/i), {
      target: { value: 'I added the denominators directly.' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Corrected answer/i), {
      target: { value: '5/6' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save correction/i }));

    await waitFor(() => {
      expect(mocks.mistake).toHaveBeenCalledWith('mistake_1');
      expect(mocks.updateMistakeLearning).toHaveBeenCalledWith('mistake_1', {
        source: 'student',
        action: 'correct',
        reflection: 'I added the denominators directly.',
        correctionAttempt: '5/6',
      });
    });
  });
});
