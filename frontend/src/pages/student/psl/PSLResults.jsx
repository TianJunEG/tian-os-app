import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Award, CheckCircle, ChevronDown, ChevronRight, Clock,
  RotateCcw, ArrowLeft, Target, XCircle, AlertTriangle,
} from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { getMisconception } from './utils/misconceptions';
import WorkedSolutionWalkthrough from './components/WorkedSolutionWalkthrough';
import { confettiBurst } from '../../../utils/confetti';
import { playWin } from '../../../utils/sound';
import { MascotBubble } from '../../../components/MascotAvatar';
import { getMascotForModule } from '../../../config/mascots';
import { Card, Button, Badge, StatTile, Spinner } from '../../../components/ui';

/* ─── Step labels ─────────────────────────────────────────────── */
const STEP_FRIENDLY_LABELS = {
  understand: 'Understand',
  identify_info: 'Find clues',
  identify_question: 'Find question',
  plan: 'Plan',
  solve: 'Solve',
  check: 'Check',
};

/* ─── Step outcome badge (shared Badge tones) ─────────────────── */
function StepBadge({ step }) {
  if (step.correct) return <Badge tone="success"><CheckCircle className="h-3 w-3" /> Correct</Badge>;
  if (step.partial) return <Badge tone="gold"><AlertTriangle className="h-3 w-3" /> Partial</Badge>;
  return <Badge tone="rose"><XCircle className="h-3 w-3" /> Wrong</Badge>;
}

/* ─── Score ring (SVG) — light background ─────────────────────── */
function ScoreRing({ percent }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? '#1f9d57' : percent >= 50 ? '#d9892e' : '#d8694f';

  return (
    <div className="relative mx-auto" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e6e8ec" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold text-ink">{percent}%</span>
        <span className="text-xs font-medium text-body-muted">Score</span>
      </div>
    </div>
  );
}

/* ─── Problem card ────────────────────────────────────────────── */
function ProblemCard({ attempt, problem, index }) {
  const [open, setOpen] = useState(false);
  const correct = attempt.overallCorrect;
  const scorePercent = Math.round((attempt.overallScore || 0) * 100);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-line-soft"
        onClick={() => setOpen(!open)}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${correct ? 'bg-emerald' : 'bg-danger'}`}>
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{problem?.storyText?.slice(0, 80)}...</p>
          <p className="mt-0.5 text-xs text-body-muted">Score: {scorePercent}%</p>
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 shrink-0 text-body-faint" />
          : <ChevronRight className="h-4 w-4 shrink-0 text-body-faint" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-line bg-surface-raised px-5 py-4">
          <p className="text-sm leading-relaxed text-body">{problem?.storyText}</p>

          <div className="space-y-1.5">
            {(attempt.steps || []).map((step) => {
              const m = step.misconceptionTag ? getMisconception(step.misconceptionTag) : null;
              return (
                <div key={step.stepId} className="rounded-btn border border-line bg-surface-white px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">
                      {STEP_FRIENDLY_LABELS[step.stepId] || step.stepId.replace('_', ' ')}
                    </span>
                    <StepBadge step={step} />
                  </div>
                  {m && !step.correct && (
                    <p className="mt-2 rounded-btn bg-gold-tint px-3 py-2 text-xs font-medium text-gold-deep">{m.tip}</p>
                  )}
                </div>
              );
            })}
          </div>

          {problem?.solutionText && (
            <WorkedSolutionWalkthrough
              solutionText={problem.solutionText}
              visualSpec={problem.visualSpec}
              heuristic={problem.heuristic}
              structure={problem.structure}
              unknownPosition={problem.unknownPosition}
            />
          )}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main — PSLResults
   ═══════════════════════════════════════════════════════════════════ */
export default function PSLResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const celebratedRef = React.useRef(false);
  const load = React.useCallback(() => {
    setLoading(true); setLoadError(false);
    let settled = false;
    // Never strand the student on "Loading…" if the request hangs (e.g. it lands
    // mid-deploy-restart and stays pending). Fail over to a retry after 20s.
    const timer = setTimeout(() => {
      if (!settled) { settled = true; setLoadError(true); setLoading(false); }
    }, 20000);
    pslAPI.getSession(sessionId)
      .then((res) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        setData(res.data);
        setLoading(false);
        if (!celebratedRef.current) {
          celebratedRef.current = true;
          const score = res.data?.summary?.overallScore || 0;
          setTimeout(() => {
            confettiBurst({ count: score >= 0.8 ? 160 : 90, duration: score >= 0.8 ? 2200 : 1400 });
            playWin();
          }, 300);
        }
      })
      .catch(() => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        setLoadError(true); setLoading(false);
      });
  }, [sessionId]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner label="Loading results…" />;

  if (loadError) {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-shell bg-danger-tint text-lg font-bold text-danger">!</span>
        <p className="text-base font-semibold text-ink">We couldn&apos;t load your results just now.</p>
        <p className="text-sm text-body-muted">Your work is saved — this is usually a brief connection hiccup.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button size="s" icon={RotateCcw} onClick={load}>Try again</Button>
          <Button size="s" variant="secondary" onClick={() => navigate('/student/psl')}>Back to Problems</Button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const summary = data.summary || {};
  const scorePercent = Math.round((summary.overallScore || 0) * 100);
  const problems = data.problems || [];
  const misconceptions = Object.entries(summary.misconceptionCounts || {});
  const mascot = getMascotForModule('psl');
  const scoreTone = scorePercent >= 80 ? 'emerald' : scorePercent >= 50 ? 'gold' : 'rose';
  const mascotMessage = scorePercent >= 80
    ? `${scorePercent}% — amazing problem solving!`
    : scorePercent >= 50
      ? `${scorePercent}% — good effort! Let's review the tricky parts.`
      : `${scorePercent}% this round. Every problem teaches you something!`;

  return (
    <>
      {/* Score hero — a light, tone-tinted Card (was a dark panel). */}
      <Card tone={scoreTone} className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div className="shrink-0"><ScoreRing percent={scorePercent} /></div>
          <div className="flex-1 text-center sm:text-left">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-body-muted">Session complete</p>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {scorePercent >= 80 ? 'Great work!' : scorePercent >= 50 ? 'Good effort!' : 'Keep going!'}
            </h1>
            <p className="mt-1 text-sm font-medium text-body-muted">{data.skillName || data.skillId}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 sm:justify-start">
              <StatTile label={<><Award className="h-3.5 w-3.5" /> Full marks</>} value={`${summary.fullMarks || 0}/${summary.totalProblems || 0}`} />
              <StatTile label={<><Clock className="h-3.5 w-3.5" /> Avg time</>} value={summary.averageTimeMs ? Math.round(summary.averageTimeMs / 1000) : '—'} suffix={summary.averageTimeMs ? 's' : ''} />
              <StatTile label={<><Target className="h-3.5 w-3.5" /> Problems</>} value={problems.length} />
            </div>
          </div>
        </div>
      </Card>

      {mascot && (
        <MascotBubble name={mascot.key} message={mascotMessage} size="sm" className="mt-6" voiced />
      )}

      {misconceptions.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">Areas to work on</h2>
          <Card className="space-y-2 p-4">
            {misconceptions.map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium capitalize text-ink">{tag.replace('psl/', '').replace(/-/g, ' ')}</span>
                <span className="text-xs font-bold text-gold-deep">{count}x</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-body-muted">Problem breakdown</h2>
        <div className="space-y-3">
          {problems.map((problem, i) => {
            const attempt = data.attempts?.[problem.problemId];
            return (
              <ProblemCard
                key={problem.problemId}
                problem={problem}
                attempt={attempt || { overallCorrect: problem.status === 'completed', overallScore: 0, steps: [] }}
                index={i}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/student/psl')} className="w-full sm:w-auto">
          Back to Skills
        </Button>
        <Button
          icon={RotateCcw}
          disabled={restarting}
          onClick={async () => {
            if (restarting) return;
            setRestarting(true);
            try {
              const res = await pslAPI.startSession({ skillId: data.skillId, problemCount: 5 });
              navigate(`/student/psl/session/${res.data.sessionId}`);
            } catch { setRestarting(false); }
          }}
          className="w-full sm:w-auto"
        >
          {restarting ? 'Starting…' : 'Practice Again'}
        </Button>
      </div>
    </>
  );
}
