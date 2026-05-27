// primitives.jsx — Shared UI components

const { useState, useEffect, useRef } = React;

// ─── Card ─────────────────────────────────────────────────
const Card = ({ children, style, padding = 20, radius = 20, onClick, active = false }) => (
  <div
    onClick={onClick}
    style={{
      background: T.paper,
      border: `1px solid ${T.hairline}`,
      borderRadius: radius,
      padding,
      boxShadow: active ? T.shadowActive : T.shadowResting,
      cursor: onClick ? 'pointer' : 'default',
      transition: `box-shadow 200ms ${T.easeCalm}, transform 200ms ${T.easeCalm}`,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Button ───────────────────────────────────────────────
const Button = ({ children, variant = 'primary', size = 'm', onClick, style, icon, iconRight, fullWidth }) => {
  const sizes = {
    s: { h: 36, px: 14, fs: 13 },
    m: { h: 48, px: 20, fs: 15 },
    l: { h: 56, px: 24, fs: 16 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: T.navy700, color: T.paper, border: 'transparent' },
    secondary: { bg: T.paper, color: T.navy700, border: T.hairline },
    ghost: { bg: 'transparent', color: T.navy700, border: 'transparent' },
    gold: { bg: T.gold500, color: T.navy900, border: 'transparent' },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      style={{
        height: s.h,
        padding: `0 ${s.px}px`,
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 14,
        fontSize: s.fs,
        fontWeight: 600,
        fontFamily: T.fontText,
        letterSpacing: '-0.01em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        transition: `background 160ms ${T.easeCalm}, transform 120ms ${T.easeCalm}`,
        ...style,
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
};

// ─── Chip ─────────────────────────────────────────────────
const Chip = ({ children, tone = 'neutral', size = 'm', icon, onClick, active }) => {
  const tones = {
    neutral: { bg: T.bone, color: T.ink700, border: 'transparent' },
    navy:    { bg: T.navy050, color: T.navy700, border: 'transparent' },
    gold:    { bg: T.gold100, color: T.gold700, border: 'transparent' },
    success: { bg: T.success100, color: T.success500, border: 'transparent' },
    error:   { bg: T.error100, color: T.error500, border: 'transparent' },
    outline: { bg: T.paper, color: T.ink700, border: T.hairline },
  };
  const t = tones[tone];
  const sz = size === 's' ? { h: 22, px: 8, fs: 11 } : { h: 28, px: 12, fs: 12 };
  return (
    <span
      onClick={onClick}
      style={{
        height: sz.h,
        padding: `0 ${sz.px}px`,
        background: active ? T.navy700 : t.bg,
        color: active ? T.paper : t.color,
        border: `1px solid ${t.border}`,
        borderRadius: 999,
        fontSize: sz.fs,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </span>
  );
};

// ─── Stat — small KPI block ───────────────────────────────
const Stat = ({ label, value, delta, suffix, tone, icon }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{
      fontSize: 11, fontWeight: 600, color: T.ink500,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      display: 'flex', alignItems: 'center', gap: 4,
      marginBottom: 6,
    }}>
      {icon}
      {label}
    </div>
    <div style={{
      fontFamily: T.fontText,
      fontVariantNumeric: 'tabular-nums',
      fontSize: 22, fontWeight: 600, color: T.navy700,
      letterSpacing: '-0.02em', lineHeight: 1.1,
    }}>
      {value}<span style={{ fontSize: 13, color: T.ink500, fontWeight: 500, marginLeft: 2 }}>{suffix}</span>
    </div>
    {delta && (
      <div style={{ fontSize: 11, color: tone === 'down' ? T.error500 : T.success500, fontWeight: 600, marginTop: 2 }}>
        {tone === 'down' ? '↓' : '↑'} {delta}
      </div>
    )}
  </div>
);

// ─── ProgressBar ──────────────────────────────────────────
const ProgressBar = ({ value, max = 100, color = T.navy700, bg = T.bone, height = 6, gold }) => (
  <div style={{ height, borderRadius: 999, background: bg, overflow: 'hidden', width: '100%' }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`,
      height: '100%',
      background: gold ? `linear-gradient(90deg, ${color} 0%, ${T.gold500} 100%)` : color,
      borderRadius: 999,
      transition: `width 600ms ${T.easeCalm}`,
    }} />
  </div>
);

// ─── Ring — circular progress (SVG) ───────────────────────
const Ring = ({ value = 0, max = 100, size = 72, stroke = 8, color = T.navy700, label, sub, gold = false }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / max) * c;
  const gradId = `g-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {gold && (
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={T.navy700} />
              <stop offset="100%" stopColor={T.gold500} />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} stroke={T.bone} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={gold ? `url(#${gradId})` : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: `stroke-dashoffset 800ms ${T.easeCalm}` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: size * 0.28, fontWeight: 600, color: T.navy700,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1,
        }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.ink500, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
};

// ─── ScreenHeader — top of each screen, has back + title ──
const ScreenHeader = ({ title, subtitle, onBack, action }) => (
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
        fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 600,
        color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.15,
      }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 14, color: T.ink500, marginTop: 4, lineHeight: 1.4 }}>{subtitle}</div>
      )}
    </div>
    {action}
  </div>
);

// ─── BottomNav ────────────────────────────────────────────
const BottomNav = ({ tab, onChange }) => {
  const items = [
    { id: 'home', icon: IconHome, label: 'Home' },
    { id: 'mathpath', icon: IconGrid, label: 'MathPath' },
    { id: 'pathway', icon: IconPath, label: 'Pathway' },
    { id: 'profile', icon: IconUser, label: 'Profile' },
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
      padding: '0 8px', zIndex: 30,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        const I = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            style={{
              flex: 1, height: 48, borderRadius: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              color: active ? T.navy700 : T.ink300,
              background: active ? T.navy050 : 'transparent',
              transition: `all 180ms ${T.easeCalm}`,
            }}
          >
            <I size={20} stroke={active ? 2 : 1.75} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Section — labeled block with optional action ────────
const Section = ({ title, action, children, style }) => (
  <div style={{ padding: '12px 20px 0', ...style }}>
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <h3 style={{
        fontFamily: T.fontText, fontSize: 13, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: T.ink500, margin: 0,
      }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// ─── MasteryCell — for the heatmap grid ───────────────────
const MasteryCell = ({ level = 0, size = 22, gold = false, label }) => {
  const colors = [T.m0, T.m1, T.m2, T.m3, T.m4, T.m5];
  return (
    <div title={label} style={{
      width: size, height: size, borderRadius: 5,
      background: colors[level],
      position: 'relative',
      boxShadow: gold ? `inset 0 0 0 2px ${T.gold500}` : 'none',
    }} />
  );
};

// ─── Hint — collapsible gold info card. Icon-pill by default. ─
const Hint = ({ title, label = 'Why this matters', children, defaultOpen = false, tone = 'gold' }) => {
  const [open, setOpen] = useState(defaultOpen);

  const toneStyles = {
    gold: { bg: T.gold100, fg: T.gold700, ic: T.gold500, icFg: T.navy900, border: T.gold300 },
    navy: { bg: T.navy050, fg: T.navy700, ic: T.navy700, icFg: T.gold500, border: T.navy100 },
  };
  const ts = toneStyles[tone] || toneStyles.gold;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 12px 4px 4px',
          background: ts.bg, color: ts.fg,
          borderRadius: 999, border: 'none',
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          transition: `transform 140ms ${T.easeCalm}`,
        }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: ts.ic, color: ts.icFg,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <IconLightbulb size={12} />
        </span>
        {label}
      </button>
    );
  }

  return (
    <div style={{
      background: ts.bg, border: `1px solid ${ts.border}`,
      borderRadius: 14, padding: '14px 16px',
      position: 'relative',
      animation: `hintIn 240ms ${T.easeCalm}`,
    }}>
      <style>{`@keyframes hintIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: none } }`}</style>
      <button
        onClick={() => setOpen(false)}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 24, height: 24, borderRadius: 8,
          background: T.paper, color: T.ink500,
          border: 'none', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}
        title="Collapse"
      >
        <IconX size={12} />
      </button>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingRight: 28 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 9, flexShrink: 0,
          background: ts.ic, color: ts.icFg,
          display: 'grid', placeItems: 'center', marginTop: 1,
        }}>
          <IconLightbulb size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{
              fontSize: 12, fontWeight: 600, color: ts.fg,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 4,
            }}>{title}</div>
          )}
          <div style={{ fontSize: 13, color: T.ink700, lineHeight: 1.5 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  Card, Button, Chip, Stat, ProgressBar, Ring,
  ScreenHeader, BottomNav, Section, MasteryCell, Hint,
});
