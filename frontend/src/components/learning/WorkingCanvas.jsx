import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eraser, Grid, PenLine, RotateCcw, Trash2 } from 'lucide-react';
import { Button, Badge } from '../ui';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 320;

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
    return {
      required: explicitRequired === true,
      allowNoWorking: explicitAllowNoWorking !== false,
      type: type || (explicitRequired ? 'calculation' : 'optional'),
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
  const points = stroke?.points || [];
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : '#172554';
  ctx.lineWidth = stroke.tool === 'eraser' ? 24 : 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
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
  required = false,
  allowNoWorking = true,
  readOnly = false,
  submittedImage = '',
  submittedStrokes = [],
  label = 'Show your working',
  onSubmit,
  onChange,
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [background, setBackground] = useState('ruled');
  const [strokes, setStrokes] = useState(Array.isArray(submittedStrokes) ? submittedStrokes : []);
  const [submitted, setSubmitted] = useState(Boolean(submittedImage || submittedStrokes?.length));
  const [notNeeded, setNotNeeded] = useState(false);

  const status = useMemo(() => {
    if (readOnly) return 'Review';
    if (notNeeded) return 'Working not needed';
    if (submitted) return 'Workings submitted';
    return required ? 'Required before answer' : 'Optional';
  }, [notNeeded, readOnly, required, submitted]);

  const redraw = (nextStrokes = strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    nextStrokes.forEach((stroke) => drawStroke(ctx, stroke));
  };

  useEffect(() => {
    redraw(strokes);
  }, [questionId, background]);

  useEffect(() => {
    setStrokes(Array.isArray(submittedStrokes) ? submittedStrokes : []);
    setSubmitted(Boolean(submittedImage || submittedStrokes?.length));
    setNotNeeded(false);
  }, [questionId, submittedImage, submittedStrokes]);

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
    currentStrokeRef.current = { tool, points: [point] };
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
    setSubmitted(false);
    setNotNeeded(false);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: nextStrokes });
  };

  const clear = () => {
    setStrokes([]);
    setSubmitted(false);
    setNotNeeded(false);
    redraw([]);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: [], workingImage: '' });
  };

  const undo = () => {
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    setSubmitted(false);
    redraw(nextStrokes);
    emitChange({ workingSubmitted: false, workingStrokes: nextStrokes });
  };

  const submit = () => {
    const image = exportCanvas(canvasRef.current, background);
    const payload = {
      workingImage: image,
      workingStrokes: strokes,
      workingSubmitted: true,
      workingSubmittedAt: new Date().toISOString(),
      workingNotNeeded: false,
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
    <div className="mt-5 rounded-xl border border-hairline bg-white p-3 sm:p-4" data-testid="working-canvas">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-navy-700">{label}</p>
          <p className="text-xs text-ink-500">Use the pen to draw or calculate.</p>
        </div>
        <Badge tone={required && !submitted && !notNeeded ? 'gold' : 'success'}>{status}</Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="s" variant={tool === 'pen' ? 'primary' : 'secondary'} icon={PenLine} onClick={() => setTool('pen')}>Pen</Button>
        <Button size="s" variant={tool === 'eraser' ? 'primary' : 'secondary'} icon={Eraser} onClick={() => setTool('eraser')}>Eraser</Button>
        <Button size="s" variant="secondary" icon={RotateCcw} disabled={!strokes.length} onClick={undo}>Undo</Button>
        <Button size="s" variant="secondary" icon={Trash2} disabled={!strokes.length && !submitted} onClick={clear}>Clear</Button>
        <Button size="s" variant="ghost" icon={Grid} onClick={() => setBackground((value) => (value === 'grid' ? 'ruled' : 'grid'))}>
          {background === 'grid' ? 'Ruled' : 'Grid'}
        </Button>
      </div>

      <div className={`rounded-lg border border-hairline ${background === 'grid' ? 'bg-[linear-gradient(#dbe4ef_1px,transparent_1px),linear-gradient(90deg,#dbe4ef_1px,transparent_1px)] bg-[size:24px_24px]' : 'bg-[repeating-linear-gradient(0deg,#fff,#fff_31px,#e8eef7_32px)]'}`}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block h-[220px] w-full touch-none rounded-lg sm:h-[260px]"
          onPointerDown={beginStroke}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          aria-label="Working canvas"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {allowNoWorking && (
          <Button size="s" variant="secondary" onClick={markNotNeeded}>Working not needed</Button>
        )}
        <Button size="s" icon={Check} disabled={!strokes.length} onClick={submit} className={allowNoWorking ? '' : 'sm:col-span-2'}>
          {submitted ? 'Redo/Edit workings' : 'Submit workings'}
        </Button>
      </div>
      {required && !submitted && !notNeeded && (
        <p className="mt-2 text-xs font-semibold text-gold-700">Show your working before submitting your answer.</p>
      )}
    </div>
  );
}
