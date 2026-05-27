import React, { useRef, useState } from 'react';
import {
  SimCanvas, SimShell, ControlPanel, RunControls, Slider, Readout, ReadoutBar, Segmented,
  PredictionCard, ObservationCard, ExplanationCard, MisconceptionCard, ConceptCheck,
  DiscussionCard, SvgLabel, useAnimationFrame,
} from '../components.jsx';
import { MECHANISMS } from '../content.js';

const M = MECHANISMS.linkages;
const BLUE = '#4A7FBF';
const GOLD = '#C99A4A';
const INK = '#0F2A54';
const W = 720, H = 460;

function Markers() {
  return (
    <defs>
      <marker id="link-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1B3A75" /></marker>
      <marker id="link-blue-back" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#1B3A75" /></marker>
      <marker id="link-gold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={GOLD} /></marker>
      <marker id="link-gold-back" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill={GOLD} /></marker>
    </defs>
  );
}

function Ground() {
  return (
    <>
      <line x1="20" y1={H - 50} x2={W - 20} y2={H - 50} stroke="#94A3BA" strokeWidth="1.5" />
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={20 + i * 24} y1={H - 50} x2={28 + i * 24} y2={H - 42} stroke="#94A3BA" strokeWidth="1" />
      ))}
    </>
  );
}

function CrankSlider({ running, t, crankLen, conRodLen }) {
  const cx = 180, cy = H / 2 + 30; const slideY = cy;
  const angle = running ? t * 1.5 : 0;
  const px = cx + Math.cos(angle) * crankLen;
  const py = cy + Math.sin(angle) * crankLen;
  const dy = slideY - py;
  const dxSq = conRodLen * conRodLen - dy * dy;
  const dx = dxSq > 0 ? Math.sqrt(dxSq) : 0;
  const sx = px + dx;
  return (
    <g>
      <line x1={cx + crankLen + 30} y1={slideY} x2={W - 40} y2={slideY} stroke="#94A3BA" strokeWidth="2" strokeDasharray="4 4" />
      <rect x={cx + crankLen + 30} y={slideY - 35} width={W - 40 - (cx + crankLen + 30)} height="70" fill="none" stroke="#DCE8F7" strokeWidth="1.5" rx="4" />
      <circle cx={cx} cy={cy} r={crankLen} fill="none" stroke="#DCE8F7" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={cx} y1={cy} x2={px} y2={py} stroke={BLUE} strokeWidth="7" strokeLinecap="round" />
      <line x1={px} y1={py} x2={sx} y2={slideY} stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <rect x={sx - 28} y={slideY - 20} width="56" height="40" rx="6" fill={GOLD} stroke="#8B5E1B" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="8" fill={INK} /><circle cx={cx} cy={cy} r="3" fill="#fff" />
      <circle cx={px} cy={py} r="6" fill="#fff" stroke={BLUE} strokeWidth="3" />
      <SvgLabel x={cx - 16} y={cy + 38} text="Fixed pivot" color={INK} anchor="end" />
      <SvgLabel x={px} y={py - 48} text="Crank pin (input)" color="#1B3A75" />
      <SvgLabel x={(px + sx) / 2} y={slideY - 80} text="Connecting rod" color={INK} />
      <SvgLabel x={sx} y={slideY + 38} text="Slider (output)" color="#8B5E1B" />
      <Ground />
      <line x1={cx} y1={cy} x2={cx} y2={H - 50} stroke={INK} strokeWidth="2" />
    </g>
  );
}

function ReverseMotion({ running, t }) {
  const pivotX = W / 2; const pivotY = H / 2 + 20; const arm = 170;
  const angle = running ? Math.sin(t * 1.4) * 0.35 : 0;
  const ix = pivotX - Math.cos(angle) * arm; const iy = pivotY + Math.sin(angle) * arm;
  const ox = pivotX + Math.cos(angle) * arm; const oy = pivotY - Math.sin(angle) * arm;
  return (
    <g>
      <Ground />
      <rect x={pivotX - 8} y={pivotY} width="16" height={H - 50 - pivotY} fill="#94A3BA" />
      <line x1={ix} y1={iy} x2={ox} y2={oy} stroke={BLUE} strokeWidth="9" strokeLinecap="round" />
      <g>
        <circle cx={ix} cy={iy} r="14" fill="#1B3A75" />
        <text x={ix} y={iy + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">IN</text>
        <path d={`M ${ix - 22} ${iy - 30} L ${ix - 22} ${iy + 30}`} stroke="#1B3A75" strokeWidth="3" markerEnd="url(#link-blue)" markerStart="url(#link-blue-back)" />
      </g>
      <g>
        <circle cx={ox} cy={oy} r="14" fill={GOLD} />
        <text x={ox} y={oy + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">OUT</text>
        <path d={`M ${ox + 22} ${oy - 30} L ${ox + 22} ${oy + 30}`} stroke={GOLD} strokeWidth="3" markerEnd="url(#link-gold)" markerStart="url(#link-gold-back)" />
      </g>
      <circle cx={pivotX} cy={pivotY} r="10" fill={INK} /><circle cx={pivotX} cy={pivotY} r="4" fill="#fff" />
      <SvgLabel x={pivotX} y={pivotY - 28} text="Fixed pivot" color={INK} />
      <SvgLabel x={ix} y={iy + 38} text="Input (push down)" color="#1B3A75" />
      <SvgLabel x={ox} y={oy - 38} text="Output (moves up)" color="#8B5E1B" />
    </g>
  );
}

function ParallelMotion({ running, t }) {
  const groundY = H / 2 + 80; const ax = 200, ay = groundY; const bx = 520, by = groundY; const crankLen = 130;
  const angle = running ? Math.sin(t * 1.2) * 0.55 - 0.6 : -0.6;
  const cx1 = ax + Math.cos(angle) * crankLen; const cy1 = ay + Math.sin(angle) * crankLen;
  const cx2 = bx + Math.cos(angle) * crankLen; const cy2 = by + Math.sin(angle) * crankLen;
  const angDeg = (Math.atan2(cy2 - cy1, cx2 - cx1) * 180) / Math.PI;
  return (
    <g>
      <Ground />
      <rect x={ax - 130} y={groundY} width={bx - ax + 260} height={H - 50 - groundY} fill="#EDF1F8" stroke="#DCE8F7" />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#94A3BA" strokeWidth="6" strokeLinecap="round" />
      <line x1={ax} y1={ay} x2={cx1} y2={cy1} stroke={BLUE} strokeWidth="8" strokeLinecap="round" />
      <line x1={bx} y1={by} x2={cx2} y2={cy2} stroke={BLUE} strokeWidth="8" strokeLinecap="round" />
      <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <g transform={`translate(${(cx1 + cx2) / 2}, ${(cy1 + cy2) / 2}) rotate(${angDeg})`}>
        <rect x="-90" y="-32" width="180" height="22" rx="3" fill={GOLD} stroke="#8B5E1B" strokeWidth="2" />
        <text x="0" y="-16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">PLATFORM • stays horizontal</text>
      </g>
      <circle cx={ax} cy={ay} r="9" fill={INK} /><circle cx={ax} cy={ay} r="3" fill="#fff" />
      <circle cx={bx} cy={by} r="9" fill={INK} /><circle cx={bx} cy={by} r="3" fill="#fff" />
      <circle cx={cx1} cy={cy1} r="7" fill="#fff" stroke={BLUE} strokeWidth="3" />
      <circle cx={cx2} cy={cy2} r="7" fill="#fff" stroke={BLUE} strokeWidth="3" />
      <SvgLabel x={ax} y={ay + 28} text="Fixed pivot A" color={INK} />
      <SvgLabel x={bx} y={by + 28} text="Fixed pivot B" color={INK} />
    </g>
  );
}

const MODE_INFO = {
  reverse: { title: 'Reverse motion linkage', blurb: 'A single bar pivoted in the middle. Push one end down, the other goes up — input and output move in opposite directions.',
    predict: { q: 'If you push the LEFT end down, what happens to the RIGHT end?', opts: ['Goes down too', 'Goes up', 'Stays still', 'Moves sideways'], correct: 1,
      right: 'Exactly — the bar pivots, so opposite ends move opposite ways.', wrong: 'Like a see-saw: when one end goes down, the other must go up.' },
    explain: [<p key="1">A <strong>reverse motion linkage</strong> is the simplest mechanism: one rigid bar with a fixed pivot along it.</p>, <p key="2">Push the input down and the bar rotates about the pivot, so the output is pushed up — the motion is reversed.</p>, <p key="3">A central pivot moves both ends equally; move it toward one end to change the distance ratio, just like a lever.</p>] },
  parallel: { title: 'Parallel motion linkage', blurb: 'Two equal cranks share a coupler bar. The coupler always stays parallel to the ground — useful for carrying something flat through a curve.',
    predict: { q: 'When the cranks rotate, the platform on top will…', opts: ['Tilt and tip its load', 'Stay perfectly horizontal', 'Spin in a circle', 'Move only up and down'], correct: 1,
      right: 'Yes — equal-length cranks keep the coupler parallel to the ground.', wrong: 'Both cranks are the same length and rotate together, so the bar between never tilts.' },
    explain: [<p key="1">A <strong>parallel motion linkage</strong> uses two equal-length cranks pivoted to a fixed bar and joined by a coupler.</p>, <p key="2">Because both cranks turn through the same angle together, the coupler stays parallel to the ground bar — it just translates along a curved path.</p>, <p key="3">Used wherever a load must stay level: lift platforms, drafting lamps, pantographs.</p>] },
  'crank-slider': { title: 'Crank-slider linkage', blurb: 'A rotating crank pushes a connecting rod, which pushes a slider back and forth in a straight line — the heart of an engine.',
    predict: { q: 'If the crank rotates at a steady speed, how does the slider move?', opts: ['Steady straight line, same speed', 'Back and forth, faster at the ends', 'Back and forth, faster in the middle', "It doesn't move"], correct: 2,
      right: 'Right! The slider reciprocates — fastest in the middle of each stroke, slowest at the ends.', wrong: 'The slider pauses at the ends as it changes direction, and is fastest in the middle.' },
    explain: [<p key="1">A <strong>crank-slider</strong> converts rotation into reciprocating straight-line motion (or the reverse).</p>, <p key="2">The <strong>crank</strong> rotates about a fixed pivot; a <strong>connecting rod</strong> joins it to a <strong>slider</strong> that moves along one axis.</p>, <p key="3">In an engine, the burning fuel pushes the piston (slider), the rod turns that into crank rotation, and the crank turns the wheels.</p>] },
};

const QUIZ = [
  { q: 'Which linkage converts rotary motion into straight-line back-and-forth motion?', opts: ['Reverse motion linkage', 'Parallel motion linkage', 'Crank-slider linkage', 'Bell crank'], correct: 2 },
  { q: 'A parallel motion linkage is best for…', opts: ['Reversing the direction of motion', 'Keeping a platform horizontal while it moves', 'Making something spin', 'Locking a mechanism in place'], correct: 1 },
  { q: 'The points where bars join and rotate freely are called…', opts: ['Sliders', 'Pivots', 'Cranks', 'Levers'], correct: 1 },
];

export default function LinkagesSim({ reveal, showDiscussion, presentation }) {
  const [mode, setMode] = useState('crank-slider');
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [crankLen, setCrankLen] = useState(70);
  const [conRodLen, setConRodLen] = useState(180);
  const svgRef = useRef(null);

  const t = useAnimationFrame(running, speed);
  const info = MODE_INFO[mode];

  const toggle = () => { setRunning((v) => !v); if (!ran) setRan(true); };
  const reset = () => { setRunning(false); setRan(false); };
  const setModeReset = (m) => { setMode(m); reset(); };
  const tryAnother = () => {
    const order = ['crank-slider', 'reverse', 'parallel'];
    setModeReset(order[(order.indexOf(mode) + 1) % order.length]);
  };

  const modeToggle = (
    <Segmented label="Linkage type" value={mode}
      options={[{ value: 'crank-slider', label: 'Crank-slider' }, { value: 'reverse', label: 'Reverse' }, { value: 'parallel', label: 'Parallel' }]}
      onChange={setModeReset} />
  );

  const canvas = (
    <SimCanvas svgRef={svgRef} width={W} height={H} large={presentation} ariaLabel={info.title}>
      <Markers />
      {mode === 'crank-slider' && <CrankSlider running={running} t={t} crankLen={crankLen} conRodLen={conRodLen} />}
      {mode === 'reverse' && <ReverseMotion running={running} t={t} />}
      {mode === 'parallel' && <ParallelMotion running={running} t={t} />}
    </SimCanvas>
  );

  const readouts = (
    <ReadoutBar>
      <Readout label="Linkage" value={info.title.replace(' linkage', '')} />
      {mode === 'crank-slider' && <Readout label="Crank length" value={crankLen} unit="px" />}
      {mode === 'crank-slider' && <Readout label="Connecting rod" value={conRodLen} unit="px" tone="gold" />}
    </ReadoutBar>
  );

  const controls = (
    <>
      <ControlPanel title="Linkage type">{modeToggle}</ControlPanel>
      <ControlPanel title="Adjust">
        {mode === 'crank-slider' && (
          <>
            <Slider label="Crank length" value={crankLen} onChange={setCrankLen} min={30} max={110} unit=" px" />
            <Slider label="Connecting rod length" value={conRodLen} onChange={setConRodLen} min={140} max={260} unit=" px" />
          </>
        )}
        <Slider label="Animation speed" value={speed} onChange={setSpeed} min={0.25} max={2.5} step={0.25} unit="×" />
        <p className="text-sm text-ink-500">
          {mode === 'crank-slider'
            ? 'A longer crank gives a longer slider stroke. Try a very short crank and watch the slider barely move.'
            : 'The blue pivots rotate freely; the dark pivot is fixed to the ground.'}
        </p>
      </ControlPanel>
    </>
  );

  const explanation = <>{info.explain}</>;

  const learningCards = presentation ? null : [
    <PredictionCard key="p" reveal={reveal} simRan={ran}
      question={info.predict.q} options={info.predict.opts} correctIndex={info.predict.correct}
      explainRight={info.predict.right} explainWrong={info.predict.wrong} />,
    <ObservationCard key="o" prompt="Run the linkage and describe how the output motion differs from the input motion." />,
    <ExplanationCard key="e" ran={ran} reveal={reveal}>{explanation}</ExplanationCard>,
    <MisconceptionCard key="m" items={M.misconceptions} />,
    <ConceptCheck key="c" questions={QUIZ} mechanismKey={M.key} />,
    ...(showDiscussion ? [<DiscussionCard key="d" prompt={M.discussionPrompt} />] : []),
  ];

  const footer = (
    <div className="flex flex-wrap items-center gap-3">
      {presentation && modeToggle}
      <RunControls running={running} ran={ran} onToggle={toggle} onReset={reset} onTryAnother={tryAnother} />
    </div>
  );

  return (
    <>
      <SimShell presentation={presentation} canvas={canvas} readouts={readouts} controls={controls} footer={footer} learningCards={learningCards} />
      {presentation && reveal && <div className="mt-4"><ExplanationCard ran reveal>{explanation}</ExplanationCard></div>}
      {presentation && showDiscussion && <div className="mt-4"><DiscussionCard prompt={M.discussionPrompt} /></div>}
    </>
  );
}
