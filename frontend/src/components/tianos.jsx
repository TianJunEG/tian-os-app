import React, { useEffect, useRef, useState } from 'react';

// Tian OS design kit — the launch-video visual language as reusable components.
// Deep navy + soft gold, Fraunces serif headlines, Manrope body, glassmorphism, gold glow.
export const GOLD = '#d4af37';
export const GOLD_SOFT = 'rgba(212,175,55,0.35)';
export const INK = '#f5efe1';
export const INK_SOFT = 'rgba(240,235,220,0.62)';
export const BLUE = '#7aa6e8';
export const BG = '#050a14';
export const SERIF = "'Fraunces', Georgia, serif";
export const SANS = "'Manrope', system-ui, sans-serif";

export const glassPanel = (glow = false) => ({
  background: 'rgba(20,36,68,0.55)',
  border: `1px solid ${glow ? GOLD_SOFT : 'rgba(180,200,240,0.18)'}`,
  borderRadius: 18,
  backdropFilter: 'blur(20px)',
  boxShadow: glow ? '0 24px 50px rgba(0,0,0,0.4), 0 0 40px rgba(212,175,55,0.10)' : '0 24px 50px rgba(0,0,0,0.4)',
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
  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, ...style }}>{children}</div>
);

export const Headline = ({ children, className = '', style }) => (
  <h2 className={className} style={{ fontFamily: SERIF, fontWeight: 300, lineHeight: 1.08, color: INK, fontSize: 'clamp(30px, 4.6vw, 54px)', letterSpacing: '-0.01em', margin: 0, ...style }}>{children}</h2>
);

export const GlassCard = ({ children, glow = false, className = '', style }) => (
  <div className={className} style={{ ...glassPanel(glow), ...style }}>{children}</div>
);

export function Wordmark({ size = 30, onDark = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: size, height: size, borderRadius: size * 0.3, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 800, color: '#0a1a33', fontSize: size * 0.56, background: `radial-gradient(circle at 30% 30%, #ffe8a0, ${GOLD} 60%, #a8852b)`, boxShadow: `0 0 24px ${GOLD_SOFT}` }}>E</span>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size * 0.62, color: onDark ? INK : '#0a1a33', letterSpacing: '-0.01em' }}>Tian<span style={{ color: GOLD }}>OS</span></span>
    </span>
  );
}

export function Avatar({ label, size = 96 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, rgba(122,166,232,0.5), rgba(20,36,68,0.9))', border: `3px solid ${GOLD_SOFT}`, boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 24px ${GOLD_SOFT}`, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, color: INK, fontSize: size * 0.34 }}>{label[0]}</div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: INK, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// Signature Parent·Child·Tutor·Educator ring around a glowing TIAN·OS orb.
export function TrustRing({ nodes }) {
  const ring = nodes || [
    { lbl: 'Parent', x: 50, y: 11 }, { lbl: 'Child', x: 89, y: 50 },
    { lbl: 'Tutor', x: 50, y: 89 }, { lbl: 'Educator', x: 11, y: 50 },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 540, aspectRatio: '1 / 1', margin: '0 auto' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="tianos-conn" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.7" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {ring.map((n, i) => (
          <line key={i} x1="50" y1="50" x2={n.x} y2={n.y} stroke="url(#tianos-conn)" strokeWidth="0.5" strokeDasharray="1.6 2" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '30%', aspectRatio: '1/1', borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, #ffe8a0 0%, ${GOLD} 55%, #a8852b 100%)`, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(13px,2.4vw,22px)', color: '#1a1f2e', letterSpacing: '0.06em', boxShadow: `0 0 70px ${GOLD}88, 0 30px 60px rgba(0,0,0,0.5), inset 0 0 30px rgba(255,255,255,0.3)`, animation: 'tianosPulse 4s ease-in-out infinite' }}>TIAN·OS</div>
      {ring.map((n) => (
        <div key={n.lbl} style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }}>
          <Avatar label={n.lbl} size={104} />
        </div>
      ))}
    </div>
  );
}

// Global keyframes used by the kit (orb pulse). Mount once near the app root.
export const TianOSKeyframes = () => (
  <style>{`@keyframes tianosPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.05)}}`}</style>
);
