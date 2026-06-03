import React from 'react';
import { Maximize2, Trash2 } from 'lucide-react';
import { Button } from '../ui';

export default function WorkingPreviewCard({
  workingImage = '',
  workingSubmitted = false,
  onOpen,
  onRemove,
  openLabel = 'Open full-screen working',
}) {
  const hasWorking = Boolean(workingSubmitted || workingImage);

  return (
    <div className="rounded-xl border border-hairline bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-800">{hasWorking ? 'Working saved' : 'Working'}</p>
          <p className="mt-1 text-xs text-ink-500">
            {hasWorking ? 'This working will be submitted with your answer.' : 'No working saved yet.'}
          </p>
        </div>
        <Button size="s" icon={Maximize2} onClick={onOpen}>
          {hasWorking ? 'Edit working' : openLabel}
        </Button>
      </div>

      {hasWorking && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
          {workingImage ? (
            <img
              src={workingImage}
              alt="Saved working preview"
              className="max-h-[120px] w-full rounded-lg border border-hairline bg-white object-contain sm:w-40"
            />
          ) : (
            <div className="flex h-24 w-full items-center justify-center rounded-lg border border-hairline bg-slate-50 text-xs font-semibold text-ink-400 sm:w-40">
              Working saved
            </div>
          )}
          {onRemove && (
            <Button size="s" variant="secondary" icon={Trash2} onClick={onRemove}>
              Remove working
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
