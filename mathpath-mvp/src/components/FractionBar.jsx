'use client';

// Visual fraction models: a bar (split into d parts, n shaded) and a circle/pie equivalent.
import { T } from '@/lib/tokens';

export function FractionBar({ n, d, height = 56 }) {
  return (
    <div style={{ display: 'flex', gap: 4, width: '100%', maxWidth: 280, margin: '0 auto' }}>
      {Array.from({ length: d }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height, borderRadius: 8,
          background: i < n ? T.navy500 : T.paper,
          border: `1.5px solid ${i < n ? T.navy500 : T.navy100}`,
          transition: `background 200ms ${T.easeCalm}`,
        }} />
      ))}
    </div>
  );
}

// A pie split into d equal sectors, n shaded.
export function FractionCircle({ n, d, size = 132 }) {
  const r = size / 2;
  const sector = (i) => {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x0 = r + r * Math.cos(a0), y0 = r + r * Math.sin(a0);
    const x1 = r + r * Math.cos(a1), y1 = r + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${r} ${r} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {Array.from({ length: d }).map((_, i) => (
        <path key={i} d={sector(i)} fill={i < n ? T.navy500 : T.paper} stroke={i < n ? T.navy500 : T.navy100} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// Dispatcher — render whichever model the question carries.
export default function FractionVisual({ visual }) {
  if (!visual) return null;
  if (visual.kind === 'circle') return <FractionCircle n={visual.n} d={visual.d} />;
  return <FractionBar n={visual.n} d={visual.d} />;
}
