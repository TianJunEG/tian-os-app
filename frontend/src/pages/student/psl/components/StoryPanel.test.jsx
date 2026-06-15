import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoryPanel from './StoryPanel';

describe('StoryPanel', () => {
  it('renders story text in normal mode', () => {
    render(<StoryPanel storyText="Sam has 12 apples and gives 5 to Tom." />);
    expect(screen.getByText('Sam has 12 apples and gives 5 to Tom.')).toBeInTheDocument();
  });

  it('renders empty when storyText is missing', () => {
    const { container } = render(<StoryPanel />);
    expect(container.textContent).toBe('');
  });

  it('renders numbers as tappable buttons in highlight mode', () => {
    render(
      <StoryPanel storyText="Sam has 12 apples and gives 5 to Tom." highlightMode />
    );
    expect(screen.getByRole('button', { name: /12/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5/ })).toBeInTheDocument();
  });

  it('calls onToggleNumber when a number button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <StoryPanel
        storyText="Sam has 12 apples."
        highlightMode
        onToggleNumber={onToggle}
      />
    );
    await user.click(screen.getByRole('button', { name: /12/ }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('marks selected numbers with active styling', () => {
    render(
      <StoryPanel
        storyText="Sam has 12 apples."
        highlightMode
        highlightedNumbers={[12]}
      />
    );
    const btn = screen.getByRole('button', { name: /12/ });
    expect(btn).toBeInTheDocument();
  });
});
