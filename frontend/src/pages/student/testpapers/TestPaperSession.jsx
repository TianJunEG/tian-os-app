import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { testPapersAPI } from '../../../services/api';
import QuestionDiagram, { canRenderQuestionDiagram } from '../../student/mathpath/components/QuestionDiagram';
import FullScreenWorkingMode from '../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../components/learning/WorkingPreviewCard';
import { MathText } from '../../../components/ui/Fraction';
import SymmetryShadeGrid from './SymmetryShadeGrid';

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

  // Protect an in-progress sitting from accidental loss (answers live only in
  // memory — a reload sends the student back to Q1 with nothing). (a) disable the
  // pull-to-refresh gesture while the paper is open (scoped: restored on unmount);
  // (b) warn on a real reload/close once they've started answering.
  useEffect(() => {
    const docEl = document.documentElement;
    const prevDoc = docEl.style.overscrollBehaviorY;
    const prevBody = document.body.style.overscrollBehaviorY;
    docEl.style.overscrollBehaviorY = 'contain';
    document.body.style.overscrollBehaviorY = 'contain';
    const onBeforeUnload = (e) => {
      if (submittedRef.current) return undefined;
      if (!Object.keys(answersRef.current || {}).length) return undefined;
      e.preventDefault();
      e.returnValue = ''; // triggers the browser's native "leave / reload?" prompt
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      docEl.style.overscrollBehaviorY = prevDoc;
      document.body.style.overscrollBehaviorY = prevBody;
    };
  }, []);

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

  if (loading) return <div className="flex items-center justify-center py-24 text-body-faint"><Loader2 className="animate-spin" /></div>;
  if (error && !session) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-body-soft">{error}<div className="mt-4"><button className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white" onClick={() => navigate('/student/test-papers')}>Back to papers</button></div></div>;

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
          <h1 className="truncate text-base font-bold text-ink">{session?.title}</h1>
          <p className="text-xs text-body-muted">Question {index + 1} of {questions.length} · {answeredCount} answered</p>
        </div>
        {secondsLeft != null && (
          <div className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${secondsLeft <= 60 ? 'bg-danger-tint text-danger-deep' : 'bg-surface-raised text-body'}`}>
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
              className={`h-7 w-7 rounded-md text-xs font-semibold ${i === index ? 'bg-emerald text-white' : done ? 'bg-emerald-tint text-emerald' : 'bg-surface-raised text-body-muted'}`}
            >{i + 1}</button>
          );
        })}
      </div>

      {/* Current question */}
      {q && (
        <div className="rounded-2xl border border-line bg-surface-white p-5 shadow-rest">
          <div className="mb-2 flex items-center gap-2 text-xs text-body-faint">
            <span className="rounded bg-surface-raised px-1.5 py-0.5 font-semibold">{q.paper === 2 ? 'Paper 2' : `Section ${q.section}`}</span>
            <span>{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
          </div>

          {/* Shared context for a multi-part word problem (shown on each part). */}
          {q.groupIntro && (
            <p className="mb-3 rounded-xl bg-surface-raised px-3 py-2 text-base leading-relaxed text-body"><MathText text={q.groupIntro} /></p>
          )}

          {q.diagram && canRenderQuestionDiagram({ diagram: q.diagram }) && (
            <div className="mb-4"><QuestionDiagram question={{ diagram: q.diagram }} /></div>
          )}

          <p className="mb-4 text-lg leading-relaxed text-ink">
            {q.partLabel && <span className="font-semibold text-body-muted">({q.partLabel})&nbsp;</span>}
            <MathText text={q.stem} />
          </p>

          {q.type === 'shade_grid' && q.grid ? (
            <div>
              <SymmetryShadeGrid grid={q.grid} value={answers[q.order] || ''} onChange={(v) => setAnswer(q.order, v)} />
              <p className="mt-2 text-xs text-body-faint">Tap a square to shade it; tap again to clear.</p>
            </div>
          ) : q.type === 'mcq' && Array.isArray(q.choices) && q.choices.length > 0 ? (
            <div className="space-y-2">
              {q.choices.map((choice) => {
                const selected = answers[q.order] === choice;
                return (
                  <button
                    key={choice} type="button" onClick={() => setAnswer(q.order, choice)}
                    className={`block w-full rounded-xl border px-4 py-3 text-left text-base font-medium transition ${selected ? 'border-emerald bg-emerald-tint text-emerald' : 'border-line bg-surface-white text-ink hover:border-line-strong'}`}
                  ><MathText text={choice} /></button>
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
                    {unit && isPrefix && <span className="pointer-events-none absolute left-4 text-lg font-semibold text-body-faint">{unit}</span>}
                    <input
                      value={answers[q.order] ?? ''}
                      onChange={(e) => setAnswer(q.order, e.target.value)}
                      inputMode="text"
                      placeholder="Type your answer"
                      className={`w-full rounded-xl border border-line py-3 font-mono text-lg text-ink focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20 ${unit && isPrefix ? 'pl-10 pr-4' : unit ? 'pl-4 pr-14' : 'px-4'}`}
                    />
                    {unit && !isPrefix && <span className="pointer-events-none absolute right-4 text-lg font-semibold text-body-faint">{unit}</span>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Working space — students show their working; it's stored with the
              submission so a teacher can see they worked it out. */}
          <div className="mt-5 border-t border-line-soft pt-4">
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

      {error && <div className="mt-3 rounded-xl border border-danger-border bg-danger-tint px-4 py-2 text-sm text-danger-deep">{error}</div>}

      {/* Footer nav */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-body-soft disabled:opacity-40"
        ><ChevronLeft size={16} /> Back</button>

        {index < questions.length - 1 ? (
          <button
            type="button" onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="inline-flex items-center gap-1 rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-ink-dash"
          >Next <ChevronRight size={16} /></button>
        ) : (
          <button
            type="button" onClick={confirmAndSubmit} disabled={submitting}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-deep disabled:opacity-50"
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
