import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Card, Button, ProgressBar, Spinner } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import {
  startFractionPracticeFlow,
  submitFractionPracticeAttempt,
} from '../../../mathpath/fractions/fractionPracticeFlow';
import { checkFractionAnswer } from '../../../mathpath/fractions/fractionQuestionGenerator';

const CONFIDENCE_OPTIONS = ['Very Confident', 'Confident', 'Unsure', 'Guessing'];

function VisualTable({ payload }) {
  const headers = Array.isArray(payload?.headers) ? payload.headers : [];
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  if (!headers.length || !rows.length) return null;
  return (
    <div className="mb-5 overflow-x-auto rounded-xl border border-hairline">
      <table className="min-w-full border-collapse text-left text-sm text-ink-800">
        <thead className="bg-navy-50">
          <tr>{headers.map((h, i) => <th key={i} className="border-b border-hairline px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="odd:bg-white even:bg-slate-50">
              {Array.isArray(row) ? row.map((cell, cIdx) => <td key={`${rIdx}-${cIdx}`} className="border-b border-hairline px-3 py-2">{cell}</td>) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisualBlock({ visual }) {
  if (!visual || !visual.type) return null;
  if (visual.type === 'table') return <VisualTable payload={visual.payload} />;
  return <div className="mb-5 rounded-xl border border-hairline bg-slate-50 px-4 py-3 text-sm text-ink-600">Visual unavailable</div>;
}

function getFeedback({ correct, timeTaken, estimatedSeconds, skipped }) {
  if (skipped) return "We'll come back to this.";
  if (!correct) return "Let's review this skill.";
  if (Number(timeTaken || 0) <= Number(estimatedSeconds || 20)) return 'Well done — accurate and quick.';
  return "Correct. Let's practise for speed.";
}

function LegacyPracticeSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const items = useMemo(() => location.state?.items || [], [location.state]);
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
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => { if (!items.length) navigate(homeBase, { replace: true }); }, [items, navigate, homeBase]);
  useEffect(() => { setStartedAt(Date.now()); }, [idx]);
  if (!items.length) return <Spinner />;

  const q = items[idx];
  const isLast = idx === items.length - 1;
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];

  const check = async () => {
    if (busy || answer === '') return;
    setBusy(true); setErr('');
    try {
      const { data } = await mathpathAPI.attempt(sessionId, { questionId: q.questionId, answer, timeMs: Date.now() - startedAt, hintsUsed: 0 });
      setResult(data);
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not check your answer. Please try again.');
    } finally { setBusy(false); }
  };

  const next = async () => {
    if (!isLast) { setIdx((i) => i + 1); setAnswer(''); setResult(null); setErr(''); return; }
    setBusy(true);
    try { await mathpathAPI.complete(sessionId); } catch (_) { /* noop */ }
    navigate(`${resultsBase}/results/${sessionId}`, { replace: true, state: resultState });
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono tabular-nums">Question {idx + 1} of {items.length}</span><span>{q.skillName}</span>
      </div>
      <ProgressBar value={idx + (result ? 1 : 0)} max={items.length} className="mb-6" />
      <Card className="flex min-h-[30rem] flex-col p-6">
        <div className="mb-6 text-lg leading-relaxed text-ink-900"><MathText text={q.stem} /></div>
        <VisualBlock visual={q.visual} />
        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => (
              <button key={`${i}-${c}`} disabled={!!result} onClick={() => setAnswer(c)} className={`rounded-xl border px-4 py-3 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
                <MathText text={c} />
              </button>
            ))}
          </div>
        ) : (
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!result} className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg" />
        )}
        {result && (
          <div className={`mt-5 rounded-xl p-4 ${result.correct ? 'bg-success-100' : 'bg-error-100'}`}>
            <div className={`flex items-center gap-2 font-semibold ${result.correct ? 'text-success-700' : 'text-error-700'}`}>{result.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}{result.correct ? 'Correct' : 'Not quite'}</div>
          </div>
        )}
        {err && <p className="mt-3 text-sm text-error-700">{err}</p>}
        <div className="mt-auto pt-6">{!result ? <Button size="l" disabled={busy || !answer} onClick={check} className="w-full">Check answer</Button> : <Button size="l" icon={ArrowRight} onClick={next} className="w-full">{isLast ? 'Finish' : 'Next question'}</Button>}</div>
      </Card>
    </div>
  );
}

export default function PracticeSession() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMathPathRoute = location.pathname.startsWith('/student/mathpath/practice/');
  const hasLegacyItems = Boolean(location.state?.items?.length);

  if (!isMathPathRoute || hasLegacyItems) return <LegacyPracticeSession />;

  const studentId = user?._id || user?.id || user?.email || 'demo-student';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flowSession, setFlowSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState('Confident');
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const started = await startFractionPracticeFlow({
          studentId,
          domainId: 'fractions',
          requestedSkillId: location.state?.skillId || null,
          requestedQuestionFamilyId: location.state?.questionFamilyId || null,
          sessionLength: location.state?.questionCount || 5,
        });
        if (!mounted) return;
        setFlowSession(started);
        setQuestions(started.questions || []);
        if (!started.questions?.length) setError('No questions generated yet. Please try another skill.');
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Could not start practice session.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [studentId, location.state]);

  useEffect(() => {
    if (summary || loading || !questions.length) return undefined;
    setQuestionStartedAt(Date.now());
    setElapsedSec(0);
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - questionStartedAt) / 1000)), 250);
    return () => clearInterval(t);
  }, [idx, summary, loading, questions.length, questionStartedAt]);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <Card className="mx-auto max-w-xl p-6">
        <p className="text-sm text-error-700">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/student/mathpath', { replace: true })}>Back to MathPath</Button>
      </Card>
    );
  }
  if (!questions.length) return <Spinner />;

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const answered = Boolean(feedback);
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];

  const onSubmitCurrent = () => {
    if (busy || answered) return;
    if (!answer) return;
    const timeTaken = Math.max(1, Math.floor((Date.now() - questionStartedAt) / 1000));
    const answerCheck = checkFractionAnswer({
      studentAnswer: answer,
      correctAnswer: q.answer,
      acceptedAnswers: q.acceptedAnswers || [],
    });
    const current = {
      questionId: q.questionId,
      studentAnswer: answer,
      timeTaken,
      confidence,
      attemptNumber: 1,
      _skipped: false,
      _correct: answerCheck.correct,
    };
    setResponses((prev) => [...prev, current]);
    setFeedback({
      correct: answerCheck.correct,
      skipped: false,
      message: getFeedback({ correct: answerCheck.correct, timeTaken, estimatedSeconds: q.estimatedSeconds, skipped: false }),
      correctAnswer: q.answer?.display || null,
    });
  };

  const onSkipCurrent = () => {
    if (busy || answered) return;
    const timeTaken = Math.max(1, Math.floor((Date.now() - questionStartedAt) / 1000));
    setResponses((prev) => [...prev, {
      questionId: q.questionId,
      studentAnswer: '',
      timeTaken,
      confidence: 'Guessing',
      attemptNumber: 1,
      _skipped: true,
      _correct: false,
    }]);
    setFeedback({
      correct: false,
      skipped: true,
      message: getFeedback({ correct: false, skipped: true }),
      correctAnswer: q.answer?.display || null,
    });
  };

  const nextOrFinish = async () => {
    if (!answered) return;
    if (!isLast) {
      setIdx((i) => i + 1);
      setAnswer('');
      setConfidence('Confident');
      setFeedback(null);
      setQuestionStartedAt(Date.now());
      return;
    }

    setBusy(true);
    try {
      const payload = responses.map((r) => ({
        questionId: r.questionId,
        studentAnswer: r.studentAnswer,
        timeTaken: r.timeTaken,
        confidence: r.confidence,
        attemptNumber: r.attemptNumber,
      }));
      const submitted = await submitFractionPracticeAttempt({
        practiceSessionId: flowSession.practiceSessionId || routeSessionId,
        studentId,
        responses: payload,
      });
      setSummary(submitted);
    } catch (e) {
      setError(e.message || 'Failed to submit session.');
    } finally {
      setBusy(false);
    }
  };

  if (summary) {
    const questionById = new Map((questions || []).map((qItem) => [qItem.questionId, qItem]));
    const reviewItems = (summary.results || []).map((resultItem) => {
      const question = questionById.get(resultItem.questionId) || {};
      return {
        questionId: resultItem.questionId,
        prompt: question.prompt || question.stem || '',
        skillId: resultItem.skillId || question.skillId,
        questionFamilyId: resultItem.questionFamilyId || question.questionFamilyId,
        difficulty: question.difficulty,
        studentAnswer: resultItem.studentAnswer,
        correctAnswer: resultItem.correctAnswer,
        correct: resultItem.correct,
        timeTaken: resultItem.timeTaken,
        confidence: resultItem.confidence,
        fluencyFlag: resultItem.fluencyFlag,
        solutionSteps: resultItem.solutionSteps || question.solutionSteps || [],
        workingRequired: Boolean(summary.questionWorkingSummary?.questionRefs?.find((qRef) => qRef.questionId === resultItem.questionId)?.workingRequired),
        workingUploaded: false,
      };
    });

    const fluencyLabel =
      summary.fluencySummary?.accurateButSlowCount > 0 ? 'Accurate but slow'
        : summary.fluencySummary?.fluentCount > 0 ? 'Fluent'
          : 'Review needed';
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-ink-900">Session Complete</h2>
          <div className="mt-4 space-y-2 text-sm text-ink-700">
            <p><span className="font-semibold">Accuracy:</span> {summary.accuracySummary?.accuracyPercentage ?? 0}%</p>
            <p><span className="font-semibold">Average time:</span> {summary.accuracySummary?.averageSeconds ?? 0}s</p>
            <p><span className="font-semibold">Fluency:</span> {fluencyLabel}</p>
            <p><span className="font-semibold">Next action:</span> {summary.nextRecommendedAction || 'Continue practice'}</p>
          </div>
          {summary.workingUploadRequired && (
            <div className="mt-5 rounded-xl border border-gold-300 bg-gold-100 p-4 text-sm text-gold-900">
              <p className="font-semibold">Please upload your working sheet for this session.</p>
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => navigate('/student/mathpath/working/upload', {
                  state: {
                    sessionType: 'practice',
                    studentId,
                    practiceSessionId: flowSession?.practiceSessionId || routeSessionId,
                    workingSessionId: summary.workingSessionId || flowSession?.workingSessionId || null,
                    totalQuestions: summary.questionWorkingSummary?.totalQuestions || questions.length,
                    questionRefs: summary.questionWorkingSummary?.questionRefs || [],
                    nextRecommendedAction: summary.nextRecommendedAction || 'Continue Practice',
                  },
                })}
              >
                Upload Working
              </Button>
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/student/mathpath/review', {
                state: {
                  source: 'practice',
                  reviewItems,
                  nextAction: summary.nextRecommendedAction,
                  primaryAction: '/student/mathpath',
                  backTo: '/student/mathpath',
                },
              })}
            >
              Review questions
            </Button>
            <Button onClick={() => navigate('/student/mathpath', { replace: true })}>Back to MathPath</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono tabular-nums">Question {idx + 1} of {questions.length}</span>
        <span className="font-mono">{elapsedSec}s</span>
      </div>
      <ProgressBar value={idx + (answered ? 1 : 0)} max={questions.length} className="mb-6" />

      <Card className="flex min-h-[34rem] flex-col p-6">
        <div className="mb-6 text-lg leading-relaxed text-ink-900"><MathText text={q.prompt || q.stem} /></div>
        <VisualBlock visual={q.visual} />
        {q.workingRequired && <p className="mb-4 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-700">Working is expected for this question. Upload at session end.</p>}

        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => (
              <button key={`${i}-${c}`} disabled={answered} onClick={() => setAnswer(c)} className={`rounded-xl border px-4 py-3 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
                <MathText text={c} />
              </button>
            ))}
          </div>
        ) : (
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={answered}
            placeholder="Type your answer (e.g. 3/4)"
            className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        )}

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-ink-700">Confidence</label>
          <div className="grid grid-cols-2 gap-2">
            {CONFIDENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={answered}
                onClick={() => setConfidence(opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${confidence === opt ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 min-h-[72px]">
          {feedback && (
            <div className={`rounded-xl p-4 ${feedback.correct ? 'bg-success-100' : 'bg-error-100'}`}>
              <div className={`flex items-center gap-2 font-semibold ${feedback.correct ? 'text-success-700' : 'text-error-700'}`}>
                {feedback.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                {feedback.correct ? 'Correct' : feedback.skipped ? 'Skipped' : 'Review'}
              </div>
              <p className="mt-1 text-sm text-ink-700">{feedback.message}</p>
              {!feedback.correct && feedback.correctAnswer && (
                <p className="mt-1 text-sm text-ink-700">Answer: <MathText text={feedback.correctAnswer} className="font-mono font-semibold" /></p>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2 pt-5 sm:grid-cols-2">
          {!answered ? (
            <>
              <Button variant="outlineLight" disabled={busy} onClick={onSkipCurrent}>Skip</Button>
              <Button disabled={busy || !answer} onClick={onSubmitCurrent}>Submit answer</Button>
            </>
          ) : (
            <Button className="sm:col-span-2" icon={ArrowRight} disabled={busy} onClick={nextOrFinish}>
              {isLast ? 'Finish session' : 'Next question'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
