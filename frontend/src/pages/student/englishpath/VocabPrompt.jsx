import React from 'react';

// Renders a task prompt's light markup: **bold** (the target word), __underline__
// (the word being defined in a cloze), ____ (a fill-in-the-blank slot) and line
// breaks. Everything else is plain text.
const TOKEN = /(\*\*[^*]+\*\*|__[^_]+__|_{4,})/g;

function renderInline(line) {
  return line
    .split(TOKEN)
    .filter((s) => s !== '')
    .map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return (
          <strong key={i} className="font-semibold text-emerald-deep">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (/^__[^_]+__$/.test(part)) {
        return (
          <u key={i} className="underline decoration-gold-deep decoration-2 underline-offset-4">
            {part.slice(2, -2)}
          </u>
        );
      }
      if (/^_{4,}$/.test(part)) {
        return (
          <span
            key={i}
            className="mx-1 inline-block min-w-[3.5rem] border-b-2 border-ink-300 align-middle"
            aria-label="blank"
          >
            &nbsp;
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
}

export default function VocabPrompt({ text, className = '' }) {
  const lines = String(text || '').split('\n');
  return (
    <div className={className}>
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i} className="leading-relaxed">
            {renderInline(line)}
          </p>
        )
      )}
    </div>
  );
}
