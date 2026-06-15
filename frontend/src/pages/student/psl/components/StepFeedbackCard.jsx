import React from 'react';
import { getMisconception } from '../utils/misconceptions';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function StepFeedbackCard({ correct, partial, feedback, misconceptionTag, onContinue }) {
  let icon, bgColor, borderColor, textColor;
  if (correct) {
    icon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    bgColor = 'bg-emerald-50'; borderColor = 'border-emerald-200'; textColor = 'text-emerald-700';
  } else if (partial) {
    icon = <AlertCircle className="h-5 w-5 text-amber-500" />;
    bgColor = 'bg-amber-50'; borderColor = 'border-amber-200'; textColor = 'text-amber-700';
  } else {
    icon = <XCircle className="h-5 w-5 text-red-500" />;
    bgColor = 'bg-red-50'; borderColor = 'border-red-200'; textColor = 'text-red-700';
  }

  const misconception = misconceptionTag ? getMisconception(misconceptionTag) : null;

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{feedback}</p>
          {misconception && misconception.tip && (
            <p className="mt-1 text-xs text-ink-500">{misconception.tip}</p>
          )}
        </div>
      </div>
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="mt-3 w-full rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-500"
        >
          Continue
        </button>
      )}
    </div>
  );
}
