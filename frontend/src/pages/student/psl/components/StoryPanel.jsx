import React from 'react';

const NUMBER_RE = /(\$?\d+(?:[./]\d+)?)/g;

function extractTappableNumbers(text) {
  const matches = [];
  let m;
  while ((m = NUMBER_RE.exec(text)) !== null) {
    const raw = m[1];
    const cleaned = raw.replace(/^\$/, '');
    if (cleaned.includes('/')) continue;
    const num = Number(cleaned);
    if (!isNaN(num)) matches.push({ start: m.index, end: m.index + raw.length, raw, num });
  }
  return matches;
}

export default function StoryPanel({ storyText = '', highlightMode = false, highlightedNumbers = [], onToggleNumber }) {
  if (!highlightMode) {
    return (
      <div className="rounded-2xl border border-gold-200/60 bg-gold-50/40 p-4 sm:p-5">
        <p className="text-base leading-relaxed text-ink-700">{storyText}</p>
      </div>
    );
  }

  const tappable = extractTappableNumbers(storyText);
  const parts = [];
  let cursor = 0;
  for (const t of tappable) {
    if (t.start > cursor) parts.push({ type: 'text', value: storyText.slice(cursor, t.start) });
    parts.push({ type: 'number', value: t.raw, num: t.num });
    cursor = t.end;
  }
  if (cursor < storyText.length) parts.push({ type: 'text', value: storyText.slice(cursor) });

  return (
    <div className="rounded-2xl border border-gold-200/60 bg-gold-50/40 p-4 sm:p-5">
      <p className="text-sm font-medium text-gold-600 mb-2">Tap the numbers you need:</p>
      <p className="text-base leading-relaxed text-ink-700">
        {parts.map((part, i) => {
          if (part.type === 'number') {
            const selected = highlightedNumbers.includes(part.num);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggleNumber?.(part.num)}
                className={`mx-0.5 inline-block min-h-[44px] min-w-[44px] rounded-lg px-2 py-1 font-mono font-bold transition-colors ${
                  selected
                    ? 'bg-gold-400 text-white shadow-sm'
                    : 'bg-white/60 text-ink-700 ring-1 ring-gold-300 hover:bg-gold-100 animate-pulse-subtle'
                }`}
              >
                {part.value}
              </button>
            );
          }
          return <span key={i}>{part.value}</span>;
        })}
      </p>
    </div>
  );
}
