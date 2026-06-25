import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Badge, ProgressBar, Spinner, ErrorState } from '../../components/ui';

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-xs text-ink-400">-</span>;
  const tone = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
  return <Badge tone={tone}>{score}%</Badge>;
}

export default function AssessmentResults() {
  const { id, assessmentId } = useParams();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    teacherAPI.assessmentResults(assessmentId)
      .then((r) => setData(r.data))
      .catch((e) => { console.warn("AssessmentResults: fetch failed", e); setLoadError(true); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (loadError || !data) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <ErrorState message="Couldn't load assessment results." onRetry={load} />
      </div>
    );
  }

  const { assessment, summary, perStudent, perQuestion } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <ClassNav classId={id} name={meta?.name} level={meta?.level} />

      {/* Summary */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-emerald-deep">{assessment.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-500">
          <span>{assessment.module}</span>
          <span>·</span>
          <span>{assessment.questionCount} questions</span>
          {assessment.timeLimitMinutes && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{assessment.timeLimitMinutes}m</span>
            </>
          )}
          <Badge tone={assessment.status === 'assigned' ? 'success' : 'neutral'}>{assessment.status}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-ink-400">Completed</p>
            <p className="text-xl font-bold text-ink-700">
              <span className="inline-flex items-center gap-1"><Users className="h-4 w-4 text-ink-400" />{summary.totalCompleted}/{summary.totalAssigned}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Completion</p>
            <p className="text-xl font-bold text-ink-700">{summary.completionRate}%</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Average Score</p>
            <p className="text-xl font-bold text-ink-700">{summary.averageScore ?? '-'}%</p>
          </div>
        </div>
        {summary.averageScore != null && (
          <ProgressBar value={summary.averageScore} max={100}
            barClassName={summary.averageScore >= 80 ? 'bg-emerald' : summary.averageScore >= 50 ? 'bg-gold' : 'bg-danger'} className="mt-3" />
        )}
      </Card>

      {/* Per-Student */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-emerald-deep">Student Scores</h3>
        <div className="divide-y divide-ink-100">
          {perStudent.map((s) => (
            <div key={s.studentId}>
              <button type="button" className="flex w-full items-center gap-3 py-3 text-left"
                onClick={() => setExpanded(expanded === s.studentId ? null : s.studentId)}>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-ink-700">{s.name}</p>
                </div>
                <Badge tone={s.status === 'submitted' ? 'neutral' : 'warning'} className="text-xs">
                  {s.status === 'submitted' ? `${s.correctCount}/${s.totalCount}` : s.status.replace('_', ' ')}
                </Badge>
                <ScoreBadge score={s.score} />
                {s.timeSpentMs && (
                  <span className="text-xs text-ink-400">{Math.round(s.timeSpentMs / 1000)}s</span>
                )}
              </button>
              {expanded === s.studentId && s.wrongQuestions?.length > 0 && (
                <div className="mb-3 ml-4 space-y-1 rounded-lg bg-danger-tint/50 p-3">
                  <p className="text-xs font-semibold text-danger-deep">Wrong answers:</p>
                  {s.wrongQuestions.map((wq) => (
                    <div key={wq.questionId} className="text-xs text-ink-600">
                      <span className="text-ink-500">{wq.display?.slice(0, 80)}</span>
                      <span className="ml-2 text-danger">Got: {String(wq.studentAnswer)}</span>
                      <span className="ml-2 text-emerald">Correct: {String(wq.correctAnswer)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Per-Question */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-emerald-deep">Question Analysis</h3>
        <div className="space-y-3">
          {perQuestion.map((q) => (
            <div key={q.questionId} className="rounded-lg border border-ink-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-ink-700">
                  <span className="mr-1 font-semibold text-ink-400">Q{q.index + 1}.</span>
                  {q.display?.slice(0, 100)}
                </p>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  {q.correctPct != null && (
                    <span className={`text-sm font-semibold ${q.correctPct >= 80 ? 'text-emerald' : q.correctPct >= 50 ? 'text-gold-deep' : 'text-danger'}`}>
                      {q.correctPct}%
                    </span>
                  )}
                  {q.correctPct != null && q.correctPct >= 80 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald" />
                  ) : (
                    <XCircle className="h-4 w-4 text-danger" />
                  )}
                </div>
              </div>
              {q.correctPct != null && (
                <ProgressBar value={q.correctPct} max={100}
                  barClassName={q.correctPct >= 80 ? 'bg-emerald' : q.correctPct >= 50 ? 'bg-gold' : 'bg-danger'} className="mt-2" />
              )}
              {q.commonWrongAnswers?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.commonWrongAnswers.map((wa) => (
                    <span key={wa.answer} className="rounded bg-danger-tint px-2 py-0.5 text-xs text-danger-deep">
                      "{wa.answer}" ({wa.count}x)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
