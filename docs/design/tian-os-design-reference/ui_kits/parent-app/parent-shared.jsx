// parent-shared.jsx — Parent-only icons + ParentBottomNav
// Reuses student-app tokens + primitives.

const ParentT = window.T; // share tokens

// ─── Parent-specific icons (small additions) ──────────────────
const IconDoc = (p) => (
  <Icon {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h5" />
  </Icon>
);
const IconPrint = (p) => (
  <Icon {...p}>
    <path d="M6 9V3h12v6" />
    <rect x="4" y="9" width="16" height="8" rx="2" />
    <rect x="7" y="15" width="10" height="6" />
  </Icon>
);
const IconGear = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
  </Icon>
);
const IconUsers = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M14 14a5 5 0 0 1 7 4" />
  </Icon>
);
const IconMessage = (p) => (
  <Icon {...p}>
    <path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12z" />
  </Icon>
);
const IconDownload = (p) => (
  <Icon {...p}>
    <path d="M12 3v13" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 21h16" />
  </Icon>
);
const IconTutor = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="7" r="3.5" />
    <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
    <path d="M18 13l2-2-2-2" />
  </Icon>
);
const IconCalendarDot = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
    <circle cx="9" cy="18" r="1" fill="currentColor" />
  </Icon>
);

// ─── ParentBottomNav — 5 tabs ───────────────────────────────
const ParentBottomNav = ({ tab, onChange }) => {
  const items = [
    { id: 'home',       icon: IconHome,    label: 'Home' },
    { id: 'progress',   icon: IconChart,   label: 'Progress' },
    { id: 'actions',    icon: IconSparkle, label: 'Actions' },
    { id: 'worksheets', icon: IconDoc,     label: 'Worksheets' },
    { id: 'more',       icon: IconMore,    label: 'More' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, bottom: 12,
      height: 64, borderRadius: 28,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: `1px solid ${T.hairline}`,
      boxShadow: T.shadowActive,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 6px', zIndex: 30,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        const I = it.icon;
        return (
          <button key={it.id} onClick={() => onChange?.(it.id)} style={{
            flex: 1, height: 48, borderRadius: 18,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            color: active ? T.navy700 : T.ink300,
            background: active ? T.navy050 : 'transparent',
            transition: `all 180ms ${T.easeCalm}`,
          }}>
            <I size={18} stroke={active ? 2 : 1.75} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Child selector — pill at top of parent screens ──────────
const ChildSelector = ({ name = 'Aria', level = 'P5', onSwap }) => (
  <button onClick={onSwap} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 14px 6px 6px',
    background: T.paper, border: `1px solid ${T.hairline}`,
    borderRadius: 999, color: T.ink700,
    boxShadow: T.shadowResting,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${T.navy500}, ${T.navy900})`,
      color: T.paper, display: 'grid', placeItems: 'center',
      fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 14,
    }}>{name[0]}</div>
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink700, lineHeight: 1 }}>{name}</div>
      <div style={{ fontSize: 10, color: T.ink500, marginTop: 2 }}>{level} · Singapore Math</div>
    </div>
    <IconChevronDown size={14} color={T.ink500} />
  </button>
);

// ─── ParentScreenHeader — title + back, plus optional child selector ─
const ParentScreenHeader = ({ title, subtitle, onBack, action }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '54px 20px 16px',
  }}>
    {onBack && (
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: 12, marginTop: 2,
        background: T.bone, display: 'grid', placeItems: 'center',
        color: T.navy700, flexShrink: 0,
      }}>
        <IconArrowLeft size={18} />
      </button>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600,
        color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.15,
      }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 13, color: T.ink500, marginTop: 4, lineHeight: 1.4 }}>{subtitle}</div>
      )}
    </div>
    {action}
  </div>
);

Object.assign(window, {
  IconDoc, IconPrint, IconGear, IconUsers, IconMessage,
  IconDownload, IconTutor, IconCalendarDot,
  ParentBottomNav, ChildSelector, ParentScreenHeader,
});
