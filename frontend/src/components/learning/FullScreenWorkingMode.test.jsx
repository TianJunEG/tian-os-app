import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FullScreenWorkingMode from './FullScreenWorkingMode';
import WorkingAttachmentPreview from './WorkingAttachmentPreview';

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
  }));
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,fullscreen');
  HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    width: 1400,
    height: 900,
  }));
});

describe('FullScreenWorkingMode', () => {
  it('opens with a large canvas and saves working evidence', () => {
    const onSave = vi.fn();
    render(
      <FullScreenWorkingMode
        open
        questionText="Ali had 18 stickers left."
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Question reference')).toBeInTheDocument();
    expect(screen.getByText('Ali had 18 stickers left.')).toBeInTheDocument();
    expect(screen.getByTestId('working-toolbar')).toBeInTheDocument();

    const canvas = screen.getByLabelText('Full-screen working canvas');
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 80 });
    fireEvent.pointerUp(canvas);
    fireEvent.click(screen.getByText('Save Working'));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      workingImage: expect.stringContaining('data:image/png'),
      workingSubmitted: true,
      workingStrokes: expect.any(Array),
      source: 'fullscreen_working',
      canvasDimensions: { width: 1400, height: 900 },
    }));
  });

  it('renders a saved working attachment with edit and delete actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <WorkingAttachmentPreview
        evidence={{
          workingImage: 'data:image/png;base64,fullscreen',
          workingSubmittedAt: '2026-06-01T10:00:00.000Z',
        }}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Saved working')).toBeInTheDocument();
    expect(screen.getByAltText('Saved working preview')).toHaveAttribute('src', 'data:image/png;base64,fullscreen');
    fireEvent.click(screen.getByText('Edit working'));
    fireEvent.click(screen.getByText('Delete'));
    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });
});
