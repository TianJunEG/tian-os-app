import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ColumnOperationsGrid, { makeEmptyGrid, FORMATS } from './ColumnOperationsGrid';

// Index of the "Decimals / money (2 dp)" addition format.
const decimalIndex = FORMATS.addition.findIndex((f) => f.decimals === 2);

// Count the rendered decimal-point separators: leaf divs whose text is exactly
// "." (a parent row also has textContent "." when its cells are empty, so we
// require no child elements to count only the actual point glyphs).
const dotCount = (container) =>
  [...container.querySelectorAll('div')].filter((d) => d.children.length === 0 && d.textContent === '.').length;

describe('ColumnOperationsGrid — decimal / money support', () => {
  it('makeEmptyGrid threads decimals through and keeps whole-number formats decimal-free', () => {
    const g = makeEmptyGrid('addition', decimalIndex);
    expect(g.decimals).toBe(2);
    expect(g.cols).toBe(5);          // 4 digits + 1 carry column
    expect(g.rows).toHaveLength(3);  // 2 operands + answer row
    expect(makeEmptyGrid('addition', 0).decimals).toBe(0);
    expect(makeEmptyGrid('subtraction', FORMATS.subtraction.findIndex((f) => f.decimals === 2)).decimals).toBe(2);
  });

  it('renders an aligned decimal point only for decimal grids', () => {
    const { container, rerender } = render(
      <ColumnOperationsGrid grid={makeEmptyGrid('addition', 0)} onChange={() => {}} />,
    );
    expect(dotCount(container)).toBe(0);
    // Decimal addition: a point on each operand row + the answer row (carry row's
    // point is blank), so 3 visible points.
    rerender(<ColumnOperationsGrid grid={makeEmptyGrid('addition', decimalIndex)} onChange={() => {}} />);
    expect(dotCount(container)).toBe(3);
  });

  it('choosing the decimals format from the dropdown produces a decimals grid', () => {
    const onChange = vi.fn();
    render(<ColumnOperationsGrid grid={makeEmptyGrid('addition', 0)} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: String(decimalIndex) } });
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)[0].decimals).toBe(2);
  });

  it('keeps cells single-digit numeric so the point can never be misplaced', () => {
    const { container } = render(
      <ColumnOperationsGrid grid={makeEmptyGrid('addition', decimalIndex)} onChange={() => {}} />,
    );
    for (const input of container.querySelectorAll('input')) {
      expect(input.getAttribute('maxlength')).toBe('1');
      expect(input.getAttribute('inputmode')).toBe('numeric');
    }
  });
});
