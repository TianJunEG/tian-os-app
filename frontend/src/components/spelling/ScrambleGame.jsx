import React, { useEffect, useState } from 'react';
import { RotateCcw, Check, X, ChevronRight, Volume2, Lightbulb, Flame } from 'lucide-react';
import { scrambleWord, isCorrect } from '../../utils/spellingGames';
import { speakOnce, speakOptionsFor } from '../../utils/tts';
import { isHandwritten } from '../../utils/spellingLang';
import { playCorrect, playWrong } from '../../utils/sound';
import ScoreSummary from './ScoreSummary';

// Letters (or characters) are shown as shuffled tiles; the student taps to build
// the word in order (tap a placed tile to send it back), with reset and check.
export default function ScrambleGame({ words, onAttempt, lang = 'en' }) {
  const tileCase = isHandwritten(lang) ? '' : 'uppercase';
  const [index, setIndex] = useState(0);
  const [pool, setPool] = useState([]);
  const [answer, setAnswer] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, done: 0 });
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = words[index];

  const setup = () => {
    setPool(scrambleWord(current.word));
    setAnswer([]);
    setResult(null);
    setShowHint(false);
  };

  useEffect(() => {
    if (current) setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const placeTile = (tile) => {
    if (result) return;
    setPool((p) => p.filter((t) => t.id !== tile.id));
    setAnswer((a) => [...a, tile]);
  };

  const removeTile = (tile) => {
    if (result) return;
    setAnswer((a) => a.filter((t) => t.id !== tile.id));
    setPool((p) => [...p, tile]);
  };

  const reset = () => setup();

  const check = () => {
    const attempt = answer.map((t) => t.letter).join('');
    const ok = isCorrect(attempt, current.word);
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), done: s.done + 1 }));
    setStreak((st) => (ok ? st + 1 : 0));
    if (ok) playCorrect();
    else playWrong();
    onAttempt?.(current.word, ok);
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
    setup();
  };

  if (finished) {
    return <ScoreSummary correct={score.correct} total={words.length} onRestart={restart} restartLabel="Play again" unit="unscrambled" />;
  }

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

      {/* Clues */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={() => speakOnce(current.word, speakOptionsFor(lang))} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" aria-label="Hear word">
          <Volume2 className="w-5 h-5" />
        </button>
        {(current.definition || current.sentence) && (
          <button onClick={() => setShowHint((h) => !h)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1 text-sm">
            <Lightbulb className="w-5 h-5" /> Hint
          </button>
        )}
      </div>
      {showHint && (
        <p className="text-center text-sm text-gray-500 mb-4">
          {current.definition || current.sentence}
        </p>
      )}

      {/* Answer slots */}
      <div
        className={`min-h-[64px] flex flex-wrap gap-2 justify-center items-center p-3 rounded-xl border-2 mb-6 ${
          result === 'correct' ? 'border-green-500 bg-green-50' : result === 'wrong' ? 'border-red-500 bg-red-50' : 'border-dashed border-gray-300'
        }`}
      >
        {answer.length === 0 && <span className="text-gray-400 text-sm">Tap the {isHandwritten(lang) ? 'characters' : 'letters'} in order</span>}
        {answer.map((tile) => (
          <button
            key={tile.id}
            onClick={() => removeTile(tile)}
            className={`w-11 h-11 rounded-lg bg-purple-600 text-white text-xl font-bold ${tileCase} shadow hover:bg-purple-700`}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      {/* Letter pool */}
      <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[44px]">
        {pool.map((tile) => (
          <button
            key={tile.id}
            onClick={() => placeTile(tile)}
            className={`w-11 h-11 rounded-lg bg-white border-2 border-gray-300 text-gray-800 text-xl font-bold ${tileCase} shadow-sm hover:border-purple-400 active:scale-95 transition`}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      {result === 'wrong' && (
        <p className="text-center text-red-600 mb-4 inline-flex items-center gap-1 justify-center w-full">
          <X className="w-4 h-4" /> The word is <span className="font-bold">{current.word}</span>
        </p>
      )}
      {result === 'correct' && (
        <p className="text-center text-green-700 mb-4 inline-flex items-center gap-1 justify-center w-full">
          <Check className="w-4 h-4" /> Correct!
        </p>
      )}

      <div className="flex gap-3">
        {!result ? (
          <>
            <button onClick={reset} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Reset
            </button>
            <button
              onClick={check}
              disabled={answer.length === 0}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 font-medium"
            >
              Check
            </button>
          </>
        ) : (
          <button onClick={next} className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center justify-center gap-2">
            {index + 1 >= words.length ? 'See results' : 'Next word'} <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
