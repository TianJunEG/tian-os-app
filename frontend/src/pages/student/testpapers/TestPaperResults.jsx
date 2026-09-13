import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';
import SittingReview from './SittingReview';

// Marked result for a sitting. Reached from submission with the marked paper in
// nav state. No live refetch — a sitting is marked once; if the state is lost
// (hard refresh) we send the student back to the paper list.
export default function TestPaperResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-body-soft">
        This result is no longer available.
        <div className="mt-4">
          <button className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white" onClick={() => navigate('/student/test-papers')}>Back to papers</button>
        </div>
      </div>
    );
  }

  const s = result.summary || {};
  const questions = result.questions || [];
  const pct = s.scorePct ?? 0;
  const tone = pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
  const toneBg = { emerald: 'bg-emerald-tint text-emerald', amber: 'bg-gold-tint text-gold-deep', rose: 'bg-danger-tint text-danger-deep' }[tone];
  const mins = Math.floor((s.durationUsedSec || 0) / 60);
  const secs = (s.durationUsedSec || 0) % 60;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Summary */}
      <div className={`rounded-2xl ${toneBg} p-5 text-center`}>
        <p className="text-sm font-semibold opacity-80">{result.title}</p>
        <p className="mt-1 text-4xl font-extrabold">{s.marksAwarded}/{s.totalMarks}</p>
        <p className="mt-1 text-lg font-semibold">{pct}%</p>
        <p className="mt-2 text-xs opacity-70">
          {s.correctCount}/{s.totalCount} correct · {mins}m {secs}s used
        </p>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-body-muted">Review</h2>
      <SittingReview questions={questions} pslHref="/student/psl" />

      <div className="mt-6 flex justify-center">
        <button
          type="button" onClick={() => navigate('/student/test-papers')}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-deep"
        ><FileText size={15} /> Back to papers</button>
      </div>
    </div>
  );
}
