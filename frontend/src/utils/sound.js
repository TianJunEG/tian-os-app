// Tiny sound-effect helper using the Web Audio API — synthesises short tones so
// there are no audio files to ship and it works offline. Respects a mute flag
// persisted in localStorage. The AudioContext is created lazily on first use
// (which happens inside a click handler, satisfying autoplay policies).

let ctx = null;
let muted = false;
try {
  muted = JSON.parse(localStorage.getItem('spellingMuted') || 'false');
} catch {
  muted = false;
}

export const isMuted = () => muted;

export const setMuted = (value) => {
  muted = !!value;
  try {
    localStorage.setItem('spellingMuted', JSON.stringify(muted));
  } catch {
    /* ignore */
  }
};

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
};

// notes: [{ freq, time (s offset), dur (s), type, gain }]
const playNotes = (notes, baseGain = 0.07) => {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.type || 'sine';
    osc.frequency.value = n.freq;
    const start = now + (n.time || 0);
    const dur = n.dur || 0.15;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(n.gain ?? baseGain, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }
};

export const playCorrect = () => playNotes([{ freq: 660, time: 0, dur: 0.12 }, { freq: 880, time: 0.1, dur: 0.18 }]);
export const playWrong = () => playNotes([{ freq: 196, time: 0, dur: 0.25, type: 'sawtooth', gain: 0.05 }]);
export const playWin = () =>
  playNotes([
    { freq: 523, time: 0, dur: 0.15 },
    { freq: 659, time: 0.12, dur: 0.15 },
    { freq: 784, time: 0.24, dur: 0.15 },
    { freq: 1047, time: 0.36, dur: 0.32 }
  ]);
export const playClick = () => playNotes([{ freq: 440, time: 0, dur: 0.05, gain: 0.04 }]);
