// flow-app.jsx — MathPath flow prototype controller + page chrome

const { useState: _useState, useEffect: _useEffect } = React;

// 8 steps in the journey
const FLOW_STEPS = [
  { id: 'dashboard', label: 'Dashboard',
    hint: 'Aria opens the app to her unified home — today\'s plan, modules, AI coach.',
    cta: 'Tap the MathPath card on the phone to enter the module.' },
  { id: 'mathpath', label: 'MathPath',
    hint: 'Overall mastery, fluency heatmap, weak prerequisites, and what to do next.',
    cta: 'Tap the recommended skill — "Equivalent fractions".' },
  { id: 'skill-intro', label: 'Recommended skill',
    hint: 'Orientation: prerequisites cleared, what this session looks like, why it matters now.',
    cta: 'Tap "Start practice".' },
  { id: 'practice', label: 'Timed practice',
    hint: 'Kumon-style fluency drill. Speed + accuracy tracked silently. Answer two questions.',
    cta: 'Tap any answer 2–3 times — the system will spot a pattern.' },
  { id: 'mistake', label: 'Mistake detected',
    hint: 'A bottom-sheet intervention surfaces. Not punitive — supportive.',
    cta: 'Tap "Get help now" to enter remediation.' },
  { id: 'remediation', label: 'AI remediation',
    hint: 'Worked example → guided pattern → independent → fluency. Four calm stages.',
    cta: 'Walk through the four stages.' },
  { id: 'mastery', label: 'Mastery updated',
    hint: 'A confident, quiet celebration: mastery delta, knock-on gains, what comes next.',
    cta: 'Tap "See what\'s next".' },
  { id: 'next', label: 'Next recommendation',
    hint: 'Back to MathPath with the loop closed: ratio is now unlocked.',
    cta: 'The recommendation is ready. Loop complete.' },
];

function FlowController() {
  const [step, setStep] = _useState(0);
  const [stack, setStack] = _useState(['dashboard']); // for back gestures inside the phone

  const current = FLOW_STEPS[step];
  const advance = () => {
    if (step < FLOW_STEPS.length - 1) {
      setStep(step + 1);
      setStack([FLOW_STEPS[step + 1].id]);
    }
  };
  const back = () => {
    if (step > 0) {
      setStep(step - 1);
      setStack([FLOW_STEPS[step - 1].id]);
    }
  };
  const replay = () => {
    setStep(0);
    setStack(['dashboard']);
  };
  const jump = (i) => {
    setStep(i);
    setStack([FLOW_STEPS[i].id]);
  };

  // Render the appropriate screen for current step
  let screen;
  const screenId = FLOW_STEPS[step].id;
  switch (screenId) {
    case 'dashboard':
      screen = <ScreenDashboard
        onOpenModule={(id) => { if (id === 'mathpath') advance(); }}
        onOpenFluency={advance}
      />;
      break;
    case 'mathpath':
      screen = <ScreenMathPath
        onBack={() => jump(0)}
        onOpenFluency={advance}
        onOpenPathway={() => {}}
        onOpenRemediation={advance}
      />;
      break;
    case 'skill-intro':
      screen = <FlowSkillIntro onBack={() => jump(1)} onStart={advance} />;
      break;
    case 'practice':
      // Practice screen has the mistake overlay built in — when overlay's Get help is tapped,
      // it auto-advances to remediation
      screen = <FlowPractice onBack={() => jump(2)} onMistakeDetected={() => jump(5)} />;
      break;
    case 'mistake':
      // Force the practice screen into its "showing the mistake overlay" state
      screen = <FlowPractice onBack={() => jump(3)} onMistakeDetected={() => jump(5)} forceMistake />;
      break;
    case 'remediation':
      screen = <ScreenRemediation
        onBack={() => jump(4)}
        onOpenFluency={advance} />;
      break;
    case 'mastery':
      screen = <FlowMasteryUpdated onContinue={advance} />;
      break;
    case 'next':
      screen = <FlowNextRecommendation onBack={() => jump(6)} onTapNext={() => {}} />;
      break;
    default:
      screen = <div />;
  }

  // Whether to show bottom nav — hide during practice / mistake / remediation
  const showNav = ['dashboard', 'mathpath', 'next'].includes(screenId);
  const navTab = screenId === 'dashboard' ? 'home' : 'mathpath';

  return (
    <div style={{
      minHeight: '100vh', background: T.ivory,
      fontFamily: T.fontText, color: T.ink700, paddingBottom: 60,
    }}>
      <PageHeader onReplay={replay} />
      <StepTrail steps={FLOW_STEPS} current={step} onJump={jump} />

      <div style={{
        display: 'flex', gap: 40, padding: '32px 40px 0',
        maxWidth: 1280, margin: '0 auto',
        alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {/* Phone */}
        <div style={{ flexShrink: 0 }}>
          <IOSDevice width={390} height={844}>
            <div key={screenId} style={{
              position: 'relative', width: '100%', height: '100%',
              background: T.paper, fontFamily: T.fontText,
              animation: `fadeScreen 240ms ${T.easeCalm}`,
              overflow: 'hidden',
            }}>
              <style>{`@keyframes fadeScreen { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }`}</style>
              <div style={{ height: '100%', overflow: 'auto' }}>
                {screen}
              </div>
              {showNav && <BottomNav tab={navTab} onChange={(t) => {
                if (t === 'home') jump(0);
                else if (t === 'mathpath') jump(1);
              }} />}
            </div>
          </IOSDevice>
        </div>

        {/* Hint panel */}
        <HintPanel step={step} total={FLOW_STEPS.length} info={current}
          onBack={back} onNext={advance} canBack={step > 0} canNext={step < FLOW_STEPS.length - 1} />
      </div>
    </div>
  );
}

function PageHeader({ onReplay }) {
  return (
    <div style={{
      padding: '32px 40px 0', maxWidth: 1280, margin: '0 auto',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20,
    }}>
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: T.navy700, color: T.gold500,
            display: 'grid', placeItems: 'center',
            fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 20,
            letterSpacing: '-0.04em',
          }}>天</div>
          <div>
            <div style={{
              fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 18,
              color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1,
            }}>Tian OS</div>
            <div style={{
              fontSize: 10, color: T.ink500, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2,
            }}>MathPath · flow prototype</div>
          </div>
        </div>
        <h1 style={{
          fontFamily: T.fontDisplay, fontSize: 36, fontWeight: 600,
          color: T.navy700, letterSpacing: '-0.025em', lineHeight: 1.1,
          margin: 0, marginBottom: 8, maxWidth: 600,
        }}>From a missed problem to a strengthened skill</h1>
        <p style={{
          fontSize: 15, color: T.ink500, lineHeight: 1.55,
          margin: 0, maxWidth: 580,
        }}>
          An 8-step guided journey through the closed loop that powers MathPath: practice → spot → remediate → master → recommend.
        </p>
      </div>
      <button onClick={onReplay} style={{
        height: 40, padding: '0 16px', borderRadius: 12,
        background: T.paper, border: `1px solid ${T.hairline}`,
        color: T.navy700, fontFamily: T.fontText, fontWeight: 600, fontSize: 13,
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: T.shadowResting, flexShrink: 0,
      }}>
        <IconRevise size={14} /> Replay flow
      </button>
    </div>
  );
}

function StepTrail({ steps, current, onJump }) {
  return (
    <div style={{
      padding: '32px 40px 0', maxWidth: 1280, margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', position: 'relative',
        background: T.paper, borderRadius: 999, padding: '12px 16px',
        border: `1px solid ${T.hairline}`, boxShadow: T.shadowResting,
      }}>
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const isDone = i < current;
          return (
            <React.Fragment key={s.id}>
              <button onClick={() => onJump(i)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 999,
                background: isCurrent ? T.navy050 : 'transparent',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: isCurrent ? T.gold500 : isDone ? T.navy700 : T.bone,
                  color: isCurrent ? T.navy900 : isDone ? T.paper : T.ink300,
                  display: 'grid', placeItems: 'center',
                  fontFamily: T.fontText, fontWeight: 700, fontSize: 11,
                  transition: `all 200ms ${T.easeCalm}`,
                }}>
                  {isDone ? <IconCheck size={11} stroke={2.5} /> : i + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  color: isCurrent ? T.navy700 : isDone ? T.ink700 : T.ink500,
                }}>{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 1,
                  background: i < current ? T.navy700 : T.hairline,
                  margin: '0 4px', minWidth: 8,
                  transition: `background 240ms ${T.easeCalm}`,
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function HintPanel({ step, total, info, onBack, onNext, canBack, canNext }) {
  return (
    <div style={{
      width: 360, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <Card padding={20} radius={20}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: T.gold700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>Step {step + 1} of {total}</span>
        </div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600,
          color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
          marginBottom: 10,
        }}>{info.label}</div>
        <div style={{
          fontSize: 14, color: T.ink700, lineHeight: 1.6, marginBottom: 16,
        }}>{info.hint}</div>

        <div style={{
          padding: '12px 14px', background: T.navy050, borderRadius: 12,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            background: T.navy700, color: T.gold500,
            display: 'grid', placeItems: 'center',
            marginTop: 1,
          }}><IconSparkle size={12} /></div>
          <div style={{ fontSize: 13, color: T.navy700, fontWeight: 500, lineHeight: 1.45 }}>
            {info.cta}
          </div>
        </div>
      </Card>

      {/* Prev / Next */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="m" onClick={onBack}
          style={{ flex: 1, opacity: canBack ? 1 : 0.4, pointerEvents: canBack ? 'auto' : 'none' }}
          icon={<IconArrowLeft size={16} />}>
          Previous
        </Button>
        <Button variant="primary" size="m" onClick={onNext}
          style={{ flex: 1.6, opacity: canNext ? 1 : 0.4, pointerEvents: canNext ? 'auto' : 'none' }}
          iconRight={<IconArrowRight size={16} />}>
          Next step
        </Button>
      </div>

      {/* Mini overview */}
      <Card padding={16} style={{ background: T.paper }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: T.ink500,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        }}>The closed loop</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FLOW_STEPS.map((s, i) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 8,
              background: i === step ? T.navy050 : 'transparent',
              color: i === step ? T.navy700 : i < step ? T.ink700 : T.ink500,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: i === step ? T.gold500 : i < step ? T.navy700 : T.bone,
              }} />
              <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<FlowController />);
