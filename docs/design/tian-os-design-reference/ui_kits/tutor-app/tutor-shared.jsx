// tutor-shared.jsx — Tutor-only primitives (extra icons, bottom nav, helper rows)

// ─── Extra icons specific to tutor ───────────────────────────
const IconClipboard = (p) => (
  <Icon {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
    <path d="M8 11h8M8 15h5" />
  </Icon>
);
const IconMicOn = (p) => (
  <Icon {...p}>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </Icon>
);
const IconCertificate = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="10" r="5" />
    <path d="M9 14l-2 7 5-3 5 3-2-7" />
  </Icon>
);
const IconChalkboard = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </Icon>
);
const IconArrowRightLong = (p) => (
  <Icon {...p}>
    <path d="M5 12h14M14 6l6 6-6 6"/>
  </Icon>
);

// ─── TutorBottomNav — 5 tabs ────────────────────────────────
const TutorBottomNav = ({ tab, onChange }) => {
  const items = [
    { id: 'home',      icon: IconHome,       label: 'Home' },
    { id: 'students',  icon: IconUsers,      label: 'Students' },
    { id: 'lessons',   icon: IconChalkboard, label: 'Lessons' },
    { id: 'homework',  icon: IconDoc,        label: 'Homework' },
    { id: 'more',      icon: IconMore,       label: 'More' },
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

// ─── TutorScreenHeader — reuses ParentScreenHeader style but renamed for clarity
const TutorScreenHeader = ParentScreenHeader;

// ─── StudentAvatar — small initial monogram, reusable ───────
const StudentAvatar = ({ name = 'A', size = 36, tone = T.navy500 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.32,
    background: `linear-gradient(135deg, ${tone}, ${T.navy900})`,
    color: T.paper,
    display: 'grid', placeItems: 'center',
    fontFamily: T.fontDisplay, fontWeight: 600, fontSize: size * 0.4,
    flexShrink: 0,
  }}>{name[0]}</div>
);

// ─── LessonModePill — online / centre / home / consult ──────
const LessonModePill = ({ mode = 'online' }) => {
  const modes = {
    online: { label: 'Online',  bg: T.navy050,  fg: T.navy700,  dot: T.navy500 },
    centre: { label: 'Centre',  bg: T.gold100,  fg: T.gold700,  dot: T.gold500 },
    home:   { label: 'Home tuition',  bg: T.success100, fg: T.success500, dot: T.success500 },
    consult:{ label: 'Consult', bg: '#E8DAEE',  fg: T.modSpell, dot: T.modSpell },
  };
  const m = modes[mode] || modes.online;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 22, padding: '0 9px', borderRadius: 999,
      background: m.bg, color: m.fg,
      fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: m.dot,
      }} />
      {m.label}
    </span>
  );
};

Object.assign(window, {
  IconClipboard, IconMicOn, IconCertificate, IconChalkboard, IconArrowRightLong,
  TutorBottomNav, TutorScreenHeader, StudentAvatar, LessonModePill,
});
