import React from 'react';

export default function PlanGuessSetup({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const constraints = expected.constraints || [];

  const selected = response?.constraints || [];

  const toggleConstraint = (idx) => {
    const next = selected.includes(idx)
      ? selected.filter((i) => i !== idx)
      : [...selected, idx];
    onChange({ constraints: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Identify the conditions your guess must satisfy.
      </p>

      <div className="space-y-2">
        {constraints.map((c, idx) => {
          const active = selected.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => toggleConstraint(idx)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                active
                  ? 'border-coral-400 bg-coral-50 text-coral-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
              }`}
            >
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                  active ? 'bg-coral-200 text-coral-700' : 'bg-ink-100 text-ink-400'
                }`}
              >
                {idx + 1}
              </span>
              {c}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ink-400">
        Select the conditions you need to check for each guess.
      </p>
    </div>
  );
}
