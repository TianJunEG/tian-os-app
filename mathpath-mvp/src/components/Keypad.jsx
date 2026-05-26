'use client';

import { useEffect } from 'react';
import { T } from '@/lib/tokens';
import { IconCheck } from '@/components/icons';

// Light Tian OS keypad — paper keys, navy primary with a gold check. Large tap targets for
// fast mobile entry; also binds the hardware keyboard for quick desktop testing.
function KeyBtn({ children, onClick, muted, primary, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 58, borderRadius: 16,
        background: primary ? T.navy700 : muted ? T.bone : T.paper,
        border: primary || muted ? 'none' : `1px solid ${T.hairline}`,
        color: primary ? T.gold500 : T.navy700,
        fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 500,
        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: primary ? T.shadowResting : 'none',
        opacity: disabled ? 0.4 : 1,
        transition: `transform 100ms ${T.easeCalm}`,
      }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.95)'; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
    >
      {children}
    </button>
  );
}

export default function Keypad({ value, onChange, onSubmit, disabled }) {
  useEffect(() => {
    function onKey(e) {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') onChange(value + e.key);
      else if (e.key === 'Backspace') onChange(value.slice(0, -1));
      else if (e.key === 'Enter') onSubmit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [value, onChange, onSubmit, disabled]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
        <KeyBtn key={k} onClick={() => !disabled && onChange(value + k)} disabled={disabled}>{k}</KeyBtn>
      ))}
      <KeyBtn muted onClick={() => !disabled && onChange(value.slice(0, -1))} disabled={disabled}>⌫</KeyBtn>
      <KeyBtn onClick={() => !disabled && onChange(value + '0')} disabled={disabled}>0</KeyBtn>
      <KeyBtn primary onClick={() => !disabled && value && onSubmit()} disabled={disabled || !value}>
        <IconCheck size={22} />
      </KeyBtn>
    </div>
  );
}
