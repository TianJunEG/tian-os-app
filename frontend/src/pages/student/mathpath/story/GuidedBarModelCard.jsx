import React from 'react';
import { Badge, Card } from '../../../../components/ui';

function BarPreview({ model = {} }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removed = Math.max(0, Math.min(denominator, Number(model.removed || 0)));
  const remaining = denominator - removed;
  return (
    <div className="mt-3">
      <div className="grid overflow-hidden rounded-lg border border-ink-200" style={{ gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))` }}>
        {Array.from({ length: denominator }).map((_, index) => {
          const isRemoved = index < removed;
          return (
            <div
              key={index}
              className={`min-h-[44px] border-r border-ink-200 last:border-r-0 ${isRemoved ? 'bg-blue-200' : 'bg-white'}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-600">
        <span>Used: {removed}/{denominator}</span>
        <span>Left: {remaining}/{denominator}</span>
        {model.knownRemaining ? <span>Known left: {model.knownRemaining}</span> : null}
      </div>
      {model.subdivideRemainingBy ? (
        <div className="mt-3 rounded-lg border border-gold-200 bg-gold-50 p-2 text-xs text-gold-900">
          Remainder becomes the new amount. Split the remaining region into {model.subdivideRemainingBy} equal groups.
        </div>
      ) : null}
    </div>
  );
}

export default function GuidedBarModelCard({ model = {}, sequence = [], activeIndex = 0 }) {
  const safeIndex = Math.max(0, Math.min((sequence || []).length - 1, Number(activeIndex || 0)));
  const activeStep = sequence?.[safeIndex] || sequence?.[0] || null;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-700">Guided bar model</p>
          <p className="mt-1 text-sm text-ink-600">{activeStep?.prompt || 'Build the model one step at a time.'}</p>
        </div>
        {activeStep ? <Badge tone="gold">{safeIndex + 1}/{sequence.length}</Badge> : null}
      </div>
      <BarPreview model={model} />
      {!!sequence?.length && (
        <div className="mt-4 space-y-2">
          {sequence.map((step, index) => (
            <div
              key={step.id}
              className={`rounded-lg border px-3 py-2 text-sm ${index === safeIndex ? 'border-navy-300 bg-emerald-tint text-emerald-deep' : 'border-line-soft bg-white text-ink-600'}`}
            >
              <span className="font-semibold">{index + 1}. {step.title}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
