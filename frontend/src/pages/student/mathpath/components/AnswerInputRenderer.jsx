import React, { useMemo } from 'react';
import FractionAnswerInput, { shouldUseFractionAnswerInput } from './FractionAnswerInput';

function normalizeType(question = {}) {
  if (question.type === 'mcq') return 'multiple_choice';

  const explicit = String(
    question.answer_type
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

const MATH_INSERT_TOOLS = [
  { id: 'fraction', label: 'x/y', value: '()/()' },
  { id: 'subscript', label: 'xₐ', value: '_{}' },
  { id: 'power', label: 'xᵇ', value: '^{}' },
  { id: 'subscriptPower', label: 'xₐᵇ', value: '_{}^{}' },
  { id: 'mixed', label: 'xᵇ/a', value: ' ()/()' },
  { id: 'root', label: 'ⁿ√x', value: '√()' },
  { id: 'degree', label: 'x°', value: '°' },
  { id: 'angle', label: '∠', value: '∠' },
  { id: 'pi', label: 'π', value: 'π' },
  { id: 'theta', label: 'θ', value: 'θ' },
];

function MathAnswerInsertTools({ disabled = false, onInsert }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2" aria-label="Math answer insert tools">
      {MATH_INSERT_TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          disabled={disabled}
          onClick={() => onInsert?.(tool.value)}
          className="grid h-10 min-w-11 place-items-center rounded-lg border border-hairline bg-orange-50 px-3 font-serif text-lg font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-45"
          title={`Insert ${tool.label}`}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
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
    <div className="rounded-xl border border-hairline bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-ink-700">Enter the order from smallest to largest.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {Array.from({ length: Math.max(2, items.length || 3) }, (_, index) => (
          <label key={index} className="min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Position {index + 1}</span>
            <input
              value={parts[index] || ''}
              onChange={(event) => setPart(index, event.target.value)}
              disabled={disabled}
              placeholder={items[index] ? 'Drag mentally, type here' : 'Fraction'}
              className="h-12 w-full rounded-xl border border-hairline px-3 text-center font-mono text-base text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
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

  if (type === 'fraction' || type === 'mixed_number') {
    return (
      <FractionAnswerInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        onEnter={onEnter}
        allowWhole={type === 'mixed_number'}
      />
    );
  }

  if (type === 'ordering') {
    return <OrderingAnswerInput question={question} value={value} onChange={onChange} disabled={disabled} onEnter={onEnter} />;
  }

  const inputMode = type === 'decimal' ? 'decimal' : type === 'whole_number' ? 'numeric' : 'text';
  const label = type === 'decimal' ? 'Decimal answer' : type === 'whole_number' ? 'Whole number answer' : 'Answer';
  const showMathTools = type === 'text';
  const insertMathValue = (insertValue) => {
    if (disabled) return;
    onChange?.(`${String(value || '')}${insertValue}`);
  };
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        inputMode={inputMode}
        placeholder={type === 'decimal' ? 'e.g. 0.25' : type === 'whole_number' ? 'e.g. 12' : 'Type your answer'}
        className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.(); }}
      />
      {showMathTools && <MathAnswerInsertTools disabled={disabled} onInsert={insertMathValue} />}
    </div>
  );
}

export { normalizeType as getAnswerInputType };
