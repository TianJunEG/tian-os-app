import React from 'react';
import { Card } from '../../ui';

const OPTIONS = [
  { value: 1, label: 'Very hard' },
  { value: 2, label: 'Hard' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Very easy' },
];

export default function DifficultyRating({ value = 3, onChange, disabled = false }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-800">How difficult was this session?</p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            disabled={disabled}
            onClick={() => onChange?.(option.value)}
            className={`min-h-[44px] rounded-xl border text-sm font-semibold ${
              value === option.value
                ? 'border-navy-500 bg-navy-50 text-navy-700'
                : 'border-hairline bg-paper text-ink-600 hover:bg-slate-50'
            }`}
          >
            {option.value}
          </button>
        ))}
      </div>
    </Card>
  );
}
