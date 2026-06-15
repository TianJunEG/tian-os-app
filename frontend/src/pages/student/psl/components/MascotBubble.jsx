import React from 'react';
import { MascotBubble as SharedMascotBubble } from '../../../../components/MascotAvatar';

// PSL chat bubble — thin adapter over the canonical MascotBubble.
// Keeps the existing PSL call signature (`text`, `mascotKey`) and enables TTS,
// so session hints/voice scripts are read aloud as before.
export default function MascotBubble({ text, mascotKey = 'lejo' }) {
  return <SharedMascotBubble mascotKey={mascotKey} text={text} size="xs" showName speak className="mb-1" />;
}
