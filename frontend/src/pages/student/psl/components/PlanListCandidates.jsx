import React from 'react';

export default function PlanListCandidates({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const conditions = expected.conditions || [];

  const selected = response?.conditions || [];
  const range = response?.range || '';

  const toggleCondition = (idx) => {
    const next = selected.includes(idx)
      ? selected.filter((i) => i !== idx)
      : [...selected, idx];
    onChange({ conditions: next, range });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Identify the conditions and the range of numbers to check.
      </p>

      <div className="space-y-2">
        {conditions.map((c, idx) => {
          const active = selected.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => toggleCondition(idx)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                active
                  ? 'border-violet-400 bg-purple-tint text-purple'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
              }`}
            >
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                  active ? 'bg-violet-200 text-purple' : 'bg-ink-100 text-ink-400'
                }`}
              >
                {idx + 1}
              </span>
              {c}
            </button>
          );
        })}
      </div>

      {expected.showRange && (
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600">
            Range of numbers to check:
          </label>
          <input
            type="text"
            value={range}
            onChange={(e) => onChange({ conditions: selected, range: e.target.value })}
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            placeholder="e.g. 10 to 50"
          />
        </div>
      )}
    </div>
  );
}
