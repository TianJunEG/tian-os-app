import React from 'react';
import { Card, Badge } from '../../ui';

export default function WorkingUploadCard({
  sessionType = 'practice',
  questionCount = 0,
  requiringWorkingCount = 0,
  status = 'pending',
}) {
  const statusTone = status === 'analysisReady' ? 'success' : status === 'submitted' ? 'gold' : 'navy';
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Working Upload</p>
          <p className="mt-1 text-sm font-semibold text-ink-700">{sessionType === 'assessment' ? 'Assessment Session' : 'Practice Session'}</p>
        </div>
        <Badge tone={statusTone}>{status}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-600">
        <div className="rounded-lg bg-surface-raised px-3 py-2">
          <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Questions</p>
          <p className="font-mono text-base font-semibold text-ink-700">{questionCount}</p>
        </div>
        <div className="rounded-lg bg-surface-raised px-3 py-2">
          <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Working Required</p>
          <p className="font-mono text-base font-semibold text-ink-700">{requiringWorkingCount}</p>
        </div>
      </div>
    </Card>
  );
}

