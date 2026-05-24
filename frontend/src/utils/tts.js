// Thin wrapper around the browser Web Speech API (speechSynthesis) used by the
// mock spelling test and dictation. No external service or API key required.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export const ttsSupported = () => !!synth && typeof window.SpeechSynthesisUtterance !== 'undefined';

// Voices load asynchronously in most browsers; resolve once they are available.
export function loadVoices() {
  return new Promise((resolve) => {
    if (!synth) return resolve([]);
    let voices = synth.getVoices();
    if (voices.length) return resolve(voices);
    const handler = () => {
      voices = synth.getVoices();
      synth.removeEventListener('voiceschanged', handler);
      resolve(voices);
    };
    synth.addEventListener('voiceschanged', handler);
    // Fallback in case the event never fires.
    setTimeout(() => resolve(synth.getVoices()), 1000);
  });
}

export function getEnglishVoices() {
  if (!synth) return [];
  return synth.getVoices().filter((v) => /^en/i.test(v.lang));
}

// Maps a list language code to a BCP-47 speech tag for the Web Speech API.
const SPEECH_LANGS = { en: 'en-GB', ms: 'ms-MY', zh: 'zh-CN' };
export const speechLangFor = (code) => SPEECH_LANGS[code] || 'en-GB';

// The best installed voice for a language code ('en' | 'ms' | 'zh'), or
// undefined if none is available on this device.
export function bestVoiceFor(code) {
  if (!synth) return undefined;
  const prefix = code === 'ms' ? 'ms' : code === 'zh' ? 'zh' : 'en';
  const re = new RegExp(`^${prefix}([-_]|$)`, 'i');
  return synth.getVoices().find((v) => re.test(v.lang)) || undefined;
}

// English is treated as always available; other languages depend on the
// voices installed on the device.
export function voiceAvailableFor(code) {
  if (code === 'en') return ttsSupported();
  return !!bestVoiceFor(code);
}

// Convenience: { lang, voice } to spread onto a speech step or speakOnce opts.
export const speakOptionsFor = (code) => ({
  lang: speechLangFor(code),
  voice: bestVoiceFor(code)
});

// A small controller that plays a sequence of speech / pause steps and can be
// stopped midway. Each step is either { text, rate, pitch, lang, voice } or
// { pause: milliseconds }.
export function createSpeaker() {
  let cancelled = false;
  let timer = null;

  const stop = () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    timer = null;
    synth?.cancel();
  };

  const play = (steps, { onStep, onDone } = {}) => {
    stop();
    cancelled = false;
    if (!ttsSupported()) {
      onDone?.();
      return;
    }
    let i = 0;
    const next = () => {
      if (cancelled) return;
      if (i >= steps.length) {
        onDone?.();
        return;
      }
      const step = steps[i];
      const index = i;
      i += 1;
      onStep?.(index, step);

      if (step.pause != null) {
        timer = setTimeout(next, step.pause);
        return;
      }

      const u = new SpeechSynthesisUtterance(step.text);
      u.rate = step.rate ?? 0.9;
      u.pitch = step.pitch ?? 1;
      u.lang = step.lang ?? 'en-GB';
      if (step.voice) u.voice = step.voice;
      u.onend = () => {
        if (!cancelled) next();
      };
      u.onerror = () => {
        if (!cancelled) next();
      };
      // Chrome occasionally needs a resume nudge.
      synth.cancel();
      synth.speak(u);
    };
    next();
  };

  return { play, stop };
}

// One-off helper for simply reading a word or phrase aloud.
export function speakOnce(text, opts = {}) {
  if (!ttsSupported()) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.9;
  u.pitch = opts.pitch ?? 1;
  u.lang = opts.lang ?? 'en-GB';
  if (opts.voice) u.voice = opts.voice;
  synth.speak(u);
}

export function cancelSpeech() {
  synth?.cancel();
}
