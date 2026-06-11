import React from 'react';

export default function PlanStrategySelect({ scaffoldStep, response, onChange }) {
  const choices = scaffoldStep?.choices || [];
  const prompt = scaffoldStep?.prompt || 'What strategy should we use?';
  const selected = response?.selectedIndex;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-700">{prompt}</p>
      <div className="space-y-2">
        {choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange({ selectedIndex: i })}
            className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
              selected === i
                ? 'border-teal-400 bg-teal-50 text-teal-800'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
