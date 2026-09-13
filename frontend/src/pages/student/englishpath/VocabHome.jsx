import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Sparkles, RotateCcw } from 'lucide-react';
import { Card, Button, PageHeader, ProgressBar, StatTile } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';
import { useAuth } from '../../../context/AuthContext';
import {
  summarize,
  vocabularyWordBank,
  TIERS,
} from '../../../../../shared/englishpath/vocabulary/index.js';
import { loadVocabState, resetVocabState } from './vocabStore';

// ELPath · Vocabulary Builder — home. Shows exam-section readiness and the
// learning ladder, and starts an adaptive practice session. Runs entirely on the
// client engine (shared/englishpath) with progress in localStorage.
export default function VocabHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;
  const [nonce, setNonce] = useState(0); // bump to recompute after a reset

  const summary = useMemo(() => summarize(loadVocabState(studentId)), [studentId, nonce]);
  const { counts, examReadiness } = summary;

  const readinessRows = [
    { key: 'vocab_mcq', label: 'Vocabulary MCQ', hint: 'Best word for the blank' },
    { key: 'vocab_cloze', label: 'Vocabulary Cloze', hint: 'Closest in meaning' },
  ];

  const started = counts.introduced > 0;

  const reset = () => {
    if (window.confirm('Reset your vocabulary progress? This cannot be undone.')) {
      resetVocabState(studentId);
      setNonce((n) => n + 1);
    }
  };

  return (
    <>
      <PageHeader title="Vocabulary Builder" subtitle="English · Vocabulary" />
      <MascotBubble
        name="lysa"
        message={
          started
            ? `Welcome back! ${counts.dueNow ? `${counts.dueNow} word${counts.dueNow > 1 ? 's' : ''} ready for review.` : "Let's learn some new words."}`
            : "These are the exact words the P6 paper loves to test. Let's learn them, step by step."
        }
        size="sm"
        className="mb-5"
      />

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep">
              <Sparkles className="h-3.5 w-3.5" /> {started ? "Today's practice" : 'Get started'}
            </div>
            <h2 className="font-display text-xl font-semibold text-emerald-deep">
              {counts.dueNow ? `${counts.dueNow} to review + new words` : 'A 10-question session'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {started
                ? `${counts.introduced} learned · ${counts.mastered} mastered · drawn from ${vocabularyWordBank.length} real exam words`
                : `${vocabularyWordBank.length} words mined from real P6 prelim papers.`}
            </p>
          </div>
          <Button size="l" icon={ArrowRight} className="shrink-0" onClick={() => navigate('/student/english/vocab/practice')}>
            {started ? 'Continue practice' : 'Start practice'}
          </Button>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile label="Words learned" value={counts.introduced} suffix={`/ ${counts.total}`} />
        <StatTile label="Mastered" value={counts.mastered} />
        <StatTile label="Due to review" value={counts.dueNow} />
      </div>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">Exam-section readiness</h3>
        <div className="space-y-4">
          {readinessRows.map((row) => (
            <div key={row.key}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink-700">{row.label}</span>
                <span className="font-mono text-sm tabular-nums text-ink-500">{examReadiness[row.key] || 0}%</span>
              </div>
              <ProgressBar value={examReadiness[row.key] || 0} max={100} />
              <p className="mt-1 text-xs text-ink-400">{row.hint}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-400">
          Readiness grows as you climb each word's ladder across the whole word bank — breadth is what aces these sections.
        </p>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">How each word is built up</h3>
        <ol className="space-y-2">
          {TIERS.map((t) => (
            <li key={t.tier} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-tint text-xs font-semibold text-emerald-deep">
                {t.tier}
              </span>
              <span>
                <span className="font-medium text-ink-700">{t.name}.</span>{' '}
                <span className="text-ink-500">{t.summary}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-4 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> Master a word, then it returns on a spaced schedule</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 1 → 2 → 4 → 9 → 21 days</span>
        </div>
      </Card>

      {started && (
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-error-600"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset my progress
        </button>
      )}
    </>
  );
}
