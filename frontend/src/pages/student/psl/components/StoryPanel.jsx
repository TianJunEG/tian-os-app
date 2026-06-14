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
      <p className="text-[15.5px] leading-[1.95] text-ink-700">{storyText}</p>
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
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#d9892e' }}>Tap the numbers you need:</p>
      <p className="text-[15.5px] leading-[1.95] text-ink-700">
        {parts.map((part, i) => {
          if (part.type === 'number') {
            const selected = highlightedNumbers.includes(part.num);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggleNumber?.(part.num)}
                className="mx-0.5 inline-block min-h-[44px] min-w-[44px] rounded-lg px-2 py-1 font-mono font-bold transition-colors"
                style={selected
                  ? { background: '#d9892e', color: '#fff', boxShadow: '0 2px 6px rgba(217,137,46,0.3)' }
                  : { background: 'rgba(255,255,255,0.6)', color: '#232c39', boxShadow: 'inset 0 0 0 1.5px #f0dcb8' }
                }
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
