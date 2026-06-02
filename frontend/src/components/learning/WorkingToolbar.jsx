import React from 'react';
import { Eraser, Highlighter, Move, PenLine, Pencil, RotateCcw, RotateCw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui';

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
}) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-2 shadow-resting" data-testid="working-toolbar">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {WORKING_TOOLS.map((item) => (
          <Button
            key={item.id}
            size="s"
            className="min-h-[36px] px-2 text-xs"
            variant={tool === item.id ? 'primary' : 'secondary'}
            icon={item.icon}
            onClick={() => onToolChange?.(item.id)}
          >
            {item.label}
          </Button>
        ))}
        <Button size="s" className="min-h-[36px] px-2 text-xs" variant="secondary" icon={RotateCcw} disabled={!canUndo} onClick={onUndo}>Undo</Button>
        <Button size="s" className="min-h-[36px] px-2 text-xs" variant="secondary" icon={RotateCw} disabled={!canRedo} onClick={onRedo}>Redo</Button>
        <Button size="s" className="min-h-[36px] px-2 text-xs" variant="secondary" icon={Trash2} disabled={!canUndo} onClick={onClear}>Clear</Button>
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_1.2fr_1fr]">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Colour</p>
          <div className="flex flex-wrap gap-1.5">
            {WORKING_COLOURS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-label={item.label}
                onClick={() => onColourChange?.(item.value)}
                className={`min-h-[34px] min-w-[34px] rounded-lg border px-1 text-[11px] font-semibold ${colour === item.value ? 'border-navy-500 ring-2 ring-navy-500/20' : 'border-hairline'}`}
                style={{ backgroundColor: item.value, color: item.value === '#ca8a04' ? '#111827' : '#ffffff' }}
              >
                {item.label[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">View</p>
          <div className="flex flex-wrap gap-1.5">
            <Button size="s" className="min-h-[36px] px-2 text-xs" variant="secondary" icon={ZoomOut} onClick={onZoomOut}>Out</Button>
            <Button size="s" className="min-h-[36px] px-2 text-xs" variant="secondary" icon={ZoomIn} onClick={onZoomIn}>In</Button>
            <Button size="s" className="min-h-[36px] px-2 text-xs" variant="secondary" onClick={onZoomReset}>Reset</Button>
            <Button size="s" className="min-h-[36px] px-2 text-xs" variant="ghost" icon={Move} onClick={() => onPan?.('right')}>
              {Math.round(Number(zoom || 1) * 100)}%
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Brush</p>
          <div className="flex flex-wrap gap-1.5">
            {BRUSH_SIZES.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="s"
                className="min-h-[36px] px-2 text-xs"
                variant={brushSize === item.value ? 'primary' : 'secondary'}
                onClick={() => onBrushSizeChange?.(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
