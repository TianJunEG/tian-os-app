import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Button, Card, EmptyState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import FractionExpressionQuestion, { extractFractionExpression } from './components/FractionExpressionQuestion';
import AnswerInputRenderer from './components/AnswerInputRenderer';

function expectsFractionAnswer(question = {}) {
  const text = `${question.prompt || ''} ${question.answerType || ''} ${question.answerCheckStrategy || ''}`.toLowerCase();
  return /fraction|simplest form|what fraction|fraction remains|fraction is left/.test(text);
}

export default function SimilarQuestionPractice() {
  const { practiceSetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [practiceSet, setPracticeSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [responses, setResponses] = useState([]);
  const [submitted, setSubmitted] = useState(null);
  const [busy, setBusy] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await mathpathAPI.startSimilarPractice(practiceSetId, { limit: 12 });
        if (!live) return;
        setSession(data.session);
        setPracticeSet(data.practiceSet);
        setQuestions(data.questions || []);
      } catch (err) {
        if (live) setError(err.response?.data?.error || 'Could not start similar question practice.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [practiceSetId]);

  useEffect(() => {
    if (submitted || !questions.length) return;
    setQuestionStartedAt(Date.now());
  }, [idx, questions.length, submitted]);

  if (loading) return <Spinner label="Loading similar practice..." />;
  if (error) return <EmptyState message={error}><Button onClick={() => navigate('/student/mathpath')}>Back to MathPath</Button></EmptyState>;
  if (!questions.length) return <EmptyState message="No generated questions are available yet." />;

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const progress = submitted ? questions.length : idx;
  const expressionQuestion = Boolean(extractFractionExpression(q.prompt || ''));
  const fractionAnswer = !expressionQuestion && expectsFractionAnswer(q);

  const saveAndNext = async () => {
    if (!answer.trim()) return;
    const questionEndedAt = Date.now();
    const timeTaken = Math.max(1, Math.floor((questionEndedAt - questionStartedAt) / 1000));
    const response = {
      variantId: q.variantId,
      answer,
      timeTaken,
      questionStartedAt: new Date(questionStartedAt).toISOString(),
      questionEndedAt: new Date(questionEndedAt).toISOString(),
      timedOut: false,
      skipped: false,
      timestamp: new Date(questionEndedAt).toISOString(),
      attemptNumber: 1,
    };
    const nextResponses = [...responses, response];
    setResponses(nextResponses);
    setAnswer('');
    if (!isLast) {
      setIdx((current) => current + 1);
      return;
    }
    setBusy(true);
    try {
      const { data } = await mathpathAPI.submitSimilarPractice(session.sessionId, { responses: nextResponses });
      setSubmitted(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit practice.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    const wrong = submitted.results.filter((row) => !row.correct);
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Practice Complete" subtitle={practiceSet?.title || 'Similar question practice'} />
        <Card className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><p className="text-sm text-ink-500">Score</p><p className="text-2xl font-semibold text-navy-700">{submitted.summary.scorePct}%</p></div>
            <div><p className="text-sm text-ink-500">Correct</p><p className="text-2xl font-semibold text-success-700">{submitted.summary.correct}/{submitted.summary.total}</p></div>
            <div><p className="text-sm text-ink-500">Status</p><p className="text-base font-semibold text-ink-800">{submitted.summary.masteryStatus}</p></div>
          </div>
          {wrong.length > 0 && (
            <div className="mt-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Mistakes to retry</h2>
              {wrong.map((row) => (
                <div key={row.variantId} className="rounded-xl border border-hairline p-3 text-sm">
                  <div className="font-semibold text-ink-900"><MathText text={row.prompt} /></div>
                  <p className="mt-2 text-error-700">Your answer: {row.studentAnswer || '-'}</p>
                  <p className="text-success-700">Correct answer: {row.correctAnswer}</p>
                  <p className="mt-2 text-ink-600">{row.workedSolution}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => window.location.reload()}>Practise new variants</Button>
            <Button variant="secondary" onClick={() => navigate('/student/mathpath')}>Back to MathPath</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={practiceSet?.title || 'Similar Question Practice'} subtitle={`${practiceSet?.topic || 'Fractions'} · ${practiceSet?.skillId || ''}`} />
      <div className="mb-4 flex items-center justify-between text-sm text-ink-500">
        <span>Question {idx + 1} of {questions.length}</span>
        <span>{q.difficulty}</span>
      </div>
      <ProgressBar value={progress} max={questions.length} className="mb-5" />
      <Card className="p-5">
        {expressionQuestion ? (
          <FractionExpressionQuestion
            prompt={q.prompt}
            value={answer}
            onChange={setAnswer}
            disabled={false}
          />
        ) : (
          <div className="text-lg leading-7 text-ink-900"><MathText text={q.prompt} /></div>
        )}
        {!expressionQuestion && fractionAnswer ? (
          <div className="mt-5">
            <AnswerInputRenderer
              question={{ ...q, answerInputType: 'fraction' }}
              value={answer}
              onChange={setAnswer}
              onEnter={saveAndNext}
            />
          </div>
        ) : !expressionQuestion && (
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="mt-5 w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg"
            placeholder="Type your answer"
          />
        )}
        <Button className="mt-5 w-full" icon={isLast ? Check : ArrowRight} disabled={busy || !answer.trim()} onClick={saveAndNext}>
          {isLast ? 'Submit practice' : 'Next question'}
        </Button>
        {responses.some((r) => r.variantId === q.variantId) && <X className="hidden" />}
      </Card>
    </div>
  );
}
