import React from 'react';
import { Check, X } from 'lucide-react';
import { Card } from '../../ui';

export default function FeedbackPanel({ feedback }) {
  if (!feedback) return null;

  const toneClasses = feedback.correct ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700';
  const title = feedback.correct ? 'Correct' : feedback.skipped ? 'Skipped' : 'Not quite';

  return (
    <Card className={`mt-4 border-0 p-4 ${toneClasses}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {feedback.correct ? <Check className="h-4.5 w-4.5" /> : <X className="h-4.5 w-4.5" />}
        {title}
      </div>
      {feedback.message ? <p className="mt-1 text-sm text-ink-700">{feedback.message}</p> : null}
      {feedback.correctAnswer && !feedback.correct ? (
        <p className="mt-1 text-sm text-ink-700">{feedback.correctAnswer}</p>
      ) : null}
    </Card>
  );
}
