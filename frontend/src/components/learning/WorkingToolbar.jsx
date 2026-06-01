import React from 'react';
import { Eraser, PenLine, RotateCcw, Trash2 } from 'lucide-react';
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

export default function WorkingToolbar({
  tool = 'pen',
  colour = WORKING_COLOURS[3].value,
  brushSize = 4,
  canUndo = false,
  onToolChange,
  onColourChange,
  onBrushSizeChange,
  onUndo,
  onClear,
}) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-3 shadow-resting" data-testid="working-toolbar">
      <div className="mb-2 flex flex-wrap gap-2">
        <Button size="s" className="min-h-[44px]" variant={tool === 'pen' ? 'primary' : 'secondary'} icon={PenLine} onClick={() => onToolChange?.('pen')}>Pen</Button>
        <Button size="s" className="min-h-[44px]" variant={tool === 'eraser' ? 'primary' : 'secondary'} icon={Eraser} onClick={() => onToolChange?.('eraser')}>Eraser</Button>
        <Button size="s" className="min-h-[44px]" variant="secondary" icon={RotateCcw} disabled={!canUndo} onClick={onUndo}>Undo</Button>
        <Button size="s" className="min-h-[44px]" variant="secondary" icon={Trash2} disabled={!canUndo} onClick={onClear}>Clear</Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Colour</p>
          <div className="flex flex-wrap gap-2">
            {WORKING_COLOURS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-label={item.label}
                onClick={() => onColourChange?.(item.value)}
                className={`min-h-[44px] min-w-[44px] rounded-xl border px-2 text-xs font-semibold ${colour === item.value ? 'border-navy-500 ring-2 ring-navy-500/20' : 'border-hairline'}`}
                style={{ backgroundColor: item.value, color: item.value === '#ca8a04' ? '#111827' : '#ffffff' }}
              >
                {item.label[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Brush</p>
          <div className="flex flex-wrap gap-2">
            {BRUSH_SIZES.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="s"
                className="min-h-[44px]"
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
