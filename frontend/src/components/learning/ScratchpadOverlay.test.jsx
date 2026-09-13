import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ScratchpadOverlay from './ScratchpadOverlay';

// ScratchpadOverlay draws on a <canvas>; jsdom needs the 2D context stubbed.
beforeEach(() => {
  const ctx = new Proxy({}, { get: () => () => {} });
  HTMLCanvasElement.prototype.getContext = () => ctx;
  HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
  HTMLCanvasElement.prototype.setPointerCapture = () => {};
  HTMLCanvasElement.prototype.releasePointerCapture = () => {};
});

describe('ScratchpadOverlay — Four Ops column working', () => {
  it('toggles the column-working grid on and off without leaving the question', () => {
    render(<ScratchpadOverlay open onChange={() => {}} />);

    // Hidden until the student opts in.
    expect(screen.queryByText('Column working')).toBeNull();

    fireEvent.click(screen.getByLabelText('Four Ops column working'));
    expect(screen.getByText('Column working')).toBeTruthy();
    // The embedded ColumnOperationsGrid is present: the ÷ operation button and a
    // format selector that includes the decimal/money format.
    expect(screen.getByTitle('÷')).toBeTruthy();
    const options = [...screen.getByRole('combobox').querySelectorAll('option')].map((o) => o.textContent);
    expect(options).toContain('Decimals / money (2 dp)');

    // Toggle off again.
    fireEvent.click(screen.getByLabelText('Four Ops column working'));
    expect(screen.queryByText('Column working')).toBeNull();
  });

  it('does not render anything when closed', () => {
    const { container } = render(<ScratchpadOverlay open={false} onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
