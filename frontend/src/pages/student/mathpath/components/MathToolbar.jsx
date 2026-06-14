import React from 'react';

const DEFAULT_TOOLS = [
  { id: 'fraction', label: '/', title: 'Fraction' },
  { id: 'clear', label: 'Clear', title: 'Clear answer' },
];

const TOOL_LABELS = {
  fraction: { label: '/', title: 'Fraction' },
  clear: { label: 'Clear', title: 'Clear answer' },
  whole: { label: 'Whole', title: 'Whole Number' },
  subscript: { label: 'xₐ', title: 'Subscript' },
  power: { label: 'xᵇ', title: 'Exponent' },
  subscriptPower: { label: 'xₐᵇ', title: 'Subscript and exponent' },
  mixed: { label: 'Mixed', title: 'Mixed Number' },
  root: { label: 'ⁿ√x', title: 'Root' },
  degree: { label: 'x°', title: 'Degree' },
  angle: { label: '∠', title: 'Angle' },
  pi: { label: 'π', title: 'Pi' },
  theta: { label: 'θ', title: 'Theta' },
};

export const FULL_MATH_TOOL_IDS = [
  'fraction',
  'subscript',
  'power',
  'subscriptPower',
  'mixed',
  'root',
  'degree',
  'angle',
  'pi',
  'theta',
  'clear',
];

export const FRACTION_TOOL_IDS = ['fraction', 'mixed', 'whole', 'clear'];

export function toolDefinition(tool) {
  if (typeof tool === 'object' && tool?.id) return tool;
  const id = String(tool || '');
  const labelMeta = TOOL_LABELS[id] || { label: id, title: id };
  return { id, ...labelMeta };
}

export default function MathToolbar({
  tools = DEFAULT_TOOLS,
  disabled = false,
  compact = false,
  activeMode = '',
  onTool,
  label = 'Math input tools',
}) {
  const resolvedTools = tools.map(toolDefinition).filter((tool) => tool.id);
  const MODE_IDS = new Set(['fraction', 'mixed', 'whole']);

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1.5 ${compact ? 'mt-0' : 'mt-2'}`}
      aria-label={label}
    >
      {resolvedTools.map((tool) => {
        const isActive = MODE_IDS.has(tool.id) && activeMode === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            disabled={disabled}
            onClick={() => onTool?.(tool.id)}
            className={`${compact ? 'h-8 min-w-8 px-2 text-xs' : 'h-10 min-w-11 px-3 text-lg'} grid place-items-center rounded-lg border font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
              isActive
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-400/30'
                : 'border-hairline bg-white text-navy-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
            }`}
            title={tool.title}
            aria-label={tool.title}
            aria-pressed={MODE_IDS.has(tool.id) ? isActive : undefined}
          >
            <span className={tool.id === 'clear' ? 'font-sans' : 'font-serif'}>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}
