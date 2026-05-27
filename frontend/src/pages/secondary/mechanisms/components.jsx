import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Shuffle, Check, X, AlertTriangle, Lightbulb, ClipboardCheck, Eye, MessagesSquare } from 'lucide-react';
import { Card, Button, Badge } from '../../../components/ui';
import { mechanismsAPI } from '../../../services/api';

// Shared building blocks for the Mechanisms Playground. Tian OS design language
// (navy/gold, hairline borders, rounded cards) with a secondary "technical"
// sub-style: a faint engineering grid lives *only* inside the simulation canvas,
// slate/bone control panels, blue for motion, gold for output, green for correct,
// amber/red for misconceptions. Simulation maths is preserved in the sim files;
// these are the reusable chrome + learning cards.

// ─── useAnimationFrame — rAF ticker, only runs while `running` ──────────
export function useAnimationFrame(running, speed = 1) {
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  useEffect(() => {
    if (!running) return undefined;
    let raf;
    let last = performance.now();
    const loop = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      tRef.current += dt * speed;
      setT(tRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed]);
  return t;
}

// ─── SvgLabel — rounded tag + text inside an SVG ────────────────────────
export function SvgLabel({ x, y, text, color = '#142b4d', bg = '#fff', anchor = 'middle', padding = 6 }) {
  const w = text.length * 7.2 + padding * 2;
  const h = 22;
  const tx = anchor === 'start' ? x + padding : anchor === 'end' ? x - w + padding : x;
  return (
    <g>
      <rect
        x={anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2}
        y={y - h / 2}
        width={w} height={h} rx={6}
        fill={bg} stroke={color} strokeWidth="1.2"
      />
      <text x={tx} y={y + 4} textAnchor={anchor} fontSize="12" fontWeight="600" fill={color}
        fontFamily="Inter, system-ui, sans-serif">{text}</text>
    </g>
  );
}

// ─── SimCanvas — the visually dominant simulation area ──────────────────
// Renders an SVG with a subtle technical grid behind the children. The grid is
// confined to this surface so the rest of the UI stays clean and calm.
export function SimCanvas({ width, height, children, svgRef, ariaLabel, large = false }) {
  const gid = React.useId();
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-hairline bg-navy-50 ${large ? '' : 'shadow-resting'}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={ariaLabel}
        className="block h-auto w-full touch-none"
      >
        <defs>
          <pattern id={gid} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0 H0 V24" fill="none" stroke="#142b4d" strokeWidth="0.5" opacity="0.07" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill={`url(#${gid})`} />
        {children}
      </svg>
    </div>
  );
}

// ─── Readout strip — monospace technical KPIs under the canvas ──────────
export function Readout({ label, value, unit, tone = 'navy' }) {
  const valueTone = tone === 'gold' ? 'text-gold-700' : tone === 'success' ? 'text-success-700' : 'text-navy-700';
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</div>
      <div className={`font-mono text-lg font-semibold tabular-nums ${valueTone}`}>
        {value}{unit && <span className="ml-0.5 text-xs font-medium text-ink-500">{unit}</span>}
      </div>
    </div>
  );
}

export function ReadoutBar({ children }) {
  return <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div>;
}

// ─── Slider — labelled range control on a slate panel ───────────────────
export function Slider({ label, value, onChange, min, max, step = 1, unit, hint, id }) {
  const autoId = React.useId();
  const inputId = id || autoId;
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}{hint && <span className="ml-1.5 font-normal text-ink-500">{hint}</span>}
        </label>
        <span className="font-mono text-sm font-semibold tabular-nums text-navy-700">{value}{unit}</span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bone accent-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40"
      />
    </div>
  );
}

// ─── ControlPanel — slate technical panel wrapping the controls ─────────
export function ControlPanel({ title, children }) {
  return (
    <Card className="p-4">
      {title && <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">{title}</h3>}
      {children}
    </Card>
  );
}

// ─── RunControls — Run / Pause, Reset, Try another ──────────────────────
export function RunControls({ running, ran, onToggle, onReset, onTryAnother }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onToggle} icon={running ? Pause : Play} aria-label={running ? 'Pause simulation' : 'Run simulation'}>
        {running ? 'Pause' : ran ? 'Resume' : 'Run simulation'}
      </Button>
      <Button onClick={onReset} variant="secondary" icon={RotateCcw}>Reset</Button>
      {onTryAnother && (
        <Button onClick={onTryAnother} variant="ghost" icon={Shuffle}>Try another example</Button>
      )}
    </div>
  );
}

// ─── Learning cards ─────────────────────────────────────────────────────
// Section heading shared by the learning cards.
function CardEyebrow({ icon: Icon, children, tone = 'navy' }) {
  const toneCls = tone === 'gold' ? 'text-gold-700' : tone === 'error' ? 'text-error-700' : 'text-navy-700';
  return (
    <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneCls}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}{children}
    </div>
  );
}

// PredictCard — predict first, then run to check. In teacher mode `reveal`
// shows the answer immediately for class discussion.
export function PredictionCard({ question, options, correctIndex, explainRight, explainWrong, simRan, reveal }) {
  const [pick, setPick] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (simRan && pick !== null && !submitted) setSubmitted(true);
  }, [simRan, pick, submitted]);

  const show = submitted || reveal;
  const correct = pick === correctIndex;

  return (
    <Card className="p-5">
      <CardEyebrow icon={Lightbulb} tone="gold">Predict first</CardEyebrow>
      <p className="mb-3 font-display text-lg font-semibold text-navy-700">{question}</p>
      <div className="flex flex-col gap-2" role="group" aria-label="Prediction options">
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          const isPick = i === pick;
          let cls = 'border-hairline bg-paper hover:bg-navy-50';
          if (show && isCorrect) cls = 'border-success-500 bg-success-100 text-success-700';
          else if (show && isPick) cls = 'border-error-500 bg-error-100 text-error-700';
          else if (isPick) cls = 'border-navy-500 bg-navy-50';
          return (
            <button
              key={i}
              type="button"
              onClick={() => !submitted && setPick(i)}
              aria-pressed={isPick}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${cls}`}
            >
              <span className="font-mono font-bold text-gold-600">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{opt}</span>
              {show && isCorrect && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              {show && isPick && !isCorrect && <X className="h-4 w-4 shrink-0" aria-hidden />}
            </button>
          );
        })}
      </div>
      {show && (pick !== null || reveal) && (
        <div className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm ${correct || (reveal && pick === null) ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
          {pick === null && reveal
            ? explainRight
            : correct ? explainRight : `Not quite — ${explainWrong}`}
        </div>
      )}
      {!show && pick !== null && (
        <p className="mt-2.5 text-xs text-ink-500">Got a guess? Run the simulation to check ↓</p>
      )}
      {submitted && !reveal && (
        <button type="button" onClick={() => { setPick(null); setSubmitted(false); }}
          className="mt-2 text-sm font-semibold text-navy-700 hover:underline">Try again</button>
      )}
    </Card>
  );
}

// ObservationCard — student records what they saw (local, no backend yet).
export function ObservationCard({ prompt }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  return (
    <Card className="p-5">
      <CardEyebrow icon={Eye}>Record your observation</CardEyebrow>
      <p className="mb-3 text-sm text-ink-500">{prompt}</p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        rows={3}
        placeholder="Type what you noticed when the mechanism ran…"
        aria-label="Your observation"
        className="w-full resize-y rounded-xl border border-hairline bg-paper px-3.5 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40"
      />
      <div className="mt-2.5 flex items-center gap-3">
        <Button size="s" variant="secondary" onClick={() => setSaved(true)} disabled={!text.trim()}>Save note</Button>
        {saved && <span className="flex items-center gap-1 text-xs font-medium text-success-700"><Check className="h-3.5 w-3.5" />Saved on this device</span>}
      </div>
    </Card>
  );
}

// ExplanationCard — revealed after the sim runs (or always, in teacher reveal).
export function ExplanationCard({ ran, reveal, children, placeholder }) {
  const show = ran || reveal;
  return (
    <Card className="p-5">
      <CardEyebrow icon={Lightbulb}>Why this happens</CardEyebrow>
      {show ? (
        <div className="space-y-2 text-sm leading-relaxed text-ink-700">{children}</div>
      ) : (
        <p className="text-sm text-ink-300">{placeholder || 'Run the simulation, then come back here for a clear explanation.'}</p>
      )}
    </Card>
  );
}

// MisconceptionCard — the common wrong ideas, flagged in amber.
export function MisconceptionCard({ items }) {
  return (
    <Card className="border-l-4 border-l-gold-400 p-5">
      <CardEyebrow icon={AlertTriangle} tone="gold">Common misconception</CardEyebrow>
      <ul className="space-y-2">
        {items.map((m, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-error-500" aria-hidden />
            <span>&ldquo;{m}&rdquo;</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ConceptCheck — short multiple-choice quiz ("Check understanding"). When given a
// `mechanismKey`, finishing records the result to the shared mastery core (D&T
// skill) so it counts on the student's progress like any other module.
export function ConceptCheck({ questions, mechanismKey }) {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState({});
  const [done, setDone] = useState(false);
  const [record, setRecord] = useState('idle'); // idle | saving | saved | skipped | error

  const q = questions[idx];
  const pick = picks[idx];
  const allAnswered = Object.keys(picks).length === questions.length;
  const score = Object.entries(picks).filter(([i, p]) => questions[i].correct === p).length;

  const finish = () => {
    setDone(true);
    if (!mechanismKey) { setRecord('skipped'); return; }
    setRecord('saving');
    const answers = questions.map((qq, i) => ({ index: i, correct: picks[i] === qq.correct }));
    mechanismsAPI.complete(mechanismKey, answers)
      .then(() => setRecord('saved'))
      .catch(() => setRecord('error'));
  };

  const RECORD_NOTE = {
    saving: 'Saving your result…',
    saved: '✓ Recorded to your progress.',
    error: "Couldn't save to your progress (you can still review your answers).",
  };

  if (done) {
    return (
      <Card className="p-5">
        <CardEyebrow icon={ClipboardCheck} tone="gold">Check complete</CardEyebrow>
        <p className="mb-3 font-display text-lg font-semibold text-navy-700">You scored {score} / {questions.length}</p>
        <ul className="space-y-1.5">
          {questions.map((qq, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-500">
              {picks[i] === qq.correct
                ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-500" aria-hidden />
                : <X className="mt-0.5 h-4 w-4 shrink-0 text-error-500" aria-hidden />}
              <span>{qq.q}</span>
            </li>
          ))}
        </ul>
        {RECORD_NOTE[record] && (
          <p className={`mt-3 text-xs font-medium ${record === 'saved' ? 'text-success-700' : record === 'error' ? 'text-error-700' : 'text-ink-500'}`}>{RECORD_NOTE[record]}</p>
        )}
        <Button size="s" variant="secondary" className="mt-4" onClick={() => { setPicks({}); setIdx(0); setDone(false); setRecord('idle'); }}>Take it again</Button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <CardEyebrow icon={ClipboardCheck}>Check understanding</CardEyebrow>
        <span className="text-xs font-medium text-ink-500">{idx + 1} / {questions.length}</span>
      </div>
      <p className="mb-3 font-medium text-ink-700"><span className="mr-1.5 font-mono font-bold text-navy-700">Q{idx + 1}.</span>{q.q}</p>
      <div className="flex flex-col gap-2">
        {q.opts.map((opt, i) => {
          const answered = pick !== undefined;
          let cls = 'border-hairline bg-paper hover:bg-navy-50';
          if (answered && i === q.correct) cls = 'border-success-500 bg-success-100 text-success-700';
          else if (answered && i === pick) cls = 'border-error-500 bg-error-100 text-error-700';
          return (
            <button key={i} type="button" disabled={answered}
              onClick={() => setPicks({ ...picks, [idx]: i })}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${cls}`}>
              <span className="font-mono font-bold text-navy-700">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{opt}</span>
              {answered && i === q.correct && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              {answered && i === pick && i !== q.correct && <X className="h-4 w-4 shrink-0" aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button type="button" disabled={idx === 0} onClick={() => setIdx(idx - 1)}
          className="text-sm font-semibold text-navy-700 disabled:opacity-30">← Previous</button>
        {idx < questions.length - 1
          ? <Button size="s" disabled={pick === undefined} onClick={() => setIdx(idx + 1)}>Next →</Button>
          : <Button size="s" variant="gold" disabled={!allAnswered} onClick={finish}>See results</Button>}
      </div>
    </Card>
  );
}

// DiscussionCard — a teacher-led prompt for whole-class discussion.
export function DiscussionCard({ prompt }) {
  return (
    <Card className="border-l-4 border-l-navy-500 bg-navy-50 p-5">
      <CardEyebrow icon={MessagesSquare}>Discussion prompt</CardEyebrow>
      <p className="font-display text-lg font-medium text-navy-700">{prompt}</p>
    </Card>
  );
}

// Segmented — a compact tab control for a mechanism's sub-modes (lever class,
// pulley type, linkage type). Keyboard accessible; active state not colour-only.
export function Segmented({ label, value, options, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-hairline bg-paper p-0.5" role="tablist" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${active ? 'bg-navy-700 text-white' : 'text-ink-500 hover:text-navy-700'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// KeyConcepts — chips listing the vocabulary for the mechanism.
export function KeyConcepts({ items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => <Badge key={c} tone="outline">{c}</Badge>)}
    </div>
  );
}

// SimShell — the standard simulator layout: dominant canvas + readouts on the
// left/centre, control panel to the right (stacks under on tablet/mobile), then
// the learning cards in a responsive grid below.
export function SimShell({ canvas, readouts, controls, footer, learningCards, presentation }) {
  if (presentation) {
    return (
      <div className="space-y-4">
        {canvas}
        {readouts && <Card className="p-4">{readouts}</Card>}
        {footer}
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {canvas}
          {(readouts || footer) && (
            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              {footer}
              {readouts && <div className="sm:ml-auto">{readouts}</div>}
            </Card>
          )}
        </div>
        <div className="space-y-4">{controls}</div>
      </div>
      {learningCards && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{learningCards}</div>
      )}
    </>
  );
}
