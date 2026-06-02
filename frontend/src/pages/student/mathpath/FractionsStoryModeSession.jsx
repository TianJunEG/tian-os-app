import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lightbulb, Map, Sparkles } from 'lucide-react';
import { Button, Card, ProgressBar } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';
import { isFractionsStoryModeEnabled } from '../../../config/featureFlags';
import FractionAnswerInput, { isFractionLikeAnswerValue } from './components/FractionAnswerInput';
import FractionExpressionQuestion, { extractFractionExpression } from './components/FractionExpressionQuestion';
import {
  buildFractionsStorySession,
  evaluateFractionsStorySession,
  evaluateStoryStep,
  getStoryFeedback,
  getStoryStepFeedback,
  FRACTIONS_STORY_SUPPORTED_SKILLS,
} from '../../../mathpath/fractions/fractionStoryModeEngine';
import { setMathPathDomainProgressState, getMathPathDomainProgressState } from '../../../mathpath/state/mathPathDomainProgressState';
import StoryAudioControls from './story/StoryAudioControls';

function StoryFractionBar({ model = {}, showRemainderSubgroups = false }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removed = Math.max(0, Math.min(denominator, Number(model.removed || 0)));
  const remaining = denominator - removed;
  const subdivideBy = Math.max(0, Number(model.subdivideRemainingBy || 0));
  const removedSubparts = Math.max(0, Math.min(subdivideBy || 0, Number(model.removedSubparts || 0)));

  return (
    <div>
      <div className="grid overflow-hidden rounded-lg border border-gold-300 bg-white" style={{ gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))` }}>
        {Array.from({ length: denominator }).map((_, index) => {
          const isRemoved = index < removed;
          return (
            <div
              key={index}
              className={`min-h-[48px] border-r border-gold-200 last:border-r-0 ${isRemoved ? 'bg-[repeating-linear-gradient(135deg,#fee2e2,#fee2e2_5px,#fecaca_5px,#fecaca_10px)]' : 'bg-emerald-50'}`}
            />
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-700">
        <span className="rounded-lg bg-white px-2 py-1 ring-1 ring-hairline">Used: {removed}/{denominator}</span>
        <span className="rounded-lg bg-white px-2 py-1 ring-1 ring-hairline">Left: {remaining}/{denominator}</span>
      </div>
      {showRemainderSubgroups && subdivideBy > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold text-ink-700">Remainder as the new whole</p>
          <div className="grid overflow-hidden rounded-lg border border-navy-200 bg-white" style={{ gridTemplateColumns: `repeat(${subdivideBy}, minmax(0, 1fr))` }}>
            {Array.from({ length: subdivideBy }).map((_, index) => (
              <div
                key={index}
                className={`min-h-[42px] border-r border-navy-100 last:border-r-0 ${index < removedSubparts ? 'bg-gold-200' : 'bg-navy-50'}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-600">
            Second action: {removedSubparts}/{subdivideBy} of the remainder. Final left: {Math.max(0, subdivideBy - removedSubparts)}/{subdivideBy} of the remainder.
          </p>
        </div>
      ) : null}
      {model.knownRemaining ? (
        <p className="mt-2 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-ink-700 ring-1 ring-hairline">
          Known final remainder: {model.knownRemaining}
        </p>
      ) : null}
    </div>
  );
}

function StoryShadedGrid({ model = {} }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removed = Math.max(0, Math.min(denominator, Number(model.removed || 0)));
  const columns = Math.min(4, denominator);
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: denominator }).map((_, index) => (
          <div
            key={index}
            className={`min-h-[36px] rounded-md border border-gold-200 ${index < removed ? 'bg-navy-100' : 'bg-white'}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-600">Shaded: {removed}/{denominator}. Unshaded: {denominator - removed}/{denominator}.</p>
    </div>
  );
}

function StoryNumberLine({ model = {} }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removed = Math.max(0, Math.min(denominator, Number(model.removed || 0)));
  return (
    <div className="py-3">
      <div className="relative h-12">
        <div className="absolute left-0 right-0 top-6 h-1 rounded-full bg-navy-100" />
        {Array.from({ length: denominator + 1 }).map((_, index) => {
          const left = `${(index / denominator) * 100}%`;
          return (
            <div key={index} className="absolute top-2 -translate-x-1/2 text-center" style={{ left }}>
              <div className={`mx-auto h-4 w-1 rounded-full ${index === removed ? 'bg-gold-500' : 'bg-navy-400'}`} />
              <span className="mt-1 block text-[11px] text-ink-600">{index}/{denominator}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-600">Marker shows the first action at {removed}/{denominator}; the rest is the remainder to track.</p>
    </div>
  );
}

function PartWholeCards({ model = {} }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removed = Math.max(0, Math.min(denominator, Number(model.removed || 0)));
  const remaining = denominator - removed;
  const cards = [
    { label: 'Whole', value: `${denominator}/${denominator}` },
    { label: 'Used', value: `${removed}/${denominator}` },
    { label: 'Left', value: `${remaining}/${denominator}` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((item) => (
        <div key={item.label} className="rounded-lg border border-gold-200 bg-white px-2 py-4 text-center">
          <p className="text-xs font-semibold text-ink-500">{item.label}</p>
          <p className="mt-1 text-sm font-semibold text-ink-800">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function VisualHint({ type, model = {} }) {
  const label = String(type || 'fraction_bar').replace(/_/g, ' ');
  return (
    <div className="rounded-xl border border-gold-200 bg-gold-50 p-3" aria-label={`${label} visual hint`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-gold-900">
        <Map className="h-4 w-4" />
        {label}
      </div>
      {type === 'part_whole_cards' ? (
        <PartWholeCards model={model} />
      ) : type === 'number_line' ? (
        <StoryNumberLine model={model} />
      ) : type === 'shaded_grid' ? (
        <StoryShadedGrid model={model} />
      ) : (
        <StoryFractionBar model={model} showRemainderSubgroups={type === 'fraction_bar_remainder'} />
      )}
      <p className="mt-2 text-xs text-ink-500">Use the visual to track the whole, the used part, and what remains.</p>
    </div>
  );
}

function GuidedStepsPanel({ steps = [], activeStep = 0 }) {
  return (
    <details className="rounded-xl border border-hairline bg-white p-3" open>
      <summary className="cursor-pointer text-sm font-semibold text-ink-800">Guided thinking steps</summary>
      <ol className="mt-3 space-y-2">
        {steps.map((step, index) => (
          <li key={`${step}-${index}`} className={`flex gap-2 rounded-lg p-2 text-sm ${index === activeStep ? 'bg-navy-50 text-navy-900' : 'text-ink-600'}`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-navy-700 ring-1 ring-hairline">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export default function FractionsStoryModeSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const studentId = location.state?.studentId || 'demo-student';
  const rawSkillId = String(params.skillId || location.state?.skillId || 'F025').toUpperCase();
  const directSkillInvalid = Boolean(params.skillId) && !FRACTIONS_STORY_SUPPORTED_SKILLS.has(rawSkillId);
  const safeSkillId = FRACTIONS_STORY_SUPPORTED_SKILLS.has(rawSkillId) ? rawSkillId : 'F025';
  const story = useMemo(() => buildFractionsStorySession({ skillId: safeSkillId, studentId }), [safeSkillId, studentId]);
  const scenes = story.sceneItems?.length ? story.sceneItems : story.steps;
  const [sceneIndex, setSceneIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [working, setWorking] = useState('');
  const [responses, setResponses] = useState([]);
  const [attemptsByScene, setAttemptsByScene] = useState({});
  const [sceneFeedback, setSceneFeedback] = useState(null);
  const [sceneComplete, setSceneComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [backendSession, setBackendSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const scene = scenes[sceneIndex];
  const isLast = sceneIndex === scenes.length - 1;
  const attempts = attemptsByScene[sceneIndex] || 0;
  const stepExpectedAnswer = scene?.answer?.display || scene?.answer?.value || scene?.answer || '';
  const needsTextInput = !Array.isArray(scene?.choices);
  const needsFractionInput = needsTextInput && isFractionLikeAnswerValue(stepExpectedAnswer);
  const expressionQuestion = needsTextInput && Boolean(extractFractionExpression(String(scene?.questionText || scene?.prompt || '')));

  if (!isFractionsStoryModeEnabled()) {
    return (
      <div className="mx-auto max-w-xl px-3 pt-3 sm:px-0">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900">Problem Solving Story is not available yet</h2>
          <p className="mt-2 text-sm text-ink-600">Return to MathPath to continue practice.</p>
          <Button className="mt-4" onClick={() => navigate('/student/mathpath', { replace: true })}>Back to MathPath</Button>
        </Card>
      </div>
    );
  }

  if (directSkillInvalid) {
    return (
      <div className="mx-auto max-w-xl px-3 pt-3 sm:px-0">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900">Choose a supported Story Mode skill</h2>
          <p className="mt-2 text-sm text-ink-600">Story Mode currently supports F025 and F026.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button onClick={() => navigate('/student/mathpath/fractions/story/F025', { replace: true })}>Start F025 Story</Button>
            <Button variant="secondary" onClick={() => navigate('/student/mathpath/fractions/story/F026', { replace: true })}>Start F026 Story</Button>
          </div>
        </Card>
      </div>
    );
  }

  const ensureBackendSession = async () => {
    if (backendSession?.sessionId) return backendSession;
    try {
      const { data } = await mathpathAPI.startSession({
        mode: 'story',
        feature: 'Fractions Story Mode',
        skillId: story.skillId,
        questionCount: 1,
      });
      const started = {
        sessionId: data?.session_id || null,
        questionId: data?.items?.[0]?.questionId || null,
      };
      setBackendSession(started);
      return started;
    } catch (_) {
      return null;
    }
  };

  const persistStoryToBackend = async (finalResponses) => {
    try {
      setSubmitting(true);
      const started = await ensureBackendSession();
      if (!started?.sessionId || !started?.questionId) return;
      await mathpathAPI.attempt(started.sessionId, {
        questionId: started.questionId,
        answer: story.answer?.value || '',
        timeMs: Math.max(1000, (finalResponses.length || 1) * 45000),
        hintsUsed: Object.values(attemptsByScene).filter((value) => value > 0).length,
      });
      await mathpathAPI.complete(started.sessionId);
    } finally {
      setSubmitting(false);
    }
  };

  const completeMission = (finalResponses) => {
    const scored = evaluateFractionsStorySession({ story, responses: finalResponses });
    setResult(scored);
    const existing = getMathPathDomainProgressState(studentId, 'fractions') || {};
    const weak = scored.finalCorrect ? [] : [{ skillId: story.skillId, skillName: story.title }];
    setMathPathDomainProgressState(studentId, 'fractions', {
      ...existing,
      lastSessionAt: new Date().toISOString(),
      currentSkillId: story.skillId,
      weakSkills: weak,
    });
    persistStoryToBackend(finalResponses);
  };

  const submitScene = () => {
    if (!scene) return;
    const nextAttempt = attempts + 1;
    const checked = evaluateStoryStep({ step: scene, answer });
    setAttemptsByScene((prev) => ({ ...prev, [sceneIndex]: nextAttempt }));
    const feedback = getStoryStepFeedback({ story, scene, correct: checked.correct || scene.type === 'reflection', attempts: nextAttempt });
    setSceneFeedback(feedback);
    if (!checked.correct && scene.type !== 'reflection') return;
    setSceneComplete(true);
  };

  const goNext = () => {
    const finalResponses = [
      ...responses.filter((r) => r.stepIndex !== sceneIndex),
      { stepIndex: sceneIndex, type: scene.type, answer, working },
    ];
    setResponses(finalResponses);
    if (isLast) {
      completeMission(finalResponses);
      return;
    }
    setSceneIndex((value) => value + 1);
    setAnswer('');
    setWorking('');
    setSceneFeedback(null);
    setSceneComplete(false);
  };

  if (result) {
    const feedback = getStoryFeedback(result);
    return (
      <div className="mx-auto max-w-3xl px-3 pb-28 pt-3 sm:px-0">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-success-700">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Mission Complete</h2>
          </div>
          <p className="text-sm font-semibold text-ink-700">{story.missionTitle}</p>
          <p className="mt-3 text-sm text-ink-700">{feedback.message}</p>
          <div className="mt-4 rounded-xl border border-hairline bg-slate-50 p-3 text-sm text-ink-700">
            <p><span className="font-semibold">Skill:</span> {story.skillId} · {story.title}</p>
            <p><span className="font-semibold">Final answer:</span> {story.answer.display}</p>
            <p><span className="font-semibold">Accuracy:</span> {result.accuracy}%</p>
          </div>
          {submitting ? <p className="mt-2 text-xs text-ink-500">Saving story attempt...</p> : null}
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>Try another mission</Button>
            <Button variant="secondary" onClick={() => navigate('/student/mathpath/path')}>Back to pathway</Button>
            <Button onClick={() => navigate('/student/mathpath/review', { state: { source: 'story', reviewItems: result.stepResults } })}>Review mistake</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-3 pb-28 pt-3 sm:px-0">
      <Card className="mb-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-navy-700">Problem Solving Story</p>
            <h1 className="mt-1 text-xl font-semibold text-ink-900">{story.missionTitle}</h1>
            <p className="mt-1 text-sm text-ink-500">{story.skillId} · {story.title}</p>
          </div>
          <div className="rounded-xl bg-navy-50 px-3 py-2 text-sm font-semibold text-navy-800">
            Scene {sceneIndex + 1} of {scenes.length}
          </div>
        </div>
        <ProgressBar value={sceneIndex + (sceneComplete ? 1 : 0)} max={scenes.length} className="mt-4" />
      </Card>

      <div className="mb-3">
        <StoryAudioControls
          storyText={scene?.sceneNarration || story.prompt}
          stepText={scene?.questionText || ''}
          hintText={scene?.errorHint || story.schemaHint || ''}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
        <main className="space-y-3">
          <Card className="p-5">
            <div className="mb-4 rounded-xl border border-navy-100 bg-navy-50 p-3">
              <p className="text-sm font-semibold text-navy-900">{scene?.sceneTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{scene?.sceneNarration}</p>
              <p className="mt-3 rounded-lg bg-white p-3 text-sm font-medium text-ink-800">{scene?.characterPrompt}</p>
            </div>

            <div className="rounded-xl border border-hairline bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-ink-500">Math challenge</p>
              <p className="mb-3 text-sm text-ink-600">{scene?.mathGoal}</p>
              {expressionQuestion ? (
                <FractionExpressionQuestion prompt={scene?.questionText || ''} value={answer} onChange={setAnswer} />
              ) : (
                <p className="text-lg leading-relaxed text-ink-900">{scene?.questionText}</p>
              )}

              {needsTextInput ? (
                expressionQuestion ? null : needsFractionInput ? (
                  <div className="mt-4">
                    <FractionAnswerInput value={answer} onChange={setAnswer} />
                  </div>
                ) : (
                  <input
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setSceneFeedback(null);
                    }}
                    placeholder="Type your answer"
                    className="mt-4 h-12 w-full rounded-xl border border-hairline px-4 text-base"
                    disabled={sceneComplete}
                  />
                )
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {(scene?.choices || []).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      disabled={sceneComplete}
                      onClick={() => {
                        setAnswer(choice);
                        setSceneFeedback(null);
                      }}
                      className={`min-h-[44px] rounded-xl border px-4 py-3 text-left text-sm ${answer === choice ? 'border-navy-500 bg-navy-50' : 'border-hairline bg-white hover:bg-slate-50'}`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-hairline bg-slate-50 p-4">
              <label className="text-sm font-semibold text-ink-800">Working area</label>
              <textarea
                value={working}
                onChange={(event) => setWorking(event.target.value)}
                placeholder="Write the fraction steps you are trying."
                className="mt-2 min-h-[96px] w-full rounded-xl border border-hairline bg-white p-3 text-sm"
              />
            </div>

            {sceneFeedback ? (
              <div className={`rounded-xl border p-4 text-sm ${sceneFeedback.tone === 'success' ? 'border-success-200 bg-success-50 text-success-800' : 'border-gold-300 bg-gold-100 text-gold-900'}`}>
                <div className="flex gap-2">
                  {sceneFeedback.tone === 'success' ? <Sparkles className="h-5 w-5 shrink-0" /> : <Lightbulb className="h-5 w-5 shrink-0" />}
                  <div>
                    <p className="font-semibold">{sceneFeedback.message}</p>
                    {sceneFeedback.guidedStep ? <p className="mt-2">Focus step: {sceneFeedback.guidedStep}</p> : null}
                    {sceneFeedback.revealSolution && sceneFeedback.workedSolution?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {sceneFeedback.workedSolution.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    ) : null}
                    {sceneComplete ? <p className="mt-2">{scene?.nextSceneUnlockText}</p> : null}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </main>

        <aside className="space-y-3">
          <VisualHint type={scene?.visualHintType} model={scene?.visualModel || story.barModel || {}} />
          <GuidedStepsPanel steps={scene?.guidedSteps || []} activeStep={Math.max(0, attempts - 1)} />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-white/95 p-3 backdrop-blur sm:static sm:mt-3 sm:border-0 sm:bg-transparent sm:p-0">
        {sceneComplete ? (
          <Button className="h-12 w-full" icon={ArrowRight} onClick={goNext}>
            {isLast ? 'Complete mission' : 'Unlock next scene'}
          </Button>
        ) : (
          <Button className="h-12 w-full" icon={ArrowRight} disabled={!String(answer || '').trim()} onClick={submitScene}>
            Check this scene
          </Button>
        )}
      </div>
    </div>
  );
}
