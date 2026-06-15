import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReasoningInput from './ReasoningInput';

describe('ReasoningInput', () => {
  it('renders collapsed by default', () => {
    render(<ReasoningInput onChange={vi.fn()} />);
    expect(screen.getByText(/write my reasoning/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('expands when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<ReasoningInput onChange={vi.fn()} />);
    await user.click(screen.getByText(/write my reasoning/i));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders expanded when defaultExpanded is true', () => {
    render(<ReasoningInput defaultExpanded onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders expanded when value is provided', () => {
    render(<ReasoningInput value="I think because..." onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('I think because...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ReasoningInput defaultExpanded onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('uses custom placeholder', () => {
    render(<ReasoningInput defaultExpanded placeholder="Type here..." onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });
});
