import React from 'react';

export default function SolveListCheck({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const conditions = expected.conditions || [];

  const candidates = response?.candidates || [''];
  const answer = response?.answer ?? '';

  const handleCandidateChange = (idx, val) => {
    const next = [...candidates];
    next[idx] = val;
    onChange({ candidates: next, answer });
  };

  const addCandidate = () => {
    onChange({ candidates: [...candidates, ''], answer });
  };

  const removeCandidate = (idx) => {
    if (candidates.length <= 1) return;
    const next = candidates.filter((_, i) => i !== idx);
    onChange({ candidates: next, answer });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        List the numbers that could be the answer, then check each condition.
      </p>

      {conditions.length > 0 && (
        <div className="rounded-lg bg-violet-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-500">
            Conditions to check
          </p>
          <ul className="list-inside list-disc text-sm text-violet-700">
            {conditions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {candidates.map((val, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-500">
              {idx + 1}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={val}
              onChange={(e) => handleCandidateChange(idx, e.target.value)}
              className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm"
              placeholder="Candidate number"
            />
            {candidates.length > 1 && (
              <button
                onClick={() => removeCandidate(idx)}
                className="text-ink-400 hover:text-red-500"
                aria-label="Remove"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addCandidate}
        className="rounded-lg border border-dashed border-ink-300 px-4 py-2 text-sm text-ink-500 hover:border-ink-400 hover:text-ink-600"
      >
        + Add candidate
      </button>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border-2 border-violet-200 bg-violet-50 p-3">
        <span className="text-sm font-semibold text-violet-700">Answer =</span>
        <input
          type="number"
          inputMode="decimal"
          value={answer}
          onChange={(e) => onChange({ candidates, answer: e.target.value })}
          className="w-full sm:w-28 min-h-[44px] rounded-lg border border-violet-300 px-3 py-2 text-sm font-bold text-violet-800"
          placeholder="?"
        />
      </div>
    </div>
  );
}
