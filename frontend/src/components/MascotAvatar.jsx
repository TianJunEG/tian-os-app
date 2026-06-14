import React from 'react';
import { getMascot } from '../config/mascots';

const SIZES = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  xl: 'h-28 w-28',
};

const RING_SIZES = {
  xs: 'ring-2',
  sm: 'ring-2',
  md: 'ring-[3px]',
  lg: 'ring-[3px]',
  xl: 'ring-4',
};

export default function MascotAvatar({ name, size = 'md', className = '', showRing = true }) {
  const mascot = getMascot(name);
  if (!mascot) return null;

  const imgSrc = `/mascots/${name}.png`;
  const sizeClass = SIZES[size] || SIZES.md;
  const ringClass = showRing ? `${RING_SIZES[size] || RING_SIZES.md} ring-offset-2` : '';

  return (
    <img
      src={imgSrc}
      alt={mascot.name}
      className={`${sizeClass} rounded-full object-cover ${ringClass} ${className}`}
      style={showRing ? { '--tw-ring-color': mascot.color } : undefined}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
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
