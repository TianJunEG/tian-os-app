import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckPanel from './CheckPanel';

describe('CheckPanel', () => {
  it('renders the answer', () => {
    render(<CheckPanel answer="42" onSelect={vi.fn()} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders both "Yes" and "No" buttons', () => {
    render(<CheckPanel answer="42" onSelect={vi.fn()} />);
    expect(screen.getByText(/yes/i)).toBeInTheDocument();
    expect(screen.getByText(/no/i)).toBeInTheDocument();
  });

  it('calls onSelect(true) when "Yes" is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CheckPanel answer="42" onSelect={onSelect} />);
    await user.click(screen.getByText(/yes/i));
    expect(onSelect).toHaveBeenCalledWith(true);
  });

  it('calls onGoBack when "No" is clicked and onGoBack provided', async () => {
    const user = userEvent.setup();
    const onGoBack = vi.fn();
    const onSelect = vi.fn();
    render(<CheckPanel answer="42" onSelect={onSelect} onGoBack={onGoBack} />);
    await user.click(screen.getByText(/no/i));
    expect(onGoBack).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect(false) when "No" clicked without onGoBack', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CheckPanel answer="42" onSelect={onSelect} />);
    await user.click(screen.getByText(/no/i));
    expect(onSelect).toHaveBeenCalledWith(false);
  });
});
