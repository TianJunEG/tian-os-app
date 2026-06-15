// Kokoro neural TTS (free, open-weights, Apache-2.0) running fully in-browser via
// ONNX/WASM. The model (~80 MB, q8) streams from HuggingFace's CDN on first use
// and is cached by the browser; nothing is bundled and there is no backend.
//
// This module is the single seam for "good" voices. utils/sound.js uses it when
// ready and falls back to the Web Speech API otherwise, so voice never dies.

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

let ttsPromise = null;   // cached load promise (singleton)
let currentAudio = null; // in-flight playback, so a new line can interrupt
let currentUrl = null;   // object URL backing currentAudio, revoked on stop/end

export function isKokoroSupported() {
  return typeof window !== 'undefined'
    && typeof WebAssembly !== 'undefined'
    && typeof Audio !== 'undefined';
}

// Kick off (or reuse) the model load. Resolves with the KokoroTTS instance.
export function loadKokoro() {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const { KokoroTTS } = await import('kokoro-js');
      return KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8' });
    })().catch((err) => {
      ttsPromise = null; // allow a later retry
      throw err;
    });
  }
  return ttsPromise;
}

export function stopKokoro() {
  if (currentAudio) {
    try { currentAudio.pause(); } catch { /* ignore */ }
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl); // free the blob even when interrupted (not just on 'ended')
    currentUrl = null;
  }
}

// Generate + play. Resolves once playback starts; rejects if the model isn't
// loaded yet or generation/playback fails (caller falls back to Web Speech).
export async function kokoroSpeak(text, { voice = 'af_heart', speed = 1 } = {}) {
  const tts = await loadKokoro();
  const audio = await tts.generate(text, { voice, speed });
  const blob = audio.toBlob();
  stopKokoro(); // pause + revoke any previous clip before starting a new one
  const url = URL.createObjectURL(blob);
  const el = new Audio(url);
  currentAudio = el;
  currentUrl = url;
  el.addEventListener('ended', () => {
    URL.revokeObjectURL(url);
    if (currentUrl === url) currentUrl = null;
  }, { once: true });
  await el.play();
  return blob.size;
}
