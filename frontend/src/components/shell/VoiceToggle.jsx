import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isVoiceEnabled, setVoiceEnabled, subscribeVoiceEnabled, stopSpeaking } from '../../utils/sound';

// App-wide voice / mute toggle that lives in the shell header so every student
// screen has a reachable global control over auto-narrating mascot bubbles.
// Reflects and toggles the shared voice gate in utils/sound.js; per-screen
// "Read aloud" buttons remain separate actions layered on top of this gate.
export default function VoiceToggle({ className = '' }) {
  const [enabled, setEnabled] = useState(() => isVoiceEnabled());

  // Stay in sync when the gate is toggled from anywhere (other toggle, a
  // per-screen control, etc.).
  useEffect(() => subscribeVoiceEnabled(setEnabled), []);

  const toggle = () => {
    const next = !enabled;
    setVoiceEnabled(next);
    // Muting should silence whatever is mid-utterance, not just the next line.
    if (!next) stopSpeaking();
  };

  const Icon = enabled ? Volume2 : VolumeX;
  const label = enabled ? 'Mute voice' : 'Unmute voice';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={!enabled}
      title={label}
      className={`relative flex items-center rounded-btn px-2.5 py-2 text-body-muted hover:bg-line hover:text-ink ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
