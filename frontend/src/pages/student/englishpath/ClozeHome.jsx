import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Sparkles, RotateCcw } from 'lucide-react';
import { Card, Button, PageHeader, ProgressBar, StatTile, Badge } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';
import { useAuth } from '../../../context/AuthContext';
import { clozePassages, SKILL_LABELS, summarizeCloze } from '../../../../../shared/englishpath/cloze/index.js';
import { loadClozeState, resetClozeState } from './clozeStore';

// ELPath · Comprehension Cloze — home. Shows per-skill readiness, progress, and
// starts an adaptive passage (unseen → due for review → extra practice). Runs on
// the client engine (shared/englishpath/cloze) with progress in localStorage.
export default function ClozeHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;
  const [nonce, setNonce] = useState(0);

  const state = useMemo(() => loadClozeState(studentId), [studentId, nonce]);
  const summary = useMemo(() => summarizeCloze(state, { passages: clozePassages }), [state]);
  const { counts, readiness } = summary;
  const started = counts.done > 0;

  const readinessRows = ['grammar', 'collocation', 'content'].map((key) => ({
    key,
    label: SKILL_LABELS[key],
    value: readiness.bySkill[key] || 0,
  }));

  const reset = () => {
    if (window.confirm('Reset your comprehension-cloze progress? This cannot be undone.')) {
      resetClozeState(studentId);
      setNonce((n) => n + 1);
    }
  };

  return (
    <>
      <PageHeader title="Comprehension Cloze" subtitle="English · Comprehension" />
      <MascotBubble
        name="lysa"
        message={
          started
            ? `Welcome back! ${counts.dueNow ? `${counts.dueNow} passage${counts.dueNow > 1 ? 's' : ''} ready to practise.` : 'Every passage is fresh in your mind — nice work.'}`
            : 'Fill each blank with a word that fits. Many blanks accept more than one answer — the marker knows.'
        }
        size="sm"
        className="mb-5"
      />

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep">
              <Sparkles className="h-3.5 w-3.5" /> {started ? "Today's passage" : 'Get started'}
            </div>
            <h2 className="font-display text-xl font-semibold text-emerald-deep">
              {started && counts.dueNow ? 'A passage due for review' : 'An open-cloze passage'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {started
                ? `${counts.done} of ${counts.total} passages practised · ${counts.mastered} mastered`
                : `${clozePassages.length} original passages · 15 blanks each, graded by skill.`}
            </p>
          </div>
          <Button size="l" icon={ArrowRight} className="shrink-0" onClick={() => navigate('/student/english/cloze/practice')}>
            {started ? 'Continue practice' : 'Start practice'}
          </Button>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile label="Passages done" value={counts.done} suffix={`/ ${counts.total}`} />
        <StatTile label="Mastered" value={counts.mastered} />
        <StatTile label="Due to review" value={counts.dueNow} />
      </div>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">Skill readiness</h3>
        <div className="space-y-4">
          {readinessRows.map((row) => (
            <div key={row.key}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink-700">{row.label}</span>
                <span className="font-mono text-sm tabular-nums text-ink-500">{row.value}%</span>
              </div>
              <ProgressBar value={row.value} max={100} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> Score well and a passage returns on a spaced schedule</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 1 → 2 → 4 → 9 → 21 days</span>
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 font-semibold text-ink-700">Passages</h3>
        <ul className="divide-y divide-line-soft">
          {clozePassages.map((p) => {
            const rec = state.passages[p.id];
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate font-medium text-ink-700">{p.title}</span>
                {rec ? (
                  rec.box >= 5 ? (
                    <Badge tone="success">Mastered</Badge>
                  ) : (
                    <span className="flex-none font-mono text-xs tabular-nums text-ink-400">best {rec.bestScore}/15</span>
                  )
                ) : (
                  <span className="flex-none text-xs text-ink-400">Not started</span>
                )}
              </li>
            );
          })}
        </ul>
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
