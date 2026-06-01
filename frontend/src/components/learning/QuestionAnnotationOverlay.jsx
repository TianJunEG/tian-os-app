import React, { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, RotateCcw, Trash2, X } from 'lucide-react';
import { Button } from '../ui';
import { BRUSH_SIZES, WORKING_COLOURS } from './WorkingToolbar';

const DEFAULT_COLOUR = WORKING_COLOURS[3]?.value || '#2563eb';
const DEFAULT_BRUSH_SIZE = 4;

function detectDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    return window.innerWidth >= 768 ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

function normaliseStrokes(strokes = []) {
  return (Array.isArray(strokes) ? strokes : []).map((stroke) => ({
    tool: stroke?.tool === 'eraser' ? 'eraser' : 'pen',
    colour: stroke?.tool === 'eraser' ? null : String(stroke?.colour || DEFAULT_COLOUR),
    size: Math.max(1, Number(stroke?.size || DEFAULT_BRUSH_SIZE)),
    points: (Array.isArray(stroke?.points) ? stroke.points : [])
      .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
      .map((point) => ({ x: Number(point.x), y: Number(point.y) })),
  }));
}

function denormalise(point, width, height) {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

function drawStroke(ctx, stroke, width, height) {
  const points = Array.isArray(stroke?.points) ? stroke.points : [];
  if (points.length < 2) return;

  const converted = points.map((point) => denormalise(point, width, height));
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = stroke?.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke?.tool === 'eraser' ? '#ffffff' : (stroke?.colour || DEFAULT_COLOUR);
  ctx.lineWidth = stroke?.size || DEFAULT_BRUSH_SIZE;
  ctx.beginPath();
  ctx.moveTo(converted[0].x, converted[0].y);
  for (let i = 1; i < converted.length; i++) {
    ctx.lineTo(converted[i].x, converted[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

export default function QuestionAnnotationOverlay({
  questionId = '',
  targetRef,
  active = false,
  disabled = false,
  initialPayload = null,
  onChange,
  onActivate,
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const strokeRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(DEFAULT_COLOUR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [strokes, setStrokes] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [submittedAt, setSubmittedAt] = useState(null);

  const isEnabled = active && !disabled;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const initialStrokes = normaliseStrokes(initialPayload?.workingStrokes);
    setStrokes(initialStrokes);
    setUndoStack([]);
    setTool('pen');
    setColour(initialPayload?.workingSubmitted || initialStrokes.length ? DEFAULT_COLOUR : DEFAULT_COLOUR);
    setBrushSize(Number(initialPayload?.brushSize) || DEFAULT_BRUSH_SIZE);
    setSubmittedAt(initialPayload?.workingSubmittedAt || (initialStrokes.length ? new Date().toISOString() : null));
  }, [initialPayload, questionId]);

  useEffect(() => {
    const node = targetRef?.current;
    if (!node) return undefined;
    if (typeof ResizeObserver === 'undefined') {
      setBounds({ width: Math.round(node.getBoundingClientRect().width), height: Math.round(node.getBoundingClientRect().height) });
      return undefined;
    }

    const measure = () => {
      const rect = node.getBoundingClientRect();
      setBounds({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [targetRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bounds.width || !bounds.height) return;

    const ratio = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    strokes.forEach((stroke) => drawStroke(ctx, stroke, bounds.width, bounds.height));

    if (!strokes.length && !isEnabled) return;

    const image = isEnabled || strokes.length
      ? canvas.toDataURL('image/png')
      : '';

    onChangeRef.current?.({
      questionId,
      workingImage: image,
      workingStrokes: strokes,
      workingSubmitted: strokes.length > 0,
      workingSubmittedAt: strokes.length ? (submittedAt || new Date().toISOString()) : null,
      workingNotNeeded: false,
      source: 'question_doodle',
      questionDimensions: bounds.width && bounds.height ? { width: bounds.width, height: bounds.height } : null,
      viewportDimensions: typeof window === 'undefined' ? null : { width: window.innerWidth, height: window.innerHeight },
      deviceType: detectDeviceType(),
      timestamp: new Date().toISOString(),
      tool,
      colour,
      brushSize,
    });
  }, [bounds.width, bounds.height, questionId, submittedAt, strokes, brushSize, colour, tool, isEnabled]);

  const pointForEvent = (event) => {
    const rect = targetRef?.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  };

  const beginStroke = (event) => {
    if (!isEnabled) return;
    event.preventDefault();
    const point = pointForEvent(event);
    if (!point) return;
    drawingRef.current = true;
    strokeRef.current = {
      tool,
      colour: tool === 'pen' ? colour : null,
      size: brushSize,
      points: [point],
    };
  };

  const moveStroke = (event) => {
    if (!isEnabled || !drawingRef.current) return;
    event.preventDefault();
    const point = pointForEvent(event);
    if (!point) return;
    const current = strokeRef.current;
    if (!current) return;

    const previousPoint = current.points[current.points.length - 1];
    current.points.push(point);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !previousPoint) return;

    drawStroke(ctx, {
      ...current,
      points: [previousPoint, point],
    }, bounds.width, bounds.height);
  };

  const endStroke = () => {
    if (!isEnabled || !drawingRef.current) return;
    drawingRef.current = false;
    const current = strokeRef.current;
    strokeRef.current = null;
    if (!current || !current.points || current.points.length < 2) return;

    const now = new Date().toISOString();
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes((prev) => [...prev, { ...current, colour: current.colour || colour, points: [...current.points] }]);
    setSubmittedAt(now);
  };

  const clear = () => {
    if (!strokes.length) return;
    if (!window.confirm('Clear your question annotations?')) return;
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes([]);
    setSubmittedAt(null);
  };

  const undo = () => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      setStrokes(prev.at(-1));
      return prev.slice(0, -1);
    });
  };

  const exit = () => {
    onActivate?.(false);
  };

  const hasSubmission = strokes.length > 0;

  return (
    <div className="relative">
      <div className="mb-2 rounded-xl border border-hairline bg-slate-50 px-3 py-2 text-xs text-ink-600">
        <p className={`font-semibold ${active ? 'text-navy-700' : 'text-ink-700'}`}>
          {active ? 'Doodle mode active' : 'Doodle mode off'}
        </p>
        <p className="mt-1 text-ink-500">{active
          ? 'Draw directly on the question then exit this mode to answer.'
          : 'Use for fraction models, number lines, and diagrams.'}
        </p>
      </div>

      <div className="absolute inset-0 z-10">
        <canvas
          ref={canvasRef}
          className={`block h-full w-full bg-transparent ${isEnabled ? 'touch-none' : 'pointer-events-none'}`}
          onPointerDown={beginStroke}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          aria-label="Question annotation canvas"
        />
      </div>

      {isEnabled && (
        <div className="relative z-20 mt-2 rounded-xl border border-hairline bg-white p-2">
          <div className="mb-2 flex flex-wrap gap-2">
            <Button size="s" className="min-h-[44px]" icon={PenLine} variant={tool === 'pen' ? 'primary' : 'secondary'} onClick={() => setTool('pen')}>Pen</Button>
            <Button size="s" className="min-h-[44px]" icon={Eraser} variant={tool === 'eraser' ? 'primary' : 'secondary'} onClick={() => setTool('eraser')}>Eraser</Button>
            <Button size="s" className="min-h-[44px]" icon={RotateCcw} disabled={!undoStack.length} onClick={undo}>Undo</Button>
            <Button size="s" className="min-h-[44px]" icon={Trash2} disabled={!strokes.length} onClick={clear}>Clear</Button>
            <Button size="s" className="min-h-[44px]" icon={X} variant="secondary" onClick={exit}>Exit doodle mode</Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Colour</p>
              <div className="flex flex-wrap gap-2">
                {WORKING_COLOURS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-label={item.label}
                    onClick={() => setColour(item.value)}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border px-2 text-xs font-semibold ${colour === item.value ? 'border-navy-500 ring-2 ring-navy-500/30' : 'border-hairline'}`}
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
                  <Button key={item.value} size="s" className="min-h-[44px]" variant={brushSize === item.value ? 'primary' : 'secondary'} onClick={() => setBrushSize(item.value)}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isEnabled && hasSubmission && (
        <div className="mt-2 rounded-lg border border-success-200 bg-success-50 px-2 py-2 text-xs text-success-700">
          Annotation saved. Open doodle mode if you need to edit.
        </div>
      )}
    </div>
  );
}
