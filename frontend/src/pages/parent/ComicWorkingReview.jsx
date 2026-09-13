import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Check, X } from 'lucide-react';
import { comicsAPI } from '../../services/api';
import { Spinner } from '../../components/ui';

// The replay canvas is heavy (canvas + controls) — code-split it so the parent
// dashboard only pays for it when a working panel is actually opened.
const StrokeReplayPlayer = lazy(() => import('../../components/learning/StrokeReplayPlayer'));

// Renders a child's saved scratchpad working for one comic episode, problem by
// problem, for the parent/teacher review surface. Lazy-fetches on mount; shows
// the skill each problem practised and whether the answer was correct, with the
// student's own strokes replayed read-only. No analysis — just "here's what they
// drew".
export default function ComicWorkingReview({ studentId, episodeId }) {
  const [state, setState] = useState({ loading: true, problems: null, error: false });

  useEffect(() => {
    let on = true;
    setState({ loading: true, problems: null, error: false });
    (async () => {
      try {
        const r = await comicsAPI.working(studentId, episodeId);
        if (on) setState({ loading: false, problems: r.data?.problems || [], error: false });
      } catch {
        if (on) setState({ loading: false, problems: null, error: true });
      }
    })();
    return () => { on = false; };
  }, [studentId, episodeId]);

  if (state.loading) return <div className="mt-3"><Spinner label="Loading working…" /></div>;
  if (state.error) return <p className="mt-3 text-sm text-ink-500">Couldn’t load the working.</p>;
  if (!state.problems?.length) return <p className="mt-3 text-sm text-ink-500">No working was drawn for this episode.</p>;

  return (
    <div className="mt-3 space-y-3">
      {state.problems.map((p, i) => (
        <div key={p.problemId} className="rounded-2xl border border-line-soft bg-surface-white p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Problem {i + 1}{p.skillName ? ` · ${p.skillName}` : ''}
            </span>
            <span className={`ml-auto inline-flex items-center gap-1 text-[11px] font-semibold ${p.correct ? 'text-emerald' : 'text-amber-600'}`}>
              {p.correct ? <Check size={12} /> : <X size={12} />}
              {p.correct ? 'Correct' : 'Not yet'}
            </span>
          </div>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-line-soft/40" />}>
            <StrokeReplayPlayer strokes={p.workingStrokes} background="ruled" autoPlay={false} compact />
          </Suspense>
        </div>
      ))}
    </div>
  );
}
