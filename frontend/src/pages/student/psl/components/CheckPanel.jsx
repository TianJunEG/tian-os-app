import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function CheckPanel({ answer, selected, onSelect }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-600">
        You got <span className="font-mono font-bold text-gold-600">{answer ?? '?'}</span>. Does this answer make sense?
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSelect(true)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selected === true
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : 'border-ink-200 bg-white text-ink-600 hover:border-emerald-300'
          }`}
        >
          <CheckCircle2 className="h-5 w-5" />
          Yes, it's reasonable
        </button>
        <button
          type="button"
          onClick={() => onSelect(false)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selected === false
              ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-ink-200 bg-white text-ink-600 hover:border-red-300'
          }`}
        >
          <XCircle className="h-5 w-5" />
          No, let me re-check
        </button>
      </div>
    </div>
  );
}
