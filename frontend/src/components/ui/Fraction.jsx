import React from 'react';

// Renders a fraction vertically (numerator over denominator) rather than slash
// notation, per the Tian OS math display rule. Uses JetBrains Mono.
export function Fraction({ n, d }) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle font-mono leading-none">
      <span className="px-1">{n}</span>
      <span className="border-t border-current px-1 pt-px">{d}</span>
    </span>
  );
}

// Renders text, converting bare "a/b" tokens into stacked fractions. Keeps the
// rest of the string intact (so question stems read naturally).
export function MathText({ text, className = '' }) {
  const parts = String(text ?? '').split(/(\d+\s*\/\s*\d+)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        const m = p.match(/^(\d+)\s*\/\s*(\d+)$/);
        return m ? <Fraction key={i} n={m[1]} d={m[2]} /> : <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </span>
  );
}
