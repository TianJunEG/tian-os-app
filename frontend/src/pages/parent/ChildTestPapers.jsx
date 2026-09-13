import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { parentsAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
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

// One sitting: header always shown; the full per-question review (which can carry
// working-canvas images) is fetched lazily the first time the parent expands it.
function SittingRow({ studentId, sitting }) {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(null);
  const [err, setErr] = useState(false);
  const s = sitting.summary || {};

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !review && !err) {
      parentsAPI.testPaperSitting(studentId, sitting.sessionId)
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
          {err ? <p className="px-1 py-2 text-sm text-rose-600">Couldn’t load this paper.</p>
            : !review ? <p className="px-1 py-2 text-sm text-slate-400">Loading…</p>
              : <SittingReview questions={review.questions || []} />}
        </div>
      )}
    </Card>
  );
}

// Parent view: their child's completed test-paper sittings, each expandable into
// the same per-question review the child saw at submission (answers, working,
// worked solutions). Read-only — reuses the shared SittingReview component.
export default function ChildTestPapers() {
  const { studentId } = useParams();
  const child = useChild(studentId);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false); setData(null);
    parentsAPI.testPapers(studentId).then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [studentId]);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {loadError ? <ErrorState message="Couldn't load test papers." onRetry={load} />
        : !data ? <Spinner />
          : (!data.sittings || data.sittings.length === 0)
            ? <EmptyState message="No completed test papers yet." />
            : (
              <div className="space-y-2">
                {data.sittings.map((s) => <SittingRow key={s.sessionId} studentId={studentId} sitting={s} />)}
              </div>
            )}
    </>
  );
}
