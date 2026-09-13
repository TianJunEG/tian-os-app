import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Spinner, ErrorState, EmptyState } from '../../components/ui';
import SittingReview from '../student/testpapers/SittingReview';

function scoreTone(pct) {
  if (pct == null) return 'text-slate-400';
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
}

// One sitting: header always shown; the full per-question review is fetched lazily
// the first time the teacher expands it (a sitting can carry working-image data).
function SittingRow({ classId, studentId, sitting }) {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(null);
  const [err, setErr] = useState(false);
  const s = sitting.summary || {};

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !review && !err) {
      teacherAPI.studentTestPaperSitting(classId, studentId, sitting.sessionId)
        .then((r) => setReview(r.data))
        .catch(() => setErr(true));
    }
  };

  return (
    <Card className="p-0">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="flex min-w-0 items-center gap-2">
          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-700">{sitting.paperTitle}</p>
            <p className="text-xs text-ink-500">
              {sitting.category === 'challenge' ? `Challenge${sitting.topic ? ` · ${sitting.topic}` : ''}` : 'Mock paper'}
              {' · '}{fmtDate(sitting.completedAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${scoreTone(s.scorePct)}`}>{s.scorePct ?? 0}%</p>
          <p className="text-[11px] text-slate-400">{s.marksAwarded ?? 0}/{s.totalMarks ?? 0} · {s.correctCount ?? 0}/{s.totalCount ?? 0} correct</p>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-3">
          {err ? <p className="px-1 py-2 text-sm text-rose-600">Couldn’t load this sitting.</p>
            : !review ? <p className="px-1 py-2 text-sm text-slate-400">Loading…</p>
              : <SittingReview questions={review.questions || []} />}
        </div>
      )}
    </Card>
  );
}

// Teacher drill-down: one student's completed test-paper sittings, each expandable
// into the same per-question review the student saw at submission.
export default function ClassTestPaperStudent() {
  const { id, studentId } = useParams();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false); setData(null);
    teacherAPI.studentTestPapers(id, studentId).then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id, studentId]);

  if (loadError) return <ErrorState message="Couldn't load this student's test papers." onRetry={load} />;
  if (!data) return <Spinner />;

  const { student, sittings } = data;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      <Link to={`/teacher/classes/${id}/test-papers`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> All students
      </Link>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{student?.name || 'Student'} <span className="text-sm font-normal text-slate-400">· test papers</span></h2>

      {(!sittings || sittings.length === 0) ? <EmptyState message="This student hasn't completed any test papers yet." /> : (
        <div className="space-y-2">
          {sittings.map((s) => <SittingRow key={s.sessionId} classId={id} studentId={studentId} sitting={s} />)}
        </div>
      )}
    </>
  );
}
