// Tiny sound-effect helper using the Web Audio API — synthesises short tones so
// there are no audio files to ship and it works offline. Respects a mute flag
// persisted in localStorage. The AudioContext is created lazily on first use
// (which happens inside a click handler, satisfying autoplay policies).

import { isKokoroSupported, loadKokoro, kokoroSpeak, stopKokoro } from './kokoroTTS';

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

let voiceEnabled = false;
try {
  voiceEnabled = JSON.parse(localStorage.getItem('pslVoice') || 'false');
} catch {
  voiceEnabled = false;
}

export const isVoiceEnabled = () => voiceEnabled;

export const setVoiceEnabled = (value) => {
  voiceEnabled = !!value;
  try {
    localStorage.setItem('pslVoice', JSON.stringify(voiceEnabled));
  } catch { /* ignore */ }
};

// Best-effort gender hints found in common system voice names (macOS, Windows,
// Chrome/Android). Used to pick a fitting voice per mascot; we always fall back
// to any English voice, and pitch still differentiates mascots if the OS only
// exposes one voice.
const MALE_VOICE_HINTS = ['male', 'daniel', 'alex', 'fred', 'rishi', 'aaron', 'oliver', 'arthur', 'gordon'];
const FEMALE_VOICE_HINTS = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'serena', 'zira', 'martha'];

const pickVoice = (voices, gender) => {
  const en = voices.filter((v) => v.lang && v.lang.startsWith('en'));
  if (!en.length) return null;
  const hints = gender === 'male' ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;
  const match = en.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  return match || en[0];
};

// Web Speech API (browser built-in) path — instant, but voices vary per device.
const webSpeechSpeak = (text, opts = {}) => {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = opts.rate ?? 0.9;
  utterance.pitch = opts.pitch ?? 1.1;
  const voices = synth.getVoices();
  const preferred = pickVoice(voices, opts.gender || 'female');
  if (preferred) utterance.voice = preferred;
  synth.speak(utterance);
};

// Kokoro (neural, consistent across devices) is preferred once its model has
// finished loading; until then — and on any failure — we use Web Speech so the
// first line is never silent. Opt out for testing via localStorage ttsEngine.
let kokoroReady = false;
let kokoroWarming = false;
const kokoroAllowed = () => {
  if (!isKokoroSupported()) return false;
  try { return localStorage.getItem('ttsEngine') !== 'webspeech'; } catch { return true; }
};
const warmKokoro = () => {
  if (kokoroReady || kokoroWarming) return;
  kokoroWarming = true;
  loadKokoro().then(() => { kokoroReady = true; }).catch(() => {}).finally(() => { kokoroWarming = false; });
};

// speak(text, opts?) — opts: { gender, pitch, rate, kokoro } (e.g. from
// getMascotVoice). Backward compatible: speak(text) keeps the default voice.
export const speak = (text, opts = {}) => {
  if (!voiceEnabled || muted || typeof window === 'undefined') return;
  // Interrupt whatever is currently speaking on either engine.
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  stopKokoro();

  if (kokoroAllowed()) {
    if (kokoroReady) {
      kokoroSpeak(text, { voice: opts.kokoro || 'af_heart', speed: opts.rate ?? 1 })
        .catch(() => webSpeechSpeak(text, opts));
      return;
    }
    warmKokoro(); // load in the background; speak now via Web Speech
  }
  webSpeechSpeak(text, opts);
};
