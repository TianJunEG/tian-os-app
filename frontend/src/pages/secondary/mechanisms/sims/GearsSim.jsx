import React, { useMemo, useState } from 'react';
import {
  SimCanvas, SimShell, Slider, ControlPanel, RunControls, Readout, ReadoutBar,
  PredictionCard, ObservationCard, ExplanationCard, MisconceptionCard, ConceptCheck,
  DiscussionCard, SvgLabel, useAnimationFrame,
} from '../components.jsx';
import { MECHANISMS } from '../content.js';

const M = MECHANISMS.gears;
const BLUE = '#4A7FBF';
const GOLD = '#C99A4A';
const INK = '#142b4d';

// One toothed gear. Ported from the prototype's GearSVG — trapezoidal teeth,
// hub, spokes and a direction marker, rotated by `rotation` degrees.
function Gear({ cx, cy, teeth, radius, color, rotation }) {
  const innerR = radius * 0.78;
  const toothH = radius * 0.18;
  const path = useMemo(() => {
    let d = '';
    const steps = teeth * 4;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const r = i % 4 < 2 ? radius : radius - toothH;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    return `${d}Z`;
  }, [teeth, radius, cx, cy, toothH]);

  return (
    <g transform={`rotate(${rotation} ${cx} ${cy})`}>
      <path d={path} fill={color} stroke={color} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={innerR * 0.85} fill="#fff" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <line key={i}
            x1={cx + Math.cos(a) * innerR * 0.25} y1={cy + Math.sin(a) * innerR * 0.25}
            x2={cx + Math.cos(a) * innerR * 0.78} y2={cy + Math.sin(a) * innerR * 0.78}
            stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        );
      })}
      <circle cx={cx} cy={cy} r={innerR * 0.18} fill={color} />
      <line x1={cx} y1={cy} x2={cx + radius * 0.7} y2={cy} stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <circle cx={cx + radius * 0.7} cy={cy} r="4" fill={GOLD} />
    </g>
  );
}

const PRESETS = [[12, 24], [10, 30], [16, 16], [20, 8], [14, 42]];
const QUIZ = [
  { q: 'A driver gear has 10 teeth. The driven gear has 30 teeth. What is the gear ratio?', opts: ['1 : 3', '3 : 1', '1 : 30', '10 : 1'], correct: 0 },
  { q: 'Two gears mesh directly and the driver turns clockwise. The driven gear turns…', opts: ['Clockwise', 'Anticlockwise', 'Stays still', 'It depends on size'], correct: 1 },
  { q: 'A gear ratio of 3 : 1 means the driven gear is…', opts: ['Three times faster than the driver', 'Three times slower, with more turning force', 'The same speed as the driver', 'Smaller than the driver'], correct: 1 },
];

export default function GearsSim({ reveal, showDiscussion, presentation }) {
  const [teethA, setTeethA] = useState(12);
  const [teethB, setTeethB] = useState(24);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [presetIdx, setPresetIdx] = useState(0);

  const ratio = teethB / teethA;
  const driverRpm = 60;
  const drivenRpm = driverRpm / ratio;

  const t = useAnimationFrame(running, speed);
  const mod = 6;
  const rA = (teethA * mod) / 2;
  const rB = (teethB * mod) / 2;

  const W = 720, H = 460;
  const gap = rA + rB + 4;
  const cxA = W / 2 - gap / 2;
  const cyA = H / 2 + 10;
  const cxB = W / 2 + gap / 2;

  const rotA = (t * 90) % 360;
  const rotB = -rotA * (teethA / teethB) + 180 / teethB;

  const toggle = () => { setRunning((v) => !v); if (!ran) setRan(true); };
  const reset = () => { setRunning(false); setRan(false); };
  const tryAnother = () => {
    const next = (presetIdx + 1) % PRESETS.length;
    setPresetIdx(next); setTeethA(PRESETS[next][0]); setTeethB(PRESETS[next][1]); reset();
  };

  const canvas = (
    <SimCanvas width={W} height={H} large={presentation} ariaLabel={`Gear simulator: a ${teethA}-tooth driver gear meshed with a ${teethB}-tooth driven gear`}>
      <rect x="20" y={H - 50} width={W - 40} height="30" rx="6" fill="#EDF1F8" stroke="#DCE8F7" />
      <defs>
        <marker id="gear-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1B3A75" /></marker>
        <marker id="gear-arrow-gold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={GOLD} /></marker>
      </defs>
      <path d={`M ${cxA - rA * 1.05} ${cyA - rA * 0.4} A ${rA * 1.2} ${rA * 1.2} 0 0 1 ${cxA + rA * 1.05} ${cyA - rA * 0.4}`}
        fill="none" stroke="#1B3A75" strokeWidth="2.5" strokeDasharray="2 4" markerEnd="url(#gear-arrow-blue)" opacity="0.7" />
      <path d={`M ${cxB + rB * 1.05} ${cyA - rB * 0.4} A ${rB * 1.2} ${rB * 1.2} 0 0 0 ${cxB - rB * 1.05} ${cyA - rB * 0.4}`}
        fill="none" stroke={GOLD} strokeWidth="2.5" strokeDasharray="2 4" markerEnd="url(#gear-arrow-gold)" opacity="0.7" />
      <Gear cx={cxA} cy={cyA} teeth={teethA} radius={rA} color={BLUE} rotation={rotA} />
      <Gear cx={cxB} cy={cyA} teeth={teethB} radius={rB} color={GOLD} rotation={rotB} />
      <circle cx={cxA} cy={cyA} r="3" fill={INK} />
      <circle cx={cxB} cy={cyA} r="3" fill={INK} />
      <SvgLabel x={cxA} y={cyA + rA + 28} text="Driver gear (input)" color="#1B3A75" bg="#E8F0FB" />
      <SvgLabel x={cxB} y={cyA + rB + 28} text="Driven gear (output)" color="#8B5E1B" bg="#F8EED4" />
      <SvgLabel x={cxA} y={cyA - rA - 28} text="Clockwise" color="#1B3A75" />
      <SvgLabel x={cxB} y={cyA - rB - 28} text="Anticlockwise" color="#8B5E1B" />
    </SimCanvas>
  );

  const readouts = (
    <ReadoutBar>
      <Readout label="Driver" value={teethA} unit="T" />
      <Readout label="Driven" value={teethB} unit="T" tone="gold" />
      <Readout label="Ratio" value={`${ratio.toFixed(2)} : 1`} />
      <Readout label="Driven RPM" value={drivenRpm.toFixed(1)} tone="gold" />
    </ReadoutBar>
  );

  const controls = (
    <ControlPanel title="Adjust the gears">
      <Slider label="Driver teeth (T₁)" value={teethA} onChange={(v) => { setTeethA(v); }} min={8} max={36} unit="T" />
      <Slider label="Driven teeth (T₂)" value={teethB} onChange={(v) => { setTeethB(v); }} min={8} max={48} unit="T" />
      <Slider label="Spin speed" value={speed} onChange={setSpeed} min={0.25} max={3} step={0.25} unit="×" />
    </ControlPanel>
  );

  const explanation = (
    <>
      <p><strong>Gear ratio</strong> = teeth on driven ÷ teeth on driver = <strong>{teethB} ÷ {teethA} = {ratio.toFixed(2)}</strong>.</p>
      <p>The driven gear turns <strong>{ratio > 1 ? 'slower' : ratio < 1 ? 'faster' : 'at the same speed'}</strong> than the driver. Two meshed gears always rotate in <strong>opposite directions</strong> — add an idler gear between them to keep the direction the same.</p>
      <p>Gain speed and you lose force; gain force and you lose speed. That trade-off is the heart of every gear system.</p>
    </>
  );

  const learningCards = presentation ? null : [
    <PredictionCard key="p" reveal={reveal} simRan={ran}
      question="If the driver has 12 teeth and the driven has 24 teeth, the driven gear will turn…"
      options={['Twice as fast as the driver', 'Half as fast, with more force', 'At the same speed', 'In the same direction']}
      correctIndex={1}
      explainRight="Yes — a bigger driven gear gives a slower output but more torque, a 'force gear'."
      explainWrong="Look at the ratio: 24 ÷ 12 = 2, so the driven gear turns 2× slower but with 2× the turning force." />,
    <ObservationCard key="o" prompt="Set the driven gear larger than the driver, run it, and note what happens to the driven gear's speed and direction." />,
    <ExplanationCard key="e" ran={ran} reveal={reveal}>{explanation}</ExplanationCard>,
    <MisconceptionCard key="m" items={M.misconceptions} />,
    <ConceptCheck key="c" questions={QUIZ} />,
    ...(showDiscussion ? [<DiscussionCard key="d" prompt={M.discussionPrompt} />] : []),
  ];

  const footer = <RunControls running={running} ran={ran} onToggle={toggle} onReset={reset} onTryAnother={tryAnother} />;

  return (
    <>
      <SimShell presentation={presentation} canvas={canvas} readouts={readouts} controls={controls} footer={footer} learningCards={learningCards} />
      {presentation && reveal && <div className="mt-4"><ExplanationCard ran reveal>{explanation}</ExplanationCard></div>}
      {presentation && showDiscussion && <div className="mt-4"><DiscussionCard prompt={M.discussionPrompt} /></div>}
    </>
  );
}
