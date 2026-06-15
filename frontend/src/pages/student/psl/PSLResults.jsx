import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Award, ChevronDown, ChevronRight, Clock, Target } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Card, Spinner } from '../../../components/ui';
import BarModelViewer from './components/BarModelViewer';
import { getMisconception } from './utils/misconceptions';

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
          {problem?.barModelSpec && (
            <BarModelViewer
              modelType={problem.barModelSpec.modelType}
              unknownPosition={problem.barModelSpec.unknownPosition}
              values={problem.barModelSpec.values}
            />
          )}
          <div className="space-y-1.5">
            {(attempt.steps || []).map((step) => {
              const m = step.misconceptionTag ? getMisconception(step.misconceptionTag) : null;
              return (
                <div key={step.stepId} className="rounded-lg bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm capitalize text-ink-600">{step.stepId.replace('_', ' ')}</span>
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
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="text-xs font-semibold text-sky-700 mb-1">Worked Solution</p>
              <p className="text-sm text-sky-800 whitespace-pre-line">{problem.solutionText}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function PSLResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pslAPI.getSession(sessionId)
      .then((res) => setData(res.data))
      .catch(() => navigate('/student/psl'))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (!data) return null;

  const summary = data.summary || {};
  const scorePercent = Math.round((summary.overallScore || 0) * 100);
  const problems = data.problems || [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 sm:p-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-100">
          <Award className="h-8 w-8 text-gold-500" />
        </div>
        <h1 className="mt-3 text-xl font-bold text-ink-800">Session Complete!</h1>
        <p className="text-sm text-ink-500">{data.skillId}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Target className="mx-auto h-5 w-5 text-gold-500" />
          <p className="mt-1 font-mono text-2xl font-bold text-ink-800">{scorePercent}%</p>
          <p className="text-xs text-ink-400">Score</p>
        </Card>
        <Card className="p-4 text-center">
          <Award className="mx-auto h-5 w-5 text-emerald-500" />
          <p className="mt-1 font-mono text-2xl font-bold text-ink-800">{summary.fullMarks || 0}/{summary.totalProblems || 0}</p>
          <p className="text-xs text-ink-400">Full marks</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="mx-auto h-5 w-5 text-sky-500" />
          <p className="mt-1 font-mono text-2xl font-bold text-ink-800">
            {summary.averageTimeMs ? `${Math.round(summary.averageTimeMs / 1000)}s` : '-'}
          </p>
          <p className="text-xs text-ink-400">Avg time</p>
        </Card>
      </div>

      {Object.keys(summary.misconceptionCounts || {}).length > 0 && (
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink-600">Areas to work on</h3>
          <div className="space-y-1">
            {Object.entries(summary.misconceptionCounts).map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between text-sm">
                <span className="text-ink-600">{tag.replace('psl/', '').replace(/-/g, ' ')}</span>
                <span className="font-mono text-xs text-ink-400">{count}x</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-500">Problems</h2>
        <div className="space-y-2">
          {problems.map((problem, i) => (
            <ProblemCard
              key={problem.problemId}
              problem={problem}
              attempt={{
                overallCorrect: problem.status === 'completed',
                overallScore: summary.overallScore || 0,
                steps: problem.scaffoldSteps || [],
              }}
              index={i}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/student/psl')}
          className="flex-1 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50"
        >
          Back to Skills
        </button>
        <button
          onClick={() => navigate('/student/psl/mistakes')}
          className="flex-1 rounded-xl bg-gold-400 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-500"
        >
          Review Mistakes
        </button>
      </div>
    </div>
  );
}
