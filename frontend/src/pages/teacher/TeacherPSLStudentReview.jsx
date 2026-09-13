import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, ChevronDown, ChevronRight, Clock, Target } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui';

function scoreTone(pct) {
  if (pct >= 70) return 'navy';
  if (pct >= 50) return 'gold';
  return 'error';
}

const STEP_LABELS = {
  understand: 'Understand',
  identify_info: 'Identify Info',
  identify_question: 'Identify Question',
  plan: 'Plan',
  solve: 'Solve',
  check: 'Check',
};

function SessionRow({ session, onExpand, expanded }) {
  const score = Math.round((session.overallScore || 0) * 100);
  const miscKeys = Object.keys(session.misconceptionCounts || {});
  return (
    <div className="border-b border-line-soft last:border-b-0">
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-emerald-tint/40"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronRight className="h-4 w-4 text-ink-400" />}
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink-800">{session.skillName}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {session.heuristic.replace(/-/g, ' ')} &middot; {session.level} &middot; {new Date(session.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={scoreTone(score)}>{score}%</Badge>
          <span className="text-xs text-ink-500">{session.fullMarks}/{session.totalProblems} full marks</span>
          {session.targetDifficulty > 1 && (
            <Badge tone="navy">Diff {session.targetDifficulty}</Badge>
          )}
        </div>
      </button>
      {expanded && miscKeys.length > 0 && (
        <div className="bg-ink-50/40 px-11 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Misconceptions</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {miscKeys.map((tag) => (
              <Badge key={tag} tone="error">{tag.replace(/^psl\//, '')} ({session.misconceptionCounts[tag]})</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepRow({ step }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${step.correct ? 'border-emerald-border bg-emerald-tint/40' : 'border-danger-border bg-danger-tint/40'}`}>
      <span className="w-28 font-medium text-ink-700">{STEP_LABELS[step.stepId] || step.stepId}</span>
      <span className={`font-semibold ${step.correct ? 'text-emerald-deep' : 'text-danger-deep'}`}>
        {step.correct ? 'Correct' : 'Incorrect'}
      </span>
      {step.misconceptionTag && <Badge tone="error">{step.misconceptionTag.replace(/^psl\//, '')}</Badge>}
      {step.hintUsed && <Badge tone="gold">Hint</Badge>}
      {step.retried && <Badge tone="navy">Retried</Badge>}
      {step.timeSpentMs > 0 && (
        <span className="ml-auto flex items-center gap-1 text-xs text-ink-500">
          <Clock className="h-3 w-3" /> {Math.round(step.timeSpentMs / 1000)}s
        </span>
      )}
    </div>
  );
}

function ProblemTranscript({ problem, index }) {
  return (
    <div className="rounded-xl border border-line-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-800">Problem {index + 1}</p>
        <div className="flex items-center gap-2">
          {problem.difficulty > 1 && <Badge tone="navy">Diff {problem.difficulty}</Badge>}
          {problem.overallCorrect != null && (
            <Badge tone={problem.overallCorrect ? 'success' : 'error'}>
              {problem.overallCorrect ? 'Full marks' : `${Math.round((problem.overallScore || 0) * 100)}%`}
            </Badge>
          )}
          {problem.totalTimeMs != null && (
            <span className="text-xs text-ink-500">{Math.round(problem.totalTimeMs / 1000)}s</span>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-600">{problem.storyText}</p>
      <p className="mt-1 text-xs text-ink-500">Answer: <strong>{problem.correctAnswer}</strong></p>
      {problem.steps.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {problem.steps.map((step) => <StepRow key={step.stepId} step={step} />)}
        </div>
      )}
    </div>
  );
}

export default function TeacherPSLStudentReview() {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await teacherAPI.studentPslSessions(studentId);
      setData(res?.data || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const toggleSession = useCallback(async (sessionId) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(sessionId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await teacherAPI.studentPslSession(studentId, sessionId);
      setDetail(res?.data || null);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [studentId, expandedId]);

  if (error) return <ErrorState message="Couldn't load student PSL sessions." onRetry={load} />;
  if (loading) return <Spinner label="Loading PSL sessions..." />;

  const student = data?.student;
  const sessions = data?.sessions || [];

  return (
    <>
      <button
        onClick={() => navigate(`/teacher/students/${studentId}`)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {student?.name || 'Student'}
      </button>

      <PageHeader
        title={`${student?.name || 'Student'} — Problem Solving Lab`}
        subtitle={`${sessions.length} completed session${sessions.length !== 1 ? 's' : ''}`}
      />

      {!sessions.length ? (
        <EmptyState message="This student hasn't completed any PSL sessions yet." />
      ) : (
        <div className="space-y-4">
          <Card className="divide-y divide-line-soft overflow-hidden">
            {sessions.map((s) => (
              <div key={s.sessionId}>
                <SessionRow
                  session={s}
                  expanded={expandedId === s.sessionId}
                  onExpand={() => toggleSession(s.sessionId)}
                />
                {expandedId === s.sessionId && (
                  <div className="bg-ink-50/30 px-4 pb-4 pt-2">
                    {detailLoading ? (
                      <Spinner size="sm" label="Loading transcript..." />
                    ) : detail ? (
                      <div className="space-y-3">
                        {detail.problems.map((p, i) => (
                          <ProblemTranscript key={p.problemId} problem={p} index={i} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-500">Could not load session details.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}
    </>
  );
}
