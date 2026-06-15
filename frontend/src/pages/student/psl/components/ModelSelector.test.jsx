import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelSelector from './ModelSelector';

describe('ModelSelector', () => {
  it('renders model type buttons', () => {
    render(<ModelSelector onSelectModel={vi.fn()} onSelectPosition={vi.fn()} />);
    expect(screen.getByText(/part-whole/i)).toBeInTheDocument();
    expect(screen.getByText(/comparison/i)).toBeInTheDocument();
  });

  it('calls onSelectModel when a model type is clicked', async () => {
    const user = userEvent.setup();
    const onSelectModel = vi.fn();
    render(<ModelSelector onSelectModel={onSelectModel} onSelectPosition={vi.fn()} />);
    await user.click(screen.getByText(/part-whole/i));
    expect(onSelectModel).toHaveBeenCalled();
  });

  it('does not show position section until a model is selected', () => {
    render(<ModelSelector onSelectModel={vi.fn()} onSelectPosition={vi.fn()} />);
    expect(screen.queryByText(/what are we looking for/i)).not.toBeInTheDocument();
  });

  it('shows part-whole positions when partWhole is selected', () => {
    render(
      <ModelSelector
        modelType="partWhole"
        onSelectModel={vi.fn()}
        onSelectPosition={vi.fn()}
      />
    );
    expect(screen.getByText(/what are we looking for/i)).toBeInTheDocument();
    expect(screen.getByText(/find the whole/i)).toBeInTheDocument();
    expect(screen.getByText(/find a missing part/i)).toBeInTheDocument();
  });

  it('shows comparison positions when comparison is selected', () => {
    render(
      <ModelSelector
        modelType="comparison"
        onSelectModel={vi.fn()}
        onSelectPosition={vi.fn()}
      />
    );
    expect(screen.getByText(/difference/i)).toBeInTheDocument();
  });

  it('calls onSelectPosition when a position is clicked', async () => {
    const user = userEvent.setup();
    const onSelectPosition = vi.fn();
    render(
      <ModelSelector
        modelType="partWhole"
        onSelectModel={vi.fn()}
        onSelectPosition={onSelectPosition}
      />
    );
    await user.click(screen.getByText(/find the whole/i));
    expect(onSelectPosition).toHaveBeenCalled();
  });
});
