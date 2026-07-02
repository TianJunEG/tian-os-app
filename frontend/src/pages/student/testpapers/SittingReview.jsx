import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Brain } from 'lucide-react';
import QuestionDiagram, { canRenderQuestionDiagram } from '../mathpath/components/QuestionDiagram';
import { MathText } from '../../../components/ui/Fraction';
import SymmetryShadeGrid from './SymmetryShadeGrid';

// Per-question review list for a marked test-paper sitting. Shared by the student
// results screen and the teacher drill-down so both render a sitting identically.
// `pslHref` (optional) turns on the "Learn the method in PSL" prompt on missed
// word problems — the student view passes it; the teacher view omits it.
export default function SittingReview({ questions = [], pslHref = '' }) {
  return (
    <div className="space-y-3">
      {questions.map((q) => {
        const isWordProblem = q.section === 'C' || (q.marks || 0) >= 3;
        return (
          <div key={q.order} className={`rounded-xl border bg-white p-4 ${q.correct ? 'border-emerald-200' : 'border-rose-200'}`}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400">Q{q.order} · {q.paper === 2 ? 'Paper 2' : `Section ${q.section}`} · {q.marks} mark{q.marks === 1 ? '' : 's'}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${q.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                {q.correct ? <><CheckCircle2 size={15} /> {q.marksAwarded}/{q.marks}</> : <><XCircle size={15} /> 0/{q.marks}</>}
              </span>
            </div>

            {q.diagram && canRenderQuestionDiagram({ diagram: q.diagram }) && (
              <div className="my-2"><QuestionDiagram question={{ diagram: q.diagram }} /></div>
            )}

            {q.groupIntro && <p className="mb-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-600"><MathText text={q.groupIntro} /></p>}
            <p className="text-slate-800">{q.partLabel && <span className="font-semibold text-slate-500">({q.partLabel})&nbsp;</span>}<MathText text={q.stem} /></p>

            {q.type === 'shade_grid' && q.grid ? (
              <div className="mt-2">
                <SymmetryShadeGrid grid={q.grid} value={q.studentAnswer} correctCells={q.correctAnswer} readOnly />
                {!q.correct && <p className="mt-1 text-xs text-emerald-600">Green outline = the squares to shade.</p>}
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className={q.correct ? 'text-emerald-700' : 'text-rose-700'}>
                  {pslHref ? 'Your answer' : 'Answer'}: <span className="font-semibold"><MathText text={q.studentAnswer || '—'} /></span>
                </span>
                {!q.correct && (
                  <span className="text-slate-600">Correct: <span className="font-semibold text-slate-900"><MathText text={q.correctAnswer} />{q.unit ? ` ${q.unit}` : ''}</span></span>
                )}
              </div>
            )}

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

            {pslHref && !q.correct && isWordProblem && (
              <Link
                to={pslHref}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              ><Brain size={13} /> Learn the method in Problem Solving Lab <ArrowRight size={12} /></Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
