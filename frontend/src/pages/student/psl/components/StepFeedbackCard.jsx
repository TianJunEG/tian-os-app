import React from 'react';
import { getMisconception } from '../utils/misconceptions';
import { CheckCircle2, AlertCircle, XCircle, Lightbulb } from 'lucide-react';
import { Button } from '../../../../components/ui';

const CATEGORY_ICONS = {
  Reading: '📖',
  Understanding: '🔍',
  Planning: '🗺️',
  Solving: '✏️',
  Checking: '✅',
};

// Tone maps onto the shared design tokens so step feedback matches every other
// surface: correct → emerald, partial → gold, incorrect → danger.
const TONES = {
  correct: { icon: CheckCircle2, iconColor: 'text-emerald', box: 'border-emerald-border bg-emerald-tint', text: 'text-emerald-deep' },
  partial: { icon: AlertCircle, iconColor: 'text-gold', box: 'border-gold-border bg-gold-tint', text: 'text-gold-deep' },
  incorrect: { icon: XCircle, iconColor: 'text-danger', box: 'border-danger-border bg-danger-tint', text: 'text-danger-deep' },
};

export default function StepFeedbackCard({ correct, partial, feedback, misconceptionTag, workedExample, remediation, onContinue }) {
  const tone = correct ? TONES.correct : partial ? TONES.partial : TONES.incorrect;
  const Icon = tone.icon;

  const misconception = misconceptionTag ? getMisconception(misconceptionTag) : null;
  const hasMisconception = misconception && misconception.category !== 'Other';

  return (
    <div className={`space-y-3 rounded-card border p-4 ${tone.box}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${tone.iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${tone.text}`}>{feedback}</p>
        </div>
      </div>

      {hasMisconception && !correct && (
        <div className="space-y-1.5 rounded-btn border border-line bg-surface-white/70 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-hidden="true">{CATEGORY_ICONS[misconception.category] || '💡'}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-body-muted">{misconception.category}</span>
            <span className="text-xs font-semibold text-body">· {misconception.label}</span>
          </div>
          {misconception.tip && (
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              <p className="text-xs font-medium leading-relaxed text-body">{misconception.tip}</p>
            </div>
          )}
        </div>
      )}

      {workedExample && !correct && (
        <div className="space-y-2 rounded-btn border border-dashed border-gold-border bg-gold-tint2 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-label">{workedExample.title}</p>
          {workedExample.steps && (
            <ol className="list-inside list-decimal space-y-1">
              {workedExample.steps.map((step, i) => (
                <li key={i} className="text-xs leading-relaxed text-gold-deep">{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {remediation && !correct && (
        <div className="flex items-start gap-2 rounded-btn border border-blue-border bg-blue-tint p-3">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue" />
          <p className="text-xs font-medium leading-relaxed text-blue">{remediation}</p>
        </div>
      )}

      {onContinue && (
        <Button onClick={onContinue} className="w-full">Continue</Button>
      )}
    </div>
  );
}
