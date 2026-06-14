import React, { useState } from 'react';
import { getMascot } from '../config/mascots';

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

export function MascotBubble({ name, message, size = 'md', className = '' }) {
  const mascot = getMascot(name);
  if (!mascot) return null;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <MascotAvatar name={name} size={size} />
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
