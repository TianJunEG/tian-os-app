import React from 'react';
import { Button } from '../../ui';

export default function PrimaryActionBar({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
  helperText,
}) {
  return (
    <div className="fixed inset-x-3 bottom-[82px] z-30 md:static md:inset-auto md:bottom-auto md:mt-4">
      <div className="rounded-2xl border border-line-soft bg-surface-white p-3 shadow-card md:rounded-xl md:shadow-rest" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {helperText ? <p className="mb-2 text-xs text-ink-500">{helperText}</p> : null}
        <div className={`grid gap-2 ${secondaryLabel ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {secondaryLabel ? (
            <Button
              type="button"
              variant="secondary"
              size="m"
              className="min-h-[44px] w-full"
              disabled={secondaryDisabled}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            size="m"
            className="min-h-[44px] w-full"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
