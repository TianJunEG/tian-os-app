import React, { useRef } from 'react';

// The whole number sentence (incl. the answer) goes in ONE box, e.g.
// "116 ÷ 4 × 3 = 87". Students can add more number sentences for multi-step
// problems and tap the math signs to insert them. The backend scores the final
// number after the last "=", so we keep value.answer populated for it.
function extractAnswer(sentence = '') {
  const parts = String(sentence).split('=');
  const tail = parts.length > 1 ? parts[parts.length - 1] : '';
  const m = tail.match(/-?\d+(\.\d+)?/);
  return m ? m[0] : '';
}

const SIGNS = ['+', '−', '×', '÷', '=', '(', ')'];

export default function SolvePanel({ twoStep = false, value = {}, onChange }) {
  const sentences = Array.isArray(value.sentences) && value.sentences.length
    ? value.sentences
    : value.expression
      ? [value.expression]
      : twoStep ? ['', ''] : [''];
  const inputRefs = useRef([]);
  const focusedRef = useRef(0);

  const emit = (next) => {
    const lastNonEmpty = [...next].reverse().find((s) => String(s).trim());
    onChange({
      ...value,
      sentences: next,
      expression: next.filter((s) => String(s).trim()).join('   ;   '),
      answer: extractAnswer(lastNonEmpty || ''),
    });
  };
  const setSentence = (i, text) => { const n = [...sentences]; n[i] = text; emit(n); };
  const addSentence = () => emit([...sentences, '']);
  const removeSentence = (i) => emit(sentences.filter((_, idx) => idx !== i));

  const insertSign = (sym) => {
    const i = focusedRef.current;
    const el = inputRefs.current[i];
    const cur = sentences[i] || '';
    if (el && typeof el.selectionStart === 'number') {
      const s = el.selectionStart; const e = el.selectionEnd;
      setSentence(i, cur.slice(0, s) + sym + cur.slice(e));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + sym.length, s + sym.length); });
    } else {
      setSentence(i, cur + sym);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-600">
        Write your number sentence{sentences.length > 1 ? 's' : ''} and the answer:
      </p>
      <div className="space-y-2 rounded-xl border border-ink-200 bg-white p-3 sm:p-4">
        {sentences.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="text"
              placeholder="e.g. 116 ÷ 4 × 3 = 87"
              value={s}
              onFocus={() => { focusedRef.current = i; }}
              onChange={(e) => setSentence(i, e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-ink-50/30 px-3 py-2.5 font-mono text-base text-ink-800 outline-none focus:border-gold"
            />
            {sentences.length > 1 && (
              <button
                type="button"
                onClick={() => removeSentence(i)}
                aria-label="Remove this number sentence"
                className="shrink-0 rounded-lg border border-ink-200 px-2.5 py-2 text-sm text-ink-400 hover:border-rose-300 hover:text-rose-500"
              >✕</button>
            )}
          </div>
        ))}

        {/* Math signs + add another sentence */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {SIGNS.map((sym) => (
            <button
              key={sym}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSign(sym)}
              className="h-9 min-w-[2.25rem] rounded-lg border border-ink-200 bg-white font-mono text-base font-semibold text-ink-700 hover:border-gold hover:bg-gold-tint"
            >{sym}</button>
          ))}
          <button
            type="button"
            onClick={addSentence}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-xs font-semibold text-ink-500 hover:border-emerald hover:text-emerald-deep"
          >+ Add number sentence</button>
        </div>
      </div>
    </div>
  );
}
