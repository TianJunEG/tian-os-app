'use client';

// FractionBar.jsx — a visual fraction: a bar split into d equal parts, n shaded.
import { T } from '@/lib/tokens';

export default function FractionBar({ n, d, height = 56 }) {
  return (
    <div style={{ display: 'flex', gap: 4, width: '100%', maxWidth: 280, margin: '0 auto' }}>
      {Array.from({ length: d }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height, borderRadius: 8,
            background: i < n ? T.navy500 : T.paper,
            border: `1.5px solid ${i < n ? T.navy500 : T.navy100}`,
            transition: `background 200ms ${T.easeCalm}`,
          }}
        />
      ))}
    </div>
  );
}
