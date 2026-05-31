const env = import.meta.env || {};

export const STORY_TTS_CONFIG = {
  provider: env.VITE_TTS_PROVIDER || env.TTS_PROVIDER || 'browser',
  voice: env.VITE_TTS_VOICE || env.TTS_VOICE || 'warm_student_voice',
};

export function splitIntoSentences(text = '') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function isBrowserTtsAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function pickBrowserVoice(preferredVoice = STORY_TTS_CONFIG.voice) {
  if (!isBrowserTtsAvailable()) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  const preferred = String(preferredVoice || '').toLowerCase();
  return (
    voices.find((voice) => voice.name.toLowerCase().includes(preferred)) ||
    voices.find((voice) => /female|samantha|karen|serena|zira|google uk english female/i.test(voice.name)) ||
    voices.find((voice) => /^en[-_]/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
}

export function cancelStorySpeech() {
  if (isBrowserTtsAvailable()) window.speechSynthesis.cancel();
}
