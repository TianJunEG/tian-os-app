import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { resolveStudentVisualMode, getVisualModeStyles } from '../../../design-os/studentVisualMode';
import MascotAvatar from '../../../components/MascotAvatar';

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

const HEURISTIC_CHIP_STYLES = {
  'multi-step':          { background: '#fde8d8', color: '#c05621' },
  'ratio':               { background: '#e8f0fb', color: '#2f80d8' },
  'data-interpretation': { background: '#e8f7f0', color: '#1a7a4a' },
  'excess-shortage':     { background: '#fdf0e0', color: '#b06f1f' },
  'find-pattern':        { background: '#e0f7fa', color: '#00838f' },
  'make-list':           { background: '#fbf1e1', color: '#b06f1f' },
  'simultaneous':        { background: '#f0e8fb', color: '#7c3aed' },
  'work-backwards':      { background: '#f3faf6', color: '#1f9d57' },
  'bar-model':           { background: '#e8f0fb', color: '#2f80d8' },
};

const HEURISTIC_RESULT_BG = {
  'multi-step':          '#c05621',
  'ratio':               '#2f80d8',
  'data-interpretation': '#1a7a4a',
  'excess-shortage':     '#d9892e',
  'find-pattern':        '#0097a7',
  'make-list':           '#b06f1f',
  'simultaneous':        '#7c3aed',
  'work-backwards':      '#1f9d57',
  'bar-model':           '#1e5fa8',
  'guess-check':         '#d8694f',
};

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

        let bg = '#eef0f4';
        let color = '#8a93a3';
        let ring = '';
        let scale = '';

        if (wasYes) {
          bg = '#1f9d57'; color = '#fff'; scale = 'scale-110';
        } else if (isActive) {
          bg = '#d9892e'; color = '#fff'; ring = 'ring-2 ring-[#fbf1e1]'; scale = 'scale-110';
        } else if (answered) {
          bg = '#dde1e8'; color = '#8a93a3';
        }

        return (
          <div
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${ring} ${scale}`}
            style={{ background: bg, color }}
          >
            {wasYes ? '✓' : answered && !isActive ? '✗' : i + 1}
          </div>
        );
      })}
      <span className="ml-1 text-xs font-medium" style={{ color: '#8a93a3' }}>
        {result
          ? result === FALLBACK ? 'None matched' : 'Found it!'
          : `Step ${currentIndex + 1} of ${QUESTIONS.length}`}
      </span>
    </div>
  );
}

export default function DecisionGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
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
    <div className={`bg-dot-grid min-h-screen pb-8 ${visualStyles.page}`}>
      <div className="mx-auto max-w-lg space-y-4 px-3 pt-4 pb-6 sm:px-6 sm:pt-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/psl')}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
            style={{ border: '1px solid #dde1e8', background: '#fff' }}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: '#5a6675' }} />
          </button>
          <MascotAvatar name="lejo" size="sm" showRing={false} />
          <div>
            <h1 className="text-lg font-bold sm:text-xl" style={{ color: '#232c39' }}>Which heuristic fits?</h1>
            <p className="text-sm" style={{ color: '#6b7585' }}>Answer yes or no to find out</p>
          </div>
        </div>

        <ProgressDots currentIndex={currentIndex} answers={answers} result={result} />

        {/* Question or result */}
        <div aria-live="polite">
          {!result ? (
            <div className="step-shell space-y-4 !p-5">
              {/* Heuristic chip */}
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold"
                style={HEURISTIC_CHIP_STYLES[current.heuristic] || { background: '#eef0f4', color: '#5a6675' }}
              >
                {current.label}
              </span>

              {/* Child-friendly question */}
              <p className="text-base font-bold leading-snug sm:text-lg" style={{ color: '#232c39' }}>
                {current.friendly}
              </p>

              {/* Hint */}
              <div className="mistake-hint-box flex items-start gap-2 !p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-none" style={{ color: '#d9892e' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#5a6675' }}>{current.hint}</p>
              </div>

              {/* Yes / No buttons */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <button
                  ref={yesRef}
                  onClick={() => handleAnswer(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d57]"
                  style={{ border: '2px solid #dde1e8', background: '#fff', color: '#232c39' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1f9d57'; e.currentTarget.style.background = '#f3faf6'; e.currentTarget.style.color = '#1f9d57'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dde1e8'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#232c39'; }}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Yes!
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8694f]"
                  style={{ border: '2px solid #dde1e8', background: '#fff', color: '#232c39' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d8694f'; e.currentTarget.style.background = '#fbece9'; e.currentTarget.style.color = '#d8694f'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dde1e8'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#232c39'; }}
                >
                  <XCircle className="h-5 w-5" />
                  Nope
                </button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-5 text-white"
              style={{ background: HEURISTIC_RESULT_BG[result.heuristic] || '#5a6675' }}
            >
              <p className="mono-label mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {result === FALLBACK ? 'No worries — try this' : 'Use this heuristic'}
              </p>
              <h2 className="mb-2 text-xl font-bold">{result.label}</h2>
              <p className="mb-4 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {HEURISTIC_DESCRIPTIONS[result.heuristic]}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  onClick={() => navigate(`/student/psl?heuristic=${result.heuristic}`)}
                  className="btn-gold !text-sm"
                >
                  Practice this heuristic →
                </button>
                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
