import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button } from '../ui';
import WorkingToolbar, { WORKING_COLOURS } from './WorkingToolbar';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import {
  drawStroke,
  pointFromEvent as extractPoint,
  beginStrokeData,
  finalizeStroke,
} from './drawingUtils';
import {
  MATH_OBJECT_DEFAULT,
  TEXT_OBJECT_DEFAULT,
  MathObjectView,
  MathStampBuilder,
  drawMathObject,
  wrapText,
  createMathObject,
  createTextObject,
  stampStrokeToMathObject,
  normaliseMathObject,
} from './workingMath';

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

/* drawStroke → imported from ./drawingUtils */
const FS_STAMP_SCALE = CANVAS_WIDTH / 900; // ~1.56 for 1400px canvas

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

  // Block text selection while a stroke is active (prevents the pen from
  // highlighting text or stealing focus into an input).
  useEffect(() => {
    const blockSelection = (event) => { if (drawingRef.current) event.preventDefault(); };
    document.addEventListener('selectstart', blockSelection);
    return () => document.removeEventListener('selectstart', blockSelection);
  }, []);
  const strokesRef = useRef(Array.isArray(initialStrokes) ? initialStrokes : []);
  const mathObjectsRef = useRef([]);
  const objectDragRef = useRef(null);
  const textInputRef = useRef(null);
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
    if (typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges?.();
    if (toolRef.current === 'text') {
      event.stopPropagation();
      const point = pointFromEvent(event);
      // This pointerdown fires BEFORE the open input's blur, so commit any
      // in-progress draft synchronously (passing it explicitly to dodge the
      // setState race) before wiping it with the new empty draft. Without this
      // the new draft would clobber the old one and its text would be lost.
      // Mark the live input committed so its trailing blur becomes a no-op and
      // can't wipe the new draft we open below.
      if (textDraft && String(textDraft.text || '').trim()) {
        if (textInputRef.current) textInputRef.current.dataset.committed = 'true';
        saveTextDraft(textDraft);
      }
      setSelectedObjectId(null);
      setMathDraft(null);
      setTextDraft({
        id: null,
        x: point.x,
        y: point.y,
        text: '',
      });
      // React reuses the same input element across draft swaps, so the
      // `committed` flag set above would persist onto the new draft and silence
      // its blur-commit. Clear it once the new input is in place.
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          if (textInputRef.current) textInputRef.current.dataset.committed = 'false';
        });
      }
      // saveTextDraft flips the tool back to 'pen'; keep Text active so the new
      // draft we just opened stays editable.
      setTool('text');
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
    // Shade joins line/rectangle in the full-redraw path: it renders the whole
    // stroke at once as a flat even tone, so incremental tail-stamping (which
    // would darken self-overlaps) must not be used.
    if (stroke.tool === 'line' || stroke.tool === 'rectangle' || stroke.tool === 'shade') {
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
        ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.18 : 1;
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : (stroke.colour || '#172554');
        const baseSize = Number(stroke.size || 4);
        const hasPressure = (stroke.tool === 'pen' || stroke.tool === 'pencil') && tail[2].p != null;
        ctx.lineWidth = stroke.tool === 'eraser' ? 24
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
    mathObjectsRef.current.forEach((object) => drawMathObject(exportCtx, object, { stampScale: FS_STAMP_SCALE }));
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
    // The most recent reversible action is whichever sits on top of the redo
    // stack's mirror — but undo here pops live state. A Clear leaves nothing on
    // the canvas, so undoing it means restoring the snapshot it parked on the
    // redo stack (both strokes AND math objects). Otherwise undo just removes
    // the last stroke.
    const topRedo = redoStack.at(-1);
    if (topRedo && topRedo.type === 'clear') {
      setRedoStack((prev) => prev.slice(0, -1));
      const restoredStrokes = Array.isArray(topRedo.strokes) ? topRedo.strokes : [];
      const restoredObjects = Array.isArray(topRedo.mathObjects) ? topRedo.mathObjects : [];
      strokesRef.current = restoredStrokes;
      mathObjectsRef.current = restoredObjects;
      setStrokes(restoredStrokes);
      setMathObjects(restoredObjects);
      setSelectedObjectId(null);
      setHasCanvasMarks(restoredStrokes.length > 0 || restoredObjects.length > 0);
      setHasObjectEdit(restoredObjects.length > 0);
      return;
    }
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
    // A clear frame re-applies the wipe: drop both strokes and math objects.
    if (restored.type === 'clear') {
      strokesRef.current = [];
      mathObjectsRef.current = [];
      setStrokes([]);
      setMathObjects([]);
      setSelectedObjectId(null);
      setHasCanvasMarks(false);
      setHasObjectEdit(false);
      return;
    }
    setStrokes((prev) => {
      const next = [...prev, restored];
      strokesRef.current = next;
      setHasCanvasMarks(next.length > 0 || mathObjectsRef.current.length > 0);
      return next;
    });
  };

  const clear = () => {
    // Nothing to clear → no-op (also guards the confirm from firing on an empty
    // canvas).
    if (!strokesRef.current.length && !mathObjectsRef.current.length) return;
    // Clear is destructive, so confirm before wiping.
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm('Clear all working? You can undo this.');
      if (!ok) return;
    }
    // Snapshot BOTH strokes and math objects so the clear is reversible via
    // Undo/Redo (previously only strokes were saved and labels/stamps were lost).
    const snapshot = {
      type: 'clear',
      strokes: strokesRef.current,
      mathObjects: mathObjectsRef.current,
    };
    setRedoStack((prev) => [...prev, snapshot]);
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

  // `draft` defaults to the current state, but callers that need to commit the
  // in-progress draft synchronously (e.g. beginStroke flushing a label before
  // opening a new one) pass it explicitly to avoid a setState race where the
  // canvas pointerdown wipes `textDraft` before the input's blur reads it.
  const saveTextDraft = (draft = textDraft) => {
    const text = String(draft?.text || '').trim();
    if (!text) {
      setTextDraft(null);
      return;
    }
    if (draft.id) {
      updateMathObjects((prev) => prev.map((object) => (
        object.id === draft.id
          ? {
            ...object,
            text,
            value: { ...(object.value || {}), text },
            width: Math.max(TEXT_OBJECT_DEFAULT.width, Math.min(440, text.length * 15 + 36)),
          }
          : object
      )));
      setSelectedObjectId(draft.id);
    } else {
      const nextObject = createTextObject({
        text,
        x: draft.x,
        y: draft.y,
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
          canUndo={strokes.length > 0 || mathObjects.length > 0 || redoStack.some((frame) => frame?.type === 'clear')}
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
        {FEATURE_FLAGS.workingMathInserts && (
          <MathStampBuilder
            mathDraft={mathDraft}
            setMathDraft={setMathDraft}
            onInsert={addStamp}
            placement="below"
          />
        )}
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
              className="absolute inset-0 block touch-none select-none rounded-xl"
              style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, WebkitTouchCallout: 'none' }}
              aria-label="Full-screen working canvas"
              onContextMenu={(event) => event.preventDefault()}
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
                  ref={textInputRef}
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
