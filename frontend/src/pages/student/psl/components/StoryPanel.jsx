import React from 'react';

// Match (in priority order) fractions, ratios, money, percentages, decimals, and plain integers
// as SINGLE tappable tokens. Each token keeps its raw text so it stays a single button.
const TOKEN_RE = /(\d+\s*\/\s*\d+|\d+\s*:\s*\d+|\$\d+(?:\.\d+)?|\d+(?:\.\d+)?%|\d+(?:\.\d+)?)/g;

// Canonicalise a token to a stable comparison key (collapse internal whitespace).
export function canonicalizeToken(raw) {
  return String(raw).replace(/\s+/g, '');
}

function extractTappableNumbers(text) {
  const matches = [];
  let m;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    const raw = m[0];
    matches.push({ start: m.index, end: m.index + raw.length, raw, key: canonicalizeToken(raw) });
  }
  return matches;
}

export default function StoryPanel({ storyText = '', highlightMode = false, highlightedNumbers = [], onToggleNumber }) {
  if (!highlightMode) {
    return (
      <p className="text-[15.5px] leading-[1.95] text-ink-700">{storyText}</p>
    );
  }

  const tappable = extractTappableNumbers(storyText);
  const parts = [];
  let cursor = 0;
  for (const t of tappable) {
    if (t.start > cursor) parts.push({ type: 'text', value: storyText.slice(cursor, t.start) });
    parts.push({ type: 'number', value: t.raw, key: t.key });
    cursor = t.end;
  }
  if (cursor < storyText.length) parts.push({ type: 'text', value: storyText.slice(cursor) });

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">Tap the numbers you need:</p>
      <p className="text-[15.5px] leading-[1.95] text-ink-700">
        {parts.map((part, i) => {
          if (part.type === 'number') {
            const selected = highlightedNumbers.includes(part.key);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggleNumber?.(part.key)}
                className={`mx-0.5 inline-block min-h-[44px] min-w-[44px] rounded-lg px-2 py-1 font-mono font-bold transition-colors ${
                  selected
                    ? 'bg-gold text-white shadow-gold'
                    : 'bg-surface-white/60 text-ink ring-[1.5px] ring-inset ring-gold-border'
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
