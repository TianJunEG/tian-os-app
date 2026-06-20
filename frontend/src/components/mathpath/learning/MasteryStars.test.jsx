import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MasteryStars, { starsFor } from './MasteryStars';

describe('starsFor', () => {
  it('maps percentage to a 0–3 star count on the 70/90 bands', () => {
    expect(starsFor(0)).toBe(0);
    expect(starsFor(1)).toBe(1);
    expect(starsFor(69)).toBe(1);
    expect(starsFor(70)).toBe(2);
    expect(starsFor(89)).toBe(2);
    expect(starsFor(90)).toBe(3);
    expect(starsFor(100)).toBe(3);
  });
});

describe('MasteryStars', () => {
  it('renders nothing when the skill has not been attempted (0%)', () => {
    const { container } = render(<MasteryStars percentage={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows a medal only once mastered (>= 90%)', () => {
    const { queryByLabelText, rerender } = render(<MasteryStars percentage={75} />);
    expect(queryByLabelText(/Mastered/)).toBeNull();
    rerender(<MasteryStars percentage={95} />);
    expect(queryByLabelText(/Mastered/)).not.toBeNull();
  });
});
