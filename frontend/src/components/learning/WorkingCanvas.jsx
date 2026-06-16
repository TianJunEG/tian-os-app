import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Grid, Paperclip, PenLine, ListOrdered, Calculator, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import WorkingToolbar, { WORKING_COLOURS } from './WorkingToolbar';
import MathStepsEditor from './MathStepsEditor';
import ColumnOperationsGrid, { makeEmptyGrid } from './ColumnOperationsGrid';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  drawStroke,
  paintBackground,
  exportCanvas as exportCanvasImage,
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

const MATH_BUILDERS = {
  fraction: {
    fields: [
      { key: 'numerator', placeholder: 'x', className: 'mx-auto w-20' },
      { key: 'denominator', placeholder: 'y', className: 'mx-auto w-20' },
    ],
  },
  subscript: {
    fields: [
      { key: 'base', placeholder: 'x', className: 'w-20' },
      { key: 'subscript', placeholder: 'a', className: 'w-16 text-base' },
    ],
  },
  power: {
    fields: [
      { key: 'base', placeholder: 'x', className: 'w-20' },
      { key: 'exponent', placeholder: 'b', className: 'w-16 text-base' },
    ],
  },
  subscriptPower: {
    fields: [
      { key: 'base', placeholder: 'x', className: 'w-20' },
      { key: 'exponent', placeholder: 'b', className: 'w-16 text-base' },
      { key: 'subscript', placeholder: 'a', className: 'w-16 text-base' },
    ],
  },
  mixed: {
    fields: [
      { key: 'base', placeholder: 'x', className: 'w-20' },
      { key: 'numerator', placeholder: 'b', className: 'w-16 text-base' },
      { key: 'denominator', placeholder: 'a', className: 'w-16 text-base' },
    ],
  },
  root: {
    fields: [
      { key: 'index', placeholder: 'n', className: 'w-16 text-base' },
      { key: 'radicand', placeholder: 'x', className: 'w-20' },
    ],
  },
  degree: {
    fields: [
      { key: 'base', placeholder: 'x', className: 'w-20' },
    ],
  },
};

const FONT = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const shellStyle = {
  fontFamily: FONT,
  color: '#232c39',
  background: '#fff',
  border: '1px solid #e7eaef',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(30,42,66,0.05)',
  overflow: 'hidden',
};

const appBarStyle = {
  background: 'linear-gradient(160deg, #13223e, #101d36)',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 8,
};

const modeTabStyle = (active) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 34,
  padding: '0 14px',
  borderRadius: 9,
  fontSize: 13,
  fontWeight: 700,
  fontFamily: FONT,
  border: 'none',
  cursor: 'pointer',
  background: active ? 'rgba(217,137,46,0.2)' : 'transparent',
  color: active ? '#f0c078' : 'rgba(255,255,255,0.55)',
});

const toolbarRowStyle = {
  background: '#f5f6f8',
  borderBottom: '1px solid #e7eaef',
  padding: '8px 14px',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
};

const canvasWrapperStyle = (bg) => ({
  overflow: 'auto',
  borderRadius: 0,
  background: bg === 'grid'
    ? 'linear-gradient(#dbe4ef 1px, transparent 1px), linear-gradient(90deg, #dbe4ef 1px, transparent 1px)'
    : '#f5f1e9',
  backgroundSize: bg === 'grid' ? '24px 24px' : undefined,
  ...(bg !== 'grid' ? {
    backgroundImage: 'repeating-linear-gradient(0deg, #f5f1e9, #f5f1e9 31px, #e7ddcb 32px)',
  } : {}),
  position: 'relative',
});

const footerStyle = {
  background: '#f5f6f8',
  borderTop: '1px solid #e7eaef',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
};

const goldBtnStyle = {
  height: 42,
  borderRadius: 11,
  background: '#d9892e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  padding: '0 20px',
  border: 'none',
  cursor: 'pointer',
  fontFamily: FONT,
  boxShadow: '0 2px 8px rgba(217,137,46,0.35)',
};

const outlineBtnStyle = {
  height: 42,
  borderRadius: 11,
  border: '1.5px solid #cfd5dd',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  color: '#6b7585',
  fontWeight: 700,
  fontSize: 14,
  padding: '0 20px',
  cursor: 'pointer',
  fontFamily: FONT,
};

const viewCtrlStyle = {
  width: 30, height: 30, borderRadius: 8,
  border: '1px solid #e7eaef', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#6b7585', padding: 0,
};

const statusBadgeStyle = (tone) => ({
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: 7,
  letterSpacing: '0.03em',
  ...(tone === 'gold' ? { background: '#fbf1e1', color: '#a8743a' }
    : tone === 'success' ? { background: '#e7f3ec', color: '#1f8a5b' }
    : { background: '#eef0f4', color: '#6b7585' }),
});

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

function MathDraftInput({ value, placeholder, onChange, onEnter, compact = false, autoFocus = false }) {
  return (
    <input
      autoFocus={autoFocus}
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
      onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.(); }}
      style={{
        width: compact ? 56 : 80,
        height: compact ? 48 : 56,
        borderRadius: 12,
        border: '2px solid transparent',
        background: '#f3f4f7',
        padding: '0 10px',
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: compact ? 20 : 26,
        color: '#232c39',
        outline: 'none',
      }}
      onFocus={(e) => { e.target.style.borderColor = '#d9892e'; e.target.style.background = '#fdf6ea'; }}
      onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f3f4f7'; }}
      placeholder={placeholder}
    />
  );
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
  showMathStamps = FEATURE_FLAGS.workingMathInserts,
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
  const [mathDraft, setMathDraft] = useState(null);
  const [workingMode, setWorkingMode] = useState('draw');
  const [mathSteps, setMathSteps] = useState([{ id: 'step-1', text: '' }]);
  const [columnGrid, setColumnGrid] = useState(() => makeEmptyGrid('addition', 0));

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
    setMathDraft(null);
    setZoom(1);
    scrollRef.current?.scrollTo?.({ left: 0, top: 0 });
    redraw(nextStrokes, submittedImage);
  }, [questionId, submittedImage, submittedStrokes, initialSubmitted, initialWorkingNotNeeded]);

  const pointFromEvent = (event) => extractPoint(event, canvasRef.current);

  const emitChange = (next = {}) => {
    onChange?.({
      workingSubmitted: submitted,
      workingNotNeeded: notNeeded,
      workingStrokes: strokes,
      workingSteps: mathSteps,
      workingColumnGrid: columnGrid,
      workingMode,
      ...next,
    });
  };

  const beginStroke = (event) => {
    if (readOnly) return;
    event.preventDefault();
    drawingRef.current = true;
    currentStrokeRef.current = beginStrokeData(event, tool, colour, brushSize, canvasRef.current);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current || readOnly) return;
    event.preventDefault();
    const stroke = currentStrokeRef.current;
    const coalescedEvents = event.getCoalescedEvents?.() || [event];
    for (const e of coalescedEvents) {
      stroke.points.push(pointFromEvent(e));
    }
    const ctx = canvasRef.current.getContext('2d');
    const pts = stroke.points;
    if (pts.length < 3) {
      drawStroke(ctx, { ...stroke, points: pts.slice(-2) });
    } else {
      const tail = pts.slice(-3);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.18 : stroke.tool === 'shade' ? 0.24 : 1;
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : (stroke.colour || '#172554');
      const baseSize = Number(stroke.size || 4);
      const hasPressure = (stroke.tool === 'pen' || stroke.tool === 'pencil') && tail[2].p != null;
      ctx.lineWidth = stroke.tool === 'eraser' ? 24
        : stroke.tool === 'shade' ? Math.max(34, baseSize * 8)
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

  const endStroke = () => {
    if (!drawingRef.current || readOnly) return;
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

  const hasStepsContent = mathSteps.some((s) => s.text.trim());
  const hasColumnContent = columnGrid?.rows?.some((r) => r.some((c) => c)) || columnGrid?.dividend?.some((c) => c);
  const hasAnyWorking = strokes.length > 0 || attachedImage || hasStepsContent || hasColumnContent;

  const submit = () => {
    const image = attachedImage || exportCanvasImage(canvasRef.current, CANVAS_WIDTH, CANVAS_HEIGHT, background);
    const payload = {
      workingImage: image,
      workingStrokes: strokes,
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

  const insertMathStamp = (template, values = {}) => {
    const stampCount = strokes.filter((stroke) => stroke.tool === 'stamp').length;
    const nextStroke = {
      tool: 'stamp',
      template,
      colour: '#f97316',
      size: 4,
      ...values,
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
    setMathDraft(null);
    emitChange({ workingSubmitted: false, workingNotNeeded: false, workingStrokes: nextStrokes });
  };

  const handleMathTool = (template) => {
    const builder = MATH_BUILDERS[template];
    if (builder) {
      const nextValues = builder.fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});
      setMathDraft((current) => current?.template === template ? null : { template, ...nextValues });
      return;
    }
    insertMathStamp(template);
  };

  const insertDraftMath = () => {
    const template = mathDraft?.template;
    const builder = MATH_BUILDERS[template];
    if (!template || !builder) return;
    const values = builder.fields.reduce((acc, field) => ({ ...acc, [field.key]: String(mathDraft?.[field.key] || '').trim() }), {});
    if (Object.values(values).some((value) => !value)) return;
    insertMathStamp(template, values);
  };

  const draftReady = Boolean(mathDraft?.template && MATH_BUILDERS[mathDraft.template]?.fields.every((field) => String(mathDraft?.[field.key] || '').trim()));

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
      <div style={{ ...shellStyle, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#232c39' }}>Student workings</span>
          <span style={statusBadgeStyle('neutral')}>{status}</span>
        </div>
        {submittedImage ? (
          <img src={submittedImage} alt="Student submitted workings" style={{ width: '100%', borderRadius: 10, border: '1px solid #e7eaef', objectFit: 'contain' }} />
        ) : (
          <div style={{ background: '#f5f6f8', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#8a93a3' }}>
            No working image submitted.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={shellStyle} data-testid="working-canvas">
      {/* Dark app bar */}
      <div style={appBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {WORKING_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setWorkingMode(mode.id)}
              style={modeTabStyle(workingMode === mode.id)}
            >
              <mode.icon style={{ width: 15, height: 15 }} />
              {mode.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={statusBadgeStyle(statusTone)}>{status}</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ ...viewCtrlStyle, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
            title="Attach photo"
          >
            <Paperclip style={{ width: 14, height: 14 }} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={attachPhoto}
          />
        </div>
      </div>

      {/* Working code banner */}
      {workingCode && (
        <div style={{ background: '#fbf1e1', borderBottom: '1px solid #f0dcb8', padding: '8px 16px', fontSize: 13, color: '#a8743a' }}>
          <span style={{ fontWeight: 700 }}>Working code: </span>
          <span style={{ fontFamily: MONO }}>{workingCode}</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#b8a076' }}>Write this code at the top of your working page before taking a photo.</span>
        </div>
      )}

      {/* Toolbar row */}
      {workingMode === 'draw' && (
        <div style={toolbarRowStyle}>
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
          <span style={{ width: 1, height: 22, background: '#dde1e8', margin: '0 4px' }} />
          <button type="button" onClick={() => setBackground((v) => v === 'grid' ? 'ruled' : 'grid')} style={viewCtrlStyle} title={background === 'grid' ? 'Ruled lines' : 'Grid'}>
            <Grid style={{ width: 14, height: 14 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <button type="button" onClick={() => zoomBy(-0.25)} style={viewCtrlStyle} title="Zoom out">
              <ZoomOut style={{ width: 14, height: 14 }} />
            </button>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#8a93a3', minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => zoomBy(0.25)} style={viewCtrlStyle} title="Zoom in">
              <ZoomIn style={{ width: 14, height: 14 }} />
            </button>
            <button type="button" onClick={() => setZoom(1)} style={viewCtrlStyle} title="Reset zoom">
              <RotateCcw style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      )}

      {/* Attached image banner */}
      {attachedImage && (
        <div style={{ background: '#f5f6f8', borderBottom: '1px solid #e7eaef', padding: 10 }}>
          <img src={attachedImage} alt="Attached working photo" style={{ maxHeight: 140, width: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}

      {/* Math stamps */}
      {workingMode === 'draw' && showMathStamps && (
        <div style={{ ...toolbarRowStyle, gap: 7, borderTop: 'none' }} aria-label="Math insert tools">
          {MATH_STAMPS.map((stamp) => (
            <div key={stamp.id} style={{ position: 'relative' }}>
              {mathDraft?.template === stamp.id && MATH_BUILDERS[stamp.id] ? (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginBottom: 10, background: '#fff', border: '1px solid #e7eaef', borderRadius: 16,
                  padding: 16, boxShadow: '0 8px 24px rgba(30,42,66,0.14)', zIndex: 20,
                  width: stamp.id === 'fraction' ? 140 : stamp.id === 'root' ? 220 : 200,
                }} aria-label={`${stamp.label} builder`}>
                  {stamp.id === 'fraction' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <MathDraftInput autoFocus value={mathDraft.numerator} placeholder="x" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), numerator: v }))} onEnter={insertDraftMath} />
                      <div style={{ height: 1, width: 60, background: '#aab2bf' }} />
                      <MathDraftInput value={mathDraft.denominator} placeholder="y" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), denominator: v }))} onEnter={insertDraftMath} />
                    </div>
                  ) : stamp.id === 'subscript' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10 }}>
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), base: v }))} onEnter={insertDraftMath} />
                      <MathDraftInput value={mathDraft.subscript} placeholder="a" compact onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), subscript: v }))} onEnter={insertDraftMath} />
                    </div>
                  ) : stamp.id === 'power' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 10 }}>
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), base: v }))} onEnter={insertDraftMath} />
                      <MathDraftInput value={mathDraft.exponent} placeholder="b" compact onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), exponent: v }))} onEnter={insertDraftMath} />
                    </div>
                  ) : stamp.id === 'subscriptPower' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10 }}>
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), base: v }))} onEnter={insertDraftMath} />
                      <div style={{ display: 'grid', gap: 6 }}>
                        <MathDraftInput value={mathDraft.exponent} placeholder="b" compact onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), exponent: v }))} onEnter={insertDraftMath} />
                        <MathDraftInput value={mathDraft.subscript} placeholder="a" compact onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), subscript: v }))} onEnter={insertDraftMath} />
                      </div>
                    </div>
                  ) : stamp.id === 'mixed' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10 }}>
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), base: v }))} onEnter={insertDraftMath} />
                      <div style={{ display: 'grid', gap: 6 }}>
                        <MathDraftInput value={mathDraft.numerator} placeholder="b" compact onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), numerator: v }))} onEnter={insertDraftMath} />
                        <MathDraftInput value={mathDraft.denominator} placeholder="a" compact onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), denominator: v }))} onEnter={insertDraftMath} />
                      </div>
                    </div>
                  ) : stamp.id === 'root' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 8 }}>
                      <MathDraftInput autoFocus value={mathDraft.index} placeholder="n" compact onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), index: v }))} onEnter={insertDraftMath} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: 48, lineHeight: 1, color: '#232c39' }}>√</span>
                        <MathDraftInput value={mathDraft.radicand} placeholder="x" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), radicand: v }))} onEnter={insertDraftMath} />
                      </div>
                    </div>
                  ) : stamp.id === 'degree' ? (
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'center', gap: 4 }}>
                      <MathDraftInput autoFocus value={mathDraft.base} placeholder="x" onChange={(v) => setMathDraft((c) => ({ ...(c || { template: stamp.id }), base: v }))} onEnter={insertDraftMath} />
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#8a93a3' }}>°</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!draftReady}
                    onClick={insertDraftMath}
                    style={{
                      marginTop: 14, width: '100%', textAlign: 'center', fontSize: 16,
                      fontWeight: 700, fontFamily: FONT, border: 'none', background: 'none',
                      cursor: draftReady ? 'pointer' : 'default',
                      color: draftReady ? '#d9892e' : '#cfd5dd',
                    }}
                  >
                    Insert
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => handleMathTool(stamp.id)}
                style={{
                  display: 'grid', placeItems: 'center', height: 38, minWidth: 42,
                  padding: '0 10px', borderRadius: 9, fontFamily: 'Georgia, serif',
                  fontSize: 17, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: mathDraft?.template === stamp.id ? '#d9892e' : '#fbf1e1',
                  color: mathDraft?.template === stamp.id ? '#fff' : '#b06f1f',
                }}
                title={`Insert ${stamp.label}`}
              >
                {stamp.label}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Canvas area */}
      {workingMode === 'draw' && (
        <div ref={scrollRef} style={canvasWrapperStyle(background)}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              display: 'block',
              touchAction: 'none',
              width: `${zoom * 100}%`,
              minWidth: '100%',
              height: compact ? 150 : 260,
            }}
            onPointerDown={beginStroke}
            onPointerMove={moveStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
            aria-label="Working canvas"
          />
        </div>
      )}

      {workingMode === 'steps' && (
        <div style={{ background: '#f5f6f8', padding: 14 }}>
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
        <div style={{ background: '#f5f6f8', padding: 14 }}>
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
      <div style={footerStyle}>
        {required && !submitted && !notNeeded && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#a8743a', marginRight: 'auto' }}>
            Show your working before submitting your answer.
          </span>
        )}
        {allowNoWorking && (
          <button type="button" onClick={markNotNeeded} style={outlineBtnStyle}>
            Working not needed
          </button>
        )}
        <button
          type="button"
          disabled={!hasAnyWorking}
          onClick={submit}
          style={{ ...goldBtnStyle, opacity: hasAnyWorking ? 1 : 0.5, cursor: hasAnyWorking ? 'pointer' : 'default' }}
        >
          <Check style={{ width: 16, height: 16 }} />
          {submitted ? 'Redo/Edit workings' : 'Save working'}
        </button>
      </div>
    </div>
  );
}
