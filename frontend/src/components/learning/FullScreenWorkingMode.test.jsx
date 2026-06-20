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
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text) => ({ width: String(text || '').length * 10 })),
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
  it('opens with the question inside a worksheet workspace and saves working evidence', () => {
    const onSave = vi.fn();
    render(
      <FullScreenWorkingMode
        open
        questionText="Ali had 18 stickers left."
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    expect(screen.getByTestId('worksheet-working-space')).toBeInTheDocument();
    expect(screen.getByTestId('worksheet-question-panel')).toBeInTheDocument();
    // Component renders question text in both the compact header and the full body panel.
    expect(screen.getAllByText('Ali had 18 stickers left.').length).toBeGreaterThan(0);
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
      questionSnapshot: expect.objectContaining({
        text: 'Ali had 18 stickers left.',
        renderMode: 'worksheet_dom_overlay_export_composite',
      }),
    }));
  });

  it('clears strokes without removing the worksheet question', () => {
    render(
      <FullScreenWorkingMode
        open
        questionText="Shade 3/5 of the bar."
        initialStrokes={[{ tool: 'pen', colour: '#111827', size: 4, points: [{ x: 10, y: 10 }, { x: 80, y: 80 }] }]}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getAllByText('Shade 3/5 of the bar.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Clear' })).not.toBeDisabled();
    // Clear is now destructive and prompts for confirmation; approve it.
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    confirmSpy.mockRestore();
    expect(screen.getAllByText('Shade 3/5 of the bar.').length).toBeGreaterThan(0);
    expect(screen.getByText('Save Working')).toBeDisabled();
  });

  it('hides math insert tools by default for pilot stability', () => {
    render(
      <FullScreenWorkingMode
        open
        questionText="Work with 1/2."
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Math insert tools')).not.toBeInTheDocument();
  });

  it('keeps drawing while re-rendering with equivalent empty initial arrays', () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <FullScreenWorkingMode
        open
        questionText="Keep this drawing."
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const canvas = screen.getByLabelText('Full-screen working canvas');
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 120 });
    fireEvent.pointerUp(canvas);

    rerender(
      <FullScreenWorkingMode
        open
        questionText="Keep this drawing."
        initialStrokes={[]}
        initialMathObjects={[]}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByText('Save Working'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      workingStrokes: expect.arrayContaining([
        expect.objectContaining({
          tool: 'pen',
          points: expect.arrayContaining([expect.any(Object), expect.any(Object)]),
        }),
      ]),
    }));
  });

  it('restores saved math objects so they can be reselected and deleted', () => {
    const onSave = vi.fn();
    render(
      <FullScreenWorkingMode
        open
        questionText="Use pi."
        initialMathObjects={[{
          id: 'saved-pi',
          type: 'pi',
          x: 500,
          y: 260,
          value: {},
          colour: '#f97316',
        }]}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const piObject = screen.getByTestId('math-object-pi');
    fireEvent.click(piObject);
    expect(piObject).toHaveClass('outline');
    fireEvent.click(screen.getByLabelText('Delete selected math object'));
    fireEvent.click(screen.getByText('Save Working'));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      workingMathObjects: [],
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
