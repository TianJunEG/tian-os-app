import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Spinner, ErrorState, EmptyState } from '../../components/ui';

function scoreTone(pct) {
  if (pct == null) return 'text-slate-400';
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

// Teacher view of test-paper activity across the class. Papers are self-serve, so
// this is by-student: who has sat papers and how they scored. Click a student who
// has sittings to see each sitting and a full per-question review.
export default function ClassTestPapers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false); setData(null);
    teacherAPI.classTestPapers(id).then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]);

  if (loadError) return <ErrorState message="Couldn't load test-paper results." onRetry={load} />;
  if (!data) return <Spinner />;

  const { summary, students } = data;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      <Card className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-1 p-4">
        <div>
          <p className="text-2xl font-bold text-slate-900">{summary.studentsWithSittings}<span className="text-base font-normal text-slate-400">/{summary.totalStudents}</span></p>
          <p className="text-xs text-slate-500">students have sat a paper</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{summary.totalSittings}</p>
          <p className="text-xs text-slate-500">papers completed</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${scoreTone(summary.avgScorePct)}`}>{summary.avgScorePct == null ? '—' : `${summary.avgScorePct}%`}</p>
          <p className="text-xs text-slate-500">class average</p>
        </div>
      </Card>

      {students.length === 0 ? <EmptyState message="No students in this class yet." /> : (
        <div className="space-y-2">
          {students.map((s) => {
            const hasSittings = s.sittingCount > 0;
            return (
              <Card key={s.studentId} className="p-0">
                <button
                  type="button"
                  onClick={() => hasSittings && navigate(`/teacher/classes/${id}/test-papers/${s.studentId}`)}
                  disabled={!hasSittings}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left disabled:cursor-default"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {hasSittings
                      ? <ChevronRight size={16} className="text-slate-400" />
                      : <FileText size={16} className="text-slate-300" />}
                    <div className="min-w-0">
                      <p className="font-medium text-ink-700">{s.name}</p>
                      <p className="text-xs text-ink-500">
                        {s.level}
                        {hasSittings
                          ? ` · ${s.sittingCount} sitting${s.sittingCount === 1 ? '' : 's'} · latest ${fmtDate(s.latestAt)}`
                          : ' · no papers yet'}
                      </p>
                    </div>
                  </div>
                  {hasSittings && (
                    <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-0.5 text-right">
                      <div>
                        <p className={`text-sm font-bold ${scoreTone(s.latestScorePct)}`}>{s.latestScorePct == null ? '—' : `${s.latestScorePct}%`}</p>
                        <p className="text-[11px] text-slate-400">latest</p>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${scoreTone(s.bestScorePct)}`}>{s.bestScorePct == null ? '—' : `${s.bestScorePct}%`}</p>
                        <p className="text-[11px] text-slate-400">best</p>
                      </div>
                    </div>
                  )}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
