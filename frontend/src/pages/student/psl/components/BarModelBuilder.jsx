import React, { useState } from 'react';

export default function BarModelBuilder({ modelType = 'partWhole', unknownPosition = 'whole', values = {}, onChange }) {
  const [parts, setParts] = useState(values.parts || [{ label: '', value: '' }, { label: '', value: '' }]);

  const updatePart = (idx, field, val) => {
    const next = parts.map((p, i) => (i === idx ? { ...p, [field]: val } : p));
    setParts(next);
    onChange?.({ modelType, unknownPosition, parts: next });
  };

  if (modelType === 'comparison') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-medium text-ink-500">Comparison bar model</p>
        <div className="space-y-2">
          <div className="flex items-stretch gap-2">
            <div className="flex-1 rounded-xl border-2 border-gold-300 bg-gold-50/50 p-3">
              <input
                type="text"
                placeholder="Larger"
                value={parts[0]?.label || ''}
                onChange={(e) => updatePart(0, 'label', e.target.value)}
                className="w-full border-none bg-transparent text-sm font-medium text-ink-700 outline-none placeholder:text-ink-300"
              />
              <input
                type="number"
                placeholder={unknownPosition === 'larger' ? '?' : 'value'}
                value={parts[0]?.value || ''}
                onChange={(e) => updatePart(0, 'value', e.target.value)}
                className="mt-1 w-full border-none bg-transparent font-mono text-base sm:text-lg font-bold text-ink-800 outline-none placeholder:text-ink-300"
              />
            </div>
          </div>
          <div className="flex items-stretch gap-2">
            <div className="flex-1 rounded-xl border-2 border-ink-200 bg-white p-3" style={{ maxWidth: '70%' }}>
              <input
                type="text"
                placeholder="Smaller"
                value={parts[1]?.label || ''}
                onChange={(e) => updatePart(1, 'label', e.target.value)}
                className="w-full border-none bg-transparent text-sm font-medium text-ink-700 outline-none placeholder:text-ink-300"
              />
              <input
                type="number"
                placeholder={unknownPosition === 'smaller' ? '?' : 'value'}
                value={parts[1]?.value || ''}
                onChange={(e) => updatePart(1, 'value', e.target.value)}
                className="mt-1 w-full border-none bg-transparent font-mono text-base sm:text-lg font-bold text-ink-800 outline-none placeholder:text-ink-300"
              />
            </div>
            <div className="flex items-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 px-2 sm:px-3">
              <span className="font-mono text-base sm:text-lg font-bold text-amber-600">
                {unknownPosition === 'difference' ? '?' : parts[0]?.value && parts[1]?.value ? Math.abs(Number(parts[0].value) - Number(parts[1].value)) : '?'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-ink-500">Part-whole bar model</p>
      <div className="space-y-2">
        <div className="rounded-xl border-2 border-gold-300 bg-gold-50/50 p-3 text-center">
          <span className="text-xs text-ink-400">Whole</span>
          <div className="font-mono text-base sm:text-lg font-bold text-ink-800">
            {unknownPosition === 'whole' ? '?' : (parts.reduce((s, p) => s + (Number(p.value) || 0), 0) || '?')}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {parts.map((part, i) => (
            <div key={i} className="flex-1 rounded-xl border-2 border-ink-200 bg-white p-2 sm:p-3">
              <input
                type="text"
                placeholder={`Part ${i + 1}`}
                value={part.label}
                onChange={(e) => updatePart(i, 'label', e.target.value)}
                className="w-full border-none bg-transparent text-sm font-medium text-ink-700 outline-none placeholder:text-ink-300"
              />
              <input
                type="number"
                placeholder={unknownPosition === 'part' && i === parts.length - 1 ? '?' : 'value'}
                value={part.value}
                onChange={(e) => updatePart(i, 'value', e.target.value)}
                className="mt-1 w-full border-none bg-transparent font-mono text-base sm:text-lg font-bold text-ink-800 outline-none placeholder:text-ink-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
