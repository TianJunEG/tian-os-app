import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui';

const QUESTIONS = [
  { q: 'Is there a table, or a series of numbers or figures that grows?', heuristic: 'find-pattern', label: 'H2: Find a Pattern' },
  { q: 'Is there a stated range, or multiples / factors to consider?', heuristic: 'make-list', label: 'H4: Make a List' },
  { q: 'Are two or more quantities linked in more than one way?', heuristic: 'substitution', label: 'H3: Substitution' },
  { q: 'Is there a final result, with steps that led up to it?', heuristic: 'work-backwards', label: 'H6: Working Backwards' },
  { q: 'Can it be shown easily with a model or diagram (bars)?', heuristic: 'bar-model', label: 'H1: Model / Diagram' },
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

const HEURISTIC_DESCRIPTIONS = {
  'bar-model': 'Draw bars to show quantities. Part-whole or comparison — the model makes the maths visible.',
  'find-pattern': 'Build a table, spot how it changes each step, find the rule, then extend it.',
  'substitution': 'Make one quantity match across both equations, then subtract to eliminate it.',
  'make-list': 'List the candidates systematically and find the one that fits all the clues.',
  'guess-check': 'Make a sensible guess, check both totals, then adjust up or down.',
  'work-backwards': 'Start from the end result and reverse every step — each operation becomes its opposite.',
};

export default function DecisionGuide() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);

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

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-6 sm:p-6">
      <button
        onClick={() => navigate('/student/psl')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Problem Solving Lab
      </button>

      <div>
        <h1 className="text-lg font-bold text-ink-800">Decision Guide</h1>
        <p className="text-sm text-ink-500">
          Work through the questions in order. The first &ldquo;Yes&rdquo; picks your heuristic.
          If every answer is &ldquo;No&rdquo;, use Guess and Check.
        </p>
      </div>

      {/* Flow map */}
      <div className="space-y-1.5">
        {QUESTIONS.map((q, i) => {
          let status = 'upcoming';
          if (result) {
            status = q === result ? 'selected' : 'skipped';
          } else if (i < currentIndex) {
            status = 'no';
          } else if (i === currentIndex) {
            status = 'active';
          }
          return (
            <div
              key={i}
              className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-xs transition-all ${
                status === 'active'
                  ? 'border-gold-300 bg-gold-50 font-semibold text-ink-700'
                  : status === 'selected'
                    ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-700'
                    : status === 'no'
                      ? 'border-ink-100 text-ink-300 line-through'
                      : 'border-ink-100 text-ink-400'
              }`}
            >
              <span className="w-5 flex-none text-center font-bold">{i + 1}</span>
              <span className="flex-1 min-w-0">{q.q}</span>
              <span className="flex-none font-bold text-[11px] sm:text-xs">&rarr; {q.label}</span>
            </div>
          );
        })}
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            result === FALLBACK
              ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-700'
              : 'border-ink-100 text-ink-400'
          }`}
        >
          <span className="w-5 flex-none text-center font-bold">&bull;</span>
          <span className="flex-1">If all &ldquo;No&rdquo;</span>
          <span className="flex-none font-bold">&rarr; {FALLBACK.label}</span>
        </div>
      </div>

      {/* Question or result */}
      {!result ? (
        <Card className="p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Question {currentIndex + 1} of {QUESTIONS.length}
          </p>
          <p className="mb-5 text-base font-semibold text-ink-800">
            {QUESTIONS[currentIndex].q}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-4 py-3 text-sm font-bold transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Yes
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-4 py-3 text-sm font-bold transition-colors hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700"
            >
              <XCircle className="h-4 w-4" />
              No
            </button>
          </div>
        </Card>
      ) : (
        <div className={`rounded-2xl bg-gradient-to-br ${HEURISTIC_COLORS[result.heuristic]} p-5 text-white`}>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">Use this heuristic</p>
          <h2 className="mb-2 text-xl font-bold">{result.label}</h2>
          <p className="mb-4 text-sm opacity-90">{HEURISTIC_DESCRIPTIONS[result.heuristic]}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/student/psl?heuristic=${result.heuristic}`)}
              className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              Practice this heuristic &rarr;
            </button>
            <button
              onClick={reset}
              className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/20"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
