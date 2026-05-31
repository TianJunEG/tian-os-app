import React from 'react';
import { Award } from 'lucide-react';
import { Card } from '../../ui';

export default function MilestoneCard({ title = 'Milestone', message, hint }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
          <Award className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-800">{title}</p>
          {message ? <p className="mt-1 text-sm text-ink-600">{message}</p> : null}
          {hint ? <p className="mt-2 text-xs text-ink-500">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}
