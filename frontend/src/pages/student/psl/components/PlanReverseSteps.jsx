import React from 'react';

const OPERATION_LABELS = {
  add: 'Add',
  subtract: 'Subtract',
  multiply: 'Multiply by',
  divide: 'Divide by',
};

export default function PlanReverseSteps({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const operations = expected.operations || [];
  const finalResult = expected.finalResult;

  const selected = response?.operations || [];

  const handleToggle = (op, idx) => {
    const key = `${op}-${idx}`;
    const current = [...selected];
    const i = current.indexOf(key);
    if (i >= 0) current.splice(i, 1);
    else current.push(key);
    onChange({ operations: current });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        The final result is <strong>{finalResult}</strong>.
        Which operations were applied? Tap each step in order.
      </p>

      <div className="space-y-2">
        {operations.map((op, idx) => {
          const key = `${op}-${idx}`;
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(op, idx)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
              }`}
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-500">
                {idx + 1}
              </span>
              <span>{op}</span>
              {isSelected && <span className="ml-auto text-emerald-500">&#10003;</span>}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-ink-400">
          Selected {selected.length} of {operations.length} steps. To solve, you'll reverse each one.
        </p>
      )}
    </div>
  );
}
