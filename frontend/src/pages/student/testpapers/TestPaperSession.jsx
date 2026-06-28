import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { testPapersAPI } from '../../../services/api';
import QuestionDiagram, { canRenderQuestionDiagram } from '../../student/mathpath/components/QuestionDiagram';
import FullScreenWorkingMode from '../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../components/learning/WorkingPreviewCard';

function fmtTime(sec) {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Timed paper runner. No per-question feedback (exam conditions) — the student
// answers freely across all questions and submits once; marking happens server
// side at submission. Auto-submits when the timer reaches zero.
export default function TestPaperSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(location.state?.session || null);
  const [loading, setLoading] = useState(!location.state?.session);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});       // { [order]: string }
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(location.state?.session?.secondsRemaining ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [workingByOrder, setWorkingByOrder] = useState({});  // { [order]: { workingImage, workingStrokes, workingMathObjects, workingSubmitted } }
  const [workingOpenOrder, setWorkingOpenOrder] = useState(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const workingRef = useRef(workingByOrder);
  workingRef.current = workingByOrder;
  const submittedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  // Load (or resume) the sitting if we didn't arrive with it in nav state.
  useEffect(() => {
    if (session) return;
    let alive = true;
    testPapersAPI.getSession(sessionId)
      .then((res) => { if (alive) { setSession(res.data); setSecondsLeft(res.data?.secondsRemaining ?? null); } })
      .catch(() => { if (alive) setError('Could not load this sitting. It may have already been submitted.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [sessionId, session]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const payload = {
      answers: (session?.questions || []).map((q) => {
        const w = workingRef.current[q.order] || {};
        return {
          order: q.order,
          answer: answersRef.current[q.order] ?? '',
          workingSubmitted: Boolean(w.workingSubmitted),
          workingImage: w.workingImage || '',
        };
      }),
      durationUsedSec: Math.floor((Date.now() - startedAtRef.current) / 1000),
    };
    try {
      const res = await testPapersAPI.submit(sessionId, payload);
      navigate(`/student/test-papers/${sessionId}/results`, { state: { result: res.data }, replace: true });
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
      setError('Could not submit the paper. Please try again.');
    }
  }, [session, sessionId, navigate]);

  // Countdown (only for timed papers). Decrement once per second; auto-submit at 0.
  useEffect(() => {
    if (secondsLeft == null) return undefined;
    if (secondsLeft <= 0) { handleSubmit(); return undefined; }
    const t = setInterval(() => setSecondsLeft((s) => (s == null ? null : s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, handleSubmit]);

  if (loading) return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="animate-spin" /></div>;
  if (error && !session) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-slate-600">{error}<div className="mt-4"><button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => navigate('/student/test-papers')}>Back to papers</button></div></div>;

  const questions = session?.questions || [];
  const q = questions[index];
  const answeredCount = questions.filter((qq) => String(answers[qq.order] ?? '').trim() !== '').length;
  const setAnswer = (order, val) => setAnswers((a) => ({ ...a, [order]: val }));

  function confirmAndSubmit() {
    const unanswered = questions.length - answeredCount;
    if (unanswered > 0 && !window.confirm(`You still have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`)) return;
    handleSubmit();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      {/* Header: title, progress, timer */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-slate-900">{session?.title}</h1>
          <p className="text-xs text-slate-500">Question {index + 1} of {questions.length} · {answeredCount} answered</p>
        </div>
        {secondsLeft != null && (
          <div className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${secondsLeft <= 60 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
            <Clock size={15} /> {fmtTime(secondsLeft)}
          </div>
        )}
      </div>

      {/* Question navigator chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {questions.map((qq, i) => {
          const done = String(answers[qq.order] ?? '').trim() !== '';
          return (
            <button
              key={qq.order} type="button" onClick={() => setIndex(i)}
              className={`h-7 w-7 rounded-md text-xs font-semibold ${i === index ? 'bg-indigo-600 text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
            >{i + 1}</button>
          );
        })}
      </div>

      {/* Current question */}
      {q && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold">Section {q.section}</span>
            <span>{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
          </div>

          {q.diagram && canRenderQuestionDiagram({ diagram: q.diagram }) && (
            <div className="mb-4"><QuestionDiagram question={{ diagram: q.diagram }} /></div>
          )}

          <p className="mb-4 text-lg leading-relaxed text-slate-900">{q.stem}</p>

          {q.type === 'mcq' && Array.isArray(q.choices) && q.choices.length > 0 ? (
            <div className="space-y-2">
              {q.choices.map((choice) => {
                const selected = answers[q.order] === choice;
                return (
                  <button
                    key={choice} type="button" onClick={() => setAnswer(q.order, choice)}
                    className={`block w-full rounded-xl border px-4 py-3 text-left text-base font-medium transition ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'}`}
                  >{choice}</button>
                );
              })}
            </div>
          ) : (
            <div>
              {(() => {
                const unit = String(q.unit || '').trim();
                const isPrefix = /^(\$|s\$|rm|£|€)$/i.test(unit);
                return (
                  <div className="relative flex items-center">
                    {unit && isPrefix && <span className="pointer-events-none absolute left-4 text-lg font-semibold text-slate-400">{unit}</span>}
                    <input
                      value={answers[q.order] ?? ''}
                      onChange={(e) => setAnswer(q.order, e.target.value)}
                      inputMode="text"
                      placeholder="Type your answer"
                      className={`w-full rounded-xl border border-slate-200 py-3 font-mono text-lg text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${unit && isPrefix ? 'pl-10 pr-4' : unit ? 'pl-4 pr-14' : 'px-4'}`}
                    />
                    {unit && !isPrefix && <span className="pointer-events-none absolute right-4 text-lg font-semibold text-slate-400">{unit}</span>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Working space — students show their working; it's stored with the
              submission so a teacher can see they worked it out. */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <WorkingPreviewCard
              workingImage={(workingByOrder[q.order] || {}).workingImage || ''}
              workingSubmitted={Boolean((workingByOrder[q.order] || {}).workingSubmitted)}
              onOpen={() => setWorkingOpenOrder(q.order)}
              onRemove={(workingByOrder[q.order] || {}).workingSubmitted
                ? () => setWorkingByOrder((prev) => { const n = { ...prev }; delete n[q.order]; return n; })
                : undefined}
              openLabel="Show your working"
            />
          </div>
        </div>
      )}

      {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* Footer nav */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
        ><ChevronLeft size={16} /> Back</button>

        {index < questions.length - 1 ? (
          <button
            type="button" onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >Next <ChevronRight size={16} /></button>
        ) : (
          <button
            type="button" onClick={confirmAndSubmit} disabled={submitting}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >{submitting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Submit paper</>}</button>
        )}
      </div>

      <FullScreenWorkingMode
        open={workingOpenOrder != null}
        questionId={`tp-${sessionId}-${workingOpenOrder}`}
        questionText={questions.find((x) => x.order === workingOpenOrder)?.stem || ''}
        initialStrokes={(workingByOrder[workingOpenOrder] || {}).workingStrokes || []}
        initialMathObjects={(workingByOrder[workingOpenOrder] || {}).workingMathObjects || []}
        onClose={() => setWorkingOpenOrder(null)}
        onSave={(p) => {
          const ord = workingOpenOrder;
          if (ord == null) return;
          setWorkingByOrder((prev) => ({ ...prev, [ord]: { ...p } }));
          setWorkingOpenOrder(null);
        }}
      />
    </div>
  );
}
