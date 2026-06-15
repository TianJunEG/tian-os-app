import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepFeedbackCard from './StepFeedbackCard';

vi.mock('../utils/misconceptions', () => ({
  getMisconception: (tag) => tag === 'psl/arithmetic-error'
    ? { label: 'Arithmetic error', category: 'Solving', tip: 'Double-check the calculation.' }
    : null,
}));

describe('StepFeedbackCard', () => {
  it('renders feedback text', () => {
    render(<StepFeedbackCard correct feedback="Great job!" />);
    expect(screen.getByText('Great job!')).toBeInTheDocument();
  });

  it('shows green styling when correct', () => {
    const { container } = render(<StepFeedbackCard correct feedback="Correct!" />);
    expect(container.innerHTML).toContain('Correct!');
  });

  it('does not show misconception box when correct', () => {
    render(<StepFeedbackCard correct feedback="Nice" misconceptionTag="psl/arithmetic-error" />);
    expect(screen.queryByText('Arithmetic error')).not.toBeInTheDocument();
  });

  it('shows misconception box when incorrect and tag is valid', () => {
    render(<StepFeedbackCard correct={false} feedback="Wrong" misconceptionTag="psl/arithmetic-error" />);
    expect(screen.getByText((_, el) => el?.textContent === '· Arithmetic error')).toBeInTheDocument();
    expect(screen.getByText('Double-check the calculation.')).toBeInTheDocument();
  });

  it('does not show misconception box when tag is unknown', () => {
    render(<StepFeedbackCard correct={false} feedback="Wrong" misconceptionTag="psl/unknown" />);
    expect(screen.queryByText('Arithmetic error')).not.toBeInTheDocument();
  });

  it('shows worked example when incorrect', () => {
    const worked = { title: 'Example', steps: ['Step 1', 'Step 2'] };
    render(<StepFeedbackCard correct={false} feedback="Try again" workedExample={worked} />);
    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('hides worked example when correct', () => {
    const worked = { title: 'Example', steps: ['Step 1'] };
    render(<StepFeedbackCard correct feedback="Nice" workedExample={worked} />);
    expect(screen.queryByText('Example')).not.toBeInTheDocument();
  });

  it('shows remediation text when incorrect', () => {
    render(<StepFeedbackCard correct={false} feedback="Wrong" remediation="Try reading the problem again." />);
    expect(screen.getByText('Try reading the problem again.')).toBeInTheDocument();
  });

  it('hides remediation when correct', () => {
    render(<StepFeedbackCard correct feedback="Nice" remediation="Try reading again." />);
    expect(screen.queryByText('Try reading again.')).not.toBeInTheDocument();
  });

  it('renders Continue button when onContinue is provided', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<StepFeedbackCard correct feedback="Done" onContinue={onContinue} />);
    await user.click(screen.getByText('Continue'));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('does not render Continue button without onContinue', () => {
    render(<StepFeedbackCard correct feedback="Done" />);
    expect(screen.queryByText('Continue')).not.toBeInTheDocument();
  });

  it('shows partial styling for partial answers', () => {
    render(<StepFeedbackCard partial feedback="Almost there" />);
    expect(screen.getByText('Almost there')).toBeInTheDocument();
  });
});
