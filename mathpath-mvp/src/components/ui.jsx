'use client';

// ui.jsx — Tian OS primitives (light premium system), ported from the design handoff.
import { T } from '@/lib/tokens';
import { IconArrowLeft } from '@/components/icons';

// ─── Card ─────────────────────────────────────────────────
export function Card({ children, style, padding = 20, radius = 20, onClick, active = false }) {
  return (
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
}

// ─── Button ───────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'm', onClick, style, icon, iconRight, fullWidth, disabled }) {
  const sizes = { s: { h: 36, px: 14, fs: 13 }, m: { h: 48, px: 20, fs: 15 }, l: { h: 56, px: 24, fs: 16 } };
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
      disabled={disabled}
      style={{
        height: s.h, padding: `0 ${s.px}px`,
        background: v.bg, color: v.color, border: `1px solid ${v.border}`,
        borderRadius: 14, fontSize: s.fs, fontWeight: 600, fontFamily: T.fontText,
        letterSpacing: '-0.01em',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.4 : 1,
        transition: `background 160ms ${T.easeCalm}, transform 120ms ${T.easeCalm}, opacity 160ms`,
        ...style,
      }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

// ─── Chip ─────────────────────────────────────────────────
export function Chip({ children, tone = 'neutral', size = 'm', icon, onClick, active }) {
  const tones = {
    neutral: { bg: T.bone, color: T.ink700, border: 'transparent' },
    navy: { bg: T.navy050, color: T.navy700, border: 'transparent' },
    gold: { bg: T.gold100, color: T.gold700, border: 'transparent' },
    success: { bg: T.success100, color: T.success500, border: 'transparent' },
    error: { bg: T.error100, color: T.error500, border: 'transparent' },
    outline: { bg: T.paper, color: T.ink700, border: T.hairline },
  };
  const t = tones[tone];
  const sz = size === 's' ? { h: 22, px: 8, fs: 11 } : { h: 28, px: 12, fs: 12 };
  return (
    <span
      onClick={onClick}
      style={{
        height: sz.h, padding: `0 ${sz.px}px`,
        background: active ? T.navy700 : t.bg, color: active ? T.paper : t.color,
        border: `1px solid ${t.border}`, borderRadius: 999, fontSize: sz.fs, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── Stat — small KPI block ───────────────────────────────
export function Stat({ label, value, delta, suffix, tone, icon }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        {icon}{label}
      </div>
      <div style={{ fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {value}<span style={{ fontSize: 13, color: T.ink500, fontWeight: 500, marginLeft: 2 }}>{suffix}</span>
      </div>
      {delta && (
        <div style={{ fontSize: 11, color: tone === 'down' ? T.error500 : T.success500, fontWeight: 600, marginTop: 2 }}>
          {tone === 'down' ? '↓' : '↑'} {delta}
        </div>
      )}
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = T.navy700, bg = T.bone, height = 6, gold }) {
  return (
    <div style={{ height, borderRadius: 999, background: bg, overflow: 'hidden', width: '100%' }}>
      <div style={{
        width: `${Math.min(100, (value / max) * 100)}%`, height: '100%',
        background: gold ? `linear-gradient(90deg, ${color} 0%, ${T.gold500} 100%)` : color,
        borderRadius: 999, transition: `width 600ms ${T.easeCalm}`,
      }} />
    </div>
  );
}

// ─── Ring — circular progress (SVG) ───────────────────────
export function Ring({ value = 0, max = 100, size = 72, stroke = 8, color = T.navy700, label, sub, gold = false }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(value, max) / max) * c;
  const gradId = `g-${String(label).replace(/\W/g, '')}-${size}`;
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
          stroke={gold ? `url(#${gradId})` : color} strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: `stroke-dashoffset 800ms ${T.easeCalm}` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: size * 0.26, fontWeight: 600, color: T.navy700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.ink500, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── ScreenHeader ─────────────────────────────────────────
export function ScreenHeader({ title, subtitle, onBack, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 20px 16px' }}>
      {onBack && (
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, marginTop: 2, background: T.bone, display: 'grid', placeItems: 'center', color: T.navy700, flexShrink: 0 }}>
          <IconArrowLeft size={18} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 14, color: T.ink500, marginTop: 4, lineHeight: 1.4 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────
export function Section({ title, action, children, style }) {
  return (
    <div style={{ padding: '16px 20px 0', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 22 }}>
        <h3 style={{ fontFamily: T.fontText, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.ink500, margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Wordmark ─────────────────────────────────────────────
export function Wordmark({ size = 28 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{
        width: size, height: size, borderRadius: size * 0.32, display: 'grid', placeItems: 'center',
        background: `linear-gradient(135deg, ${T.navy500}, ${T.navy900})`, color: T.gold300,
        fontFamily: T.fontDisplay, fontWeight: 600, fontSize: size * 0.52,
      }}>T</span>
      <span style={{ fontFamily: T.fontText, fontWeight: 700, fontSize: size * 0.6, color: T.navy700, letterSpacing: '-0.01em' }}>
        Tian<span style={{ color: T.gold500 }}>OS</span>
      </span>
    </span>
  );
}
