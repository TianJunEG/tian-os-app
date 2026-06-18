import React, { useEffect, useRef } from 'react';
import MascotAvatar from '../../../../components/MascotAvatar';
import { getMascot, getMascotVoice } from '../../../../config/mascots';
import { speak } from '../../../../utils/sound';

export default function MascotBubble({ text, mascotKey = 'lejo' }) {
  const mascot = getMascot(mascotKey);
  const spokenRef = useRef('');
  useEffect(() => {
    if (text && text !== spokenRef.current) {
      spokenRef.current = text;
      speak(text, getMascotVoice(mascotKey));
    }
  }, [text]);

  if (!text) return null;
  const displayName = mascot?.name || 'Lejo';
  const bgColor = mascot?.colorLight || '#fff7ed';
  const borderColor = mascot?.color || '#ea580c';
  const textColor = mascot?.color || '#ea580c';

  return (
    <div className="flex items-start gap-3 mb-2">
      <img
        src={`/mascots/${mascotKey}-head.png`}
        alt={displayName}
        className="h-14 w-14 shrink-0 rounded-full object-cover"
        onError={(e) => { e.currentTarget.src = `/mascots/${mascotKey}.png`; }}
      />
      <div
        className="relative rounded-lg border px-4 py-2.5 text-sm leading-relaxed"
        style={{ backgroundColor: bgColor, borderColor, color: '#1e293b' }}
      >
        <div
          className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 border-l border-b"
          style={{ backgroundColor: bgColor, borderColor }}
        />
        <span className="relative"><strong style={{ color: textColor }}>{displayName}:</strong> {text}</span>
      </div>
    </div>
  );
}
