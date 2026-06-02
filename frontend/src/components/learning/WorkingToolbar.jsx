import React from 'react';
import { Eraser, Highlighter, Move, PenLine, Pencil, RotateCcw, RotateCw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

export const WORKING_COLOURS = [
  { label: 'Black', value: '#111827' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Cyan', value: '#0891b2' },
];

export const BRUSH_SIZES = [
  { label: 'Small', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Large', value: 8 },
];

export const WORKING_TOOLS = [
  { id: 'pen', label: 'Pen', icon: PenLine },
  { id: 'pencil', label: 'Pencil', icon: Pencil },
  { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
];

function compactButtonClass(active = false, disabled = false, dense = false) {
  return [
    `inline-flex ${dense ? 'h-7 px-1.5' : 'h-8 px-2'} items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition`,
    active ? 'border-navy-700 bg-navy-700 text-white' : 'border-hairline bg-white text-navy-700 hover:bg-navy-50',
    disabled ? 'cursor-not-allowed opacity-45 hover:bg-white' : '',
  ].join(' ');
}

export default function WorkingToolbar({
  tool = 'pen',
  colour = WORKING_COLOURS[3].value,
  brushSize = 4,
  canUndo = false,
  canRedo = false,
  zoom = 1,
  onToolChange,
  onColourChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPan,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="rounded-lg border border-hairline bg-white p-1.5 shadow-resting" data-testid="working-toolbar">
        <div className="flex flex-wrap items-center gap-1">
          {WORKING_TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              className={compactButtonClass(tool === item.id, false, true)}
              onClick={() => onToolChange?.(item.id)}
            >
              <item.icon className="h-4 w-4" />
            </button>
          ))}
          <span className="mx-0.5 h-6 w-px bg-hairline" aria-hidden="true" />
          {WORKING_COLOURS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-label={item.label}
              onClick={() => onColourChange?.(item.value)}
              className={`h-7 w-7 rounded-md border text-[10px] font-semibold ${colour === item.value ? 'border-navy-500 ring-2 ring-navy-500/20' : 'border-hairline'}`}
              style={{ backgroundColor: item.value, color: item.value === '#ca8a04' ? '#111827' : '#ffffff' }}
            >
              {item.label[0]}
            </button>
          ))}
          <span className="mx-0.5 h-6 w-px bg-hairline" aria-hidden="true" />
          {BRUSH_SIZES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-label={`Brush ${item.label}`}
              title={`Brush ${item.label}`}
              className={compactButtonClass(brushSize === item.value, false, true)}
              onClick={() => onBrushSizeChange?.(item.value)}
            >
              {item.label[0]}
            </button>
          ))}
          <span className="mx-0.5 h-6 w-px bg-hairline" aria-hidden="true" />
          <button type="button" aria-label="Undo" title="Undo" disabled={!canUndo} className={compactButtonClass(false, !canUndo, true)} onClick={onUndo}><RotateCcw className="h-4 w-4" /></button>
          <button type="button" aria-label="Redo" title="Redo" disabled={!canRedo} className={compactButtonClass(false, !canRedo, true)} onClick={onRedo}><RotateCw className="h-4 w-4" /></button>
          <button type="button" aria-label="Clear" title="Clear" disabled={!canUndo} className={compactButtonClass(false, !canUndo, true)} onClick={onClear}><Trash2 className="h-4 w-4" /></button>
          <button type="button" aria-label="Zoom out" title="Zoom out" className={compactButtonClass(false, false, true)} onClick={onZoomOut}><ZoomOut className="h-4 w-4" /></button>
          <button type="button" aria-label="Zoom in" title="Zoom in" className={compactButtonClass(false, false, true)} onClick={onZoomIn}><ZoomIn className="h-4 w-4" /></button>
          <button type="button" aria-label="Reset zoom" title="Reset zoom" className={compactButtonClass(false, false, true)} onClick={onZoomReset}>{Math.round(Number(zoom || 1) * 100)}%</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-white p-2 shadow-resting" data-testid="working-toolbar">
      <div className="mb-2 flex flex-wrap gap-1">
        {WORKING_TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            title={item.label}
            className={compactButtonClass(tool === item.id)}
            onClick={() => onToolChange?.(item.id)}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden 2xl:inline">{item.label}</span>
          </button>
        ))}
        <button type="button" aria-label="Undo" title="Undo" disabled={!canUndo} className={compactButtonClass(false, !canUndo)} onClick={onUndo}><RotateCcw className="h-4 w-4" /></button>
        <button type="button" aria-label="Redo" title="Redo" disabled={!canRedo} className={compactButtonClass(false, !canRedo)} onClick={onRedo}><RotateCw className="h-4 w-4" /></button>
        <button type="button" aria-label="Clear" title="Clear" disabled={!canUndo} className={compactButtonClass(false, !canUndo)} onClick={onClear}><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[0.85fr_1fr_0.85fr]">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">Colour</p>
          <div className="flex flex-wrap gap-1">
            {WORKING_COLOURS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-label={item.label}
                onClick={() => onColourChange?.(item.value)}
                className={`h-7 w-7 rounded-md border text-[10px] font-semibold ${colour === item.value ? 'border-navy-500 ring-2 ring-navy-500/20' : 'border-hairline'}`}
                style={{ backgroundColor: item.value, color: item.value === '#ca8a04' ? '#111827' : '#ffffff' }}
              >
                {item.label[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">View</p>
          <div className="flex flex-wrap gap-1">
            <button type="button" className={compactButtonClass()} title="Zoom out" onClick={onZoomOut}><ZoomOut className="h-4 w-4" /><span>Out</span></button>
            <button type="button" className={compactButtonClass()} title="Zoom in" onClick={onZoomIn}><ZoomIn className="h-4 w-4" /><span>In</span></button>
            <button type="button" className={compactButtonClass()} onClick={onZoomReset}>Reset</button>
            <button type="button" className={compactButtonClass()} title="Pan" onClick={() => onPan?.('right')}>
              <Move className="h-4 w-4" />
              {Math.round(Number(zoom || 1) * 100)}%
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">Brush</p>
          <div className="flex flex-wrap gap-1">
            {BRUSH_SIZES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={compactButtonClass(brushSize === item.value)}
                onClick={() => onBrushSizeChange?.(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
