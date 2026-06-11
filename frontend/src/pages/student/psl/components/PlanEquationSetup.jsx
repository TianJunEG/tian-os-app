import React from 'react';

export default function PlanEquationSetup({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const equations = expected.equations || [];
  const variables = expected.variables || [];

  const eliminateVar = response?.eliminateVar || '';

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Look at the two equations. Which quantity can you eliminate first?
      </p>

      {equations.length > 0 && (
        <div className="space-y-2 rounded-xl border border-ink-200 bg-ink-50 p-4">
          {equations.map((eq, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-ink-700">{eq}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink-600">
          Which variable should you eliminate?
        </p>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => {
            const active = eliminateVar === v;
            return (
              <button
                key={v}
                onClick={() => onChange({ eliminateVar: v })}
                className={`rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
