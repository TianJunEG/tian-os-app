import React from 'react';

export default function SolvePanel({ twoStep = false, value = {}, onChange }) {
  if (twoStep) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-ink-600">Solve step by step:</p>
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-3">
          <label className="text-xs font-medium text-ink-400">Working / Scratchpad</label>
          <textarea
            placeholder="Show your working here..."
            value={value.working || ''}
            onChange={(e) => onChange({ ...value, working: e.target.value })}
            rows={3}
            className="mt-1 w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm text-ink-700 outline-none focus:border-gold"
          />
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-ink-200 bg-white p-3">
            <label className="text-xs text-ink-400">Step 1: Number sentence</label>
            <input
              type="text"
              placeholder="e.g. 150 - 85"
              value={value.step1Expression || ''}
              onChange={(e) => onChange({ ...value, step1Expression: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2 font-mono text-sm text-ink-700 outline-none focus:border-gold"
            />
            <label className="mt-2 block text-xs text-ink-400">Step 1: Answer</label>
            <input
              type="number"
              placeholder="="
              value={value.step1Answer || ''}
              onChange={(e) => onChange({ ...value, step1Answer: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2 font-mono text-sm text-ink-700 outline-none focus:border-gold"
            />
          </div>
          <div className="rounded-xl border border-ink-200 bg-white p-3">
            <label className="text-xs text-ink-400">Step 2: Number sentence</label>
            <input
              type="text"
              placeholder="e.g. 65 + 150"
              value={value.step2Expression || ''}
              onChange={(e) => onChange({ ...value, step2Expression: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2 font-mono text-sm text-ink-700 outline-none focus:border-gold"
            />
            <label className="mt-2 block text-xs text-ink-400">Final Answer</label>
            <input
              type="number"
              placeholder="="
              value={value.answer || ''}
              onChange={(e) => onChange({ ...value, answer: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2 font-mono text-base sm:text-lg font-bold text-ink-800 outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-600">Write the number sentence and find the answer:</p>
      <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-3">
        <label className="text-xs font-medium text-ink-400">Working / Scratchpad</label>
        <textarea
          placeholder="Show your working here..."
          value={value.working || ''}
          onChange={(e) => onChange({ ...value, working: e.target.value })}
          rows={3}
          className="mt-1 w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm text-ink-700 outline-none focus:border-gold"
        />
      </div>
      <div className="rounded-xl border border-ink-200 bg-white p-3 sm:p-4">
        <label className="text-xs text-ink-400">Number sentence</label>
        <input
          type="text"
          placeholder="e.g. 120 + 85"
          value={value.expression || ''}
          onChange={(e) => onChange({ ...value, expression: e.target.value })}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2 font-mono text-sm text-ink-700 outline-none focus:border-gold"
        />
        <label className="mt-3 block text-xs text-ink-400">Answer</label>
        <input
          type="number"
          placeholder="="
          value={value.answer || ''}
          onChange={(e) => onChange({ ...value, answer: e.target.value })}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2 font-mono text-lg sm:text-xl font-bold text-ink-800 outline-none focus:border-gold"
        />
      </div>
    </div>
  );
}
