import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Brain, FileText } from 'lucide-react';
import QuestionDiagram, { canRenderQuestionDiagram } from '../../student/mathpath/components/QuestionDiagram';
import { MathText } from '../../../components/ui/Fraction';

// Marked result for a sitting. Reached from submission with the marked paper in
// nav state. No live refetch — a sitting is marked once; if the state is lost
// (hard refresh) we send the student back to the paper list.
export default function TestPaperResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">
        This result is no longer available.
        <div className="mt-4">
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => navigate('/student/test-papers')}>Back to papers</button>
        </div>
      </div>
    );
  }

  const s = result.summary || {};
  const questions = result.questions || [];
  const pct = s.scorePct ?? 0;
  const tone = pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
  const toneBg = { emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' }[tone];
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

      <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Review</h2>
      <div className="space-y-3">
        {questions.map((q) => {
          const isWordProblem = q.section === 'C' || (q.marks || 0) >= 3;
          return (
            <div key={q.order} className={`rounded-xl border bg-white p-4 ${q.correct ? 'border-emerald-200' : 'border-rose-200'}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400">Q{q.order} · Section {q.section} · {q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${q.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {q.correct ? <><CheckCircle2 size={15} /> {q.marksAwarded}/{q.marks}</> : <><XCircle size={15} /> 0/{q.marks}</>}
                </span>
              </div>

              {q.diagram && canRenderQuestionDiagram({ diagram: q.diagram }) && (
                <div className="my-2"><QuestionDiagram question={{ diagram: q.diagram }} /></div>
              )}

              <p className="text-slate-800"><MathText text={q.stem} /></p>

              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className={q.correct ? 'text-emerald-700' : 'text-rose-700'}>
                  Your answer: <span className="font-semibold"><MathText text={q.studentAnswer || '—'} /></span>
                </span>
                {!q.correct && (
                  <span className="text-slate-600">Correct: <span className="font-semibold text-slate-900"><MathText text={q.correctAnswer} />{q.unit ? ` ${q.unit}` : ''}</span></span>
                )}
              </div>

              {!q.correct && (Array.isArray(q.solutionSteps) && q.solutionSteps.length > 0 ? (
                <ol className="mt-2 list-decimal space-y-0.5 rounded-lg bg-slate-50 px-5 py-2 text-sm text-slate-600">
                  {q.solutionSteps.map((step, i) => <li key={i}><MathText text={step} /></li>)}
                </ol>
              ) : q.workedSolution ? (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"><MathText text={q.workedSolution} /></p>
              ) : null)}

              {q.workingSubmitted && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500">✍️ Working shown{q.workingImage ? ' — view' : ''}</summary>
                  {q.workingImage && <img src={q.workingImage} alt={`Working for question ${q.order}`} className="mt-2 max-h-64 rounded-lg border border-slate-200" />}
                </details>
              )}

              {!q.correct && isWordProblem && (
                <button
                  type="button" onClick={() => navigate('/student/psl')}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                ><Brain size={13} /> Learn the method in Problem Solving Lab <ArrowRight size={12} /></button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button" onClick={() => navigate('/student/test-papers')}
          className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        ><FileText size={15} /> Back to papers</button>
      </div>
    </div>
  );
}
