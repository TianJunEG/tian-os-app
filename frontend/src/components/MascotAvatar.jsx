import React, { useEffect, useRef, useState } from 'react';
import { getMascot, getMascotVoice, MASCOTS, MASCOT_ORDER } from '../config/mascots';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/sound';
import { Check } from 'lucide-react';

const SIZES = {
  xs: 32,
  sm: 40,
  md: 56,
  lg: 80,
  xl: 112,
};

const SIZE_CLASSES = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  xl: 'h-28 w-28',
};

const RING_CLASSES = {
  xs: 'ring-2',
  sm: 'ring-2',
  md: 'ring-[3px]',
  lg: 'ring-[3px]',
  xl: 'ring-4',
};

const FONT_SIZES = { xs: 14, sm: 16, md: 22, lg: 32, xl: 44 };

function InitialFallback({ mascot, name, size }) {
  const fontSize = FONT_SIZES[size] || FONT_SIZES.md;
  return (
    <div
      className={`${SIZE_CLASSES[size] || SIZE_CLASSES.md} flex items-center justify-center rounded-full font-bold text-white select-none`}
      style={{ backgroundColor: mascot.color, fontSize }}
      aria-label={mascot.name}
    >
      {(name || mascot.name).charAt(0).toUpperCase()}
    </div>
  );
}

export default function MascotAvatar({ name, size = 'md', className = '', showRing = true }) {
  const [imgFailed, setImgFailed] = useState(false);
  const mascot = getMascot(name);
  if (!mascot) return null;

  const imgSrc = `/mascots/${name}.png`;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const ringClass = showRing ? `${RING_CLASSES[size] || RING_CLASSES.md} ring-offset-2` : '';

  if (imgFailed) {
    return (
      <div className={`${ringClass} rounded-full ${className}`} style={showRing ? { '--tw-ring-color': mascot.color } : undefined}>
        <InitialFallback mascot={mascot} name={name} size={size} />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={mascot.name}
      className={`${sizeClass} rounded-full object-cover ${ringClass} ${className}`}
      style={showRing ? { '--tw-ring-color': mascot.color } : undefined}
      onError={() => setImgFailed(true)}
    />
  );
}

export function AvatarPicker({ currentAvatar, onSelect, onClose }) {
  const [selected, setSelected] = useState(currentAvatar || null);
  const [saving, setSaving] = useState(false);
  const { updateProfile } = useAuth();

  const handleSave = async () => {
    if (!selected || selected === currentAvatar) { onClose?.(); return; }
    setSaving(true);
    const result = await updateProfile({ avatar: selected });
    setSaving(false);
    if (result.success) {
      onSelect?.(selected);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold text-ink-900">Choose Your Avatar</h2>
        <p className="mt-1 text-sm text-ink-500">Pick a mascot to represent you across Tian OS.</p>
        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {MASCOT_ORDER.map((key) => {
            const m = MASCOTS[key];
            const isSelected = selected === key;
            return (
              <button key={key} onClick={() => setSelected(key)} className="group flex flex-col items-center gap-1.5">
                <div
                  className={`relative overflow-hidden rounded-full transition-all ${isSelected ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                  style={{ width: 56, height: 56, border: `3px solid ${m.color}`, ...(isSelected ? { ringColor: m.color } : {}) }}
                >
                  <img src={`/mascots/${key}.png`} alt={m.name} className="h-full w-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={`text-xs font-semibold ${isSelected ? 'text-ink-900' : 'text-ink-400'}`}>{m.name}</span>
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="mt-5 flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: MASCOTS[selected]?.colorLight }}>
            <MascotAvatar name={selected} size="sm" />
            <div>
              <p className="text-sm font-semibold text-ink-900">{MASCOTS[selected]?.name}</p>
              <p className="text-xs text-ink-500">{MASCOTS[selected]?.role} · Age {MASCOTS[selected]?.age}</p>
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line-soft px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-bone">Cancel</button>
          <button onClick={handleSave} disabled={saving || !selected} className="rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-white hover:bg-emerald disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MascotBubble({ name, message, size = 'md', className = '', voiced = false }) {
  const mascot = getMascot(name);
  // Opt-in TTS: read the message aloud in this mascot's voice (Kokoro when
  // ready, Web Speech fallback). speak() itself respects the voiceEnabled/muted
  // gate, so nothing plays unless the user has turned voice on.
  const spokenRef = useRef('');
  useEffect(() => {
    if (voiced && message && message !== spokenRef.current) {
      spokenRef.current = message;
      speak(message, getMascotVoice(name));
    }
  }, [voiced, message, name]);

  if (!mascot) return null;

  const headSrc = `/mascots/${name}-head.png`;
  const fallbackSrc = `/mascots/${name}.png`;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <img
        src={headSrc}
        alt={mascot.name}
        className={`${SIZE_CLASSES[size] || SIZE_CLASSES.md} shrink-0 rounded-full object-cover`}
        onError={(e) => { e.currentTarget.src = fallbackSrc; }}
      />
      <div
        className="relative rounded-2xl px-4 py-2.5 text-sm font-medium text-ink-700"
        style={{ backgroundColor: mascot.colorLight }}
      >
        <div
          className="absolute -left-2 top-3 h-3 w-3 rotate-45"
          style={{ backgroundColor: mascot.colorLight }}
        />
        <span className="relative">{message}</span>
      </div>
    </div>
  );
}
