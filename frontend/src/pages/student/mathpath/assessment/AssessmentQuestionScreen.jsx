import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flag, X } from 'lucide-react';
import { Card, Button, ProgressBar, ErrorState } from '../../../../components/ui';
import { MathText } from '../../../../components/ui/Fraction';
import { repairFractionQuestions } from '../../../../mathpath/fractions/fractionQuestionRepair';
import { shouldUseFractionAnswerInput } from '../components/FractionAnswerInput';
import QuestionDiagram from '../components/QuestionDiagram';
import FractionExpressionQuestion, { extractFractionExpression } from '../components/FractionExpressionQuestion';
import AnswerInputRenderer from '../components/AnswerInputRenderer';
import QuestionZoomControls from '../components/QuestionZoomControls';
import FullScreenWorkingMode from '../../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../../components/learning/WorkingPreviewCard';
import { hasWorkingDecision, resolveWorkingRequirementLevel } from '../../../../components/learning/WorkingEvidenceDecision';
import SubmissionReviewModal from '../components/SubmissionReviewModal';
import { CONFIDENCE_OPTIONS } from '../../../../mathpath/confidenceOptions';

// Canonical confidence scale shared by every practice surface.
const REFLECTION_OPTIONS = CONFIDENCE_OPTIONS;
const EMPTY_STROKES = [];

export default function AssessmentQuestionScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session;
  const rawQuestions = location.state?.questions || [];
  const questions = useMemo(() => repairFractionQuestions(rawQuestions), [rawQuestions]);
  const sections = location.state?.sections || [];

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [conf, setConf] = useState({});
  const [helpRequests, setHelpRequests] = useState({});
  const [flagged, setFlagged] = useState({});
  const [workings, setWorkings] = useState({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [fullscreenQuestionId, setFullscreenQuestionId] = useState(null);
  const [timeByQuestion, setTimeByQuestion] = useState({});
  const [enteredAt, setEnteredAt] = useState(Date.now());
  const [startedAt] = useState(Date.now());
  const [nowTick, setNowTick] = useState(Date.now());
  const [questionZoom, setQuestionZoom] = useState(1);

  const deadlineMs = useMemo(() => startedAt + ((session?.timeLimitMinutes || 30) * 60 * 1000), [session?.timeLimitMinutes, startedAt]);
  const remainingSec = Math.max(0, Math.floor((deadlineMs - nowTick) / 1000));

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session || !questions.length) {
    return <ErrorState message="No assessment session found. Start assessment again." onRetry={() => navigate('/student/mathpath/assessment')} />;
  }

  const q = questions[idx];
  // Section the current question belongs to (PSLE booklet structure), and whether
  // this question is the first of that section (so we show a section banner once).
  const currentSection = sections.length
    ? (sections.find((s) => s.id === q.sectionId) || sections[Math.max(0, q.sectionIndex || 0)] || null)
    : null;
  const isSectionStart = !!currentSection && (idx === 0 || questions[idx - 1]?.sectionId !== q.sectionId);
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.prompt || q.stem || ''));
  const workingRequirementLevel = resolveWorkingRequirementLevel(q, 'mastery_check');
  const currentWorking = workings[q.questionId] || {};
  const workingReady = hasWorkingDecision(currentWorking);
  const reflectionReady = Boolean(conf[q.questionId]);
  const answerReady = String(answers[q.questionId] || '').trim() !== '';

  const stampTimeForCurrent = () => {
    const elapsed = Math.max(1, Math.floor((Date.now() - enteredAt) / 1000));
    setTimeByQuestion((prev) => ({ ...prev, [q.questionId]: (prev[q.questionId] || 0) + elapsed }));
    setEnteredAt(Date.now());
  };

  const openSubmissionReview = () => {
    if (!answerReady) return;
    setReviewModalOpen(true);
  };

  const confirmSubmissionReview = () => {
    if (!answerReady || !reflectionReady || !workingReady) return;
    setReviewModalOpen(false);
    if (idx === questions.length - 1) {
      toReview();
    } else {
      go(idx + 1);
    }
  };

  const go = (to) => {
    stampTimeForCurrent();
    setIdx(Math.max(0, Math.min(questions.length - 1, to)));
  };

  // In-page exit — the activity shell hides the global nav during the question
  // loop, so a persistent control is the only way out. Confirm first because
  // answers in progress are not yet saved to the server.
  const exitSession = () => {
    const hasWork = Object.keys(answers).length > 0;
    if (hasWork && !window.confirm('Leave the assessment? Your answers will not be saved.')) return;
    navigate('/student/mathpath/assessment');
  };

  const toReview = () => {
    stampTimeForCurrent();
    navigate(`/student/mathpath/assessment/review/${session.assessmentSessionId}`, {
      state: {
        session,
        questions,
        answers,
        conf,
        helpRequests,
        flagged,
        workings,
        timeByQuestion,
        totalTimeSeconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)),
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={exitSession}
          aria-label="Exit assessment"
          className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </div>
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono">Question {idx + 1} of {questions.length}</span>
        <span className="font-mono">Time left: {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, '0')}</span>
      </div>
      <ProgressBar value={Object.keys(answers).length} max={questions.length} className="mb-4" />

      {isSectionStart && (
        <div className="mb-3 rounded-xl border border-navy-200 bg-navy-50 p-3">
          <p className="text-sm font-semibold text-navy-700">{currentSection.name}</p>
          <p className="mt-0.5 text-xs text-navy-600">
            {currentSection.questionCount} question{currentSection.questionCount === 1 ? '' : 's'} · {currentSection.marks} marks · {currentSection.calculatorAllowed ? 'Calculator allowed' : 'Calculator not allowed'}
          </p>
          {currentSection.instructions && <p className="mt-1 text-xs text-navy-600">{currentSection.instructions}</p>}
        </div>
      )}

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Marks: {q.marks || 1}</p>
          <QuestionZoomControls value={questionZoom} onChange={setQuestionZoom} />
          <p className="text-xs text-ink-500">{(currentSection ? currentSection.calculatorAllowed : session.calculatorAllowed) ? 'Calculator is allowed for this section.' : 'Calculator is not allowed for this section.'}</p>
        </div>
        <div className="origin-top-left" style={{ zoom: questionZoom }}>
          <div className="mb-3 text-lg text-ink-900">
          {expressionQuestion ? (
            <FractionExpressionQuestion
              prompt={q.prompt || q.stem}
              value={answers[q.questionId] || ''}
              onChange={(value) => setAnswers((p) => ({ ...p, [q.questionId]: value }))}
              onEnter={() => {
                openSubmissionReview();
              }}
              disabled={false}
            />
          ) : (
            <MathText text={q.prompt || q.stem} />
          )}
        </div>
        <QuestionDiagram question={q} />
        </div>

        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => (
              <button key={`${i}-${c}`} onClick={() => setAnswers((p) => ({ ...p, [q.questionId]: c }))} className={`rounded-xl border px-3 py-2 text-left ${answers[q.questionId] === c ? 'border-emerald bg-emerald-tint' : 'border-line-soft hover:bg-emerald-tint'}`}>
                <MathText text={c} />
              </button>
            ))}
          </div>
        ) : useFractionInput && !expressionQuestion ? (
          <AnswerInputRenderer
            question={q}
            value={answers[q.questionId] || ''}
            onChange={(value) => setAnswers((p) => ({ ...p, [q.questionId]: value }))}
            onEnter={() => {
              openSubmissionReview();
            }}
          />
        ) : (
          <AnswerInputRenderer
            question={q}
            value={answers[q.questionId] || ''}
            onChange={(value) => setAnswers((p) => ({ ...p, [q.questionId]: value }))}
            onEnter={() => {
              openSubmissionReview();
            }}
          />
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => go(idx - 1)} disabled={idx === 0}>Previous</Button>
          <Button variant="secondary" icon={Flag} onClick={() => setFlagged((p) => ({ ...p, [q.questionId]: !p[q.questionId] }))}>
            {flagged[q.questionId] ? 'Unflag' : 'Flag'}
          </Button>
          {idx === questions.length - 1 ? (
            <Button icon={ArrowRight} disabled={!answerReady} onClick={openSubmissionReview}>Review & Submit</Button>
          ) : (
            <Button icon={ArrowRight} disabled={!answerReady} onClick={openSubmissionReview}>Next</Button>
          )}
        </div>

          <div className="mt-2">
            <WorkingPreviewCard
            workingImage={currentWorking.workingImage || ''}
            workingSubmitted={Boolean(currentWorking.workingSubmitted)}
            onOpen={() => setFullscreenQuestionId(q.questionId)}
            onRemove={currentWorking.workingSubmitted ? () => setWorkings((prev) => {
              const next = { ...prev };
              delete next[q.questionId];
              return next;
            }) : null}
          />
        </div>
      </Card>
      <FullScreenWorkingMode
        open={fullscreenQuestionId === q.questionId}
        questionText={q.prompt || q.stem || ''}
        questionContent={(
          <div className="space-y-4 text-base">
            <MathText text={q.prompt || q.stem || ''} />
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
          setWorkings((prev) => ({
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
        reflection={conf[q.questionId] || ''}
        reflectionOptions={REFLECTION_OPTIONS}
        onReflectionChange={(value) => {
          setConf((prev) => ({ ...prev, [q.questionId]: value }));
          setHelpRequests((prev) => ({ ...prev, [q.questionId]: value === 'need_help' }));
        }}
        working={currentWorking}
        workingRequirementLevel={workingRequirementLevel}
        onDeclareNotNeeded={(checked) => setWorkings((prev) => ({
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
        onDeclareOnPaper={(checked) => setWorkings((prev) => ({
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
        confirmLabel={idx === questions.length - 1 ? 'Review & Submit' : 'Next'}
        onConfirm={confirmSubmissionReview}
        onClose={() => setReviewModalOpen(false)}
        busy={false}
        canSubmit={() => Boolean(answerReady && conf[q.questionId] && workingReady)}
      />
    </div>
  );
}
