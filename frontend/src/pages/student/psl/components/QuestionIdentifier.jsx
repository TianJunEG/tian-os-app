import React from 'react';

const DEFAULT_CHOICES = [
  'Find the total / whole',
  'Find a missing part',
  'Find the difference',
  'Find how many are left',
];

export default function QuestionIdentifier({ choices = DEFAULT_CHOICES, selectedIndex, onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-600">What does this problem ask you to find?</p>
      <div className="grid grid-cols-2 gap-2">
        {choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`rounded-xl border px-3 py-3 text-center text-sm transition-colors ${
              selectedIndex === i
                ? 'border-gold-400 bg-gold-50 font-semibold text-gold-700'
                : 'border-ink-200 bg-white text-ink-600 hover:border-gold-300 hover:bg-gold-50/30'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
