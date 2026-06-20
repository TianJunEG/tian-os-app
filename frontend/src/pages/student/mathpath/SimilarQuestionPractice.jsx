import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Button, Card, EmptyState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import FractionExpressionQuestion, { extractFractionExpression } from './components/FractionExpressionQuestion';
import AnswerInputRenderer from './components/AnswerInputRenderer';
import QuestionDiagram from './components/QuestionDiagram';
import WorkingCanvas, { resolveWorkingRequirement } from '../../../components/learning/WorkingCanvas';
import { hasWorkingDecision, resolveWorkingRequirementLevel } from '../../../components/learning/WorkingEvidenceDecision';
import SubmissionReviewModal from './components/SubmissionReviewModal';
import { getUniversalSkillByFrameworkId } from '../../../mathpath/curriculum';

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'I know this' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'dont_know', label: "I don't know" },
];
const EMPTY_STROKES = [];

function skillLabel(skillId = '') {
  return getUniversalSkillByFrameworkId(String(skillId || '').toUpperCase())?.title || '';
}

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
  const [reflection, setReflection] = useState('');
  const [helpRequested, setHelpRequested] = useState(false);
  const [responses, setResponses] = useState([]);
  const [submitted, setSubmitted] = useState(null);
  const [busy, setBusy] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [workingByQuestion, setWorkingByQuestion] = useState({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

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
  const workingRequirement = resolveWorkingRequirement(q, 'practice');
  const workingRequirementLevel = resolveWorkingRequirementLevel(q, 'practice');
  const currentWorking = workingByQuestion[q.variantId] || {};
  const workingReady = hasWorkingDecision(currentWorking);

  const saveAndNext = async () => {
    if (!answer.trim() || !reflection || !workingReady) return;
    const questionEndedAt = Date.now();
    const timeTaken = Math.max(1, Math.floor((questionEndedAt - questionStartedAt) / 1000));
    const response = {
      variantId: q.variantId,
      answer,
      answerCorrect: null,
      confidence: reflection,
      reflection,
      helpRequested,
      timeTaken,
      questionStartedAt: new Date(questionStartedAt).toISOString(),
      questionEndedAt: new Date(questionEndedAt).toISOString(),
      timedOut: false,
      skipped: false,
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
      timestamp: new Date(questionEndedAt).toISOString(),
      attemptNumber: 1,
    };
    const nextResponses = [...responses, response];
    setResponses(nextResponses);
    setAnswer('');
    setReflection('');
    setHelpRequested(false);
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

  const openReviewModal = () => {
    if (!answer.trim()) return;
    setReviewModalOpen(true);
  };

  // In-page exit — the activity shell hides the global nav during the question
  // loop. Confirm first when there is unsaved work (answered questions not yet
  // submitted, or an answer in the current question).
  const exitSession = () => {
    const hasWork = responses.length > 0 || answer.trim() !== '';
    if (hasWork && !window.confirm('Leave this practice? Your progress will not be saved.')) return;
    navigate('/student/mathpath');
  };

  const confirmReview = () => {
    if (!answer.trim() || !reflection || !workingReady) return;
    setReviewModalOpen(false);
    saveAndNext();
  };

  if (submitted) {
    const wrong = submitted.results.filter((row) => !row.correct);
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Practice Complete" subtitle={practiceSet?.title || 'Similar question practice'} />
        <Card className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><p className="text-sm text-ink-500">Score</p><p className="text-2xl font-semibold text-emerald-deep">{submitted.summary.scorePct}%</p></div>
            <div><p className="text-sm text-ink-500">Correct</p><p className="text-2xl font-semibold text-success-700">{submitted.summary.correct}/{submitted.summary.total}</p></div>
            <div><p className="text-sm text-ink-500">Status</p><p className="text-base font-semibold text-ink-800">{submitted.summary.masteryStatus}</p></div>
          </div>
          {wrong.length > 0 && (
            <div className="mt-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Mistakes to retry</h2>
              {wrong.map((row) => (
                <div key={row.variantId} className="rounded-xl border border-line-soft p-3 text-sm">
                  <div className="font-semibold text-ink-900"><MathText text={row.prompt} /></div>
                  <p className="mt-2 text-error-700">Your answer: <MathText text={row.studentAnswer || '-'} /></p>
                  <p className="text-success-700">Correct answer: <MathText text={row.correctAnswer || '-'} /></p>
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
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={exitSession}
          aria-label="Exit practice"
          className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </div>
      <PageHeader title={practiceSet?.title || 'Similar Question Practice'} subtitle={[practiceSet?.topic || 'Fractions', skillLabel(practiceSet?.skillId)].filter(Boolean).join(' · ')} />
      <div className="mb-4 flex items-center justify-between text-sm text-ink-500">
        <span>Question {idx + 1} of {questions.length}</span>
        <span>{q.difficulty}</span>
      </div>
      <ProgressBar value={progress} max={questions.length} className="mb-5" />
      <Card className="p-5">
        {/* Visual-required variants (e.g. "what fraction is shaded") must show the
            model. QuestionDiagram renders the diagram when one is available and a
            friendly "couldn't load" card when a required visual is missing — so a
            Try-Again retry is never served as an impossible text-only question. */}
        <QuestionDiagram question={q} />
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
              onEnter={openReviewModal}
            />
          </div>
        ) : !expressionQuestion && (
          <div className="mt-5">
            <AnswerInputRenderer
              question={q}
              value={answer}
              onChange={setAnswer}
              onEnter={openReviewModal}
            />
          </div>
        )}
        <WorkingCanvas
          key={`similar-working-${q.variantId}`}
          questionId={q.variantId}
          required={workingRequirement.required}
          allowNoWorking={workingRequirement.allowNoWorking}
          submittedImage={currentWorking.workingImage || ''}
          submittedStrokes={currentWorking.workingStrokes || EMPTY_STROKES}
          initialColumnGrid={currentWorking.workingColumnGrid || null}
          initialMathSteps={currentWorking.workingSteps || null}
          initialSubmitted={Boolean(currentWorking.workingSubmitted)}
          initialWorkingNotNeeded={Boolean(currentWorking.workingNotNeeded)}
          onChange={(payload) => setWorkingByQuestion((prev) => ({
            ...prev,
            [q.variantId]: {
              ...(prev[q.variantId] || {}),
              ...payload,
            },
          }))}
          onSubmit={(payload) => setWorkingByQuestion((prev) => ({
            ...prev,
            [q.variantId]: {
              ...(prev[q.variantId] || {}),
              ...payload,
            },
          }))}
        />
        <Button className="mt-5 w-full" icon={isLast ? Check : ArrowRight} disabled={busy || !answer.trim()} onClick={openReviewModal}>
          {isLast ? 'Submit practice' : 'Next question'}
        </Button>
        {responses.some((r) => r.variantId === q.variantId) && <X className="hidden" />}
      </Card>
      <SubmissionReviewModal
        open={reviewModalOpen}
        title="Review this submission"
        reflection={reflection}
        reflectionOptions={REFLECTION_OPTIONS}
        onReflectionChange={setReflection}
        working={currentWorking}
        workingRequirementLevel={workingRequirementLevel}
        onDeclareNotNeeded={(checked) => setWorkingByQuestion((prev) => ({
          ...prev,
          [q.variantId]: {
            ...(prev[q.variantId] || {}),
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
        onOpenWorking={null}
        confirmLabel={isLast ? 'Submit practice' : 'Next question'}
        onConfirm={confirmReview}
        onClose={() => setReviewModalOpen(false)}
        busy={busy}
        canSubmit={() => Boolean(answer.trim() && reflection && workingReady)}
      />
    </div>
  );
}
