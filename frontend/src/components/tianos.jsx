import React, { useEffect, useRef, useState } from 'react';

export const GOLD = '#F59E0B';
export const GOLD_SOFT = 'rgba(245,158,11,0.25)';
export const CORAL = '#34D399';
export const CORAL_GLOW = 'rgba(52,211,153,0.35)';
export const EMERALD = '#10B981';
export const EMERALD_LIGHT = '#34D399';
export const TEAL = '#065F46';
export const TEAL_DARK = '#064E3B';
export const IVORY = '#F8FAFC';
export const SKY = '#6EE7B7';
export const LAVENDER = '#C4B5FD';
export const INK = '#1E293B';
export const INK_SOFT = 'rgba(30,41,59,0.62)';
export const BLUE = '#38BDF8';
export const BG = '#F8FAFC';
export const SERIF = "'Nunito', system-ui, sans-serif";
export const SANS = "'Nunito', system-ui, sans-serif";

export const glassPanel = (accent = false) => ({
  background: '#FFFFFF',
  border: `1px solid ${accent ? 'rgba(16,185,129,0.3)' : 'rgba(30,41,59,0.10)'}`,
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
});

export function Reveal({ children, delay = 0, y = 26, className = '', style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'none' : `translateY(${y}px)`,
      transition: `opacity .8s ease ${delay}s, transform .9s cubic-bezier(.2,.7,.2,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

export const Eyebrow = ({ children, style }) => (
  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEAL, ...style }}>{children}</div>
);

export const Headline = ({ children, className = '', style }) => (
  <h2 className={className} style={{ fontFamily: SERIF, fontWeight: 300, lineHeight: 1.08, color: INK, fontSize: 'clamp(30px, 4.6vw, 54px)', letterSpacing: '-0.01em', margin: 0, ...style }}>{children}</h2>
);

export const GlassCard = ({ children, glow = false, className = '', style }) => (
  <div className={className} style={{ ...glassPanel(glow), ...style }}>{children}</div>
);

export function Wordmark({ size = 30, onDark = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: size, height: size, borderRadius: size * 0.3, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 800, color: '#fff', fontSize: size * 0.56, background: TEAL, boxShadow: '0 0 16px rgba(5,150,105,0.18)' }}>E</span>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size * 0.62, color: onDark ? IVORY : TEAL, letterSpacing: '-0.01em' }}>Tian<span style={{ color: EMERALD }}>OS</span></span>
    </span>
  );
}

export function Avatar({ label, size = 96, onDark = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${SKY}, ${TEAL})`, border: '3px solid rgba(30,41,59,0.2)', boxShadow: '0 12px 32px rgba(0,0,0,0.10)', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, color: IVORY, fontSize: size * 0.34 }}>{label[0]}</div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: onDark ? IVORY : INK, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export function TrustRing({ nodes, onDark = false }) {
  const ring = nodes || [
    { lbl: 'Parent', x: 50, y: 11 }, { lbl: 'Child', x: 89, y: 50 },
    { lbl: 'Tutor', x: 50, y: 89 }, { lbl: 'Educator', x: 11, y: 50 },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 540, aspectRatio: '1 / 1', margin: '0 auto' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="tianos-conn" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.5" />
            <stop offset="100%" stopColor={SKY} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {ring.map((n, i) => (
          <line key={i} x1="50" y1="50" x2={n.x} y2={n.y} stroke="url(#tianos-conn)" strokeWidth="0.5" strokeDasharray="1.6 2" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '30%', aspectRatio: '1/1', borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, ${SKY} 0%, ${TEAL} 70%)`, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(13px,2.4vw,22px)', color: IVORY, letterSpacing: '0.06em', boxShadow: '0 0 50px rgba(5,150,105,0.3), 0 20px 50px rgba(0,0,0,0.15)', animation: 'tianosPulse 4s ease-in-out infinite' }}>TIAN·OS</div>
      {ring.map((n) => (
        <div key={n.lbl} style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }}>
          <Avatar label={n.lbl} size={104} onDark={onDark} />
        </div>
      ))}
    </div>
  );
}

export const TianOSKeyframes = () => (
  <style>{`@keyframes tianosPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.05)}}`}</style>
);
