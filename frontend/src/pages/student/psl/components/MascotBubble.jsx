import React, { useEffect, useRef } from 'react';
import MascotAvatar from '../../../../components/MascotAvatar';
import { getMascot } from '../../../../config/mascots';
import { speak } from '../../../../utils/sound';

export default function MascotBubble({ text, mascotKey = 'lejo' }) {
  const mascot = getMascot(mascotKey);
  const spokenRef = useRef('');
  useEffect(() => {
    if (text && text !== spokenRef.current) {
      spokenRef.current = text;
      speak(text);
    }
  }, [text]);

  if (!text) return null;
  const displayName = mascot?.name || 'Lejo';
  const bgColor = mascot?.colorLight || '#fff7ed';
  const borderColor = mascot?.color || '#ea580c';
  const textColor = mascot?.color || '#ea580c';

  return (
    <div className="flex items-start gap-2 mb-1">
      <MascotAvatar name={mascotKey} size="xs" showRing={false} />
      <div
        className="relative rounded-lg border px-3 py-1.5 text-xs leading-relaxed"
        style={{ backgroundColor: bgColor, borderColor, color: '#1e293b' }}
      >
        <div
          className="absolute -left-1.5 top-2 h-3 w-3 rotate-45 border-l border-b"
          style={{ backgroundColor: bgColor, borderColor }}
        />
        <span className="relative"><strong style={{ color: textColor }}>{displayName}:</strong> {text}</span>
      </div>
    </div>
  );
}
