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

const notebookStyle = {
  border: '1px solid #e7eaef',
  borderRadius: 14,
  padding: '22px 24px 26px',
  position: 'relative',
  minHeight: '40vh',
  backgroundImage: 'repeating-linear-gradient(#ffffff 0, #ffffff 31px, #eef1f4 31px, #eef1f4 32px)',
};

const marginLineStyle = {
  position: 'absolute', left: 48, top: 0, bottom: 0,
  width: 1, background: '#f3cfd0',
};

export default function StoryPanel({ storyText = '', highlightMode = false, highlightedNumbers = [], onToggleNumber, children }) {
  if (children) {
    return (
      <div style={notebookStyle}>
        <div style={marginLineStyle} />
        {children}
      </div>
    );
  }

  if (!highlightMode) {
    return (
      <div style={notebookStyle}>
        <div style={marginLineStyle} />
        <div style={{ fontSize: 22, fontWeight: 500, color: '#232c39', lineHeight: 1.5, position: 'relative' }}>
          {storyText}
        </div>
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
    <div style={notebookStyle}>
      <div style={marginLineStyle} />
      <div style={{ fontSize: 14, fontWeight: 600, color: '#a8743a', marginBottom: 14, position: 'relative' }}>
        Tap the numbers that matter.
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: '#232c39', lineHeight: 1.7, position: 'relative' }}>
        {parts.map((part, i) => {
          if (part.type === 'number') {
            const selected = highlightedNumbers.includes(part.num);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggleNumber?.(part.num)}
                style={{
                  display: 'inline-block', border: selected ? '2px solid #d9892e' : '1.5px dashed #c4ccd6',
                  background: selected ? '#fbf1e1' : '#fff',
                  borderRadius: 9, padding: '0 10px', fontWeight: 700,
                  color: selected ? '#b06f1f' : '#232c39',
                  cursor: 'pointer', fontSize: 'inherit', lineHeight: 'inherit',
                  fontFamily: 'inherit', transition: 'all .15s ease',
                }}
              >
                {part.value}
              </button>
            );
          }
          return <span key={i}>{part.value}</span>;
        })}
      </div>
    </div>
  );
}
