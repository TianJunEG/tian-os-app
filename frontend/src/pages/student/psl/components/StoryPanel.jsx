import React from 'react';

export default function StoryPanel({ storyText = '', highlightMode = false, highlightedNumbers = [], onToggleNumber }) {
  if (!highlightMode) {
    return (
      <div className="rounded-2xl border border-gold-200/60 bg-gold-50/40 p-4 sm:p-5">
        <p className="text-base leading-relaxed text-ink-700">{storyText}</p>
      </div>
    );
  }

  const numbers = storyText.match(/\d+/g) || [];
  const parts = storyText.split(/(\d+)/g);

  return (
    <div className="rounded-2xl border border-gold-200/60 bg-gold-50/40 p-4 sm:p-5">
      <p className="text-base leading-relaxed text-ink-700">
        {parts.map((part, i) => {
          const num = Number(part);
          if (!isNaN(num) && numbers.includes(part)) {
            const selected = highlightedNumbers.includes(num);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggleNumber?.(num)}
                className={`mx-0.5 inline-block rounded-lg px-2 py-0.5 font-mono font-bold transition-colors ${
                  selected
                    ? 'bg-gold-400 text-white shadow-sm'
                    : 'bg-white/60 text-ink-700 ring-1 ring-gold-300 hover:bg-gold-100'
                }`}
              >
                {part}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    </div>
  );
}
