import React, { useEffect, useRef, useState } from 'react';
import { PenLine, Eraser, Move, RotateCcw, Sigma, Trash2, X } from 'lucide-react';
import { drawStroke, pointFromEvent as extractPoint, beginStrokeData, finalizeStroke, topStampIndexAtPoint, moveStampInStrokes } from './drawingUtils';

// Math symbol stamps. Simple ones (operators, π, θ, ∠) insert immediately;
// the rest open a small builder popover so the student can fill in the parts.
const MATH_STAMPS = [
  { id: 'plus', label: '+' },
  { id: 'minus', label: '−' },
  { id: 'times', label: '×' },
  { id: 'divide', label: '÷' },
  { id: 'equals', label: '=' },
  { id: 'fraction', label: 'x/y' },
  { id: 'power', label: 'xᵇ' },
  { id: 'root', label: 'ⁿ√x' },
  { id: 'mixed', label: 'xᵇ/a' },
  { id: 'pi', label: 'π' },
  { id: 'theta', label: 'θ' },
  { id: 'angle', label: '∠' },
];
const MATH_BUILDERS = {
  fraction: { fields: [{ key: 'numerator', placeholder: 'x' }, { key: 'denominator', placeholder: 'y' }] },
  power:    { fields: [{ key: 'base', placeholder: 'x' }, { key: 'exponent', placeholder: 'b' }] },
  root:     { fields: [{ key: 'index', placeholder: 'n' }, { key: 'radicand', placeholder: 'x' }] },
  mixed:    { fields: [{ key: 'base', placeholder: 'x' }, { key: 'numerator', placeholder: 'b' }, { key: 'denominator', placeholder: 'a' }] },
};

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

export default function ScratchpadOverlay({
  open = false,
  initialStrokes = [],
  onChange,
  onClose,
  // Optional answer-capture box: when both are provided, a floating "Your
  // answer" input sits at the bottom of the screen so the student can do the
  // working AND drop the answer in the same place. The value is two-way bound
  // to the parent's draft state, so closing the overlay leaves the answer
  // already in the page's main input.
  answerValue,
  onAnswerChange,
  onSubmitAnswer,
  // Optional working-evidence submission. When provided, a Submit press
  // renders the strokes to a PNG and calls onSaveWorking with the same
  // payload shape as FullScreenWorkingMode's onSave — so surfaces that send
  // working evidence to the backend (practice/diagnostic) can use this
  // overlay as a drop-in replacement without losing the evidence pipeline.
  onSaveWorking,
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const activePointerRef = useRef(null);
  // Stamp dragging (Move tool): which stamp index is being dragged, the grab
  // offset from its anchor, and the live working copy of strokes during the drag.
  const draggingRef = useRef(null);
  const dragStrokesRef = useRef(null);
  const [strokes, setStrokes] = useState(Array.isArray(initialStrokes) ? initialStrokes : []);
  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(COLOURS[0].value);
  const [size, setSize] = useState(4);
  // Math-symbol toolbar: open/closed + the in-progress builder draft when a
  // complex stamp (fraction, power, root, mixed) needs field input.
  const [showMath, setShowMath] = useState(false);
  const [mathDraft, setMathDraft] = useState(null);

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
    if (drawingRef.current || draggingRef.current) return; // palm rejection
    event.preventDefault();
    if (typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges?.();
    // Move tool: grab the stamp under the pointer and drag it instead of drawing.
    // A press that misses every stamp is a no-op (so you can't draw in move mode).
    if (tool === 'move') {
      const pt = extractPoint(event, canvasRef.current, window.innerWidth, window.innerHeight);
      const index = topStampIndexAtPoint(strokes, pt);
      if (index === -1) return;
      const anchor = strokes[index].points[0];
      draggingRef.current = { index, offsetX: pt.x - anchor.x, offsetY: pt.y - anchor.y };
      dragStrokesRef.current = strokes;
      if (event.pointerId !== undefined) {
        activePointerRef.current = event.pointerId;
        canvasRef.current?.setPointerCapture?.(event.pointerId);
      }
      return;
    }
    drawingRef.current = true;
    if (event.pointerId !== undefined) {
      activePointerRef.current = event.pointerId;
      canvasRef.current?.setPointerCapture?.(event.pointerId);
    }
    currentStrokeRef.current = beginStrokeData(event, tool, colour, size, canvasRef.current, window.innerWidth, window.innerHeight);
  }

  function moveStroke(event) {
    if (draggingRef.current) {
      if (activePointerRef.current !== null && event.pointerId !== undefined && event.pointerId !== activePointerRef.current) return;
      event.preventDefault();
      const pt = extractPoint(event, canvasRef.current, window.innerWidth, window.innerHeight);
      const { index, offsetX, offsetY } = draggingRef.current;
      const base = dragStrokesRef.current || strokes;
      const next = moveStampInStrokes(base, index, pt.x - offsetX, pt.y - offsetY);
      dragStrokesRef.current = next;
      redraw(next);
      return;
    }
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
    if (draggingRef.current) {
      if (activePointerRef.current !== null && event?.pointerId !== undefined && event.pointerId !== activePointerRef.current) return;
      if (event?.pointerId !== undefined) canvasRef.current?.releasePointerCapture?.(event.pointerId);
      activePointerRef.current = null;
      const next = dragStrokesRef.current || strokes;
      draggingRef.current = null;
      dragStrokesRef.current = null;
      setStrokes(next);
      onChange?.(next);
      return;
    }
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

  // Render the current strokes onto an offscreen canvas of the viewport size
  // and return a PNG data URL. Matches FullScreenWorkingMode's paper-style
  // export so consumers of the working-evidence pipeline can swap this overlay
  // in without backend changes.
  function exportWorkingImage() {
    if (typeof document === 'undefined') return '';
    const off = document.createElement('canvas');
    off.width = Math.max(1, window.innerWidth);
    off.height = Math.max(1, window.innerHeight);
    const ctx = off.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, off.width, off.height);
    for (const stroke of strokes) drawStroke(ctx, stroke);
    return off.toDataURL('image/png');
  }

  // Build the payload that mirrors FullScreenWorkingMode's onSave shape, so
  // consumers (PracticeSession, DiagnosticQuestionScreen, …) get the same
  // contract whether the student uses the modal canvas or this overlay.
  function buildWorkingPayload() {
    return {
      workingImage: strokes.length ? exportWorkingImage() : '',
      workingStrokes: strokes,
      // Stamps live INSIDE strokes (tool:'stamp') in this overlay, so there
      // are no separate math-object items — but keep the field for shape parity.
      workingMathObjects: [],
      workingSubmitted: strokes.length > 0,
      workingSubmittedAt: new Date().toISOString(),
    };
  }

  // Capture working evidence (if the parent wired it) BEFORE Submit/Close fires.
  // The image is rendered synchronously on the offscreen canvas so the parent's
  // state is updated before any async submission downstream.
  function captureWorking() {
    if (typeof onSaveWorking !== 'function') return;
    onSaveWorking(buildWorkingPayload());
  }
  function handleSubmit() {
    captureWorking();
    onSubmitAnswer?.();
  }
  function handleClose() {
    captureWorking();
    onClose?.();
  }

  // Drop a math stamp at a roughly-central spot, offset per stamp so successive
  // inserts don't pile up exactly. drawStroke() routes tool:'stamp' through
  // drawMathStamp(), so the rendering is identical to every other canvas.
  function insertMathStamp(template, values = {}) {
    const stampCount = strokes.filter((s) => s.tool === 'stamp').length;
    const cx = (typeof window !== 'undefined' ? window.innerWidth : 800) / 2 - 60;
    const cy = (typeof window !== 'undefined' ? window.innerHeight : 600) / 2 - 60;
    const next = [...strokes, {
      tool: 'stamp',
      template,
      colour: '#f97316',
      size: 4,
      ...values,
      points: [{ x: cx + ((stampCount % 5) * 110), y: cy + (Math.floor(stampCount / 5) * 80) }],
    }];
    setStrokes(next);
    onChange?.(next);
    setMathDraft(null);
  }

  function handleMathTool(template) {
    const builder = MATH_BUILDERS[template];
    if (builder) {
      const blank = builder.fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
      setMathDraft((d) => d?.template === template ? null : { template, ...blank });
      return;
    }
    insertMathStamp(template);
  }

  const draftReady = Boolean(mathDraft?.template && MATH_BUILDERS[mathDraft.template]?.fields.every((f) => String(mathDraft?.[f.key] || '').trim()));
  function insertDraft() {
    if (!mathDraft?.template) return;
    const builder = MATH_BUILDERS[mathDraft.template];
    const values = builder.fields.reduce((acc, f) => ({ ...acc, [f.key]: String(mathDraft[f.key] || '').trim() }), {});
    insertMathStamp(mathDraft.template, values);
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
        className={`fixed inset-0 z-40 select-none ${tool === 'move' ? 'cursor-move' : 'cursor-crosshair'}`}
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
        <button type="button" onClick={() => setTool('move')} className={toolBtn(tool === 'move')} title="Move symbols" aria-label="Move symbols">
          <Move className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => { setShowMath((v) => !v); setMathDraft(null); }}
          className={toolBtn(showMath)}
          title="Math symbols"
          aria-label="Math symbols"
        >
          <Sigma className="h-4 w-4" />
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
        <button type="button" onClick={handleClose} className={toolBtn(false)} title="Close scratchpad" aria-label="Close scratchpad">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Math symbols toolbar — appears to the LEFT of the main palette when
          enabled, so it doesn't crowd the right-side controls. */}
      {showMath && (
        <div className="fixed right-20 top-1/2 z-50 -translate-y-1/2 grid grid-cols-3 gap-1 rounded-2xl border border-line-soft bg-white/95 p-2 shadow-card backdrop-blur" aria-label="Math insert tools">
          {MATH_STAMPS.map((stamp) => (
            <button
              key={stamp.id}
              type="button"
              onClick={() => handleMathTool(stamp.id)}
              className={`grid h-10 w-12 place-items-center rounded-lg border font-display text-sm transition ${
                mathDraft?.template === stamp.id
                  ? 'border-emerald bg-emerald text-white'
                  : 'border-line-soft bg-white text-ink-700 hover:border-emerald hover:text-emerald-deep'
              }`}
              style={{ fontFamily: 'Georgia, serif' }}
              title={`Insert ${stamp.label}`}
              aria-label={`Insert ${stamp.label}`}
            >
              {stamp.label}
            </button>
          ))}
        </div>
      )}

      {/* Floating answer-capture box — pinned to the bottom of the viewport so
          the student can type their answer right where they did the working.
          Two-way bound: closing the overlay leaves the value in the parent's
          main answer input. Only renders when the parent wires it. */}
      {typeof onAnswerChange === 'function' && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-line-soft bg-white/95 px-3 py-2 shadow-card backdrop-blur" style={{ minWidth: 280 }}>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Your answer</span>
            <input
              type="text"
              inputMode="text"
              value={answerValue ?? ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && String(answerValue ?? '').trim() && typeof onSubmitAnswer === 'function') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Type here"
              aria-label="Your answer"
              className="w-40 rounded-lg border border-ink-200 px-3 py-1.5 text-base focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald"
            />
            {typeof onSubmitAnswer === 'function' && (
              <button
                type="button"
                disabled={!String(answerValue ?? '').trim()}
                onClick={() => handleSubmit()}
                className="rounded-lg bg-emerald px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-deep disabled:bg-line-soft disabled:text-ink-400"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Builder popover — centred — for stamps that need field input
          (fraction, power, root, mixed). Drops a fully-built stamp at viewport
          centre on Insert. */}
      {mathDraft?.template && MATH_BUILDERS[mathDraft.template] && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-700/20" onClick={() => setMathDraft(null)}>
          <div className="min-w-[280px] rounded-2xl border border-line-soft bg-white p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">
              Build a {MATH_STAMPS.find((s) => s.id === mathDraft.template)?.label}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {MATH_BUILDERS[mathDraft.template].fields.map((field, i) => (
                <input
                  key={field.key}
                  autoFocus={i === 0}
                  value={mathDraft[field.key] || ''}
                  onChange={(e) => setMathDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && draftReady) insertDraft(); }}
                  placeholder={field.placeholder}
                  className="w-20 rounded-lg border-2 border-ink-200 bg-surface-raised px-3 py-2 text-center text-lg focus:border-emerald focus:outline-none"
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setMathDraft(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-500 hover:bg-line-soft">Cancel</button>
              <button
                type="button"
                disabled={!draftReady}
                onClick={insertDraft}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${draftReady ? 'bg-emerald text-white hover:bg-emerald-deep' : 'bg-line-soft text-ink-400'}`}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
