import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Spinner, ErrorState, EmptyState } from '../../components/ui';

// Per-mistake learning-ladder labels (matches services/mathpath/mistakeCorrectionFlow.js).
const STATUS_META = {
  new: { label: 'Not started', cls: 'bg-slate-100 text-slate-600' },
  acknowledged: { label: 'In progress', cls: 'bg-amber-100 text-amber-700' },
  correction_attempted: { label: 'Tried — marked wrong', cls: 'bg-rose-100 text-rose-700' },
  corrected: { label: 'Corrected', cls: 'bg-emerald-100 text-emerald-700' },
  understood: { label: 'Understood', cls: 'bg-emerald-100 text-emerald-700' },
  mastered: { label: 'Mastered', cls: 'bg-emerald-100 text-emerald-700' },
};

function Pill({ n, label, cls }) {
  if (!n) return null;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{n} {label}</span>;
}

function StudentDetail({ classId, studentId }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    teacherAPI.studentCorrections(classId, studentId)
      .then((r) => { if (alive) setRows(r.data.mistakes || []); })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, [classId, studentId]);

  if (err) return <p className="px-3 py-2 text-sm text-rose-600">Couldn’t load this student’s corrections.</p>;
  if (!rows) return <p className="px-3 py-2 text-sm text-slate-400">Loading…</p>;
  const outstanding = rows.filter((m) => !m.correctionDone);
  if (outstanding.length === 0) return <p className="px-3 py-2 text-sm text-emerald-600">All corrections done. 🎉</p>;

  return (
    <div className="space-y-2 px-1 pb-1">
      {outstanding.map((m) => {
        const meta = STATUS_META[m.learningStatus] || STATUS_META.new;
        return (
          <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">{m.skillName}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
            </div>
            {m.questionStem && <p className="text-sm text-slate-600">{m.questionStem}</p>}
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-0.5 text-xs">
              <span className="text-rose-600">Wrote: <span className="font-semibold">{m.studentAnswer || '—'}</span></span>
              <span className="text-slate-600">Correct: <span className="font-semibold text-slate-900">{m.correctAnswer || '—'}</span></span>
              {m.learningStatus === 'correction_attempted' && m.correctionAttempt && (
                <span className="text-rose-600">Correction tried: <span className="font-semibold">{m.correctionAttempt}</span> (wrong)</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ClassCorrections() {
  const { id } = useParams();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoadError(false); setData(null);
    teacherAPI.classCorrections(id).then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]);

  if (loadError) return <ErrorState message="Couldn't load corrections." onRetry={load} />;
  if (!data) return <Spinner />;

  const { summary, students } = data;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      {/* Summary: who still has corrections to do, and how many were marked wrong. */}
      <Card className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-1 p-4">
        <div>
          <p className="text-2xl font-bold text-slate-900">{summary.studentsWithOutstanding}<span className="text-base font-normal text-slate-400">/{summary.totalStudents}</span></p>
          <p className="text-xs text-slate-500">students have corrections to do</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-600">{summary.totalOutstanding}</p>
          <p className="text-xs text-slate-500">corrections outstanding</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-rose-600">{summary.totalFailed}</p>
          <p className="text-xs text-slate-500">tried but marked wrong</p>
        </div>
      </Card>

      {students.length === 0 ? <EmptyState message="No students in this class yet." /> : (
        <div className="space-y-2">
          {students.map((s) => {
            const allDone = s.total > 0 && s.outstanding === 0;
            const noMistakes = s.total === 0;
            const isOpen = expanded === s.studentId;
            return (
              <Card key={s.studentId} className="p-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : s.studentId)}
                  disabled={s.outstanding === 0}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left disabled:cursor-default"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {s.outstanding > 0
                      ? (isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)
                      : <CheckCircle2 size={16} className="text-emerald-500" />}
                    <div className="min-w-0">
                      <p className="font-medium text-ink-700">{s.name}</p>
                      <p className="text-xs text-ink-500">{s.level}{noMistakes ? '' : ` · ${s.done}/${s.total} corrected`}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {noMistakes && <span className="text-xs text-slate-400">No mistakes</span>}
                    {allDone && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={13} /> All done</span>}
                    <Pill n={s.notStarted} label="not started" cls="bg-slate-100 text-slate-600" />
                    <Pill n={s.inProgress} label="in progress" cls="bg-amber-100 text-amber-700" />
                    {s.failed > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        <AlertTriangle size={12} /> {s.failed} wrong
                      </span>
                    )}
                  </div>
                </button>
                {isOpen && <div className="border-t border-slate-100 bg-slate-50/60 p-2"><StudentDetail classId={id} studentId={s.studentId} /></div>}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
