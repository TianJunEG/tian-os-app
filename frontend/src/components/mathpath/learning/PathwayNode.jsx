import React from 'react';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { Badge, Button, Card } from '../../ui';

const STATUS_META = {
  completed: { label: 'Completed', tone: 'success' },
  current: { label: 'Current', tone: 'navy' },
  locked: { label: 'Locked', tone: 'neutral' },
  review: { label: 'Needs Review', tone: 'error' },
  learning: { label: 'Learning', tone: 'gold' },
  ready: { label: 'Ready', tone: 'navy' },
};

export default function PathwayNode({
  node,
  compact = false,
  onOpen,
}) {
  const statusKey = STATUS_META[node?.status] ? node.status : 'learning';
  const status = STATUS_META[statusKey];
  const isLocked = statusKey === 'locked';
  const isCurrent = statusKey === 'current';
  const isCompleted = statusKey === 'completed';

  return (
    <Card className={`${compact ? 'p-3.5' : 'p-4'} ${isCurrent ? 'ring-2 ring-gold-border/70' : ''} ${isLocked ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-ink-800`}>{node?.title}</p>
          {node?.subtitle ? <p className="mt-0.5 text-xs text-ink-500">{node.subtitle}</p> : null}
        </div>
        {isCompleted ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" /> : null}
        {isLocked ? <Lock className="h-4.5 w-4.5 shrink-0 text-ink-400" /> : null}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        {node?.progressLabel ? <span className="text-xs text-ink-500">{node.progressLabel}</span> : null}
      </div>

      {onOpen ? (
        <Button
          size="m"
          variant={isCurrent ? 'primary' : 'secondary'}
          className="mt-3 w-full"
          disabled={isLocked}
          onClick={() => onOpen(node)}
          icon={isCurrent ? PlayCircle : undefined}
        >
          {isLocked ? 'Locked' : isCurrent ? 'Continue' : 'Open'}
        </Button>
      ) : null}
    </Card>
  );
}
