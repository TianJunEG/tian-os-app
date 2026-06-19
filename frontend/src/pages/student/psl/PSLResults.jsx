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
import { useAuth } from '../../../context/AuthContext';
import { resolveStudentVisualMode, getVisualModeStyles } from '../../../design-os/studentVisualMode';
import { MascotBubble } from '../../../components/MascotAvatar';
import { getMascotForModule } from '../../../config/mascots';

/* ─── Step labels ─────────────────────────────────────────────── */
const STEP_FRIENDLY_LABELS = {
  understand: 'Understand',
  identify_info: 'Find clues',
  identify_question: 'Find question',
  plan: 'Plan',
  solve: 'Solve',
  check: 'Check',
};

/* ─── Step outcome badge ──────────────────────────────────────── */
function StepBadge({ step }) {
  if (step.correct)
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{ color: '#1f9d57', background: '#f3faf6' }}>
        <CheckCircle className="h-3 w-3" /> Correct
      </span>
    );
  if (step.partial)
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{ color: '#d9892e', background: '#fbf1e1' }}>
        <AlertTriangle className="h-3 w-3" /> Partial
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: '#d8694f', background: '#fbece9' }}>
      <XCircle className="h-3 w-3" /> Wrong
    </span>
  );
}

/* ─── Score ring (SVG) ────────────────────────────────────────── */
function ScoreRing({ percent }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? '#1f9d57' : percent >= 50 ? '#d9892e' : '#d8694f';

  return (
    <div className="relative mx-auto" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e3258" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold" style={{ color: '#f4f0e8' }}>{percent}%</span>
        <span className="text-xs font-medium" style={{ color: '#8b9ab3' }}>Score</span>
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
    <div className="step-shell overflow-hidden" style={{ padding: 0 }}>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/40"
        onClick={() => setOpen(!open)}
      >
        {/* number circle */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: correct ? '#1f9d57' : '#d8694f' }}
        >
          {index + 1}
        </div>
        {/* text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: '#232c39' }}>
            {problem?.storyText?.slice(0, 80)}...
          </p>
          <p className="mt-0.5 text-xs" style={{ color: '#6b7585' }}>
            Score: {scorePercent}%
          </p>
        </div>
        {/* chevron */}
        {open
          ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: '#6b7585' }} />
          : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: '#6b7585' }} />}
      </button>

      {open && (
        <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: '#dde1e8', background: '#eef0f4' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#5a6675' }}>
            {problem?.storyText}
          </p>

          {/* step breakdown */}
          <div className="space-y-1.5">
            {(attempt.steps || []).map((step) => {
              const m = step.misconceptionTag ? getMisconception(step.misconceptionTag) : null;
              return (
                <div key={step.stepId} className="rounded-xl bg-white px-4 py-2.5" style={{ border: '1px solid #e4e7ec' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#232c39' }}>
                      {STEP_FRIENDLY_LABELS[step.stepId] || step.stepId.replace('_', ' ')}
                    </span>
                    <StepBadge step={step} />
                  </div>
                  {m && !step.correct && (
                    <div className="mistake-hint-box mt-2">
                      <p className="text-xs font-medium" style={{ color: '#b06f1f' }}>
                        {m.tip}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* worked solution */}
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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main — PSLResults
   ═══════════════════════════════════════════════════════════════════ */
export default function PSLResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  const celebratedRef = React.useRef(false);
  useEffect(() => {
    pslAPI.getSession(sessionId)
      .then((res) => {
        setData(res.data);
        if (!celebratedRef.current) {
          celebratedRef.current = true;
          const score = res.data?.summary?.overallScore || 0;
          setTimeout(() => {
            confettiBurst({ count: score >= 0.8 ? 160 : 90, duration: score >= 0.8 ? 2200 : 1400 });
            playWin();
          }, 300);
        }
      })
      .catch(() => navigate('/student/psl'))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-dot-grid min-h-screen">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#dde1e8] border-t-[#d9892e]" />
          <p className="text-sm font-medium" style={{ color: '#6b7585' }}>Loading results…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const summary = data.summary || {};
  const scorePercent = Math.round((summary.overallScore || 0) * 100);
  const problems = data.problems || [];
  const misconceptions = Object.entries(summary.misconceptionCounts || {});
  const mascot = getMascotForModule('psl');
  const mascotMessage = scorePercent >= 80
    ? `${scorePercent}% — amazing problem solving!`
    : scorePercent >= 50
      ? `${scorePercent}% — good effort! Let's review the tricky parts.`
      : `${scorePercent}% this round. Every problem teaches you something!`;

  return (
    <div className={`bg-dot-grid min-h-screen pb-8 ${visualStyles.page}`}>
      <div className="mx-auto max-w-[1180px] px-6 pt-6 sm:px-10">

        {/* ── Hero (dark panel) ──────────────────────────────── */}
        <div className="results-dark px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
            {/* score ring */}
            <div className="shrink-0">
              <ScoreRing percent={scorePercent} />
            </div>

            {/* text + stat cards */}
            <div className="flex-1 text-center sm:text-left">
              <p className="mono-label mb-1" style={{ color: '#8b9ab3' }}>Session Complete</p>
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: '#f4f0e8' }}>
                {scorePercent >= 80 ? 'Great work!' : scorePercent >= 50 ? 'Good effort!' : 'Keep going!'}
              </h1>
              <p className="mt-1 text-sm font-medium" style={{ color: '#8b9ab3' }}>
                {data.skillName || data.skillId}
              </p>

              {/* stat cards row */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="results-dark-card flex flex-col items-center gap-1 px-4 py-3 sm:items-start">
                  <Award className="h-4 w-4" style={{ color: '#d9892e' }} />
                  <span className="font-mono text-xl font-bold" style={{ color: '#f4f0e8' }}>
                    {summary.fullMarks || 0}/{summary.totalProblems || 0}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: '#8b9ab3' }}>Full marks</span>
                </div>
                <div className="results-dark-card flex flex-col items-center gap-1 px-4 py-3 sm:items-start">
                  <Clock className="h-4 w-4" style={{ color: '#2f80d8' }} />
                  <span className="font-mono text-xl font-bold" style={{ color: '#f4f0e8' }}>
                    {summary.averageTimeMs ? `${Math.round(summary.averageTimeMs / 1000)}s` : '—'}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: '#8b9ab3' }}>Avg time</span>
                </div>
                <div className="results-dark-card col-span-2 flex flex-col items-center gap-1 px-4 py-3 sm:col-span-1 sm:items-start">
                  <Target className="h-4 w-4" style={{ color: '#1f9d57' }} />
                  <span className="font-mono text-xl font-bold" style={{ color: '#f4f0e8' }}>
                    {problems.length}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: '#8b9ab3' }}>Problems</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mascot feedback ────────────────────────────────── */}
        {mascot && (
          <MascotBubble name={mascot.key} message={mascotMessage} size="sm" className="mt-6" voiced />
        )}

        {/* ── Misconceptions ─────────────────────────────────── */}
        {misconceptions.length > 0 && (
          <div className="mt-6">
            <h2 className="mono-label mb-3" style={{ color: '#5a6675' }}>Areas to work on</h2>
            <div className="mistake-hint-box space-y-2">
              {misconceptions.map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize" style={{ color: '#232c39' }}>
                    {tag.replace('psl/', '').replace(/-/g, ' ')}
                  </span>
                  <span className="mono-label" style={{ color: '#b06f1f' }}>{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Problems list ──────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="mono-label mb-3" style={{ color: '#5a6675' }}>Problem breakdown</h2>
          <div className="space-y-3">
            {problems.map((problem, i) => {
              const attempt = data.attempts?.[problem.problemId];
              return (
                <ProblemCard
                  key={problem.problemId}
                  problem={problem}
                  attempt={attempt || {
                    overallCorrect: problem.status === 'completed',
                    overallScore: 0,
                    steps: [],
                  }}
                  index={i}
                />
              );
            })}
          </div>
        </div>

        {/* ── CTAs ───────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate('/student/psl')}
            className="btn-gold-outline w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Skills
          </button>
          <button
            disabled={restarting}
            onClick={async () => {
              if (restarting) return;
              setRestarting(true);
              try {
                const res = await pslAPI.startSession({ skillId: data.skillId, problemCount: 5 });
                navigate(`/student/psl/session/${res.data.sessionId}`);
              } catch { setRestarting(false); }
            }}
            className="btn-gold w-full sm:w-auto disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            {restarting ? 'Starting…' : 'Practice Again'}
          </button>
        </div>

      </div>
    </div>
  );
}
