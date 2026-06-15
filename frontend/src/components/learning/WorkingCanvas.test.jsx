import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkingCanvas, { resolveWorkingRequirement } from './WorkingCanvas';

let canvasContext;

beforeEach(() => {
  canvasContext = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  };
  HTMLCanvasElement.prototype.getContext = vi.fn(() => canvasContext);
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,working');
  HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    width: 900,
    height: 320,
  }));
});

describe('WorkingCanvas', () => {
  it('renders pen, eraser, undo, clear, and submit controls', () => {
    render(<WorkingCanvas questionId="q1" required />);

    expect(screen.getByRole('button', { name: 'Pen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eraser' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByText('Save working')).toBeInTheDocument();
  });

  it('submits stroke data and an image', () => {
    const onSubmit = vi.fn();
    render(<WorkingCanvas questionId="q1" required onSubmit={onSubmit} />);

    const canvas = screen.getByLabelText('Working canvas');
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 80 });
    fireEvent.pointerUp(canvas);
    fireEvent.click(screen.getByText('Save working'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      workingImage: expect.stringContaining('data:image/png'),
      workingSubmitted: true,
      workingStrokes: expect.any(Array),
    }));
  });

  it('allows working not needed when configured', () => {
    const onSubmit = vi.fn();
    render(<WorkingCanvas questionId="q1" allowNoWorking onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText('Working not needed'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      workingNotNeeded: true,
      workingSubmitted: false,
    }));
  });

  it('resolves default working rules by session type', () => {
    expect(resolveWorkingRequirement({ mentalMathEligible: false }, 'practice').required).toBe(true);
    expect(resolveWorkingRequirement({ mentalMathEligible: true }, 'practice').required).toBe(false);
    expect(resolveWorkingRequirement({}, 'diagnostic').required).toBe(false);
    expect(resolveWorkingRequirement({ requiresWorking: true }, 'diagnostic').required).toBe(true);
    expect(resolveWorkingRequirement({ requiresWorking: true, mentalMathEligible: true }, 'diagnostic').required).toBe(false);
  });

  it('renders read-only submitted working', () => {
    render(<WorkingCanvas readOnly submittedImage="data:image/png;base64,abc" />);

    expect(screen.getByText('Student workings')).toBeInTheDocument();
    expect(screen.getByAltText('Student submitted workings')).toHaveAttribute('src', 'data:image/png;base64,abc');
  });

  it('clears canvas pixels and local submitted state when question changes without saved working', () => {
    const { rerender } = render(
      <WorkingCanvas
        questionId="q1"
        submittedStrokes={[{ tool: 'pen', colour: '#111827', size: 4, points: [{ x: 1, y: 1 }, { x: 20, y: 20 }] }]}
        initialSubmitted
      />
    );

    expect(screen.getByText('Workings submitted')).toBeInTheDocument();
    canvasContext.clearRect.mockClear();

    rerender(<WorkingCanvas questionId="q2" submittedStrokes={[]} initialSubmitted={false} initialWorkingNotNeeded={false} />);

    expect(canvasContext.clearRect).toHaveBeenCalled();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(screen.getByText('Save working')).toBeDisabled();
  });

  it('loads the saved strokes for the current question when returning to it', () => {
    const savedStrokes = [{ tool: 'pen', colour: '#111827', size: 4, points: [{ x: 1, y: 1 }, { x: 20, y: 20 }] }];
    const { rerender } = render(<WorkingCanvas questionId="q1" submittedStrokes={savedStrokes} initialSubmitted={false} />);

    expect(screen.getByRole('button', { name: 'Undo' })).not.toBeDisabled();

    rerender(<WorkingCanvas questionId="q2" submittedStrokes={[]} initialSubmitted={false} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();

    rerender(<WorkingCanvas questionId="q1" submittedStrokes={savedStrokes} initialSubmitted={false} />);
    expect(screen.getByRole('button', { name: 'Undo' })).not.toBeDisabled();
  });
});
