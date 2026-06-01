import React from 'react';
import { Badge, Card } from '../../../../components/ui';

export default function ModelDrawingPromptCard({ fact = null, fallbackPrompt = '' }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-700">Model prompt</p>
          <p className="mt-1 text-sm text-ink-600">
            {fact?.modelPrompt || fallbackPrompt || 'Tap a highlighted fact to see how it should go into the model.'}
          </p>
        </div>
        {fact?.type ? <Badge tone="navy">{String(fact.type).replace(/_/g, ' ')}</Badge> : null}
      </div>
      {fact?.strategyTag ? (
        <p className="mt-2 text-xs text-ink-500">Strategy: {String(fact.strategyTag).replace(/_/g, ' ')}</p>
      ) : null}
    </Card>
  );
}
