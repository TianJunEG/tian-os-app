import React from 'react';

const MODEL_TYPES = [
  { key: 'partWhole', label: 'Part-Whole', desc: 'Parts make up a whole' },
  { key: 'comparison', label: 'Comparison', desc: 'Compare two quantities' },
];

const UNKNOWN_POSITIONS = {
  partWhole: [
    { key: 'whole', label: 'Find the whole (total)' },
    { key: 'part', label: 'Find a missing part' },
  ],
  comparison: [
    { key: 'difference', label: 'Find the difference' },
    { key: 'larger', label: 'Find the larger' },
    { key: 'smaller', label: 'Find the smaller' },
  ],
};

export default function ModelSelector({ modelType, unknownPosition, onSelectModel, onSelectPosition }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink-600">Which type of bar model fits this problem?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {MODEL_TYPES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelectModel(m.key)}
              className={`min-h-[44px] rounded-xl border p-4 text-left transition-colors ${
                modelType === m.key
                  ? 'border-gold-400 bg-gold-50 shadow-sm'
                  : 'border-ink-200 bg-white hover:border-gold-300'
              }`}
            >
              <span className={`block text-sm font-semibold ${modelType === m.key ? 'text-gold-700' : 'text-ink-700'}`}>
                {m.label}
              </span>
              <span className="mt-1 block text-xs text-ink-400">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {modelType && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-600">What are we looking for?</p>
          <div className="grid gap-2">
            {(UNKNOWN_POSITIONS[modelType] || []).map((pos) => (
              <button
                key={pos.key}
                type="button"
                onClick={() => onSelectPosition(pos.key)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  unknownPosition === pos.key
                    ? 'border-gold-400 bg-gold-50 font-semibold text-gold-700'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-gold-300'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
