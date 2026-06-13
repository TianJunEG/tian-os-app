import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Compass, Pencil, Volume2, X } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Spinner } from '../../../components/ui';
import StepProgressBar from './components/StepProgressBar';
import StoryPanel from './components/StoryPanel';
import QuestionIdentifier from './components/QuestionIdentifier';
import PlanDispatcher from './components/PlanDispatcher';
import SolveDispatcher from './components/SolveDispatcher';
import CheckPanel from './components/CheckPanel';
import StepFeedbackCard from './components/StepFeedbackCard';
import MascotBubble from './components/MascotBubble';
import ReasoningInput from './components/ReasoningInput';
import WorkingCanvas from '../../../components/learning/WorkingCanvas';
import { getVoiceScripts } from './utils/voiceScripts';

const STEP_IDS = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];

const STEP_LABELS = {
  understand: 'Read the story',
  identify_info: 'Find the clues',
  identify_question: 'What are we looking for?',
  plan: 'Make a plan',
  solve: 'Work it out',
  check: 'Does it make sense?',
};

const CTA_LABELS = {
  understand: "I've read it",
  identify_info: 'Next',
  identify_question: 'Next',
  plan: 'Next',
  solve: 'Check answer',
  check: 'Finish',
};

const DEFAULT_UNDERSTAND_CHOICES = [
  'It\'s about finding a total or combining groups',
  'It\'s about comparing two quantities',
  'It\'s about finding what\'s left after removing some',
  'It\'s about sharing equally or grouping',
];

const shellStyle = {
  background: '#f5f6f8',
  border: '1px solid #dde1e8',
  borderRadius: 16,
  boxShadow: '0 20px 44px -30px rgba(30,42,66,0.4)',
  padding: '22px 26px 26px',
};

const actionPanelStyle = {
  background: '#fff',
  border: '1px solid #e7eaef',
  borderRadius: 14,
  padding: 20,
};

const goldCTAStyle = {
  height: 50,
  borderRadius: 12,
  background: '#d9892e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: '#fff',
  fontWeight: 700,
  fontSize: '15.5px',
  marginTop: 16,
  boxShadow: '0 2px 8px rgba(217,137,46,0.35)',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  fontFamily: 'inherit',
};

const pageStyle = {
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  color: '#232c39',
  minHeight: '100vh',
  background: '#e7eaef',
  backgroundImage: 'radial-gradient(#d3d8e0 1px, transparent 1.4px)',
  backgroundSize: '26px 26px',
  padding: '24px 24px 96px',
};

function UnderstandStep({ choices, onSelect, selectedIndex }) {
  return <QuestionIdentifier choices={choices?.length ? choices : DEFAULT_UNDERSTAND_CHOICES} selectedIndex={selectedIndex} onSelect={onSelect} />;
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
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
  }, [currentStepId, stepResponses, currentProblem]);

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

  if (loading) return <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  if (!currentProblem) return <div style={{ padding: 24, textAlign: 'center', color: '#6b7585' }}>No problem available.</div>;

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

  const renderNotebookContent = () => {
    if (currentStepId === 'understand' || currentStepId === 'identify_info') {
      return (
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
      );
    }

    if (currentStepId === 'identify_question') {
      return (
        <StoryPanel storyText="">
          <div style={{ fontSize: 23, fontWeight: 600, color: '#232c39', lineHeight: 1.3, position: 'relative' }}>
            What are we trying to find?
          </div>
          <div style={{ fontSize: 15, color: '#6b7585', marginTop: 12, position: 'relative' }}>
            Pick the question the problem is really asking.
          </div>
        </StoryPanel>
      );
    }

    if (currentStepId === 'plan') {
      const scripts = getVoiceScripts(currentProblem.heuristic, currentProblem.structure, currentProblem.unknownPosition);
      const stepScript = scripts.steps?.[3];
      return (
        <StoryPanel storyText="">
          <div style={{ fontSize: 23, fontWeight: 600, color: '#232c39', lineHeight: 1.3, position: 'relative' }}>
            {stepScript || STEP_LABELS.plan}
          </div>
        </StoryPanel>
      );
    }

    if (currentStepId === 'solve') {
      return (
        <StoryPanel storyText="">
          <div style={{ fontSize: 23, fontWeight: 600, color: '#232c39', lineHeight: 1.3, position: 'relative' }}>
            Work it out
          </div>
        </StoryPanel>
      );
    }

    if (currentStepId === 'check') {
      return (
        <StoryPanel storyText="">
          <div style={{ fontSize: 23, fontWeight: 600, color: '#232c39', lineHeight: 1.3, position: 'relative' }}>
            Does your answer make sense?
          </div>
        </StoryPanel>
      );
    }

    return <StoryPanel storyText={currentProblem.storyText} />;
  };

  const renderActionPanel = () => {
    const scripts = getVoiceScripts(currentProblem.heuristic, currentProblem.structure, currentProblem.unknownPosition);
    const stepIdx = STEP_IDS.indexOf(currentStepId);
    const mascotText = stepIdx >= 0 && stepIdx < 4 ? scripts.steps?.[stepIdx] : null;

    return (
      <div style={actionPanelStyle}>
        {currentStepId === 'understand' && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#232c39' }}>Ready?</div>
            <div style={{ fontSize: 14, color: '#6b7585', lineHeight: 1.55, marginTop: 8 }}>
              Take your time reading. We'll break it down together, one step at a time.
            </div>
          </>
        )}

        {currentStepId === 'identify_info' && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#232c39', marginBottom: 14 }}>Clues found</div>
            {(stepResponses.identify_info?.numbers || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {(stepResponses.identify_info?.numbers || []).map((n) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e7f0ea', background: '#f3faf6', borderRadius: 11, padding: '11px 13px' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#e7f3ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#1f8a5b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <span style={{ fontSize: 14, color: '#46505f' }}><b>{n}</b></span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#6b7585', lineHeight: 1.55 }}>
                Tap the numbers in the story that you need to solve this problem.
              </div>
            )}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#1f8a52', marginTop: 12 }}>
              {(stepResponses.identify_info?.numbers || []).length} clue(s) found
            </div>
          </>
        )}

        {currentStepId === 'identify_question' && (
          <QuestionIdentifier
            choices={getStepChoices('identify_question').length ? getStepChoices('identify_question') : undefined}
            selectedIndex={stepResponses.identify_question?.selectedIndex}
            onSelect={(idx) => updateResponse('identify_question', { selectedIndex: idx })}
          />
        )}

        {currentStepId === 'plan' && (
          <>
            {!completedSteps[currentStepId] && mascotText && <MascotBubble text={mascotText} />}
            <PlanDispatcher
              scaffoldStep={currentProblem.scaffoldSteps?.find((s) => s.stepId === 'plan')}
              response={stepResponses.plan}
              onChange={(val) => updateResponse('plan', val)}
            />
            <a
              href="/student/psl/guide"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#d9892e', marginTop: 12, textDecoration: 'none' }}
            >
              <Compass style={{ width: 14, height: 14 }} />
              Not sure which strategy? Open the Decision Guide
            </a>
          </>
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
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, borderRadius: 8, border: '1px dashed #d3d8e0', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#6b7585', cursor: 'pointer', background: 'none', marginTop: 12, fontFamily: 'inherit' }}
            >
              <Pencil style={{ width: 14, height: 14 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Scratchpad</span>
              {showScratchpad ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            </button>
            {showScratchpad && (
              <div style={{ marginTop: 8 }}>
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

        {currentStepId === 'understand' && !completedSteps[currentStepId] && (
          <UnderstandStep
            choices={getStepChoices('understand')}
            selectedIndex={stepResponses.understand?.selectedIndex}
            onSelect={(idx) => updateResponse('understand', { selectedIndex: idx })}
          />
        )}

        <ReasoningInput
          value={stepResponses[currentStepId]?.reasoning || ''}
          onChange={(val) => updateResponse(currentStepId, { reasoning: val })}
          defaultExpanded={currentStepId === 'understand' || currentStepId === 'plan'}
        />

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
            style={{
              ...goldCTAStyle,
              opacity: (!canSubmit || submitting) ? 0.4 : 1,
              pointerEvents: (!canSubmit || submitting) ? 'none' : 'auto',
            }}
          >
            {submitting ? 'Checking...' : CTA_LABELS[currentStepId] || 'Next'}
            {!submitting && <ChevronRight />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Exit button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            type="button"
            onClick={async () => {
              try { await pslAPI.abandonSession(sessionId); } catch {}
              navigate('/student/psl');
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: '#fff', color: '#6b7585', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
            aria-label="Exit session"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Step shell */}
        <div style={shellStyle}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', color: '#6b7585' }}>
              Problem {problemIndex + 1} of {totalProblems}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', color: currentStepIdx === STEP_IDS.length - 1 ? '#1f8a52' : '#a8743a' }}>
              Step {currentStepIdx + 1} of {STEP_IDS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <StepProgressBar currentStepIdx={currentStepIdx} completedSteps={completedSteps} />
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.62fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* Left: notebook */}
            <div>
              {renderNotebookContent()}
              {currentStepId === 'understand' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
                  border: '1px solid #cfe3f7', borderRadius: 10, padding: '8px 13px',
                  color: '#2f80d8', fontWeight: 600, fontSize: '13.5px', width: 'max-content',
                  marginTop: 12, cursor: 'pointer',
                }}>
                  <Volume2 style={{ width: 18, height: 18 }} />
                  Read aloud
                </div>
              )}
            </div>

            {/* Right: action panel */}
            {renderActionPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}
