// Tiny sound-effect helper using the Web Audio API — synthesises short tones so
// there are no audio files to ship and it works offline. Respects a mute flag
// persisted in localStorage. The AudioContext is created lazily on first use
// (which happens inside a click handler, satisfying autoplay policies).

import { isKokoroSupported, loadKokoro, kokoroSpeak, kokoroPlay, stopKokoro } from './kokoroTTS';

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

// Lightweight pub/sub so UI controls (e.g. the global VoiceToggle in the app
// shell) can reflect the shared voice gate reactively and stay in sync when
// toggled from anywhere. Backward compatible — callers that only use the
// getter/setter are unaffected.
const voiceListeners = new Set();
const notifyVoiceListeners = () => {
  for (const fn of voiceListeners) {
    try { fn(voiceEnabled); } catch { /* ignore listener errors */ }
  }
};

// subscribe(fn) -> unsubscribe(). fn is called with the new boolean on change.
export const subscribeVoiceEnabled = (fn) => {
  if (typeof fn !== 'function') return () => {};
  voiceListeners.add(fn);
  return () => voiceListeners.delete(fn);
};

// Strip emoji / pictographs / dingbats so TTS engines don't read them aloud
// ("🎉" → "party popper"). Collapses the whitespace the removal leaves behind.
// Exported so utils/tts (comic bubbles) shares the exact same behaviour.
export const stripEmoji = (text) =>
  String(text ?? '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export const setVoiceEnabled = (value) => {
  voiceEnabled = !!value;
  try {
    localStorage.setItem('pslVoice', JSON.stringify(voiceEnabled));
  } catch { /* ignore */ }
  notifyVoiceListeners();
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
  const clean = stripEmoji(text);
  if (!clean) return;
  // Interrupt whatever is currently speaking on either engine.
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  stopKokoro();

  if (kokoroAllowed()) {
    if (kokoroReady) {
      kokoroSpeak(clean, { voice: opts.kokoro || 'af_heart', speed: opts.rate ?? 1 })
        .catch(() => webSpeechSpeak(clean, opts));
      return;
    }
    warmKokoro(); // load in the background; speak now via Web Speech
  }
  webSpeechSpeak(clean, opts);
};

// Immediately silence any in-progress narration on either engine. Used by the
// global voice/mute toggle so muting takes effect mid-utterance, not just for
// the next line. Safe to call when nothing is speaking.
export const stopSpeaking = () => {
  if (typeof window === 'undefined') return;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  stopKokoro();
};

// Speak one step via Web Speech and call onEnd when it finishes (or errors), so
// a sequence can advance. Mirrors webSpeechSpeak but per-step and completion-
// aware; used as the Kokoro fallback inside createMascotSpeaker.
const webSpeechStep = (clean, step, onEnd) => {
  if (typeof window === 'undefined' || !window.speechSynthesis
      || typeof window.SpeechSynthesisUtterance === 'undefined') { onEnd?.(); return; }
  const synth = window.speechSynthesis;
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = step.rate ?? 0.9;
  u.pitch = step.pitch ?? 1.1;
  u.lang = step.lang ?? 'en-GB';
  const preferred = pickVoice(synth.getVoices(), step.gender || 'female');
  if (preferred) u.voice = preferred;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  synth.cancel();
  synth.speak(u);
};

// A controller that reads a sequence of speech steps aloud, each in its own
// mascot voice, and can be stopped midway. Each step is
// { text, kokoro, gender, pitch, rate }. Prefers the per-mascot Kokoro neural
// voice (once the model is warm) and falls back to a gender-matched Web Speech
// voice so the line is never silent — the comic equivalent of speak(), but
// sequenced (each line waits for the previous to end) and with onStep/onDone
// hooks for highlighting the active bubble.
//
// Unlike speak(), this does NOT gate on the PSL voiceEnabled flag: comics have
// their own narration toggle. It still honours the global mute.
//
// Each play() takes a monotonic token; stop() (and the next play(), which calls
// stop() first) bumps it. Every advance / async continuation re-checks the token
// so a superseded sequence can never advance — and a slow Kokoro clip generated
// for an old panel can't hijack the new one (it aborts after generate when the
// token has moved on). This is what keeps rapid panel changes / "Play next" from
// playing stale or overlapping narration.
export function createMascotSpeaker() {
  let cancelled = false;
  let playId = 0;

  const stop = () => {
    cancelled = true;
    playId += 1; // invalidate any in-flight sequence / advance / generate
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    stopKokoro();
  };

  const play = (steps, { onStep, onDone } = {}) => {
    stop();
    cancelled = false;
    const myId = playId; // stop() just bumped playId; this sequence owns the current id
    const live = () => !cancelled && myId === playId;
    if (muted || !steps?.length) { onDone?.(); return; }
    let i = 0;
    const next = () => {
      if (!live()) return;
      if (i >= steps.length) { onDone?.(); return; }
      const step = steps[i];
      const index = i;
      i += 1;
      onStep?.(index, step);

      const clean = stripEmoji(step.text || '');
      if (!clean) { next(); return; }
      const advance = () => { if (live()) next(); };

      if (kokoroAllowed() && kokoroReady) {
        kokoroPlay(clean, { voice: step.kokoro || 'af_heart', speed: step.rate ?? 1 }, advance, () => !live())
          .catch(() => { if (live()) webSpeechStep(clean, step, advance); });
        return;
      }
      if (kokoroAllowed()) warmKokoro(); // warm for later lines; speak this one now
      webSpeechStep(clean, step, advance);
    };
    next();
  };

  return { play, stop };
}
