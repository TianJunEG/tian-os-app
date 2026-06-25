import React, { useEffect, useRef, useState } from 'react';
import { PenLine, Eraser, RotateCcw, Trash2, X } from 'lucide-react';
import { drawStroke, pointFromEvent as extractPoint, beginStrokeData, finalizeStroke } from './drawingUtils';

// Lightweight "draw on the screen" scratchpad. Unlike FullScreenWorkingMode
// (which is a paper-style modal that takes over the page), this is a
// TRANSPARENT overlay: the canvas covers the viewport so the student can write
// anywhere, but the question + answer input stay visible underneath. A small
// floating toolbar holds the tools. Strokes persist across open/close within
// the same question — handed back via onChange so the parent can store them.

const COLOURS = [
  { label: 'Black', value: '#111827' },
  { label: 'Blue',  value: '#2563eb' },
  { label: 'Red',   value: '#dc2626' },
  { label: 'Green', value: '#16a34a' },
];

const SIZES = [
  { label: 'Small',  value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Large',  value: 8 },
];

export default function ScratchpadOverlay({ open = false, initialStrokes = [], onChange, onClose }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const activePointerRef = useRef(null);
  const [strokes, setStrokes] = useState(Array.isArray(initialStrokes) ? initialStrokes : []);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(COLOURS[0].value);
  const [size, setSize] = useState(4);

  // Reset strokes from props when the overlay (re-)opens for a new question.
  useEffect(() => {
    if (!open) return;
    setStrokes(Array.isArray(initialStrokes) ? initialStrokes : []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Size the canvas to its DOM box (devicePixelRatio-aware for crisp ink) and
  // redraw on resize so the strokes stay where the student put them.
  useEffect(() => {
    if (!open) return undefined;
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw(strokes);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Redraw whenever strokes change.
  useEffect(() => {
    if (open) redraw(strokes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, open]);

  // Block text selection while drawing so a stylus drag never highlights nearby
  // text or steals focus into an input (matches the WorkingCanvas guards).
  useEffect(() => {
    if (!open) return undefined;
    const block = (e) => { if (drawingRef.current) e.preventDefault(); };
    document.addEventListener('selectstart', block);
    return () => document.removeEventListener('selectstart', block);
  }, [open]);

  function redraw(nextStrokes) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    nextStrokes.forEach((stroke) => drawStroke(ctx, stroke));
  }

  function beginStroke(event) {
    if (drawingRef.current) return; // palm rejection
    event.preventDefault();
    if (typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges?.();
    drawingRef.current = true;
    if (event.pointerId !== undefined) {
      activePointerRef.current = event.pointerId;
      canvasRef.current?.setPointerCapture?.(event.pointerId);
    }
    currentStrokeRef.current = beginStrokeData(event, tool, colour, size, canvasRef.current, window.innerWidth, window.innerHeight);
  }

  function moveStroke(event) {
    if (!drawingRef.current) return;
    if (activePointerRef.current !== null && event.pointerId !== undefined && event.pointerId !== activePointerRef.current) return;
    event.preventDefault();
    const stroke = currentStrokeRef.current;
    if (!stroke) return;
    const coalesced = event.getCoalescedEvents?.() || [event];
    for (const e of coalesced) stroke.points.push(extractPoint(e, canvasRef.current, window.innerWidth, window.innerHeight));
    // Live-draw the in-progress stroke on top of the committed ones.
    const ctx = canvasRef.current.getContext('2d');
    redraw(strokes);
    drawStroke(ctx, stroke);
  }

  function endStroke(event) {
    if (!drawingRef.current) return;
    if (activePointerRef.current !== null && event?.pointerId !== undefined && event.pointerId !== activePointerRef.current) return;
    if (event?.pointerId !== undefined) canvasRef.current?.releasePointerCapture?.(event.pointerId);
    activePointerRef.current = null;
    drawingRef.current = false;
    const raw = currentStrokeRef.current;
    currentStrokeRef.current = null;
    const stroke = finalizeStroke(raw);
    if (!stroke) return;
    const next = [...strokes, stroke];
    setStrokes(next);
    onChange?.(next);
  }

  function undo() {
    const next = strokes.slice(0, -1);
    setStrokes(next);
    onChange?.(next);
  }

  function clear() {
    setStrokes([]);
    onChange?.([]);
  }

  if (!open) return null;

  // Toolbar buttons share the same compact styling.
  const toolBtn = (active) => `grid h-10 w-10 place-items-center rounded-lg border transition ${
    active ? 'border-emerald bg-emerald text-white' : 'border-line-soft bg-white text-ink-600 hover:border-emerald hover:text-emerald-deep'
  }`;

  return (
    <>
      {/* Transparent ink layer covering the viewport. The question UI under it
          stays visible because the canvas itself is transparent (no fill). */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-40 select-none cursor-crosshair"
        style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
        aria-label="Scratchpad canvas — write to think"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={beginStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
      />
      {/* Floating tool palette — right side, vertical. */}
      <div className="fixed right-4 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-2 rounded-2xl border border-line-soft bg-white/95 p-2 shadow-card backdrop-blur">
        <button type="button" onClick={() => setTool('pen')} className={toolBtn(tool === 'pen')} title="Pen" aria-label="Pen">
          <PenLine className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setTool('eraser')} className={toolBtn(tool === 'eraser')} title="Eraser" aria-label="Eraser">
          <Eraser className="h-4 w-4" />
        </button>
        <div className="my-1 border-t border-line-soft" />
        {/* Colours — only when pen is active so the eraser doesn't look colourful. */}
        {tool === 'pen' && COLOURS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setColour(c.value)}
            className={`h-6 w-6 rounded-full border-2 transition ${colour === c.value ? 'border-ink-700 scale-110' : 'border-white'}`}
            style={{ background: c.value }}
            title={c.label}
            aria-label={`Colour ${c.label}`}
          />
        ))}
        {tool === 'pen' && <div className="my-1 border-t border-line-soft" />}
        {/* Brush size as 3 dots of growing thickness. */}
        {SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSize(s.value)}
            className={`grid h-6 w-6 place-items-center rounded ${size === s.value ? 'bg-emerald-tint' : 'hover:bg-line-soft'}`}
            title={s.label}
            aria-label={`Size ${s.label}`}
          >
            <span className="rounded-full bg-ink-700" style={{ width: s.value * 1.5, height: s.value * 1.5 }} />
          </button>
        ))}
        <div className="my-1 border-t border-line-soft" />
        <button type="button" onClick={undo} disabled={!strokes.length} className={`${toolBtn(false)} disabled:opacity-40`} title="Undo" aria-label="Undo last stroke">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button type="button" onClick={clear} disabled={!strokes.length} className={`${toolBtn(false)} disabled:opacity-40`} title="Clear" aria-label="Clear all strokes">
          <Trash2 className="h-4 w-4" />
        </button>
        <div className="my-1 border-t border-line-soft" />
        <button type="button" onClick={onClose} className={toolBtn(false)} title="Close scratchpad" aria-label="Close scratchpad">
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
