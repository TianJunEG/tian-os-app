import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge, Button, Card } from '../../ui';

export default function UpNextCard({
  title = 'Up Next',
  skillName,
  reason,
  actionLabel = 'Continue Learning',
  onAction,
}) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-deep">{title}</p>
      <p className="mt-2 text-base font-semibold text-ink-800">{skillName || 'Start your diagnostic'}</p>
      {reason ? <p className="mt-1 text-sm text-ink-600">{reason}</p> : null}
      <div className="mt-3 flex items-center gap-2">
        <Badge tone="outline">One task at a time</Badge>
      </div>
      {onAction ? (
        <Button className="mt-4 w-full" size="m" icon={ArrowRight} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
