import React, { useEffect, useMemo, useState } from 'react';

function parseParts(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return { whole: '', numerator: '', denominator: '' };

  const mixed = raw.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return { whole: mixed[1], numerator: mixed[2], denominator: mixed[3] };

  const fraction = raw.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (fraction) return { whole: '', numerator: fraction[1], denominator: fraction[2] };

  if (/^-?\d+$/.test(raw)) return { whole: raw, numerator: '', denominator: '' };

  return { whole: '', numerator: '', denominator: '' };
}

function serializeParts({ whole, numerator, denominator }) {
  const w = String(whole || '').trim();
  const n = String(numerator || '').trim();
  const d = String(denominator || '').trim();

  if (!w && !n && !d) return '';
  if (n && d) return w ? `${w} ${n}/${d}` : `${n}/${d}`;
  if (w && !n && !d) return w;
  return '';
}

function numericOnly(raw) {
  return String(raw || '').replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
}

export function isFractionLikeAnswerValue(raw) {
  const display = String(raw || '');
  return /^-?\d+\s+\d+\s*\/\s*\d+$/.test(display) || /^-?\d+\s*\/\s*-?\d+$/.test(display);
}

export function shouldUseFractionAnswerInput(question) {
  if (!question || question.type === 'mcq') return false;
  if (['fraction', 'mixed'].includes(String(question.answerInputType || question.expectedAnswerType || ''))) return true;
  const answer = question.answer;
  if (answer?.type === 'list' || String(answer?.display || '').includes(',')) return false;
  if (answer?.type === 'fraction' || answer?.type === 'mixed') return true;
  const display = String(answer?.display || answer?.value || '');
  return isFractionLikeAnswerValue(display);
}

export default function FractionAnswerInput({
  value,
  onChange,
  disabled = false,
  onEnter,
  mode = 'boxed',
  allowWhole = false,
}) {
  const parsedValue = useMemo(() => parseParts(value), [value]);
  const [parts, setParts] = useState(parsedValue);

  useEffect(() => {
    setParts(parsedValue);
  }, [parsedValue.whole, parsedValue.numerator, parsedValue.denominator]);

  const updatePart = (key, nextValue) => {
    const next = { ...parts, [key]: numericOnly(nextValue) };
    setParts(next);
    onChange?.(serializeParts(next));
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') onEnter?.();
  };

  const isInline = mode === 'inline';
  const showWhole = allowWhole || Boolean(parts.whole);
  const baseClass = 'h-14 rounded-xl border border-hairline bg-white px-3 text-center font-mono text-xl text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 disabled:bg-slate-50 disabled:text-ink-400';
  const sharedInputClass = `${baseClass} ${isInline ? 'h-11 w-20 rounded-lg text-lg' : ''}`;
  const fractionLabelClass = 'mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500';

  if (isInline) {
    return (
      <label className="inline-flex items-center gap-2" aria-label="Answer as fraction">
        {showWhole && (
          <input
            value={parts.whole}
            onChange={(event) => updatePart('whole', event.target.value)}
            disabled={disabled}
            inputMode="numeric"
            aria-label="Whole number"
            className={sharedInputClass}
            onKeyDown={onKeyDown}
          />
        )}

        <div className="overflow-hidden rounded-lg border border-hairline bg-white" role="group" aria-label="Fraction answer">
          <input
            value={parts.numerator}
            onChange={(event) => updatePart('numerator', event.target.value)}
            disabled={disabled}
            inputMode="numeric"
            aria-label="Numerator"
            className="h-8 w-20 rounded-none border-0 border-b border-hairline bg-white text-center font-mono text-lg text-ink-900 focus:outline-none focus:ring-0"
            onKeyDown={onKeyDown}
          />
          <div className="h-0.5 bg-ink-700" />
          <input
            value={parts.denominator}
            onChange={(event) => updatePart('denominator', event.target.value)}
            disabled={disabled}
            inputMode="numeric"
            aria-label="Denominator"
            className="h-8 w-20 rounded-none border-0 bg-white text-center font-mono text-lg text-ink-900 focus:outline-none focus:ring-0"
            onKeyDown={onKeyDown}
          />
        </div>
      </label>
    );
  }

  return (
    <div className="rounded-xl border border-hairline bg-white p-4">
      <div className={`grid gap-3 ${showWhole ? 'grid-cols-[6.75rem_1fr]' : 'grid-cols-1'} items-start`}>
        {showWhole && (
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Whole</span>
            <input
              value={parts.whole}
              onChange={(event) => updatePart('whole', event.target.value)}
              disabled={disabled}
              inputMode="numeric"
              aria-label="Whole number"
              className={baseClass}
              onKeyDown={onKeyDown}
            />
          </label>
        )}

        <div className="min-w-0">
          <span className={fractionLabelClass}>Answer as a fraction</span>
          <div className="mx-auto max-w-[12rem] overflow-hidden rounded-xl border border-hairline bg-white" role="group" aria-label="Fraction answer">
            <label className="block">
              <span className="sr-only">Numerator</span>
              <input
                value={parts.numerator}
                onChange={(event) => updatePart('numerator', event.target.value)}
                disabled={disabled}
                inputMode="numeric"
                aria-label="Numerator"
                className={`${baseClass} rounded-none rounded-t-xl`}
                onKeyDown={onKeyDown}
              />
            </label>
            <div className="mx-3 h-0.5 bg-ink-900" aria-hidden />
            <label className="block">
              <span className="sr-only">Denominator</span>
              <input
                value={parts.denominator}
                onChange={(event) => updatePart('denominator', event.target.value)}
                disabled={disabled}
                inputMode="numeric"
                aria-label="Denominator"
                className={`${baseClass} rounded-none rounded-b-xl`}
                onKeyDown={onKeyDown}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
