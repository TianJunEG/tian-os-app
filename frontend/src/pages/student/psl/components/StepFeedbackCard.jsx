import React from 'react';
import { getMisconception } from '../utils/misconceptions';
import { CheckCircle2, AlertCircle, XCircle, Lightbulb } from 'lucide-react';

const CATEGORY_ICONS = {
  Reading: '📖',
  Understanding: '🔍',
  Planning: '🗺️',
  Solving: '✏️',
  Checking: '✅',
};

export default function StepFeedbackCard({ correct, partial, feedback, misconceptionTag, workedExample, remediation, onContinue }) {
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
  const hasMisconception = misconception && misconception.category !== 'Other';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 space-y-3`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColor}`}>{feedback}</p>
        </div>
      </div>

      {hasMisconception && !correct && (
        <div className="rounded-lg bg-white/60 border border-ink-100 p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-hidden="true">{CATEGORY_ICONS[misconception.category] || '💡'}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">{misconception.category}</span>
            <span className="text-xs font-semibold text-ink-600">· {misconception.label}</span>
          </div>
          {misconception.tip && (
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gold-500" />
              <p className="text-xs font-medium text-ink-600 leading-relaxed">{misconception.tip}</p>
            </div>
          )}
        </div>
      )}

      {workedExample && !correct && (
        <div className="rounded-lg border border-dashed p-3 space-y-2" style={{ borderColor: '#f0dcb8', background: '#fdf6ea' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#a8743a' }}>{workedExample.title}</p>
          {workedExample.steps && (
            <ol className="list-decimal list-inside space-y-1">
              {workedExample.steps.map((step, i) => (
                <li key={i} className="text-xs leading-relaxed" style={{ color: '#5a4020' }}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {remediation && !correct && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
          <p className="text-xs font-medium text-blue-700 leading-relaxed">{remediation}</p>
        </div>
      )}

      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="w-full btn-gold rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          Continue
        </button>
      )}
    </div>
  );
}
