import { useCallback, useEffect, useRef, useState } from 'react';
import { ttsSupported } from '../../../utils/tts';
import { createMascotSpeaker } from '../../../utils/sound';
import { isKokoroSupported } from '../../../utils/kokoroTTS';
import { getMascotVoice } from '../../../config/mascots';

// Comic vocals: read speech bubbles aloud, each in its mascot's chosen voice.
// Routed through utils/sound's mascot speaker, which prefers the per-mascot
// Kokoro neural voice (the one configured for each of the Tian 7) and falls back
// to a gender-matched Web Speech voice so a line is never silent. Each step
// carries the full voice profile (kokoro + gender + pitch/rate) so the speaker
// can pick the right engine. Two modes: tap a bubble's speaker (playLine) or
// auto-narrate a whole panel on arrival (playPanel).

const STORAGE_KEY = 'comicsAutoNarrate';

// The mascot speaking a given line. Resolved by the line's explicit `character`
// (every authored speech line has one), falling back to the panel character
// standing on the line's side for older/test data without a character field.
// Falls back to the default voice when neither resolves.
export function voiceForLine(line, characters = []) {
  const key = line.character || characters.find((c) => c.side === line.side)?.key;
  return getMascotVoice(key);
}

// Ordered speech steps for a panel, in authored (reading) order, each carrying
// its speaker's full voice profile (kokoro voice id + gender + pitch/rate) so
// the speaker can pick the per-mascot Kokoro voice or a gender-matched fallback.
// Pure + exported for testing.
export function buildNarrationSteps(panel) {
  if (!panel?.speech?.length) return [];
  return panel.speech.map((line) => {
    const v = voiceForLine(line, panel.characters);
    return { text: line.text, kokoro: v.kokoro, gender: v.gender, pitch: v.pitch, rate: v.rate };
  });
}

function readStoredAutoNarrate() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) === true;
  } catch {
    return false;
  }
}

export default function useComicNarration() {
  // Vocals work if either engine is available: Kokoro (neural) or Web Speech.
  const supported = ttsSupported() || isKokoroSupported();
  const [autoNarrate, setAutoNarrateState] = useState(readStoredAutoNarrate);
  // Index of the line currently being spoken within the panel's speech array
  // (for highlighting the active bubble); -1 when idle.
  const [speakingIndex, setSpeakingIndex] = useState(-1);

  const speakerRef = useRef(null);
  if (supported && !speakerRef.current) speakerRef.current = createMascotSpeaker();

  const stop = useCallback(() => {
    speakerRef.current?.stop();
    setSpeakingIndex(-1);
  }, []);

  const playSteps = useCallback((steps) => {
    if (!speakerRef.current || !steps.length) return;
    speakerRef.current.play(steps, {
      onStep: (i) => setSpeakingIndex(i),
      onDone: () => setSpeakingIndex(-1),
    });
  }, []);

  const playPanel = useCallback((panel) => playSteps(buildNarrationSteps(panel)), [playSteps]);

  const playLine = useCallback((line, characters) => {
    const v = voiceForLine(line, characters);
    playSteps([{ text: line.text, kokoro: v.kokoro, gender: v.gender, pitch: v.pitch, rate: v.rate }]);
  }, [playSteps]);

  const setAutoNarrate = useCallback((value) => {
    const next = !!value;
    setAutoNarrateState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    if (!next) stop();
  }, [stop]);

  // Never leave speech running when the reader unmounts.
  useEffect(() => () => speakerRef.current?.stop(), []);

  return { supported, autoNarrate, setAutoNarrate, speakingIndex, playPanel, playLine, stop };
}
