import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { informalAssessmentAPI } from '../../services/api';
import { Card, Button, ProgressBar, Spinner } from '../../components/ui';

function Timer({ startedAt, limitMinutes, onExpire }) {
  const [left, setLeft] = useState(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!startedAt || !limitMinutes) return;
    const endMs = new Date(startedAt).getTime() + limitMinutes * 60000;
    const tick = () => {
      const remaining = Math.max(0, endMs - Date.now());
      setLeft(remaining);
      if (remaining <= 0 && !expiredRef.current) { expiredRef.current = true; onExpire(); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, limitMinutes, onExpire]);

  if (left == null) return null;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const urgent = left < 60000;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${urgent ? 'bg-red-100 text-red-600' : 'bg-ink-100 text-ink-600'}`}>
      <Clock className="h-3.5 w-3.5" />
      {m}:{String(s).padStart(2, '0')}
    </span>
  );
}

export default function InformalAssessment() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('intro'); // intro | quiz | results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    informalAssessmentAPI.get(sessionId)
      .then((r) => {
        setData(r.data);
        if (r.data.session.status === 'submitted') {
          setResult(r.data.session);
          setPhase('results');
        } else if (r.data.session.status === 'in_progress') {
          setPhase('quiz');
        }
      })
      .catch((e) => console.warn("InformalAssessment: fetch failed", e))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleStart = async () => {
    await informalAssessmentAPI.start(sessionId);
    setData((prev) => ({
      ...prev,
      session: { ...prev.session, status: 'in_progress', startedAt: new Date().toISOString() },
    }));
    setPhase('quiz');
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = (data?.assessment?.questions || []).map((q) => ({
      questionId: q.questionId,
      answer: answers[q.questionId] ?? null,
    }));
    try {
      const { data: res } = await informalAssessmentAPI.submit(sessionId, payload);
      setResult(res);
      setPhase('results');
    } catch { setSubmitting(false); }
  }, [submitting, data, answers, sessionId]);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (!data) return <div className="p-6 text-center text-red-600">Assessment not found.</div>;

  const { session, assessment } = data;
  const questions = assessment.questions || [];

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-lg px-4 pt-16 text-center">
        <Card className="p-8">
          <h1 className="text-xl font-bold text-ink-800">{assessment.title}</h1>
          <p className="mt-2 text-sm text-ink-500">{assessment.questionCount} questions</p>
          {assessment.timeLimitMinutes && (
            <p className="mt-1 text-sm text-ink-500">
              <Clock className="mr-1 inline h-4 w-4" />{assessment.timeLimitMinutes} minutes
            </p>
          )}
          <div className="mt-2 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            No hints or retries — answer each question to the best of your ability.
          </div>
          <Button className="mt-6 w-full" onClick={handleStart}>Begin</Button>
        </Card>
      </div>
    );
  }

  // ── Results ──
  if (phase === 'results') {
    const attempts = result?.attempts || [];
    const fullQuestions = result?.questions || assessment.questions || [];
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 pt-8 pb-6">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-bold text-ink-800">Assessment Complete</h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-ink-800">{result?.score ?? session.score}%</p>
          <p className="text-sm text-ink-500">{result?.correctCount ?? session.correctCount} / {result?.totalCount ?? session.totalCount} correct</p>
          <ProgressBar value={result?.score ?? session.score ?? 0} max={100}
            barClassName={(result?.score ?? 0) >= 80 ? 'bg-emerald-500' : (result?.score ?? 0) >= 50 ? 'bg-gold-400' : 'bg-red-400'} className="mt-3" />
        </Card>

        <div className="space-y-2">
          {fullQuestions.map((q, i) => {
            const attempt = attempts[i];
            const isCorrect = attempt?.correct;
            return (
              <Card key={q.questionId} className="p-4">
                <div className="flex items-start gap-2">
                  {isCorrect
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />}
                  <div className="min-w-0">
                    <p className="text-sm text-ink-700">
                      <span className="mr-1 font-semibold text-ink-400">Q{i + 1}.</span>
                      {q.display || q.storyText}
                    </p>
                    {!isCorrect && (
                      <div className="mt-1 text-xs">
                        <span className="text-red-500">Your answer: {String(attempt?.answer ?? '-')}</span>
                        <span className="ml-3 text-emerald-600">Correct: {String(q.answer ?? q.correctAnswer)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button variant="secondary" className="w-full" onClick={() => navigate('/student/assignments')}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  // ── Quiz ──
  const q = questions[current];
  const isMCQ = assessment.module === 'MathPath' && q?.choice && q?.choices?.length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pt-8 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-500">
          Question {current + 1} of {questions.length}
        </p>
        {assessment.timeLimitMinutes && session.startedAt && (
          <Timer startedAt={session.startedAt} limitMinutes={assessment.timeLimitMinutes} onExpire={handleSubmit} />
        )}
      </div>
      <ProgressBar value={current + 1} max={questions.length} barClassName="bg-emerald-500" />

      {/* Question */}
      <Card className="p-5">
        <p className="text-base font-medium text-ink-800">{q?.display || q?.storyText}</p>

        <div className="mt-4">
          {isMCQ ? (
            <div className="grid grid-cols-2 gap-2">
              {q.choices.map((ch, ci) => (
                <button key={ci} type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.questionId]: String(ci) }))}
                  className={`rounded-xl border px-3 py-3 text-center text-sm transition-colors ${
                    answers[q.questionId] === String(ci)
                      ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-emerald-300'
                  }`}>
                  {ch}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="number"
              inputMode="decimal"
              placeholder="Your answer"
              value={answers[q?.questionId] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
              className="w-full rounded-xl border border-ink-200 bg-ink-50/30 px-4 py-3 text-center font-mono text-lg font-bold text-ink-800 outline-none focus:border-emerald-400"
            />
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        {current > 0 && (
          <Button variant="secondary" className="flex-1" onClick={() => setCurrent(current - 1)}>
            Previous
          </Button>
        )}
        {current < questions.length - 1 ? (
          <Button className="flex-1" onClick={() => setCurrent(current + 1)}>Next</Button>
        ) : (
          <Button className="flex-1" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {questions.map((_, i) => {
          const answered = answers[questions[i]?.questionId] != null && answers[questions[i]?.questionId] !== '';
          return (
            <button key={i} type="button" onClick={() => setCurrent(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === current ? 'bg-emerald-500' : answered ? 'bg-emerald-300' : 'bg-ink-200'
              }`} />
          );
        })}
      </div>
    </div>
  );
}
