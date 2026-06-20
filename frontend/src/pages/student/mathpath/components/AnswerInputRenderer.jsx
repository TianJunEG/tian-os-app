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
  if (answerDisplay.includes(',') && /\d+\s*\/\s*\d+/.test(answerDisplay)) return 'ordering';
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
  const parts = String(value || '').split(',').map((item) => item.trim());
  const setPart = (index, nextValue) => {
    const next = Array.from({ length: Math.max(items.length, parts.length, index + 1) }, (_, i) => parts[i] || '');
    next[index] = nextValue;
    onChange?.(next.join(', '));
  };

  return (
    <div className="rounded-xl border border-line-soft bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-ink-700">Enter the order from smallest to largest.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {Array.from({ length: Math.max(2, items.length || 3) }, (_, index) => (
          <label key={index} className="min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Position {index + 1}</span>
            <input
              value={parts[index] || ''}
              onChange={(event) => setPart(index, event.target.value)}
              disabled={disabled}
              aria-label={`Your answer for position ${index + 1}`}
              placeholder={items[index] ? 'Type here' : 'Fraction'}
              className="h-12 w-full rounded-xl border border-line-soft px-3 text-center font-mono text-base text-ink-900 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20"
              onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.(); }}
            />
          </label>
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
  // 'decimal' gives the pad with '.' and '-'; 'numeric' is digits-only. The
  // generic short-answer/numeric fallback defaults to 'decimal'; only genuine
  // free-text / algebraic-expression answers keep the full 'text' keyboard.
  const inputMode = type === 'decimal'
    ? 'decimal'
    : type === 'whole_number'
      ? 'numeric'
      : (type === 'expression' || isExplicitFreeText(question))
        ? 'text'
        : 'decimal';
  const label = type === 'decimal' ? 'Decimal answer' : type === 'whole_number' ? 'Whole number answer' : type === 'expression' ? 'Expression answer' : 'Answer';
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        inputMode={inputMode}
        aria-label={`Your answer${label === 'Answer' ? '' : ` (${label})`}`}
        placeholder={question?.placeholder || (type === 'decimal' ? 'e.g. 0.25' : type === 'whole_number' ? 'e.g. 12' : 'Type your answer')}
        className="w-full rounded-xl border border-line-soft px-4 py-3 font-mono text-lg text-ink-900 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20"
        onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.(); }}
      />
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
