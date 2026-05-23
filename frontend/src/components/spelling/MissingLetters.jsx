import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Check, X, ChevronRight, Volume2, Lightbulb } from 'lucide-react';
import { makeMissingLetters, isCorrect } from '../../utils/spellingGames';
import { speakOnce } from '../../utils/tts';

// Shows the word with some letters blanked out; the student types the missing
// letters into the gaps.
export default function MissingLetters({ words, onAttempt }) {
  const [index, setIndex] = useState(0);
  const [template, setTemplate] = useState([]);
  const [entries, setEntries] = useState({}); // position -> typed char
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, done: 0 });
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const inputs = useRef({});

  const current = words[index];
  const hiddenPositions = useMemo(
    () => template.map((c, i) => (c.hidden ? i : -1)).filter((i) => i >= 0),
    [template]
  );

  const setup = () => {
    setTemplate(makeMissingLetters(current.word, 0.4));
    setEntries({});
    setResult(null);
    setShowHint(false);
  };

  useEffect(() => {
    if (current) setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const first = hiddenPositions[0];
    if (first != null) inputs.current[first]?.focus();
  }, [hiddenPositions]);

  const handleType = (pos, value) => {
    const ch = value.slice(-1).replace(/[^A-Za-z]/g, '');
    setEntries((e) => ({ ...e, [pos]: ch }));
    if (ch) {
      const order = hiddenPositions;
      const nextPos = order[order.indexOf(pos) + 1];
      if (nextPos != null) inputs.current[nextPos]?.focus();
    }
  };

  const handleKey = (pos, e) => {
    if (e.key === 'Backspace' && !entries[pos]) {
      const order = hiddenPositions;
      const prev = order[order.indexOf(pos) - 1];
      if (prev != null) inputs.current[prev]?.focus();
    }
  };

  const check = () => {
    const assembled = template.map((c, i) => (c.hidden ? entries[i] || '' : c.char)).join('');
    const ok = isCorrect(assembled, current.word);
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), done: s.done + 1 }));
    onAttempt?.(current.word, ok);
  };

  const next = () => {
    if (index + 1 >= words.length) return setFinished(true);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setScore({ correct: 0, done: 0 });
    setFinished(false);
    setup();
  };

  if (finished) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl font-extrabold text-purple-600 mb-2">{score.correct}/{words.length}</div>
        <p className="text-gray-700 mb-6">words completed correctly.</p>
        <button onClick={restart} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center gap-2">
          <RotateCcw className="w-5 h-5" /> Play again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
        <span>Word {index + 1} of {words.length}</span>
        <span>Score {score.correct}/{score.done}</span>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <button onClick={() => speakOnce(current.word)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" aria-label="Hear word">
          <Volume2 className="w-5 h-5" />
        </button>
        {(current.definition || current.sentence) && (
          <button onClick={() => setShowHint((h) => !h)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1 text-sm">
            <Lightbulb className="w-5 h-5" /> Hint
          </button>
        )}
      </div>
      {showHint && <p className="text-center text-sm text-gray-500 mb-4">{current.definition || current.sentence}</p>}

      {/* Word with gaps */}
      <div className="flex flex-wrap gap-1.5 justify-center items-center mb-8">
        {template.map((c, i) =>
          c.hidden ? (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={entries[i] || ''}
              onChange={(e) => handleType(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              disabled={!!result}
              maxLength={1}
              autoComplete="off"
              spellCheck={false}
              className={`w-10 h-12 text-center text-2xl font-bold uppercase border-b-4 rounded-t outline-none ${
                result === 'correct'
                  ? 'border-green-500 bg-green-50'
                  : result === 'wrong'
                  ? 'border-red-500 bg-red-50'
                  : 'border-purple-400 focus:border-purple-600 bg-purple-50'
              }`}
            />
          ) : c.char === ' ' ? (
            <span key={i} className="w-4" />
          ) : (
            <span key={i} className="w-10 h-12 flex items-center justify-center text-2xl font-bold uppercase text-gray-800">
              {c.char}
            </span>
          )
        )}
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
          <button
            onClick={check}
            disabled={hiddenPositions.some((p) => !entries[p])}
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 font-medium"
          >
            Check
          </button>
        ) : (
          <button onClick={next} className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center justify-center gap-2">
            {index + 1 >= words.length ? 'See results' : 'Next word'} <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
