import React from 'react';
import { Card } from '../../ui';

export default function TaskCard({
  prompt,
  visual,
  answerArea,
  confidenceArea,
  workingRequired = false,
}) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="text-lg leading-relaxed text-ink-900 sm:text-xl">
        {prompt}
      </div>

      {visual ? <div className="mt-4">{visual}</div> : null}

      {workingRequired ? (
        <p className="mt-4 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
          Working is expected. Upload your working at the end of this session.
        </p>
      ) : null}

      <div className="mt-4">
        {answerArea}
      </div>

      {confidenceArea ? <div className="mt-4">{confidenceArea}</div> : null}
    </Card>
  );
}
