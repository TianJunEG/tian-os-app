import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import MascotAvatar from '../../../components/MascotAvatar';
import { Alert, BackLink, Badge, Button, Card } from '../../../components/ui';

const QUESTIONS = [
  {
    friendly: 'Does the problem need more than one step to solve — like adding, then multiplying?',
    hint: 'Like "First find the total, then find the difference." Two or more operations in a row.',
    heuristic: 'multi-step',
    label: 'Multi-Step Arithmetic',
  },
  {
    friendly: 'Does your problem say "for every X there are Y" or compare two groups using a ratio?',
    hint: 'Like "For every 2 red balls there are 3 blue balls." Draw a ratio bar to share the total.',
    heuristic: 'ratio',
    label: 'Proportional & Ratio Reasoning',
  },
  {
    friendly: 'Is there a table or chart with numbers you need to read and use?',
    hint: 'Like a bar chart showing scores or a table listing prices. Read the data, then calculate.',
    heuristic: 'data-interpretation',
    label: 'Data Interpretation',
  },
  {
    friendly: 'Does the problem have "too many" or "not enough" — like items left over or items short?',
    hint: 'Like "If each box holds 6, there are 2 left over. If each box holds 7, we\'re 1 short."',
    heuristic: 'excess-shortage',
    label: 'Excess & Shortage',
  },
  {
    friendly: 'Do the numbers follow a pattern — like they go up by the same amount each time?',
    hint: 'Like 2, 4, 6, 8… or a table where each row grows by the same rule.',
    heuristic: 'find-pattern',
    label: 'Find a Pattern',
  },
  {
    friendly: 'Does your problem talk about a range of numbers or things to choose from?',
    hint: 'Like "numbers between 10 and 50" or "multiples of 3." List them all and check!',
    heuristic: 'make-list',
    label: 'Make a List',
  },
  {
    friendly: 'Does your problem give two clues that both involve the same two unknowns?',
    hint: 'Like "3 pens + 2 books = $13" AND "1 pen + 2 books = $7." Match one quantity and eliminate.',
    heuristic: 'simultaneous',
    label: 'Simultaneous / Elimination',
  },
  {
    friendly: 'Do you know the end result and need to figure out what came before it?',
    hint: 'Like "She ended with $20 after spending $5 and earning $8." Start from $20 and reverse!',
    heuristic: 'work-backwards',
    label: 'Working Backwards',
  },
  {
    friendly: 'Can you draw bars or a picture to show how the amounts are related?',
    hint: 'Draw a long bar and a short bar to compare — like a bar chart for the problem.',
    heuristic: 'bar-model',
    label: 'Model / Diagram',
  },
];

const FALLBACK = { heuristic: 'guess-check', label: 'Guess and Check' };

const HEURISTIC_DESCRIPTIONS = {
  'multi-step':          'Break the problem into stages. Do the first operation, use the result, then do the next — one step at a time.',
  'ratio':               'Draw a ratio bar split into equal parts. Scale both sides to find the missing quantity.',
  'data-interpretation': 'Read the table or chart carefully. Pick out the values you need and calculate.',
  'excess-shortage':     'Try two different group sizes. The real answer sits between the leftover and the shortfall.',
  'find-pattern':        'Build a table, spot how it changes each step, find the rule, then extend it.',
  'make-list':           'List all candidates systematically and check each one against every clue.',
  'simultaneous':        'Make one quantity match across both equations, then subtract to eliminate it.',
  'work-backwards':      'Start from the end result and reverse every step — each operation becomes its opposite.',
  'bar-model':           'Draw bars to show quantities. Part-whole or comparison — the model makes the maths visible.',
  'guess-check':         'Make a sensible guess, check both totals, then adjust up or down until it works.',
};

function ProgressDots({ currentIndex, answers, result }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label={`Step ${currentIndex + 1} of ${QUESTIONS.length}`}>
      {QUESTIONS.map((_, i) => {
        const answered = i < answers.length;
        const isActive = !result && i === currentIndex;
        const wasYes = result && i === answers.length - 1 && answers[i];

        let cls = 'bg-line text-body-faint';
        if (wasYes) cls = 'scale-110 bg-emerald text-white';
        else if (isActive) cls = 'scale-110 bg-gold text-white ring-2 ring-gold-border';
        else if (answered) cls = 'bg-line-strong text-body-faint';

        return (
          <div
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${cls}`}
          >
            {wasYes ? '✓' : answered && !isActive ? '✗' : i + 1}
          </div>
        );
      })}
      <span className="ml-1 text-xs font-medium text-body-faint">
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
    <div className="mx-auto max-w-lg space-y-4 px-3 pt-4 pb-8 sm:px-6 sm:pt-6">
      {/* Header */}
      <div>
        <BackLink to="/student/psl" className="mb-3">Problem Solving</BackLink>
        <div className="flex items-center gap-3">
          <MascotAvatar name="lejo" size="sm" showRing={false} />
          <div>
            <h1 className="text-lg font-bold text-ink sm:text-xl">Which heuristic fits?</h1>
            <p className="text-sm text-body-muted">Answer yes or no to find out</p>
          </div>
        </div>
      </div>

      <ProgressDots currentIndex={currentIndex} answers={answers} result={result} />

      {/* Question or result */}
      <div aria-live="polite">
        {!result ? (
          <Card className="space-y-4 p-5">
            <Badge tone="emerald">{current.label}</Badge>

            <p className="text-base font-bold leading-snug text-ink sm:text-lg">
              {current.friendly}
            </p>

            <Alert tone="warning" icon={Lightbulb}>{current.hint}</Alert>

            {/* Yes / No buttons */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <button
                ref={yesRef}
                onClick={() => handleAnswer(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-btn border-2 border-line-strong bg-surface-white px-4 py-3.5 text-sm font-bold text-ink transition-colors hover:border-emerald hover:bg-emerald-tint hover:text-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
              >
                <CheckCircle2 className="h-5 w-5" />
                Yes!
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-btn border-2 border-line-strong bg-surface-white px-4 py-3.5 text-sm font-bold text-ink transition-colors hover:border-danger hover:bg-danger-tint hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
              >
                <XCircle className="h-5 w-5" />
                Nope
              </button>
            </div>
          </Card>
        ) : (
          <Card tone="emerald" className="space-y-3 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald">
              {result === FALLBACK ? 'No worries — try this' : 'Use this heuristic'}
            </p>
            <h2 className="text-xl font-bold text-ink">{result.label}</h2>
            <p className="text-sm text-body">
              {HEURISTIC_DESCRIPTIONS[result.heuristic]}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button onClick={() => navigate(`/student/psl?heuristic=${result.heuristic}`)}>
                Practice this heuristic →
              </Button>
              <Button variant="secondary" icon={RotateCcw} onClick={reset}>
                Start over
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
