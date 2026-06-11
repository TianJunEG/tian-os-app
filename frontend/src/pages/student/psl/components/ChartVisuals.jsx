import React from 'react';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export function DataTableVisual({ spec, step }) {
  const showValues = step >= 1;
  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 text-xs">
      {spec.title && <div className="bg-ink-50 px-2 py-1 text-center text-[10px] font-semibold text-ink-600">{spec.title}</div>}
      <table className="w-full">
        <thead>
          <tr className="bg-ink-50">
            {spec.labels.map((label, i) => (
              <th key={i} className="px-2 py-1.5 text-center font-medium text-ink-500">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {spec.values.map((val, i) => (
              <td key={i} className="px-2 py-1.5 text-center font-mono font-bold text-ink-700">
                {showValues ? val : '?'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function BarChartVisual({ spec, step }) {
  const showBars = step >= 1;
  const maxVal = Math.max(...spec.values, 1);
  const barCount = spec.values.length;
  const svgW = 240;
  const svgH = 120;
  const padL = 30;
  const padR = 8;
  const padT = 6;
  const padB = 28;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const barW = Math.min(plotW / barCount * 0.6, 36);
  const gap = (plotW - barW * barCount) / (barCount + 1);

  const niceMax = Math.ceil(maxVal / 10) * 10 || 10;
  const ticks = [0, Math.round(niceMax / 2), niceMax];

  return (
    <div className="flex flex-col items-center">
      {spec.title && <div className="text-[10px] font-semibold text-ink-600 mb-1">{spec.title}</div>}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[280px]">
        {ticks.map(t => {
          const y = padT + plotH - (t / niceMax) * plotH;
          return (
            <g key={t}>
              <line x1={padL} x2={svgW - padR} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={padL - 3} y={y + 3} textAnchor="end" className="text-[7px] fill-ink-400">{t}</text>
            </g>
          );
        })}
        <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke="#d1d5db" strokeWidth="0.5" />
        {spec.values.map((val, i) => {
          const x = padL + gap + i * (barW + gap);
          const h = showBars ? (val / niceMax) * plotH : 0;
          const y = padT + plotH - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={2} fill={COLORS[i % COLORS.length]} opacity={0.85}>
                {showBars && <animate attributeName="height" from="0" to={h} dur="0.4s" />}
                {showBars && <animate attributeName="y" from={padT + plotH} to={y} dur="0.4s" />}
              </rect>
              {showBars && <text x={x + barW / 2} y={y - 2} textAnchor="middle" className="text-[7px] fill-ink-600 font-bold">{val}</text>}
              <text x={x + barW / 2} y={padT + plotH + 10} textAnchor="middle" className="text-[6px] fill-ink-500">{spec.labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LineGraphVisual({ spec, step }) {
  const showPoints = step >= 1;
  const maxVal = Math.max(...spec.values, 1);
  const svgW = 240;
  const svgH = 120;
  const padL = 30;
  const padR = 12;
  const padT = 8;
  const padB = 28;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const n = spec.values.length;
  const niceMax = Math.ceil(maxVal / 10) * 10 || 10;
  const niceMin = 0;
  const ticks = [niceMin, Math.round(niceMax / 2), niceMax];

  const pts = spec.values.map((val, i) => ({
    x: padL + (i / Math.max(n - 1, 1)) * plotW,
    y: padT + plotH - ((val - niceMin) / (niceMax - niceMin)) * plotH,
    val,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center">
      {spec.title && <div className="text-[10px] font-semibold text-ink-600 mb-1">{spec.title}</div>}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[280px]">
        {ticks.map(t => {
          const y = padT + plotH - ((t - niceMin) / (niceMax - niceMin)) * plotH;
          return (
            <g key={t}>
              <line x1={padL} x2={svgW - padR} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={padL - 3} y={y + 3} textAnchor="end" className="text-[7px] fill-ink-400">{t}</text>
            </g>
          );
        })}
        <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke="#d1d5db" strokeWidth="0.5" />
        {showPoints && (
          <>
            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
                <text x={p.x} y={p.y - 6} textAnchor="middle" className="text-[7px] fill-ink-600 font-bold">{p.val}</text>
              </g>
            ))}
          </>
        )}
        {spec.labels.map((label, i) => {
          const x = padL + (i / Math.max(n - 1, 1)) * plotW;
          return <text key={i} x={x} y={padT + plotH + 10} textAnchor="middle" className="text-[6px] fill-ink-500">{label}</text>;
        })}
      </svg>
    </div>
  );
}

export function PieChartVisual({ spec, step }) {
  const showSlices = step >= 1;
  const pcts = spec.percentages || [];
  const total = pcts.reduce((a, b) => a + b, 0) || 100;
  const cx = 70;
  const cy = 60;
  const r = 44;

  let cumAngle = -90;
  const slices = pcts.map((pct, i) => {
    const angle = (pct / total) * 360;
    const startRad = (cumAngle * Math.PI) / 180;
    const endRad = ((cumAngle + angle) * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const midRad = ((cumAngle + angle / 2) * Math.PI) / 180;
    const labelR = r * 0.65;
    const lx = cx + labelR * Math.cos(midRad);
    const ly = cy + labelR * Math.sin(midRad);
    cumAngle += angle;
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`, lx, ly, pct, i };
  });

  return (
    <div className="flex flex-col items-center">
      {spec.title && <div className="text-[10px] font-semibold text-ink-600 mb-1">{spec.title}</div>}
      <div className="flex items-start gap-2">
        <svg viewBox="0 0 140 120" className="w-[140px] h-[120px]">
          {showSlices ? slices.map(s => (
            <g key={s.i}>
              <path d={s.d} fill={COLORS[s.i % COLORS.length]} opacity={0.85} stroke="white" strokeWidth="1" />
              <text x={s.lx} y={s.ly + 3} textAnchor="middle" className="text-[7px] fill-white font-bold">{s.pct}%</text>
            </g>
          )) : (
            <circle cx={cx} cy={cy} r={r} fill="#e5e7eb" />
          )}
        </svg>
        <div className="flex flex-col gap-0.5 pt-2">
          {spec.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[8px] text-ink-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
      {spec.total > 0 && <div className="text-[9px] text-ink-500 mt-0.5">Total: <span className="font-semibold">{spec.total}</span></div>}
    </div>
  );
}

export function MultiTableVisual({ spec, step }) {
  const showValues = step >= 1;
  return (
    <div className="space-y-2">
      {(spec.tables || []).map((table, ti) => (
        <div key={ti} className="overflow-hidden rounded-lg border border-ink-200 text-xs">
          {table.title && <div className="bg-ink-50 px-2 py-1 text-center text-[10px] font-semibold text-ink-600">{table.title}</div>}
          <table className="w-full">
            <thead>
              <tr className="bg-ink-50">
                {table.labels.map((label, i) => (
                  <th key={i} className="px-2 py-1.5 text-center font-medium text-ink-500">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {table.values.map((val, i) => (
                  <td key={i} className="px-2 py-1.5 text-center font-mono font-bold text-ink-700">
                    {showValues ? val : '?'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
