import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { Card } from '../../../components/ui';

const QUESTIONS = [
  {
    q: 'Is there a table, or a series of numbers or figures that grows?',
    friendly: 'Do the numbers follow a pattern — like they go up by the same amount each time?',
    hint: 'Like 2, 4, 6, 8… or a table where each row grows.',
    heuristic: 'find-pattern',
    label: 'H2: Find a Pattern',
  },
  {
    q: 'Is there a stated range, or multiples / factors to consider?',
    friendly: 'Does your problem talk about a range of numbers or things to choose from?',
    hint: 'Like "numbers between 10 and 50" or "multiples of 3." You\'d list them!',
    heuristic: 'make-list',
    label: 'H4: Make a List',
  },
  {
    q: 'Are two or more quantities linked in more than one way?',
    friendly: 'Does your problem give two clues about the same things?',
    hint: 'Like "3 apples + 2 oranges = $5" AND "1 apple + 2 oranges = $3."',
    heuristic: 'substitution',
    label: 'H3: Substitution',
  },
  {
    q: 'Is there a final result, with steps that led up to it?',
    friendly: 'Do you know the end answer and need to figure out what came before?',
    hint: 'Like "She ended with $20 after spending $5 and earning $8." Start from $20!',
    heuristic: 'work-backwards',
    label: 'H6: Working Backwards',
  },
  {
    q: 'Can it be shown easily with a model or diagram (bars)?',
    friendly: 'Can you draw bars or a picture to show the amounts?',
    hint: 'Draw a long bar and a short bar to compare — like a bar chart for the problem.',
    heuristic: 'bar-model',
    label: 'H1: Model / Diagram',
  },
];

const FALLBACK = { heuristic: 'guess-check', label: 'H5: Guess and Check' };

const HEURISTIC_COLORS = {
  'bar-model': 'from-blue-500 to-blue-600',
  'find-pattern': 'from-cyan-500 to-cyan-600',
  'substitution': 'from-purple-500 to-purple-600',
  'make-list': 'from-amber-500 to-amber-600',
  'guess-check': 'from-rose-500 to-rose-600',
  'work-backwards': 'from-emerald-500 to-emerald-600',
};

const HEURISTIC_CHIP_COLORS = {
  'find-pattern': 'bg-cyan-100 text-cyan-700',
  'make-list': 'bg-amber-100 text-amber-700',
  'substitution': 'bg-purple-100 text-purple-700',
  'work-backwards': 'bg-emerald-100 text-emerald-700',
  'bar-model': 'bg-blue-100 text-blue-700',
};

const HEURISTIC_DESCRIPTIONS = {
  'bar-model': 'Draw bars to show quantities. Part-whole or comparison — the model makes the maths visible.',
  'find-pattern': 'Build a table, spot how it changes each step, find the rule, then extend it.',
  'substitution': 'Make one quantity match across both equations, then subtract to eliminate it.',
  'make-list': 'List the candidates systematically and find the one that fits all the clues.',
  'guess-check': 'Make a sensible guess, check both totals, then adjust up or down.',
  'work-backwards': 'Start from the end result and reverse every step — each operation becomes its opposite.',
};

function ProgressDots({ currentIndex, answers, result }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label={`Step ${currentIndex + 1} of ${QUESTIONS.length}`}>
      {QUESTIONS.map((_, i) => {
        const answered = i < answers.length;
        const isActive = !result && i === currentIndex;
        const wasYes = result && i === answers.length - 1 && answers[i];

        return (
          <div
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
              wasYes
                ? 'scale-110 bg-emerald-500 text-white'
                : isActive
                  ? 'scale-110 bg-gold-400 text-white ring-2 ring-gold-200'
                  : answered
                    ? 'bg-ink-200 text-ink-400'
                    : 'bg-ink-100 text-ink-300'
            }`}
          >
            {wasYes ? '✓' : answered && !isActive ? '✗' : i + 1}
          </div>
        );
      })}
      <span className="ml-1 text-xs font-medium text-ink-400">
        {result
          ? result === FALLBACK ? 'None matched' : 'Found it!'
          : `Step ${currentIndex + 1} of ${QUESTIONS.length}`}
      </span>
    </div>
  );
}

export default function DecisionGuide() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const yesRef = useRef(null);

  useEffect(() => {
    if (!result && yesRef.current) {
      yesRef.current.focus();
    }
  }, [currentIndex, result]);

  const handleAnswer = (yes) => {
    const newAnswers = [...answers, yes];
    setAnswers(newAnswers);

    if (yes) {
      setResult(QUESTIONS[currentIndex]);
    } else if (currentIndex >= QUESTIONS.length - 1) {
      setResult(FALLBACK);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setResult(null);
    setAnswers([]);
  };

  const current = QUESTIONS[currentIndex];

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-6 sm:p-6">
      <button
        onClick={() => navigate('/student/psl')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Problem Solving Lab
      </button>

      <h1 className="text-lg font-bold text-ink-800">Which heuristic fits?</h1>

      <ProgressDots currentIndex={currentIndex} answers={answers} result={result} />

      {/* Question or result */}
      <div aria-live="polite">
        {!result ? (
          <Card className="space-y-4 p-5">
            {/* Heuristic chip */}
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${HEURISTIC_CHIP_COLORS[current.heuristic]}`}>
              {current.label}
            </span>

            {/* Child-friendly question */}
            <p className="text-base font-bold leading-snug text-ink-800 sm:text-lg">
              {current.friendly}
            </p>

            {/* Hint */}
            <div className="flex items-start gap-2 rounded-lg bg-ink-50 px-3 py-2.5">
              <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-gold-500" />
              <p className="text-xs leading-relaxed text-ink-500">{current.hint}</p>
            </div>

            {/* Yes / No buttons */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <button
                ref={yesRef}
                onClick={() => handleAnswer(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-4 py-3.5 text-sm font-bold transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <CheckCircle2 className="h-5 w-5" />
                Yes!
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-4 py-3.5 text-sm font-bold transition-colors hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <XCircle className="h-5 w-5" />
                Nope
              </button>
            </div>
          </Card>
        ) : (
          <div className={`rounded-2xl bg-gradient-to-br ${HEURISTIC_COLORS[result.heuristic]} p-5 text-white`}>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              {result === FALLBACK ? 'No worries — try this' : 'Use this heuristic'}
            </p>
            <h2 className="mb-2 text-xl font-bold">{result.label}</h2>
            <p className="mb-4 text-sm opacity-90">{HEURISTIC_DESCRIPTIONS[result.heuristic]}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => navigate(`/student/psl?heuristic=${result.heuristic}`)}
                className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                Practice this heuristic &rarr;
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
