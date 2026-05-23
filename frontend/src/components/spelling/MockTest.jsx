import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, RotateCcw, Check, X, ChevronRight } from 'lucide-react';
import { createSpeaker, ttsSupported } from '../../utils/tts';
import { isCorrect } from '../../utils/spellingGames';

// Reads a word (or its example sentence + "Spell '<word>'") aloud, repeating
// once like a real spelling test, then checks what the student types.
export default function MockTest({ words, onAttempt }) {
  const speaker = useRef(createSpeaker());
  const inputRef = useRef(null);

  const hasSentences = useMemo(() => words.some((w) => w.sentence), [words]);
  const [readSentence, setReadSentence] = useState(hasSentences);
  const [slow, setSlow] = useState(false);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
  const [score, setScore] = useState({ correct: 0, done: 0 });
  const [finished, setFinished] = useState(false);

  const current = words[index];

  const buildSteps = (entry) => {
    const rate = slow ? 0.7 : 0.9;
    const steps = [];
    if (readSentence && entry.sentence) {
      steps.push({ text: entry.sentence, rate });
      steps.push({ pause: 400 });
      steps.push({ text: `Spell. ${entry.word}.`, rate });
      steps.push({ pause: 900 });
      // Teachers repeat once.
      steps.push({ text: entry.sentence, rate });
      steps.push({ pause: 400 });
      steps.push({ text: `Spell. ${entry.word}.`, rate });
    } else {
      steps.push({ text: entry.word, rate });
      steps.push({ pause: 700 });
      steps.push({ text: entry.word, rate });
    }
    return steps;
  };

  const play = () => speaker.current.play(buildSteps(current));

  // Auto-read each new word and focus the box.
  useEffect(() => {
    if (finished || !current) return;
    const t = setTimeout(() => {
      play();
      inputRef.current?.focus();
    }, 250);
    return () => {
      clearTimeout(t);
      speaker.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished]);

  const check = () => {
    if (result) return; // already checked
    const ok = isCorrect(input, current.word);
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), done: s.done + 1 }));
    onAttempt?.(current.word, ok);
    speaker.current.stop();
  };

  const next = () => {
    if (index + 1 >= words.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setInput('');
    setResult(null);
  };

  const restart = () => {
    setIndex(0);
    setInput('');
    setResult(null);
    setScore({ correct: 0, done: 0 });
    setFinished(false);
  };

  // Highlight the tested word inside its sentence on the reveal screen.
  const renderSentence = (entry) => {
    if (!entry.sentence) return null;
    const re = new RegExp(`\\b(${entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
    const parts = entry.sentence.split(re);
    return (
      <p className="text-gray-700">
        {parts.map((part, i) =>
          re.test(part) && part.toLowerCase() === entry.word.toLowerCase() ? (
            <span key={i} className="font-bold underline text-purple-700">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    );
  };

  if (finished) {
    const pct = Math.round((score.correct / words.length) * 100);
    return (
      <div className="text-center py-10">
        <div className="text-5xl font-extrabold text-purple-600 mb-2">{pct}%</div>
        <p className="text-gray-700 mb-6">
          You spelt {score.correct} of {words.length} words correctly.
        </p>
        <button
          onClick={restart}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {!ttsSupported() && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
          Your browser does not support reading aloud. The word is shown below instead.
        </div>
      )}

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
        {hasSentences && (
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={readSentence}
              onChange={(e) => setReadSentence(e.target.checked)}
              className="rounded text-purple-600"
            />
            Read whole sentence
          </label>
        )}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={slow}
            onChange={(e) => setSlow(e.target.checked)}
            className="rounded text-purple-600"
          />
          Slower voice
        </label>
        <span className="ml-auto text-gray-500">
          Word {index + 1} of {words.length} · Score {score.correct}/{score.done}
        </span>
      </div>

      {/* Listen */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <button
          onClick={play}
          className="w-24 h-24 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 shadow-lg transition active:scale-95"
          aria-label="Play"
        >
          <Volume2 className="w-10 h-10" />
        </button>
        <button onClick={play} className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1">
          <RotateCcw className="w-4 h-4" /> Repeat
        </button>
        {!ttsSupported() && (
          <div className="text-2xl font-bold tracking-wide text-gray-800">{current.word}</div>
        )}
      </div>

      {/* Answer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          result ? next() : check();
        }}
      >
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
            result === 'correct'
              ? 'border-green-500 bg-green-50'
              : result === 'wrong'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 focus:border-purple-500'
          }`}
        />

        {result && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50">
            <div
              className={`flex items-center gap-2 font-semibold ${
                result === 'correct' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {result === 'correct' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {result === 'correct' ? 'Correct!' : 'Not quite.'}
              <span className="text-gray-700 font-normal">
                The word is <span className="font-bold text-gray-900">{current.word}</span>
              </span>
            </div>
            {renderSentence(current)}
            {current.definition && (
              <p className="text-sm text-gray-500 mt-1">{current.definition}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {!result ? (
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Check
            </button>
          ) : (
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center justify-center gap-2"
            >
              {index + 1 >= words.length ? 'See results' : 'Next word'}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
