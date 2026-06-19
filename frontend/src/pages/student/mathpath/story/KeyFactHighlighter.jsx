import React from 'react';

const FACT_TONES = {
  fraction_part: 'border-sky-200 bg-sky-50 text-sky-900',
  quantity_known: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  remainder: 'border-gold-tint bg-gold-tint text-gold-deep',
  whole: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  target_unknown: 'border-danger-border bg-danger-tint text-rose-900',
  operation_hint: 'border-purple-200 bg-purple-50 text-purple-900',
};

function sortFactsForSentence(sentence = '', facts = []) {
  return (facts || [])
    .map((fact) => ({ ...fact, start: sentence.toLowerCase().indexOf(String(fact.text || '').toLowerCase()) }))
    .filter((fact) => fact.start >= 0)
    .sort((a, b) => a.start - b.start || String(b.text || '').length - String(a.text || '').length);
}

export default function KeyFactHighlighter({
  sentence = '',
  facts = [],
  activeFactId = '',
  onFactSelect,
}) {
  const sorted = sortFactsForSentence(sentence, facts);
  if (!sorted.length) return <>{sentence}</>;

  const parts = [];
  let cursor = 0;
  sorted.forEach((fact) => {
    if (fact.start < cursor) return;
    if (fact.start > cursor) parts.push({ type: 'text', text: sentence.slice(cursor, fact.start) });
    const end = fact.start + String(fact.text || '').length;
    parts.push({ type: 'fact', text: sentence.slice(fact.start, end), fact });
    cursor = end;
  });
  if (cursor < sentence.length) parts.push({ type: 'text', text: sentence.slice(cursor) });

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') return <span key={`${part.text}-${index}`}>{part.text}</span>;
        const tone = FACT_TONES[part.fact.type] || 'border-emerald-border bg-emerald-tint text-emerald-deep';
        const active = activeFactId === part.fact.id;
        return (
          <button
            key={part.fact.id}
            type="button"
            onClick={() => onFactSelect?.(part.fact)}
            className={`mx-0.5 inline min-h-[32px] rounded-md border px-1.5 py-0.5 align-baseline text-left font-semibold ${tone} ${active ? 'ring-2 ring-emerald' : ''}`}
            aria-label={`${part.text}: ${String(part.fact.type || '').replace(/_/g, ' ')}`}
          >
            {part.text}
          </button>
        );
      })}
    </>
  );
}
