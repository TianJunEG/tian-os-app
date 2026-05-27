import React, { useEffect, useState } from 'react';
import {
  SimCanvas, SimShell, ControlPanel, RunControls, Slider, Readout, ReadoutBar, Segmented,
  PredictionCard, ObservationCard, ExplanationCard, MisconceptionCard, ConceptCheck,
  DiscussionCard, SvgLabel, useAnimationFrame,
} from '../components.jsx';
import { MECHANISMS } from '../content.js';

const M = MECHANISMS.pulleys;
const GOLD = '#C99A4A';
const INK = '#0F2A54';

function PulleyWheel({ cx, cy, r, color = INK, spin = 0 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={color} strokeWidth="3.5" />
      <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <g transform={`rotate(${spin} ${cx} ${cy})`}>
        {[0, 60, 120].map((a) => (
          <line key={a}
            x1={cx + Math.cos((a * Math.PI) / 180) * (r - 4)} y1={cy + Math.sin((a * Math.PI) / 180) * (r - 4)}
            x2={cx - Math.cos((a * Math.PI) / 180) * (r - 4)} y2={cy - Math.sin((a * Math.PI) / 180) * (r - 4)}
            stroke={color} strokeWidth="2" opacity="0.7" />
        ))}
      </g>
      <circle cx={cx} cy={cy} r="4" fill={color} />
    </g>
  );
}

const TYPE_INFO = {
  fixed: { title: 'Fixed pulley', blurb: 'A pulley anchored to the ceiling that changes the direction of your effort. Pull down — the load goes up.',
    predict: { q: 'With a fixed pulley, to lift a 10 kg load you must pull with…', opts: ['5 kg of force', '10 kg of force', '20 kg of force', 'No force at all'], correct: 1,
      right: "Yes — a fixed pulley doesn't reduce the effort, it just changes the direction.", wrong: 'A fixed pulley has a mechanical advantage of 1: it changes direction, not size.' } },
  movable: { title: 'Movable pulley', blurb: 'The pulley is attached to the load. Two rope segments share the weight, so you only need half the effort.',
    predict: { q: 'To lift the load by 1 m with a single movable pulley, you must pull rope by…', opts: ['0.5 m', '1 m', '2 m', "It doesn't matter"], correct: 2,
      right: 'Right! Trade pulling distance for less effort: pull 2 m, the load rises 1 m.', wrong: 'Energy in must equal energy out — half the effort means double the distance pulled.' } },
  'block-and-tackle': { title: 'Block-and-tackle', blurb: 'Fixed and movable pulleys combined. Four rope segments share the load for a large mechanical advantage, but you pull a lot of rope.',
    predict: { q: 'With 4 rope segments supporting the load, lifting a 100 N load needs roughly…', opts: ['100 N', '50 N', '25 N', '400 N'], correct: 2,
      right: 'Yes — load shared among 4 segments. MA = 4, trading rope distance for effort.', wrong: 'Count the rope segments supporting the load: each carries an equal share.' } },
};

const QUIZ = [
  { q: 'What is the mechanical advantage of a single fixed pulley?', opts: ['1', '2', '0', '4'], correct: 0 },
  { q: 'A single movable pulley gives MA = 2. To lift a load 1 m, how much rope do you pull?', opts: ['0.5 m', '1 m', '2 m', '4 m'], correct: 2 },
  { q: 'Pulleys are most useful when you need to…', opts: ['Increase the speed of a wheel', 'Lift heavy loads with less effort, or change the pulling direction', 'Generate electricity', 'Reduce friction'], correct: 1 },
];

export default function PulleysSim({ reveal, showDiscussion, presentation }) {
  const [type, setType] = useState('fixed');
  const [pull, setPull] = useState(0);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  const t = useAnimationFrame(running, 1);
  useEffect(() => {
    if (!running) return;
    setPull((Math.sin(t * 1.0 - Math.PI / 2) + 1) / 2);
  }, [t, running]);

  const W = 760, H = 480;
  const ceilingY = 60;

  let config;
  if (type === 'fixed') {
    const px = W / 2; const py = ceilingY + 60; const r = 28; const drop = 220;
    const loadY = ceilingY + 80 + drop * (1 - pull);
    const handY = ceilingY + 80 + drop * pull;
    config = { pulleys: [{ x: px, y: py, r, fixed: true }],
      ropeSegments: [{ x1: px - r, y1: py, x2: px - r, y2: loadY }, { x1: px + r, y1: py, x2: px + r, y2: handY }],
      load: { x: px - r, y: loadY }, hand: { x: px + r, y: handY }, ma: 1, ropeMove: pull * drop, loadMove: pull * drop };
  } else if (type === 'movable') {
    const anchorX = W / 2 - 130; const fixedX = W / 2 + 70; const fixedY = ceilingY + 50;
    const movR = 28; const fixedR = 24; const drop = 200;
    const loadY = ceilingY + 100 + drop * (1 - pull);
    const movableX = (anchorX + fixedX) / 2 + 10; const movableY = loadY - movR;
    const handY = ceilingY + 80 + drop * pull * 2;
    config = { pulleys: [{ x: fixedX, y: fixedY, r: fixedR, fixed: true }, { x: movableX, y: movableY, r: movR, fixed: false }],
      ropeSegments: [{ x1: anchorX, y1: ceilingY, x2: movableX - movR, y2: movableY }, { x1: movableX + movR, y1: movableY, x2: fixedX - fixedR, y2: fixedY }, { x1: fixedX + fixedR, y1: fixedY, x2: fixedX + fixedR, y2: handY }],
      anchor: { x: anchorX, y: ceilingY }, load: { x: movableX, y: loadY }, hand: { x: fixedX + fixedR, y: handY }, ma: 2, ropeMove: pull * drop * 2, loadMove: pull * drop };
  } else {
    const fixedY = ceilingY + 50; const fixedR = 22; const movR = 22; const cx = W / 2;
    const fixedL = { x: cx - 36, y: fixedY, r: fixedR }; const fixedRp = { x: cx + 36, y: fixedY, r: fixedR };
    const drop = 180; const loadY = ceilingY + 130 + drop * (1 - pull); const movY = loadY - movR;
    const movL = { x: cx - 36, y: movY, r: movR }; const movRp = { x: cx + 36, y: movY, r: movR };
    const handY = ceilingY + 100 + drop * pull * 4;
    config = { pulleys: [{ ...fixedL, fixed: true }, { ...fixedRp, fixed: true }, { ...movL, fixed: false }, { ...movRp, fixed: false }],
      ropeSegments: [
        { x1: fixedL.x - fixedR - 8, y1: ceilingY, x2: movL.x - movR, y2: movL.y },
        { x1: movL.x + movR, y1: movL.y, x2: fixedL.x - fixedR + 6, y2: fixedL.y },
        { x1: fixedL.x + fixedR - 6, y1: fixedL.y, x2: fixedRp.x - fixedR + 6, y2: fixedRp.y },
        { x1: fixedRp.x - fixedR + 6, y1: fixedRp.y, x2: movRp.x - movR, y2: movRp.y },
        { x1: movRp.x + movR, y1: movRp.y, x2: fixedRp.x + fixedR, y2: fixedRp.y },
        { x1: fixedRp.x + fixedR, y1: fixedRp.y, x2: fixedRp.x + fixedR, y2: handY },
      ],
      anchor: { x: fixedL.x - fixedR - 8, y: ceilingY }, load: { x: cx, y: loadY }, hand: { x: fixedRp.x + fixedR, y: handY }, ma: 4, ropeMove: pull * drop * 4, loadMove: pull * drop };
  }

  const info = TYPE_INFO[type];

  const toggle = () => { setRunning((v) => !v); if (!ran) setRan(true); };
  const reset = () => { setPull(0); setRunning(false); setRan(false); };
  const setTypeReset = (tp) => { setType(tp); setPull(0); setRunning(false); setRan(false); };
  const tryAnother = () => {
    const order = ['fixed', 'movable', 'block-and-tackle'];
    setTypeReset(order[(order.indexOf(type) + 1) % order.length]);
  };

  const typeToggle = (
    <Segmented label="Pulley type" value={type}
      options={[{ value: 'fixed', label: 'Fixed' }, { value: 'movable', label: 'Movable' }, { value: 'block-and-tackle', label: 'Block & tackle' }]}
      onChange={setTypeReset} />
  );

  const canvas = (
    <SimCanvas width={W} height={H} large={presentation}
      ariaLabel={`${info.title} with mechanical advantage ${config.ma}. Drag the slider to pull the rope and lift the load.`}>
      <defs>
        <marker id="pulley-arrow-gold-down" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={GOLD} /></marker>
        <marker id="pulley-arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2F8F6F" /></marker>
      </defs>
      <rect x="20" y="20" width={W - 40} height={ceilingY - 20} fill="#EDF1F8" stroke="#DCE8F7" />
      {Array.from({ length: 32 }).map((_, i) => (
        <line key={i} x1={20 + i * 24} y1={ceilingY} x2={28 + i * 24} y2={ceilingY - 8} stroke="#94A3BA" strokeWidth="1" />
      ))}
      {config.anchor && (
        <g>
          <rect x={config.anchor.x - 8} y={ceilingY - 4} width="16" height="10" fill="#94A3BA" />
          <SvgLabel x={config.anchor.x} y={ceilingY - 18} text="Fixed anchor" color={INK} />
        </g>
      )}
      {config.ropeSegments.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#1B3A75" strokeWidth="3" strokeLinecap="round" />
      ))}
      {type === 'fixed' && (
        <path d={`M ${config.pulleys[0].x - config.pulleys[0].r} ${config.pulleys[0].y} A ${config.pulleys[0].r} ${config.pulleys[0].r} 0 0 1 ${config.pulleys[0].x + config.pulleys[0].r} ${config.pulleys[0].y}`} fill="none" stroke="#1B3A75" strokeWidth="3" strokeLinecap="round" />
      )}
      {type === 'movable' && config.pulleys.map((p, i) => (
        <path key={i} d={`M ${p.x - p.r} ${p.y} A ${p.r} ${p.r} 0 0 1 ${p.x + p.r} ${p.y}`} fill="none" stroke="#1B3A75" strokeWidth="3" />
      ))}
      {type === 'block-and-tackle' && config.pulleys.map((p, i) => (
        <path key={i} d={`M ${p.x - p.r} ${p.y} A ${p.r} ${p.r} 0 0 ${p.fixed ? 1 : 0} ${p.x + p.r} ${p.y}`} fill="none" stroke="#1B3A75" strokeWidth="3" />
      ))}
      {config.pulleys.map((p, i) => (
        <g key={i}>
          {p.fixed && <line x1={p.x} y1={ceilingY} x2={p.x} y2={p.y - p.r} stroke="#94A3BA" strokeWidth="2" />}
          <PulleyWheel cx={p.x} cy={p.y} r={p.r} spin={running ? pull * 360 * (p.fixed ? 1 : -1) : 0} />
          {type === 'movable' && <SvgLabel x={p.x} y={p.y - p.r - 12} text={p.fixed ? 'Fixed pulley' : 'Movable pulley'} color="#1B3A75" />}
        </g>
      ))}
      {type === 'movable' && <line x1={config.load.x} y1={config.load.y} x2={config.load.x} y2={config.pulleys[1].y} stroke={INK} strokeWidth="3" />}
      {type === 'block-and-tackle' && (
        <>
          <line x1={config.load.x - 36} y1={config.load.y} x2={config.load.x - 36} y2={config.pulleys[2].y} stroke={INK} strokeWidth="3" />
          <line x1={config.load.x + 36} y1={config.load.y} x2={config.load.x + 36} y2={config.pulleys[3].y} stroke={INK} strokeWidth="3" />
        </>
      )}
      <rect x={config.load.x - 40} y={config.load.y} width="80" height="60" rx="6" fill={GOLD} stroke="#8B5E1B" strokeWidth="2" />
      <text x={config.load.x} y={config.load.y + 36} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">LOAD</text>
      {(running || pull > 0.05) && (
        <path d={`M ${config.load.x + 60} ${config.load.y + 30} L ${config.load.x + 60} ${config.load.y + 5}`} stroke="#2F8F6F" strokeWidth="3" markerEnd="url(#pulley-arrow-green)" />
      )}
      <circle cx={config.hand.x} cy={config.hand.y} r="20" fill={INK} />
      <text x={config.hand.x} y={config.hand.y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">PULL</text>
      <path d={`M ${config.hand.x + 30} ${config.hand.y - 30} L ${config.hand.x + 30} ${config.hand.y + 5}`} stroke={GOLD} strokeWidth="3" markerEnd="url(#pulley-arrow-gold-down)" />
      <rect x="20" y={H - 60} width="170" height="40" rx="20" fill={GOLD} />
      <text x="105" y={H - 35} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">EFFORT = LOAD ÷ {config.ma}</text>
    </SimCanvas>
  );

  const readouts = (
    <ReadoutBar>
      <Readout label="Mechanical advantage" value={config.ma} tone="gold" />
      <Readout label="Rope pulled" value={config.ropeMove.toFixed(0)} unit="px" />
      <Readout label="Load lifted" value={config.loadMove.toFixed(0)} unit="px" tone="success" />
    </ReadoutBar>
  );

  const controls = (
    <>
      <ControlPanel title="Pulley type">{typeToggle}</ControlPanel>
      <ControlPanel title="Pull the rope">
        <Slider label="Rope pulled" value={Math.round(pull * 100)} onChange={(v) => { setPull(v / 100); if (!ran) setRan(true); setRunning(false); }} min={0} max={100} unit="%" />
        <p className="text-sm text-ink-500">Drag slowly and watch the load. Fixed: rope and load move equally. Movable: rope moves twice as far. Block &amp; tackle: four times as far.</p>
      </ControlPanel>
    </>
  );

  const explanation = (
    <>
      {type === 'fixed' && (<><p>A <strong>fixed pulley</strong> gives no force advantage (MA = 1) but lets you pull DOWN instead of UP, so you can use your body weight.</p><p>Rope distance = load distance, and effort = load.</p></>)}
      {type === 'movable' && (<><p>A <strong>movable pulley</strong> attaches to the load. Two rope segments hold it up, so each carries half the weight.</p><p>That gives MA = 2: effort = load ÷ 2 — but you must pull 2 m of rope to raise the load 1 m.</p></>)}
      {type === 'block-and-tackle' && (<><p>A <strong>block-and-tackle</strong> combines fixed and movable pulleys to share the load over many rope segments.</p><p>Here 4 segments support the load, so MA = 4: effort = load ÷ 4, but you pull 4 m of rope per 1 m lifted.</p></>)}
    </>
  );

  const learningCards = presentation ? null : [
    <PredictionCard key="p" reveal={reveal} simRan={ran}
      question={info.predict.q} options={info.predict.opts} correctIndex={info.predict.correct}
      explainRight={info.predict.right} explainWrong={info.predict.wrong} />,
    <ObservationCard key="o" prompt="Pull the rope to 100% and compare how far the rope moved with how far the load rose." />,
    <ExplanationCard key="e" ran={ran} reveal={reveal}>{explanation}</ExplanationCard>,
    <MisconceptionCard key="m" items={M.misconceptions} />,
    <ConceptCheck key="c" questions={QUIZ} />,
    ...(showDiscussion ? [<DiscussionCard key="d" prompt={M.discussionPrompt} />] : []),
  ];

  const footer = (
    <div className="flex flex-wrap items-center gap-3">
      {presentation && typeToggle}
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
