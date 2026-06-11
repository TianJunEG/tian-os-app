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
          <div key={idx} className="flex items-center gap-3">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              {idx + 1}
            </span>
            <span className="text-sm text-ink-500">Step {idx + 1} result:</span>
            <input
              type="number"
              inputMode="decimal"
              value={values[idx] ?? ''}
              onChange={(e) => handleStepChange(idx, e.target.value)}
              className="w-28 rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold"
              placeholder="?"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-xl border-2 border-gold-200 bg-gold-50 p-3">
        <span className="text-sm font-semibold text-gold-700">Original number =</span>
        <input
          type="number"
          inputMode="decimal"
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="w-28 rounded-lg border border-gold-300 px-3 py-2 text-sm font-bold text-gold-800"
          placeholder="?"
        />
      </div>
    </div>
  );
}
