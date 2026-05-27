// icons.jsx — Lucide-style outline icons. 1.75px stroke, currentColor.

const Icon = ({ children, size = 20, color = 'currentColor', stroke = 1.75, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

const IconHome = (p) => <Icon {...p}><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></Icon>;
const IconBook = (p) => <Icon {...p}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></Icon>;
const IconChart = (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></Icon>;
const IconUser = (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>;
const IconFlame = (p) => <Icon {...p}><path d="M12 2s5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 1-7 1-10z"/></Icon>;
const IconTarget = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></Icon>;
const IconBolt = (p) => <Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M5 12l5 5L20 7"/></Icon>;
const IconX = (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>;
const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>;
const IconArrowLeft = (p) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Icon>;
const IconChevronRight = (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>;
const IconChevronDown = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/></Icon>;
const IconBrain = (p) => <Icon {...p}><path d="M12 5a3 3 0 0 0-6 0 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 4 3 3 0 0 0 3-1 3 3 0 0 0 3 1 3 3 0 0 0 4-4 3 3 0 0 0 1-5 3 3 0 0 0-2-5 3 3 0 0 0-6 0z"/><path d="M12 5v15"/></Icon>;
const IconLock = (p) => <Icon {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></Icon>;
const IconStar = (p) => <Icon {...p}><path d="M12 3l2.6 5.6L21 9.5l-4.6 4.3L17.5 21 12 17.8 6.5 21l1.1-7.2L3 9.5l6.4-.9L12 3z"/></Icon>;
const IconLayers = (p) => <Icon {...p}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/></Icon>;
const IconGrid = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>;
const IconPath = (p) => <Icon {...p}><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 6h6a4 4 0 0 1 4 4v6"/></Icon>;
const IconLightbulb = (p) => <Icon {...p}><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/></Icon>;
const IconPlay = (p) => <Icon {...p}><path d="M7 5l12 7-12 7V5z" fill="currentColor"/></Icon>;
const IconBell = (p) => <Icon {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IconShuffle = (p) => <Icon {...p}><path d="M16 3h5v5"/><path d="M3 21l18-18"/><path d="M3 3l8 8"/><path d="M16 21h5v-5"/><path d="m14 14 7 7"/></Icon>;
const IconRevise = (p) => <Icon {...p}><path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/></Icon>;
const IconMore = (p) => <Icon {...p}><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></Icon>;

// Module monogram marks (custom — not from lucide)
const MarkMathPath = ({ size = 28, bg = '#1A2A4F', fg = '#fff' }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.32,
    background: bg, color: fg, display: 'grid', placeItems: 'center',
    fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size * 0.46,
    letterSpacing: '-0.04em',
  }}>∑</div>
);
const MarkScience = ({ size = 28, bg = '#2F6B7E', fg = '#fff' }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.32,
    background: bg, color: fg, display: 'grid', placeItems: 'center',
    fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size * 0.46,
    letterSpacing: '-0.04em',
  }}>α</div>
);
const MarkSpell = ({ size = 28, bg = '#6B4F7E', fg = '#fff' }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.32,
    background: bg, color: fg, display: 'grid', placeItems: 'center',
    fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size * 0.46,
    letterSpacing: '-0.04em',
  }}>Aa</div>
);
const MarkRead = ({ size = 28, bg = '#7E5A2F', fg = '#fff' }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.32,
    background: bg, color: fg, display: 'grid', placeItems: 'center',
    fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size * 0.46,
    letterSpacing: '-0.04em',
  }}>R</div>
);
const MarkPlan = ({ size = 28, bg = '#2F7E5A', fg = '#fff' }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.32,
    background: bg, color: fg, display: 'grid', placeItems: 'center',
    fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size * 0.46,
    letterSpacing: '-0.04em',
  }}>◷</div>
);

Object.assign(window, {
  Icon, IconHome, IconBook, IconChart, IconCalendar, IconUser, IconFlame,
  IconTarget, IconBolt, IconClock, IconCheck, IconX, IconArrowRight, IconArrowLeft,
  IconChevronRight, IconChevronDown, IconSparkle, IconBrain, IconLock, IconStar,
  IconLayers, IconGrid, IconPath, IconLightbulb, IconPlay, IconBell, IconSearch,
  IconShuffle, IconRevise, IconMore,
  MarkMathPath, MarkScience, MarkSpell, MarkRead, MarkPlan,
});
