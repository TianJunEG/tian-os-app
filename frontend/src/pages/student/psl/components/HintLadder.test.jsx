import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HintLadder from './HintLadder';

const nudge = { title: 'Think about it', text: 'What operation fits here?' };
const clue = { title: 'Here is a clue', text: 'Try addition', clueCards: ['5', '3'] };
const reveal = { title: 'The answer', text: 'Add 5 + 3', steps: ['Read the problem', 'Add the numbers', '5 + 3 = 8'] };

describe('HintLadder', () => {
  it('returns null when hints is empty', () => {
    const { container } = render(<HintLadder hints={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the first hint (nudge) by default', () => {
    render(<HintLadder hints={[nudge, clue, reveal]} />);
    expect(screen.getByText('HINT · A NUDGE')).toBeInTheDocument();
    expect(screen.getByText('Level 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Think about it')).toBeInTheDocument();
  });

  it('shows "Still stuck?" button on non-last rung', () => {
    render(<HintLadder hints={[nudge, clue, reveal]} />);
    expect(screen.getByText('Still stuck? Show me more')).toBeInTheDocument();
    expect(screen.queryByText('Okay — let me try')).not.toBeInTheDocument();
  });

  it('advances to the next rung on "Still stuck?" click', async () => {
    const user = userEvent.setup();
    render(<HintLadder hints={[nudge, clue, reveal]} />);
    await user.click(screen.getByText('Still stuck? Show me more'));
    expect(screen.getByText('HINT · A CLUE')).toBeInTheDocument();
    expect(screen.getByText('Level 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Here is a clue')).toBeInTheDocument();
  });

  it('renders clue cards on the clue rung', async () => {
    const user = userEvent.setup();
    render(<HintLadder hints={[nudge, clue, reveal]} />);
    await user.click(screen.getByText('Still stuck? Show me more'));
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('advances to reveal rung and shows steps', async () => {
    const user = userEvent.setup();
    render(<HintLadder hints={[nudge, clue, reveal]} />);
    await user.click(screen.getByText('Still stuck? Show me more'));
    await user.click(screen.getByText('Still stuck? Show me more'));
    expect(screen.getByText('HINT · THE REVEAL')).toBeInTheDocument();
    expect(screen.getByText('Level 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Read the problem')).toBeInTheDocument();
    expect(screen.getByText('5 + 3 = 8')).toBeInTheDocument();
  });

  it('shows "Okay — let me try" on last rung', async () => {
    const user = userEvent.setup();
    render(<HintLadder hints={[nudge, clue, reveal]} />);
    await user.click(screen.getByText('Still stuck? Show me more'));
    await user.click(screen.getByText('Still stuck? Show me more'));
    expect(screen.getByText('Okay — let me try')).toBeInTheDocument();
    expect(screen.queryByText('Still stuck? Show me more')).not.toBeInTheDocument();
  });

  it('calls onTryAgain when clicking "Okay — let me try"', async () => {
    const user = userEvent.setup();
    const onTryAgain = vi.fn();
    render(<HintLadder hints={[nudge, clue, reveal]} onTryAgain={onTryAgain} />);
    await user.click(screen.getByText('Still stuck? Show me more'));
    await user.click(screen.getByText('Still stuck? Show me more'));
    await user.click(screen.getByText('Okay — let me try'));
    expect(onTryAgain).toHaveBeenCalledOnce();
  });

  it('falls back to onClose when onTryAgain not provided', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HintLadder hints={[nudge, clue, reveal]} onClose={onClose} />);
    await user.click(screen.getByText('Still stuck? Show me more'));
    await user.click(screen.getByText('Still stuck? Show me more'));
    await user.click(screen.getByText('Okay — let me try'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking the backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<HintLadder hints={[nudge, clue, reveal]} onClose={onClose} />);
    await user.click(container.firstChild);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows "Okay — let me try" immediately with a single hint', () => {
    render(<HintLadder hints={[nudge]} />);
    expect(screen.getByText('Okay — let me try')).toBeInTheDocument();
  });

  it('uses default title when hint has no title', () => {
    render(<HintLadder hints={[{ text: 'some hint' }]} />);
    expect(screen.getByText("A question first…")).toBeInTheDocument();
  });
});
