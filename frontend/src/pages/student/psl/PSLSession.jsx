import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Spinner } from '../../../components/ui';
import StepProgressBar from './components/StepProgressBar';
import StoryPanel from './components/StoryPanel';
import QuestionIdentifier from './components/QuestionIdentifier';
import PlanDispatcher from './components/PlanDispatcher';
import SolveDispatcher from './components/SolveDispatcher';
import CheckPanel from './components/CheckPanel';
import StepFeedbackCard from './components/StepFeedbackCard';
import ReasoningInput from './components/ReasoningInput';
import WorkingCanvas from '../../../components/learning/WorkingCanvas';

const STEP_IDS = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];

const DEFAULT_UNDERSTAND_CHOICES = [
  'It\'s about finding a total or combining groups',
  'It\'s about comparing two quantities',
  'It\'s about finding what\'s left after removing some',
  'It\'s about sharing equally or grouping',
];

function UnderstandStep({ choices, onSelect, selectedIndex }) {
  return <QuestionIdentifier choices={choices?.length ? choices : DEFAULT_UNDERSTAND_CHOICES} selectedIndex={selectedIndex} onSelect={onSelect} />;
}

export default function PSLSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepResponses, setStepResponses] = useState({});
  const [retryCount, setRetryCount] = useState({});
  const [showScratchpad, setShowScratchpad] = useState(false);
  const stepStartRef = useRef(Date.now());

  useEffect(() => { stepStartRef.current = Date.now(); }, [currentStepIdx]);

  useEffect(() => {
    pslAPI.getSession(sessionId)
      .then((res) => {
        const data = res.data;
        setSession(data);
        const problem = data.currentProblem;
        const attempt = data.attempts?.[problem?.problemId];
        if (attempt?.steps?.length) {
          const done = {};
          for (const s of attempt.steps) done[s.stepId] = s;
          setCompletedSteps(done);
          const lastIdx = STEP_IDS.findIndex((id) => !done[id]);
          if (lastIdx >= 0) setCurrentStepIdx(lastIdx);
          else setCurrentStepIdx(STEP_IDS.length - 1);
        }
      })
      .catch(() => navigate('/student/psl'))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  const currentProblem = session?.currentProblem;
  const currentStepId = STEP_IDS[currentStepIdx];
  const totalProblems = session?.summary?.totalProblems || session?.problems?.length || 5;
  const problemIndex = session?.currentProblemIndex || 0;

  const buildResponse = useCallback(() => {
    const resp = stepResponses[currentStepId];
    switch (currentStepId) {
      case 'understand':
        return { selectedIndex: resp?.selectedIndex, reasoning: resp?.reasoning || '' };
      case 'identify_info':
        return { numbers: resp?.numbers || [], reasoning: resp?.reasoning || '' };
      case 'identify_question':
        return { selectedIndex: resp?.selectedIndex, reasoning: resp?.reasoning || '' };
      case 'plan': {
        const planStep = currentProblem?.scaffoldSteps?.find((s) => s.stepId === 'plan');
        const planType = planStep?.type || 'model';
        if (planType === 'model') return { modelType: resp?.modelType, unknownPosition: resp?.unknownPosition, reasoning: resp?.reasoning || '' };
        return { ...(resp || {}), reasoning: resp?.reasoning || '' };
      }
      case 'solve': {
        const solveStep = currentProblem?.scaffoldSteps?.find((s) => s.stepId === 'solve');
        const solveType = solveStep?.type;
        if (solveType === 'expression' || solveType === 'twoStep') {
          return {
            answer: Number(resp?.answer),
            operation: resp?.expression?.match(/[+\-×÷*/]/)?.[0] || '',
            expression: resp?.expression || '',
            intermediates: resp?.step1Answer ? [Number(resp.step1Answer)] : [],
            reasoning: resp?.reasoning || '',
          };
        }
        return { answer: Number(resp?.answer), ...(resp || {}), reasoning: resp?.reasoning || '' };
      }
      case 'check':
        return { reasonable: resp?.reasonable, reasoning: resp?.reasoning || '' };
      default:
        return resp || {};
    }
  }, [currentStepId, stepResponses]);

  const handleSubmitStep = async () => {
    if (submitting || !currentProblem) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await pslAPI.submitStep(sessionId, currentProblem.problemId, {
        stepId: currentStepId,
        response: buildResponse(),
        timeSpentMs: Date.now() - stepStartRef.current,
      });
      const result = res.data;
      setCompletedSteps((prev) => ({ ...prev, [currentStepId]: result }));
      setFeedback(result);

      if (!result.correct && !result.partial && (retryCount[currentStepId] || 0) < 1) {
        setRetryCount((prev) => ({ ...prev, [currentStepId]: (prev[currentStepId] || 0) + 1 }));
      }
    } catch (err) {
      setFeedback({ correct: false, feedback: err.response?.data?.error || 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    setFeedback(null);
    if (currentStepIdx < STEP_IDS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      try {
        const res = await pslAPI.completeProblem(sessionId, currentProblem.problemId);
        if (res.data.hasNextProblem) {
          setSession((prev) => ({
            ...prev,
            currentProblem: res.data.nextProblem,
            currentProblemIndex: res.data.nextProblemIndex,
          }));
          setCurrentStepIdx(0);
          setCompletedSteps({});
          setStepResponses({});
          setRetryCount({});
          setShowScratchpad(false);
        } else {
          await pslAPI.completeSession(sessionId);
          navigate(`/student/psl/results/${sessionId}`);
        }
      } catch {
        navigate(`/student/psl/results/${sessionId}`);
      }
    }
  };

  const updateResponse = (stepId, data) => {
    setStepResponses((prev) => ({ ...prev, [stepId]: { ...prev[stepId], ...data } }));
  };

  const getStepChoices = (stepId) =>
    currentProblem?.scaffoldSteps?.find((s) => s.stepId === stepId)?.choices || [];

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (!currentProblem) return <div className="p-6 text-center text-ink-500">No problem available.</div>;

  const canSubmit = (() => {
    const resp = stepResponses[currentStepId];
    switch (currentStepId) {
      case 'understand': return resp?.selectedIndex !== undefined;
      case 'identify_info': return (resp?.numbers || []).length > 0;
      case 'identify_question': return resp?.selectedIndex !== undefined;
      case 'plan': {
        const planStep = currentProblem?.scaffoldSteps?.find((s) => s.stepId === 'plan');
        const planType = planStep?.type || 'model';
        if (planType === 'model') return resp?.modelType && resp?.unknownPosition;
        return resp && Object.keys(resp).length > 0;
      }
      case 'solve': return resp?.answer !== undefined && resp?.answer !== '';
      case 'check': return resp?.reasonable !== undefined;
      default: return false;
    }
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-400">
          Problem {problemIndex + 1} of {totalProblems}
        </span>
        <StepProgressBar currentStepIdx={currentStepIdx} completedSteps={completedSteps} />
        <button
          type="button"
          onClick={async () => {
            try { await pslAPI.abandonSession(sessionId); } catch {}
            navigate('/student/psl');
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
          aria-label="Exit session"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <StoryPanel
        storyText={currentProblem.storyText}
        highlightMode={currentStepId === 'identify_info'}
        highlightedNumbers={stepResponses.identify_info?.numbers || []}
        onToggleNumber={(num) => {
          const current = stepResponses.identify_info?.numbers || [];
          const next = current.includes(num) ? current.filter((n) => n !== num) : [...current, num];
          updateResponse('identify_info', { numbers: next });
        }}
      />

      <div className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
          Step {currentStepIdx + 1}: {STEP_IDS[currentStepIdx]?.replaceAll('_', ' ')}
        </h3>

        {currentStepId === 'understand' && (
          <UnderstandStep
            choices={getStepChoices('understand')}
            selectedIndex={stepResponses.understand?.selectedIndex}
            onSelect={(idx) => updateResponse('understand', { selectedIndex: idx })}
          />
        )}

        {currentStepId === 'identify_info' && (
          <p className="text-sm text-ink-600">
            Tap the numbers in the story above that you need to solve this problem.
            You have selected <strong>{(stepResponses.identify_info?.numbers || []).length}</strong> number(s).
          </p>
        )}

        {currentStepId === 'identify_question' && (
          <QuestionIdentifier
            choices={getStepChoices('identify_question').length ? getStepChoices('identify_question') : undefined}
            selectedIndex={stepResponses.identify_question?.selectedIndex}
            onSelect={(idx) => updateResponse('identify_question', { selectedIndex: idx })}
          />
        )}

        {currentStepId === 'plan' && (
          <PlanDispatcher
            scaffoldStep={currentProblem.scaffoldSteps?.find((s) => s.stepId === 'plan')}
            response={stepResponses.plan}
            onChange={(val) => updateResponse('plan', val)}
          />
        )}

        {currentStepId === 'solve' && (
          <>
            <SolveDispatcher
              scaffoldStep={currentProblem.scaffoldSteps?.find((s) => s.stepId === 'solve')}
              response={stepResponses.solve || {}}
              onChange={(val) => updateResponse('solve', val)}
            />
            <button
              type="button"
              onClick={() => setShowScratchpad((v) => !v)}
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-ink-200 px-3 py-2 text-xs font-medium text-ink-500 transition-colors hover:border-ink-300 hover:bg-ink-50 hover:text-ink-600"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Scratchpad</span>
              {showScratchpad ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showScratchpad && (
              <div className="mt-2">
                <WorkingCanvas
                  questionId={`${session?.sessionId}-${problemIndex}-solve`}
                  label="Scratchpad"
                  required={false}
                  allowNoWorking={false}
                  compact
                  showMathStamps={false}
                />
              </div>
            )}
          </>
        )}

        {currentStepId === 'check' && (
          <CheckPanel
            answer={stepResponses.solve?.answer}
            selected={stepResponses.check?.reasonable}
            onSelect={(val) => updateResponse('check', { reasonable: val })}
            onGoBack={() => {
              setFeedback(null);
              setCurrentStepIdx(STEP_IDS.indexOf('solve'));
            }}
          />
        )}

        <ReasoningInput
          value={stepResponses[currentStepId]?.reasoning || ''}
          onChange={(val) => updateResponse(currentStepId, { reasoning: val })}
        />
      </div>

      {feedback && (
        <StepFeedbackCard
          correct={feedback.correct}
          partial={feedback.partial}
          feedback={feedback.feedback}
          misconceptionTag={feedback.misconceptionTag}
          onContinue={handleContinue}
        />
      )}

      {!feedback && (
        <button
          type="button"
          onClick={handleSubmitStep}
          disabled={!canSubmit || submitting}
          className="w-full rounded-xl bg-gold-400 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-500 disabled:opacity-40"
        >
          {submitting ? 'Checking...' : 'Check'}
        </button>
      )}
    </div>
  );
}
