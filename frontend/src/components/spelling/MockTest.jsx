import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, RotateCcw, Check, X, ChevronRight, Flame, Eye } from 'lucide-react';
import { createSpeaker, ttsSupported, speakOptionsFor, voiceAvailableFor, loadVoices } from '../../utils/tts';
import { isCorrect } from '../../utils/spellingGames';
import { isHandwritten } from '../../utils/spellingLang';
import { playCorrect, playWrong } from '../../utils/sound';
import HandwritingPad from './HandwritingPad';
import ScoreSummary from './ScoreSummary';

// Reads a word (or its example sentence + the word) aloud, repeating once like a
// real spelling test. English/Malay are typed and auto-checked; Chinese is
// written by hand on a canvas, then the answer is revealed and self-marked.
export default function MockTest({ words, onAttempt, lang = 'en' }) {
  const speaker = useRef(createSpeaker());
  const inputRef = useRef(null);
  const hand = isHandwritten(lang);
  const sp = useMemo(() => speakOptionsFor(lang), [lang]);

  const hasSentences = useMemo(() => words.some((w) => w.sentence), [words]);
  const [readSentence, setReadSentence] = useState(hasSentences);
  const [slow, setSlow] = useState(false);
  const [hasVoice, setHasVoice] = useState(lang === 'en');

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
  const [score, setScore] = useState({ correct: 0, done: 0 });
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = words[index];
  const canSpeak = ttsSupported() && hasVoice;

  // Voices load asynchronously; check whether this language has one.
  useEffect(() => {
    let live = true;
    loadVoices().then(() => live && setHasVoice(voiceAvailableFor(lang)));
    return () => { live = false; };
  }, [lang]);

  const buildSteps = (entry) => {
    const rate = slow ? 0.7 : 0.9;
    const steps = [];
    const sayWord = lang === 'en' ? `Spell. ${entry.word}.` : entry.word;
    if (readSentence && entry.sentence) {
      steps.push({ text: entry.sentence, rate, ...sp });
      steps.push({ pause: 400 });
      steps.push({ text: sayWord, rate, ...sp });
      steps.push({ pause: 900 });
      steps.push({ text: entry.sentence, rate, ...sp }); // teachers repeat once
      steps.push({ pause: 400 });
      steps.push({ text: sayWord, rate, ...sp });
    } else {
      steps.push({ text: entry.word, rate, ...sp });
      steps.push({ pause: 700 });
      steps.push({ text: entry.word, rate, ...sp });
    }
    return steps;
  };

  const play = () => speaker.current.play(buildSteps(current));

  // Auto-read each new word and focus the box (typed mode only).
  useEffect(() => {
    if (finished || !current) return;
    const t = setTimeout(() => {
      play();
      if (!hand) inputRef.current?.focus();
    }, 250);
    return () => {
      clearTimeout(t);
      speaker.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished]);

  const record = (ok) => {
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), done: s.done + 1 }));
    setStreak((st) => (ok ? st + 1 : 0));
    if (ok) playCorrect();
    else playWrong();
    onAttempt?.(current.word, ok);
    speaker.current.stop();
  };

  const check = () => {
    if (result) return;
    record(isCorrect(input, current.word));
  };

  const reveal = () => {
    speaker.current.stop();
    setRevealed(true);
  };

  const next = () => {
    if (index + 1 >= words.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setInput('');
    setResult(null);
    setRevealed(false);
  };

  const restart = () => {
    setIndex(0);
    setInput('');
    setResult(null);
    setRevealed(false);
    setScore({ correct: 0, done: 0 });
    setStreak(0);
    setFinished(false);
  };

  // Highlight the tested word inside its sentence on the reveal screen.
  const renderSentence = (entry) => {
    if (!entry.sentence) return null;
    const re = new RegExp(`(${entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    const parts = entry.sentence.split(re);
    return (
      <p className="text-gray-700 mt-1">
        {parts.map((part, i) =>
          part.toLowerCase() === entry.word.toLowerCase() ? (
            <span key={i} className="font-bold underline text-emerald-deep">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    );
  };

  if (finished) {
    return <ScoreSummary correct={score.correct} total={words.length} onRestart={restart} unit="words correct" />;
  }

  const lastWord = index + 1 >= words.length;

  return (
    <div>
      {!canSpeak && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
          {lang === 'en'
            ? 'Your browser does not support reading aloud. The word is shown below instead.'
            : 'No voice for this language is installed on this device, so the word is shown below instead.'}
        </div>
      )}

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
        {hasSentences && (
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={readSentence} onChange={(e) => setReadSentence(e.target.checked)} className="rounded text-emerald" />
            Read whole sentence
          </label>
        )}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} className="rounded text-emerald" />
          Slower voice
        </label>
        <span className="ml-auto flex items-center gap-2 text-gray-500">
          {streak >= 2 && (
            <span className="inline-flex items-center gap-0.5 text-orange-500 font-semibold" title="Streak">
              <Flame className="w-4 h-4" /> {streak}
            </span>
          )}
          Word {index + 1} of {words.length} · Score {score.correct}/{score.done}
        </span>
      </div>

      {/* Listen */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <button
          onClick={play}
          className="w-24 h-24 rounded-full bg-emerald text-white flex items-center justify-center hover:bg-emerald-deep shadow-lg transition active:scale-95"
          aria-label="Play"
        >
          <Volume2 className="w-10 h-10" />
        </button>
        <button onClick={play} className="text-sm text-emerald hover:underline inline-flex items-center gap-1">
          <RotateCcw className="w-4 h-4" /> Repeat
        </button>
        {!canSpeak && <div className="text-2xl font-bold tracking-wide text-gray-800">{current.word}</div>}
      </div>

      {/* Answer */}
      {hand ? (
        <div>
          <p className="text-center text-sm text-gray-500 mb-2">Listen, then write the word below.</p>
          <HandwritingPad key={index} />

          {!revealed ? (
            <button onClick={reveal} className="mt-4 w-full py-3 bg-emerald text-white rounded-lg hover:bg-emerald-deep font-medium inline-flex items-center justify-center gap-2">
              <Eye className="w-5 h-5" /> Show answer
            </button>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-gray-50">
              <p className="text-gray-700">The word is <span className="text-3xl font-bold text-gray-900 align-middle">{current.word}</span></p>
              {renderSentence(current)}
              {current.definition && <p className="text-sm text-gray-500 mt-1">{current.definition}</p>}

              {result == null ? (
                <>
                  <p className="text-sm font-medium text-gray-600 mt-4 mb-2">Did you write it correctly?</p>
                  <div className="flex gap-3">
                    <button onClick={() => record(false)} className="flex-1 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium inline-flex items-center justify-center gap-2">
                      <X className="w-5 h-5" /> Not yet
                    </button>
                    <button onClick={() => record(true)} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium inline-flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" /> I got it
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={next} className="mt-4 w-full py-3 bg-emerald text-white rounded-lg hover:bg-emerald-deep font-medium inline-flex items-center justify-center gap-2">
                  {lastWord ? 'See results' : 'Next word'} <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); result ? next() : check(); }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!result}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Type the word…"
            className={`w-full text-center text-2xl py-4 px-4 border-2 rounded-xl outline-none transition ${
              result === 'correct' ? 'border-green-500 bg-green-50' : result === 'wrong' ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-emerald'
            }`}
          />

          {result && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50">
              <div className={`flex items-center gap-2 font-semibold ${result === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                {result === 'correct' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {result === 'correct' ? 'Correct!' : 'Not quite.'}
                <span className="text-gray-700 font-normal">
                  The word is <span className="font-bold text-gray-900">{current.word}</span>
                </span>
              </div>
              {renderSentence(current)}
              {current.definition && <p className="text-sm text-gray-500 mt-1">{current.definition}</p>}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {!result ? (
              <button type="submit" className="flex-1 py-3 bg-emerald text-white rounded-lg hover:bg-emerald-deep font-medium">Check</button>
            ) : (
              <button type="submit" className="flex-1 py-3 bg-emerald text-white rounded-lg hover:bg-emerald-deep font-medium inline-flex items-center justify-center gap-2">
                {lastWord ? 'See results' : 'Next word'} <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
