import React, { useEffect, useRef } from 'react';
import { Eraser, Undo2 } from 'lucide-react';

// A finger/stylus writing surface for Chinese characters. It captures strokes
// for drawing only — there is no recognition; the child writes, then reveals
// the answer and self-marks. A faint 田-style guide helps with proportion.
export default function HandwritingPad({ height = 240 }) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]); // array of strokes; each stroke is array of {x,y}
  const drawingRef = useRef(false);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    // Guide grid (田字格): border + dashed centre lines.
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.restore();

    // Ink.
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokesRef.current) {
      if (stroke.length < 1) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
      ctx.stroke();
    }
  };

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  };

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Block text selection while a stroke is active so writing never highlights
  // nearby text or steals focus into an input.
  useEffect(() => {
    const blockSelection = (e) => { if (drawingRef.current) e.preventDefault(); };
    document.addEventListener('selectstart', blockSelection);
    return () => document.removeEventListener('selectstart', blockSelection);
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges?.();
    drawingRef.current = true;
    strokesRef.current.push([pos(e)]);
    canvasRef.current.setPointerCapture?.(e.pointerId);
    redraw();
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke.push(pos(e));
    redraw();
  };
  const end = () => { drawingRef.current = false; };

  const clear = () => { strokesRef.current = []; redraw(); };
  const undo = () => { strokesRef.current.pop(); redraw(); };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ height, touchAction: 'none', WebkitTouchCallout: 'none' }}
        className="w-full select-none rounded-xl border-2 border-gray-300 bg-white cursor-crosshair"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      />
      <div className="mt-2 flex justify-center gap-4 text-sm">
        <button onClick={undo} type="button" className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 min-h-[44px] px-2">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button onClick={clear} type="button" className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 min-h-[44px] px-2">
          <Eraser className="w-4 h-4" /> Clear
        </button>
      </div>
    </div>
  );
}
