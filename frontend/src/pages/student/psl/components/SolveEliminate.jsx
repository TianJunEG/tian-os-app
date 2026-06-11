import React from 'react';

export default function SolveEliminate({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const steps = expected.steps || [];
  const variables = expected.variables || [];

  const answers = response?.answers || {};

  const handleChange = (varName, val) => {
    const next = { ...answers, [varName]: val };
    onChange({ answers: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Solve by elimination — subtract or substitute to find each variable.
      </p>

      {steps.length > 0 && (
        <div className="space-y-2 rounded-xl border border-ink-200 bg-ink-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Steps
          </p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-ink-600">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                {i + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {variables.map((v) => (
          <div key={v} className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
            <span className="text-sm font-semibold text-amber-700">{v} =</span>
            <input
              type="number"
              inputMode="decimal"
              value={answers[v] ?? ''}
              onChange={(e) => handleChange(v, e.target.value)}
              className="w-28 rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-amber-800"
              placeholder="?"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
