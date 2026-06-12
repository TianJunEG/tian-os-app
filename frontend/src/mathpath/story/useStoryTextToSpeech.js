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
  const fallbackTimerRef = useRef(null);
  const voiceWaitTimerRef = useRef(null);
  const startupRetryTimerRef = useRef(null);
  const speechStartedRef = useRef(false);
  const utteranceRef = useRef(null);
  const playbackIdRef = useRef(0);
  const [voiceCount, setVoiceCount] = useState(0);
  const [audioStatus, setAudioStatus] = useState('idle');

  useEffect(() => {
    const available = STORY_TTS_CONFIG.provider === 'browser' && isBrowserTtsAvailable();
    setIsAvailable(available);
    if (!available) return () => {};

    const refreshVoices = () => {
      setVoiceCount(window.speechSynthesis.getVoices?.().length || 0);
    };
    refreshVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      if (voiceWaitTimerRef.current) window.clearTimeout(voiceWaitTimerRef.current);
      if (startupRetryTimerRef.current) window.clearTimeout(startupRetryTimerRef.current);
      window.speechSynthesis.removeEventListener?.('voiceschanged', refreshVoices);
      cancelStorySpeech();
    };
  }, []);

  const clearFallbackTimer = () => {
    if (!fallbackTimerRef.current) return;
    window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  };

  const clearVoiceWaitTimer = () => {
    if (!voiceWaitTimerRef.current) return;
    window.clearTimeout(voiceWaitTimerRef.current);
    voiceWaitTimerRef.current = null;
  };

  const clearStartupRetryTimer = () => {
    if (!startupRetryTimerRef.current) return;
    window.clearTimeout(startupRetryTimerRef.current);
    startupRetryTimerRef.current = null;
  };

  const failSpeech = (status = 'blocked', playbackId = playbackIdRef.current) => {
    if (playbackId !== playbackIdRef.current) return;
    clearFallbackTimer();
    clearVoiceWaitTimer();
    clearStartupRetryTimer();
    cancelStorySpeech();
    utteranceRef.current = null;
    activeIndexRef.current = -1;
    setIsPlaying(false);
    setAudioStatus(status);
    onSentenceChange?.(-1);
  };

  const estimateSentenceMs = (sentence = '') => {
    const words = String(sentence || '').split(/\s+/).filter(Boolean).length;
    const baseMs = Math.max(1400, words * 430);
    return Math.round(baseMs / Math.max(0.5, rate));
  };

  const finishSentence = (playbackId = playbackIdRef.current) => {
    if (playbackId !== playbackIdRef.current) return;
    clearFallbackTimer();
    clearStartupRetryTimer();
    utteranceRef.current = null;
    const nextIndex = activeIndexRef.current + 1;
    if (nextIndex < activeQueueRef.current.length) {
      speakAt(activeQueueRef.current, nextIndex, { playbackId });
    } else {
      activeIndexRef.current = -1;
      setIsPlaying(false);
      setAudioStatus('idle');
      onSentenceChange?.(-1);
    }
  };

  const speakAt = (sentences = [], index = 0, options = {}) => {
    const playbackId = options.playbackId ?? playbackIdRef.current + 1;
    if (options.playbackId && options.playbackId !== playbackIdRef.current) return;
    playbackIdRef.current = playbackId;

    if (!isBrowserTtsAvailable() || !sentences.length) {
      setIsPlaying(false);
      setAudioStatus('unavailable');
      onSentenceChange?.(-1);
      return;
    }

    const voices = window.speechSynthesis.getVoices?.() || [];
    setVoiceCount(voices.length);
    if (!voices.length && !options.skipVoiceWait && (options.voiceWaitMs || 0) < 1800) {
      const safeWaitIndex = Math.max(0, Math.min(sentences.length - 1, index));
      activeQueueRef.current = sentences;
      activeIndexRef.current = safeWaitIndex;
      onSentenceChange?.(safeWaitIndex);
      setIsPlaying(true);
      setAudioStatus('voices_loading');
      clearVoiceWaitTimer();
      voiceWaitTimerRef.current = window.setTimeout(() => {
        if (playbackId !== playbackIdRef.current) return;
        speakAt(sentences, index, { voiceWaitMs: (options.voiceWaitMs || 0) + 300, playbackId });
      }, 300);
      return;
    }

    const safeIndex = Math.max(0, Math.min(sentences.length - 1, index));
    activeQueueRef.current = sentences;
    activeIndexRef.current = safeIndex;
    onSentenceChange?.(safeIndex);
    clearFallbackTimer();
    clearVoiceWaitTimer();
    clearStartupRetryTimer();
    speechStartedRef.current = false;
    cancelStorySpeech();
    window.speechSynthesis.resume?.();

    const utterance = new window.SpeechSynthesisUtterance(sentences[safeIndex]);
    utterance.rate = rate;
    utterance.pitch = 1.35;
    utterance.volume = 1;
    utterance.voice = options.forceDefaultVoice ? null : pickBrowserVoice();
    utteranceRef.current = utterance;
    utterance.onstart = () => {
      if (playbackId !== playbackIdRef.current) return;
      speechStartedRef.current = true;
      setAudioStatus('speaking');
    };
    utterance.onend = () => finishSentence(playbackId);
    utterance.onerror = (event) => {
      failSpeech(event?.error === 'not-allowed' ? 'blocked' : 'failed', playbackId);
    };
    setIsPlaying(true);
    setAudioStatus('starting');
    startupRetryTimerRef.current = window.setTimeout(() => {
      if (playbackId !== playbackIdRef.current) return;
      if (speechStartedRef.current || options.forceDefaultVoice) return;
      cancelStorySpeech();
      speakAt(sentences, safeIndex, { skipVoiceWait: true, forceDefaultVoice: true, playbackId });
    }, 1200);
    fallbackTimerRef.current = window.setTimeout(() => {
      if (playbackId !== playbackIdRef.current) return;
      if (!speechStartedRef.current || window.speechSynthesis?.paused) {
        failSpeech((window.speechSynthesis.getVoices?.().length || voiceCount) > 0 ? 'blocked' : 'voices_loading', playbackId);
      }
    }, Math.min(3500, estimateSentenceMs(sentences[safeIndex])));
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume?.();
  };

  const play = (sentences = []) => speakAt(sentences, 0);
  const replaySentence = () => speakAt(activeQueueRef.current, Math.max(0, activeIndexRef.current));
  const pause = () => {
    playbackIdRef.current += 1;
    clearFallbackTimer();
    clearVoiceWaitTimer();
    clearStartupRetryTimer();
    cancelStorySpeech();
    utteranceRef.current = null;
    activeIndexRef.current = -1;
    setIsPlaying(false);
    setAudioStatus('idle');
    onSentenceChange?.(-1);
  };

  return {
    isAvailable,
    isPlaying,
    rate,
    voiceCount,
    audioStatus,
    setRate,
    play,
    pause,
    replaySentence,
  };
}
