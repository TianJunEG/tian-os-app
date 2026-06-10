import React from 'react';

export default function BarModelViewer({ modelType = 'partWhole', unknownPosition = 'whole', values = {} }) {
  if (modelType === 'comparison') {
    const larger = values.larger ?? values.partA ?? '?';
    const smaller = values.smaller ?? values.partB ?? '?';
    const difference = values.difference ?? values.answer ?? '?';
    const largerWidth = 100;
    const smallerWidth = larger && smaller ? Math.round((Number(smaller) / Number(larger)) * 100) : 65;

    return (
      <div className="space-y-2 rounded-xl border border-ink-200 bg-paper p-4">
        <p className="text-xs font-medium text-ink-400">Comparison Model</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg bg-gold-100 px-3 py-2 text-sm font-bold text-gold-700"
              style={{ width: `${largerWidth}%`, minHeight: 36 }}
            >
              {unknownPosition === 'larger' ? '?' : larger}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg bg-sky-100 px-3 py-2 text-sm font-bold text-sky-700"
              style={{ width: `${smallerWidth}%`, minHeight: 36 }}
            >
              {unknownPosition === 'smaller' ? '?' : smaller}
            </div>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 px-2 py-2 text-sm font-bold text-amber-600"
              style={{ minHeight: 36 }}
            >
              {unknownPosition === 'difference' ? '?' : difference}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Part-Whole
  const parts = [];
  if (values.partA !== undefined) parts.push(values.partA);
  if (values.partB !== undefined) parts.push(values.partB);
  if (values.partC !== undefined) parts.push(values.partC);
  const whole = values.whole ?? values.answer ?? (parts.length ? parts.reduce((a, b) => a + b, 0) : '?');

  return (
    <div className="space-y-2 rounded-xl border border-ink-200 bg-paper p-4">
      <p className="text-xs font-medium text-ink-400">Part-Whole Model</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-center rounded-lg bg-gold-100 px-3 py-2 text-sm font-bold text-gold-700" style={{ minHeight: 36 }}>
          {unknownPosition === 'whole' ? '?' : whole}
        </div>
        <div className="flex gap-1">
          {parts.map((p, i) => (
            <div key={i} className="flex flex-1 items-center justify-center rounded-lg bg-sky-100 px-2 py-2 text-sm font-bold text-sky-700" style={{ minHeight: 36 }}>
              {unknownPosition === 'part' && i === parts.length - 1 ? '?' : p}
            </div>
          ))}
          {parts.length === 0 && (
            <>
              <div className="flex flex-1 items-center justify-center rounded-lg bg-sky-100 px-2 py-2 text-sm font-bold text-sky-700" style={{ minHeight: 36 }}>?</div>
              <div className="flex flex-1 items-center justify-center rounded-lg bg-sky-100 px-2 py-2 text-sm font-bold text-sky-700" style={{ minHeight: 36 }}>?</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
