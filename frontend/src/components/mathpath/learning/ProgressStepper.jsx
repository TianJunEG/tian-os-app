import React from 'react';
import { ProgressBar } from '../../ui';

export default function ProgressStepper({ current = 1, total = 1, elapsedSeconds = 0 }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm text-ink-600">
        <span className="font-mono tabular-nums">Question {current} of {total}</span>
        <span className="font-mono tabular-nums">{elapsedSeconds}s</span>
      </div>
      <ProgressBar value={current} max={Math.max(total, 1)} />
    </div>
  );
}
