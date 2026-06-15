import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Award, ChevronDown, ChevronRight, Clock, Target } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { resolveStudentVisualMode, isLowerPrimary } from '../../../design-os/studentVisualMode';
import { Card, Spinner } from '../../../components/ui';
import { getMisconception } from './utils/misconceptions';
import WorkedSolutionWalkthrough from './components/WorkedSolutionWalkthrough';
import { confettiBurst } from '../../../utils/confetti';
import { playWin } from '../../../utils/sound';

const STEP_FRIENDLY_LABELS = {
  understand: 'Understand',
  identify_info: 'Find clues',
  identify_question: 'Find goal',
  plan: 'Plan',
  solve: 'Solve',
  check: 'Check',
};

function StepBadge({ step }) {
  if (step.correct) return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Correct</span>;
  if (step.partial) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Partial</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Wrong</span>;
}

function ProblemCard({ attempt, problem, index }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
          attempt.overallCorrect ? 'bg-emerald-400' : 'bg-red-400'
        }`}>
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-700">{problem?.storyText?.slice(0, 80)}...</p>
          <p className="text-xs text-ink-400">Score: {Math.round(attempt.overallScore * 100)}%</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-ink-300" /> : <ChevronRight className="h-4 w-4 text-ink-300" />}
      </button>
      {open && (
        <div className="border-t border-ink-100 bg-ink-50/30 p-4 space-y-3">
          <p className="text-sm text-ink-600">{problem?.storyText}</p>

          <div className="space-y-1.5">
            {(attempt.steps || []).map((step) => {
              const m = step.misconceptionTag ? getMisconception(step.misconceptionTag) : null;
              return (
                <div key={step.stepId} className="rounded-lg bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-600">{STEP_FRIENDLY_LABELS[step.stepId] || step.stepId.replace('_', ' ')}</span>
                    <StepBadge step={step} />
                  </div>
                  {m && !step.correct && (
                    <p className="mt-1 text-xs text-amber-600">{m.tip}</p>
                  )}
                </div>
              );
            })}
          </div>
          {problem?.solutionText && (
            <WorkedSolutionWalkthrough solutionText={problem.solutionText} visualSpec={problem.visualSpec} heuristic={problem.heuristic} structure={problem.structure} unknownPosition={problem.unknownPosition} />
          )}
        </div>
      )}
    </Card>
  );
}

export default function PSLResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const playful = isLowerPrimary(resolveStudentVisualMode(user || {}));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (!data) return null;

  const summary = data.summary || {};
  const scorePercent = Math.round((summary.overallScore || 0) * 100);
  const problems = data.problems || [];

  return (
    <div className={`results-dark min-h-screen pb-10${playful ? ' skin-lower-primary' : ''}`}>
      <div className="mx-auto max-w-[680px] px-6 pt-12 sm:px-10">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full" style={{ background: '#1f8a5b', boxShadow: '0 0 0 6px rgba(31,138,91,0.25)' }}>
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h1 className="mt-5 text-[28px] font-bold" style={{ color: '#f4f0e8' }}>Session Complete!</h1>
          <p className="mt-1 text-sm" style={{ color: '#8a98b2' }}>{data.skillName || data.skillId}</p>
        </div>

        {/* Stat tiles */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="results-dark-card text-center">
            <Target className="mx-auto h-5 w-5" style={{ color: '#d9892e' }} />
            <p className="mt-2 font-mono text-[28px] font-bold" style={{ color: '#f4f0e8' }}>{scorePercent}%</p>
            <p className="mono-label mt-1" style={{ color: '#8a98b2', fontSize: '10.5px' }}>SCORE</p>
          </div>
          <div className="results-dark-card text-center">
            <Award className="mx-auto h-5 w-5" style={{ color: '#1f8a5b' }} />
            <p className="mt-2 font-mono text-[28px] font-bold" style={{ color: '#f4f0e8' }}>{summary.fullMarks || 0}/{summary.totalProblems || 0}</p>
            <p className="mono-label mt-1" style={{ color: '#8a98b2', fontSize: '10.5px' }}>FULL MARKS</p>
          </div>
          <div className="results-dark-card text-center">
            <Clock className="mx-auto h-5 w-5" style={{ color: '#2f80d8' }} />
            <p className="mt-2 font-mono text-[28px] font-bold" style={{ color: '#f4f0e8' }}>
              {summary.averageTimeMs ? `${Math.round(summary.averageTimeMs / 1000)}s` : '-'}
            </p>
            <p className="mono-label mt-1" style={{ color: '#8a98b2', fontSize: '10.5px' }}>AVG TIME</p>
          </div>
        </div>

        {/* Misconceptions */}
        {Object.keys(summary.misconceptionCounts || {}).length > 0 && (
          <div className="results-dark-card mt-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#d9892e' }}>Areas to work on</h3>
            <div className="space-y-2">
              {Object.entries(summary.misconceptionCounts).map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#c9cdd6' }}>{tag.replace('psl/', '').replace(/-/g, ' ')}</span>
                  <span className="mono-label" style={{ color: '#8a98b2' }}>{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Problem cards */}
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a98b2' }}>Problems</h2>
          <div className="space-y-2">
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

        {/* CTAs */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/student/psl')}
            className="min-h-[48px] rounded-[12px] border px-4 py-3 text-[15px] font-semibold transition-colors"
            style={{ borderColor: '#2a3a59', background: 'transparent', color: '#8a98b2' }}
          >
            Back to Skills
          </button>
          <button
            onClick={() => navigate('/student/psl/mistakes')}
            className="btn-gold min-h-[48px]"
          >
            Review Mistakes
          </button>
        </div>
      </div>
    </div>
  );
}
