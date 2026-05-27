// app.jsx — Tian OS prototype shell. Renders 5 iPhone frames in a canvas
// so all 5 core screens are visible side by side. Each device is a real,
// interactive prototype — tapping a module card on Dashboard navigates,
// the bottom-nav switches tabs, the fluency keypad accepts answers, etc.

const { useState: _useState, useEffect: _useEffect } = React;

// A self-contained device that holds one screen at a time + a stack/history
function ScreenStack({ initial = 'dashboard' }) {
  const [tab, setTab] = _useState(initial); // bottom-nav tab id
  const [stack, setStack] = _useState([initial]);

  const current = stack[stack.length - 1];
  const push = (s) => setStack([...stack, s]);
  const pop = () => setStack(stack.length > 1 ? stack.slice(0, -1) : stack);
  const reset = (s) => { setStack([s]); setTab(s); };

  // Whether to show bottom nav (hide during focused practice screens)
  const showNav = current === 'dashboard' || current === 'mathpath' || current === 'pathway' || current === 'profile';

  // Sync tab with stack root
  _useEffect(() => {
    const root = stack[0];
    if (root !== tab && ['dashboard','mathpath','pathway','profile'].includes(root)) {
      setTab(root);
    }
  }, [stack]);

  function onTabChange(t) {
    const map = { home: 'dashboard', mathpath: 'mathpath', pathway: 'pathway', profile: 'profile' };
    const target = map[t] || 'dashboard';
    reset(target);
  }

  let screen;
  switch (current) {
    case 'dashboard':
      screen = <ScreenDashboard
        onOpenModule={(id) => { if (id === 'mathpath') reset('mathpath'); }}
        onOpenFluency={() => push('fluency')}
      />;
      break;
    case 'mathpath':
      screen = <ScreenMathPath
        onBack={() => reset('dashboard')}
        onOpenFluency={() => push('fluency')}
        onOpenPathway={() => reset('pathway')}
        onOpenRemediation={() => push('remediation')}
      />;
      break;
    case 'fluency':
      screen = <ScreenFluency
        onBack={pop}
        onOpenRemediation={() => { setStack(['mathpath','remediation']); }}
      />;
      break;
    case 'remediation':
      screen = <ScreenRemediation
        onBack={pop}
        onOpenFluency={() => { setStack(['mathpath','fluency']); }}
      />;
      break;
    case 'pathway':
      screen = <ScreenPathway
        onBack={() => reset('dashboard')}
        onOpenRemediation={() => push('remediation')}
      />;
      break;
    case 'profile':
      screen = <ProfilePlaceholder />;
      break;
    default:
      screen = <ScreenDashboard onOpenModule={() => {}} onOpenFluency={() => push('fluency')} />;
  }

  // Tab mapping
  const navTab = current === 'dashboard' ? 'home'
    : current === 'mathpath' ? 'mathpath'
    : current === 'pathway' ? 'pathway'
    : current === 'profile' ? 'profile'
    : 'home';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: T.paper, fontFamily: T.fontText }}>
      <div style={{ height: '100%', overflow: 'auto' }}>
        {screen}
      </div>
      {showNav && <BottomNav tab={navTab} onChange={onTabChange} />}
    </div>
  );
}

function ProfilePlaceholder() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: T.ink500 }}>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.navy700, marginBottom: 6 }}>Profile</div>
      <div style={{ fontSize: 13 }}>Settings, parent invites, tutor link — not built for this preview.</div>
    </div>
  );
}

// ── Wrap a screen in a device frame, with a label above ───────
function LabeledDevice({ initial, label, num, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 16px', background: T.paper,
        border: `1px solid ${T.hairline}`, borderRadius: 999,
        boxShadow: T.shadowResting,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          background: accent || T.navy700, color: T.paper,
          display: 'grid', placeItems: 'center',
          fontFamily: T.fontText, fontWeight: 700, fontSize: 11,
        }}>{num}</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600,
          color: T.navy700, letterSpacing: '-0.01em',
        }}>{label}</div>
      </div>
      <IOSDevice width={390} height={844}>
        <ScreenStack initial={initial} />
      </IOSDevice>
    </div>
  );
}

// ── Root layout: 5 phones in a horizontal row, scrollable ─────
function App() {
  const screens = [
    { num: 1, initial: 'dashboard',   label: 'Unified dashboard' },
    { num: 2, initial: 'mathpath',    label: 'MathPath module', accent: T.modMath },
    { num: 3, initial: 'fluency',     label: 'Timed fluency', accent: T.gold500 },
    { num: 4, initial: 'remediation', label: 'AI remediation', accent: T.gold700 },
    { num: 5, initial: 'pathway',     label: 'Skill pathway', accent: T.navy500 },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: T.ivory,
      fontFamily: T.fontText, color: T.ink700,
    }}>
      {/* Page header */}
      <div style={{
        padding: '40px 40px 24px', maxWidth: 1400, margin: '0 auto',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: T.gold700,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        }}>Tian OS · Student app</div>
        <h1 style={{
          fontFamily: T.fontDisplay, fontSize: 44, fontWeight: 600,
          color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.1,
          margin: 0, marginBottom: 12,
        }}>Five core screens</h1>
        <p style={{
          fontSize: 16, color: T.ink500, lineHeight: 1.55,
          maxWidth: 640, margin: 0,
        }}>
          A calm, premium mastery learning operating system. All screens are
          interactive — tap a module card, run the fluency drill, walk through
          the AI remediation flow, or explore the skill graph.
        </p>

        <div style={{
          marginTop: 22, display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <Chip tone="navy">Mobile-first</Chip>
          <Chip tone="outline">Navy + gold</Chip>
          <Chip tone="outline">Fraunces · Inter</Chip>
          <Chip tone="outline">Adaptive across P1–P6</Chip>
          <Chip tone="gold" icon={<IconSparkle size={11} />}>AI-native</Chip>
        </div>
      </div>

      {/* Phones row */}
      <div style={{
        overflowX: 'auto', padding: '0 40px 80px',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{
          display: 'flex', gap: 40, paddingBottom: 20,
          width: 'max-content', margin: '0 auto',
        }}>
          {screens.map(s => (
            <LabeledDevice key={s.num} {...s} />
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div style={{
        textAlign: 'center', padding: '0 40px 60px',
        fontSize: 13, color: T.ink500,
      }}>
        Each phone is a live click-through. Scroll horizontally to see all 5.
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
