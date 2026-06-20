import React, { useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Volume2, X } from 'lucide-react';
import { speak, setVoiceEnabled } from '../../../../utils/sound';
import { getMascotVoice } from '../../../../config/mascots';
import { Card, Button, ProgressBar, Spinner, ErrorState } from '../../../../components/ui';
import { MathText } from '../../../../components/ui/Fraction';
import { checkFractionAnswer } from '../../../../mathpath/fractions/fractionQuestionGenerator';
import { repairFractionQuestions } from '../../../../mathpath/fractions/fractionQuestionRepair';
import { mathpathAPI, diagnosticsAPI } from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode, isLowerPrimary as checkIsLowerPrimary } from '../../../../design-os/studentVisualMode';
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

// Strip dot-array lines (⬤⬤⬤ + ⬤⬤ = ?) and math noise; keep the numeric line.
function toSpeakable(text = '') {
  return text
    .split('\n')
    .filter((line) => !/^[\s⬤●○+\-×÷=?]+$/.test(line.trim()))
    .join(' ')
    .replace(/[⬤●○]/g, '')
    .replace(/([+])/g, ' plus ')
    .replace(/[−–-]/g, ' minus ')
    .replace(/[×]/g, ' times ')
    .replace(/[÷]/g, ' divided by ')
    .replace(/=/g, ' equals ')
    .replace(/\?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'I know this!', emoji: '😊' },
  { value: 'not_sure', label: 'Not sure', emoji: '🤔' },
  { value: 'dont_know', label: 'Hard', emoji: '😕' },
  { value: 'i_need_help', label: 'Need help', emoji: '🙋' },
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
  const visualMode = resolveStudentVisualMode(user || {});
  const visualStyles = getVisualModeStyles(visualMode);
  const isLowerPrimary = checkIsLowerPrimary(visualMode);
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
    if (isLowerPrimary) {
      // Enable voice so auto-narration is audible (speak() is gated by 'pslVoice').
      setVoiceEnabled(true);
      const readable = toSpeakable(questions[idx]?.prompt || questions[idx]?.stem || '');
      if (readable) speak(readable, getMascotVoice('kylo'));
    }
    return () => {
      clearInterval(t);
      if (isLowerPrimary && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [idx, questions.length, session]); // eslint-disable-line react-hooks/exhaustive-deps

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
  // Enables voice before speaking so the Read button is never silent (speak() is
  // gated by the 'pslVoice' flag). Available to every student, not just lower primary.
  const speakQuestion = useCallback(() => {
    setVoiceEnabled(true);
    const readable = toSpeakable(questionText);
    if (readable) speak(readable, getMascotVoice('kylo'));
  }, [questionText]);

  const confidenceCalibration = (correct, value) => {
    if (correct && value === 'i_know_this') return 'mastery_signal';
    if (correct && value === 'dont_know') return 'possible_guess';
    if (!correct && value === 'i_know_this') return 'overconfidence';
    if (!correct && value === 'not_sure') return 'student_aware_of_weakness';
    if (!correct && value === 'dont_know') return 'knowledge_gap';
    return correct ? 'low_confidence_correct' : 'needs_review';
  };

  const saveCurrentAnd = (skipped, reflectionOverride) => {
    const effectiveReflection = reflectionOverride ?? reflection;
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
      confidence: effectiveReflection,
      confidenceLevel: effectiveReflection,
      reflection: effectiveReflection,
      helpRequested,
      confidenceCalibration: confidenceCalibration(correctness.correct, effectiveReflection),
      possibleMisconception: !correctness.correct && effectiveReflection === 'i_know_this',
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

  const nextQuestion = async (skipped = false, reflectionOverride) => {
    const effectiveReflection = reflectionOverride ?? reflection;
    const workingReadyForSubmit = isLowerPrimary ? true : workingReady;
    if (busy) return;
    if (!skipped && (!answer || !effectiveReflection || !workingReadyForSubmit)) return;
    const nextResponses = saveCurrentAnd(skipped, reflectionOverride);
    setResponses(nextResponses);
    setBusy(true);
    setError('');
    try {
      const timeTakenMs = Math.max(1000, Date.now() - startedAt);
      const { data } = await mathpathAPI.answerDiagnostic(session.sessionId || diagnosticSessionId, {
        questionId: q.questionId,
        questionFamilyId: q.questionFamilyId,
        answer: skipped ? '' : answer,
        confidence: skipped ? (effectiveReflection || 'dont_know') : effectiveReflection,
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

  // Persistent in-page exit. This route renders inside the activity shell, whose
  // nav is hidden on phones, so without this control a student is trapped. On exit
  // we ABANDON the session (progress is discarded); the next entry starts fresh.
  const exitCheckIn = async () => {
    if (typeof window !== 'undefined' && !window.confirm("Exit the check-in? Your progress won't be saved.")) return;
    const sessionId = session?.sessionId || diagnosticSessionId;
    if (sessionId) {
      try {
        await diagnosticsAPI.abandonDiagnostic(sessionId);
      } catch (_) {
        // Best-effort — still navigate away even if the abandon call fails.
      }
    }
    navigate('/student/mathpath');
  };

  const openSubmissionReview = () => {
    if (!answer.trim()) return;
    setReviewModalOpen(true);
  };

  const confirmSubmissionReview = (reflectionOverride) => {
    const workingReadyForSubmit = isLowerPrimary ? true : workingReady;
    const effectiveReflection = reflectionOverride ?? reflection;
    if (!answer.trim() || !effectiveReflection || !workingReadyForSubmit || busy) return;
    setReviewModalOpen(false);
    nextQuestion(false, reflectionOverride);
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
          <div className="rounded-2xl border border-gold-tint bg-gold-tint2 p-5 text-sm text-ink-700">
            <p className="font-semibold text-emerald-deep">{DIAGRAM_LOAD_ERROR_MESSAGE}</p>
            <p className="mt-1 text-ink-500">This visual diagnostic question needs a diagram before it can be answered.</p>
            <Button className="mt-4" onClick={() => nextQuestion(true)} disabled={busy}>
              Try another question
            </Button>
          </div>
        ) : (
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
          <section className="min-w-0 min-h-0 xl:overflow-y-auto xl:pr-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{session?.displayName || 'Maths Diagnostic'}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Read question aloud"
                  onClick={speakQuestion}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-200 active:scale-95 transition"
                >
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  Read
                </button>
                <QuestionZoomControls value={questionZoom} onChange={setQuestionZoom} />
                <button
                  type="button"
                  aria-label="Exit the check-in"
                  onClick={exitCheckIn}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-raised text-ink-500 transition hover:bg-error-100 hover:text-error-700 active:scale-95"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            {!isLowerPrimary && <p className="mb-3 rounded-lg bg-emerald-tint px-3 py-1.5 text-xs text-emerald-deep">Do not use a calculator for this diagnostic unless your teacher allows it.</p>}
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

          <aside className="min-w-0 min-h-0 rounded-xl bg-surface-raised p-2 xl:h-full xl:overflow-y-auto">
            <div className="rounded-xl bg-white p-2 sm:p-3" role="group" aria-labelledby="diagnostic-answer-label">
              <label id="diagnostic-answer-label" className="mb-2 block text-sm font-semibold text-ink-700">Your answer</label>
              {q.type === 'mcq' ? (
                <div className={`grid gap-2 ${isLowerPrimary ? 'grid-cols-2' : ''}`} role="group" aria-label="Choose your answer">
                  {choices.map((c, i) => (
                    <button
                      key={`${i}-${c}`}
                      onClick={() => {
                        if (isLowerPrimary) speak(toSpeakable(c), { rate: 0.85, gender: 'female' });
                        setAnswer(c);
                        if (isLowerPrimary) setTimeout(() => setReviewModalOpen(true), 400);
                      }}
                      className={`rounded-xl border text-left ${isLowerPrimary ? 'px-4 py-5 text-2xl font-bold text-center' : 'px-3 py-2'} ${answer === c ? 'border-emerald bg-emerald-tint' : 'border-line-soft hover:bg-emerald-tint'}`}
                    >
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

            {!isLowerPrimary && (
              <div className="mt-2 rounded-xl border border-line-soft bg-white p-2">
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
            )}

            {error && <p className="mt-2 text-sm text-error-700">{error}</p>}

            {!isLowerPrimary && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => nextQuestion(true)}>Skip</Button>
                <Button icon={ArrowRight} disabled={busy || !answer.trim()} onClick={openSubmissionReview}>
                  {busy ? 'Checking…' : 'Next Question'}
                </Button>
              </div>
            )}
            {isLowerPrimary && q.type !== 'mcq' && (
              <div className="mt-3">
                <Button icon={ArrowRight} className="w-full py-4 text-lg font-bold" disabled={busy || !answer.trim()} onClick={openSubmissionReview}>
                  {busy ? 'Checking…' : <>Next <span aria-hidden="true">➜</span></>}
                </Button>
              </div>
            )}
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
        title={isLowerPrimary ? 'How did that feel?' : 'Review your response'}
        isLowerPrimary={isLowerPrimary}
        reflection={reflection}
        reflectionOptions={REFLECTION_OPTIONS}
        onReflectionChange={setReflection}
        onSelectAndConfirm={(value) => { setReflection(value); confirmSubmissionReview(value); }}
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
        onConfirm={() => confirmSubmissionReview()}
        onClose={() => setReviewModalOpen(false)}
        busy={busy}
        canSubmit={() => Boolean(answer.trim() && reflection && workingReady)}
      />
  </div>
  );
}
