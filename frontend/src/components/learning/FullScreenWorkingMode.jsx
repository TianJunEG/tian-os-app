import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button } from '../ui';
import WorkingToolbar, { WORKING_COLOURS } from './WorkingToolbar';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import {
  drawStroke,
  drawMathStamp,
  pointFromEvent as extractPoint,
  beginStrokeData,
  finalizeStroke,
} from './drawingUtils';

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;
// Lowest zoom allowed — small enough that the full 1400px-wide canvas fits a
// phone viewport (≈360px → ~0.24) without horizontal scrolling.
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

// Zoom that fits the canvas width into the scroll container (minus padding).
function fitZoomFor(el) {
  if (!el || !el.clientWidth) return 1;
  const usable = el.clientWidth - 24; // p-3 padding both sides
  return Math.min(1, Math.max(MIN_ZOOM, Math.round((usable / CANVAS_WIDTH) * 100) / 100));
}
const QUESTION_PANEL = { x: 48, y: 44, width: 620, height: 170 };
const EMPTY_STROKES = [];
const EMPTY_MATH_OBJECTS = [];
const MATH_STAMPS = [
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

const MATH_BUILDERS = {
  fraction: ['numerator', 'denominator'],
  subscript: ['base', 'subscript'],
  power: ['base', 'exponent'],
  subscriptPower: ['base', 'exponent', 'subscript'],
  mixed: ['base', 'numerator', 'denominator'],
  root: ['index', 'radicand'],
  degree: ['base'],
};

const MATH_OBJECT_DEFAULT = {
  width: 132,
  height: 96,
};

const TEXT_OBJECT_DEFAULT = {
  width: 220,
  height: 48,
};

/* drawStroke → imported from ./drawingUtils */
const FS_STAMP_SCALE = CANVAS_WIDTH / 900; // ~1.56 for 1400px canvas

function drawMathObject(ctx, object) {
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
  }, { stampScale: FS_STAMP_SCALE });
}

/* drawMathStamp → imported from ./drawingUtils (used with FS_STAMP_SCALE) */

function createMathObject(template, values = {}, count = 0) {
  return {
    id: `math-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: template,
    x: 740 + ((count % 5) * 130),
    y: 300 + (Math.floor(count / 5) * 110),
    value: { ...values },
    colour: '#f97316',
    ...MATH_OBJECT_DEFAULT,
  };
}

function createTextObject({ text = '', x = 740, y = 300, colour = '#111827' } = {}) {
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

function stampStrokeToMathObject(stroke, index = 0) {
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

function normaliseMathObject(object, index = 0) {
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

function MathObjectView({ object, selected, onPointerDown, onSelect, onDelete, onEdit, ...pointerHandlers }) {
  const value = object.value || {};
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
        style={{ left: `${object.x}px`, top: `${object.y}px`, minWidth: `${object.width}px`, minHeight: `${object.height}px`, color: object.colour || '#111827' }}
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
      style={{ left: `${object.x}px`, top: `${object.y}px`, minWidth: `${object.width}px`, minHeight: `${object.height}px` }}
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
      ) : object.type === 'angle' ? (
        <span>∠</span>
      ) : object.type === 'theta' ? (
        <span>θ</span>
      ) : (
        <span>π</span>
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

function paintPaper(ctx) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = '#e8eef7';
  ctx.lineWidth = 1;
  for (let y = 48; y < CANVAS_HEIGHT; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

function paintQuestionPanel(ctx, questionText) {
  ctx.save();
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(QUESTION_PANEL.x, QUESTION_PANEL.y, QUESTION_PANEL.width, QUESTION_PANEL.height, 18);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(QUESTION_PANEL.x, QUESTION_PANEL.y, QUESTION_PANEL.width, QUESTION_PANEL.height);
    ctx.strokeRect?.(QUESTION_PANEL.x, QUESTION_PANEL.y, QUESTION_PANEL.width, QUESTION_PANEL.height);
  }
  ctx.fillStyle = '#475569';
  ctx.font = '600 18px Arial';
  ctx.fillText('Question', QUESTION_PANEL.x + 28, QUESTION_PANEL.y + 38);
  ctx.fillStyle = '#111827';
  ctx.font = '24px Arial';
  wrapText(ctx, questionText, QUESTION_PANEL.x + 28, QUESTION_PANEL.y + 78, QUESTION_PANEL.width - 56, 34);
  ctx.restore();
}

function MathDraftInput({ value, placeholder, onChange, onEnter, compact = false, autoFocus = false }) {
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

export default function FullScreenWorkingMode({
  open = false,
  questionId = '',
  questionText = '',
  questionContent = null,
  questionSnapshot = null,
  initialStrokes = EMPTY_STROKES,
  initialMathObjects = EMPTY_MATH_OBJECTS,
  onClose,
  onSave,
}) {
  const stableStrokes = initialStrokes?.length ? initialStrokes : EMPTY_STROKES;
  const stableMathObjects = initialMathObjects?.length ? initialMathObjects : EMPTY_MATH_OBJECTS;
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const strokesRef = useRef(Array.isArray(initialStrokes) ? initialStrokes : []);
  const mathObjectsRef = useRef([]);
  const objectDragRef = useRef(null);
  const toolRef = useRef('pen');
  const colourRef = useRef(WORKING_COLOURS[0].value);
  const brushSizeRef = useRef(4);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(WORKING_COLOURS[0].value);
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState(Array.isArray(initialStrokes) ? initialStrokes : []);
  const [mathObjects, setMathObjects] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [hasCanvasMarks, setHasCanvasMarks] = useState(Array.isArray(initialStrokes) && initialStrokes.length > 0);
  const [hasObjectEdit, setHasObjectEdit] = useState(false);
  const [mathDraft, setMathDraft] = useState(null);
  const [textDraft, setTextDraft] = useState(null);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colourRef.current = colour; }, [colour]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const redraw = (nextStrokes = strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    nextStrokes.forEach((stroke) => drawStroke(ctx, stroke, { stampScale: FS_STAMP_SCALE }));
  };

  useEffect(() => {
    if (!open) return;
    const rawStrokes = Array.isArray(stableStrokes) ? stableStrokes : [];
    const legacyMathObjects = rawStrokes.map(stampStrokeToMathObject).filter(Boolean);
    const nextStrokes = rawStrokes.filter((stroke) => stroke?.tool !== 'stamp');
    const savedMathObjects = Array.isArray(stableMathObjects)
      ? stableMathObjects.map(normaliseMathObject).filter(Boolean)
      : [];
    const nextMathObjects = savedMathObjects.length ? savedMathObjects : legacyMathObjects;
    strokesRef.current = nextStrokes;
    mathObjectsRef.current = nextMathObjects;
    setStrokes(nextStrokes);
    setMathObjects(nextMathObjects);
    setSelectedObjectId(null);
    setRedoStack([]);
    // Fit the canvas to the viewport on open so phones see the whole working
    // area, not just the top-left corner. rAF lets the scroll container lay out
    // first (its width is 0 during this commit).
    setZoom(fitZoomFor(scrollRef.current));
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => setZoom(fitZoomFor(scrollRef.current)));
    }
    setHasCanvasMarks(nextStrokes.length > 0 || nextMathObjects.length > 0);
    setHasObjectEdit(false);
    setMathDraft(null);
    setTextDraft(null);
  }, [open, questionId, stableStrokes, stableMathObjects]);

  useEffect(() => {
    if (open) redraw(strokes);
  }, [open, strokes]);

  const pointFromEvent = (event) => extractPoint(event, canvasRef.current, CANVAS_WIDTH, CANVAS_HEIGHT);

  const beginStroke = (event) => {
    event.preventDefault();
    if (toolRef.current === 'text') {
      event.stopPropagation();
      const point = pointFromEvent(event);
      setSelectedObjectId(null);
      setMathDraft(null);
      setTextDraft({
        id: null,
        x: point.x,
        y: point.y,
        text: '',
      });
      return;
    }
    drawingRef.current = true;
    if (event.pointerId !== undefined) canvasRef.current?.setPointerCapture?.(event.pointerId);
    currentStrokeRef.current = beginStrokeData(
      event, toolRef.current, colourRef.current, brushSizeRef.current,
      canvasRef.current, CANVAS_WIDTH, CANVAS_HEIGHT,
    );
    setHasCanvasMarks(true);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const stroke = currentStrokeRef.current;
    const coalescedEvents = event.getCoalescedEvents?.() || [event];
    for (const e of coalescedEvents) {
      stroke.points.push(pointFromEvent(e));
    }
    setHasCanvasMarks(true);
    if (stroke.tool === 'line' || stroke.tool === 'rectangle') {
      redraw(strokesRef.current);
      drawStroke(canvasRef.current.getContext('2d'), stroke, { stampScale: FS_STAMP_SCALE });
    } else {
      const pts = stroke.points;
      const ctx = canvasRef.current.getContext('2d');
      if (pts.length < 3) {
        drawStroke(ctx, { ...stroke, points: pts.slice(-2) }, { stampScale: FS_STAMP_SCALE });
      } else {
        const tail = pts.slice(-3);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.18 : stroke.tool === 'shade' ? 0.24 : 1;
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : (stroke.colour || '#172554');
        const baseSize = Number(stroke.size || 4);
        const hasPressure = (stroke.tool === 'pen' || stroke.tool === 'pencil') && tail[2].p != null;
        ctx.lineWidth = stroke.tool === 'eraser' ? 24
          : stroke.tool === 'shade' ? Math.max(34, baseSize * 8)
          : stroke.tool === 'highlighter' ? Math.max(48, baseSize * 10)
          : stroke.tool === 'pencil' ? Math.max(1, baseSize - 1)
          : hasPressure ? baseSize * (0.3 + (tail[2].p ?? 0.5) * 0.7)
          : baseSize;
        const mid0 = { x: (tail[0].x + tail[1].x) / 2, y: (tail[0].y + tail[1].y) / 2 };
        const mid1 = { x: (tail[1].x + tail[2].x) / 2, y: (tail[1].y + tail[2].y) / 2 };
        ctx.beginPath();
        ctx.moveTo(mid0.x, mid0.y);
        ctx.quadraticCurveTo(tail[1].x, tail[1].y, mid1.x, mid1.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const endStroke = (event) => {
    if (!drawingRef.current) return;
    event?.preventDefault?.();
    if (event?.pointerId !== undefined) canvasRef.current?.releasePointerCapture?.(event.pointerId);
    drawingRef.current = false;
    const raw = currentStrokeRef.current;
    currentStrokeRef.current = null;
    const stroke = finalizeStroke(raw);
    if (!stroke) return;
    setStrokes((prev) => {
      const next = [...prev, stroke];
      strokesRef.current = next;
      setRedoStack([]);
      return next;
    });
  };

  const beginPointerStroke = (event) => {
    beginStroke(event);
  };

  const movePointerStroke = (event) => {
    moveStroke(event);
  };

  const endPointerStroke = (event) => {
    endStroke(event);
  };

  const beginMouseStroke = (event) => {
    beginStroke(event);
  };

  const moveMouseStroke = (event) => {
    moveStroke(event);
  };

  const endMouseStroke = (event) => {
    endStroke(event);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (drawingRef.current) endStroke();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;
    const exportCtx = exportCanvas.getContext('2d');
    paintPaper(exportCtx);
    paintQuestionPanel(exportCtx, questionText);
    strokesRef.current.forEach((stroke) => drawStroke(exportCtx, stroke, { stampScale: FS_STAMP_SCALE }));
    mathObjectsRef.current.forEach((object) => drawMathObject(exportCtx, object));
    onSave?.({
      workingImage: exportCanvas?.toDataURL('image/png') || canvas?.toDataURL('image/png') || '',
      workingStrokes: strokesRef.current,
      workingMathObjects: mathObjectsRef.current,
      workingSubmitted: true,
      workingSubmittedAt: new Date().toISOString(),
      source: 'fullscreen_working',
      canvasDimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      questionSnapshot: {
        text: questionText,
        ...(questionSnapshot || {}),
        renderMode: 'worksheet_dom_overlay_export_composite',
      },
      viewportDimensions: typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : null,
      orientation: typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    });
  };

  const undo = () => {
    setStrokes((prev) => {
      const undone = prev.at(-1);
      const next = prev.slice(0, -1);
      if (undone) setRedoStack((stack) => [...stack, undone]);
      strokesRef.current = next;
      setHasCanvasMarks(next.length > 0 || mathObjectsRef.current.length > 0);
      return next;
    });
  };

  const redo = () => {
    const restored = redoStack.at(-1);
    if (!restored) return;
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes((prev) => {
      const next = [...prev, restored];
      strokesRef.current = next;
      setHasCanvasMarks(next.length > 0 || mathObjectsRef.current.length > 0);
      return next;
    });
  };

  const clear = () => {
    if (strokesRef.current.length) setRedoStack((prev) => [...prev, ...strokesRef.current]);
    strokesRef.current = [];
    mathObjectsRef.current = [];
    setStrokes([]);
    setMathObjects([]);
    setSelectedObjectId(null);
    setHasCanvasMarks(false);
    setHasObjectEdit(false);
    setTextDraft(null);
  };

  const zoomBy = (delta) => setZoom((value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((value + delta) * 100) / 100)));
  const resetZoom = () => setZoom(fitZoomFor(scrollRef.current));

  const pan = (direction) => {
    const node = scrollRef.current;
    if (!node) return;
    const delta = 128;
    const moves = {
      left: [-delta, 0],
      right: [delta, 0],
      up: [0, -delta],
      down: [0, delta],
    };
    const [left, top] = moves[direction] || moves.right;
    node.scrollBy({ left, top, behavior: 'smooth' });
  };

  const addStamp = (template, values = {}) => {
    const nextObject = createMathObject(template, values, mathObjectsRef.current.length);
    const next = [...mathObjectsRef.current, nextObject];
    mathObjectsRef.current = next;
    setMathObjects(next);
    setSelectedObjectId(nextObject.id);
    setHasObjectEdit(true);
    setRedoStack([]);
    setHasCanvasMarks(true);
    setMathDraft(null);
  };

  const updateMathObjects = (updater) => {
    setMathObjects((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      mathObjectsRef.current = next;
      setHasCanvasMarks(strokesRef.current.length > 0 || next.length > 0);
      setHasObjectEdit(true);
      return next;
    });
  };

  const saveTextDraft = () => {
    const text = String(textDraft?.text || '').trim();
    if (!text) {
      setTextDraft(null);
      return;
    }
    if (textDraft.id) {
      updateMathObjects((prev) => prev.map((object) => (
        object.id === textDraft.id
          ? {
            ...object,
            text,
            value: { ...(object.value || {}), text },
            width: Math.max(TEXT_OBJECT_DEFAULT.width, Math.min(440, text.length * 15 + 36)),
          }
          : object
      )));
      setSelectedObjectId(textDraft.id);
    } else {
      const nextObject = createTextObject({
        text,
        x: textDraft.x,
        y: textDraft.y,
        colour: colourRef.current || '#111827',
      });
      updateMathObjects((prev) => [...prev, nextObject]);
      setSelectedObjectId(nextObject.id);
    }
    setTextDraft(null);
    setTool('pen');
  };

  const editTextObject = (object) => {
    if (!object || object.type !== 'text') return;
    setMathDraft(null);
    setTextDraft({
      id: object.id,
      x: object.x,
      y: object.y,
      text: object.text || object.value?.text || '',
    });
    setSelectedObjectId(object.id);
  };

  const deleteSelectedObject = () => {
    if (!selectedObjectId) return;
    updateMathObjects((prev) => prev.filter((object) => object.id !== selectedObjectId));
    setSelectedObjectId(null);
  };

  const beginObjectDrag = (event, object) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedObjectId(object.id);
    const start = pointFromEvent(event);
    objectDragRef.current = {
      id: object.id,
      pointerId: event.pointerId,
      offsetX: start.x - object.x,
      offsetY: start.y - object.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveObjectDrag = (event) => {
    const drag = objectDragRef.current;
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    const point = pointFromEvent(event);
    updateMathObjects((prev) => prev.map((object) => (
      object.id === drag.id
        ? {
          ...object,
          x: Math.max(0, Math.min(CANVAS_WIDTH - 40, point.x - drag.offsetX)),
          y: Math.max(0, Math.min(CANVAS_HEIGHT - 40, point.y - drag.offsetY)),
        }
        : object
    )));
  };

  const endObjectDrag = (event) => {
    if (!objectDragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(objectDragRef.current.pointerId);
    objectDragRef.current = null;
  };

  const openMathTool = (template) => {
    const fields = MATH_BUILDERS[template];
    if (!fields) {
      addStamp(template);
      return;
    }
    const values = fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    setMathDraft((current) => current?.template === template ? null : { template, ...values });
  };

  const insertDraftMath = () => {
    const template = mathDraft?.template;
    const fields = MATH_BUILDERS[template] || [];
    const values = fields.reduce((acc, field) => ({ ...acc, [field]: String(mathDraft?.[field] || '').trim() }), {});
    if (!template || Object.values(values).some((value) => !value)) return;
    addStamp(template, values);
  };

  const draftReady = Boolean(mathDraft?.template && (MATH_BUILDERS[mathDraft.template] || []).every((field) => String(mathDraft?.[field] || '').trim()));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Full-screen working"
      containerClassName="p-1 sm:p-2"
      className="flex !h-[calc(100vh-0.5rem)] !max-h-[calc(100vh-0.5rem)] !w-[calc(100vw-0.5rem)] !max-w-[calc(100vw-0.5rem)] flex-col overflow-hidden rounded-xl [&>div:first-child]:p-3 sm:[&>div:first-child]:p-4 [&>div:nth-child(2)]:min-h-0 [&>div:nth-child(2)]:flex-1 [&>div:nth-child(2)]:overflow-hidden [&>div:nth-child(2)]:p-2 sm:[&>div:nth-child(2)]:p-3 [&>div:last-child]:px-2 [&>div:last-child]:pt-2 [&>div:last-child]:[padding-bottom:max(0.5rem,env(safe-area-inset-bottom,0px))] sm:[&>div:last-child]:px-3 sm:[&>div:last-child]:pt-3"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!hasCanvasMarks && !strokes.length && !hasObjectEdit} onClick={save}>Save Working</Button>
        </>
      )}
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        <WorkingToolbar
          tool={tool}
          colour={colour}
          brushSize={brushSize}
          canUndo={strokes.length > 0}
          canRedo={redoStack.length > 0}
          zoom={zoom}
          onToolChange={setTool}
          onColourChange={setColour}
          onBrushSizeChange={setBrushSize}
          onUndo={undo}
          onRedo={redo}
          onClear={clear}
          onZoomIn={() => zoomBy(0.25)}
          onZoomOut={() => zoomBy(-0.25)}
          onZoomReset={resetZoom}
          onPan={pan}
        />
        {FEATURE_FLAGS.workingMathInserts && <div className="flex flex-wrap gap-2" aria-label="Math insert tools">
          {MATH_STAMPS.map((stamp) => (
            <div key={stamp.id} className="relative">
              {mathDraft?.template === stamp.id && (
                <div
                  className={`absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 rounded-3xl border border-line-soft bg-white p-4 shadow-card ${
                    stamp.id === 'fraction' ? 'w-36' : stamp.id === 'root' ? 'w-56' : 'w-52'
                  }`}
                  aria-label={`${stamp.label} builder`}
                >
                  {stamp.id === 'fraction' ? (
                    <div className="flex flex-col items-center gap-3">
                      <MathDraftInput autoFocus value={mathDraft.numerator} placeholder="x" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), numerator: value }))} onEnter={insertDraftMath} />
                      <div className="h-px w-20 bg-ink-300" aria-hidden="true" />
                      <MathDraftInput value={mathDraft.denominator} placeholder="y" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), denominator: value }))} onEnter={insertDraftMath} />
                    </div>
                  ) : stamp.id === 'subscript' ? (
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), base: value }))} onEnter={insertDraftMath} />
                      <MathDraftInput value={mathDraft.subscript} placeholder="a" compact onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), subscript: value }))} onEnter={insertDraftMath} />
                    </div>
                  ) : stamp.id === 'power' ? (
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), base: value }))} onEnter={insertDraftMath} />
                      <MathDraftInput value={mathDraft.exponent} placeholder="b" compact onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), exponent: value }))} onEnter={insertDraftMath} />
                    </div>
                  ) : stamp.id === 'subscriptPower' ? (
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), base: value }))} onEnter={insertDraftMath} />
                      <div className="grid gap-2">
                        <MathDraftInput value={mathDraft.exponent} placeholder="b" compact onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), exponent: value }))} onEnter={insertDraftMath} />
                        <MathDraftInput value={mathDraft.subscript} placeholder="a" compact onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), subscript: value }))} onEnter={insertDraftMath} />
                      </div>
                    </div>
                  ) : stamp.id === 'mixed' ? (
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), base: value }))} onEnter={insertDraftMath} />
                      <div className="grid gap-2">
                        <MathDraftInput value={mathDraft.numerator} placeholder="b" compact onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), numerator: value }))} onEnter={insertDraftMath} />
                        <MathDraftInput value={mathDraft.denominator} placeholder="a" compact onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), denominator: value }))} onEnter={insertDraftMath} />
                      </div>
                    </div>
                  ) : stamp.id === 'root' ? (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                      <MathDraftInput autoFocus value={mathDraft.index} placeholder="n" compact onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), index: value }))} onEnter={insertDraftMath} />
                      <div className="flex items-center gap-1">
                        <span className="font-serif text-6xl leading-none text-ink-900">√</span>
                        <span className="h-px flex-1 self-start bg-ink-900" aria-hidden="true" />
                        <MathDraftInput value={mathDraft.radicand} placeholder="x" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), radicand: value }))} onEnter={insertDraftMath} />
                      </div>
                    </div>
                  ) : stamp.id === 'degree' ? (
                    <div className="flex items-start justify-center gap-1">
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(value) => setMathDraft((current) => ({ ...(current || { template: stamp.id }), base: value }))} onEnter={insertDraftMath} />
                      <span className="font-serif text-3xl text-ink-500">°</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!draftReady}
                    onClick={insertDraftMath}
                    className="mt-5 w-full text-center text-xl font-bold text-ink-300 transition enabled:text-orange-500 enabled:hover:text-orange-600 disabled:cursor-not-allowed"
                  >
                    Insert
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => openMathTool(stamp.id)}
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
        </div>}
        {(questionContent || questionText) && (
          <div className="flex-shrink-0 rounded-xl border border-line-soft bg-surface-raised px-4 py-2.5">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Q</span>
            <span className="text-base font-medium text-ink-900">{questionContent || questionText}</span>
          </div>
        )}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto rounded-xl border border-line-soft bg-surface-raised p-3">
          <div
            className="relative rounded-xl bg-white shadow-rest"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              marginRight: `${CANVAS_WIDTH * (zoom - 1)}px`,
              marginBottom: `${CANVAS_HEIGHT * (zoom - 1)}px`,
              backgroundImage: 'linear-gradient(#e8eef7 1px, transparent 1px)',
              backgroundSize: '100% 36px',
            }}
            data-testid="worksheet-working-space"
            onClick={() => setSelectedObjectId(null)}
          >
            <div
              className="absolute rounded-2xl border border-line-strong bg-surface-raised p-7"
              style={{
                left: `${QUESTION_PANEL.x}px`,
                top: `${QUESTION_PANEL.y}px`,
                width: `${QUESTION_PANEL.width}px`,
                minHeight: `${QUESTION_PANEL.height}px`,
              }}
              data-testid="worksheet-question-panel"
            >
              <p className="text-lg font-semibold text-body-soft">Question</p>
              <div className="mt-3 whitespace-pre-wrap text-2xl leading-snug text-ink-900">
                {questionContent || questionText}
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute inset-0 block touch-none rounded-xl"
              style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
              aria-label="Full-screen working canvas"
              onPointerDown={beginPointerStroke}
              onPointerMove={movePointerStroke}
              onPointerUp={endPointerStroke}
              onPointerCancel={endPointerStroke}
              onPointerLeave={endPointerStroke}
              onMouseDown={beginMouseStroke}
              onMouseMove={moveMouseStroke}
              onMouseUp={endMouseStroke}
              onMouseLeave={endMouseStroke}
            />
            <div className="pointer-events-none absolute inset-0 z-10 touch-none" aria-label="Math object layer">
              {textDraft && (
                <input
                  autoFocus
                  value={textDraft.text}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => setTextDraft((current) => ({ ...(current || {}), text: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.dataset.committed = 'true';
                      saveTextDraft();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setTextDraft(null);
                    }
                  }}
                  onBlur={(event) => {
                    if (event.currentTarget.dataset.committed === 'true') return;
                    saveTextDraft();
                  }}
                  className="pointer-events-auto absolute z-30 min-h-[44px] min-w-[180px] rounded-lg border-2 border-orange-500 bg-white px-3 py-2 text-2xl font-semibold text-ink-900 shadow-card focus:outline-none"
                  style={{ left: `${textDraft.x}px`, top: `${textDraft.y}px`, color: colour }}
                  placeholder="Type label"
                  aria-label="Text label input"
                />
              )}
              {mathObjects.map((object) => (
                <MathObjectView
                  key={object.id}
                  object={object}
                  selected={selectedObjectId === object.id}
                  onSelect={() => setSelectedObjectId(object.id)}
                  onDelete={() => {
                    updateMathObjects((prev) => prev.filter((item) => item.id !== object.id));
                    setSelectedObjectId(null);
                  }}
                  onEdit={() => editTextObject(object)}
                  onPointerDown={(event) => beginObjectDrag(event, object)}
                  onPointerMove={moveObjectDrag}
                  onPointerUp={endObjectDrag}
                  onPointerCancel={endObjectDrag}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
