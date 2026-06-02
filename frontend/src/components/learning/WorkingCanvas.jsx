import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Grid, Paperclip } from 'lucide-react';
import { Button, Badge } from '../ui';
import WorkingToolbar, { WORKING_COLOURS } from './WorkingToolbar';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 320;
const EMPTY_STROKES = [];
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

function drawStroke(ctx, stroke) {
  if (stroke?.tool === 'stamp') {
    drawMathStamp(ctx, stroke);
    return;
  }
  const points = stroke?.points || [];
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.18 : 1;
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : (stroke.colour || '#172554');
  const baseSize = Number(stroke.size || 3);
  ctx.lineWidth = stroke.tool === 'eraser'
    ? 24
    : stroke.tool === 'highlighter'
      ? Math.max(48, baseSize * 10)
      : stroke.tool === 'pencil'
        ? Math.max(1, baseSize - 1)
        : baseSize;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.restore();
}

function drawMathStamp(ctx, stroke) {
  const point = stroke?.points?.[0] || { x: 40, y: 56 };
  const colour = stroke.colour || '#f97316';
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.font = '30px Georgia, serif';
  const x = point.x;
  const y = point.y;
  if (stroke.template === 'fraction') {
    ctx.fillText('x', x + 16, y - 14);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 58, y);
    ctx.stroke();
    ctx.fillText('y', x + 16, y + 36);
  } else if (stroke.template === 'subscript') {
    ctx.fillText('x', x, y);
    ctx.font = '20px Georgia, serif';
    ctx.fillText('a', x + 25, y + 10);
  } else if (stroke.template === 'power') {
    ctx.fillText('x', x, y + 10);
    ctx.font = '20px Georgia, serif';
    ctx.fillText('b', x + 25, y - 10);
  } else if (stroke.template === 'subscriptPower') {
    ctx.fillText('x', x, y + 8);
    ctx.font = '18px Georgia, serif';
    ctx.fillText('b', x + 25, y - 14);
    ctx.fillText('a', x + 25, y + 20);
  } else if (stroke.template === 'mixed') {
    ctx.fillText('x', x, y + 10);
    ctx.font = '24px Georgia, serif';
    ctx.fillText('b', x + 34, y - 12);
    ctx.beginPath();
    ctx.moveTo(x + 28, y);
    ctx.lineTo(x + 74, y);
    ctx.stroke();
    ctx.fillText('a', x + 42, y + 30);
  } else if (stroke.template === 'root') {
    ctx.fillText('√x', x + 14, y + 8);
    ctx.font = '16px Georgia, serif';
    ctx.fillText('n', x, y - 6);
  } else if (stroke.template === 'degree') {
    ctx.fillText('x', x, y + 10);
    ctx.font = '20px Georgia, serif';
    ctx.fillText('°', x + 25, y - 8);
  } else if (stroke.template === 'angle') {
    ctx.fillText('∠', x, y + 10);
  } else if (stroke.template === 'pi') {
    ctx.fillText('π', x, y + 10);
  } else if (stroke.template === 'theta') {
    ctx.fillText('θ', x, y + 10);
  }
  ctx.restore();
}

function paintBackground(ctx, background) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = background === 'grid' ? '#dbe4ef' : '#e8eef7';
  ctx.lineWidth = 1;
  if (background === 'grid') {
    for (let x = 24; x < CANVAS_WIDTH; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
  }
  for (let y = 40; y < CANVAS_HEIGHT; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function exportCanvas(canvas, background) {
  const output = document.createElement('canvas');
  output.width = CANVAS_WIDTH;
  output.height = CANVAS_HEIGHT;
  const ctx = output.getContext('2d');
  paintBackground(ctx, background);
  ctx.drawImage(canvas, 0, 0);
  return output.toDataURL('image/png');
}

export default function WorkingCanvas({
  questionId = '',
  workingCode = '',
  required = false,
  allowNoWorking = true,
  readOnly = false,
  submittedImage = '',
  submittedStrokes = EMPTY_STROKES,
  initialSubmitted = null,
  initialWorkingNotNeeded = false,
  label = 'Show your working',
  compact = false,
  canvasClassName = '',
  showMathStamps = true,
  onSubmit,
  onChange,
}) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(WORKING_COLOURS[0]?.value || '#111827');
  const [brushSize, setBrushSize] = useState(4);
  const [background, setBackground] = useState('ruled');
  const [strokes, setStrokes] = useState(Array.isArray(submittedStrokes) ? submittedStrokes : []);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [submitted, setSubmitted] = useState(initialSubmitted ?? Boolean(submittedImage || submittedStrokes?.length));
  const [notNeeded, setNotNeeded] = useState(Boolean(initialWorkingNotNeeded));
  const [attachedImage, setAttachedImage] = useState(submittedImage || '');

  const status = useMemo(() => {
    if (readOnly) return 'Review';
    if (notNeeded) return 'Working not needed';
    if (submitted) return 'Workings submitted';
    return required ? 'Required before answer' : 'Optional';
  }, [notNeeded, readOnly, required, submitted]);

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

  useEffect(() => {
    const nextStrokes = Array.isArray(submittedStrokes) ? submittedStrokes : [];
    const nextSubmitted = initialSubmitted ?? Boolean(submittedImage || nextStrokes.length);
    const nextNotNeeded = Boolean(initialWorkingNotNeeded);
    drawingRef.current = false;
    currentStrokeRef.current = null;
    setStrokes(nextStrokes);
    setRedoStack([]);
    setSubmitted(nextSubmitted);
    setNotNeeded(nextNotNeeded);
    setAttachedImage(submittedImage || '');
    setZoom(1);
    scrollRef.current?.scrollTo?.({ left: 0, top: 0 });
    redraw(nextStrokes, submittedImage);
  }, [questionId, submittedImage, submittedStrokes, initialSubmitted, initialWorkingNotNeeded]);

  const pointFromEvent = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const emitChange = (next = {}) => {
    onChange?.({
      workingSubmitted: submitted,
      workingNotNeeded: notNeeded,
      workingStrokes: strokes,
      ...next,
    });
  };

  const beginStroke = (event) => {
    if (readOnly) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    drawingRef.current = true;
    currentStrokeRef.current = { tool, colour, size: brushSize, points: [point] };
  };

  const moveStroke = (event) => {
    if (!drawingRef.current || readOnly) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const stroke = currentStrokeRef.current;
    stroke.points.push(point);
    const ctx = canvasRef.current.getContext('2d');
    drawStroke(ctx, { ...stroke, points: stroke.points.slice(-2) });
  };

  const endStroke = () => {
    if (!drawingRef.current || readOnly) return;
    drawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (!stroke || stroke.points.length < 2) return;
    const nextStrokes = [...strokes, stroke];
    setStrokes(nextStrokes);
    setRedoStack([]);
    setSubmitted(false);
    setNotNeeded(false);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: nextStrokes });
  };

  const clear = () => {
    setStrokes([]);
    setRedoStack([]);
    setSubmitted(false);
    setNotNeeded(false);
    redraw([]);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: [], workingImage: '' });
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

  const submit = () => {
    const image = attachedImage || exportCanvas(canvasRef.current, background);
    const payload = {
      workingImage: image,
      workingStrokes: strokes,
      workingSubmitted: true,
      workingSubmittedAt: new Date().toISOString(),
      workingNotNeeded: false,
      source: attachedImage ? 'photo_attachment' : 'canvas_working',
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

  const insertMathStamp = (template) => {
    const stampCount = strokes.filter((stroke) => stroke.tool === 'stamp').length;
    const nextStroke = {
      tool: 'stamp',
      template,
      colour: '#f97316',
      size: 4,
      points: [{
        x: 36 + ((stampCount % 7) * 96),
        y: 72 + (Math.floor(stampCount / 7) * 76),
      }],
    };
    const nextStrokes = [...strokes, nextStroke];
    setStrokes(nextStrokes);
    setRedoStack([]);
    setSubmitted(false);
    setNotNeeded(false);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: nextStrokes });
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
      <div className="rounded-xl border border-hairline bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">Student workings</p>
          <Badge tone="neutral">{status}</Badge>
        </div>
        {submittedImage ? (
          <img src={submittedImage} alt="Student submitted workings" className="w-full rounded-lg border border-hairline bg-white object-contain" />
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink-500">No working image submitted.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-hairline bg-white ${compact ? 'p-2' : 'p-2.5 sm:p-3'}`} data-testid="working-canvas">
      <div className={`${compact ? 'mb-1.5' : 'mb-2'} flex flex-wrap items-center justify-between gap-2`}>
        <div>
          <p className="text-sm font-semibold text-navy-700">{label}</p>
          {!compact && <p className="text-xs text-ink-500">Use the pen to draw or calculate.</p>}
        </div>
        <Badge tone={required && !submitted && !notNeeded ? 'gold' : 'success'}>{status}</Badge>
      </div>
      {workingCode && (
        <div className="mb-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-gold-900">
          <p className="font-semibold">Working code: <span className="font-mono">{workingCode}</span></p>
          <p className="mt-1 text-xs">Write this code at the top of your working page before taking a photo.</p>
        </div>
      )}

      <div className={`${compact ? 'mb-1.5' : 'mb-2'} flex flex-wrap items-center gap-1.5`}>
        <Button size="s" className="min-h-[32px] px-2 text-xs" variant="ghost" icon={Paperclip} onClick={() => fileInputRef.current?.click()}>
          Attach photo
        </Button>
        <Button size="s" className="min-h-[32px] px-2 text-xs" variant="ghost" icon={Grid} onClick={() => setBackground((value) => (value === 'grid' ? 'ruled' : 'grid'))}>
          {background === 'grid' ? 'Ruled' : 'Grid'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={attachPhoto}
        />
        {attachedImage && <Badge tone="success">Photo attached</Badge>}
      </div>

      <div className={compact ? 'mb-1.5' : 'mb-2'}>
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
          onZoomReset={() => setZoom(1)}
          onPan={pan}
          compact={compact}
        />
      </div>

      {attachedImage && (
        <div className="mb-3 rounded-lg border border-hairline bg-slate-50 p-2">
          <img src={attachedImage} alt="Attached working photo" className="max-h-40 w-full rounded-md object-contain" />
        </div>
      )}

      {showMathStamps && <div className={`${compact ? 'mb-1.5' : 'mb-2'} flex flex-wrap gap-2`} aria-label="Math insert tools">
        {MATH_STAMPS.map((stamp) => (
          <button
            key={stamp.id}
            type="button"
            onClick={() => insertMathStamp(stamp.id)}
            className="grid h-11 min-w-12 place-items-center rounded-lg border border-hairline bg-orange-50 px-3 font-serif text-xl font-semibold text-orange-600 hover:border-orange-300 hover:bg-orange-100"
            title={`Insert ${stamp.label}`}
          >
            {stamp.label}
          </button>
        ))}
      </div>}

      <div ref={scrollRef} className={`overflow-auto rounded-lg border border-hairline ${background === 'grid' ? 'bg-[linear-gradient(#dbe4ef_1px,transparent_1px),linear-gradient(90deg,#dbe4ef_1px,transparent_1px)] bg-[size:24px_24px]' : 'bg-[repeating-linear-gradient(0deg,#fff,#fff_31px,#e8eef7_32px)]'}`}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`block touch-none rounded-lg ${canvasClassName || (compact ? 'h-[120px] sm:h-[150px]' : 'h-[220px] sm:h-[260px]')}`}
          style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
          onPointerDown={beginStroke}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          aria-label="Working canvas"
        />
      </div>

      <div className={`${compact ? 'mt-2' : 'mt-3'} grid grid-cols-1 gap-2 sm:grid-cols-2`}>
        {allowNoWorking && (
          <Button size="s" variant="secondary" onClick={markNotNeeded}>Working not needed</Button>
        )}
        <Button size="s" icon={Check} disabled={!strokes.length && !attachedImage} onClick={submit} className={allowNoWorking ? '' : 'sm:col-span-2'}>
          {submitted ? 'Redo/Edit workings' : 'Submit workings'}
        </Button>
      </div>
      {required && !submitted && !notNeeded && (
        <p className="mt-2 text-xs font-semibold text-gold-700">Show your working before submitting your answer.</p>
      )}
    </div>
  );
}
