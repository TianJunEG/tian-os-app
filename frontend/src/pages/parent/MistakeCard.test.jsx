import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MistakeCard from './MistakeCard.jsx';

vi.mock('../../services/api', () => ({
  mathpathAPI: { explanationFeedback: vi.fn().mockResolvedValue({}) },
}));

// The stroke replay player is lazy + canvas-heavy; not relevant to these assertions.
vi.mock('../../components/learning/StrokeReplayPlayer', () => ({
  default: () => <div data-testid="stroke-replay" />,
}));

function baseMistake(overrides = {}) {
  return {
    id: 'm1',
    skillName: 'Adding fractions',
    questionStem: '1/2 + 1/4 = ?',
    studentAnswer: '2/6',
    correctAnswer: '3/4',
    ...overrides,
  };
}

describe('MistakeCard parent explanation', () => {
  it('shows a plain-English explanation and an at-home tip for a known tag', () => {
    render(<MistakeCard mistake={baseMistake({ misconceptionTag: 'frac/add-denominators' })} />);

    expect(screen.getByText('What this means')).toBeInTheDocument();
    expect(screen.getByText(/common denominator|top and bottom/i)).toBeInTheDocument();
    expect(screen.getByText(/Try at home:/i)).toBeInTheDocument();
  });

  it('never renders the raw tag as a primary badge', () => {
    render(<MistakeCard mistake={baseMistake({ misconceptionTag: 'frac/add-denominators' })} />);

    // The slug may appear only as the subtle "Reference:" secondary line, not standalone.
    expect(screen.queryByText('frac/add-denominators')).not.toBeInTheDocument();
    expect(screen.getByText(/Reference: frac\/add-denominators/)).toBeInTheDocument();
  });

  it('still gives a friendly line for an unmapped tag via the domain fallback', () => {
    render(<MistakeCard mistake={baseMistake({ misconceptionTag: 'geo/brand-new-thing' })} />);

    expect(screen.getByText('What this means')).toBeInTheDocument();
    expect(screen.getByText(/slip with shapes and geometry/i)).toBeInTheDocument();
  });

  it('renders no explanation block when there is no misconception tag', () => {
    render(<MistakeCard mistake={baseMistake()} />);
    expect(screen.queryByText('What this means')).not.toBeInTheDocument();
  });
});
