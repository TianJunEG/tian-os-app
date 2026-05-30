import React from 'react';
import { X } from 'lucide-react';
import { Card, Button } from '../../ui';

function previewLabel(file) {
  if (!file) return 'Unknown file';
  return `${file.name || 'unnamed'} (${Math.max(1, Math.round((file.size || 0) / 1024))} KB)`;
}

export default function WorkingReviewCard({ items = [], onRemove, onReplace }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-700">Uploaded Pages</p>
        <span className="text-xs text-ink-500">{items.length} page(s)</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink-500">No files uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-hairline p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-700">Page {idx + 1}</p>
                  <p className="truncate text-xs text-ink-500">{previewLabel(item.file)}</p>
                </div>
                <button
                  onClick={() => onRemove?.(item.id)}
                  className="rounded-md p-1 text-ink-400 hover:bg-slate-100 hover:text-ink-700"
                  aria-label={`Remove page ${idx + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {item.previewUrl && item.type?.startsWith('image/') && (
                <img src={item.previewUrl} alt={`Uploaded working page ${idx + 1}`} className="mt-2 max-h-44 w-full rounded-lg object-contain" />
              )}
              {!item.type?.startsWith('image/') && (
                <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-600">PDF document</div>
              )}
              <div className="mt-2">
                <Button size="s" variant="ghost" onClick={() => onReplace?.(item.id)}>Replace</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

