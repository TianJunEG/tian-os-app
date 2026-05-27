'use client';

// Math.jsx — KaTeX renderer. Stacked fractions and algebra-ready math, responsive on mobile.
import katex from 'katex';

export function Math({ tex, display = false, size = 1, color }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: display });
  return (
    <span
      style={{ fontSize: `${size}em`, color, lineHeight: 1.1, display: display ? 'block' : 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Render a worked-solution / prompt step that is either { text } or { latex }.
export function Step({ step, size = 1, color }) {
  if (step.latex) return <Math tex={step.latex} display size={size} color={color} />;
  return <span style={{ color }}>{step.text}</span>;
}
