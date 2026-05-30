import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, Checkbox } from '../../ui';

export default function WorkingSubmissionSummary({
  questionRefs = [],
  noWorkingChecked = {},
  onToggleNoWorking,
  missingWarning = '',
}) {
  const noWorkingCount = questionRefs.filter((q) => noWorkingChecked[q.questionId]).length;

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-700">Submission Summary</p>
      <p className="mt-1 text-xs text-ink-500">
        Questions requiring working: {questionRefs.filter((q) => q.workingRequired).length}. Mark no-working-required only where allowed.
      </p>

      <div className="mt-3 space-y-2">
        {questionRefs.map((q, idx) => {
          const canMarkNoWorking = q.mentalMathEligible || !q.workingRequired;
          return (
          <div key={q.questionId} className="rounded-lg border border-hairline px-3 py-2">
            <p className="truncate text-xs text-ink-600">Q{idx + 1}: {q.prompt}</p>
            <p className="mt-1 text-[11px] text-ink-500">
              {q.workingRequired ? 'Working required' : 'Working optional'}
              {q.mentalMathEligible ? ' · Mental math eligible' : ''}
            </p>
            <Checkbox
              className="mt-2"
              checked={Boolean(noWorkingChecked[q.questionId])}
              disabled={!canMarkNoWorking}
              onChange={(e) => onToggleNoWorking?.(q, e.target.checked)}
              label="I did not need working for this question"
            />
          </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-ink-500">No-working-required marked: {noWorkingCount}</p>
      {missingWarning && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-gold-300 bg-gold-100 p-2 text-xs text-gold-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{missingWarning}</p>
        </div>
      )}
    </Card>
  );
}
