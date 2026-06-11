import React from 'react';

function BarModelVisual({ spec }) {
  if (spec.modelType === 'comparison') {
    const larger = spec.values?.larger ?? spec.values?.partA ?? '?';
    const smaller = spec.values?.smaller ?? spec.values?.partB ?? '?';
    const difference = spec.values?.difference ?? spec.values?.answer ?? '?';
    const pct = larger && smaller ? Math.round((Number(smaller) / Number(larger)) * 100) : 65;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-gold-100 px-3 py-2 text-sm font-bold text-gold-700"
            style={{ width: '100%', minHeight: 32 }}>
            {spec.unknownPosition === 'larger' ? '?' : larger}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center rounded-lg bg-sky-100 px-3 py-2 text-sm font-bold text-sky-700"
            style={{ width: `${pct}%`, minHeight: 32 }}>
            {spec.unknownPosition === 'smaller' ? '?' : smaller}
          </div>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 px-2 py-2 text-xs font-bold text-amber-600"
            style={{ minHeight: 32 }}>
            {spec.unknownPosition === 'difference' ? '?' : difference}
          </div>
        </div>
      </div>
    );
  }

  const parts = [];
  if (spec.values?.partA !== undefined) parts.push(spec.values.partA);
  if (spec.values?.partB !== undefined) parts.push(spec.values.partB);
  if (spec.values?.partC !== undefined) parts.push(spec.values.partC);
  const whole = spec.values?.whole ?? spec.values?.answer ?? (parts.length ? parts.reduce((a, b) => a + b, 0) : '?');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-center rounded-lg bg-gold-100 px-3 py-2 text-sm font-bold text-gold-700" style={{ minHeight: 32 }}>
        {spec.unknownPosition === 'whole' ? '?' : whole}
      </div>
      <div className="flex gap-1">
        {parts.map((p, i) => (
          <div key={i} className="flex flex-1 items-center justify-center rounded-lg bg-sky-100 px-2 py-2 text-sm font-bold text-sky-700" style={{ minHeight: 32 }}>
            {spec.unknownPosition === 'part' && i === parts.length - 1 ? '?' : p}
          </div>
        ))}
        {parts.length === 0 && (
          <>
            <div className="flex flex-1 items-center justify-center rounded-lg bg-sky-100 px-2 py-2 text-sm font-bold text-sky-700" style={{ minHeight: 32 }}>?</div>
            <div className="flex flex-1 items-center justify-center rounded-lg bg-sky-100 px-2 py-2 text-sm font-bold text-sky-700" style={{ minHeight: 32 }}>?</div>
          </>
        )}
      </div>
    </div>
  );
}

function BeforeAfterVisual({ spec, step }) {
  const opLabel = spec.operation === 'subtraction' ? `− ${spec.change}` : `+ ${spec.change}`;
  const showAnswer = step >= 3;
  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 rounded-lg bg-sky-100 px-2 py-2 text-center">
        <p className="text-[10px] font-medium text-sky-500">Before</p>
        <p className="text-sm font-bold text-sky-700">{spec.start}</p>
      </div>
      <div className="flex flex-col items-center px-1">
        <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">{opLabel}</div>
        <svg className="h-2 w-6 text-ink-300" viewBox="0 0 24 8"><path d="M0 4h20m-4-3l4 3-4 3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </div>
      <div className={`flex-1 rounded-lg px-2 py-2 text-center ${showAnswer ? 'bg-emerald-100' : 'bg-ink-100'}`}>
        <p className={`text-[10px] font-medium ${showAnswer ? 'text-emerald-500' : 'text-ink-400'}`}>After</p>
        <p className={`text-sm font-bold ${showAnswer ? 'text-emerald-700' : 'text-ink-400'}`}>{showAnswer ? spec.answer : '?'}</p>
      </div>
    </div>
  );
}

function RatioBarVisual({ spec, step }) {
  const total = spec.ratioA + spec.ratioB;
  const showPerPart = step >= 2;
  const showTotals = step >= 3;
  return (
    <div className="space-y-2">
      <div className="text-center text-xs text-ink-500">
        Total: <span className="font-semibold text-ink-700">{spec.totalValue}</span> {spec.totalLabel || ''}
      </div>
      <div className="flex gap-0.5 rounded-lg overflow-hidden border border-ink-200">
        {Array.from({ length: total }, (_, i) => {
          const isA = i < spec.ratioA;
          return (
            <div
              key={i}
              className={`flex-1 py-2 text-center text-[10px] font-bold ${
                isA ? 'bg-gold-100 text-gold-700' : 'bg-sky-100 text-sky-700'
              }`}
              style={{ minHeight: 28 }}
            >
              {showPerPart ? spec.valuePerPart : '?'}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="font-semibold text-gold-600">
          {spec.labelA}: {spec.ratioA} parts{showTotals ? ` = ${spec.valueA}` : ''}
        </span>
        <span className="font-semibold text-sky-600">
          {spec.labelB}: {spec.ratioB} parts{showTotals ? ` = ${spec.valueB}` : ''}
        </span>
      </div>
    </div>
  );
}

function WorkBackwardsVisual({ spec, step }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {spec.steps.map((s, i) => {
        const isEnd = i === spec.steps.length - 1;
        const isStart = i === 0;
        const showValue = isEnd || (step >= spec.steps.length - 1 - i && !isStart) || (isStart && step >= spec.steps.length - 1);
        return (
          <React.Fragment key={i}>
            <div className={`shrink-0 rounded-lg px-2 py-1.5 text-center ${isEnd ? 'bg-emerald-100' : 'bg-sky-100'}`}>
              <p className={`text-[10px] ${isEnd ? 'text-emerald-500' : 'text-sky-500'}`}>{s.label}</p>
              <p className={`text-sm font-bold ${isEnd ? 'text-emerald-700' : 'text-sky-700'}`}>
                {showValue ? s.value : '?'}
              </p>
            </div>
            {i < spec.steps.length - 1 && (
              <div className="flex flex-col items-center shrink-0 px-0.5">
                <div className="text-[9px] font-semibold text-amber-600 bg-amber-50 rounded px-1 py-0.5">{spec.steps[i + 1].op}</div>
                <svg className="h-2 w-5 text-ink-300" viewBox="0 0 20 8"><path d="M0 4h16m-3-3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function GuessCheckVisual({ spec, step }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 text-xs">
      <table className="w-full">
        <thead>
          <tr className="bg-ink-50 text-ink-500">
            <th className="px-2 py-1.5 text-left font-medium">{spec.labelA}</th>
            <th className="px-2 py-1.5 text-left font-medium">{spec.labelB}</th>
            <th className="px-2 py-1.5 text-left font-medium">Check</th>
          </tr>
        </thead>
        <tbody>
          {step < 1 && (
            <tr><td colSpan="3" className="px-2 py-2 text-center text-ink-400">Try values...</td></tr>
          )}
          {spec.rows.map((row, i) => {
            if (i === 0 && step < 1) return null;
            if (i > 0 && step < 2) return null;
            return (
              <tr key={i} className={row.correct ? 'bg-emerald-50' : ''}>
                <td className="px-2 py-1 font-mono">{row.a}</td>
                <td className="px-2 py-1 font-mono">{row.b}</td>
                <td className="px-2 py-1">
                  {row.correct
                    ? <span className="font-semibold text-emerald-600">✓</span>
                    : <span className="text-ink-400">{row.check}</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExcessShortageVisual({ spec, step }) {
  const showDiff = step >= 2;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-16 text-right text-[10px] text-ink-500">Give {spec.giveA} each</div>
        <div className="flex-1 rounded-lg bg-amber-100 px-3 py-1.5 text-center">
          <span className="text-xs font-semibold text-amber-700">{spec.excess} left over</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 text-right text-[10px] text-ink-500">Give {spec.giveB} each</div>
        <div className="flex-1 rounded-lg bg-red-100 px-3 py-1.5 text-center">
          <span className="text-xs font-semibold text-red-700">{spec.shortage} short</span>
        </div>
      </div>
      {showDiff && (
        <div className="flex items-center gap-2 transition-all duration-300">
          <div className="w-16 text-right text-[10px] text-ink-500">Difference</div>
          <div className="flex-1 rounded-lg bg-sky-100 px-3 py-1.5 text-center">
            <span className="text-xs font-semibold text-sky-700">{spec.excess} + {spec.shortage} = {spec.excess + spec.shortage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SolutionVisual({ visualSpec, revealedSteps }) {
  if (!visualSpec) return null;
  const step = revealedSteps || 0;

  const RENDERERS = {
    barModel: BarModelVisual,
    beforeAfter: BeforeAfterVisual,
    ratioBar: RatioBarVisual,
    workBackwards: WorkBackwardsVisual,
    guessCheck: GuessCheckVisual,
    excessShortage: ExcessShortageVisual,
  };

  const Renderer = RENDERERS[visualSpec.type];
  if (!Renderer) return null;

  return (
    <div className="rounded-lg border border-ink-200 bg-paper p-3">
      <Renderer spec={visualSpec} step={step} />
    </div>
  );
}
