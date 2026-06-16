import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const MIN_ZOOM = 0.9;
const MAX_ZOOM = 1.6;
const STEP = 0.1;

function clampZoom(value) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value) || 1));
}

export default function QuestionZoomControls({ value = 1, onChange }) {
  const zoom = clampZoom(value);
  const setZoom = (next) => onChange?.(clampZoom(next));

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-line-soft bg-white px-1 py-1 shadow-sm" aria-label="Question zoom controls">
      <button
        type="button"
        aria-label="Zoom question out"
        title="Zoom out"
        disabled={zoom <= MIN_ZOOM}
        onClick={() => setZoom(zoom - STEP)}
        className="grid h-10 w-10 place-items-center rounded-md text-ink-600 transition hover:bg-surface-raised hover:text-emerald-deep disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <span className="min-w-10 text-center font-mono text-xs text-ink-500">{Math.round(zoom * 100)}%</span>
      <button
        type="button"
        aria-label="Zoom question in"
        title="Zoom in"
        disabled={zoom >= MAX_ZOOM}
        onClick={() => setZoom(zoom + STEP)}
        className="grid h-10 w-10 place-items-center rounded-md text-ink-600 transition hover:bg-surface-raised hover:text-emerald-deep disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Reset question zoom"
        title="Reset zoom"
        disabled={zoom === 1}
        onClick={() => setZoom(1)}
        className="grid h-10 w-10 place-items-center rounded-md text-ink-600 transition hover:bg-surface-raised hover:text-emerald-deep disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}

