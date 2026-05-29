import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Renders a fraction vertically (numerator over denominator) rather than slash
// notation, per the Tian OS math display rule. Uses JetBrains Mono.
export function Fraction({ n, d }) {
  const isBlankNumerator = String(n).trim() === '?';
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle font-mono leading-none">
      <span className="px-1">
        {isBlankNumerator ? <span className="inline-flex h-6 w-6 items-center justify-center border border-current align-middle text-sm">?</span> : n}
      </span>
      <span className="border-t border-current px-1 pt-px">{d}</span>
    </span>
  );
}

// Render a TeX snippet to HTML with KaTeX (inline, never throws).
function tex(src) {
  try { return katex.renderToString(src, { throwOnError: false, output: 'html', strict: false }); }
  catch { return src; }
}

// Renders mixed text + maths. Both notations come out as proper stacked
// fractions (never slash notation):
//   • KaTeX commands in the string — \frac{a}{b}, \times, \div, $…$ — are
//     typeset with KaTeX.
//   • bare "a/b" tokens (incl. a "?" placeholder for fill-ins) stack via the
//     Fraction component, preserving the existing lightweight style.
export const MathText = React.memo(function MathText({ text, className = '' }) {
  // KaTeX typesetting is comparatively expensive, so memoise the parsed segments
  // on the text — re-renders of the parent (e.g. a timer tick) won't re-parse.
  const parts = React.useMemo(() => {
    let s = String(text ?? '');
    // Legacy authored prompt format: "? (over 4)" -> proper fraction token.
    s = s.replace(/\?\s*\(\s*over\s*(\d+|\?)\s*\)/gi, '?/$1');
    // Inline TeX symbols in prose (outside \frac) → unicode.
    s = s.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\square/g, '□')
      .replace(/\\%/g, '%').replace(/\\,/g, ' ').replace(/\\cdot/g, '·');
    const re = /(\$[^$]+\$|\\frac\{[^{}]*\}\{[^{}]*\}|(?:\d+|\?)\s*\/\s*(?:\d+|\?))/g;
    return s.split(re).map((p) => {
      if (!p) return null;
      const dollar = p.match(/^\$([^$]+)\$$/);
      if (dollar) return { html: tex(dollar[1]) };
      const frac = p.match(/^\\frac\{([^{}]*)\}\{([^{}]*)\}$/);
      if (frac) return { html: tex(`\\frac{${frac[1]}}{${frac[2]}}`) };
      const ab = p.match(/^(\d+|\?)\s*\/\s*(\d+|\?)$/);
      if (ab) return { frac: [ab[1], ab[2]] };
      return { text: p };
    });
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.html) return <span key={i} dangerouslySetInnerHTML={{ __html: p.html }} />;
        if (p.frac) return <Fraction key={i} n={p.frac[0]} d={p.frac[1]} />;
        return <React.Fragment key={i}>{p.text}</React.Fragment>;
      })}
    </span>
  );
});
