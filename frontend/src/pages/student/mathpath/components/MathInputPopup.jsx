import React from 'react';

function fieldClass(size = 'normal') {
  return `${size === 'small' ? 'h-12 w-20' : 'h-14 w-28'} rounded-xl border border-hairline bg-slate-50 px-3 text-center font-mono text-2xl text-ink-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 disabled:bg-slate-100 disabled:text-ink-400`;
}

export default function MathInputPopup({
  mode = 'fraction',
  parts = {},
  disabled = false,
  onPartChange,
  onPaste,
  onKeyDown,
  onInsert,
  onClose,
  wholeRef,
  numeratorRef,
  denominatorRef,
  floating = false,
  style = null,
}) {
  const showWhole = mode === 'mixed' || mode === 'whole';
  const showFraction = mode !== 'whole';
  const denominatorIsZero = String(parts.denominator || '').trim() === '0';

  // When floating, the popup is rendered in a portal with fixed positioning so it
  // is never clipped by an overflow-hidden card or an overflow-y-auto answer pane
  // (which previously hid the Insert button). The non-floating fallback keeps the
  // original inline anchoring for any caller that does not pass a position.
  const positionClass = floating
    ? 'fixed z-50 w-[min(22rem,calc(100vw-2rem))]'
    : 'absolute left-1/2 top-full z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2';

  return (
    <div
      style={floating ? style || undefined : undefined}
      className={`${positionClass} rounded-3xl border border-hairline bg-white p-5 shadow-floating`}
    >
      <button
        type="button"
        className="absolute right-3 top-3 rounded-full px-2 py-1 text-sm font-semibold text-ink-400 hover:bg-slate-50 hover:text-ink-700"
        onClick={onClose}
        aria-label="Close math input"
      >
        ×
      </button>
      <div className="flex min-h-28 items-center justify-center gap-3">
        {showWhole && (
          <input
            ref={wholeRef}
            value={parts.whole || ''}
            onChange={(event) => onPartChange?.('whole', event.target.value)}
            disabled={disabled}
            inputMode="numeric"
            aria-label="Whole number"
            className={fieldClass('small')}
            onKeyDown={(event) => onKeyDown?.(event, 'whole')}
          />
        )}

        {showFraction && (
          <div className="grid justify-items-center gap-2">
            <input
              ref={numeratorRef}
              value={parts.numerator || ''}
              onChange={(event) => onPartChange?.('numerator', event.target.value)}
              onPaste={(event) => onPaste?.(event, 'numerator')}
              disabled={disabled}
              inputMode="numeric"
              aria-label="Numerator"
              className={fieldClass()}
              onKeyDown={(event) => onKeyDown?.(event, 'numerator')}
            />
            <div className="h-0.5 w-32 rounded-full bg-ink-900" aria-hidden />
            <input
              ref={denominatorRef}
              value={parts.denominator || ''}
              onChange={(event) => onPartChange?.('denominator', event.target.value)}
              onPaste={(event) => onPaste?.(event, 'denominator')}
              disabled={disabled}
              inputMode="numeric"
              aria-label="Denominator"
              aria-invalid={denominatorIsZero}
              className={fieldClass()}
              onKeyDown={(event) => onKeyDown?.(event, 'denominator')}
            />
          </div>
        )}
      </div>
      {denominatorIsZero && <p className="mt-2 text-center text-xs font-semibold text-error-700">Denominator cannot be zero.</p>}
      <button
        type="button"
        disabled={disabled || denominatorIsZero}
        onClick={onInsert}
        className="mx-auto mt-4 block rounded-xl px-5 py-2 text-xl font-bold text-ink-400 transition hover:bg-orange-50 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Insert
      </button>
    </div>
  );
}
