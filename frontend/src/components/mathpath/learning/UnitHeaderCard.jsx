import React from 'react';
import { Badge, Card, ProgressBar } from '../../ui';

export default function UnitHeaderCard({
  unitLabel = 'UNIT 1',
  title,
  subtitle,
  progressPercent = 0,
  progressText,
}) {
  const safePercent = Math.max(0, Math.min(100, Number(progressPercent) || 0));

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{unitLabel}</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-700 sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-ink-600">{subtitle}</p> : null}
        </div>
        <Badge tone="navy">{safePercent}%</Badge>
      </div>
      <ProgressBar value={safePercent} max={100} className="mt-4" />
      {progressText ? <p className="mt-2 text-xs text-ink-500">{progressText}</p> : null}
    </Card>
  );
}
