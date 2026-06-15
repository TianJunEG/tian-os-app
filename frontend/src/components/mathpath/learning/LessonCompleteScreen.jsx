import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card } from '../../ui';

export default function LessonCompleteScreen({
  title = 'Session Complete',
  message,
  summaryLines = [],
  primaryLabel = 'Continue',
  onPrimary,
  secondaryLabel,
  onSecondary,
  children,
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success-100 text-success-700">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-center text-2xl font-semibold text-emerald-deep">{title}</h2>
      {message ? <p className="mx-auto mt-2 max-w-lg text-center text-sm text-ink-600">{message}</p> : null}

      {summaryLines.length ? (
        <div className="mt-5 space-y-2 rounded-xl border border-line-soft bg-surface-raised p-4 text-sm text-ink-700">
          {summaryLines.map((line) => (
            <p key={line.label}>
              <span className="font-semibold">{line.label}:</span> {line.value}
            </p>
          ))}
        </div>
      ) : null}

      {children ? <div className="mt-4 space-y-3">{children}</div> : null}

      <div className={`mt-5 grid gap-2 ${secondaryLabel ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {secondaryLabel ? (
          <Button size="m" variant="secondary" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
        <Button size="m" onClick={onPrimary}>
          {primaryLabel}
        </Button>
      </div>
    </Card>
  );
}
