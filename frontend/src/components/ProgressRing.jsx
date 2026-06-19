import React from 'react';

// Animated circular progress ring — the readiness "progress intelligence" motif from the
// launch video. Navy track, soft-gold progress, percentage centered. Inherits text color.
export default function ProgressRing({ value = 0, size = 96, stroke = 8, trackClass = 'stroke-white/15' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="stroke-gold transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-extrabold" style={{ fontSize: size * 0.26 }}>{pct}%</span>
    </div>
  );
}
