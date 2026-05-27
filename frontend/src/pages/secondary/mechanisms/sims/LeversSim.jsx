import React, { useEffect, useRef, useState } from 'react';
import {
  SimCanvas, SimShell, ControlPanel, RunControls, Readout, ReadoutBar, Segmented,
  PredictionCard, ObservationCard, ExplanationCard, MisconceptionCard, ConceptCheck,
  DiscussionCard, SvgLabel, useAnimationFrame,
} from '../components.jsx';
import { MECHANISMS } from '../content.js';

const M = MECHANISMS.levers;
const BLUE = '#4A7FBF';
const GOLD = '#C99A4A';
const INK = '#0F2A54';

const CLASS_INFO = {
  1: { tag: 'Fulcrum in the middle', example: 'See-saw, scissors, crowbar', description: 'Load and effort sit on opposite sides of the fulcrum. Can give a force OR a speed advantage depending on where the fulcrum sits.' },
  2: { tag: 'Load in the middle', example: 'Wheelbarrow, bottle opener', description: 'Fulcrum at one end, effort at the other, load between. Always gives a mechanical advantage — the load feels lighter.' },
  3: { tag: 'Effort in the middle', example: 'Tweezers, fishing rod, your forearm', description: 'Fulcrum at one end, load at the other, effort between. Effort is larger than the load, but the load moves further and faster.' },
};

const QUIZ = [
  { q: 'A wheelbarrow is which class of lever?', opts: ['Class 1', 'Class 2', 'Class 3', 'Not a lever'], correct: 1 },
  { q: 'A class 3 lever (like tweezers) gives you…', opts: ['A force advantage — lift heavy things easily', 'A speed & distance advantage', 'No advantage at all', 'A change in direction only'], correct: 1 },
  { q: 'The point a lever pivots around is called the…', opts: ['Pivot', 'Fulcrum', 'Effort point', 'Both pivot and fulcrum'], correct: 3 },
];

const PREDICT = {
  1: { q: 'If you move the fulcrum closer to the LOAD, what happens?', opts: ['Effort needed gets bigger', 'Effort needed gets smaller', 'Nothing changes', 'The bar breaks'], correct: 1,
    right: 'Yes — a shorter load arm means a longer effort arm, so a smaller effort lifts a bigger load.',
    wrong: 'Think of a see-saw: sit close to the pivot and a friend on the long end lifts you easily.' },
  2: { q: 'Pushing down on a wheelbarrow handle, how does the effort compare to the load?', opts: ['Effort is bigger than the load', 'Effort is smaller than the load', 'Effort equals the load', 'There is no effort'], correct: 1,
    right: "Yes — that's the point of a class 2 lever: the load feels lighter.",
    wrong: 'Lifting a wheelbarrow feels much lighter than carrying the load directly.' },
  3: { q: 'When you use tweezers, why does it feel like hard work?', opts: ['Class 3 is broken', 'Effort is bigger than the load — you trade force for speed and reach', 'The fulcrum is in the wrong place', "You shouldn't use it"], correct: 1,
    right: 'Exactly — and the reward is that the tip moves a long way for a tiny finger movement.',
    wrong: 'Class 3 levers trade force for speed and range, like the tip of a fishing rod.' },
};

export default function LeversSim({ reveal, showDiscussion, presentation }) {
  const [classType, setClassType] = useState(1);
  const [fulcrumX, setFulcrumX] = useState(380);
  const [loadX, setLoadX] = useState(150);
  const [effortX, setEffortX] = useState(610);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  const t = useAnimationFrame(running, 1);
  const tilt = running ? Math.sin(t * 1.4) * 0.18 : 0;

  const W = 760, H = 460;
  const barY = H / 2 + 10;
  const barX1 = 80, barX2 = 680;
  const svgRef = useRef(null);

  // Snap a sensible layout whenever the class changes.
  useEffect(() => {
    if (classType === 1) { setFulcrumX(380); setLoadX(150); setEffortX(610); }
    else if (classType === 2) { setFulcrumX(660); setLoadX(290); setEffortX(120); }
    else { setFulcrumX(660); setLoadX(120); setEffortX(310); }
    setRan(false); setRunning(false);
  }, [classType]);

  const loadArm = Math.abs(loadX - fulcrumX);
  const effortArm = Math.abs(effortX - fulcrumX);
  const ma = effortArm / loadArm;

  const rot = (x, y) => {
    const dx = x - fulcrumX; const dy = y - barY;
    const c = Math.cos(tilt); const s = Math.sin(tilt);
    return [fulcrumX + dx * c - dy * s, barY + dx * s + dy * c];
  };
  const [bx1, by1] = rot(barX1, barY);
  const [bx2, by2] = rot(barX2, barY);
  const [lx, ly] = rot(loadX, barY);
  const [ex, ey] = rot(effortX, barY);

  const pt = (e) => {
    const p = svgRef.current.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svgRef.current.getScreenCTM().inverse());
  };
  const draggable = (target) => {
    let active = false;
    return {
      onPointerDown: (e) => { e.target.setPointerCapture(e.pointerId); active = true; },
      onPointerMove: (e) => {
        if (!active) return;
        const p = pt(e);
        const x = Math.max(barX1 + 20, Math.min(barX2 - 20, p.x));
        if (target === 'fulcrum') { if (classType === 1) setFulcrumX(x); }
        else if (target === 'load') setLoadX(x);
        else if (target === 'effort') setEffortX(x);
      },
      onPointerUp: (e) => { active = false; e.target.releasePointerCapture(e.pointerId); },
      style: { cursor: 'grab' },
    };
  };

  const info = CLASS_INFO[classType];
  const pred = PREDICT[classType];

  const toggle = () => { setRunning((v) => !v); if (!ran) setRan(true); };
  const reset = () => { setRunning(false); setRan(false); };
  const tryAnother = () => setClassType((c) => (c % 3) + 1);

  const classToggle = (
    <Segmented label="Lever class" value={classType}
      options={[{ value: 1, label: 'Class 1' }, { value: 2, label: 'Class 2' }, { value: 3, label: 'Class 3' }]}
      onChange={setClassType} />
  );

  const canvas = (
    <SimCanvas svgRef={svgRef} width={W} height={H} large={presentation}
      ariaLabel={`Class ${classType} lever. Mechanical advantage ${ma.toFixed(2)}. Drag the load, effort${classType === 1 ? ' and fulcrum' : ''} along the bar.`}>
      <defs>
        <marker id="lever-arrow-gold-down" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={GOLD} /></marker>
      </defs>
      <line x1="20" y1={H - 50} x2={W - 20} y2={H - 50} stroke="#94A3BA" strokeWidth="1.5" />
      {Array.from({ length: 32 }).map((_, i) => (
        <line key={i} x1={20 + i * 24} y1={H - 50} x2={28 + i * 24} y2={H - 42} stroke="#94A3BA" strokeWidth="1" />
      ))}
      <polygon points={`${fulcrumX - 24},${H - 50} ${fulcrumX + 24},${H - 50} ${fulcrumX},${barY + 14}`} fill={INK} />
      <SvgLabel x={fulcrumX} y={H - 65} text="Fulcrum / Pivot" color={INK} />
      <line x1={bx1} y1={by1} x2={bx2} y2={by2} stroke={BLUE} strokeWidth="14" strokeLinecap="round" />
      <g>
        <line x1={ex} y1={ey - 70} x2={ex} y2={ey - 18} stroke={GOLD} strokeWidth="5" strokeLinecap="round" markerEnd="url(#lever-arrow-gold-down)" />
        <circle cx={ex} cy={ey - 78} r="22" fill={GOLD} />
        <text x={ex} y={ey - 73} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">EFFORT</text>
      </g>
      <g {...draggable('load')}>
        <circle cx={lx} cy={ly} r="22" fill="rgba(74,127,191,0.18)" />
        <rect x={lx - 24} y={ly + 8} width="48" height="38" rx="4" fill="#1B3A75" />
        <text x={lx} y={ly + 31} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">LOAD</text>
        <circle cx={lx} cy={ly} r="6" fill="#fff" stroke="#1B3A75" strokeWidth="3" />
      </g>
      <g {...draggable('effort')}>
        <circle cx={ex} cy={ey} r="22" fill="rgba(201,154,74,0.18)" />
        <circle cx={ex} cy={ey} r="9" fill="#fff" stroke={GOLD} strokeWidth="3.5" />
      </g>
      {classType === 1 && (
        <g {...draggable('fulcrum')}>
          <circle cx={fulcrumX} cy={barY} r="22" fill="rgba(15,42,84,0.15)" />
          <circle cx={fulcrumX} cy={barY} r="9" fill={INK} stroke="#fff" strokeWidth="3" />
        </g>
      )}
      <line x1={fulcrumX} y1={barY + 50} x2={loadX} y2={barY + 50} stroke="#1B3A75" strokeWidth="2" strokeDasharray="4 4" />
      <text x={(fulcrumX + loadX) / 2} y={barY + 68} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1B3A75">Load arm = {Math.round(loadArm)} px</text>
      <line x1={fulcrumX} y1={barY + 90} x2={effortX} y2={barY + 90} stroke={GOLD} strokeWidth="2" strokeDasharray="4 4" />
      <text x={(fulcrumX + effortX) / 2} y={barY + 108} textAnchor="middle" fontSize="11" fontWeight="600" fill="#8B5E1B">Effort arm = {Math.round(effortArm)} px</text>
      {!running && !ran && (
        <g>
          <rect x={W / 2 - 135} y="14" width="270" height="32" rx="16" fill="rgba(15,42,84,0.92)" />
          <text x={W / 2} y="34" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="600">
            {classType === 1 ? 'Drag fulcrum, load or effort →' : 'Drag load and effort →'}
          </text>
        </g>
      )}
    </SimCanvas>
  );

  const readouts = (
    <ReadoutBar>
      <Readout label="Mechanical advantage" value={ma.toFixed(2)} tone="gold" />
      <Readout label="Load arm" value={Math.round(loadArm)} unit="px" />
      <Readout label="Effort arm" value={Math.round(effortArm)} unit="px" />
      <Readout label="Effect" value={ma > 1 ? 'Force ×' : ma < 1 ? 'Speed ×' : 'Balanced'} />
    </ReadoutBar>
  );

  const controls = (
    <>
      <ControlPanel title="Class of lever">
        <div className="mb-3">{classToggle}</div>
        <p className="text-sm font-medium text-ink-700">{info.tag}</p>
        <p className="mt-1 text-sm text-ink-500">{info.description}</p>
        <p className="mt-2 text-xs text-ink-500">e.g. {info.example}</p>
      </ControlPanel>
      <ControlPanel>
        <p className="text-sm text-ink-500">Drag the <strong className="text-navy-700">load</strong>, <strong className="text-navy-700">effort</strong>{classType === 1 && <> and <strong className="text-navy-700">fulcrum</strong></>} on the bar, then run it to watch the lever rock.</p>
      </ControlPanel>
    </>
  );

  const explanation = (
    <>
      <p><strong>Law of the lever:</strong> Load × load arm = Effort × effort arm.</p>
      <p>Here the load arm is <strong>{Math.round(loadArm)}</strong> and the effort arm is <strong>{Math.round(effortArm)}</strong>, so mechanical advantage = effort arm ÷ load arm = <strong>{ma.toFixed(2)}</strong>.</p>
      <p>{ma > 1 ? 'An MA above 1 lets you lift a load heavier than your push — but the load moves a shorter distance.' : ma < 1 ? 'An MA below 1 means your push is bigger than the load — but the load moves further and faster.' : 'An MA of exactly 1 is a balance: no force gain, no speed gain.'}</p>
    </>
  );

  const learningCards = presentation ? null : [
    <PredictionCard key="p" reveal={reveal} simRan={ran}
      question={pred.q} options={pred.opts} correctIndex={pred.correct}
      explainRight={pred.right} explainWrong={pred.wrong} />,
    <ObservationCard key="o" prompt="Drag the fulcrum and watch the load and effort arms. Note how the mechanical advantage changes." />,
    <ExplanationCard key="e" ran={ran} reveal={reveal}>{explanation}</ExplanationCard>,
    <MisconceptionCard key="m" items={M.misconceptions} />,
    <ConceptCheck key="c" questions={QUIZ} mechanismKey={M.key} />,
    ...(showDiscussion ? [<DiscussionCard key="d" prompt={M.discussionPrompt} />] : []),
  ];

  const footer = (
    <div className="flex flex-wrap items-center gap-3">
      {classToggle}
      <RunControls running={running} ran={ran} onToggle={toggle} onReset={reset} onTryAnother={tryAnother} />
    </div>
  );

  return (
    <>
      <SimShell presentation={presentation} canvas={canvas} readouts={readouts} controls={controls} footer={presentation ? footer : <RunControls running={running} ran={ran} onToggle={toggle} onReset={reset} onTryAnother={tryAnother} />} learningCards={learningCards} />
      {presentation && reveal && <div className="mt-4"><ExplanationCard ran reveal>{explanation}</ExplanationCard></div>}
      {presentation && showDiscussion && <div className="mt-4"><DiscussionCard prompt={M.discussionPrompt} /></div>}
    </>
  );
}
