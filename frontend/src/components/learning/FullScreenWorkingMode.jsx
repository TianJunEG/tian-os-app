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
  ctx.strokeStyle = stroke.colour || WORKING_COLOURS[0].value;
  ctx.lineWidth = stroke.size || 4;
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
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const strokesRef = useRef(Array.isArray(initialStrokes) ? initialStrokes : []);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(WORKING_COLOURS[0].value);
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState(Array.isArray(initialStrokes) ? initialStrokes : []);

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
  };

  const moveStroke = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const stroke = currentStrokeRef.current;
    stroke.points.push(pointFromEvent(event));
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
      return next;
    });
  };

  const save = () => {
    const canvas = canvasRef.current;
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
    });
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
          <Button disabled={!strokes.length} onClick={save}>Save Working</Button>
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
          onToolChange={setTool}
          onColourChange={setColour}
          onBrushSizeChange={setBrushSize}
          onUndo={() => setStrokes((prev) => {
            const next = prev.slice(0, -1);
            strokesRef.current = next;
            return next;
          })}
          onClear={() => {
            strokesRef.current = [];
            setStrokes([]);
          }}
        />
        <div className="rounded-xl border border-hairline bg-white">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block h-[55vh] min-h-[360px] w-full touch-none rounded-xl"
            aria-label="Full-screen working canvas"
            onPointerDown={beginStroke}
            onPointerMove={moveStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
          />
        </div>
      </div>
    </Modal>
  );
}
