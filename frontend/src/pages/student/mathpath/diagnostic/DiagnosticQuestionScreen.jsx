import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Maximize2 } from 'lucide-react';
import { Card, Button, ProgressBar, Spinner, ErrorState } from '../../../../components/ui';
import { MathText } from '../../../../components/ui/Fraction';
import { checkFractionAnswer } from '../../../../mathpath/fractions/fractionQuestionGenerator';
import { repairFractionQuestions } from '../../../../mathpath/fractions/fractionQuestionRepair';
import { mathpathAPI } from '../../../../services/api';
import { shouldUseFractionAnswerInput } from '../components/FractionAnswerInput';
import QuestionDiagram from '../components/QuestionDiagram';
import FractionExpressionQuestion, { extractFractionExpression } from '../components/FractionExpressionQuestion';
import AnswerInputRenderer from '../components/AnswerInputRenderer';
import WorkingCanvas, { resolveWorkingRequirement } from '../../../../components/learning/WorkingCanvas';
import FullScreenWorkingMode from '../../../../components/learning/FullScreenWorkingMode';

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'I know this' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'dont_know', label: "I don't know" },
];
const EMPTY_STROKES = [];

export default function DiagnosticQuestionScreen() {
  const { diagnosticSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [reflection, setReflection] = useState('');
  const [helpRequested, setHelpRequested] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [responses, setResponses] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hydrating, setHydrating] = useState(false);
  const [workingByQuestion, setWorkingByQuestion] = useState({});
  const [fullscreenQuestionId, setFullscreenQuestionId] = useState(null);
  const [showInlineWorking, setShowInlineWorking] = useState(false);

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
    const questionStart = Date.now();
    setStartedAt(questionStart);
    setElapsed(0);
    setShowInlineWorking(false);
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - questionStart) / 1000)), 250);
    return () => clearInterval(t);
  }, [idx, questions.length, session]);

  if (hydrating && (!session || !questions.length)) return <Spinner label="Loading diagnostic…" />;

  if (!session || !questions.length) {
    return <ErrorState message="No diagnostic questions found. Start the diagnostic again." onRetry={() => navigate('/student/mathpath/diagnostic')} />;
  }

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.prompt || q.stem));
  const workingRequirement = resolveWorkingRequirement(q, 'diagnostic');
  const currentWorking = workingByQuestion[q.questionId] || {};
  const workingReady = !workingRequirement.required || currentWorking.workingSubmitted || currentWorking.workingNotNeeded;
  const questionText = q.prompt || q.stem || '';

  const confidenceCalibration = (correct, value) => {
    if (correct && value === 'i_know_this') return 'mastery_signal';
    if (correct && value === 'dont_know') return 'possible_guess';
    if (!correct && value === 'i_know_this') return 'overconfidence';
    if (!correct && value === 'not_sure') return 'student_aware_of_weakness';
    if (!correct && value === 'dont_know') return 'knowledge_gap';
    return correct ? 'low_confidence_correct' : 'needs_review';
  };

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
      questionStartedAt: new Date(startedAt).toISOString(),
      questionEndedAt: new Date().toISOString(),
      timedOut: false,
      confidence: reflection,
      confidenceLevel: reflection,
      reflection,
      helpRequested,
      confidenceCalibration: confidenceCalibration(correctness.correct, reflection),
      possibleMisconception: !correctness.correct && reflection === 'i_know_this',
      workingImage: currentWorking.workingImage || '',
      workingStrokes: currentWorking.workingStrokes || [],
      workingSubmitted: Boolean(currentWorking.workingSubmitted),
      workingSubmittedAt: currentWorking.workingSubmittedAt || null,
      workingNotNeeded: Boolean(currentWorking.workingNotNeeded),
      workingUploaded: Boolean(currentWorking.workingSubmitted),
      timestamp: new Date().toISOString(),
      attemptNumber: 1,
      skipped,
    };
    return [...responses, next];
  };

  const nextQuestion = (skipped = false) => {
    if (!skipped && (!answer || !reflection)) return;
    const nextResponses = saveCurrentAnd(skipped);
    setResponses(nextResponses);
    if (!isLast) {
      setIdx((i) => i + 1);
      setAnswer('');
      setReflection('');
      setHelpRequested(false);
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
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono">Question {idx + 1} of {questions.length}</span>
        <span className="font-mono">{elapsed}s</span>
      </div>
      <ProgressBar value={idx} max={questions.length} className="mb-6" />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)]">
          <section className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Fractions Diagnostic</p>
            <p className="mb-4 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-700">Do not use a calculator for this diagnostic unless your teacher allows it.</p>
            <div className="mb-5 text-lg leading-relaxed text-ink-900">
              {expressionQuestion ? (
                <FractionExpressionQuestion
                  prompt={q.prompt || q.stem}
                  value={answer}
                  onChange={setAnswer}
                  onEnter={() => nextQuestion(false)}
                  disabled={false}
                />
              ) : (
                <MathText text={q.prompt || q.stem} />
              )}
            </div>
            <QuestionDiagram question={q} />
          </section>

          <aside className="min-w-0 rounded-xl bg-slate-50 p-3 sm:p-4">
            <div className="rounded-xl bg-white p-3">
              <label className="mb-2 block text-sm font-semibold text-ink-700">Your answer</label>
              {q.type === 'mcq' ? (
                <div className="grid gap-2">
                  {choices.map((c, i) => (
                    <button key={`${i}-${c}`} onClick={() => setAnswer(c)} className={`rounded-xl border px-4 py-3 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
                      <MathText text={c} />
                    </button>
                  ))}
                </div>
              ) : useFractionInput && !expressionQuestion ? (
                <AnswerInputRenderer
                  question={q}
                  value={answer}
                  onChange={setAnswer}
                  onEnter={() => nextQuestion(false)}
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
            </div>

            <div className="mt-3 rounded-xl border border-hairline bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-800">Working</p>
                  <p className="text-xs text-ink-500">
                    {workingRequirement.required
                      ? 'Required for this question. Use full-screen for more room.'
                      : 'Optional. Use it only if it helps.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="s" variant="secondary" onClick={() => setShowInlineWorking((value) => !value)}>
                    {showInlineWorking ? 'Hide canvas' : 'Show canvas'}
                  </Button>
                  <Button size="s" variant="secondary" icon={Maximize2} onClick={() => setFullscreenQuestionId(q.questionId)}>
                    Open Working
                  </Button>
                </div>
              </div>
              {(currentWorking.workingSubmitted || currentWorking.workingNotNeeded) && (
                <p className="mt-2 rounded-lg bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
                  {currentWorking.workingNotNeeded ? 'Marked as working not needed.' : 'Working saved for this answer.'}
                </p>
              )}
            </div>
            {showInlineWorking && (
              <div className="mt-3">
                <WorkingCanvas
                  key={`diagnostic-working-${q.questionId}`}
                  questionId={q.questionId}
                  required={workingRequirement.required}
                  allowNoWorking={workingRequirement.allowNoWorking}
                  compact
                  showMathStamps={false}
                  submittedImage={currentWorking.workingImage || ''}
                  submittedStrokes={currentWorking.workingStrokes || EMPTY_STROKES}
                  initialSubmitted={Boolean(currentWorking.workingSubmitted)}
                  initialWorkingNotNeeded={Boolean(currentWorking.workingNotNeeded)}
                  onChange={(payload) => setWorkingByQuestion((prev) => ({ ...prev, [q.questionId]: payload }))}
                  onSubmit={(payload) => setWorkingByQuestion((prev) => ({ ...prev, [q.questionId]: payload }))}
                />
              </div>
            )}

            <div className="mt-3 rounded-xl bg-white p-3">
              <label className="mb-2 block text-sm font-semibold text-ink-700">How sure are you?</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {REFLECTION_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setReflection(opt.value)} className={`rounded-lg border px-3 py-2 text-sm ${reflection === opt.value ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-hairline p-3">
                <p className="mb-2 text-sm font-semibold text-ink-700">Do you need help with this type of question?</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setHelpRequested(false)} className={`rounded-lg border px-3 py-2 text-sm ${!helpRequested ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}>No</button>
                  <button type="button" onClick={() => setHelpRequested(true)} className={`rounded-lg border px-3 py-2 text-sm ${helpRequested ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}>Yes, I need help</button>
                </div>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-error-700">{error}</p>}

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => nextQuestion(true)}>Skip</Button>
              <Button icon={ArrowRight} disabled={!answer || !reflection || !workingReady} onClick={() => nextQuestion(false)}>
                {isLast ? 'Submit Diagnostic' : 'Next Question'}
              </Button>
            </div>
          </aside>
        </div>
      </Card>
      <FullScreenWorkingMode
        open={fullscreenQuestionId === q.questionId}
        questionText={questionText}
        questionContent={(
          <div className="space-y-4 text-base">
            <MathText text={questionText} />
            <QuestionDiagram question={q} />
          </div>
        )}
        questionSnapshot={{
          questionId: q.questionId,
          skillId: q.skillId,
          hasDiagram: Boolean(q.diagramSpec || q.diagram || (q.visual?.type === 'svg' && q.visual?.payload?.type)),
          hasVisual: Boolean(q.visual),
          visualType: q.visual?.type || '',
        }}
        initialStrokes={currentWorking.workingStrokes || EMPTY_STROKES}
        onClose={() => setFullscreenQuestionId(null)}
        onSave={(payload) => {
          setWorkingByQuestion((prev) => ({ ...prev, [q.questionId]: payload }));
          setFullscreenQuestionId(null);
        }}
      />
    </div>
  );
}
