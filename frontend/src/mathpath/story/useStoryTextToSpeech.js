import { useEffect, useRef, useState } from 'react';
import {
  STORY_TTS_CONFIG,
  cancelStorySpeech,
  isBrowserTtsAvailable,
  pickBrowserVoice,
} from './storyTtsService';

export default function useStoryTextToSpeech({ onSentenceChange } = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [rate, setRate] = useState(0.85);
  const activeQueueRef = useRef([]);
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    setIsAvailable(STORY_TTS_CONFIG.provider === 'browser' && isBrowserTtsAvailable());
    return () => cancelStorySpeech();
  }, []);

  const speakAt = (sentences = [], index = 0) => {
    if (!isBrowserTtsAvailable() || !sentences.length) {
      setIsPlaying(false);
      onSentenceChange?.(-1);
      return;
    }

    const safeIndex = Math.max(0, Math.min(sentences.length - 1, index));
    activeQueueRef.current = sentences;
    activeIndexRef.current = safeIndex;
    onSentenceChange?.(safeIndex);
    cancelStorySpeech();

    const utterance = new window.SpeechSynthesisUtterance(sentences[safeIndex]);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.voice = pickBrowserVoice();
    utterance.onend = () => {
      const nextIndex = activeIndexRef.current + 1;
      if (nextIndex < activeQueueRef.current.length) {
        speakAt(activeQueueRef.current, nextIndex);
      } else {
        activeIndexRef.current = -1;
        setIsPlaying(false);
        onSentenceChange?.(-1);
      }
    };
    utterance.onerror = () => {
      activeIndexRef.current = -1;
      setIsPlaying(false);
      onSentenceChange?.(-1);
    };
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const play = (sentences = []) => speakAt(sentences, 0);
  const replaySentence = () => speakAt(activeQueueRef.current, Math.max(0, activeIndexRef.current));
  const pause = () => {
    cancelStorySpeech();
    activeIndexRef.current = -1;
    setIsPlaying(false);
    onSentenceChange?.(-1);
  };

  return {
    isAvailable,
    isPlaying,
    rate,
    setRate,
    play,
    pause,
    replaySentence,
  };
}
