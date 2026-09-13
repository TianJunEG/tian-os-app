import React, { useMemo } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Check, X, RotateCcw } from 'lucide-react';
import { Card, Button, ProgressBar } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';
import { useAuth } from '../../../context/AuthContext';
import { summarize } from '../../../../../shared/englishpath/vocabulary/index.js';
import { loadVocabState } from './vocabStore';

// Session summary: score, what was practised, and updated exam-section readiness.
export default function VocabResults() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;

  const summary = useMemo(() => summarize(loadVocabState(studentId)), [studentId]);

  if (!state || !Array.isArray(state.log)) {
    return <Navigate to="/student/english/vocab" replace />;
  }

  const { correct = 0, total = 0, log = [] } = state;
  const pct = total ? Math.round((correct / total) * 100) : 100;
  const message =
    pct >= 80 ? 'Brilliant work — those words are sticking!' : pct >= 50 ? 'Good effort! Repetition is how words stick.' : "Tricky set — we'll bring these back soon.";

  return (
    <div className="mx-auto max-w-xl">
      <MascotBubble name="lysa" message={message} size="sm" className="mb-5" />

      <Card className="mb-6 p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Session score</p>
        <p className="my-2 font-display text-4xl font-semibold text-emerald-deep">
          {correct}<span className="text-2xl text-ink-400"> / {total}</span>
        </p>
        <p className="text-sm text-ink-500">{pct}% correct</p>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">Exam-section readiness</h3>
        {[
          { key: 'vocab_mcq', label: 'Vocabulary MCQ' },
          { key: 'vocab_cloze', label: 'Vocabulary Cloze' },
        ].map((row) => (
          <div key={row.key} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-700">{row.label}</span>
              <span className="font-mono text-sm tabular-nums text-ink-500">{summary.examReadiness[row.key] || 0}%</span>
            </div>
            <ProgressBar value={summary.examReadiness[row.key] || 0} max={100} />
          </div>
        ))}
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">This session</h3>
        <ul className="space-y-2">
          {log.map((entry, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-medium text-ink-700">{entry.word}</span>
                <span className="text-ink-400"> · {entry.label}</span>
              </span>
              {entry.kind === 'teach' ? (
                <span className="flex-none text-xs font-medium text-gold-deep">learned</span>
              ) : entry.correct ? (
                <Check className="h-4 w-4 flex-none text-emerald" />
              ) : (
                <X className="h-4 w-4 flex-none text-error-600" />
              )}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="l" icon={ArrowRight} className="flex-1" onClick={() => navigate('/student/english/vocab/practice', { replace: true })}>
          Practise again
        </Button>
        <Button size="l" variant="secondary" className="flex-1" onClick={() => navigate('/student/english/vocab')}>
          Back to Vocabulary
        </Button>
      </div>
    </div>
  );
}
