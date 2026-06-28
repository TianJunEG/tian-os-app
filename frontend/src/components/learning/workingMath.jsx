import React from 'react';
import { drawMathStamp } from './drawingUtils';

/**
 * Shared math layer for the working surfaces.
 *
 * Both the inline scratchpad (`WorkingCanvas`) and the full-screen canvas
 * (`FullScreenWorkingMode`) render their math inserts from THIS module so the
 * two surfaces can never drift apart again: one stamp list, one set of
 * builders, one draggable object model, one renderer.
 */

// ── Canonical stamp list (single source of truth) ───────────────────────
// Operators first (no builder needed), then the multi-field notations.
export const MATH_STAMPS = [
  { id: 'plus', label: '+' },
  { id: 'minus', label: '−' },
  { id: 'times', label: '×' },
  { id: 'divide', label: '÷' },
  { id: 'equals', label: '=' },
  { id: 'fraction', label: 'x/y' },
  { id: 'subscript', label: 'xₐ' },
  { id: 'power', label: 'xᵇ' },
  { id: 'subscriptPower', label: 'xₐᵇ' },
  { id: 'mixed', label: 'xᵇ/a' },
  { id: 'root', label: 'ⁿ√x' },
  { id: 'degree', label: 'x°' },
  { id: 'angle', label: '∠' },
  { id: 'pi', label: 'π' },
  { id: 'theta', label: 'θ' },
];

// Stamps that open a popover to collect their fields before insertion. Stamps
// not listed here (operators, angle, pi, theta) insert immediately.
export const MATH_BUILDERS = {
  fraction: ['numerator', 'denominator'],
  subscript: ['base', 'subscript'],
  power: ['base', 'exponent'],
  subscriptPower: ['base', 'exponent', 'subscript'],
  mixed: ['base', 'numerator', 'denominator'],
  root: ['index', 'radicand'],
  degree: ['base'],
};

// Placeholder hints shown in each builder field.
const FIELD_PLACEHOLDER = {
  numerator: 'x', denominator: 'y', base: 'x', subscript: 'a',
  exponent: 'b', index: 'n', radicand: 'x',
};
// `mixed` reuses base/numerator/denominator but wants b/a hints for the fraction part.
const MIXED_PLACEHOLDER = { base: 'x', numerator: 'b', denominator: 'a' };

export const MATH_OBJECT_DEFAULT = { width: 132, height: 96 };
export const TEXT_OBJECT_DEFAULT = { width: 220, height: 48 };

// Where freshly-inserted objects land (canvas-pixel coords). The full-screen
// canvas is 1400×900; the inline scratchpad is 900×320, so it spawns inserts
// near the top-left with tighter spacing to stay on-canvas.
export const FULLSCREEN_LAYOUT = { x0: 740, y0: 300, dx: 130, dy: 110, cols: 5 };
export const SCRATCHPAD_LAYOUT = { x0: 44, y0: 56, dx: 116, dy: 74, cols: 6 };

// Single-glyph operators / symbols rendered as plain text in the DOM layer.
const GLYPH = { plus: '+', minus: '−', times: '×', divide: '÷', equals: '=', angle: '∠', pi: 'π', theta: 'θ' };

// ── Object model helpers ────────────────────────────────────────────────

export function createMathObject(template, values = {}, count = 0, layout = FULLSCREEN_LAYOUT) {
  const { x0, y0, dx, dy, cols } = layout;
  return {
    id: `math-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: template,
    x: x0 + ((count % cols) * dx),
    y: y0 + (Math.floor(count / cols) * dy),
    value: { ...values },
    colour: '#f97316',
    ...MATH_OBJECT_DEFAULT,
  };
}

export function createTextObject({ text = '', x = 740, y = 300, colour = '#111827' } = {}) {
  return {
    id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'text',
    text,
    x,
    y,
    colour,
    ...TEXT_OBJECT_DEFAULT,
  };
}

// Legacy support: math inserts used to be baked into the stroke list as
// `tool: 'stamp'` entries. Convert those back into draggable objects so working
// saved by the old inline canvas still opens with movable, editable inserts.
export function stampStrokeToMathObject(stroke, index = 0) {
  if (stroke?.tool !== 'stamp') return null;
  const point = stroke.points?.[0] || {};
  const { tool, template, points, colour, size, ...value } = stroke;
  return {
    id: stroke.id || `legacy-math-${index}`,
    type: template,
    x: Number(point.x ?? 740),
    y: Number(point.y ?? 300),
    value,
    colour: colour || '#f97316',
    width: stroke.width || MATH_OBJECT_DEFAULT.width,
    height: stroke.height || MATH_OBJECT_DEFAULT.height,
  };
}

export function normaliseMathObject(object, index = 0) {
  if (!object) return null;
  if (object.tool === 'stamp') return stampStrokeToMathObject(object, index);
  return {
    id: object.id || `math-${index}`,
    type: object.type || object.template || 'pi',
    x: Number(object.x ?? object.points?.[0]?.x ?? 740),
    y: Number(object.y ?? object.points?.[0]?.y ?? 300),
    text: object.type === 'text' ? String(object.text ?? object.value?.text ?? '') : undefined,
    value: object.value && typeof object.value === 'object' ? object.value : {},
    colour: object.colour || (object.type === 'text' ? '#111827' : '#f97316'),
    width: object.width || (object.type === 'text' ? TEXT_OBJECT_DEFAULT.width : MATH_OBJECT_DEFAULT.width),
    height: object.height || (object.type === 'text' ? TEXT_OBJECT_DEFAULT.height : MATH_OBJECT_DEFAULT.height),
  };
}

// ── Canvas renderer (used for PNG export) ───────────────────────────────

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 6).forEach((row, index) => ctx.fillText(row, x, y + index * lineHeight));
}

export function drawMathObject(ctx, object, { stampScale = 1 } = {}) {
  if (!object) return;
  if (object.type === 'text') {
    ctx.save();
    ctx.fillStyle = object.colour || '#111827';
    ctx.font = '600 30px Arial';
    wrapText(ctx, object.text || object.value?.text || '', object.x, object.y + 30, object.width || 260, 36);
    ctx.restore();
    return;
  }
  drawMathStamp(ctx, {
    tool: 'stamp',
    template: object.type,
    colour: object.colour,
    ...object.value,
    points: [{ x: object.x, y: object.y }],
  }, { stampScale });
}

// ── Draggable DOM object ────────────────────────────────────────────────

// Position an object either in absolute canvas pixels (full-screen, where a
// parent `transform: scale()` handles zoom) or as percentages of the canvas
// bounds (inline scratchpad, whose canvas is stretched by CSS width %, so a
// pixel overlay wouldn't line up). `scale` shrinks the rendered object so the
// full-screen-sized glyphs read sensibly on the smaller scratchpad.
function objectPositionStyle(object, bounds, scale) {
  const pos = bounds
    ? { left: `${(object.x / bounds.width) * 100}%`, top: `${(object.y / bounds.height) * 100}%` }
    : { left: `${object.x}px`, top: `${object.y}px` };
  if (scale && scale !== 1) {
    pos.transform = `scale(${scale})`;
    pos.transformOrigin = 'top left';
  }
  return pos;
}

export function MathObjectView({ object, selected, bounds = null, scale = 1, onPointerDown, onSelect, onDelete, onEdit, ...pointerHandlers }) {
  const value = object.value || {};
  const posStyle = objectPositionStyle(object, bounds, scale);
  if (object.type === 'text') {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Text label"
        data-testid="math-object-text"
        onPointerDown={onPointerDown}
        {...pointerHandlers}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.();
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onEdit?.();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onEdit?.();
          }
          if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            onDelete?.();
          }
        }}
        className={`pointer-events-auto absolute z-20 touch-none select-none rounded-lg px-2 py-1 text-2xl font-semibold leading-tight text-ink-900 ${
          selected ? 'outline outline-3 outline-orange-500 outline-offset-3 ring-4 ring-orange-200/80' : 'hover:outline hover:outline-2 hover:outline-orange-200'
        }`}
        style={{ ...posStyle, minWidth: `${object.width}px`, minHeight: `${object.height}px`, color: object.colour || '#111827' }}
      >
        <span className="whitespace-pre-wrap">{object.text || object.value?.text || 'Text'}</span>
        {selected && (
          <>
            <button
              type="button"
              aria-label="Edit selected text"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.();
              }}
              className="absolute -right-12 -top-3 grid h-8 w-8 place-items-center rounded-full bg-emerald-deep text-xs font-bold text-white shadow-card"
            >
              Edit
            </button>
            <button
              type="button"
              aria-label="Delete selected text"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.();
              }}
              className="absolute -right-3 -top-3 grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-base font-bold text-white shadow-card"
            >
              ×
            </button>
          </>
        )}
      </div>
    );
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Math object ${object.type}`}
      data-testid={`math-object-${object.type}`}
      onPointerDown={onPointerDown}
      {...pointerHandlers}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault();
          onDelete?.();
        }
      }}
      className={`pointer-events-auto absolute z-20 touch-none select-none rounded-xl px-3 py-2 font-serif text-[42px] leading-none text-orange-500 ${
        selected ? 'outline outline-3 outline-orange-500 outline-offset-4 ring-4 ring-orange-200/80' : 'hover:outline hover:outline-2 hover:outline-orange-200'
      }`}
      style={{ ...posStyle, minWidth: `${object.width}px`, minHeight: `${object.height}px` }}
    >
      {object.type === 'fraction' ? (
        <span className="inline-flex min-w-[72px] flex-col items-center text-[38px]">
          <span>{value.numerator || 'x'}</span>
          <span className="my-1 h-1 w-full rounded-full bg-orange-500" />
          <span>{value.denominator || 'y'}</span>
        </span>
      ) : object.type === 'subscript' ? (
        <span>{value.base || 'x'}<sub className="text-[26px]">{value.subscript || 'a'}</sub></span>
      ) : object.type === 'power' ? (
        <span>{value.base || 'x'}<sup className="text-[26px]">{value.exponent || 'b'}</sup></span>
      ) : object.type === 'subscriptPower' ? (
        <span>{value.base || 'x'}<sup className="text-[24px]">{value.exponent || 'b'}</sup><sub className="text-[24px]">{value.subscript || 'a'}</sub></span>
      ) : object.type === 'mixed' ? (
        <span className="inline-flex items-center gap-2">
          <span>{value.base || 'x'}</span>
          <span className="inline-flex min-w-[58px] flex-col items-center text-[32px]">
            <span>{value.numerator || 'b'}</span>
            <span className="my-1 h-1 w-full rounded-full bg-orange-500" />
            <span>{value.denominator || 'a'}</span>
          </span>
        </span>
      ) : object.type === 'root' ? (
        <span className="inline-flex items-start">
          <sup className="mr-1 text-[22px]">{value.index || 'n'}</sup>
          <span>√</span>
          <span className="border-t-4 border-orange-500 px-2 pt-1">{value.radicand || 'x'}</span>
        </span>
      ) : object.type === 'degree' ? (
        <span>{value.base || 'x'}°</span>
      ) : (
        <span>{GLYPH[object.type] || 'π'}</span>
      )}
      {selected && (
        <button
          type="button"
          aria-label="Delete selected math object"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.();
          }}
          className="absolute -right-3 -top-3 grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-base font-bold text-white shadow-card"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Builder popover input + toolbar ─────────────────────────────────────

export function MathDraftInput({ value, placeholder, onChange, onEnter, compact = false, autoFocus = false }) {
  return (
    <input
      autoFocus={autoFocus}
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
      onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.(); }}
      className={`${compact ? 'h-12 w-14 text-xl' : 'h-14 w-20 text-2xl'} rounded-xl border-2 border-transparent bg-surface-raised px-2 text-center font-serif italic text-ink-700 placeholder:text-ink-300 focus:border-orange-500 focus:bg-surface-raised focus:outline-none`}
      placeholder={placeholder}
    />
  );
}

function fieldPlaceholder(template, field) {
  if (template === 'mixed') return MIXED_PLACEHOLDER[field] || field;
  return FIELD_PLACEHOLDER[field] || field;
}

function BuilderFields({ template, mathDraft, setMathDraft, onInsert }) {
  const setField = (field, val) => setMathDraft((current) => ({ ...(current || { template }), [field]: val }));
  const input = (field, extra = {}) => (
    <MathDraftInput
      value={mathDraft[field]}
      placeholder={fieldPlaceholder(template, field)}
      onChange={(val) => setField(field, val)}
      onEnter={onInsert}
      {...extra}
    />
  );
  if (template === 'fraction') {
    return (
      <div className="flex flex-col items-center gap-3">
        {input('numerator', { autoFocus: true })}
        <div className="h-px w-20 bg-ink-300" aria-hidden="true" />
        {input('denominator')}
      </div>
    );
  }
  if (template === 'subscript') {
    return (
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        {input('base', { autoFocus: true })}
        {input('subscript', { compact: true })}
      </div>
    );
  }
  if (template === 'power') {
    return (
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        {input('base', { autoFocus: true })}
        {input('exponent', { compact: true })}
      </div>
    );
  }
  if (template === 'subscriptPower') {
    return (
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        {input('base', { autoFocus: true })}
        <div className="grid gap-2">
          {input('exponent', { compact: true })}
          {input('subscript', { compact: true })}
        </div>
      </div>
    );
  }
  if (template === 'mixed') {
    return (
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        {input('base', { autoFocus: true })}
        <div className="grid gap-2">
          {input('numerator', { compact: true })}
          {input('denominator', { compact: true })}
        </div>
      </div>
    );
  }
  if (template === 'root') {
    return (
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        {input('index', { compact: true, autoFocus: true })}
        <div className="flex items-center gap-1">
          <span className="font-serif text-6xl leading-none text-ink-900">√</span>
          <span className="h-px flex-1 self-start bg-ink-900" aria-hidden="true" />
          {input('radicand')}
        </div>
      </div>
    );
  }
  if (template === 'degree') {
    return (
      <div className="flex items-start justify-center gap-1">
        {input('base', { autoFocus: true })}
        <span className="font-serif text-3xl text-ink-500">°</span>
      </div>
    );
  }
  return null;
}

/**
 * Shared math-insert toolbar: the row of stamp buttons plus the builder popover.
 *
 * @param placement 'below' (full-screen, popover opens downward) or 'above'
 *   (inline scratchpad, popover opens upward so it isn't clipped by content
 *   beneath the canvas).
 * @param onInsert (template, values) => void — called when a stamp is chosen
 *   (immediately for operators, or after Insert for multi-field builders).
 */
export function MathStampBuilder({ mathDraft, setMathDraft, onInsert, placement = 'below' }) {
  const openTool = (template) => {
    const fields = MATH_BUILDERS[template];
    if (!fields) {
      onInsert(template);
      return;
    }
    const values = fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    setMathDraft((current) => (current?.template === template ? null : { template, ...values }));
  };

  const insertDraft = () => {
    const template = mathDraft?.template;
    const fields = MATH_BUILDERS[template] || [];
    const values = fields.reduce((acc, field) => ({ ...acc, [field]: String(mathDraft?.[field] || '').trim() }), {});
    if (!template || Object.values(values).some((val) => !val)) return;
    onInsert(template, values);
    setMathDraft(null);
  };

  const draftReady = Boolean(
    mathDraft?.template
    && (MATH_BUILDERS[mathDraft.template] || []).every((field) => String(mathDraft?.[field] || '').trim()),
  );

  const popoverPos = placement === 'above'
    ? 'bottom-full mb-3'
    : 'top-full mt-3';

  return (
    <div className="flex flex-wrap gap-2" aria-label="Math insert tools">
      {MATH_STAMPS.map((stamp) => (
        <div key={stamp.id} className="relative">
          {mathDraft?.template === stamp.id && MATH_BUILDERS[stamp.id] && (
            <div
              className={`absolute left-1/2 z-30 -translate-x-1/2 rounded-3xl border border-line-soft bg-white p-4 shadow-card ${popoverPos} ${
                stamp.id === 'fraction' ? 'w-36' : stamp.id === 'root' ? 'w-56' : 'w-52'
              }`}
              aria-label={`${stamp.label} builder`}
            >
              <BuilderFields template={stamp.id} mathDraft={mathDraft} setMathDraft={setMathDraft} onInsert={insertDraft} />
              <button
                type="button"
                disabled={!draftReady}
                onClick={insertDraft}
                className="mt-5 w-full text-center text-xl font-bold text-ink-300 transition enabled:text-orange-500 enabled:hover:text-orange-600 disabled:cursor-not-allowed"
              >
                Insert
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => openTool(stamp.id)}
            className={`grid h-11 min-w-12 place-items-center rounded-lg border px-3 font-serif text-xl font-semibold transition ${
              mathDraft?.template === stamp.id
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-line-soft bg-orange-50 text-orange-600 hover:border-orange-300 hover:bg-orange-100'
            }`}
            title={`Insert ${stamp.label}`}
          >
            {stamp.label}
          </button>
        </div>
      ))}
    </div>
  );
}
