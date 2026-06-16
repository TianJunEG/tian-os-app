// On-device speech-to-text via transformers.js Whisper (already a dependency,
// pulled in by kokoro-js). The audio is captured, decoded, and transcribed
// entirely in the browser — it never leaves the device and nothing is persisted.
// That on-device posture is the whole point for (potentially child) voices;
// callers must still gate this behind consent + a feature flag.
//
// NOTE: the mic capture + decode + transcription path cannot be exercised in CI
// (no microphone / WASM audio in headless). It needs real-device QA, and a
// parental-consent layer, before being enabled in production.

const MODEL_ID = 'Xenova/whisper-tiny.en'; // small English model (~40 MB), cached after first load

let asrPromise = null;

export function isSpeechInputSupported() {
  return typeof navigator !== 'undefined'
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === 'function'
    && typeof window !== 'undefined'
    && typeof window.MediaRecorder !== 'undefined'
    && typeof WebAssembly !== 'undefined';
}

// Lazily load the ASR pipeline (downloads the model from the HF CDN on first use,
// then browser-cached — same pattern as the Kokoro TTS layer).
export function loadAsr() {
  if (!asrPromise) {
    asrPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      return pipeline('automatic-speech-recognition', MODEL_ID);
    })().catch((err) => { asrPromise = null; throw err; });
  }
  return asrPromise;
}

// Decode a recorded audio blob to the 16 kHz mono Float32 samples Whisper expects.
async function blobTo16kMono(blob) {
  const buf = await blob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const decoded = await ctx.decodeAudioData(buf);
  if (ctx.close) ctx.close();
  const target = 16000;
  if (decoded.sampleRate === target && decoded.numberOfChannels === 1) {
    return decoded.getChannelData(0);
  }
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * target), target);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

// Begin recording from the mic. Returns a controller:
//   stop()   -> resolves with the transcript (string)
//   cancel() -> aborts, releases the mic, no transcription
// The mic stream is always released. Audio is held only in memory for the
// length of one transcription.
export async function startRecording({ maxMs = 15000 } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.start();

  const release = () => stream.getTracks().forEach((t) => t.stop());
  const autostop = setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, maxMs);

  return {
    async stop() {
      clearTimeout(autostop);
      if (rec.state !== 'inactive') {
        const stopped = new Promise((resolve) => { rec.onstop = resolve; });
        rec.stop();
        await stopped;
      }
      release();
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      const pcm = await blobTo16kMono(blob);
      const asr = await loadAsr();
      const result = await asr(pcm);
      return String(result?.text || '').trim();
    },
    cancel() {
      clearTimeout(autostop);
      try { if (rec.state !== 'inactive') rec.stop(); } catch { /* ignore */ }
      release();
    },
  };
}
