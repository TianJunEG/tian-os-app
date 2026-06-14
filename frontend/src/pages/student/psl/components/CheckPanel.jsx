import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function CheckPanel({ answer, selected, onSelect, onGoBack }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-600">
        You got <span className="font-mono font-bold text-gold-600">{answer ?? '?'}</span>. Does this answer make sense?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onSelect(true)}
          className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selected === true
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : 'border-ink-200 bg-white text-ink-600 hover:border-emerald-300'
          }`}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Yes, it's reasonable
        </button>
        <button
          type="button"
          onClick={() => onGoBack ? onGoBack() : onSelect(false)}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-600 transition-colors hover:border-red-300"
        >
          <XCircle className="h-5 w-5 shrink-0" />
          No, let me re-check
        </button>
      </div>
    </div>
  );
}
