import React from 'react';

// A compact, tappable row of math symbols for free-text / expression answers.
// Fixes the long-standing gap where π, °, ∠, exponents and roots were not
// enterable anywhere (the old FULL_MATH_TOOL_IDS keypad was dead code). Each
// button appends its token to the current answer via onInsert — simple and
// predictable for young learners, no cursor bookkeeping. Backspace and Clear
// give an obvious way to fix mistakes.
//
// Tokens are inserted as human-readable unicode so the answer stays legible and
// the server-side answer checkers (which normalise π / √ / superscripts) accept
// them.

export const SYMBOL_DEFS = {
  pi: { token: 'π', label: 'π', title: 'Pi' },
  root: { token: '√', label: '√', title: 'Square root' },
  square: { token: '²', label: 'x²', title: 'Squared' },
  cube: { token: '³', label: 'x³', title: 'Cubed' },
  power: { token: '^', label: 'xⁿ', title: 'To the power of' },
  degree: { token: '°', label: '°', title: 'Degrees' },
  angle: { token: '∠', label: '∠', title: 'Angle' },
  theta: { token: 'θ', label: 'θ', title: 'Theta' },
  times: { token: '×', label: '×', title: 'Multiply' },
  divide: { token: '÷', label: '÷', title: 'Divide' },
  fraction: { token: '/', label: '/', title: 'Fraction bar' },
  lparen: { token: '(', label: '(', title: 'Open bracket' },
  rparen: { token: ')', label: ')', title: 'Close bracket' },
  x: { token: 'x', label: 'x', title: 'Unknown x' },
};

// Sensible default toolset for a generic free-text answer.
export const DEFAULT_SYMBOLS = ['fraction', 'times', 'divide', 'power'];

export default function MathSymbolBar({
  symbols = DEFAULT_SYMBOLS,
  value = '',
  onChange,
  disabled = false,
  className = '',
}) {
  const defs = symbols.map((s) => (typeof s === 'object' ? s : SYMBOL_DEFS[s])).filter(Boolean);
  if (!defs.length) return null;

  const append = (token) => onChange?.(`${value ?? ''}${token}`);
  const backspace = () => onChange?.(String(value ?? '').slice(0, -1));

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Math symbols">
      {defs.map((def) => (
        <button
          key={def.token + def.label}
          type="button"
          disabled={disabled}
          onClick={() => append(def.token)}
          title={def.title}
          aria-label={def.title}
          className="grid h-11 min-w-11 place-items-center rounded-xl border border-line-soft bg-white px-3 font-serif text-lg font-semibold text-emerald-deep shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {def.label}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled || !String(value ?? '').length}
        onClick={backspace}
        title="Delete last character"
        aria-label="Delete last character"
        className="grid h-11 min-w-11 place-items-center rounded-xl border border-line-soft bg-white px-3 text-lg text-ink-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        ⌫
      </button>
    </div>
  );
}
