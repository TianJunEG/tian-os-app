import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Check, X, ChevronRight, Volume2, Flame } from 'lucide-react';
import { isCorrect } from '../../utils/spellingGames';
import { speakOnce, speakOptionsFor } from '../../utils/tts';
import { isHandwritten } from '../../utils/spellingLang';
import { playCorrect, playWrong } from '../../utils/sound';
import HandwritingPad from './HandwritingPad';
import ScoreSummary from './ScoreSummary';

// The traditional Look → Cover → Write → Check method. English/Malay type the
// word from memory; Chinese is written by hand and self-marked.
export default function LookCoverCheck({ words, onAttempt, lang = 'en' }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('look'); // look | write | check
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, done: 0 });
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);
  const hand = isHandwritten(lang);

  const current = words[index];

  useEffect(() => {
    setPhase('look');
    setInput('');
    setResult(null);
  }, [index]);

  useEffect(() => {
    if (phase === 'write' && !hand) inputRef.current?.focus();
  }, [phase, hand]);

  const record = (ok) => {
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), done: s.done + 1 }));
    setStreak((st) => (ok ? st + 1 : 0));
    if (ok) playCorrect();
    else playWrong();
    onAttempt?.(current.word, ok);
  };

  const check = () => {
    record(isCorrect(input, current.word));
    setPhase('check');
  };

  const next = () => {
    if (index + 1 >= words.length) return setFinished(true);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setScore({ correct: 0, done: 0 });
    setStreak(0);
    setFinished(false);
    setPhase('look');
  };

  if (finished) {
    return <ScoreSummary correct={score.correct} total={words.length} onRestart={restart} restartLabel="Start over" unit="remembered" />;
  }

  const steps = ['look', 'write', 'check'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
        <span>Word {index + 1} of {words.length}</span>
        <span className="flex items-center gap-2">
          {streak >= 2 && (
            <span className="inline-flex items-center gap-0.5 text-orange-500 font-semibold" title="Streak">
              <Flame className="w-4 h-4" /> {streak}
            </span>
          )}
          Score {score.correct}/{score.done}
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-8">
        {steps.map((s) => (
          <span key={s} className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${phase === s ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {s}
          </span>
        ))}
      </div>

      {phase === 'look' && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3 inline-flex items-center gap-1 justify-center w-full">
            <Eye className="w-4 h-4" /> Look carefully and remember
          </p>
          <div className="text-5xl font-extrabold tracking-wide text-gray-900 mb-2">{current.word}</div>
          <button onClick={() => speakOnce(current.word, speakOptionsFor(lang))} className="text-navy-600 hover:bg-navy-50 rounded-lg p-2 inline-flex items-center gap-1 text-sm">
            <Volume2 className="w-4 h-4" /> Hear it
          </button>
          {current.sentence && <p className="text-gray-500 mt-3">{current.sentence}</p>}
          <button onClick={() => setPhase('write')} className="mt-8 w-full py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 font-medium inline-flex items-center justify-center gap-2">
            <EyeOff className="w-5 h-5" /> Cover &amp; write
          </button>
        </div>
      )}

      {phase === 'write' && (
        hand ? (
          <div>
            <p className="text-center text-sm text-gray-500 mb-3 inline-flex items-center gap-1 justify-center w-full">
              <EyeOff className="w-4 h-4" /> The word is hidden — write it from memory
            </p>
            <HandwritingPad key={index} />
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setPhase('look')} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
                <Eye className="w-5 h-5" /> Look again
              </button>
              <button type="button" onClick={() => setPhase('check')} className="flex-1 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 font-medium">
                Show answer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) check(); }}>
            <p className="text-center text-sm text-gray-500 mb-3 inline-flex items-center gap-1 justify-center w-full">
              <EyeOff className="w-4 h-4" /> The word is hidden — type it from memory
            </p>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Type the word…"
              className="w-full text-center text-2xl py-4 border-2 border-gray-300 focus:border-navy-500 rounded-xl outline-none"
            />
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setPhase('look')} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
                <Eye className="w-5 h-5" /> Look again
              </button>
              <button type="submit" disabled={!input.trim()} className="flex-1 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-40 font-medium">
                Check
              </button>
            </div>
          </form>
        )
      )}

      {phase === 'check' && (
        <div className="text-center">
          {hand ? (
            <>
              <p className="text-xs text-gray-400 uppercase mb-1">The word is</p>
              <p className="text-5xl font-extrabold text-gray-900 mb-4">{current.word}</p>
              {current.sentence && <p className="text-gray-500 mb-6">{current.sentence}</p>}
              {result == null ? (
                <>
                  <p className="text-sm font-medium text-gray-600 mb-2">Did you write it correctly?</p>
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
                <button onClick={next} className="w-full py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 font-medium inline-flex items-center justify-center gap-2">
                  {index + 1 >= words.length ? 'See results' : 'Next word'} <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <>
              <div className={`inline-flex items-center gap-2 text-lg font-semibold mb-4 ${result === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                {result === 'correct' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                {result === 'correct' ? 'Correct!' : 'Keep practising'}
              </div>
              <div className="flex items-center justify-center gap-6 mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase">You wrote</p>
                  <p className={`text-2xl font-bold ${result === 'correct' ? 'text-green-700' : 'text-red-600 line-through'}`}>{input || '—'}</p>
                </div>
                {result === 'wrong' && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Correct</p>
                    <p className="text-2xl font-bold text-gray-900">{current.word}</p>
                  </div>
                )}
              </div>
              <button onClick={next} className="w-full py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 font-medium inline-flex items-center justify-center gap-2">
                {index + 1 >= words.length ? 'See results' : 'Next word'} <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
