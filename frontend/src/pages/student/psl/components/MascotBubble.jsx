import React from 'react';

export default function MascotBubble({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2 mb-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-100">
        <svg className="h-4 w-4 text-gold-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
        </svg>
      </div>
      <div className="relative rounded-lg bg-gold-50 border border-gold-200 px-3 py-1.5 text-xs text-gold-800 leading-relaxed">
        <div className="absolute -left-1.5 top-2 h-3 w-3 rotate-45 border-l border-b border-gold-200 bg-gold-50" />
        <span className="relative">{text}</span>
      </div>
    </div>
  );
}
