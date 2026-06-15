import React, { useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const SYMBOL_ROWS = [
  [
    { label: '+', value: ' + ' },
    { label: '−', value: ' − ' },
    { label: '×', value: ' × ' },
    { label: '÷', value: ' ÷' },
    { label: '=', value: ' = ' },
    { label: '>', value: ' > ' },
    { label: '<', value: ' < ' },
    { label: '²', value: '²' },
    { label: '³', value: '³' },
  ],
  [
    { label: '∠', value: '∠' },
    { label: '°', value: '°' },
    { label: '¢', value: '¢' },
    { label: '△', value: '△' },
    { label: '½', value: '½' },
    { label: '¼', value: '¼' },
    { label: '¾', value: '¾' },
    { label: '≠', value: ' ≠ ' },
    { label: '≤', value: ' ≤ ' },
  ],
];

export default function MathStepsEditor({ steps = [], onChange, readOnly = false }) {
  const textareaRefs = useRef({});

  const updateStep = (index, value) => {
    const next = steps.map((s, i) => (i === index ? { ...s, text: value } : s));
    onChange?.(next);
  };

  const addStep = () => {
    onChange?.([...steps, { id: `step-${Date.now()}`, text: '' }]);
  };

  const removeStep = (index) => {
    onChange?.(steps.filter((_, i) => i !== index));
  };

  const insertSymbol = (index, symbol) => {
    const textarea = textareaRefs.current[index];
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const before = steps[index]?.text || '';
    const next = before.slice(0, start) + symbol + before.slice(end);
    updateStep(index, next);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + symbol.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const activeIndex = steps.length > 0 ? steps.length - 1 : -1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" aria-label="Math symbols">
        {SYMBOL_ROWS.map((row, ri) => (
          <div key={ri} className="flex flex-wrap gap-1">
            {row.map((sym) => (
              <button
                key={sym.label}
                type="button"
                disabled={readOnly || activeIndex < 0}
                onClick={() => insertSymbol(activeIndex, sym.value)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-orange-200 bg-white text-lg font-semibold text-orange-600 transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                title={sym.label}
              >
                {sym.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="group relative">
            <div className="flex items-start gap-2">
              <span className="mt-2.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-tint text-xs font-bold text-emerald">
                {index + 1}
              </span>
              <textarea
                ref={(el) => { textareaRefs.current[index] = el; }}
                value={step.text}
                onChange={(e) => updateStep(index, e.target.value)}
                readOnly={readOnly}
                placeholder="Type your working here..."
                rows={2}
                className="min-h-[56px] w-full resize-y rounded-xl border-2 border-line bg-white px-3 py-2 font-mono text-base text-ink-900 placeholder:text-ink-300 focus:border-orange-400 focus:outline-none"
              />
              {!readOnly && steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="mt-2 shrink-0 rounded-lg p-1.5 text-ink-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  aria-label="Remove step"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-2 self-start rounded-xl border-2 border-dashed border-line-strong px-4 py-2 text-sm font-semibold text-ink-500 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
        >
          <Plus className="h-4 w-4" />
          Add Step
        </button>
      )}
    </div>
  );
}
