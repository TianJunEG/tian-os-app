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
  ],
  subtraction: [
    { label: '2 digits subtraction', digits: 2, rows: 2 },
    { label: '3 digits subtraction', digits: 3, rows: 2 },
    { label: '4 digits subtraction', digits: 4, rows: 2 },
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
  const cols = f.digits + 1;
  if (operation === 'division') {
    return {
      operation,
      format,
      cols: f.digits,
      divisorDigits: f.divisorDigits || 1,
      quotient: Array(f.digits).fill(''),
      dividend: Array(f.digits).fill(''),
      divisor: Array(f.divisorDigits || 1).fill(''),
      remainderSteps: [Array(f.digits).fill('')],
    };
  }
  const dataRows = f.rows || 2;
  const rows = [];
  for (let r = 0; r < dataRows; r++) rows.push(Array(cols).fill(''));
  rows.push(Array(cols).fill(''));
  const carries = Array(cols).fill('');
  return { operation, format, cols, rows, carries };
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
        highlight ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-ink-900'
      }`}
    />
  );
}

function StandardGrid({ grid, onChange, cellRefs, readOnly }) {
  const { operation, cols, rows, carries } = grid;
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
    if (key === 'ArrowRight' || (key !== 'Backspace' && key !== 'ArrowLeft' && /^[0-9]$/.test(key))) {
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
        {carries.map((v, ci) => (
          <CellInput
            key={`c-${ci}`}
            value={v}
            onChange={(val) => setCellValue('carry', 0, ci, val)}
            onKeyDown={(e) => handleKeyDown(e, 'carry', 0, ci)}
            inputRef={(el) => { cellRefs.current[`carry-0-${ci}`] = el; }}
            small
            highlight
          />
        ))}
      </div>

      {rows.map((row, ri) => (
        <React.Fragment key={`r-${ri}`}>
          {ri === answerRow && (
            <div className="my-1 flex items-center gap-1">
              <div className="w-10" />
              <div className="h-0.5 flex-1 bg-ink-900" style={{ width: `${cols * 44 + (cols - 1) * 4}px` }} />
            </div>
          )}
          <div className="flex gap-1">
            <div className="grid h-10 w-10 place-items-center text-lg font-bold text-ink-700">
              {ri === 1 && ri < answerRow ? opSymbol : ''}
            </div>
            {row.map((v, ci) => (
              <CellInput
                key={`${ri}-${ci}`}
                value={v}
                onChange={(val) => setCellValue('row', ri, ci, val)}
                onKeyDown={(e) => handleKeyDown(e, 'row', ri, ci)}
                inputRef={(el) => { cellRefs.current[`row-${ri}-${ci}`] = el; }}
              />
            ))}
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
            inputRef={(el) => { cellRefs.current[`quotient-0-${ci}`] = el; }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        {divisor.map((v, ci) => (
          <CellInput
            key={`d-${ci}`}
            value={v}
            onChange={(val) => setCellValue('divisor', 0, ci, val)}
            inputRef={(el) => { cellRefs.current[`divisor-0-${ci}`] = el; }}
          />
        ))}
        <div className="mx-1 grid h-10 w-6 place-items-center text-xl font-bold text-ink-500">)</div>
        {dividend.map((v, ci) => (
          <CellInput
            key={`dd-${ci}`}
            value={v}
            onChange={(val) => setCellValue('dividend', 0, ci, val)}
            inputRef={(el) => { cellRefs.current[`dividend-0-${ci}`] = el; }}
          />
        ))}
      </div>

      <div className="flex gap-1" style={{ marginLeft: `${(divisorDigits + 1) * 44}px` }}>
        <div className="h-0.5 flex-1 bg-ink-900" style={{ width: `${cols * 44}px` }} />
      </div>

      {remainderSteps.map((row, ri) => (
        <div key={`rem-${ri}`} className="flex gap-1" style={{ marginLeft: `${(divisorDigits + 1) * 44}px` }}>
          {row.map((v, ci) => (
            <CellInput
              key={`rem-${ri}-${ci}`}
              value={v}
              onChange={(val) => setCellValue('remainder', ri, ci, val)}
              inputRef={(el) => { cellRefs.current[`remainder-${ri}-${ci}`] = el; }}
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-700"
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

      <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
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
