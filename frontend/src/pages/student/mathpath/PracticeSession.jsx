import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, ProgressBar, Spinner } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';

// One question at a time. Answers are graded server-side; we never receive the
// correct answer until after Check. Items are passed via navigation state when
// the session is created (a refresh sends the student back to MathPath home).
export default function PracticeSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const items = useMemo(() => location.state?.items || [], [location.state]);
  // Where to send the student afterwards — defaults to MathPath; Science (and any
  // other module reusing this screen) passes resultsBase/homeBase via nav state.
  const resultsBase = location.state?.resultsBase || '/student/mathpath';
  const homeBase = location.state?.homeBase || location.state?.backTo || '/student/mathpath';
  const resultState = {
    backTo: location.state?.backTo,
    homeBase: location.state?.homeBase || location.state?.backTo,
    homeLabel: location.state?.homeLabel,
    mistakesBase: location.state?.mistakesBase,
  };

  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null); // { correct, partial, correctAnswer, workedSolution, modelAnswer, keyPoints, missingKeyPoints }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => { if (!items.length) navigate(homeBase, { replace: true }); }, [items, navigate, homeBase]);
  useEffect(() => { setStartedAt(Date.now()); }, [idx]);

  if (!items.length) return <Spinner />;

  const q = items[idx];
  const isLast = idx === items.length - 1;
  // Defensive: a question's options should be unique. De-dupe so bad data never
  // renders a value twice (which also collides React keys → ghost selections).
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];

  const check = async () => {
    if (busy || answer === '') return;
    setBusy(true); setErr('');
    try {
      const { data } = await mathpathAPI.attempt(sessionId, {
        questionId: q.questionId, answer, timeMs: Date.now() - startedAt, hintsUsed: 0,
      });
      setResult(data);
    } catch (e) {
      const msg = e.response?.data?.error;
      setErr(msg === 'Question not found.' || msg === 'Session not found.'
        ? 'This practice set is out of date — please start a new session from MathPath.'
        : (msg || 'Could not check your answer. Please try again.'));
    } finally { setBusy(false); }
  };

  const next = async () => {
    if (!isLast) { setIdx((i) => i + 1); setAnswer(''); setResult(null); setErr(''); return; }
    setBusy(true);
    try { await mathpathAPI.complete(sessionId); } catch (_) { /* still navigate */ }
    navigate(`${resultsBase}/results/${sessionId}`, { replace: true, state: resultState });
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress */}
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono tabular-nums">Question {idx + 1} of {items.length}</span>
        <span>{q.skillName}</span>
      </div>
      <ProgressBar value={idx + (result ? 1 : 0)} max={items.length} className="mb-6" />

      {/* Fixed min-height + button pinned to the bottom keeps the card the same
          size across question types (MCQ vs short answer) and Check/answered states. */}
      <Card className="flex min-h-[34rem] flex-col p-6">
        <div className="mb-6 text-lg leading-relaxed text-ink-900"><MathText text={q.stem} /></div>

        {/* Answer input */}
        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => {
              const selected = answer === c;
              return (
                <button key={`${i}-${c}`} disabled={!!result} onClick={() => setAnswer(c)}
                  className={`flex items-center rounded-xl border px-4 py-3 text-left transition ${selected ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'} ${result ? 'opacity-70' : ''}`}>
                  <MathText text={c} />
                </button>
              );
            })}
          </div>
        ) : q.type === 'open_ended' ? (
          <textarea
            value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!result}
            rows={4} placeholder="Explain your answer in a sentence or two…"
            className="w-full rounded-xl border border-hairline px-4 py-3 text-base leading-relaxed text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        ) : (
          <input
            value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!result}
            placeholder="Type your answer (e.g. 3/4)" inputMode="text"
            onKeyDown={(e) => { if (e.key === 'Enter' && !result) check(); }}
            className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        )}

        {/* Feedback — reserved slot keeps the card height (and button position) stable between Check and answered states */}
        <div className="mt-5 min-h-[64px]">
        {result && (
          <div className={`rounded-xl p-4 ${result.correct ? 'bg-success-100' : result.partial ? 'bg-gold-100' : 'bg-error-100'}`}>
            <div className={`flex items-center gap-2 font-semibold ${result.correct ? 'text-success-700' : result.partial ? 'text-gold-700' : 'text-error-700'}`}>
              {result.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              {result.correct ? 'Correct' : result.partial ? 'Partly there' : 'Not quite'}
            </div>
            {/* Closed answers: show the correct answer. */}
            {!result.correct && result.correctAnswer && (
              <p className="mt-1 text-sm text-ink-700">Answer: <MathText text={result.correctAnswer} className="font-mono font-semibold" /></p>
            )}
            {/* Open-ended: AI feedback (when available) then model answer + which key points were missing. */}
            {result.aiFeedback && (
              <p className="mt-2 text-sm font-medium text-ink-700">{result.aiFeedback}</p>
            )}
            {result.modelAnswer && (
              <div className="mt-2 text-sm text-ink-700">
                <span className="font-semibold">Model answer:</span> {result.modelAnswer}
              </div>
            )}
            {result.missingKeyPoints?.length > 0 && (
              <p className="mt-2 text-sm text-ink-600">Try to mention: {result.missingKeyPoints.map((k) => String(k).split('|')[0]).join(', ')}</p>
            )}
            {result.workedSolution && !result.modelAnswer && <p className="mt-2 text-sm text-ink-500"><MathText text={result.workedSolution} /></p>}
            {result.explanation && <p className="mt-2 text-sm text-ink-500">{result.explanation}</p>}
          </div>
        )}
        </div>

        {err && (
          <p className="mt-4 rounded-xl border-l-4 border-l-error-500 bg-error-100 p-3 text-sm text-error-700">
            {err} {(/out of date/.test(err)) && <button onClick={() => navigate(homeBase, { replace: true })} className="font-semibold underline">Back to MathPath</button>}
          </p>
        )}

        {/* Action — single primary button, pinned to the card's bottom edge */}
        <div className="mt-auto pt-6">
          {!result ? (
            <Button size="l" disabled={busy || answer === ''} onClick={check} className="w-full">Check answer</Button>
          ) : (
            <Button size="l" icon={ArrowRight} disabled={busy} onClick={next} className="w-full">{isLast ? 'Finish' : 'Next question'}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
