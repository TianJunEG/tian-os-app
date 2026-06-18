import React from 'react';
import { Badge, Card } from '../../../../components/ui';

export default function PracticeResultReview({ rows = [] }) {
  const questionRows = Array.isArray(rows) ? rows : [];
  if (!questionRows.length) return null;

  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-semibold text-ink-700">Review</p>
      <div className="mt-3 space-y-3">
        {questionRows.map((row) => {
          const solutionSteps = row.solutionSteps?.length
            ? row.solutionSteps
            : String(row.workedSolution || '').split('\n').filter(Boolean);
          return (
            <div key={row.questionId} className="min-w-0 rounded-lg border border-line-soft bg-surface-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="break-words text-sm font-semibold text-ink-800">
                  {row.skipped ? 'Skipped' : row.correct ? 'Correct' : 'Review needed'}
                </p>
                <Badge tone={row.correct ? 'success' : 'error'}>
                  {row.correct ? 'correct' : row.skipped ? 'skipped' : 'wrong'}
                </Badge>
              </div>
              {row.prompt && <p className="mt-2 break-words text-sm text-ink-600">{row.prompt}</p>}
              <div className="mt-2 space-y-1 text-sm text-ink-700">
                <p className="break-words">
                  <span className="font-semibold">Your answer:</span> {row.skipped ? 'Skipped' : row.studentAnswer || '-'}
                </p>
                <p className="break-words">
                  <span className="font-semibold">Correct answer:</span> {row.correctAnswer || '-'}
                </p>
              </div>
              {solutionSteps.length > 0 && (
                <div className="mt-2 min-w-0 rounded-lg bg-emerald-tint p-3 text-sm text-ink-700">
                  {solutionSteps.map((step, index) => (
                    <p key={`${row.questionId}-step-${index}`} className="break-words">{step}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
