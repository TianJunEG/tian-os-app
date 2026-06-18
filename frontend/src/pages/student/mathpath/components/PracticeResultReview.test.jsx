import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PracticeResultReview from './PracticeResultReview.jsx';

describe('PracticeResultReview', () => {
  it('renders long review content in mobile-safe wrappers', () => {
    render(
      <PracticeResultReview
        rows={[
          {
            questionId: 'q-long',
            prompt: 'A'.repeat(120),
            studentAnswer: 'student-answer-with-a-very-long-token-1234567890',
            correctAnswer: 'correct-answer-with-a-very-long-token-1234567890',
            correct: false,
            solutionSteps: ['Use the model, then compare the two very-long-values-without-natural-breaks.'],
          },
        ]}
      />
    );

    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText(/Your answer:/).closest('p')).toHaveClass('break-words');
    expect(screen.getByText(/Correct answer:/).closest('p')).toHaveClass('break-words');
    expect(screen.getByText(/Use the model/)).toHaveClass('break-words');
  });
});
