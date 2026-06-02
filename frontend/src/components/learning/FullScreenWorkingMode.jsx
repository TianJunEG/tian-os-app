import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button } from '../ui';
import WorkingToolbar, { WORKING_COLOURS } from './WorkingToolbar';

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;
const QUESTION_PANEL = { x: 48, y: 44, width: 620, height: 170 };
const EMPTY_STROKES = [];

function drawStroke(ctx, stroke) {
  const points = stroke?.points || [];
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.18 : 1;
  ctx.strokeStyle = stroke.colour || WORKING_COLOURS[0].value;
  const baseSize = Number(stroke.size || 4);
  ctx.lineWidth = stroke.tool === 'eraser'
    ? 24
    : stroke.tool === 'highlighter'
      ? Math.max(56, baseSize * 10)
      : stroke.tool === 'pencil'
        ? Math.max(1, baseSize - 1)
        : baseSize;
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

export default function FullScreenWorkingMode({
  open = false,
  questionText = '',
  questionContent = null,
  questionSnapshot = null,
  initialStrokes = EMPTY_STROKES,
  onClose,
  onSave,
}) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const strokesRef = useRef(Array.isArray(initialStrokes) ? initialStrokes : []);
  const toolRef = useRef('pen');
  const colourRef = useRef(WORKING_COLOURS[0].value);
  const brushSizeRef = useRef(4);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(WORKING_COLOURS[0].value);
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState(Array.isArray(initialStrokes) ? initialStrokes : []);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [hasCanvasMarks, setHasCanvasMarks] = useState(Array.isArray(initialStrokes) && initialStrokes.length > 0);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colourRef.current = colour; }, [colour]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const redraw = (nextStrokes = strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
    currentStrokeRef.current = {
      tool: toolRef.current,
      colour: colourRef.current,
      size: brushSizeRef.current,
      points: [pointFromEvent(event)],
    };
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
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;
    const exportCtx = exportCanvas.getContext('2d');
    paintPaper(exportCtx);
    paintQuestionPanel(exportCtx, questionText);
    strokesRef.current.forEach((stroke) => drawStroke(exportCtx, stroke));
    onSave?.({
      workingImage: exportCanvas?.toDataURL('image/png') || canvas?.toDataURL('image/png') || '',
      workingStrokes: strokesRef.current,
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
  const resetZoom = () => setZoom(1);

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
      containerClassName="p-1 sm:p-2"
      className="flex h-[calc(100vh-0.5rem)] max-h-[calc(100vh-0.5rem)] w-[calc(100vw-0.5rem)] max-w-[calc(100vw-0.5rem)] flex-col overflow-hidden rounded-xl [&>div:first-child]:p-3 sm:[&>div:first-child]:p-4 [&>div:nth-child(2)]:min-h-0 [&>div:nth-child(2)]:flex-1 [&>div:nth-child(2)]:overflow-hidden [&>div:nth-child(2)]:p-2 sm:[&>div:nth-child(2)]:p-3 [&>div:last-child]:p-2 sm:[&>div:last-child]:p-3"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!hasCanvasMarks && !strokes.length} onClick={save}>Save Working</Button>
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
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto rounded-xl border border-hairline bg-slate-100 p-3">
          <div
            className="relative rounded-xl bg-white shadow-resting"
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
          >
            <div
              className="absolute rounded-2xl border border-slate-300 bg-slate-50 p-7"
              style={{
                left: `${QUESTION_PANEL.x}px`,
                top: `${QUESTION_PANEL.y}px`,
                width: `${QUESTION_PANEL.width}px`,
                minHeight: `${QUESTION_PANEL.height}px`,
              }}
              data-testid="worksheet-question-panel"
            >
              <p className="text-lg font-semibold text-slate-600">Question</p>
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
          </div>
        </div>
      </div>
    </Modal>
  );
}
