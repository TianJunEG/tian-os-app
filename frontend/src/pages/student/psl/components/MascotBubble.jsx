import React, { useEffect, useRef } from 'react';
import { speak } from '../../../../utils/sound';

function LejoAvatar() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 shrink-0">
      <circle cx="16" cy="16" r="15" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.5" />
      <rect x="8" y="6" width="16" height="14" rx="4" fill="#EA580C" />
      <rect x="10" y="8" width="12" height="10" rx="3" fill="#FFF7ED" />
      <circle cx="13" cy="13" r="1.5" fill="#1E293B" />
      <circle cx="19" cy="13" r="1.5" fill="#1E293B" />
      <path d="M13.5 16c0 0 1.2 1.5 2.5 1.5s2.5-1.5 2.5-1.5" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" fill="none" />
      <rect x="6" y="10" width="3" height="4" rx="1.5" fill="#EA580C" />
      <rect x="23" y="10" width="3" height="4" rx="1.5" fill="#EA580C" />
      <rect x="12" y="3" width="2" height="4" rx="1" fill="#EA580C" />
      <rect x="18" y="3" width="2" height="4" rx="1" fill="#EA580C" />
      <rect x="10" y="22" width="5" height="5" rx="2" fill="#EA580C" />
      <rect x="17" y="22" width="5" height="5" rx="2" fill="#EA580C" />
    </svg>
  );
}

export default function MascotBubble({ text }) {
  const spokenRef = useRef('');
  useEffect(() => {
    if (text && text !== spokenRef.current) {
      spokenRef.current = text;
      speak(text);
    }
  }, [text]);

  if (!text) return null;
  return (
    <div className="flex items-start gap-2 mb-1">
      <LejoAvatar />
      <div className="relative rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs text-orange-900 leading-relaxed">
        <div className="absolute -left-1.5 top-2 h-3 w-3 rotate-45 border-l border-b border-orange-200 bg-orange-50" />
        <span className="relative"><strong className="text-orange-600">Lejo:</strong> {text}</span>
      </div>
    </div>
  );
}
