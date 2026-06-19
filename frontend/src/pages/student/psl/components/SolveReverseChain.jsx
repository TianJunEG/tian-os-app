import React from 'react';

export default function SolveReverseChain({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const reverseSteps = expected.steps || [];
  const stepCount = reverseSteps.length;

  const values = response?.steps || [];
  const answer = response?.answer ?? '';

  const handleStepChange = (idx, val) => {
    const next = [...values];
    next[idx] = val;
    onChange({ steps: next, answer: idx === stepCount - 1 ? val : answer });
  };

  const handleAnswerChange = (val) => {
    onChange({ steps: values, answer: val });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Work backwards — reverse each operation to find the original number.
      </p>

      <div className="space-y-3">
        {reverseSteps.map((_, idx) => (
          <div key={idx} className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              {idx + 1}
            </span>
            <span className="text-sm text-ink-500">Step {idx + 1} result:</span>
            <input
              type="number"
              inputMode="decimal"
              value={values[idx] ?? ''}
              onChange={(e) => handleStepChange(idx, e.target.value)}
              className="w-full sm:w-28 min-h-[44px] rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold"
              placeholder="?"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border-2 border-gold-tint bg-gold-tint2 p-3">
        <span className="text-sm font-semibold text-gold-deep">Original number =</span>
        <input
          type="number"
          inputMode="decimal"
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="w-full sm:w-28 min-h-[44px] rounded-lg border border-gold-border px-3 py-2 text-sm font-bold text-gold-deep"
          placeholder="?"
        />
      </div>
    </div>
  );
}
