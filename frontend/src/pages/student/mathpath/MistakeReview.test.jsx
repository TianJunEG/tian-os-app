import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MistakeReview from './MistakeReview';

const mistakesMock = vi.fn();

vi.mock('../../../services/api', () => ({
  mathpathAPI: {
    mistakes: (...args) => mistakesMock(...args),
    startSession: vi.fn(),
  },
}));

vi.mock('../../../mathpath/fractions/fractionMistakeToMasteryEngine', () => ({
  getModelDrawingTrainerForMistake: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MistakeReview />
    </MemoryRouter>
  );
}

describe('MistakeReview pilot data guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the empty state instead of placeholder review content with no mistakes', async () => {
    mistakesMock.mockResolvedValue({ data: { mistakes: [] } });

    renderPage();

    expect(await screen.findByText('No mistakes to review yet. Complete more practice and Tian OS will show questions to review here.')).toBeInTheDocument();
    expect(screen.queryByText('Try Together')).not.toBeInTheDocument();
    expect(screen.queryByText('Correct Answer')).not.toBeInTheDocument();
  });

  it('shows only real mistake records from the API', async () => {
    mistakesMock.mockResolvedValue({
      data: {
        mistakes: [{
          id: 'm1',
          skillId: 'skill-1',
          skillName: 'Equivalent Fractions',
          questionStem: 'Find x',
          studentAnswer: '5',
          correctAnswer: '7',
          mistakeType: 'method_error',
          status: 'open',
          workedSolution: 'Find a common denominator first.',
        }],
      },
    });

    renderPage();

    expect(await screen.findByText('Equivalent Fractions')).toBeInTheDocument();
    expect(screen.getByText('Find x')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.queryByText('No mistakes to review yet. Complete more practice and Tian OS will show questions to review here.')).not.toBeInTheDocument();
  });
});
