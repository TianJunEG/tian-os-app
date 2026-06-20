import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Star, Trophy, X, Zap } from 'lucide-react';
import { Button, Card, ProgressBar } from '../../../../components/ui';
import { useAuth } from '../../../../context/AuthContext';
import {
  TABLES,
  QUIZ_LENGTH,
  FLUENCY_THRESHOLD_MS,
  STRENGTH,
  initialFactState,
  generateQuestions,
  scoreSession,
  factKey,
} from '../../../../mathpath/timesTablesEngine';

const storageKey = (userId) => `tian_times_tables_facts_${userId}`;

function loadFactState(userId) {
  if (!userId) return initialFactState();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : initialFactState();
  } catch {
    return initialFactState();
  }
}

function saveFactState(userId, state) {
  if (!userId) return;
  try { localStorage.setItem(storageKey(userId), JSON.stringify(state)); } catch { /* noop */ }
}

// Visual hint: array model (SVG grid)
function ArrayModel({ a, b }) {
  const cellSize = 18;
  const gap = 2;
  const cols = Math.min(b, 12);
  const rows = Math.min(a, 12);
  const w = cols * (cellSize + gap);
  const h = rows * (cellSize + gap);
  return (
    <svg width={w} height={h} className="mx-auto my-2">
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * (cellSize + gap)}
            y={r * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={3}
            className="fill-teal-300 stroke-teal-500"
            strokeWidth={0.5}
          />
        ))
      )}
    </svg>
  );
}

// Visual hint: skip-count ladder
function SkipCountLadder({ factor, count }) {
  const steps = Array.from({ length: count }, (_, i) => factor * (i + 1));
  return (
    <div className="flex flex-wrap gap-2 justify-center my-2">
      {steps.map((val, i) => (
        <span
          key={i}
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            i === count - 1 ? 'bg-gold-tint text-gold-deep' : 'bg-bone text-ink-600'
          }`}
        >
          {val}
        </span>
      ))}
    </div>
  );
}

function ResultsScreen({ stats, onPlayAgain, onHome }) {
  const accuracyPct = Math.round(stats.accuracy * 100);
  const avgSec = stats.avgTimeMs ? (stats.avgTimeMs / 1000).toFixed(1) : '-';
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-center text-white">
          <Trophy className="mx-auto h-12 w-12 mb-3" />
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="mt-1 text-teal-100">{stats.fluencyLabel}</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line-soft p-3 sm:p-4">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-emerald-deep">{stats.correct}/{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-ink-500">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-emerald-deep">{accuracyPct}%</p>
            <p className="text-[10px] sm:text-xs text-ink-500">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-emerald-deep">{avgSec}s</p>
            <p className="text-[10px] sm:text-xs text-ink-500">Avg Time</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-sm text-ink-600">
          {stats.secureCount} of {stats.totalFacts} facts are now secure
        </p>
        <ProgressBar value={stats.secureCount} max={stats.totalFacts} size="sm" className="mt-2" />
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onPlayAgain}>Play Again</Button>
        <Button variant="secondary" onClick={onHome}>Back to Times Tables</Button>
      </div>
    </div>
  );
}

export default function TimesTablesFlashQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?.id || user?._id || user?.email || '';
  const isPractice = location.state?.mode === 'practice';

  const [factState, setFactState] = useState(() => initialFactState());
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState([]);
  const [questionStart, setQuestionStart] = useState(null);
  const [feedback, setFeedback] = useState(null); // { correct, correctAnswer }
  const [finished, setFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef(null);

  // Load per-user fact state and generate questions once the user is available
  useEffect(() => {
    if (!userId) return;
    const loaded = loadFactState(userId);
    setFactState(loaded);
    const qs = generateQuestions(loaded, TABLES, QUIZ_LENGTH);
    setQuestions(qs);
    setQuestionStart(Date.now());
  }, [userId]);

  useEffect(() => {
    if (!feedback && inputRef.current) inputRef.current.focus();
  }, [currentIdx, feedback]);

  const currentQuestion = questions[currentIdx];

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || feedback) return;
    const timeMs = Date.now() - questionStart;
    const numAnswer = parseInt(answer, 10);
    const correct = numAnswer === currentQuestion.product;
    const result = { a: currentQuestion.a, b: currentQuestion.b, correct, timeMs };

    setResults((prev) => [...prev, result]);
    setFeedback({ correct, correctAnswer: currentQuestion.product });

    setTimeout(() => {
      setFeedback(null);
      setAnswer('');
      setShowHint(false);
      if (currentIdx + 1 >= questions.length) {
        // Score and save
        const allResults = [...results, result];
        const { updatedFactState, sessionStats: stats } = scoreSession(factState, allResults);
        saveFactState(userId, updatedFactState);
        setFactState(updatedFactState);
        setSessionStats(stats);
        setFinished(true);
      } else {
        setCurrentIdx((i) => i + 1);
        setQuestionStart(Date.now());
      }
    }, correct ? 800 : 2000);
  }, [currentQuestion, answer, feedback, questionStart, currentIdx, questions.length, results, factState, userId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (finished && sessionStats) {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-4">
        <ResultsScreen
          stats={sessionStats}
          onPlayAgain={() => {
            setQuestions(generateQuestions(factState, TABLES, QUIZ_LENGTH));
            setCurrentIdx(0);
            setResults([]);
            setFinished(false);
            setSessionStats(null);
            setQuestionStart(Date.now());
          }}
          onHome={() => navigate('/student/mathpath/fluency/times-tables')}
        />
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progress = questions.length ? ((currentIdx) / questions.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/student/mathpath/fluency/times-tables')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="rounded-full bg-emerald-tint px-3 py-1 text-xs font-bold text-emerald-deep">
          {isPractice ? 'Practice Mode' : 'Flash Quiz'} {currentIdx + 1}/{questions.length}
        </span>
      </div>

      <ProgressBar value={progress} max={100} size="sm" />

      {/* Question card */}
      <Card className="p-8 text-center">
        <p className="text-3xl sm:text-4xl font-bold text-emerald-deep">
          {currentQuestion.a} × {currentQuestion.b}
        </p>

        {/* Feedback overlay */}
        {feedback && (
          <div className={`mt-4 rounded-2xl p-4 ${feedback.correct ? 'bg-success-100' : 'bg-error-100'}`}>
            <div className="flex items-center justify-center gap-2">
              {feedback.correct ? (
                <Check className="h-6 w-6 text-success-700" />
              ) : (
                <X className="h-6 w-6 text-error-700" />
              )}
              <span className={`text-lg font-bold ${feedback.correct ? 'text-success-700' : 'text-error-700'}`}>
                {feedback.correct ? 'Correct!' : `${currentQuestion.a} × ${currentQuestion.b} = ${feedback.correctAnswer}`}
              </span>
            </div>
          </div>
        )}

        {/* Input */}
        {!feedback && (
          <div className="mt-6">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mx-auto block w-32 rounded-xl border-2 border-line-soft bg-white px-4 py-3 text-center text-2xl font-bold text-emerald-deep focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              autoFocus
              placeholder="?"
            />
            <Button className="mt-4" onClick={handleSubmit} disabled={!answer.trim()}>
              Check
            </Button>
          </div>
        )}

        {/* Practice mode hints */}
        {isPractice && !feedback && (
          <div className="mt-4">
            {!showHint ? (
              <button onClick={() => setShowHint(true)} className="text-sm text-emerald hover:text-teal-800 underline">
                Show a hint
              </button>
            ) : (
              <div className="space-y-3">
                <ArrayModel a={currentQuestion.a} b={currentQuestion.b} />
                <SkipCountLadder factor={currentQuestion.a} count={currentQuestion.b} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
