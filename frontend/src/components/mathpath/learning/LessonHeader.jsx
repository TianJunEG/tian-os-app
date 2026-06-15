import React from 'react';
import { Badge } from '../../ui';

export default function LessonHeader({ title, subtitle, module = 'MathPath Practice' }) {
  return (
    <header className="mb-3 space-y-2">
      <Badge tone="navy">{module}</Badge>
      <div>
        <h1 className="text-xl font-semibold text-emerald-deep sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-600">{subtitle}</p> : null}
      </div>
    </header>
  );
}
