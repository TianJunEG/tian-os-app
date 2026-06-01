import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button } from '../ui';
import WorkingToolbar, { WORKING_COLOURS } from './WorkingToolbar';

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;

function drawStroke(ctx, stroke) {
  const points = stroke?.points || [];
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
  ctx.strokeStyle = stroke.colour || WORKING_COLOURS[0].value;
  ctx.lineWidth = stroke.tool === 'pencil' ? Math.max(1, Number(stroke.size || 4) - 1) : Number(stroke.size || 4);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.restore();
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

export default function FullScreenWorkingMode({
  open = false,
  questionText = '',
  initialStrokes = [],
  onClose,
  onSave,
}) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const strokesRef = useRef(Array.isArray(initialStrokes) ? initialStrokes : []);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(WORKING_COLOURS[0].value);
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState(Array.isArray(initialStrokes) ? initialStrokes : []);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [hasCanvasMarks, setHasCanvasMarks] = useState(Array.isArray(initialStrokes) && initialStrokes.length > 0);

  const redraw = (nextStrokes = strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    paintPaper(ctx);
    nextStrokes.forEach((stroke) => drawStroke(ctx, stroke));
  };

  useEffect(() => {
    if (!open) return;
    const nextStrokes = Array.isArray(initialStrokes) ? initialStrokes : [];
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
    setRedoStack([]);
    setZoom(1);
    setHasCanvasMarks(nextStrokes.length > 0);
  }, [open, initialStrokes]);

  useEffect(() => {
    if (open) redraw(strokes);
  }, [open, strokes]);

  const pointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const beginStroke = (event) => {
    event.preventDefault();
    drawingRef.current = true;
    currentStrokeRef.current = { tool, colour, size: brushSize, points: [pointFromEvent(event)] };
    setHasCanvasMarks(true);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const stroke = currentStrokeRef.current;
    stroke.points.push(pointFromEvent(event));
    setHasCanvasMarks(true);
    drawStroke(canvasRef.current.getContext('2d'), { ...stroke, points: stroke.points.slice(-2) });
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (!stroke || stroke.points.length < 2) return;
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

  const endPointerStroke = () => {
    endStroke();
  };

  const beginMouseStroke = (event) => {
    beginStroke(event);
  };

  const moveMouseStroke = (event) => {
    moveStroke(event);
  };

  const endMouseStroke = () => {
    endStroke();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (drawingRef.current) endStroke();
    onSave?.({
      workingImage: canvas?.toDataURL('image/png') || '',
      workingStrokes: strokesRef.current,
      workingSubmitted: true,
      workingSubmittedAt: new Date().toISOString(),
      source: 'fullscreen_working',
      canvasDimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
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
      setHasCanvasMarks(next.length > 0);
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
      setHasCanvasMarks(next.length > 0);
      return next;
    });
  };

  const clear = () => {
    if (strokesRef.current.length) setRedoStack((prev) => [...prev, ...strokesRef.current]);
    strokesRef.current = [];
    setStrokes([]);
    setHasCanvasMarks(false);
  };

  const zoomBy = (delta) => setZoom((value) => Math.min(2, Math.max(0.75, Math.round((value + delta) * 100) / 100)));

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Full-screen working"
      className="max-w-6xl"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!hasCanvasMarks && !strokes.length} onClick={save}>Save Working</Button>
        </>
      )}
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-hairline bg-slate-50 p-3 text-sm text-ink-700">
          <p className="font-semibold">Question reference</p>
          <p className="mt-1">{questionText}</p>
          <p className="mt-2 text-xs text-ink-500">For longer workings, you can also write on paper and upload a photo after the session.</p>
        </div>
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
          onPan={pan}
        />
        <div ref={scrollRef} className="overflow-auto rounded-xl border border-hairline bg-white">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block h-[55vh] min-h-[360px] touch-none rounded-xl"
            style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
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
        </div>
      </div>
    </Modal>
  );
}
