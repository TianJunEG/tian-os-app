import React from 'react';

// Interactive ratio "units" bar for the Plan step of classic ratio-share
// problems. The bar is split into ratioA : ratioB equal units; the student sets
// the value of one unit, and the bar live-computes each share and the total.
// This is the ratio analogue of the part-whole BarModelBuilder, and it captures
// the value-per-unit decomposition that the ratio hints target.
export default function PlanRatioBar({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const ratioA = Number(expected.ratioA) || 0;
  const ratioB = Number(expected.ratioB) || 0;
  const labelA = expected.labelA || 'A';
  const labelB = expected.labelB || 'B';
  const totalParts = ratioA + ratioB;

  const raw = response?.ratioBar?.valuePerPart ?? '';
  const vppNum = Number(raw);
  const hasValue = raw !== '' && Number.isFinite(vppNum);

  // Keep the answer readable whether it's a whole number or a fraction.
  const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

  const setValuePerPart = (next) => {
    const n = Number(next);
    const valid = next !== '' && Number.isFinite(n);
    onChange({
      ratioBar: {
        ratioA,
        ratioB,
        valuePerPart: next,
        valueA: valid ? ratioA * n : undefined,
        valueB: valid ? ratioB * n : undefined,
        total: valid ? totalParts * n : undefined,
      },
    });
  };

  const renderUnits = (count, kind) =>
    Array.from({ length: count }, (_, i) => (
      <div
        key={`${kind}-${i}`}
        className={`flex h-9 flex-1 items-center justify-center rounded-md text-xs font-bold ${
          kind === 'a' ? 'bg-gold-tint text-gold-deep' : 'bg-sky-100 text-sky-700'
        }`}
      >
        {hasValue ? fmt(vppNum) : '?'}
      </div>
    ));

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        The bar is split into {totalParts} equal units ({ratioA} for {labelA}, {ratioB} for {labelB}).
        What is the value of <strong>one unit</strong>?
      </p>

      <div className="space-y-2 rounded-xl border border-line-soft bg-white p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 truncate text-xs font-semibold text-gold-deep">{labelA}</span>
          <div className="flex flex-1 gap-1">{renderUnits(ratioA, 'a')}</div>
          <span className="w-16 shrink-0 text-right text-sm font-bold text-ink-700">{hasValue ? fmt(ratioA * vppNum) : '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 truncate text-xs font-semibold text-sky-700">{labelB}</span>
          <div className="flex flex-1 gap-1">{renderUnits(ratioB, 'b')}</div>
          <span className="w-16 shrink-0 text-right text-sm font-bold text-ink-700">{hasValue ? fmt(ratioB * vppNum) : '—'}</span>
        </div>
        {hasValue && (
          <div className="flex items-center justify-between border-t border-line-soft pt-2 text-xs font-semibold text-ink-500">
            <span>Total ({totalParts} units)</span>
            <span className="text-ink-700">{fmt(totalParts * vppNum)}</span>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-600">
        <span className="font-medium">Value of one unit:</span>
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          onChange={(e) => setValuePerPart(e.target.value)}
          placeholder="?"
          className="w-28 rounded-lg border border-ink-200 px-3 py-1.5 text-sm focus:border-emerald-bright focus:outline-none focus:ring-1 focus:ring-emerald-bright"
        />
      </label>
    </div>
  );
}
