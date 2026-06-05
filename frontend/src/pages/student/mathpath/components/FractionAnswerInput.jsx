import React, { useEffect, useMemo, useRef, useState } from 'react';
import MathToolbar, { FRACTION_TOOL_IDS } from './MathToolbar';
import MathInputPopup from './MathInputPopup';

function parseParts(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return { whole: '', numerator: '', denominator: '' };

  const partialMixed = raw.match(/^(-?\d+)\s+(-?\d*)\s*\/\s*(-?\d*)$/);
  if (partialMixed) return { whole: partialMixed[1], numerator: partialMixed[2], denominator: partialMixed[3] };

  const mixed = raw.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return { whole: mixed[1], numerator: mixed[2], denominator: mixed[3] };

  const partialFraction = raw.match(/^(-?\d*)\s*\/\s*(-?\d*)$/);
  if (partialFraction) return { whole: '', numerator: partialFraction[1], denominator: partialFraction[2] };

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
  if (w && (n || d)) return `${w} ${n}/${d}`;
  if (n || d) return `${n}/${d}`;
  return w;
}

function numericOnly(raw) {
  return String(raw || '').replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
}

export function isFractionLikeAnswerValue(raw) {
  const display = String(raw || '');
  return /^-?\d+\s+\d+\s*\/\s*\d+$/.test(display) || /^-?\d+\s*\/\s*-?\d+$/.test(display);
}

function answerSupportsMixedNumber(question) {
  const answer = question?.answer;
  const explicitType = String(
    question?.answerFormat
    || question?.answer_format
    || question?.answerType
    || question?.answer_type
    || answer?.type
    || ''
  ).toLowerCase();
  if (['mixed', 'mixed_number'].includes(explicitType)) return true;
  const display = String(answer?.display || answer?.value || answer || '');
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(display)) return true;
  if (answer?.type === 'fraction') {
    const numerator = Math.abs(Number(answer.numerator));
    const denominator = Math.abs(Number(answer.denominator));
    return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0 && numerator > denominator;
  }
  return false;
}

export function shouldUseFractionAnswerInput(question) {
  if (!question || question.type === 'mcq') return false;
  const explicitType = String(
    question.answerFormat
    || question.answer_format
    || question.format
    || question.inputFormat
    || question.input_format
    || question.allowedAnswerFormat
    || question.allowed_answer_format
    || question.answer_format_type
    || question.answer_type
    || question.answerType
    || question.answerInputType
    || question.expectedAnswerType
    || ''
  ).toLowerCase();
  if (['fraction', 'mixed', 'mixed_number'].includes(explicitType)) return true;
  const answer = question.answer;
  if (answer?.type === 'list' || String(answer?.display || '').includes(',')) return false;
  if (answer?.type === 'fraction' || answer?.type === 'mixed') return true;
  const display = String(answer?.display || answer?.value || '');
  return isFractionLikeAnswerValue(display);
}

function allowedFractionTools(question) {
  const explicit = Array.isArray(question?.allowedInputTools) ? question.allowedInputTools : null;
  const tools = explicit?.length ? explicit : FRACTION_TOOL_IDS;
  const withCoreTools = new Set(['fraction', 'mixed', 'whole', 'clear']);
  tools.forEach((tool) => withCoreTools.add(tool));
  return [...withCoreTools];
}

export default function FractionAnswerInput({
  value,
  onChange,
  disabled = false,
  onEnter,
  mode = 'boxed',
  allowWhole = false,
  question = null,
  initialMode = '',
}) {
  const wholeRef = useRef(null);
  const numeratorRef = useRef(null);
  const denominatorRef = useRef(null);
  const parsedValue = useMemo(() => parseParts(value), [value]);
  const [parts, setParts] = useState(parsedValue);
  const [answerMode, setAnswerMode] = useState(() => initialMode || (allowWhole || parsedValue.whole ? 'mixed' : 'fraction'));
  const [popupOpen, setPopupOpen] = useState(false);
  const partsRef = useRef(parsedValue);
  const lastEmittedValueRef = useRef(value || '');

  useEffect(() => {
    if (String(value || '') === String(lastEmittedValueRef.current || '')) return;
    partsRef.current = parsedValue;
    setParts(parsedValue);
    setAnswerMode(initialMode || (allowWhole || parsedValue.whole ? 'mixed' : 'fraction'));
  }, [parsedValue.whole, parsedValue.numerator, parsedValue.denominator, initialMode, allowWhole]);

  const emitChange = (nextParts, modeOverride = answerMode) => {
    const output = modeOverride === 'whole'
      ? String(nextParts.whole || '').trim()
      : modeOverride === 'fraction'
        ? serializeParts({ whole: '', numerator: nextParts.numerator, denominator: nextParts.denominator })
        : serializeParts(nextParts);
    lastEmittedValueRef.current = output;
    onChange?.(output);
  };

  const updatePart = (key, nextValue) => {
    const next = { ...partsRef.current, [key]: numericOnly(nextValue) };
    partsRef.current = next;
    setParts(next);
    emitChange(next);
  };

  const clear = () => {
    const empty = { whole: '', numerator: '', denominator: '' };
    partsRef.current = empty;
    setParts(empty);
    lastEmittedValueRef.current = '';
    onChange?.('');
    requestAnimationFrame(() => numeratorRef.current?.focus());
  };

  const focusFraction = (nextMode = 'fraction') => {
    setAnswerMode(nextMode);
    setPopupOpen(true);
    const target = parts.numerator && !parts.denominator ? denominatorRef : numeratorRef;
    requestAnimationFrame(() => target.current?.focus());
  };

  const focusMixed = () => {
    setAnswerMode('mixed');
    setPopupOpen(true);
    requestAnimationFrame(() => (partsRef.current.whole ? numeratorRef : wholeRef).current?.focus());
  };

  const focusWhole = () => {
    setAnswerMode('whole');
    setPopupOpen(true);
    requestAnimationFrame(() => wholeRef.current?.focus());
  };

  const handleTool = (toolId) => {
    if (disabled) return;
    if (toolId === 'clear') clear();
    if (toolId === 'fraction') focusFraction('fraction');
    if (toolId === 'mixed') focusMixed();
    if (toolId === 'whole') focusWhole();
  };

  const insertValue = () => {
    emitChange(partsRef.current, answerMode);
    setPopupOpen(false);
  };

  const handlePaste = (event, targetKey) => {
    const text = event.clipboardData?.getData('text') || '';
    const parsed = parseParts(text);
    if (!parsed.numerator || !parsed.denominator) return;
    event.preventDefault();
    const next = {
      whole: allowWhole ? parsed.whole : '',
      numerator: parsed.numerator,
      denominator: parsed.denominator,
    };
    partsRef.current = next;
    setParts(next);
    if (parsed.whole) setAnswerMode('mixed');
    emitChange(next, parsed.whole ? 'mixed' : answerMode);
    requestAnimationFrame(() => (targetKey === 'numerator' ? denominatorRef : numeratorRef).current?.focus());
  };

  const onKeyDown = (event, field = '') => {
    if (event.key === 'Tab' && field === 'numerator' && !event.shiftKey) {
      event.preventDefault();
      denominatorRef.current?.focus();
      return;
    }
    if (event.key === 'Tab' && field === 'denominator' && event.shiftKey) {
      event.preventDefault();
      numeratorRef.current?.focus();
      return;
    }
    if (event.key === 'Enter') onEnter?.();
  };

  const isInline = mode === 'inline';
  const showWhole = answerMode === 'mixed' || answerMode === 'whole';
  const showFraction = answerMode !== 'whole';
  const helperText = answerSupportsMixedNumber(question)
    ? 'Answer as a fraction or mixed number.'
    : answerMode === 'whole'
      ? 'Answer as a whole number.'
      : 'Answer as a fraction';
  const denominatorIsZero = String(parts.denominator || '').trim() === '0';
  const compactInputClass = 'h-11 w-full rounded-none border-0 bg-white px-2 text-center font-mono text-xl text-ink-900 focus:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-ink-400';
  const wholeInputClass = 'h-11 w-20 rounded-lg border border-hairline bg-white px-3 text-center font-mono text-xl text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 disabled:bg-slate-50 disabled:text-ink-400';

  if (isInline) {
    return (
      <label className="inline-flex items-center gap-2" aria-label={helperText}>
        {showWhole && (
          <input
            ref={wholeRef}
            value={parts.whole}
            onChange={(event) => updatePart('whole', event.target.value)}
            disabled={disabled}
            inputMode="numeric"
            aria-label="Whole number"
            className={wholeInputClass}
            onKeyDown={onKeyDown}
          />
        )}

        {showFraction && <div className="w-28 overflow-hidden rounded-lg border border-hairline bg-white" role="group" aria-label="Fraction answer">
          <input
            ref={numeratorRef}
            value={parts.numerator}
            onChange={(event) => updatePart('numerator', event.target.value)}
            onPaste={(event) => handlePaste(event, 'numerator')}
            disabled={disabled}
            inputMode="numeric"
            aria-label="Numerator"
            className="h-9 w-full rounded-none border-0 border-b border-hairline bg-white text-center font-mono text-lg text-ink-900 focus:outline-none focus:ring-0"
            onKeyDown={(event) => onKeyDown(event, 'numerator')}
          />
          <div className="h-0.5 bg-ink-700" />
          <input
            ref={denominatorRef}
            value={parts.denominator}
            onChange={(event) => updatePart('denominator', event.target.value)}
            onPaste={(event) => handlePaste(event, 'denominator')}
            disabled={disabled}
            inputMode="numeric"
            aria-label="Denominator"
            aria-invalid={denominatorIsZero}
            className="h-9 w-full rounded-none border-0 bg-white text-center font-mono text-lg text-ink-900 focus:outline-none focus:ring-0"
            onKeyDown={(event) => onKeyDown(event, 'denominator')}
          />
        </div>}
      </label>
    );
  }

  return (
    <div className="relative rounded-xl border border-hairline bg-white p-4">
      <div className="flex flex-col items-center">
        <span className="mb-2 block text-sm font-semibold text-ink-700">{helperText}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setPopupOpen(true);
            requestAnimationFrame(() => {
              if (answerMode === 'whole') wholeRef.current?.focus();
              else if (answerMode === 'mixed' && !partsRef.current.whole) wholeRef.current?.focus();
              else numeratorRef.current?.focus();
            });
          }}
          className="min-h-14 w-full max-w-[11rem] rounded-xl border border-hairline bg-slate-50 px-4 py-3 text-center font-mono text-xl text-ink-900 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Math answer value"
        >
          {String(value || '').trim() || 'Tap to enter'}
        </button>
        <MathToolbar
          compact
          disabled={disabled}
          tools={allowedFractionTools(question)}
          onTool={handleTool}
          label="Fraction answer tools"
        />
        {popupOpen && (
          <MathInputPopup
            mode={answerMode}
            parts={parts}
            disabled={disabled}
            onPartChange={updatePart}
            onPaste={handlePaste}
            onKeyDown={onKeyDown}
            onInsert={insertValue}
            onClose={() => setPopupOpen(false)}
            wholeRef={wholeRef}
            numeratorRef={numeratorRef}
            denominatorRef={denominatorRef}
          />
        )}
      </div>
    </div>
  );
}
