import { useCallback, useEffect, useRef, useState } from 'react';
import { createSpeaker, ttsSupported } from '../../../utils/tts';
import { getMascotVoice } from '../../../config/mascots';

// Comic vocals: read speech bubbles aloud, each in its mascot's voice. Built on
// the Web Speech wrapper (utils/tts) — per-mascot pitch/rate from getMascotVoice
// differentiates the characters (boys lower, girls higher), no model download,
// works offline. Two modes: tap a bubble's speaker (playLine) or auto-narrate a
// whole panel on arrival (playPanel).

const STORAGE_KEY = 'comicsAutoNarrate';

// The mascot speaking a given line, resolved via the line's side → the panel
// character standing on that side. Falls back to the default voice.
export function voiceForLine(line, characters = []) {
  const char = characters.find((c) => c.side === line.side);
  return getMascotVoice(char?.key);
}

// Ordered speech steps for a panel, in authored (reading) order, each carrying
// its speaker's pitch/rate. Pure + exported for testing.
export function buildNarrationSteps(panel) {
  if (!panel?.speech?.length) return [];
  return panel.speech.map((line) => {
    const v = voiceForLine(line, panel.characters);
    return { text: line.text, pitch: v.pitch, rate: v.rate };
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
  const supported = ttsSupported();
  const [autoNarrate, setAutoNarrateState] = useState(readStoredAutoNarrate);
  // Index of the line currently being spoken within the panel's speech array
  // (for highlighting the active bubble); -1 when idle.
  const [speakingIndex, setSpeakingIndex] = useState(-1);

  const speakerRef = useRef(null);
  if (supported && !speakerRef.current) speakerRef.current = createSpeaker();

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
    playSteps([{ text: line.text, pitch: v.pitch, rate: v.rate }]);
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
