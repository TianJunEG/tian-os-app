import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, Button, ProgressBar, Spinner, ErrorState } from '../../../../components/ui';
import { MathText } from '../../../../components/ui/Fraction';
import { checkFractionAnswer } from '../../../../mathpath/fractions/fractionQuestionGenerator';
import { repairFractionQuestions } from '../../../../mathpath/fractions/fractionQuestionRepair';
import { mathpathAPI } from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../../design-os/studentVisualMode';
import { shouldUseFractionAnswerInput } from '../components/FractionAnswerInput';
import QuestionDiagram, { DIAGRAM_LOAD_ERROR_MESSAGE, validateQuestionDiagram } from '../components/QuestionDiagram';
import FractionExpressionQuestion, { extractFractionExpression } from '../components/FractionExpressionQuestion';
import AnswerInputRenderer from '../components/AnswerInputRenderer';
import QuestionZoomControls from '../components/QuestionZoomControls';
import { resolveWorkingRequirement } from '../../../../components/learning/WorkingCanvas';
import FullScreenWorkingMode from '../../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../../components/learning/WorkingPreviewCard';
import {
  hasWorkingDecision,
  resolveWorkingRequirementLevel,
} from '../../../../components/learning/WorkingEvidenceDecision';
import SubmissionReviewModal from '../components/SubmissionReviewModal';

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'I know this 100%' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'dont_know', label: "I don't know" },
  { value: 'i_need_help', label: 'I need help' },
];
const EMPTY_STROKES = [];

function buildWorkingEvidence(working = {}) {
  if (Array.isArray(working.workingEvidence) && working.workingEvidence.length) {
    return working.workingEvidence;
  }
  if (!working.workingSubmitted && !working.fullscreenWorkingSubmitted) return [];
  return [{
    source: working.fullscreenWorkingSubmitted ? 'fullscreen_working' : 'working_canvas',
    image: working.fullscreenWorkingImage || working.workingImage || '',
    strokes: working.fullscreenWorkingStrokes || working.workingStrokes || [],
    mathObjects: working.fullscreenWorkingMathObjects || working.workingMathObjects || [],
    submittedAt: working.fullscreenWorkingSubmittedAt || working.workingSubmittedAt || new Date().toISOString(),
  }];
}

export default function DiagnosticQuestionScreen() {
  const { diagnosticSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [reflection, setReflection] = useState('');
  const [helpRequested, setHelpRequested] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [responses, setResponses] = useState([]);
  const [adaptiveProgress, setAdaptiveProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hydrating, setHydrating] = useState(false);
  const [workingByQuestion, setWorkingByQuestion] = useState({});
  const [fullscreenQuestionId, setFullscreenQuestionId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [questionZoom, setQuestionZoom] = useState(1);

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
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - questionStart) / 1000)), 250);
    return () => clearInterval(t);
  }, [idx, questions.length, session]);

  if (hydrating && (!session || !questions.length)) return <Spinner label="Loading diagnostic…" />;

  if (!session || !questions.length) {
    return <ErrorState message="No diagnostic questions found. Start the diagnostic again." onRetry={() => navigate('/student/mathpath/diagnostic')} />;
  }

  const q = questions[idx];
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.prompt || q.stem));
  const workingRequirement = resolveWorkingRequirement(q, 'diagnostic');
  const workingRequirementLevel = resolveWorkingRequirementLevel(q, 'diagnostic');
  const currentWorking = workingByQuestion[q.questionId] || {};
  const workingReady = hasWorkingDecision(currentWorking);
  const questionText = q.prompt || q.stem || '';
  const currentQuestionValidation = validateQuestionDiagram(q);

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
      answer: skipped ? '' : answer,
      answerCorrect: correctness.correct,
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
      workingMathObjects: currentWorking.workingMathObjects || [],
      workingSubmitted: Boolean(currentWorking.workingSubmitted),
      workingSubmittedAt: currentWorking.workingSubmittedAt || null,
      workingNotNeeded: Boolean(currentWorking.workingNotNeeded),
      workingRequirementLevel,
      workingUploaded: Boolean(currentWorking.workingSubmitted),
      fullscreenWorkingImage: currentWorking.fullscreenWorkingImage || '',
      fullscreenWorkingStrokes: currentWorking.fullscreenWorkingStrokes || [],
      fullscreenWorkingMathObjects: currentWorking.fullscreenWorkingMathObjects || [],
      fullscreenWorkingSubmitted: Boolean(currentWorking.fullscreenWorkingSubmitted),
      fullscreenWorkingSubmittedAt: currentWorking.fullscreenWorkingSubmittedAt || null,
      workingEvidence: buildWorkingEvidence(currentWorking),
      timestamp: new Date().toISOString(),
      attemptNumber: 1,
      skipped,
    };
    return [...responses, next];
  };

  const nextQuestion = async (skipped = false) => {
    if (busy) return;
    if (!skipped && (!answer || !reflection || !workingReady)) return;
    const nextResponses = saveCurrentAnd(skipped);
    setResponses(nextResponses);
    setBusy(true);
    setError('');
    try {
      const timeTakenMs = Math.max(1000, Date.now() - startedAt);
      const { data } = await mathpathAPI.answerDiagnostic(session.sessionId || diagnosticSessionId, {
        questionId: q.questionId,
        questionFamilyId: q.questionFamilyId,
        answer: skipped ? '' : answer,
        confidence: skipped ? (reflection || 'dont_know') : reflection,
        timeTakenMs,
        skipped,
        blankAnswer: skipped || !String(answer || '').trim(),
        workingSubmitted: Boolean(currentWorking.workingSubmitted),
        workingSubmittedAt: currentWorking.workingSubmittedAt || null,
        workingImage: currentWorking.workingImage || '',
        workingStrokes: currentWorking.workingStrokes || [],
        workingNotNeeded: Boolean(currentWorking.workingNotNeeded),
        workingRequirementLevel,
        workingMathObjects: currentWorking.workingMathObjects || [],
        workingUploaded: Boolean(currentWorking.workingSubmitted),
        fullscreenWorkingSubmitted: Boolean(currentWorking.fullscreenWorkingSubmitted),
        fullscreenWorkingImage: currentWorking.fullscreenWorkingImage || '',
        fullscreenWorkingStrokes: currentWorking.fullscreenWorkingStrokes || [],
        fullscreenWorkingMathObjects: currentWorking.fullscreenWorkingMathObjects || [],
        fullscreenWorkingSubmittedAt: currentWorking.fullscreenWorkingSubmittedAt || null,
        workingEvidence: buildWorkingEvidence(currentWorking),
        attempts: 1,
      });
      setAdaptiveProgress(data.progress || null);
      if (data.sessionComplete) {
        navigate(`/student/mathpath/diagnostic/results/${session.sessionId || diagnosticSessionId}`, {
          replace: true,
          state: { result: data.result || data, session, studentLevel: location.state?.studentLevel, mode: location.state?.mode },
        });
        return;
      }
      if (data.nextQuestion) {
        const repaired = repairFractionQuestions([data.nextQuestion])[0] || data.nextQuestion;
        setQuestions((prev) => [...prev.slice(0, idx + 1), repaired]);
        setIdx((i) => i + 1);
        setAnswer('');
        setReflection('');
        setHelpRequested(false);
        setStartedAt(Date.now());
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Diagnostic answer failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const openSubmissionReview = () => {
    if (!answer.trim()) return;
    setReviewModalOpen(true);
  };

  const confirmSubmissionReview = () => {
    if (!answer.trim() || !reflection || !workingReady || busy) return;
    setReviewModalOpen(false);
    nextQuestion(false);
  };

  return (
    <div className={`mx-auto max-w-7xl ${visualStyles.page}`}>
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono">Question {idx + 1}{adaptiveProgress?.estimatedQuestionCount ? ` of about ${adaptiveProgress.estimatedQuestionCount}` : ''}</span>
        <span className="font-mono">{elapsed}s</span>
      </div>
      <ProgressBar value={adaptiveProgress?.answeredCount || idx} max={adaptiveProgress?.estimatedQuestionCount || Math.max(questions.length, 1)} className="mb-4" barClassName={visualStyles.progress} />

      <Card className={`overflow-hidden p-3 sm:p-4 xl:h-[calc(100vh-18rem)] xl:min-h-[30rem] ${visualStyles.accentCard}`}>
        {!currentQuestionValidation.ok ? (
          <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 text-sm text-ink-700">
            <p className="font-semibold text-navy-700">{DIAGRAM_LOAD_ERROR_MESSAGE}</p>
            <p className="mt-1 text-ink-500">This visual diagnostic question needs a diagram before it can be answered.</p>
            <Button className="mt-4" onClick={() => nextQuestion(true)} disabled={busy}>
              Try another question
            </Button>
          </div>
        ) : (
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
          <section className="min-w-0 min-h-0 xl:overflow-y-auto xl:pr-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Fractions Diagnostic</p>
              <QuestionZoomControls value={questionZoom} onChange={setQuestionZoom} />
            </div>
            <p className="mb-3 rounded-lg bg-navy-50 px-3 py-1.5 text-xs text-navy-700">Do not use a calculator for this diagnostic unless your teacher allows it.</p>
            <div className="origin-top-left" style={{ zoom: questionZoom }}>
            <div className="mb-3 text-lg leading-relaxed text-ink-900">
              {expressionQuestion ? (
                <FractionExpressionQuestion
                  prompt={q.prompt || q.stem}
                  value={answer}
                  onChange={setAnswer}
                  onEnter={openSubmissionReview}
                  disabled={false}
                />
              ) : (
                <MathText text={q.prompt || q.stem} />
              )}
            </div>
            <QuestionDiagram question={q} />
            </div>
          </section>

          <aside className="min-w-0 min-h-0 rounded-xl bg-slate-50 p-2 xl:h-full xl:overflow-y-auto">
            <div className="rounded-xl bg-white p-2 sm:p-3">
              <label className="mb-2 block text-sm font-semibold text-ink-700">Your answer</label>
              {q.type === 'mcq' ? (
                <div className="grid gap-2">
                  {choices.map((c, i) => (
                    <button key={`${i}-${c}`} onClick={() => setAnswer(c)} className={`rounded-xl border px-3 py-2 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
                      <MathText text={c} />
                    </button>
                  ))}
                </div>
              ) : useFractionInput && !expressionQuestion ? (
                <AnswerInputRenderer
                  question={q}
                  value={answer}
                  onChange={setAnswer}
                  onEnter={openSubmissionReview}
                />
              ) : (
                <AnswerInputRenderer
                  question={q}
                  value={answer}
                  onChange={setAnswer}
                  onEnter={openSubmissionReview}
                />
              )}
            </div>

            <div className="mt-2 rounded-xl border border-hairline bg-white p-2">
              <WorkingPreviewCard
                workingImage={currentWorking.workingImage || ''}
                workingSubmitted={Boolean(currentWorking.workingSubmitted)}
                onOpen={() => setFullscreenQuestionId(q.questionId)}
                onRemove={currentWorking.workingSubmitted ? () => setWorkingByQuestion((prev) => {
                  const next = { ...prev };
                  delete next[q.questionId];
                  return next;
                }) : null}
              />
            </div>

            {error && <p className="mt-2 text-sm text-error-700">{error}</p>}

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => nextQuestion(true)}>Skip</Button>
              <Button icon={ArrowRight} disabled={busy || !answer.trim()} onClick={openSubmissionReview}>
                {busy ? 'Checking…' : 'Next Question'}
              </Button>
            </div>
          </aside>
        </div>
        )}
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
        initialMathObjects={currentWorking.workingMathObjects || []}
        onClose={() => setFullscreenQuestionId(null)}
        onSave={(payload) => {
          setWorkingByQuestion((prev) => ({
            ...prev,
            [q.questionId]: {
              ...(prev[q.questionId] || {}),
              ...payload,
              workingNotNeeded: false,
              workingNotNeededAt: null,
              fullscreenWorkingImage: payload.workingImage || '',
              fullscreenWorkingStrokes: payload.workingStrokes || EMPTY_STROKES,
              fullscreenWorkingMathObjects: payload.workingMathObjects || [],
              fullscreenWorkingSubmitted: Boolean(payload.workingSubmitted),
              fullscreenWorkingSubmittedAt: payload.workingSubmittedAt || new Date().toISOString(),
              workingImage: payload.workingImage || '',
              workingStrokes: payload.workingStrokes || [],
              workingMathObjects: payload.workingMathObjects || [],
            },
          }));
          setFullscreenQuestionId(null);
        }}
      />
      <SubmissionReviewModal
        open={reviewModalOpen}
        title="Review your response"
        reflection={reflection}
        reflectionOptions={REFLECTION_OPTIONS}
        onReflectionChange={(value) => { setReflection(value); setHelpRequested(value === 'i_need_help'); }}
        working={currentWorking}
        workingRequirementLevel={workingRequirementLevel}
        onDeclareNotNeeded={(checked) => setWorkingByQuestion((prev) => ({
          ...prev,
          [q.questionId]: {
            ...(prev[q.questionId] || {}),
            workingSubmitted: false,
            workingSubmittedAt: null,
            workingImage: '',
            workingStrokes: [],
            workingMathObjects: [],
            fullscreenWorkingImage: '',
            fullscreenWorkingStrokes: [],
            fullscreenWorkingMathObjects: [],
            fullscreenWorkingSubmitted: false,
            fullscreenWorkingSubmittedAt: null,
            workingEvidence: [],
            workingNotNeeded: checked,
            workingNotNeededAt: checked ? new Date().toISOString() : null,
          },
        }))}
        onDeclareOnPaper={(checked) => setWorkingByQuestion((prev) => ({
          ...prev,
          [q.questionId]: {
            ...(prev[q.questionId] || {}),
            workingSubmitted: false,
            workingSubmittedAt: null,
            workingImage: '',
            workingStrokes: [],
            workingMathObjects: [],
            fullscreenWorkingImage: '',
            fullscreenWorkingStrokes: [],
            fullscreenWorkingMathObjects: [],
            fullscreenWorkingSubmitted: false,
            fullscreenWorkingSubmittedAt: null,
            workingEvidence: [],
            workingOnPaper: checked,
            workingOnPaperAt: checked ? new Date().toISOString() : null,
            workingNotNeeded: false,
            workingNotNeededAt: null,
          },
        }))}
        onOpenWorking={() => setFullscreenQuestionId(q.questionId)}
        confirmLabel="Next Question"
        onConfirm={confirmSubmissionReview}
        onClose={() => setReviewModalOpen(false)}
        busy={busy}
        canSubmit={() => Boolean(answer.trim() && reflection && workingReady)}
      />
  </div>
  );
}
