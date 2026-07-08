import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Compass, Flame, HelpCircle, Pencil, Volume2, X } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import StepProgressBar from './components/StepProgressBar';
import StoryPanel from './components/StoryPanel';
import QuestionIdentifier from './components/QuestionIdentifier';
import PlanDispatcher from './components/PlanDispatcher';
import SolveDispatcher from './components/SolveDispatcher';
import BarModelViewer from './components/BarModelViewer';
import CheckPanel from './components/CheckPanel';

// Adapt the bar model the student built in the Plan step (parts:[{label,value}])
// into the flat shape BarModelViewer reads, so the Solve step can show it as a
// read-only reference while they work.
function barViewerValues(plan = {}) {
  const parts = Array.isArray(plan.parts) ? plan.parts : [];
  const num = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));
  if (plan.modelType === 'comparison') {
    const larger = num(parts[0]?.value);
    const smaller = num(parts[1]?.value);
    return {
      larger, smaller,
      difference: Number.isFinite(larger) && Number.isFinite(smaller) ? Math.abs(larger - smaller) : undefined,
    };
  }
  const v = {};
  ['partA', 'partB', 'partC'].forEach((key, i) => { const n = num(parts[i]?.value); if (n !== undefined) v[key] = n; });
  return v;
}
import StepFeedbackCard from './components/StepFeedbackCard';
import MascotBubble from './components/MascotBubble';
import HintLadder from './components/HintLadder';
import ReasoningInput from './components/ReasoningInput';
import WorkedSolutionWalkthrough from './components/WorkedSolutionWalkthrough';
import FullScreenWorkingMode from '../../../components/learning/FullScreenWorkingMode';
import { Card, Button, Spinner } from '../../../components/ui';
import { getVoiceScripts } from './utils/voiceScripts';
import { confettiBurst } from '../../../utils/confetti';
import { playCorrect, playWin, isVoiceEnabled, setVoiceEnabled, speak } from '../../../utils/sound';
import { getMascotVoice } from '../../../config/mascots';

const STEP_IDS = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];

const STEP_LABELS = {
  understand: "What's the story about?",
  identify_info: 'Find the clues',
  identify_question: 'What are we looking for?',
  plan: 'Make a plan',
  solve: 'Work it out',
  check: 'Does it make sense?',
};

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
  const [scratchByProblem, setScratchByProblem] = useState({}); // { [problemIndex]: { workingStrokes, workingMathObjects } } — ephemeral, retained across reopens
  const [streak, setStreak] = useState(0);
  const [hints, setHints] = useState([]);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintExhausted, setHintExhausted] = useState(false);
  const [hintError, setHintError] = useState(false);
  const [showHintLadder, setShowHintLadder] = useState(false);
  const [voice, setVoice] = useState(isVoiceEnabled);
  const [solution, setSolution] = useState(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState(false);
  const stepStartRef = useRef(Date.now());

  useEffect(() => {
    stepStartRef.current = Date.now();
    setHints([]);
    setHintExhausted(false);
    setShowHintLadder(false);
    setSolution(null);
  }, [currentStepIdx]);

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
        if (planType === 'model') return { modelType: resp?.modelType, unknownPosition: resp?.unknownPosition, parts: resp?.parts, reasoning: resp?.reasoning || '' };
        return { ...(resp || {}), reasoning: resp?.reasoning || '' };
      }
      case 'solve': {
        const solveStep = currentProblem?.scaffoldSteps?.find((s) => s.stepId === 'solve');
        const solveType = solveStep?.type;
        if (solveType === 'expression' || solveType === 'twoStep') {
          // Parse the result of each number sentence (the value after its last
          // "=") into `intermediates`, so a correct intermediate step — e.g.
          // "49×2=98" when the final answer is 147−98=49 — is recognised and
          // credited, instead of the working being scored "used wrong numbers".
          // The SolvePanel emits `sentences`; older inputs used `step1Answer`.
          const sentenceResults = (Array.isArray(resp?.sentences) ? resp.sentences : [])
            .map((s) => {
              const tail = String(s).split('=').pop() || '';
              const m = tail.match(/-?\d+(\.\d+)?/);
              return m ? Number(m[0]) : null;
            })
            .filter((v) => v != null && Number.isFinite(v));
          return {
            answer: Number(resp?.answer),
            operation: resp?.expression?.match(/[+\-×÷*/]/)?.[0] || '',
            expression: resp?.expression || '',
            intermediates: sentenceResults.length ? sentenceResults : (resp?.step1Answer ? [Number(resp.step1Answer)] : []),
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
      // Don't celebrate on Solve — the very next step (Check) asks the student to
      // verify the answer makes sense, so a "Well done!" here pre-empts that
      // reflection. Praise is held back until the Check step.
      if (currentStepId === 'solve' && result.correct) {
        result.feedback = 'Good — now check whether your answer makes sense.';
      }
      setCompletedSteps((prev) => ({ ...prev, [currentStepId]: result }));
      setFeedback(result);

      if (result.correct) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        playCorrect();
        if (currentStepId === 'check') {
          confettiBurst({ count: 80, duration: 1400 });
          playWin();
        } else if (nextStreak >= 3 && nextStreak % 3 === 0) {
          confettiBurst({ count: 60, duration: 1200 });
        }
      } else {
        setStreak(0);
      }

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
          setStreak(0);
          setHints([]);
          setHintExhausted(false);
          setSolution(null);
        } else {
          await pslAPI.completeSession(sessionId);
          navigate(`/student/psl/results/${sessionId}`);
        }
      } catch {
        navigate(`/student/psl/results/${sessionId}`);
      }
    }
  };

  const handleRequestHint = async () => {
    if (hintLoading || !currentProblem) return;
    if (hints.length > 0) { setShowHintLadder(true); return; }
    setHintError(false);
    setHintLoading(true);
    try {
      const collected = [];
      let exhausted = false;
      while (!exhausted && collected.length < 3) {
        const res = await pslAPI.getHint(sessionId, currentProblem.problemId, currentStepId);
        if (res.data.hint) {
          const h = res.data.hint;
          collected.push(typeof h === 'string' ? { title: '', text: h } : h);
        }
        exhausted = res.data.exhausted;
      }
      if (collected.length > 0) { setHints(collected); setShowHintLadder(true); }
      if (exhausted) setHintExhausted(true);
    } catch {
      setHintError(true);
    }
    setHintLoading(false);
  };

  const updateResponse = (stepId, data) => {
    setStepResponses((prev) => ({ ...prev, [stepId]: { ...prev[stepId], ...data } }));
  };

  const handleShowSolution = async () => {
    if (solutionLoading || solution || !currentProblem) return;
    setSolutionError(false);
    setSolutionLoading(true);
    try {
      const res = await pslAPI.getSolution(sessionId, currentProblem.problemId);
      setSolution(res.data);
    } catch {
      setSolution(null);
      setSolutionError(true);
    } finally {
      setSolutionLoading(false);
    }
  };

  const wrongCount = Object.values(completedSteps).filter((s) => !s.correct && !s.partial).length;
  const canShowSolution = wrongCount >= 2 && !solution;

  const getStepChoices = (stepId) =>
    currentProblem?.scaffoldSteps?.find((s) => s.stepId === stepId)?.choices || [];

  if (loading) return <Spinner label="Loading session…" />;
  if (!currentProblem) return <div className="p-6 text-center text-ink-500">No problem available.</div>;

  const canSubmit = (() => {
    const resp = stepResponses[currentStepId];
    switch (currentStepId) {
      case 'understand': return resp?.selectedIndex !== undefined;
      case 'identify_info': {
        const expectedCount = currentProblem?.scaffoldSteps?.find((s) => s.stepId === 'identify_info')?.expectedCount || 2;
        return (resp?.numbers || []).length >= expectedCount;
      }
      case 'identify_question': return resp?.selectedIndex !== undefined;
      case 'plan': {
        const planStep = currentProblem?.scaffoldSteps?.find((s) => s.stepId === 'plan');
        const planType = planStep?.type || 'model';
        if (planType === 'model') return resp?.modelType && resp?.unknownPosition;
        if (planType === 'ratioBar') return Number.isFinite(Number(resp?.ratioBar?.valuePerPart));
        return resp && Object.keys(resp).length > 0;
      }
      case 'solve': return resp?.answer !== undefined && resp?.answer !== '';
      case 'check': return resp?.reasonable !== undefined;
      default: return false;
    }
  })();

  const STEP_SHORT_LABELS = ['Read', 'Clues', 'Question', 'Plan', 'Solve', 'Check'];

  const pslScripts = getVoiceScripts(currentProblem.heuristic, currentProblem.structure, currentProblem.unknownPosition);

  // Narration script for a given step. Steps 0-3 use their dedicated script;
  // solve (4) and check (5) fall back to the answer-stage script so they also
  // narrate — matching MathPath practice's read-aloud parity.
  const scriptForStep = (stepId) => {
    const idx = STEP_IDS.indexOf(stepId);
    if (idx < 0) return null;
    if (idx < 4) return pslScripts.steps?.[idx] || null;
    return pslScripts.answer || null;
  };

  const voiceScript = completedSteps[currentStepId] ? null : scriptForStep(currentStepId);

  // On-demand read-aloud: force-enable voice (so speak() isn't gated off), then
  // speak the story text + the current step's prompt/label using Lejo's voice.
  // speak() cancels any in-flight utterance first, so this won't double up with
  // the MascotBubble narration above.
  const handleReadAloud = () => {
    if (!voice) { setVoice(true); setVoiceEnabled(true); }
    const story = currentProblem.storyText || '';
    const prompt = scriptForStep(currentStepId) || STEP_LABELS[currentStepId] || '';
    const toRead = [story, prompt].filter(Boolean).join('. ');
    if (toRead) speak(toRead, getMascotVoice('lejo'));
  };

  const renderNotebookContent = () => {
    switch (currentStepId) {
      case 'understand':
      case 'identify_question':
        return (
          <StoryPanel
            storyText={currentProblem.storyText}
            highlightMode={false}
          />
        );
      case 'identify_info':
        return (
          <StoryPanel
            storyText={currentProblem.storyText}
            highlightMode
            highlightedNumbers={stepResponses.identify_info?.numbers || []}
            onToggleNumber={(num) => {
              const current = stepResponses.identify_info?.numbers || [];
              const next = current.includes(num) ? current.filter((n) => n !== num) : [...current, num];
              updateResponse('identify_info', { numbers: next });
            }}
          />
        );
      case 'plan':
        return (
          <>
            <StoryPanel storyText={currentProblem.storyText} highlightMode={false} />
            <div className="mt-4">
              <PlanDispatcher
                scaffoldStep={currentProblem.scaffoldSteps?.find((s) => s.stepId === 'plan')}
                response={stepResponses.plan}
                onChange={(val) => updateResponse('plan', val)}
              />
            </div>
          </>
        );
      case 'solve':
        return (
          <>
            <div className="mb-4 rounded-card border border-line bg-surface-raised p-3">
              <p className="text-sm leading-relaxed text-body">{currentProblem.storyText}</p>
            </div>
            {(currentProblem.scaffoldSteps?.find((s) => s.stepId === 'plan')?.type || 'model') === 'model' && stepResponses.plan?.modelType && (
              <div className="mb-4">
                <p className="mb-1.5 text-xs font-medium text-ink-400">Your bar model</p>
                <BarModelViewer
                  modelType={stepResponses.plan.modelType}
                  unknownPosition={stepResponses.plan.unknownPosition}
                  values={barViewerValues(stepResponses.plan)}
                />
              </div>
            )}
            <SolveDispatcher
              scaffoldStep={currentProblem.scaffoldSteps?.find((s) => s.stepId === 'solve')}
              response={stepResponses.solve || {}}
              onChange={(val) => updateResponse('solve', val)}
            />
            <button
              type="button"
              onClick={() => setShowScratchpad(true)}
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-ink-200 px-3 py-2 text-xs font-medium text-ink-500 transition-colors hover:border-ink-300 hover:bg-ink-50 hover:text-ink-600"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Open scratchpad</span>
            </button>
          </>
        );
      case 'check':
        return (
          <div className="space-y-4">
            <StoryPanel storyText={currentProblem.storyText} highlightMode={false} />
            <ReasoningInput
              value={stepResponses.check?.reasoning || ''}
              onChange={(val) => updateResponse('check', { reasoning: val })}
              defaultExpanded
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionPanel = () => {
    switch (currentStepId) {
      case 'understand':
        return (
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-lg font-bold text-ink">Ready?</h4>
              <p className="mt-1 text-sm text-body">
                Take your time reading. We'll break it down together, one step at a time.
              </p>
            </div>
            <UnderstandStep
              choices={getStepChoices('understand')}
              selectedIndex={stepResponses.understand?.selectedIndex}
              onSelect={(idx) => updateResponse('understand', { selectedIndex: idx })}
            />
          </div>
        );
      case 'identify_info': {
        const nums = stepResponses.identify_info?.numbers || [];
        const expected = currentProblem?.scaffoldSteps?.find((s) => s.stepId === 'identify_info')?.expectedCount || 2;
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-body">
              Tap the numbers in the story that you need to solve this problem.
            </p>
            {nums.map((n, i) => (
              <div key={i} className="flex items-center gap-2 rounded-btn border border-emerald-border bg-emerald-tint p-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald text-white">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                <span className="font-mono font-bold text-ink">{n}</span>
              </div>
            ))}
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald">
              {nums.length} of {expected} clues found
            </p>
          </div>
        );
      }
      case 'identify_question':
        return (
          <QuestionIdentifier
            choices={getStepChoices('identify_question').length ? getStepChoices('identify_question') : undefined}
            selectedIndex={stepResponses.identify_question?.selectedIndex}
            onSelect={(idx) => updateResponse('identify_question', { selectedIndex: idx })}
          />
        );
      case 'plan':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-body">
              Choose the right strategy and operation for this problem.
            </p>
            <a
              href="/student/psl/decision-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-gold-deep hover:text-gold-deep"
            >
              <Compass className="h-3.5 w-3.5" />
              Not sure? Open the Decision Guide
            </a>
          </div>
        );
      case 'solve':
        return (
          <div className="flex flex-col gap-3">
            <h4 className="text-base font-bold text-ink">Your answer</h4>
            <p className="text-xs text-body-muted">
              Stuck? Tap the helper for a hint.
            </p>
          </div>
        );
      case 'check':
        return (
          <CheckPanel
            answer={stepResponses.solve?.answer}
            selected={stepResponses.check?.reasonable}
            onSelect={(val) => updateResponse('check', { reasonable: val })}
            onGoBack={() => {
              setFeedback(null);
              setCurrentStepIdx(STEP_IDS.indexOf('solve'));
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1180px]">
          {/* Header meta row */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-body-muted">
                Problem {problemIndex + 1} of {totalProblems}
              </span>
              {streak >= 2 && (
                <span className="inline-flex animate-bounce items-center gap-1 rounded-pill bg-gold-tint px-2 py-0.5 text-[10px] font-bold text-gold-deep" style={{ animationDuration: '1s', animationIterationCount: 1 }}>
                  <Flame className="h-3 w-3" />
                  {streak}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {currentStepIdx < STEP_IDS.indexOf('solve') && (
                <button
                  type="button"
                  onClick={() => { setFeedback(null); setCurrentStepIdx(STEP_IDS.indexOf('solve')); }}
                  className="flex items-center gap-1 rounded-btn px-2 py-1 text-xs font-medium text-gold-deep transition hover:bg-gold-tint"
                  aria-label="Skip to solving"
                >
                  <span>Skip to solving</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                </button>
              )}
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-gold-deep sm:inline">
                Step {currentStepIdx + 1} of {STEP_IDS.length}
              </span>
              <button
                type="button"
                onClick={handleReadAloud}
                className={`flex h-8 items-center justify-center gap-1 rounded-pill border px-2.5 transition ${voice ? 'border-gold-tint text-gold-deep' : 'border-line text-body-faint'}`}
                aria-label="Read this step aloud"
                title="Read aloud"
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden text-xs font-semibold sm:inline">Read aloud</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Exit this session? Your progress on this problem will be lost.')) return;
                  try { await pslAPI.abandonSession(sessionId); } catch {}
                  navigate('/student/psl');
                }}
                className="flex items-center gap-1 rounded-btn px-2 py-1 text-xs font-medium text-body-muted transition hover:bg-line-soft"
                aria-label="Exit session — your progress on this problem will be lost"
                title="Exit session"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>

          {/* Progress bar with labels */}
          <div className="mb-4 sm:mb-5">
            <StepProgressBar currentStepIdx={currentStepIdx} completedSteps={completedSteps} />
            <div className="mt-1.5 hidden sm:flex" style={{ gap: 6 }}>
              {STEP_SHORT_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={`flex-1 text-center font-mono text-[10.5px] tracking-[0.04em] ${i === currentStepIdx ? 'font-semibold text-gold-deep' : i < currentStepIdx ? 'font-medium text-body-muted' : 'font-medium text-body-faint2'}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            {/* Left column — step content */}
            <Card className="p-4 sm:p-6">
              {/* Toolbar row */}
              <div className="mb-4 flex items-center justify-between" style={{ position: 'relative', zIndex: 2 }}>
                {!feedback && !completedSteps[currentStepId] && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="s"
                    icon={HelpCircle}
                    onClick={handleRequestHint}
                    disabled={hintLoading}
                  >
                    {hintLoading ? '...' : hints.length > 0 ? 'Show Hints' : 'Hint'}
                  </Button>
                )}
                {hintError && (
                  <span className="text-xs font-medium text-danger">
                    Couldn't load a hint. Try again.
                  </span>
                )}
              </div>

              {/* Step label */}
              <div className="relative z-[2] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-deep">
                  STEP {currentStepIdx + 1} &middot; {STEP_SHORT_LABELS[currentStepIdx]?.toUpperCase()}
                </span>
              </div>

              {/* Step title */}
              <h2 className="relative z-[2] mb-3 text-lg font-semibold leading-snug text-ink sm:mb-4 sm:text-[23px]">
                {STEP_LABELS[currentStepId]}
              </h2>

              {/* Step-specific notebook content */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                {voiceScript && <MascotBubble text={voiceScript} />}
                {renderNotebookContent()}
              </div>
            </Card>

            {/* Right column — action panel */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <Card className="p-4 sm:p-5">
                {renderActionPanel()}

                {currentStepId !== 'check' && (
                  <ReasoningInput
                    key={currentStepId}
                    value={stepResponses[currentStepId]?.reasoning || ''}
                    onChange={(val) => updateResponse(currentStepId, { reasoning: val })}
                    defaultExpanded={currentStepId === 'understand' || currentStepId === 'plan'}
                  />
                )}
              </Card>

              {/* Hint Ladder modal */}
              {showHintLadder && hints.length > 0 && (
                <HintLadder
                  hints={hints}
                  onClose={() => setShowHintLadder(false)}
                  onTryAgain={() => setShowHintLadder(false)}
                />
              )}

              {/* Feedback */}
              {feedback && (
                <StepFeedbackCard
                  correct={feedback.correct}
                  partial={feedback.partial}
                  feedback={feedback.feedback}
                  misconceptionTag={feedback.misconceptionTag}
                  workedExample={feedback.workedExample}
                  remediation={feedback.remediation}
                  onContinue={handleContinue}
                />
              )}

              {/* Worked solution */}
              {solution && (
                <WorkedSolutionWalkthrough
                  solutionText={solution.solutionText}
                  visualSpec={solution.visualSpec}
                  heuristic={solution.heuristic}
                  structure={solution.structure}
                  unknownPosition={solution.unknownPosition}
                />
              )}

              {canShowSolution && (
                <Button
                  type="button"
                  variant="secondary"
                  icon={BookOpen}
                  onClick={handleShowSolution}
                  disabled={solutionLoading}
                  className="w-full"
                >
                  {solutionLoading ? 'Loading...' : 'Show me how'}
                </Button>
              )}

              {solutionError && (
                <p className="text-center text-xs font-medium text-danger">
                  Couldn't load the solution. Try again.
                </p>
              )}

              {/* Primary CTA */}
              {!feedback && (
                <Button
                  type="button"
                  onClick={handleSubmitStep}
                  disabled={!canSubmit || submitting}
                  className="w-full"
                >
                  {submitting ? 'Checking...' : currentStepId === 'understand' ? "I've read it" : 'Check'}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </Button>
              )}
            </div>
          </div>
      </div>

      {/* Full-screen scratchpad — shares the MathPath working canvas, so text
          labels are draggable + editable and (Stage 2) the Four Ops grid lives
          here too. Ephemeral: work is kept per-problem only for this sitting. */}
      <FullScreenWorkingMode
        open={showScratchpad}
        questionId={`${session?.sessionId}-${problemIndex}-scratch`}
        questionText={currentProblem?.storyText || ''}
        initialStrokes={(scratchByProblem[problemIndex] || {}).workingStrokes || []}
        initialMathObjects={(scratchByProblem[problemIndex] || {}).workingMathObjects || []}
        onClose={() => setShowScratchpad(false)}
        onSave={(payload) => {
          setScratchByProblem((prev) => ({
            ...prev,
            [problemIndex]: {
              workingStrokes: payload.workingStrokes || [],
              workingMathObjects: payload.workingMathObjects || [],
            },
          }));
          setShowScratchpad(false);
        }}
      />
    </>
  );
}
