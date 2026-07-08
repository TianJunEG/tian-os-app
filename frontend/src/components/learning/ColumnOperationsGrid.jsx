import React, { useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';

const OPERATIONS = [
  { id: 'addition', label: '+', icon: '+' },
  { id: 'subtraction', label: '−', icon: '−' },
  { id: 'multiplication', label: '×', icon: '×' },
  { id: 'division', label: '÷', icon: '÷' },
];

const FORMATS = {
  addition: [
    { label: '2 digits addition', digits: 2, rows: 2 },
    { label: '3 digits addition', digits: 3, rows: 2 },
    { label: '4 digits addition', digits: 4, rows: 2 },
    { label: 'Decimals / money (2 dp)', digits: 4, rows: 2, decimals: 2 },
  ],
  subtraction: [
    { label: '2 digits subtraction', digits: 2, rows: 2 },
    { label: '3 digits subtraction', digits: 3, rows: 2 },
    { label: '4 digits subtraction', digits: 4, rows: 2 },
    { label: 'Decimals / money (2 dp)', digits: 4, rows: 2, decimals: 2 },
  ],
  multiplication: [
    { label: '2 × 1 digit', digits: 2, rows: 2, multiplierDigits: 1 },
    { label: '3 × 1 digit', digits: 3, rows: 2, multiplierDigits: 1 },
    { label: '2 × 2 digits', digits: 2, rows: 2, multiplierDigits: 2 },
  ],
  division: [
    { label: '2 ÷ 1 digit', digits: 2, divisorDigits: 1 },
    { label: '3 ÷ 1 digit', digits: 3, divisorDigits: 1 },
    { label: '4 ÷ 1 digit', digits: 4, divisorDigits: 1 },
  ],
};

function makeEmptyGrid(operation, format) {
  const f = FORMATS[operation]?.[format] || FORMATS.addition[0];

  if (operation === 'division') {
    // Long division (Singapore P3–P6): under the bracket the student writes a
    // "subtract" line then a "bring-down" line per dividend digit, plus a final
    // remainder line — i.e. 2 * dividendDigits + 1 working rows, each as wide as
    // the dividend. The quotient has at most dividendDigits - divisorDigits + 1
    // digits (e.g. 4 ÷ 1 → up to 4 quotient digits; 4 ÷ 2 → up to 3).
    const dividendDigits = f.digits;
    const divisorDigits = f.divisorDigits || 1;
    const quotientDigits = Math.max(1, dividendDigits - divisorDigits + 1);
    const remainderRows = 2 * dividendDigits + 1;
    return {
      operation,
      format,
      cols: dividendDigits,
      divisorDigits,
      quotient: Array(quotientDigits).fill(''),
      dividend: Array(dividendDigits).fill(''),
      divisor: Array(divisorDigits).fill(''),
      remainderSteps: Array.from({ length: remainderRows }, () => Array(dividendDigits).fill('')),
    };
  }

  // Width must fit the widest line. For multiplication the product can be up to
  // (digits + multiplierDigits) digits wide; addition/subtraction need one extra
  // column for a carry/borrow past the most-significant digit.
  const multiplierDigits = operation === 'multiplication' ? (f.multiplierDigits || 1) : 1;
  const cols = operation === 'multiplication' ? f.digits + multiplierDigits : f.digits + 1;

  // Operand rows: addition/subtraction default to 2; multiplication has the
  // multiplicand + multiplier. The number of operands can be carried by FORMATS
  // (operands) and falls back to the working 2-operand default.
  const operandRows = f.operands || f.rows || 2;

  const rows = [];
  for (let r = 0; r < operandRows; r++) rows.push(Array(cols).fill(''));

  // Multi-digit multipliers produce (multiplierDigits - 1) extra partial-product
  // rows that are added together in the final sum row below. A single-digit
  // multiplier (and addition/subtraction) just has the one final answer row.
  const partialProductRows = operation === 'multiplication' ? multiplierDigits - 1 : 0;
  for (let r = 0; r < partialProductRows; r++) rows.push(Array(cols).fill(''));

  rows.push(Array(cols).fill('')); // final answer / sum row
  const carries = Array(cols).fill('');
  // decimals: how many of the rightmost columns are fractional. A fixed decimal
  // point is rendered before the first fractional column so it stays aligned down
  // every row — the cells themselves remain single-digit (the student can't
  // misplace the point). 0 = whole-number working (unchanged).
  return { operation, format, cols, rows, carries, decimals: f.decimals || 0 };
}

// Returns a stable ref-setter for a given cell key, cached on the refs object so
// the same function identity is handed to React across re-renders. An inline
// `(el) => { ... }` callback ref has a new identity every render, which makes
// React call it with null (detach) then the element (re-attach) on each render;
// that transient null could land while a focus jump was queued. Caching keeps
// cellRefs.current[key] populated and never transiently null on re-render.
function makeRefSetter(cellRefs, key) {
  if (!cellRefs.setters) cellRefs.setters = {};
  if (!cellRefs.setters[key]) {
    cellRefs.setters[key] = (el) => {
      if (el) cellRefs.current[key] = el;
      else delete cellRefs.current[key];
    };
  }
  return cellRefs.setters[key];
}

function CellInput({ value, onChange, onKeyDown, inputRef, small = false, highlight = false }) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value || ''}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, '').slice(-1);
        onChange(v);
      }}
      onKeyDown={onKeyDown}
      className={`${small ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-lg'} rounded-lg border-2 text-center font-mono font-semibold transition focus:border-orange-400 focus:outline-none ${
        highlight ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-line bg-white text-ink-900'
      }`}
    />
  );
}

// Fixed decimal point shown between the integer and fractional columns. `blank`
// keeps the same width (so columns stay aligned) without drawing the dot — used
// in the carry row, where a point would be meaningless.
function DecimalDot({ small = false, blank = false }) {
  return (
    <div className={`grid ${small ? 'h-8' : 'h-10'} w-3 place-items-center self-end pb-1 text-2xl font-bold leading-none text-ink-900`}>
      {blank ? '' : '.'}
    </div>
  );
}

// Insert the decimal point before the first fractional cell so it lines up down
// every row. Returns the cells unchanged when there are no decimals.
function injectDecimalPoint(cells, { decimals, cols, small = false, blank = false }) {
  if (!decimals) return cells;
  const pointIndex = cols - decimals;
  const out = [];
  cells.forEach((cell, ci) => {
    if (ci === pointIndex) out.push(<DecimalDot key={`dot-${ci}`} small={small} blank={blank} />);
    out.push(cell);
  });
  return out;
}

function StandardGrid({ grid, onChange, cellRefs, readOnly }) {
  const { operation, cols, rows, carries, decimals = 0 } = grid;
  const opSymbol = OPERATIONS.find((o) => o.id === operation)?.icon || '+';

  const setCellValue = (section, row, col, value) => {
    const next = { ...grid };
    if (section === 'carry') {
      next.carries = [...carries];
      next.carries[col] = value;
    } else if (section === 'row') {
      next.rows = rows.map((r, i) => (i === row ? r.map((c, j) => (j === col ? value : c)) : [...r]));
    }
    onChange(next);
  };

  const handleKeyDown = (e, section, row, col) => {
    const key = e.key;
    // Only move focus on an explicit ArrowRight. Do NOT steal focus on digit
    // entry: auto-advancing parked the student on the ones box (so the tens box
    // looked un-typable) and on iPad a programmatic .focus() outside a user
    // gesture is ignored and collapses the keypad. Each box stays tap-editable.
    if (key === 'ArrowRight') {
      const nextCol = col + 1;
      if (nextCol < cols) {
        requestAnimationFrame(() => cellRefs.current[`${section}-${row}-${nextCol}`]?.focus());
      }
    } else if (key === 'ArrowLeft' || key === 'Backspace') {
      if (key === 'Backspace' && !e.target.value) {
        const prevCol = col - 1;
        if (prevCol >= 0) {
          e.preventDefault();
          requestAnimationFrame(() => cellRefs.current[`${section}-${row}-${prevCol}`]?.focus());
        }
      }
    } else if (key === 'ArrowDown') {
      if (section === 'carry') {
        requestAnimationFrame(() => cellRefs.current[`row-0-${col}`]?.focus());
      } else if (row < rows.length - 1) {
        requestAnimationFrame(() => cellRefs.current[`row-${row + 1}-${col}`]?.focus());
      }
    } else if (key === 'ArrowUp') {
      if (section === 'row' && row === 0) {
        requestAnimationFrame(() => cellRefs.current[`carry-0-${col}`]?.focus());
      } else if (section === 'row' && row > 0) {
        requestAnimationFrame(() => cellRefs.current[`row-${row - 1}-${col}`]?.focus());
      }
    }
  };

  const answerRow = rows.length - 1;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <div className="w-10" />
        {injectDecimalPoint(carries.map((v, ci) => (
          <CellInput
            key={`c-${ci}`}
            value={v}
            onChange={(val) => setCellValue('carry', 0, ci, val)}
            onKeyDown={(e) => handleKeyDown(e, 'carry', 0, ci)}
            inputRef={makeRefSetter(cellRefs, `carry-0-${ci}`)}
            small
            highlight
          />
        )), { decimals, cols, small: true, blank: true })}
      </div>

      {rows.map((row, ri) => (
        <React.Fragment key={`r-${ri}`}>
          {ri === answerRow && (
            <div className="my-1 flex items-center gap-1">
              <div className="w-10" />
              <div className="h-0.5 flex-1 bg-ink-900" style={{ width: `${cols * 44 + (cols - 1) * 4 + (decimals ? 16 : 0)}px` }} />
            </div>
          )}
          <div className="flex gap-1">
            <div className="grid h-10 w-10 place-items-center text-lg font-bold text-ink-700">
              {ri === 1 && ri < answerRow ? opSymbol : ''}
            </div>
            {injectDecimalPoint(row.map((v, ci) => (
              <CellInput
                key={`${ri}-${ci}`}
                value={v}
                onChange={(val) => setCellValue('row', ri, ci, val)}
                onKeyDown={(e) => handleKeyDown(e, 'row', ri, ci)}
                inputRef={makeRefSetter(cellRefs, `row-${ri}-${ci}`)}
              />
            )), { decimals, cols })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function DivisionGrid({ grid, onChange, cellRefs }) {
  const { cols, divisorDigits, quotient, dividend, divisor, remainderSteps } = grid;

  const setCellValue = (section, row, col, value) => {
    const next = { ...grid };
    if (section === 'quotient') {
      next.quotient = quotient.map((c, i) => (i === col ? value : c));
    } else if (section === 'dividend') {
      next.dividend = dividend.map((c, i) => (i === col ? value : c));
    } else if (section === 'divisor') {
      next.divisor = divisor.map((c, i) => (i === col ? value : c));
    } else if (section === 'remainder') {
      next.remainderSteps = remainderSteps.map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? value : c)) : [...r],
      );
    }
    onChange(next);
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex gap-1">
        <div style={{ width: `${(divisorDigits + 1) * 44}px` }} />
        {quotient.map((v, ci) => (
          <CellInput
            key={`q-${ci}`}
            value={v}
            onChange={(val) => setCellValue('quotient', 0, ci, val)}
            inputRef={makeRefSetter(cellRefs, `quotient-0-${ci}`)}
          />
        ))}
      </div>

      {/* Vinculum — the division line sits ABOVE the dividend (under the
          quotient), forming the top of the ")" bracket. */}
      <div className="flex gap-1" style={{ marginLeft: `${(divisorDigits + 1) * 44}px` }}>
        <div className="h-0.5 flex-1 bg-ink-900" style={{ width: `${cols * 44}px` }} />
      </div>

      <div className="flex items-center gap-1">
        {divisor.map((v, ci) => (
          <CellInput
            key={`d-${ci}`}
            value={v}
            onChange={(val) => setCellValue('divisor', 0, ci, val)}
            inputRef={makeRefSetter(cellRefs, `divisor-0-${ci}`)}
          />
        ))}
        <div className="mx-1 grid h-10 w-6 place-items-center text-xl font-bold text-ink-500">)</div>
        {dividend.map((v, ci) => (
          <CellInput
            key={`dd-${ci}`}
            value={v}
            onChange={(val) => setCellValue('dividend', 0, ci, val)}
            inputRef={makeRefSetter(cellRefs, `dividend-0-${ci}`)}
          />
        ))}
      </div>

      {remainderSteps.map((row, ri) => (
        <div key={`rem-${ri}`} className="flex gap-1" style={{ marginLeft: `${(divisorDigits + 1) * 44}px` }}>
          {row.map((v, ci) => (
            <CellInput
              key={`rem-${ri}-${ci}`}
              value={v}
              onChange={(val) => setCellValue('remainder', ri, ci, val)}
              inputRef={makeRefSetter(cellRefs, `remainder-${ri}-${ci}`)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ColumnOperationsGrid({ grid, onChange, readOnly = false }) {
  const cellRefs = useRef({});
  const operation = grid?.operation || 'addition';
  const formatIndex = grid?.format ?? 0;
  const formats = FORMATS[operation] || FORMATS.addition;

  const setOperation = useCallback((op) => {
    onChange(makeEmptyGrid(op, 0));
  }, [onChange]);

  const setFormat = useCallback((fi) => {
    onChange(makeEmptyGrid(operation, fi));
  }, [onChange, operation]);

  const clearAll = useCallback(() => {
    onChange(makeEmptyGrid(operation, formatIndex));
  }, [onChange, operation, formatIndex]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => setOperation(op.id)}
            className={`grid h-11 w-11 place-items-center rounded-xl border-2 text-xl font-bold transition ${
              operation === op.id
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-orange-200 bg-white text-orange-600 hover:border-orange-400 hover:bg-orange-50'
            }`}
            title={op.label}
          >
            {op.icon}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-ink-500">Format</span>
        <select
          value={formatIndex}
          onChange={(e) => setFormat(Number(e.target.value))}
          className="rounded-lg border border-line-strong bg-white px-3 py-1.5 text-sm font-medium text-ink-700"
        >
          {formats.map((f, i) => (
            <option key={i} value={i}>{f.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 text-xs font-semibold text-ink-400 transition hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-line bg-surface-raised p-4">
        {operation === 'division' ? (
          <DivisionGrid grid={grid} onChange={onChange} cellRefs={cellRefs} />
        ) : (
          <StandardGrid grid={grid} onChange={onChange} cellRefs={cellRefs} readOnly={readOnly} />
        )}
      </div>
    </div>
  );
}

export { makeEmptyGrid, OPERATIONS, FORMATS };
