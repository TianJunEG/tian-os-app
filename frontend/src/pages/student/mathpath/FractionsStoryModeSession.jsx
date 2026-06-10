import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lightbulb, Pencil, Sparkles } from 'lucide-react';
import { Button, Card, ProgressBar } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import FractionAnswerInput, { isFractionLikeAnswerValue } from './components/FractionAnswerInput';
import FractionExpressionQuestion, { extractFractionExpression } from './components/FractionExpressionQuestion';
import AnswerInputRenderer from './components/AnswerInputRenderer';
import WorkingCanvas from '../../../components/learning/WorkingCanvas';
import {
  buildFractionsStorySession,
  evaluateFractionsStorySession,
  evaluateStoryStep,
  getStoryFeedback,
  getStoryStepFeedback,
  FRACTIONS_STORY_SUPPORTED_SKILLS,
} from '../../../mathpath/fractions/fractionStoryModeEngine';
import { getUniversalSkillByFrameworkId } from '../../../mathpath/curriculum';
import { setMathPathDomainProgressState, getMathPathDomainProgressState } from '../../../mathpath/state/mathPathDomainProgressState';
import StoryAudioControls from './story/StoryAudioControls';
import { isFractionsStoryModeEnabled } from '../../../config/featureFlags';

function storySkillName(skillId = '') {
  return getUniversalSkillByFrameworkId(String(skillId || '').toUpperCase())?.title || 'Fraction story skill';
}

function StoryFractionBar({ model = {}, showRemainderSubgroups = false }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removed = Math.max(0, Math.min(denominator, Number(model.removed || 0)));
  const remaining = denominator - removed;
  const subdivideBy = Math.max(0, Number(model.subdivideRemainingBy || 0));
  const removedSubparts = Math.max(0, Math.min(subdivideBy || 0, Number(model.removedSubparts || 0)));

  return (
    <div>
      <div className="grid overflow-hidden rounded-2xl border-2 border-navy-200 bg-white shadow-sm" style={{ gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))` }}>
        {Array.from({ length: denominator }).map((_, index) => {
          const isRemoved = index < removed;
          return (
            <div
              key={index}
              className={`min-h-[72px] border-r border-navy-100 last:border-r-0 sm:min-h-[96px] ${isRemoved ? 'bg-blue-200' : 'bg-white'}`}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-ink-700">
        <span className="rounded-xl bg-rose-50 px-3 py-2 ring-1 ring-rose-100">Used {removed}/{denominator}</span>
        <span className="rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">Left {remaining}/{denominator}</span>
      </div>
      {showRemainderSubgroups && subdivideBy > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold text-ink-700">Now use the part that is left.</p>
          <div className="grid overflow-hidden rounded-lg border border-navy-200 bg-white" style={{ gridTemplateColumns: `repeat(${subdivideBy}, minmax(0, 1fr))` }}>
            {Array.from({ length: subdivideBy }).map((_, index) => (
              <div
                key={index}
                className={`min-h-[42px] border-r border-navy-100 last:border-r-0 ${index < removedSubparts ? 'bg-gold-200' : 'bg-navy-50'}`}
              />
            ))}
          </div>
        </div>
      ) : null}
      {model.knownRemaining ? (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink-700 ring-1 ring-hairline">
          The part left is {model.knownRemaining}.
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
            className={`min-h-[54px] rounded-md border border-navy-200 sm:min-h-[72px] ${index < removed ? 'bg-blue-200' : 'bg-white'}`}
          />
        ))}
      </div>
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
              <span className="mt-1 block text-[11px] sm:text-xs text-ink-600">{index}/{denominator}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VisualHint({ type, model = {} }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm" aria-label="Story visual model" data-testid="story-visual-model">
      {type === 'number_line' ? (
        <StoryNumberLine model={model} />
      ) : type === 'shaded_grid' ? (
        <StoryShadedGrid model={model} />
      ) : (
        <StoryFractionBar model={model} showRemainderSubgroups={type === 'fraction_bar_remainder'} />
      )}
    </div>
  );
}

function StoryHints({ hints = [], visibleCount = 0, onReveal }) {
  const visibleHint = hints[Math.max(0, visibleCount - 1)];
  const canRevealMore = visibleCount < Math.min(3, hints.length);
  return (
    <div className="rounded-2xl border border-hairline bg-white p-4">
      <button
        type="button"
        onClick={onReveal}
        disabled={!canRevealMore}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-hairline bg-slate-50 px-4 py-2 text-sm font-semibold text-navy-800 disabled:cursor-default disabled:opacity-60"
      >
        <Lightbulb className="h-4 w-4" />
        {visibleCount === 0 ? 'Need a hint?' : canRevealMore ? 'Show another hint' : 'No more hints'}
      </button>
      {visibleHint ? (
        <p className="mt-3 rounded-xl bg-navy-50 p-3 text-sm font-medium text-navy-900">
          Hint {visibleCount}: {visibleHint}
        </p>
      ) : null}
    </div>
  );
}

function normalizeFeedbackText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function friendlySceneTitle(scene = {}) {
  const titles = {
    read_story: 'Find what matters',
    identify_question: 'Find what matters',
    identify_parts: 'Find the fraction left',
    identify_whole: 'Track what remains',
    choose_strategy: 'Choose a plan',
    choose_operation: 'Choose the operation',
    compute_step: 'Work one step',
    final_answer: 'Final answer',
    reflection: 'Quick reflection',
  };
  return titles[scene.type] || 'Story scene';
}

export default function FractionsStoryModeSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const studentId = location.state?.studentId || user?._id || user?.id || user?.email || '';
  if (!isFractionsStoryModeEnabled()) {
    return (
      <div className="mx-auto max-w-xl px-3 pt-3 sm:px-0">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900">Story Mode is not available for this pilot yet</h2>
          <p className="mt-2 text-sm text-ink-600">Continue learning in MathPath. Guided story missions will return after pilot QA.</p>
          <Button className="mt-4" onClick={() => navigate('/student/mathpath', { replace: true })}>Back to MathPath</Button>
        </Card>
      </div>
    );
  }
  const rawSkillId = String(params.skillId || location.state?.skillId || 'F025').toUpperCase();
  const directSkillInvalid = Boolean(params.skillId) && !FRACTIONS_STORY_SUPPORTED_SKILLS.has(rawSkillId);
  const safeSkillId = FRACTIONS_STORY_SUPPORTED_SKILLS.has(rawSkillId) ? rawSkillId : 'F025';
  const story = useMemo(() => buildFractionsStorySession({ skillId: safeSkillId, studentId }), [safeSkillId, studentId]);
  const scenes = story.sceneItems?.length ? story.sceneItems : story.steps;
  const [sceneIndex, setSceneIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [working, setWorking] = useState({});
  const [responses, setResponses] = useState([]);
  const [attemptsByScene, setAttemptsByScene] = useState({});
  const [sceneFeedback, setSceneFeedback] = useState(null);
  const [sceneComplete, setSceneComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [backendSession, setBackendSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [showWorking, setShowWorking] = useState(false);

  const scene = scenes[sceneIndex];
  const isLast = sceneIndex === scenes.length - 1;
  const attempts = attemptsByScene[sceneIndex] || 0;
  const stepExpectedAnswer = scene?.answer?.display || scene?.answer?.value || scene?.answer || '';
  const needsTextInput = !Array.isArray(scene?.choices);
  const needsFractionInput = needsTextInput && isFractionLikeAnswerValue(stepExpectedAnswer);
  const expressionQuestion = needsTextInput && Boolean(extractFractionExpression(String(scene?.questionText || scene?.prompt || '')));

  if (directSkillInvalid) {
    return (
      <div className="mx-auto max-w-xl px-3 pt-3 sm:px-0">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900">Choose a supported Story Mode skill</h2>
          <p className="mt-2 text-sm text-ink-600">Story Mode currently supports exam-style fraction applications and the Fractions Mastery Challenge.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button onClick={() => navigate('/student/mathpath/fractions/story/F025', { replace: true })}>Start exam-style story</Button>
            <Button variant="secondary" onClick={() => navigate('/student/mathpath/fractions/story/F026', { replace: true })}>Start mastery story</Button>
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
    setWorking({});
    setSceneFeedback(null);
    setSceneComplete(false);
    setHintCount(0);
    setShowWorking(false);
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
            <p><span className="font-semibold">Skill:</span> {storySkillName(story.skillId)}</p>
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
    <div className="mx-auto max-w-4xl px-3 pb-28 pt-3 sm:px-0">
      <Card className="mb-3 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-navy-700">Scene {sceneIndex + 1} of {scenes.length}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">{story.missionTitle}</h1>
            <p className="mt-2 max-w-2xl break-words text-sm leading-relaxed text-ink-600">{scene?.sceneNarration}</p>
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

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          <main className="space-y-4">
            <section className="rounded-2xl border border-hairline bg-slate-50 p-4 sm:p-5" aria-label="Story problem">
              <p className="mb-2 text-sm font-semibold text-navy-800">{friendlySceneTitle(scene)}</p>
              {expressionQuestion ? (
                <FractionExpressionQuestion prompt={scene?.questionText || ''} value={answer} onChange={setAnswer} />
              ) : (
                <>
                  <p className="break-words text-lg font-semibold leading-relaxed text-ink-900">{story.prompt}</p>
                  <p className="mt-4 break-words text-base leading-relaxed text-ink-800">{scene?.questionText}</p>
                </>
              )}
            </section>

            <section className="lg:hidden">
              <VisualHint type={scene?.visualHintType} model={scene?.visualModel || story.barModel || {}} />
            </section>

            <section className="rounded-2xl border border-hairline bg-white p-4" aria-label="Your answer">
              <p className="mb-3 text-sm font-semibold text-ink-800">Your answer</p>
              {needsTextInput ? (
                expressionQuestion ? null : needsFractionInput ? (
                  <div>
                    <FractionAnswerInput value={answer} onChange={setAnswer} />
                  </div>
                ) : (
                  <div>
                    <AnswerInputRenderer
                      question={{ ...scene, answerInputType: 'text' }}
                      value={answer}
                      onChange={(value) => {
                        setAnswer(value);
                        setSceneFeedback(null);
                      }}
                      disabled={sceneComplete}
                    />
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 gap-2">
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
            </section>

            <section className="rounded-2xl border border-hairline bg-white p-4">
              <button
                type="button"
                onClick={() => setShowWorking((value) => !value)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-hairline bg-slate-50 px-4 py-2 text-sm font-semibold text-ink-800"
              >
                <Pencil className="h-4 w-4" />
                {showWorking ? 'Hide working space' : 'Show working space'}
              </button>
              {showWorking ? (
                <div className="mt-3">
                  <WorkingCanvas
                    key={`story-working-${sceneIndex}`}
                    questionId={`${story.sessionId || story.skillId}-${sceneIndex}`}
                    required={false}
                    allowNoWorking
                    compact
                    label="Your working"
                    submittedImage={working.workingImage || ''}
                    submittedStrokes={working.workingStrokes || []}
                    initialSubmitted={Boolean(working.workingSubmitted)}
                    initialWorkingNotNeeded={Boolean(working.workingNotNeeded)}
                    onChange={setWorking}
                    onSubmit={setWorking}
                  />
                </div>
              ) : null}
            </section>

            {!sceneFeedback && (
              <StoryHints
                hints={scene?.guidedSteps || []}
                visibleCount={hintCount}
                onReveal={() => setHintCount((value) => Math.min(value + 1, Math.min(3, scene?.guidedSteps?.length || 0)))}
              />
            )}

            {sceneFeedback ? (
              <div className={`rounded-xl border p-4 text-sm ${sceneFeedback.tone === 'success' ? 'border-success-200 bg-success-50 text-success-800' : 'border-gold-300 bg-gold-100 text-gold-900'}`}>
                <div className="flex gap-2">
                  {sceneFeedback.tone === 'success' ? <Sparkles className="h-5 w-5 shrink-0" /> : <Lightbulb className="h-5 w-5 shrink-0" />}
                  <div>
                    <p className="font-semibold">{sceneFeedback.message}</p>
                    {sceneFeedback.tone !== 'success'
                      && sceneFeedback.guidedStep
                      && normalizeFeedbackText(sceneFeedback.guidedStep) !== normalizeFeedbackText(sceneFeedback.message)
                      ? <p className="mt-2">{sceneFeedback.guidedStep}</p>
                      : null}
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
          </main>

          <aside className="hidden lg:block">
            <VisualHint type={scene?.visualHintType} model={scene?.visualModel || story.barModel || {}} />
          </aside>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-white/95 p-3 backdrop-blur sm:static sm:mt-3 sm:border-0 sm:bg-transparent sm:p-0">
        {sceneComplete ? (
          <Button className="h-12 w-full" icon={ArrowRight} onClick={goNext}>
            {isLast ? 'Complete mission' : 'Next Scene'}
          </Button>
        ) : (
          <Button className="h-12 w-full" icon={ArrowRight} disabled={!String(answer || '').trim()} onClick={submitScene}>
            Check Answer
          </Button>
        )}
      </div>
    </div>
  );
}
