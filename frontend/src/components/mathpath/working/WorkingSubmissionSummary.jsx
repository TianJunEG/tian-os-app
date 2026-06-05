import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, Checkbox } from '../../ui';

export default function WorkingSubmissionSummary({
  questionRefs = [],
  noWorkingChecked = {},
  pagesUploaded = 0,
  onToggleNoWorking,
  missingWarning = '',
}) {
  const questionsShown = questionRefs.length;
  const workingSubmittedCount = questionRefs.filter((q) => q.workingSubmitted || q.workingUploaded || q.fullscreenWorkingSubmitted).length;
  const workingOnPaperCount = questionRefs.filter((q) => q.workingOnPaper && !q.workingSubmitted && !q.workingUploaded && !q.fullscreenWorkingSubmitted).length;
  const noWorkingCount = questionRefs.filter((q) => noWorkingChecked[q.questionId] || q.workingNotNeeded).length;
  const missingWorkingCount = questionRefs.filter((q) => (
    q.workingRequired &&
    !q.workingSubmitted &&
    !q.workingUploaded &&
    !q.fullscreenWorkingSubmitted &&
    !q.workingOnPaper &&
    !q.workingNotNeeded &&
    !noWorkingChecked[q.questionId]
  )).length;
  const ready = missingWorkingCount === 0 && (workingOnPaperCount === 0 || Number(pagesUploaded || 0) > 0);
  const allNoWorking = questionsShown > 0 && noWorkingCount === questionsShown && workingSubmittedCount === 0 && Number(pagesUploaded || 0) === 0;

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-700">Submission Summary</p>
      <p className="mt-1 text-xs text-ink-500">
        Questions shown: {questionRefs.length}. For each question, upload working or choose that you did not need working.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-600 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="font-semibold text-ink-500">Questions shown</p>
          <p className="font-mono text-base font-semibold text-ink-800">{questionsShown}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="font-semibold text-ink-500">Working submitted</p>
          <p className="font-mono text-base font-semibold text-ink-800">{workingSubmittedCount + Number(pagesUploaded || 0)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="font-semibold text-ink-500">On paper</p>
          <p className="font-mono text-base font-semibold text-ink-800">{workingOnPaperCount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="font-semibold text-ink-500">Working not needed</p>
          <p className="font-mono text-base font-semibold text-ink-800">{noWorkingCount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="font-semibold text-ink-500">Missing working</p>
          <p className="font-mono text-base font-semibold text-ink-800">{missingWorkingCount}</p>
        </div>
      </div>

      <p className={`mt-3 text-sm font-semibold ${ready ? 'text-success-700' : 'text-gold-700'}`}>
        {ready ? 'Ready to continue' : workingOnPaperCount > 0 ? 'Upload your paper working' : 'Working still needed'}
      </p>
      {allNoWorking && (
        <p className="mt-2 rounded-lg bg-success-100 px-3 py-2 text-sm text-success-700">
          No working upload needed. You have declared working was not needed for these questions.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {questionRefs.map((q, idx) => {
          return (
          <div key={q.questionId} className="rounded-lg border border-hairline px-3 py-2">
            <p className="truncate text-xs text-ink-600">Q{idx + 1}: {q.prompt}</p>
            <p className="mt-1 text-[11px] text-ink-500">
              Student choice required: upload working or mark no working needed.
            </p>
            {q.workingOnPaper && (
              <p className="mt-1 rounded-md bg-gold-50 px-2 py-1 text-[11px] font-semibold text-gold-800">
                You chose paper working for this question. Upload a page before continuing.
              </p>
            )}
            <Checkbox
              className="mt-2"
              checked={Boolean(noWorkingChecked[q.questionId])}
              onChange={(e) => onToggleNoWorking?.(q, e.target.checked)}
              label="I did not need working for this question"
            />
          </div>
          );
        })}
      </div>

      {missingWarning && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-gold-300 bg-gold-100 p-2 text-xs text-gold-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{missingWarning}</p>
        </div>
      )}
    </Card>
  );
}
