import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MistakeCard from './MistakeCard';

// MistakeCard pulls in the API client and a lazy stroke player; neither is
// relevant to the explanation rendering under test.
vi.mock('../../services/api', () => ({
  mathpathAPI: { explanationFeedback: vi.fn() },
}));

const baseMistake = {
  id: 'm1',
  skillName: 'Adding Fractions',
  questionStem: '1/2 + 1/3',
  studentAnswer: '2/5',
  correctAnswer: '5/6',
  confidence: 'high',
};

describe('MistakeCard parent explanation', () => {
  it('renders a plain-English explanation and at-home tip for a known tag', () => {
    render(<MistakeCard mistake={{ ...baseMistake, misconceptionTag: 'frac/add-without-common' }} />);

    expect(screen.getByText(/What likely tripped them up/i)).toBeInTheDocument();
    expect(screen.getByText(/Try at home/i)).toBeInTheDocument();
    expect(screen.getByText(/tops and bottoms|same bottom number/i)).toBeInTheDocument();
  });

  it('never renders the raw machine tag as a slug', () => {
    const { container } = render(
      <MistakeCard mistake={{ ...baseMistake, misconceptionTag: 'frac/add-without-common' }} />
    );
    expect(container.textContent).not.toMatch(/frac\/add-without-common/);
  });

  it('falls back to readable copy for an unmapped tag', () => {
    const { container } = render(
      <MistakeCard mistake={{ ...baseMistake, misconceptionTag: 'geo/brand-new-slip' }} />
    );
    expect(screen.getByText(/What likely tripped them up/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/geo\/brand-new-slip/);
    expect(container.textContent.toLowerCase()).toContain('brand new slip');
  });

  it('still shows guidance when there is no tag at all', () => {
    render(<MistakeCard mistake={baseMistake} />);
    expect(screen.getByText(/Try at home/i)).toBeInTheDocument();
  });
});
