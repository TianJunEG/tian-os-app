import React, { useMemo } from 'react';
import FractionAnswerInput, { shouldUseFractionAnswerInput } from './FractionAnswerInput';
import MathSymbolBar from './MathSymbolBar';

// Expression / algebra answers need symbol entry (x, exponents, roots, π,
// brackets) that a bare text input can't provide.
const EXPRESSION_SYMBOLS = ['x', 'power', 'root', 'fraction', 'times', 'divide', 'lparen', 'rparen', 'pi'];

function isComparisonQuestion(question = {}) {
  // Robust signal first: the generator tags compare / "<, > or =" families with
  // answerFormat:'comparison' (survives the server-side allowlist).
  const fmt = String(
    question.answerFormat || question.answer_format || question.format || ''
  ).toLowerCase();
  if (fmt === 'comparison') return true;
  const prompt = String(question.prompt || question.stem || '');
  if (/write\s*[<>=]\s*,?\s*[<>=]?\s*or\s*[<>=]/i.test(prompt)) return true;
  const ans = String(question.answer?.value ?? question.answer?.display ?? question.answer ?? '').trim();
  return ans === '>' || ans === '<' || ans === '=';
}

function ComparisonAnswerInput({ value, onChange, disabled }) {
  return (
    <div>
      <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Choose the symbol</span>
      <div className="flex gap-4">
        {['>', '<', '='].map((sym) => (
          <button
            key={sym}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(sym)}
            className={`flex h-20 w-24 items-center justify-center rounded-2xl border-2 text-4xl font-bold transition
              ${value === sym
                ? 'border-emerald bg-emerald text-white shadow-md'
                : 'border-line-soft bg-white text-ink-700 hover:border-emerald hover:bg-emerald-tint'}
              disabled:opacity-50`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}

function normalizeType(question = {}) {
  if (question.type === 'mcq') return 'multiple_choice';
  if (isComparisonQuestion(question)) return 'comparison';

  const explicit = String(
    question.answerFormat
      || question.answer_format
      || question.format
      || question.inputFormat
      || question.input_format
      || question.answer_type
      || question.answerType
      || question.answerInputType
      || question.expectedAnswerType
      || ''
  ).toLowerCase();

  const mappedExplicit = {
    mixed: 'mixed_number',
    mixed_number: 'mixed_number',
    fraction: 'fraction',
    whole: 'whole_number',
    whole_number: 'whole_number',
    number: 'whole_number',
    integer: 'whole_number',
    decimal: 'decimal',
    ordering: 'ordering',
    order: 'ordering',
    list: 'ordering',
    expression: 'expression',
    algebra: 'expression',
    equation: 'expression',
    text: 'text',
    multiple_choice: 'multiple_choice',
    mcq: 'multiple_choice',
  };
  if (mappedExplicit[explicit]) return mappedExplicit[explicit];

  if (question.answer?.type === 'mixed') return 'mixed_number';
  if (question.answer?.type === 'fraction') return 'fraction';
  if (question.answer?.type === 'whole') return 'whole_number';
  if (question.answer?.type === 'decimal') return 'decimal';
  if (question.answer?.type === 'list') return 'ordering';
  const answerDisplay = String(question.answer?.display || question.answer?.value || question.answer || '');
  if (answerDisplay.includes(',')) {
    const parts = answerDisplay.split(',').map((p) => p.trim());
    if (parts.length >= 3 && parts.every((p) => /^\s*-?\d+(\.\d+)?\s*$/.test(p) || /^\s*\d+\s*\/\s*\d+\s*$/.test(p))) {
      return 'ordering';
    }
  }
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(answerDisplay)) return 'mixed_number';
  if (shouldUseFractionAnswerInput(question)) return 'fraction';
  if (/^-?\d+\.\d+$/.test(answerDisplay)) return 'decimal';
  if (/^-?\d+$/.test(answerDisplay)) return 'whole_number';
  return 'text';
}

// True when the question explicitly declares a free-text / algebraic-expression
// answer (so the keyboard should stay alphanumeric). The bare `text` fallback —
// an unclassified short-answer that is really numeric — returns false, so it
// gets the numeric pad instead of a QWERTY keyboard on iPad.
function isExplicitFreeText(question = {}) {
  const explicit = String(
    question.answerFormat
      || question.answer_format
      || question.format
      || question.inputFormat
      || question.input_format
      || question.answer_type
      || question.answerType
      || question.answerInputType
      || question.expectedAnswerType
      || ''
  ).toLowerCase();
  return ['expression', 'algebra', 'equation', 'text'].includes(explicit);
}

// A question whose correct answer can be negative needs a way to enter the minus
// sign. On iOS the 'numeric' AND 'decimal' software keypads have NO '-' key, so
// no inputMode can supply one — we render an on-screen sign toggle beside the box
// instead. The negatable set is the Number Sense negative-integer strand: NS021
// (number line), NS023 (temperature / levels in context) and NS024–NS029 (integer
// arithmetic and word problems). NS022 is a comparison picker, so it never reaches
// a text input. skillId survives the server-side answer strip, so this triggers
// without the client ever seeing (or leaking) the answer's sign.
const NEGATIVE_ANSWER_SKILL_RE = /^NS0(21|2[3-9])$/;
function answerCanBeNegative(question = {}) {
  const skillId = String(question.skillId || question.skill_id || question.skill || '');
  return NEGATIVE_ANSWER_SKILL_RE.test(skillId);
}

function extractOrderingItems(question = {}) {
  const prompt = String(question.prompt || question.stem || '');
  const match = prompt.match(/:\s*([^.?]+)[.?]?$/);
  const source = match?.[1] || prompt;
  const items = source
    .split(',')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter((item) => /\d+\s*\/\s*\d+/.test(item));
  const answerItems = String(question.answer?.display || question.answer || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length >= 2 ? items : answerItems;
}

function OrderingAnswerInput({ question, value, onChange, disabled, onEnter }) {
  const items = useMemo(() => extractOrderingItems(question), [question]);
  // Detect if this is a FRACTION ordering question (items are fraction-shaped).
  // extractOrderingItems already filters to /\d+\/\d+/ shapes, so any non-empty
  // items array means fractions. Whole/decimal ordering keeps the plain input.
  const isFractionOrdering = items.length > 0
    && items.every((item) => /^\s*-?\d+(\s+\d+\s*\/\s*\d+|\s*\/\s*\d+)?\s*$/.test(item));
  const parts = String(value || '').split(',').map((item) => item.trim());
  const setPart = (index, nextValue) => {
    const next = Array.from({ length: Math.max(items.length, parts.length, index + 1) }, (_, i) => parts[i] || '');
    next[index] = nextValue;
    onChange?.(next.join(', '));
  };

  return (
    <div className="rounded-xl border border-line-soft bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-ink-700">Enter the order from smallest to largest.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: Math.max(2, items.length || 3) }, (_, index) => (
          <div key={index} className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Position {index + 1}</p>
            {isFractionOrdering ? (
              <FractionAnswerInput
                value={parts[index] || ''}
                onChange={(next) => setPart(index, next)}
                disabled={disabled}
                onEnter={onEnter}
                allowWhole
              />
            ) : (
              <input
                value={parts[index] || ''}
                onChange={(event) => setPart(index, event.target.value)}
                disabled={disabled}
                aria-label={`Your answer for position ${index + 1}`}
                placeholder="Type here"
                className="h-12 w-full rounded-xl border border-line-soft px-3 text-center font-mono text-base text-ink-900 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20"
                onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.(); }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnswerInputRenderer({
  question,
  value,
  onChange,
  disabled = false,
  onEnter,
}) {
  const type = normalizeType(question);

  if (type === 'fraction' || type === 'mixed_number' || type === 'whole_number') {
    return (
      <FractionAnswerInput
        question={question}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onEnter={onEnter}
        allowWhole={type === 'mixed_number' || type === 'whole_number'}
        initialMode={type === 'whole_number' ? 'whole' : type === 'mixed_number' ? 'mixed' : 'fraction'}
      />
    );
  }

  if (type === 'ordering') {
    return <OrderingAnswerInput question={question} value={value} onChange={onChange} disabled={disabled} onEnter={onEnter} />;
  }

  if (type === 'comparison') {
    return <ComparisonAnswerInput value={value} onChange={onChange} disabled={disabled} />;
  }

  // iPad keyboard selection: decimal/numeric answers must get the number pad.
  // 'decimal' gives the pad with a '.'; 'numeric' is digits-only. NOTE: neither
  // iOS keypad exposes a '-' key, so negative answers rely on the on-screen sign
  // toggle below (see answerCanBeNegative), not on inputMode. The generic
  // short-answer/numeric fallback defaults to 'decimal'; only genuine free-text /
  // algebraic-expression answers keep the full 'text' keyboard.
  const inputMode = type === 'decimal'
    ? 'decimal'
    : type === 'whole_number'
      ? 'numeric'
      : (type === 'expression' || isExplicitFreeText(question))
        ? 'text'
        : 'decimal';
  const label = type === 'decimal' ? 'Decimal answer' : type === 'whole_number' ? 'Whole number answer' : type === 'expression' ? 'Expression answer' : 'Answer';
  // A question's unit (e.g. "cm", "$", "min") is shown as a FIXED suffix so the
  // student types only the value — the unit never becomes part of the typed
  // answer (and so can't break marking). Currency-style units sit before the box.
  const unit = type === 'expression' ? '' : String(question?.unit || '').trim();
  const unitIsPrefix = /^(\$|s\$|rm|£|€)$/i.test(unit);
  // On-screen minus toggle for questions whose answer can be negative (iOS number
  // pads have no '-' key). Prepends/removes a leading ASCII '-' on the value the
  // grader sees; the button glyph is a typographic '−' for legibility.
  const canNegate = type !== 'expression' && answerCanBeNegative(question);
  const rawValue = String(value ?? '');
  const isNegative = rawValue.startsWith('-');
  const toggleSign = () => onChange?.(isNegative ? rawValue.slice(1) : `-${rawValue}`);
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}{unit ? ` (in ${unit})` : ''}</span>
      <div className="flex items-center gap-2">
        {canNegate && (
          <button
            type="button"
            disabled={disabled}
            onClick={toggleSign}
            aria-pressed={isNegative}
            aria-label={isNegative ? 'Answer is negative — tap to make it positive' : 'Make the answer negative'}
            title="Negative sign"
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 text-2xl font-bold transition
              ${isNegative
                ? 'border-emerald bg-emerald text-white shadow-md'
                : 'border-line-soft bg-white text-ink-700 hover:border-emerald hover:bg-emerald-tint'}
              disabled:opacity-50`}
          >
            −
          </button>
        )}
        <div className="relative flex flex-1 items-center">
          {unit && unitIsPrefix && <span className="pointer-events-none absolute left-4 text-lg font-semibold text-ink-400">{unit}</span>}
          <input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            disabled={disabled}
            inputMode={inputMode}
            aria-label={`Your answer${unit ? ` in ${unit}` : ''}${label === 'Answer' ? '' : ` (${label})`}`}
            placeholder={question?.placeholder || (type === 'decimal' ? 'e.g. 0.25' : type === 'whole_number' ? 'e.g. 12' : 'Type your answer')}
            className={`w-full rounded-xl border border-line-soft py-3 font-mono text-lg text-ink-900 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20 ${unit && unitIsPrefix ? 'pl-10 pr-4' : unit ? 'pl-4 pr-14' : 'px-4'}`}
            onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.(); }}
          />
          {unit && !unitIsPrefix && <span className="pointer-events-none absolute right-4 text-lg font-semibold text-ink-400">{unit}</span>}
        </div>
      </div>
      {canNegate && (
        <p className="mt-1 text-xs text-ink-400">Tap <span className="font-semibold text-ink-500">−</span> for a negative answer.</p>
      )}
      {type === 'expression' && (
        <MathSymbolBar symbols={EXPRESSION_SYMBOLS} value={value} onChange={onChange} disabled={disabled} className="mt-3 justify-center" />
      )}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={disabled || !String(value || '').trim()}
          onClick={() => onChange?.('')}
          className="rounded-lg border border-line-soft bg-white px-3 py-2 text-sm font-semibold text-emerald-deep shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export { normalizeType as getAnswerInputType };
