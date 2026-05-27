// screens-3-4.jsx — Fluency Practice + AI Remediation

// =====================================================================
// SCREEN 3 — Timed Fluency Practice
// =====================================================================
function ScreenFluency({ onBack, onOpenRemediation }) {
  // Question deck for the demo
  const deck = [
    { q: '7 × 8',  a: 56, target: 2 },
    { q: '9 × 6',  a: 54, target: 2 },
    { q: '8 × 7',  a: 56, target: 2 },
    { q: '12 × 4', a: 48, target: 3 },
    { q: '6 × 9',  a: 54, target: 2 },
    { q: '11 × 7', a: 77, target: 3 },
    { q: '8 × 8',  a: 64, target: 2 },
    { q: '9 × 9',  a: 81, target: 2 },
  ];
  const total = 30;

  // State
  const [phase, setPhase] = useState('play'); // play | summary
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // null | 'ok' | 'no'
  const [streak, setStreak] = useState(4);
  const [bestStreak, setBestStreak] = useState(4);
  const [correct, setCorrect] = useState(11);
  const [done, setDone] = useState(11);
  const [elapsed, setElapsed] = useState(0);
  const [responseStart, setResponseStart] = useState(Date.now());
  const [lastTime, setLastTime] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setResponseStart(Date.now());
  }, [idx]);

  const q = deck[idx % deck.length];
  const responseSec = lastTime ?? ((Date.now() - responseStart) / 1000);

  function submit(val) {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) return;
    const dt = (Date.now() - responseStart) / 1000;
    const ok = v === q.a;
    setLastTime(dt);
    setFeedback(ok ? 'ok' : 'no');
    if (ok) {
      setCorrect(c => c + 1);
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
    setDone(d => d + 1);
    setTimeout(() => {
      if (done + 1 >= 18) {
        setPhase('summary');
      } else {
        setIdx(i => i + 1);
        setInput('');
        setFeedback(null);
        setLastTime(null);
      }
    }, 900);
  }

  function tapKey(k) {
    if (feedback) return;
    if (k === 'back') setInput(input.slice(0, -1));
    else if (k === 'enter') submit(input);
    else if (input.length < 4) setInput(input + k);
  }

  if (phase === 'summary') {
    return <FluencySummary onBack={onBack} onOpenRemediation={onOpenRemediation}
      correct={correct} done={done} bestStreak={bestStreak} />;
  }

  const pct = (done / total) * 100;
  const mm = String(Math.floor(elapsed / 60)).padStart(1, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const minimal = true;

  // Speed dial color
  const dt = responseSec;
  const speedColor = dt < q.target ? T.success500 : dt < q.target * 1.5 ? T.gold500 : T.error500;

  return (
    <div style={{ background: T.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '54px 20px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 12,
          background: T.bone, display: 'grid', placeItems: 'center', color: T.navy700,
        }}><IconX size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, color: T.ink500, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Fluency · ×7 & ×8 tables</div>
          <div style={{
            fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
            fontSize: 13, color: T.ink700, fontWeight: 600, marginTop: 1,
          }}>{done} / {total}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.navy050, padding: '6px 10px', borderRadius: 999,
          color: T.navy700, fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
          fontWeight: 600, fontSize: 13,
        }}>
          <IconClock size={13} />{mm}:{ss}
        </div>
      </div>

      {/* progress thread */}
      <div style={{ padding: '0 20px 0' }}>
        <div style={{ height: 3, borderRadius: 999, background: T.bone, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${T.navy700}, ${T.gold500})`,
            transition: `width 400ms ${T.easeCalm}`,
          }} />
        </div>
      </div>

      {/* ── Streak ────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <StreakRow streak={streak} />
      </div>

      {/* ── Big question ──────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}>
        <div style={{
          fontSize: 11, color: T.ink500, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18,
        }}>Question {done + 1}</div>
        <div style={{
          fontFamily: T.fontDisplay, fontWeight: 500,
          fontSize: 72, color: T.navy700, letterSpacing: '-0.04em',
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          transition: `opacity 200ms ${T.easeCalm}`,
          opacity: feedback ? 0.6 : 1,
        }}>
          {q.q} <span style={{ color: T.ink300 }}>=</span>
        </div>

        {/* Answer + feedback row */}
        <div style={{
          marginTop: 28, minHeight: 80, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 56, fontWeight: 500,
            color: feedback === 'ok' ? T.success500 : feedback === 'no' ? T.error500 : T.navy700,
            letterSpacing: '-0.04em', minHeight: 64, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {input || <span style={{ color: T.ink100 }}>·</span>}
            {feedback === 'ok' && <IconCheck size={36} color={T.success500} />}
            {feedback === 'no' && <IconX size={36} color={T.error500} />}
          </div>
          {feedback === 'no' && (
            <div style={{ fontSize: 13, color: T.ink500, marginTop: 8, lineHeight: 1.4, textAlign: 'center' }}>
              The answer is <b style={{ color: T.navy700 }}>{q.a}</b>. Watch for ×7 carries.
            </div>
          )}
          {feedback === 'ok' && (
            <div style={{ fontSize: 12, color: speedColor, fontWeight: 600, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
              {lastTime?.toFixed(1)}s {lastTime < q.target ? '· fast' : lastTime < q.target * 1.5 ? '· steady' : '· slow'}
            </div>
          )}
        </div>
      </div>

      {/* ── Keypad ────────────────────────────────── */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['1','2','3','4','5','6','7','8','9'].map(k => (
            <KeyBtn key={k} onClick={() => tapKey(k)}>{k}</KeyBtn>
          ))}
          <KeyBtn onClick={() => tapKey('back')} muted><IconX size={20} /></KeyBtn>
          <KeyBtn onClick={() => tapKey('0')}>0</KeyBtn>
          <KeyBtn onClick={() => tapKey('enter')} primary>
            <IconCheck size={20} />
          </KeyBtn>
        </div>
      </div>
    </div>
  );
}

function KeyBtn({ children, onClick, muted, primary }) {
  return (
    <button onClick={onClick} style={{
      height: 58, borderRadius: 16,
      background: primary ? T.navy700 : muted ? T.bone : T.paper,
      border: primary || muted ? 'none' : `1px solid ${T.hairline}`,
      color: primary ? T.gold500 : T.navy700,
      fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 500,
      letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: primary ? T.shadowResting : 'none',
      transition: `transform 100ms ${T.easeCalm}`,
    }}>{children}</button>
  );
}

function StreakRow({ streak }) {
  // Show last 6 cells with the current streak filled in gold
  const total = 6;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontSize: 11, color: T.ink500, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>Streak</span>
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < Math.min(streak, total);
          return (
            <div key={i} style={{
              width: 18, height: 8, borderRadius: 4,
              background: filled ? T.gold500 : T.bone,
              transition: `background 240ms ${T.easeCalm}`,
            }} />
          );
        })}
      </div>
      <span style={{
        fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
        fontSize: 13, fontWeight: 600, color: T.navy700, marginLeft: 4,
      }}>{streak}</span>
    </div>
  );
}

// ── Session-end summary ──────────────────────────────────
function FluencySummary({ onBack, onOpenRemediation, correct, done, bestStreak }) {
  const accuracy = Math.round((correct / done) * 100);
  const avgTime = 1.7;
  return (
    <div style={{ background: T.ivory, height: '100%', overflow: 'auto', paddingBottom: 40 }}>
      <div style={{ padding: '54px 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 12,
          background: T.paper, border: `1px solid ${T.hairline}`,
          display: 'grid', placeItems: 'center', color: T.navy700,
        }}><IconX size={18} /></button>
        <div style={{ flex: 1, fontSize: 13, color: T.ink500, fontWeight: 600 }}>Session complete</div>
      </div>

      <div style={{ padding: '16px 20px 8px', textAlign: 'center' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: T.gold700,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        }}>×7 & ×8 fluency</div>
        <div style={{
          fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 30,
          color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>Sharper than yesterday.</div>
        <div style={{ fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5, maxWidth: 280, margin: '8px auto 0' }}>
          Speed up 0.4s on average. Two questions slipped on ×7 carries — we'll come back to them tomorrow.
        </div>
      </div>

      {/* Big rings */}
      <div style={{ padding: '24px 20px 0', display: 'flex', justifyContent: 'center', gap: 18 }}>
        <Ring value={accuracy} size={104} stroke={10} label={`${accuracy}%`} sub="accuracy" gold />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          <SummaryStat label="Avg time" value={`${avgTime.toFixed(1)}s`} delta="−0.4s" tone="good" />
          <SummaryStat label="Best streak" value={bestStreak} delta="new high" tone="good" />
        </div>
      </div>

      {/* Mastery delta */}
      <div style={{ padding: '24px 20px 0' }}>
        <Card padding={18}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.ink500,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          }}>Mastery gained</div>
          {[
            { name: 'Multiplication × 7', before: 64, after: 78 },
            { name: 'Multiplication × 8', before: 72, after: 83, gold: true },
            { name: 'Mental math fluency', before: 58, after: 64 },
          ].map((m, i) => (
            <div key={m.name} style={{
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${T.hairline}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: T.ink700, fontWeight: 500 }}>{m.name}</span>
                <span style={{
                  fontSize: 12, fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                  color: T.success500, fontWeight: 600,
                }}>+{m.after - m.before}</span>
              </div>
              <DualBar before={m.before} after={m.after} gold={m.gold} />
            </div>
          ))}
        </Card>
      </div>

      {/* Recommended next */}
      <div style={{ padding: '20px 20px 0' }}>
        <Card padding={18} style={{
          background: T.navy700, border: 'none', color: T.paper,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.gold300,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
          }}>Recommended next</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Regrouping across zero
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.5, marginBottom: 14 }}>
            3 misses today follow the same pattern. A 4-minute remediation should clear it.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="gold" size="m" onClick={onOpenRemediation} iconRight={<IconArrowRight size={16} />}>Start</Button>
            <Button variant="ghost" size="m" style={{ color: 'rgba(255,255,255,.8)' }}>Later</Button>
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="m" fullWidth>Another drill</Button>
        <Button variant="ghost" size="m" fullWidth onClick={onBack}>Done for now</Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, delta, tone }) {
  return (
    <div>
      <div style={{
        fontSize: 11, color: T.ink500, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
        fontSize: 22, fontWeight: 600, color: T.navy700,
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 11, color: T.success500, fontWeight: 600, marginTop: 2 }}>
          {delta}
        </div>
      )}
    </div>
  );
}

function DualBar({ before, after, gold }) {
  return (
    <div style={{ position: 'relative', height: 7, borderRadius: 999, background: T.bone, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${before}%`, background: T.navy300, borderRadius: 999,
      }} />
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${after}%`,
        background: gold ? `linear-gradient(90deg, ${T.navy700}, ${T.gold500})` : T.navy700,
        borderRadius: 999,
        transition: `width 800ms ${T.easeCalm}`,
      }} />
    </div>
  );
}


// =====================================================================
// SCREEN 4 — AI Remediation
// =====================================================================
function ScreenRemediation({ onBack, onOpenFluency }) {
  const [step, setStep] = useState(0); // 0 worked · 1 guided · 2 independent · 3 fluency
  const steps = [
    { id: 'worked', label: 'Worked example', sub: 'Watch the pattern' },
    { id: 'guided', label: 'Guided pattern', sub: 'Fill the blanks' },
    { id: 'independ', label: 'Independent', sub: 'Solve on your own' },
    { id: 'fluency', label: 'Fluency', sub: 'Build automaticity' },
  ];

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* ── Header ────────────────────────────────── */}
      <div style={{ padding: '54px 20px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 12,
          background: T.bone, display: 'grid', placeItems: 'center', color: T.navy700,
        }}><IconArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.gold700, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            AI Remediation
          </div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600,
            color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 1,
          }}>Regrouping across zero</div>
        </div>
        <Chip size="s" tone="gold" icon={<IconSparkle size={11} />}>4 min</Chip>
      </div>

      {/* ── Misconception explainer (collapsible icon-pill) ─ */}
      <div style={{ padding: '8px 20px 0' }}>
        <Hint label="Why we're here" title="What we noticed">
          When we regroup across a zero, the zero doesn't stay a zero — it becomes a nine as the regroup ripples through. Let's rebuild the pattern together.
        </Hint>
      </div>

      {/* ── 4-step flow indicator ────────────────── */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {steps.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} style={{ flex: 1 }}>
                <div style={{
                  height: 3, borderRadius: 999,
                  background: isActive ? T.gold500 : isDone ? T.navy700 : T.bone,
                  marginBottom: 6,
                  transition: `background 240ms ${T.easeCalm}`,
                }} />
                <div style={{
                  fontSize: 10, fontWeight: 600, color: isActive || isDone ? T.navy700 : T.ink300,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Body panel for current step ──────────── */}
      <div style={{ padding: '18px 20px 0' }}>
        {step === 0 && <WorkedExample />}
        {step === 1 && <GuidedPattern />}
        {step === 2 && <IndependentPractice />}
        {step === 3 && <FluencyReinforce onOpenFluency={onOpenFluency} />}
      </div>

      {/* ── Step nav ──────────────────────────────── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', gap: 10 }}>
        {step > 0 && (
          <Button variant="secondary" size="m" onClick={() => setStep(s => s - 1)} icon={<IconArrowLeft size={16} />}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button variant="primary" size="m" fullWidth onClick={() => setStep(s => s + 1)}
            iconRight={<IconArrowRight size={16} />}>
            Continue to {steps[step + 1].label.toLowerCase()}
          </Button>
        ) : (
          <Button variant="gold" size="m" fullWidth onClick={onOpenFluency} iconRight={<IconArrowRight size={16} />}>
            Start fluency reinforcement
          </Button>
        )}
      </div>
    </div>
  );
}

function WorkedExample() {
  return (
    <Card padding={20}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Worked example · 1 of 3
      </div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
        color: T.navy700, letterSpacing: '-0.01em', marginBottom: 14,
      }}>Solve 305 − 178 step by step.</div>

      <AnimatedSubtraction top={[3,0,5]} bottom={[1,7,8]} />

      <div style={{ marginTop: 14 }}>
        <Hint label="Why the zero matters">
          When the tens are 0 we don't stop there — we keep walking left until we find a non-zero digit, then ripple the regroup back down.
        </Hint>
      </div>
    </Card>
  );
}

function ColumnSubtraction({ rows, steps }) {
  return (
    <div>
      <div style={{
        display: 'inline-block', padding: '16px 24px',
        background: T.ivory, borderRadius: 14,
        fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
        fontSize: 30, lineHeight: 1.3, color: T.navy700,
      }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: T.ink300 }}>²</span>
          <span style={{ color: T.error500 }}>⁹</span>
          <span style={{ color: T.gold500 }}>¹⁵</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ textDecoration: 'line-through', color: T.ink300 }}>3</span>
          <span style={{ textDecoration: 'line-through', color: T.ink300 }}>0</span>
          <span style={{ textDecoration: 'line-through', color: T.ink300 }}>5</span>
        </div>
        <div style={{ textAlign: 'right', borderBottom: `2px solid ${T.navy700}`, paddingBottom: 4 }}>
          <span style={{ marginRight: 6 }}>−</span>1&nbsp;7&nbsp;8
        </div>
        <div style={{ textAlign: 'right', color: T.success500, fontWeight: 600, paddingTop: 4 }}>
          1&nbsp;2&nbsp;7
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 22, height: 22, borderRadius: 8, flexShrink: 0,
              background: T.navy700, color: T.paper,
              display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 700,
            }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.name}</div>
              <div style={{ fontSize: 13, color: T.ink700, lineHeight: 1.5, marginTop: 1 }}>{s.txt}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuidedPattern() {
  const [filled, setFilled] = useState([null, null, null]);
  const target = [9, 15, 7];
  return (
    <Card padding={20}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Your turn · fill the blanks
      </div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600,
        color: T.navy700, letterSpacing: '-0.01em', marginBottom: 16,
      }}>Now try 504 − 286.</div>

      <div style={{
        display: 'inline-block', padding: '16px 24px',
        background: T.ivory, borderRadius: 14,
        fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
        fontSize: 28, lineHeight: 1.35, color: T.navy700,
      }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: T.ink300 }}>⁴</span>
          <BlankSlot val={filled[0]} target={target[0]} onFill={v => setFilled([v, filled[1], filled[2]])} />
          <BlankSlot val={filled[1]} target={target[1]} onFill={v => setFilled([filled[0], v, filled[2]])} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ textDecoration: 'line-through', color: T.ink300 }}>5</span>
          <span style={{ textDecoration: 'line-through', color: T.ink300 }}>0</span>
          <span style={{ textDecoration: 'line-through', color: T.ink300 }}>4</span>
        </div>
        <div style={{ textAlign: 'right', borderBottom: `2px solid ${T.navy700}`, paddingBottom: 4 }}>
          <span style={{ marginRight: 6 }}>−</span>2&nbsp;8&nbsp;6
        </div>
        <div style={{ textAlign: 'right', paddingTop: 4 }}>
          2&nbsp;1&nbsp;<BlankSlot val={filled[2]} target={target[2]} onFill={v => setFilled([filled[0], filled[1], v])} small />
        </div>
      </div>

      <div style={{
        marginTop: 14, padding: '12px 14px',
        background: T.success100, borderRadius: 12,
        fontSize: 12, color: T.success700 || T.success500, lineHeight: 1.5,
        display: filled.every(f => f !== null) ? 'block' : 'none',
      }}>
        <b>Nice.</b> You walked the regroup all the way through the zero. Try one more on your own.
      </div>
    </Card>
  );
}

function BlankSlot({ val, target, onFill, small }) {
  const correct = val === target;
  const [open, setOpen] = useState(false);
  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: small ? 26 : 38, height: small ? 26 : 38,
          padding: '0 4px', margin: '0 1px',
          borderRadius: 8,
          background: val === null ? T.paper : correct ? T.success100 : T.error100,
          color: val === null ? T.ink300 : correct ? T.success500 : T.error500,
          border: `2px dashed ${val === null ? T.gold500 : 'transparent'}`,
          fontWeight: 600,
          fontSize: small ? 18 : 22,
          cursor: 'pointer',
        }}>
        {val ?? '?'}
      </span>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', zIndex: 10,
          background: T.paper, borderRadius: 14,
          padding: 10, boxShadow: T.shadowOverlay,
          border: `1px solid ${T.hairline}`,
          marginTop: 4, display: 'flex', gap: 4,
        }}>
          {[target - 1, target, target + 1].sort((a, b) => Math.random() - 0.5).map(n => (
            <button key={n} onClick={() => { onFill(n); setOpen(false); }} style={{
              width: 36, height: 36, borderRadius: 10,
              background: T.bone, color: T.navy700,
              fontFamily: T.fontMono, fontSize: 16, fontWeight: 600,
            }}>{n}</button>
          ))}
        </div>
      )}
    </>
  );
}

function IndependentPractice() {
  return (
    <Card padding={20}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        On your own · 1 of 3
      </div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 500,
        color: T.navy700, letterSpacing: '-0.02em', marginBottom: 18,
        textAlign: 'center', padding: '20px 0',
        fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
      }}>703 − 145 = <span style={{ color: T.ink300 }}>?</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[548, 558, 562, 668].map(n => (
          <button key={n} style={{
            height: 56, borderRadius: 14,
            background: T.paper, border: `1px solid ${T.hairline}`,
            fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
            fontSize: 22, fontWeight: 600, color: T.navy700,
          }}>{n}</button>
        ))}
      </div>
      <div style={{
        fontSize: 12, color: T.ink500, marginTop: 14, textAlign: 'center',
      }}>Take your time. Speed comes later.</div>
    </Card>
  );
}

function FluencyReinforce({ onOpenFluency }) {
  return (
    <Card padding={20}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Lock it in
      </div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 600,
        color: T.navy700, letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.3,
      }}>20 quick regrouping-across-zero problems</div>
      <div style={{ fontSize: 13, color: T.ink500, lineHeight: 1.55, marginBottom: 16 }}>
        Now that the pattern is clear, build the speed. Target 4 seconds per problem.
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
      }}>
        {[
          { l: 'Questions', v: '20' },
          { l: 'Target', v: '4s' },
          { l: 'Length', v: '~2 min' },
        ].map(s => (
          <div key={s.l} style={{
            padding: '12px 0', textAlign: 'center',
            background: T.ivory, borderRadius: 12,
          }}>
            <div style={{ fontSize: 10, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
            <div style={{
              fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
              fontSize: 18, fontWeight: 600, color: T.navy700, marginTop: 2,
            }}>{s.v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

Object.assign(window, { ScreenFluency, ScreenRemediation, StreakRow, KeyBtn, DualBar, SummaryStat });
