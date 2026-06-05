import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { Card, Button, ProgressBar, ErrorState } from '../../../../components/ui';
import { MathText } from '../../../../components/ui/Fraction';
import { repairFractionQuestions } from '../../../../mathpath/fractions/fractionQuestionRepair';
import { shouldUseFractionAnswerInput } from '../components/FractionAnswerInput';
import QuestionDiagram from '../components/QuestionDiagram';
import FractionExpressionQuestion, { extractFractionExpression } from '../components/FractionExpressionQuestion';
import AnswerInputRenderer from '../components/AnswerInputRenderer';
import WorkingCanvas, { resolveWorkingRequirement } from '../../../../components/learning/WorkingCanvas';
import WorkingEvidenceDecision, {
  hasWorkingDecision,
  resolveWorkingRequirementLevel,
} from '../../../../components/learning/WorkingEvidenceDecision';

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'I know this' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'dont_know', label: "I don't know" },
  { value: 'need_help', label: 'I need help' },
];
const EMPTY_STROKES = [];

export default function AssessmentQuestionScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session;
  const rawQuestions = location.state?.questions || [];
  const questions = useMemo(() => repairFractionQuestions(rawQuestions), [rawQuestions]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [conf, setConf] = useState({});
  const [helpRequests, setHelpRequests] = useState({});
  const [flagged, setFlagged] = useState({});
  const [workings, setWorkings] = useState({});
  const [timeByQuestion, setTimeByQuestion] = useState({});
  const [enteredAt, setEnteredAt] = useState(Date.now());
  const [startedAt] = useState(Date.now());
  const [nowTick, setNowTick] = useState(Date.now());

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
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.prompt || q.stem || ''));
  const workingRequirement = resolveWorkingRequirement(q, 'mastery_check');
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

  const go = (to) => {
    stampTimeForCurrent();
    setIdx(Math.max(0, Math.min(questions.length - 1, to)));
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
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono">Question {idx + 1} of {questions.length}</span>
        <span className="font-mono">Time left: {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, '0')}</span>
      </div>
      <ProgressBar value={Object.keys(answers).length} max={questions.length} className="mb-5" />

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Marks: {q.marks || 1}</p>
          <p className="text-xs text-ink-500">{session.calculatorAllowed ? 'Calculator is allowed for this assessment.' : 'Calculator is not allowed for this assessment.'}</p>
        </div>
        <div className="mb-4 text-lg text-ink-900">
          {expressionQuestion ? (
            <FractionExpressionQuestion
              prompt={q.prompt || q.stem}
              value={answers[q.questionId] || ''}
              onChange={(value) => setAnswers((p) => ({ ...p, [q.questionId]: value }))}
              onEnter={() => {
                if (workingReady && reflectionReady) go(idx + 1);
              }}
              disabled={false}
            />
          ) : (
            <MathText text={q.prompt || q.stem} />
          )}
        </div>
        <QuestionDiagram question={q} />

        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => (
              <button key={`${i}-${c}`} onClick={() => setAnswers((p) => ({ ...p, [q.questionId]: c }))} className={`rounded-xl border px-4 py-3 text-left ${answers[q.questionId] === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
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
              if (workingReady && reflectionReady) go(idx + 1);
            }}
          />
        ) : (
          <AnswerInputRenderer
            question={q}
            value={answers[q.questionId] || ''}
            onChange={(value) => setAnswers((p) => ({ ...p, [q.questionId]: value }))}
            onEnter={() => {
              if (workingReady && reflectionReady) go(idx + 1);
            }}
          />
        )}

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-ink-700">How sure are you?</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REFLECTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setConf((prev) => ({ ...prev, [q.questionId]: opt.value }));
                  setHelpRequests((prev) => ({ ...prev, [q.questionId]: opt.value === 'need_help' }));
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  conf[q.questionId] === opt.value
                    ? 'border-navy-500 bg-navy-50 text-navy-800'
                    : 'border-hairline text-ink-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <WorkingCanvas
            key={`assessment-working-${q.questionId}`}
            questionId={q.questionId}
            required={workingRequirement.required}
            allowNoWorking={workingRequirement.allowNoWorking}
            submittedImage={currentWorking.workingImage || ''}
            submittedStrokes={currentWorking.workingStrokes || EMPTY_STROKES}
            initialSubmitted={Boolean(currentWorking.workingSubmitted)}
            initialWorkingNotNeeded={Boolean(currentWorking.workingNotNeeded)}
            onChange={(payload) => setWorkings((prev) => ({
              ...prev,
              [q.questionId]: {
                ...(prev[q.questionId] || {}),
                ...payload,
              },
            }))}
            onSubmit={(payload) => setWorkings((prev) => ({
              ...prev,
              [q.questionId]: {
                ...(prev[q.questionId] || {}),
                ...payload,
              },
            }))}
          />
        </div>

        <div className="mt-4 rounded-lg border border-hairline p-3">
          <WorkingEvidenceDecision
            working={currentWorking}
            requirementLevel={workingRequirementLevel}
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
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => go(idx - 1)} disabled={idx === 0}>Previous</Button>
          <Button variant="secondary" icon={Flag} onClick={() => setFlagged((p) => ({ ...p, [q.questionId]: !p[q.questionId] }))}>
            {flagged[q.questionId] ? 'Unflag' : 'Flag'}
          </Button>
          {idx === questions.length - 1 ? (
            <Button icon={ArrowRight} disabled={!answerReady || !workingReady || !reflectionReady} onClick={toReview}>Review & Submit</Button>
          ) : (
            <Button icon={ArrowRight} disabled={!answerReady || !workingReady || !reflectionReady} onClick={() => go(idx + 1)}>Next</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
