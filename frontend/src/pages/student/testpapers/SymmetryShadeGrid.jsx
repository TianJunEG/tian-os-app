import React from 'react';

// Interactive symmetry grid. Pre-shaded squares are locked (grey); the student
// clicks empty squares to shade them (blue) to complete the symmetric figure.
// The answer is the set of squares THEY added, serialised sorted as "r-c,r-c"
// (matched exactly by the grader). In read-only/results mode, the correct
// squares to add are outlined in green.
function serialize(cells) {
  return cells.map(([r, c]) => `${r}-${c}`).sort().join(',');
}
function parseCells(str) {
  return String(str || '').split(',').filter(Boolean).map((s) => s.split('-').map(Number));
}

export default function SymmetryShadeGrid({ grid, value = '', onChange, readOnly = false, correctCells = null }) {
  const { rows = 4, cols = 4, preShaded = [], line = 'vertical' } = grid || {};
  const cell = 44;
  const w = cols * cell;
  const h = rows * cell;
  const preSet = new Set(preShaded.map(([r, c]) => `${r}-${c}`));
  const added = new Set(parseCells(value).map(([r, c]) => `${r}-${c}`));
  const correctSet = correctCells ? new Set(parseCells(correctCells).map(([r, c]) => `${r}-${c}`)) : null;

  const toggle = (r, c) => {
    if (readOnly) return;
    const key = `${r}-${c}`;
    if (preSet.has(key)) return;
    const next = new Set(added);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(serialize([...next].map((k) => k.split('-').map(Number))));
  };

  let lx1; let ly1; let lx2; let ly2;
  if (line === 'horizontal') { lx1 = 0; ly1 = h / 2; lx2 = w; ly2 = h / 2; }
  else if (line === 'diagonal-trbl') { lx1 = w; ly1 = 0; lx2 = 0; ly2 = h; }
  else if (line === 'diagonal-tlbr') { lx1 = 0; ly1 = 0; lx2 = w; ly2 = h; }
  else { lx1 = w / 2; ly1 = 0; lx2 = w / 2; ly2 = h; }

  return (
    <svg viewBox={`0 0 ${w + 2} ${h + 2}`} width={w + 2} height={h + 2} style={{ maxWidth: '100%', touchAction: 'manipulation' }} role="img" aria-label="symmetry grid">
      <g transform="translate(1,1)">
        {Array.from({ length: rows }).flatMap((_, r) => Array.from({ length: cols }).map((__, c) => {
          const key = `${r}-${c}`;
          const isPre = preSet.has(key);
          const isAdded = added.has(key);
          const isCorrect = correctSet?.has(key) && !isPre;
          const fill = isPre ? '#64748b' : isAdded ? '#2563eb' : '#ffffff';
          return (
            <rect
              key={key}
              x={c * cell} y={r * cell} width={cell} height={cell}
              fill={fill}
              stroke={isCorrect ? '#10b981' : '#cbd5e1'}
              strokeWidth={isCorrect ? 2.5 : 1}
              style={{ cursor: readOnly || isPre ? 'default' : 'pointer' }}
              onClick={() => toggle(r, c)}
            />
          );
        }))}
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" />
      </g>
    </svg>
  );
}
