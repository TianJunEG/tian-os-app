import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StepProgressBar from './StepProgressBar';

describe('StepProgressBar', () => {
  it('renders 6 progress bars', () => {
    const { container } = render(<StepProgressBar />);
    const bars = container.querySelectorAll('span');
    expect(bars).toHaveLength(6);
  });

  it('highlights bars up to the current step', () => {
    const { container } = render(<StepProgressBar currentStepIdx={3} />);
    const bars = container.querySelectorAll('span');
    const activeColor = 'rgb(217, 137, 46)';
    const inactiveColor = 'rgb(228, 231, 236)';
    expect(bars[0].style.background).toBe(activeColor);
    expect(bars[1].style.background).toBe(activeColor);
    expect(bars[2].style.background).toBe(activeColor);
    expect(bars[3].style.background).toBe(activeColor);
    expect(bars[4].style.background).toBe(inactiveColor);
    expect(bars[5].style.background).toBe(inactiveColor);
  });

  it('uses green for the final step when completed', () => {
    const { container } = render(
      <StepProgressBar currentStepIdx={6} completedSteps={{ check: true }} />
    );
    const bars = container.querySelectorAll('span');
    expect(bars[5].style.background).toBe('rgb(31, 157, 87)');
  });

  it('all bars inactive at step 0 except the current', () => {
    const { container } = render(<StepProgressBar currentStepIdx={0} />);
    const bars = container.querySelectorAll('span');
    expect(bars[0].style.background).toBe('rgb(217, 137, 46)');
    expect(bars[1].style.background).toBe('rgb(228, 231, 236)');
  });

  it('marks completed steps even if behind currentStepIdx', () => {
    const { container } = render(
      <StepProgressBar currentStepIdx={1} completedSteps={{ solve: true }} />
    );
    const bars = container.querySelectorAll('span');
    expect(bars[4].style.background).toBe('rgb(217, 137, 46)');
  });
});
