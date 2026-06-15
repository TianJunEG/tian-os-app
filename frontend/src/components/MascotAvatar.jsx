import React, { useEffect, useRef, useState } from 'react';
import { getMascot } from '../config/mascots';
import { speak } from '../utils/sound';

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

// MascotBubble — a mascot avatar beside a speech bubble.
// Single canonical implementation used across the app (PSL chat, hints, etc.).
// - `text`: the message; renders nothing when empty.
// - `speak`: when true, the text is read aloud via TTS on change (opt-in).
// - `showName`: prefixes the bubble with the mascot's name in its accent color.
export function MascotBubble({
  mascotKey = 'lejo',
  text,
  size = 'xs',
  showName = true,
  speak: speakEnabled = false,
  className = '',
}) {
  const mascot = getMascot(mascotKey);
  const spokenRef = useRef('');

  useEffect(() => {
    if (speakEnabled && text && text !== spokenRef.current) {
      spokenRef.current = text;
      speak(text);
    }
  }, [text, speakEnabled]);

  if (!text) return null;

  const name = mascot?.name || 'Lejo';
  const bg = mascot?.colorLight || '#fff7ed';
  const border = mascot?.color || '#ea580c';
  const accent = mascot?.color || '#ea580c';

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <MascotAvatar name={mascotKey} size={size} showRing={false} />
      <div
        className="relative rounded-lg border px-3 py-1.5 text-xs leading-relaxed text-ink-800"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <div
          className="absolute -left-1.5 top-2 h-3 w-3 rotate-45 border-l border-b"
          style={{ backgroundColor: bg, borderColor: border }}
        />
        <span className="relative">
          {showName && <strong style={{ color: accent }}>{name}: </strong>}
          {text}
        </span>
      </div>
    </div>
  );
}

// MascotGreeting — a calm header strip (avatar + name + greeting line) for the
// top of a module page. No TTS; falls back to the mascot's default greeting.
export function MascotGreeting({ mascotKey, text, studentName, size = 'lg', className = '' }) {
  const mascot = getMascot(mascotKey);
  if (!mascot) return null;

  const message = text || mascot.greeting?.(studentName || 'there') || '';

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}
      style={{ backgroundColor: mascot.colorLight }}
    >
      <MascotAvatar name={mascotKey} size={size} />
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: mascot.color }}>
          {mascot.name}
        </p>
        {message && <p className="truncate text-sm text-ink-700">{message}</p>}
      </div>
    </div>
  );
}
