import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Grid, Paperclip, PenLine, ListOrdered, Calculator, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import WorkingToolbar, { WORKING_COLOURS } from './WorkingToolbar';
import MathStepsEditor from './MathStepsEditor';
import ColumnOperationsGrid, { makeEmptyGrid } from './ColumnOperationsGrid';
import {
  MathStampBuilder,
  MathObjectView,
  drawMathObject,
  createMathObject,
  createTextObject,
  stampStrokeToMathObject,
  normaliseMathObject,
  SCRATCHPAD_LAYOUT,
  TEXT_OBJECT_DEFAULT,
} from './workingMath';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  drawStroke,
  paintBackground,
  pointFromEvent as extractPoint,
  beginStrokeData,
  finalizeStroke,
} from './drawingUtils';

const WORKING_MODES = [
  { id: 'draw', label: 'Draw', icon: PenLine },
  { id: 'steps', label: 'Add Steps', icon: ListOrdered },
  { id: 'column', label: 'Four Ops', icon: Calculator },
];

const EMPTY_STROKES = [];
const EMPTY_OBJECTS = [];
// Math/text inserts are draggable DOM objects overlaid on the canvas, same as
// the full-screen canvas. They store canvas-pixel coords (0–900 × 0–320) and
// are positioned by percentage so they track the CSS-stretched canvas. Glyphs
// are sized for the 1400px full-screen canvas, so shrink them for the inline
// scratchpad.
const CANVAS_BOUNDS = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
const OBJECT_SCALE = 0.62;

// Chrome expressed as shared Tailwind tokens (each value equals its design
// token; the skeuomorphic notebook paper / grid / navy app-bar have no token so
// they stay as arbitrary values). Canvas geometry + pen colours stay inline.
const SHELL_CLASS = 'overflow-hidden rounded-shell border border-line bg-surface-white font-sans text-ink shadow-rest';
const APPBAR_CLASS = 'flex flex-wrap items-center justify-between gap-2 bg-[linear-gradient(160deg,#13223e,#101d36)] px-4 py-2.5';
const modeTabClass = (active) => `inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-chip px-3.5 text-[13px] font-bold ${active ? 'bg-[rgba(217,137,46,0.2)] text-[#f0c078]' : 'bg-transparent text-white/55'}`;
const TOOLBAR_CLASS = 'flex flex-wrap items-center gap-1.5 border-b border-line bg-surface-raised px-3.5 py-2';
const canvasWrapperClass = (bg) => `relative overflow-auto ${bg === 'grid'
  ? 'bg-[linear-gradient(#dbe4ef_1px,transparent_1px),linear-gradient(90deg,#dbe4ef_1px,transparent_1px)] bg-[length:24px_24px]'
  : 'bg-[repeating-linear-gradient(0deg,#f5f1e9,#f5f1e9_31px,#e7ddcb_32px)]'}`;
const FOOTER_CLASS = 'flex items-center justify-end gap-2.5 border-t border-line bg-surface-raised px-4 py-2.5';
const GOLD_BTN_CLASS = 'flex h-[42px] cursor-pointer items-center justify-center gap-[7px] rounded-pill2 bg-gold px-5 text-sm font-bold text-white shadow-gold disabled:cursor-default disabled:opacity-50';
const OUTLINE_BTN_CLASS = 'flex h-[42px] cursor-pointer items-center justify-center gap-[7px] rounded-pill2 border-[1.5px] border-[#cfd5dd] bg-surface-white px-5 text-sm font-bold text-body-muted';
const VIEW_CTRL_CLASS = 'flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-line bg-surface-white p-0 text-body-muted';
const statusBadgeClass = (tone) => `rounded-[7px] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.03em] ${tone === 'gold' ? 'bg-gold-tint text-gold-label' : tone === 'success' ? 'bg-emerald-tint text-emerald' : 'bg-[#eef0f4] text-body-muted'}`;

export function resolveWorkingRequirement(question = {}, sessionType = 'practice') {
  const explicitRequired = question.requiresWorking ?? question.workingRequired;
  const explicitAllowNoWorking = question.allowNoWorking ?? question.workingOptional;
  const type = String(question.workingType || '').toLowerCase();
  const normalizedSession = String(sessionType || 'practice').toLowerCase();

  if (normalizedSession === 'fluency' || normalizedSession === 'warmup') {
    return {
      required: explicitRequired === true && question.mentalMathEligible !== true,
      allowNoWorking: explicitAllowNoWorking !== false,
      type: type || 'optional',
    };
  }

  if (normalizedSession === 'diagnostic') {
    const required = explicitRequired === true && question.mentalMathEligible !== true;
    return {
      required,
      allowNoWorking: required ? explicitAllowNoWorking !== false : true,
      type: type || (required ? 'calculation' : 'optional'),
    };
  }

  const required = explicitRequired !== undefined
    ? Boolean(explicitRequired)
    : question.mentalMathEligible !== true;

  return {
    required,
    allowNoWorking: explicitAllowNoWorking !== undefined ? Boolean(explicitAllowNoWorking) : !required,
    type: type || (required ? 'calculation' : 'optional'),
  };
}

export default function WorkingCanvas({
  questionId = '',
  workingCode = '',
  required = false,
  allowNoWorking = true,
  readOnly = false,
  submittedImage = '',
  submittedStrokes = EMPTY_STROKES,
  initialMathObjects = EMPTY_OBJECTS,
  initialColumnGrid = null,
  initialMathSteps = null,
  initialSubmitted = null,
  initialWorkingNotNeeded = false,
  label = 'Show your working',
  compact = false,
  canvasClassName = '',
  showMathStamps = FEATURE_FLAGS.workingMathInserts,
  onSubmit,
  onChange,
}) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  // Palm rejection: only the pointer that started the active stroke may drive it.
  // A resting palm fires its own pointerdown/move; those are ignored mid-stroke.
  const activePointerRef = useRef(null);
  // Math/text objects mirror state into a ref so drag-move and export read the
  // latest list without waiting on a re-render.
  const mathObjectsRef = useRef([]);
  const objectDragRef = useRef(null);
  const textInputRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(WORKING_COLOURS[0]?.value || '#111827');
  const [brushSize, setBrushSize] = useState(4);
  const [background, setBackground] = useState('ruled');
  // Legacy stamp strokes (old baked inserts) are split out into draggable
  // objects so previously-saved working still opens with movable inserts.
  const [strokes, setStrokes] = useState(
    () => (Array.isArray(submittedStrokes) ? submittedStrokes : []).filter((s) => s?.tool !== 'stamp'),
  );
  const [mathObjects, setMathObjects] = useState(() => {
    const raw = Array.isArray(submittedStrokes) ? submittedStrokes : [];
    const saved = (Array.isArray(initialMathObjects) ? initialMathObjects : []).map(normaliseMathObject).filter(Boolean);
    const next = saved.length ? saved : raw.map((s, i) => stampStrokeToMathObject(s, i)).filter(Boolean);
    mathObjectsRef.current = next;
    return next;
  });
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [textDraft, setTextDraft] = useState(null);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [submitted, setSubmitted] = useState(initialSubmitted ?? Boolean(submittedImage || submittedStrokes?.length));
  const [notNeeded, setNotNeeded] = useState(Boolean(initialWorkingNotNeeded));
  const [attachedImage, setAttachedImage] = useState(submittedImage || '');
  const [mathDraft, setMathDraft] = useState(null);
  const [workingMode, setWorkingMode] = useState('draw');
  const [mathSteps, setMathSteps] = useState([{ id: 'step-1', text: '' }]);
  const [columnGrid, setColumnGrid] = useState(() => makeEmptyGrid('addition', 0));

  // Collapse an empty `initialMathObjects` (consumers often pass a fresh `[]`)
  // to one constant reference so the reset effect doesn't fire every render.
  const stableMathObjects = Array.isArray(initialMathObjects) && initialMathObjects.length ? initialMathObjects : EMPTY_OBJECTS;

  const status = useMemo(() => {
    if (readOnly) return 'Review';
    if (notNeeded) return 'Working not needed';
    if (submitted) return 'Workings submitted';
    return required ? 'Required before answer' : 'Optional';
  }, [notNeeded, readOnly, required, submitted]);

  const statusTone = useMemo(() => {
    if (submitted || notNeeded || readOnly) return 'success';
    if (required) return 'gold';
    return 'neutral';
  }, [submitted, notNeeded, readOnly, required]);

  const redraw = (nextStrokes = strokes, nextImage = submittedImage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (nextImage && !nextStrokes.length) {
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      };
      image.src = nextImage;
    }
    nextStrokes.forEach((stroke) => drawStroke(ctx, stroke));
  };

  useEffect(() => {
    redraw(strokes, submittedImage);
  }, [strokes, submittedImage, background]);

  // While a stroke is in progress, block text selection so dragging the pen
  // never highlights nearby text or steals focus into an input. Scoped to active
  // strokes, so normal selection (e.g. in the steps editor) still works.
  useEffect(() => {
    const blockSelection = (event) => { if (drawingRef.current) event.preventDefault(); };
    document.addEventListener('selectstart', blockSelection);
    return () => document.removeEventListener('selectstart', blockSelection);
  }, []);

  useEffect(() => {
    const rawStrokes = Array.isArray(submittedStrokes) ? submittedStrokes : [];
    const nextStrokes = rawStrokes.filter((s) => s?.tool !== 'stamp');
    const savedObjects = stableMathObjects.map(normaliseMathObject).filter(Boolean);
    const legacyObjects = rawStrokes.map((s, i) => stampStrokeToMathObject(s, i)).filter(Boolean);
    const nextObjects = savedObjects.length ? savedObjects : legacyObjects;
    const nextSubmitted = initialSubmitted ?? Boolean(submittedImage || nextStrokes.length || nextObjects.length);
    const nextNotNeeded = Boolean(initialWorkingNotNeeded);
    drawingRef.current = false;
    currentStrokeRef.current = null;
    activePointerRef.current = null;
    setStrokes(nextStrokes);
    mathObjectsRef.current = nextObjects;
    setMathObjects(nextObjects);
    setSelectedObjectId(null);
    setTextDraft(null);
    setRedoStack([]);
    setSubmitted(nextSubmitted);
    setNotNeeded(nextNotNeeded);
    setAttachedImage(submittedImage || '');
    setMathDraft(null);
    setColumnGrid(initialColumnGrid ?? makeEmptyGrid('addition', 0));
    setMathSteps(Array.isArray(initialMathSteps) && initialMathSteps.length ? initialMathSteps : [{ id: 'step-1', text: '' }]);
    setZoom(1);
    scrollRef.current?.scrollTo?.({ left: 0, top: 0 });
    redraw(nextStrokes, submittedImage);
  }, [questionId, submittedImage, submittedStrokes, stableMathObjects, initialColumnGrid, initialMathSteps, initialSubmitted, initialWorkingNotNeeded]);

  const pointFromEvent = (event) => extractPoint(event, canvasRef.current);

  const emitChange = (next = {}) => {
    onChange?.({
      workingSubmitted: submitted,
      workingNotNeeded: notNeeded,
      workingStrokes: strokes,
      workingMathObjects: mathObjects,
      workingSteps: mathSteps,
      workingColumnGrid: columnGrid,
      workingMode,
      ...next,
    });
  };

  // ── Math / text objects (draggable, shared with the full-screen canvas) ──

  const commitObjects = (nextObjects, { emit = true } = {}) => {
    mathObjectsRef.current = nextObjects;
    setMathObjects(nextObjects);
    if (emit) {
      setRedoStack([]);
      setSubmitted(false);
      setNotNeeded(false);
      emitChange({ workingSubmitted: false, workingNotNeeded: false, workingMathObjects: nextObjects });
    }
  };

  const addMathObject = (template, values = {}) => {
    const object = createMathObject(template, values, mathObjectsRef.current.length, SCRATCHPAD_LAYOUT);
    commitObjects([...mathObjectsRef.current, object]);
    setSelectedObjectId(object.id);
    setMathDraft(null);
  };

  const deleteObject = (id) => {
    commitObjects(mathObjectsRef.current.filter((object) => object.id !== id));
    setSelectedObjectId(null);
  };

  const beginObjectDrag = (event, object) => {
    if (readOnly) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedObjectId(object.id);
    const start = pointFromEvent(event);
    objectDragRef.current = { id: object.id, pointerId: event.pointerId, offsetX: start.x - object.x, offsetY: start.y - object.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveObjectDrag = (event) => {
    const drag = objectDragRef.current;
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    const point = pointFromEvent(event);
    // Drag updates skip emit/submitted churn — the final position is committed
    // on pointer up.
    commitObjects(mathObjectsRef.current.map((object) => (
      object.id === drag.id
        ? {
          ...object,
          x: Math.max(0, Math.min(CANVAS_WIDTH - 20, point.x - drag.offsetX)),
          y: Math.max(0, Math.min(CANVAS_HEIGHT - 20, point.y - drag.offsetY)),
        }
        : object
    )), { emit: false });
  };

  const endObjectDrag = (event) => {
    if (!objectDragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(objectDragRef.current.pointerId);
    objectDragRef.current = null;
    setSubmitted(false);
    emitChange({ workingSubmitted: false, workingMathObjects: mathObjectsRef.current });
  };

  const saveTextDraft = (draft = textDraft) => {
    const text = String(draft?.text || '').trim();
    if (!text) {
      setTextDraft(null);
      return;
    }
    let next;
    if (draft.id) {
      next = mathObjectsRef.current.map((object) => (
        object.id === draft.id
          ? {
            ...object,
            text,
            value: { ...(object.value || {}), text },
            width: Math.max(TEXT_OBJECT_DEFAULT.width, Math.min(440, text.length * 15 + 36)),
          }
          : object
      ));
      setSelectedObjectId(draft.id);
    } else {
      const object = createTextObject({ text, x: draft.x, y: draft.y, colour: colour || '#111827' });
      next = [...mathObjectsRef.current, object];
      setSelectedObjectId(object.id);
    }
    commitObjects(next);
    setTextDraft(null);
    setTool('pen');
  };

  const editTextObject = (object) => {
    if (!object || object.type !== 'text') return;
    setMathDraft(null);
    setTextDraft({ id: object.id, x: object.x, y: object.y, text: object.text || object.value?.text || '' });
    setSelectedObjectId(object.id);
  };

  const beginStroke = (event) => {
    if (readOnly) return;
    // Text tool: drop a label at the press point instead of starting a stroke.
    if (tool === 'text') {
      event.preventDefault();
      const point = pointFromEvent(event);
      if (textDraft && String(textDraft.text || '').trim()) {
        if (textInputRef.current) textInputRef.current.dataset.committed = 'true';
        saveTextDraft(textDraft);
      }
      setSelectedObjectId(null);
      setMathDraft(null);
      setTextDraft({ id: null, x: point.x, y: point.y, text: '' });
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => { if (textInputRef.current) textInputRef.current.dataset.committed = 'false'; });
      }
      return;
    }
    // Palm rejection: if a pointer is already drawing, ignore the new
    // pointerdown (e.g. a palm landing while the pen draws).
    if (drawingRef.current) return;
    event.preventDefault();
    // A fresh stroke deselects any active object.
    setSelectedObjectId(null);
    // Clear any selection the press may have started so writing never leaves
    // highlighted text or a caret stranded in a nearby input.
    if (typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges?.();
    drawingRef.current = true;
    if (event.pointerId !== undefined) {
      activePointerRef.current = event.pointerId;
      canvasRef.current?.setPointerCapture?.(event.pointerId);
    }
    currentStrokeRef.current = beginStrokeData(event, tool, colour, brushSize, canvasRef.current);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current || readOnly) return;
    // Ignore moves from any pointer other than the one that began the stroke.
    if (activePointerRef.current !== null && event.pointerId !== undefined
      && event.pointerId !== activePointerRef.current) return;
    event.preventDefault();
    const stroke = currentStrokeRef.current;
    const coalescedEvents = event.getCoalescedEvents?.() || [event];
    for (const e of coalescedEvents) {
      stroke.points.push(pointFromEvent(e));
    }
    const ctx = canvasRef.current.getContext('2d');
    const pts = stroke.points;
    if (stroke.tool === 'shade') {
      // Shade renders the WHOLE stroke at once (even, flat tone). Incremental
      // tail-stamps would re-composite overlaps and darken them, so redraw the
      // committed strokes then the full current shade stroke every move.
      redraw(strokes, submittedImage);
      drawStroke(ctx, stroke);
      return;
    }
    if (pts.length < 3) {
      drawStroke(ctx, { ...stroke, points: pts.slice(-2) });
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
  };

  const endStroke = (event) => {
    if (!drawingRef.current || readOnly) return;
    // Ignore pointerup/leave from a non-active pointer (e.g. a resting palm
    // lifting); only the pointer that owns the stroke may end it.
    if (activePointerRef.current !== null && event?.pointerId !== undefined
      && event.pointerId !== activePointerRef.current) return;
    if (event?.pointerId !== undefined) canvasRef.current?.releasePointerCapture?.(event.pointerId);
    // Suppress the trailing tap and drop any selection the lift started, so the
    // canvas isn't left fully highlighted (an iPad/stylus quirk where the next
    // stroke's first tap only clears the selection instead of drawing).
    event?.preventDefault?.();
    if (typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges?.();
    activePointerRef.current = null;
    drawingRef.current = false;
    const raw = currentStrokeRef.current;
    currentStrokeRef.current = null;
    const stroke = finalizeStroke(raw);
    if (!stroke) return;
    const nextStrokes = [...strokes, stroke];
    setStrokes(nextStrokes);
    setRedoStack([]);
    setSubmitted(false);
    setNotNeeded(false);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: nextStrokes });
  };

  const clear = () => {
    setStrokes([]);
    mathObjectsRef.current = [];
    setMathObjects([]);
    setSelectedObjectId(null);
    setTextDraft(null);
    setRedoStack([]);
    setSubmitted(false);
    setNotNeeded(false);
    redraw([]);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: [], workingMathObjects: [], workingImage: '' });
  };

  const undo = () => {
    const nextStrokes = strokes.slice(0, -1);
    const undone = strokes.at(-1);
    setStrokes(nextStrokes);
    if (undone) setRedoStack((prev) => [...prev, undone]);
    setSubmitted(false);
    redraw(nextStrokes);
    emitChange({ workingSubmitted: false, workingStrokes: nextStrokes });
  };

  const redo = () => {
    const restored = redoStack.at(-1);
    if (!restored) return;
    const nextStrokes = [...strokes, restored];
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes(nextStrokes);
    setSubmitted(false);
    redraw(nextStrokes);
    emitChange({ workingSubmitted: false, workingStrokes: nextStrokes });
  };

  const zoomBy = (delta) => setZoom((value) => Math.min(2, Math.max(0.75, Math.round((value + delta) * 100) / 100)));

  const pan = (direction) => {
    const node = scrollRef.current;
    if (!node) return;
    const delta = 96;
    const moves = {
      left: [-delta, 0],
      right: [delta, 0],
      up: [0, -delta],
      down: [0, delta],
    };
    const [left, top] = moves[direction] || moves.right;
    node.scrollBy({ left, top, behavior: 'smooth' });
  };

  const hasStepsContent = mathSteps.some((s) => s.text.trim());
  const hasColumnContent = columnGrid?.rows?.some((r) => r.some((c) => c)) || columnGrid?.dividend?.some((c) => c);
  const hasAnyWorking = strokes.length > 0 || mathObjects.length > 0 || attachedImage || hasStepsContent || hasColumnContent;

  // Flatten strokes + draggable objects onto a backgrounded canvas for the saved
  // PNG, matching the full-screen canvas's composite export.
  const exportWorkingImage = () => {
    const output = document.createElement('canvas');
    output.width = CANVAS_WIDTH;
    output.height = CANVAS_HEIGHT;
    const ctx = output.getContext('2d');
    paintBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, background);
    if (canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0);
    mathObjectsRef.current.forEach((object) => drawMathObject(ctx, object, { stampScale: 1 }));
    return output.toDataURL('image/png');
  };

  const submit = () => {
    const image = attachedImage || exportWorkingImage();
    const payload = {
      workingImage: image,
      workingStrokes: strokes,
      workingMathObjects: mathObjectsRef.current,
      workingSteps: mathSteps,
      workingColumnGrid: columnGrid,
      workingMode,
      workingSubmitted: true,
      workingSubmittedAt: new Date().toISOString(),
      workingNotNeeded: false,
      source: workingMode === 'steps' ? 'typed_steps' : workingMode === 'column' ? 'column_operations' : attachedImage ? 'photo_attachment' : 'canvas_working',
    };
    setSubmitted(true);
    setNotNeeded(false);
    onSubmit?.(payload);
    emitChange(payload);
  };

  const markNotNeeded = () => {
    const payload = {
      workingImage: '',
      workingStrokes: [],
      workingSubmitted: false,
      workingSubmittedAt: new Date().toISOString(),
      workingNotNeeded: true,
    };
    setNotNeeded(true);
    setSubmitted(false);
    onSubmit?.(payload);
    emitChange(payload);
  };

  const attachPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || '');
      const payload = {
        workingImage: image,
        workingStrokes: strokes,
        workingSubmitted: true,
        workingSubmittedAt: new Date().toISOString(),
        workingNotNeeded: false,
        source: 'photo_attachment',
        attachedFileName: file.name,
      };
      setAttachedImage(image);
      setSubmitted(true);
      setNotNeeded(false);
      onSubmit?.(payload);
      emitChange(payload);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  if (readOnly) {
    return (
      <div className={`${SHELL_CLASS} p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Student workings</span>
          <span className={statusBadgeClass('neutral')}>{status}</span>
        </div>
        {submittedImage ? (
          <img src={submittedImage} alt="Student submitted workings" className="w-full rounded-[10px] border border-line object-contain" />
        ) : (
          <div className="rounded-[10px] bg-surface-raised px-3.5 py-2.5 text-sm text-[#8a93a3]">
            No working image submitted.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={SHELL_CLASS} data-testid="working-canvas">
      {/* Dark app bar */}
      <div className={APPBAR_CLASS}>
        <div className="flex items-center gap-1">
          {WORKING_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setWorkingMode(mode.id)}
              className={modeTabClass(workingMode === mode.id)}
            >
              <mode.icon className="h-[15px] w-[15px]" />
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className={statusBadgeClass(statusTone)}>{status}</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.08] p-0 text-white/60"
            title="Attach photo"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={attachPhoto}
          />
        </div>
      </div>

      {/* Working code banner */}
      {workingCode && (
        <div className="border-b border-gold-border bg-gold-tint px-4 py-2 text-[13px] text-gold-label">
          <span className="font-bold">Working code: </span>
          <span className="font-mono">{workingCode}</span>
          <span className="ml-2 text-xs text-[#b8a076]">Write this code at the top of your working page before taking a photo.</span>
        </div>
      )}

      {/* Toolbar row */}
      {workingMode === 'draw' && (
        <div className={TOOLBAR_CLASS}>
          <WorkingToolbar
            tool={tool}
            colour={colour}
            brushSize={brushSize}
            canUndo={strokes.length > 0 || mathObjects.length > 0}
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
            onZoomReset={() => setZoom(1)}
            onPan={pan}
            compact={compact}
          />
          <span className="mx-1 h-[22px] w-px bg-line-strong" />
          <button type="button" onClick={() => setBackground((v) => v === 'grid' ? 'ruled' : 'grid')} className={VIEW_CTRL_CLASS} title={background === 'grid' ? 'Ruled lines' : 'Grid'}>
            <Grid className="h-3.5 w-3.5" />
          </button>
          <div className="ml-auto flex items-center gap-[3px]">
            <button type="button" onClick={() => zoomBy(-0.25)} className={VIEW_CTRL_CLASS} title="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[36px] text-center font-mono text-[11px] text-[#8a93a3]">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => zoomBy(0.25)} className={VIEW_CTRL_CLASS} title="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setZoom(1)} className={VIEW_CTRL_CLASS} title="Reset zoom">
              <RotateCcw className="h-[13px] w-[13px]" />
            </button>
          </div>
        </div>
      )}

      {/* Attached image banner */}
      {attachedImage && (
        <div className="border-b border-line bg-surface-raised p-2.5">
          <img src={attachedImage} alt="Attached working photo" className="max-h-[140px] w-full rounded-lg object-contain" />
        </div>
      )}

      {/* Math stamps — shared with the full-screen canvas via MathStampBuilder */}
      {workingMode === 'draw' && showMathStamps && (
        <div className="flex flex-wrap items-center gap-[7px] border-b border-line bg-surface-raised px-3.5 py-2">
          <MathStampBuilder
            mathDraft={mathDraft}
            setMathDraft={setMathDraft}
            onInsert={addMathObject}
            placement="above"
          />
        </div>
      )}

      {/* Canvas area */}
      {workingMode === 'draw' && (
        <div ref={scrollRef} className={canvasWrapperClass(background)}>
          {/* Inner box sized to the displayed canvas so the absolutely-positioned
              math-object layer lines up with canvas pixels at any zoom. The width
              tracks zoom and the height is the canvas bitmap, so both stay inline. */}
          <div
            className="relative min-w-full"
            style={{
              width: `${zoom * 100}%`,
              // Display height is decoupled from `compact` (which only controls
              // toolbar density) so the embedded canvas is never squashed below
              // its 320px bitmap. PSL/story/similar-question scratchpads all
              // render the same un-squashed height.
              height: CANVAS_HEIGHT,
              minHeight: CANVAS_HEIGHT,
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block h-full w-full touch-none select-none [-webkit-touch-callout:none]"
              onContextMenu={(event) => event.preventDefault()}
              onPointerDown={beginStroke}
              onPointerMove={moveStroke}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onPointerLeave={endStroke}
              aria-label="Working canvas"
            />
            {showMathStamps && (
              <div className="pointer-events-none absolute inset-0" aria-label="Math object layer">
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
                        setTool('pen');
                      }
                    }}
                    onBlur={(event) => {
                      if (event.currentTarget.dataset.committed === 'true') return;
                      saveTextDraft();
                    }}
                    className="pointer-events-auto absolute z-30 min-h-[34px] min-w-[130px] rounded-lg border-2 border-orange-500 bg-white px-2 py-1 text-base font-semibold text-ink-900 shadow-card focus:outline-none"
                    style={{ left: `${(textDraft.x / CANVAS_WIDTH) * 100}%`, top: `${(textDraft.y / CANVAS_HEIGHT) * 100}%`, color: colour }}
                    placeholder="Type label"
                    aria-label="Text label input"
                  />
                )}
                {mathObjects.map((object) => (
                  <MathObjectView
                    key={object.id}
                    object={object}
                    selected={selectedObjectId === object.id}
                    bounds={CANVAS_BOUNDS}
                    scale={OBJECT_SCALE}
                    onSelect={() => setSelectedObjectId(object.id)}
                    onDelete={() => deleteObject(object.id)}
                    onEdit={() => editTextObject(object)}
                    onPointerDown={(event) => beginObjectDrag(event, object)}
                    onPointerMove={moveObjectDrag}
                    onPointerUp={endObjectDrag}
                    onPointerCancel={endObjectDrag}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {workingMode === 'steps' && (
        <div className="bg-surface-raised p-3.5">
          <MathStepsEditor
            steps={mathSteps}
            onChange={(next) => {
              setMathSteps(next);
              setSubmitted(false);
              setNotNeeded(false);
              emitChange({ workingSubmitted: false, workingNotNeeded: false, workingSteps: next });
            }}
            readOnly={readOnly}
          />
        </div>
      )}

      {workingMode === 'column' && (
        <div className="bg-surface-raised p-3.5">
          <ColumnOperationsGrid
            grid={columnGrid}
            onChange={(next) => {
              setColumnGrid(next);
              setSubmitted(false);
              setNotNeeded(false);
              emitChange({ workingSubmitted: false, workingNotNeeded: false, workingColumnGrid: next });
            }}
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Footer */}
      <div className={FOOTER_CLASS}>
        {required && !submitted && !notNeeded && (
          <span className="mr-auto text-xs font-bold text-gold-label">
            Show your working before submitting your answer.
          </span>
        )}
        {allowNoWorking && (
          <button type="button" onClick={markNotNeeded} className={OUTLINE_BTN_CLASS}>
            Working not needed
          </button>
        )}
        <button
          type="button"
          disabled={!hasAnyWorking}
          onClick={submit}
          className={GOLD_BTN_CLASS}
        >
          <Check className="h-4 w-4" />
          {submitted ? 'Redo/Edit workings' : 'Save working'}
        </button>
      </div>
    </div>
  );
}
