import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, Button, ProgressBar, Spinner, ErrorState } from '../../../../components/ui';
import { MathText } from '../../../../components/ui/Fraction';
import { checkFractionAnswer } from '../../../../mathpath/fractions/fractionQuestionGenerator';
import { repairFractionQuestions } from '../../../../mathpath/fractions/fractionQuestionRepair';
import { mathpathAPI } from '../../../../services/api';
import FractionAnswerInput, { shouldUseFractionAnswerInput } from '../components/FractionAnswerInput';
import QuestionDiagram from '../components/QuestionDiagram';
import FractionExpressionQuestion, { extractFractionExpression } from '../components/FractionExpressionQuestion';

const CONFIDENCE_OPTIONS = ['Very Confident', 'Confident', 'Unsure', 'Guessing'];

export default function DiagnosticQuestionScreen() {
  const { diagnosticSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState('Confident');
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [responses, setResponses] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hydrating, setHydrating] = useState(false);

  const [session, setSession] = useState(location.state?.session || null);
  const [questions, setQuestions] = useState(() => repairFractionQuestions(location.state?.questions || []));

  useEffect(() => {
    let mounted = true;
    if (session && questions.length) return () => { mounted = false; };
    (async () => {
      setHydrating(true);
      try {
        const { data } = await mathpathAPI.getDiagnostic(diagnosticSessionId);
        if (!mounted) return;
        const q = data?.questions || [];
        if (!q.length) return;
        setSession((prev) => prev || {
          sessionId: data.sessionId,
          mode: data.mode,
          studentLevel: data.studentLevel,
        });
        setQuestions(repairFractionQuestions(q));
      } finally {
        if (mounted) setHydrating(false);
      }
    })();
    return () => { mounted = false; };
  }, [diagnosticSessionId, session, questions.length]);

  useEffect(() => {
    if (!questions.length || !session) return;
    setStartedAt(Date.now());
    setElapsed(0);
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(t);
  }, [idx, questions.length, startedAt, session]);

  if (hydrating && (!session || !questions.length)) return <Spinner label="Loading diagnostic…" />;

  if (!session || !questions.length) {
    return <ErrorState message="No diagnostic questions found. Start the diagnostic again." onRetry={() => navigate('/student/mathpath/diagnostic')} />;
  }

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.prompt || q.stem));

  const saveCurrentAnd = (skipped) => {
    const timeTaken = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    const correctness = skipped
      ? { correct: false }
      : checkFractionAnswer({
          studentAnswer: answer,
          correctAnswer: q.answer,
          acceptedAnswers: q.acceptedAnswers || [],
        });
    const next = {
      questionId: q.questionId,
      skillId: q.skillId,
      questionFamilyId: q.questionFamilyId,
      studentAnswer: skipped ? '' : answer,
      correct: correctness.correct,
      timeTaken,
      confidence,
      attemptNumber: 1,
      skipped,
    };
    return [...responses, next];
  };

  const nextQuestion = (skipped = false) => {
    if (!skipped && !answer) return;
    const nextResponses = saveCurrentAnd(skipped);
    setResponses(nextResponses);
    if (!isLast) {
      setIdx((i) => i + 1);
      setAnswer('');
      setConfidence('Confident');
      setStartedAt(Date.now());
      return;
    }
    submitDiagnostic(nextResponses);
  };

  const submitDiagnostic = async (finalResponses) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await mathpathAPI.submitDiagnostic(session.sessionId || diagnosticSessionId, {
        responses: finalResponses,
      });
      navigate(`/student/mathpath/diagnostic/results/${session.sessionId || diagnosticSessionId}`, {
        replace: true,
        state: { result: data, session, studentLevel: location.state?.studentLevel, mode: location.state?.mode },
      });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Diagnostic submission failed. Please restart.');
      setBusy(false);
    }
  };

  if (busy) return <Spinner label="Scoring diagnostic…" />;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono">Question {idx + 1} of {questions.length}</span>
        <span className="font-mono">{elapsed}s</span>
      </div>
      <ProgressBar value={idx} max={questions.length} className="mb-6" />

      <Card className="p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Fractions Diagnostic</p>
        <p className="mb-1 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-700">Do not use a calculator for this diagnostic unless your teacher allows it.</p>
        {q.workingRequired && (
          <p className="mb-4 rounded-lg bg-gold-100 px-3 py-2 text-xs text-gold-900">
            Do your working on paper. You may be asked to upload working after the session.
          </p>
        )}
        <div className="mb-5">
          {expressionQuestion ? (
            <FractionExpressionQuestion
              prompt={q.prompt || q.stem}
              value={answer}
              onChange={setAnswer}
              onEnter={() => nextQuestion(false)}
              disabled={false}
            />
          ) : (
            <div className="text-lg text-ink-900"><MathText text={q.prompt || q.stem} /></div>
          )}
        </div>
        <QuestionDiagram question={q} />

        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => (
              <button key={`${i}-${c}`} onClick={() => setAnswer(c)} className={`rounded-xl border px-4 py-3 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
                <MathText text={c} />
              </button>
            ))}
          </div>
        ) : useFractionInput && !expressionQuestion ? (
          <FractionAnswerInput
            value={answer}
            onChange={setAnswer}
            onEnter={() => nextQuestion(false)}
            allowWhole={q.answerInputType === 'mixed' || q.answer?.type === 'mixed'}
          />
        ) : (
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg"
            onKeyDown={(e) => { if (e.key === 'Enter') nextQuestion(false); }}
          />
        )}

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-ink-700">Confidence</label>
          <div className="grid grid-cols-2 gap-2">
            {CONFIDENCE_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => setConfidence(opt)} className={`rounded-lg border px-3 py-2 text-sm ${confidence === opt ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-error-700">{error}</p>}

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => nextQuestion(true)}>Skip</Button>
          <Button icon={ArrowRight} disabled={!answer} onClick={() => nextQuestion(false)}>
            {isLast ? 'Submit Diagnostic' : 'Next Question'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
