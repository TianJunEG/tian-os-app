import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Maximize2, PencilLine, X } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Card, Button, ProgressBar, Spinner } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import { getUniversalSkillByFrameworkId } from '../../../mathpath/curriculum';
import {
  startFractionPracticeFlow,
  submitFractionPracticeAttempt,
} from '../../../mathpath/fractions/fractionPracticeFlow';
import { checkFractionAnswer } from '../../../mathpath/fractions/fractionQuestionGenerator';
import {
  getMathPathDomainProgressState,
  setMathPathDomainProgressState,
} from '../../../mathpath/state/mathPathDomainProgressState';
import { isFractionsStoryModeEnabled } from '../../../config/featureFlags';
import FractionsStoryModeSession from './FractionsStoryModeSession';
import { shouldUseFractionAnswerInput } from './components/FractionAnswerInput';
import QuestionDiagram from './components/QuestionDiagram';
import FractionExpressionQuestion, { extractFractionExpression } from './components/FractionExpressionQuestion';
import AnswerInputRenderer from './components/AnswerInputRenderer';
import WorkingCanvas, { resolveWorkingRequirement } from '../../../components/learning/WorkingCanvas';
import FullScreenWorkingMode from '../../../components/learning/FullScreenWorkingMode';
import WorkingAttachmentPreview from '../../../components/learning/WorkingAttachmentPreview';
import QuestionAnnotationOverlay from '../../../components/learning/QuestionAnnotationOverlay';

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'I know this' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'dont_know', label: "I don't know" },
];

function calibrationFromReflection(correct, reflection) {
  if (correct && reflection === 'i_know_this') return 'mastery_signal';
  if (correct && reflection === 'dont_know') return 'possible_guess';
  if (!correct && reflection === 'i_know_this') return 'overconfidence';
  if (!correct && reflection === 'not_sure') return 'student_aware_of_weakness';
  if (!correct && reflection === 'dont_know') return 'knowledge_gap';
  return correct ? 'low_confidence_correct' : 'needs_review';
}
const SESSION_META = {
  diagnostic: {
    label: 'Fractions Check-In',
    helper: 'Short baseline placement session.',
    finishLabel: 'Finish Check-In',
  },
  warmup: {
    label: 'Quick Warm-up',
    helper: '2–3 retrieval questions before main practice.',
    finishLabel: 'Finish Warm-up',
  },
  practice: {
    label: 'Practice',
    helper: 'Build mastery, fluency, and confidence.',
    finishLabel: 'Finish Session',
  },
  remediation: {
    label: 'Remediation',
    helper: 'Target weak skills and common mistakes.',
    finishLabel: 'Finish Remediation',
  },
  mastery_check: {
    label: 'Mastery Check',
    helper: 'Confirm readiness to move forward.',
    finishLabel: 'Finish Mastery Check',
  },
  story: {
    label: 'Problem Solving Story',
    helper: 'Guided story-based fraction problem solving.',
    finishLabel: 'Finish Story',
  },
};

const EMPTY_WORKING_PAYLOAD = {};
const EMPTY_STROKES = [];

function normalizeSessionType(value) {
  const key = String(value || 'practice').toLowerCase();
  return SESSION_META[key] ? key : 'practice';
}

const RECOMMENDED_SESSION_INTENTS = {
  pathway: 'practice',
  diagnostic: 'practice',
  assessment: 'practice',
  remediation: 'remediation',
  review: 'remediation',
  next: 'practice',
  path: 'practice',
  dashboard: 'practice',
};

function resolvePracticeIntent({ routeSessionId, locationState, progress }) {
  const normalized = String(routeSessionId || '').toLowerCase();
  const normalizeFrameworkSkillId = (value) => {
    const skillId = String(value || '').toUpperCase();
    return /^F\d{3}$/.test(skillId) ? skillId : null;
  };
  const nextSkill = normalizeFrameworkSkillId(progress?.currentSkillId) || normalizeFrameworkSkillId(progress?.nextSkillId);
  const candidateWeak = Array.isArray(progress?.weakSkills)
    ? normalizeFrameworkSkillId(progress.weakSkills[0]?.skillId)
    : null;
  const skillFallback = nextSkill || candidateWeak || 'F001';

  if (normalized.startsWith('skill-')) {
    const skillId = String(routeSessionId || '').slice(6).toUpperCase();
    return {
      requestedSkillId: /^F\d{3}$/i.test(skillId) ? skillId : null,
      sessionType: 'practice',
      questionCount: 8,
    };
  }

  if (normalized.startsWith('recommended-')) {
    const intent = normalized.replace('recommended-', '');
    return {
      requestedSkillId: normalizeFrameworkSkillId(locationState?.skillId) || skillFallback,
      sessionType: RECOMMENDED_SESSION_INTENTS[intent] || 'practice',
      questionCount: locationState?.questionCount || 8,
    };
  }

  return {
    requestedSkillId: normalizeFrameworkSkillId(locationState?.skillId) || skillFallback,
    sessionType: normalizeSessionType(locationState?.sessionType),
    questionCount: locationState?.questionCount || null,
  };
}

function persistDomainSessionProgress({ studentId, sessionType, currentSkillId, weakSkillIds = [] }) {
  if (!studentId) return;
  const existing = getMathPathDomainProgressState(studentId, 'fractions') || {};
  setMathPathDomainProgressState(studentId, 'fractions', {
    ...existing,
    lastSessionAt: new Date().toISOString(),
    currentSkillId: currentSkillId || existing.currentSkillId || null,
    weakSkills: weakSkillIds,
    masteryCheckCompleted: sessionType === 'mastery_check' ? true : Boolean(existing.masteryCheckCompleted),
    masteryCheckCompletedAt: sessionType === 'mastery_check'
      ? new Date().toISOString()
      : existing.masteryCheckCompletedAt || null,
  });
}

function VisualTable({ payload }) {
  const headers = Array.isArray(payload?.headers) ? payload.headers : [];
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  if (!headers.length || !rows.length) return null;
  return (
    <div className="mb-5 overflow-x-auto rounded-xl border border-hairline">
      <table className="min-w-full border-collapse text-left text-sm text-ink-800">
        <thead className="bg-navy-50">
          <tr>{headers.map((h, i) => <th key={i} className="border-b border-hairline px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="odd:bg-white even:bg-slate-50">
              {Array.isArray(row) ? row.map((cell, cIdx) => <td key={`${rIdx}-${cIdx}`} className="border-b border-hairline px-3 py-2">{cell}</td>) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisualBlock({ visual }) {
  if (!visual || !visual.type) return null;
  if (visual.type === 'table') return <VisualTable payload={visual.payload} />;
  return <div className="mb-5 rounded-xl border border-hairline bg-slate-50 px-4 py-3 text-sm text-ink-600">Visual unavailable</div>;
}

function getFeedback({ correct, timeTaken, estimatedSeconds, skipped }) {
  if (skipped) return "We'll come back to this.";
  if (!correct) return "Let's review this skill.";
  if (Number(timeTaken || 0) <= Number(estimatedSeconds || 20)) return 'Well done — accurate and quick.';
  return "Correct. Let's practise for speed.";
}

function canonicalSkillName(skillId, fallback = '') {
  const normalized = String(skillId || '').toUpperCase();
  if (!/^F\d{3}$/.test(normalized)) return fallback || String(skillId || '');
  return getUniversalSkillByFrameworkId(normalized)?.title || fallback || normalized;
}

function LegacyPracticeSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const items = useMemo(() => location.state?.items || [], [location.state]);
  const sessionType = normalizeSessionType(location.state?.sessionType);
  const sessionMeta = SESSION_META[sessionType];
  const studentId = location.state?.studentId || null;
  const resultsBase = location.state?.resultsBase || '/student/mathpath';
  const homeBase = location.state?.homeBase || location.state?.backTo || '/student/mathpath';
  const resultState = {
    backTo: location.state?.backTo,
    homeBase: location.state?.homeBase || location.state?.backTo,
    homeLabel: location.state?.homeLabel,
    mistakesBase: location.state?.mistakesBase,
    sessionType,
  };
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [startedAt, setStartedAt] = useState(Date.now());
  const [workingState, setWorkingState] = useState({});
  const [doodleState, setDoodleState] = useState({});
  const [fullscreenWorkingState, setFullscreenWorkingState] = useState({});
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [doodleMode, setDoodleMode] = useState(false);
  const questionSurfaceRef = useRef(null);

  useEffect(() => { if (!items.length) navigate(homeBase, { replace: true }); }, [items, navigate, homeBase]);
  useEffect(() => { setStartedAt(Date.now()); }, [idx]);
  useEffect(() => { setDoodleMode(false); }, [idx]);
  if (!items.length) return <Spinner />;

  const q = items[idx];
  const isLast = idx === items.length - 1;
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.stem || q.prompt || ''));
  const workingRequirement = resolveWorkingRequirement(q, sessionType);
  const currentWorking = workingState[q.questionId] || {};
  const currentDoodle = doodleState[q.questionId] || EMPTY_WORKING_PAYLOAD;
  const currentFullscreenWorking = fullscreenWorkingState[q.questionId] || {};
  const workingReady = !workingRequirement.required
    || currentDoodle.workingSubmitted
    || currentWorking.workingSubmitted
    || currentWorking.workingNotNeeded
    || currentFullscreenWorking.workingSubmitted;
  const primaryWorkingImage = currentDoodle.workingImage || currentWorking.workingImage || currentFullscreenWorking.workingImage || '';
  const primaryWorkingStrokes = currentDoodle.workingStrokes?.length
    ? currentDoodle.workingStrokes
    : (currentWorking.workingStrokes || currentFullscreenWorking.workingStrokes || []);
  const primaryWorkingSubmitted = currentDoodle.workingSubmitted || currentWorking.workingSubmitted || currentFullscreenWorking.workingSubmitted;
  const primaryWorkingSubmittedAt = currentDoodle.workingSubmittedAt || currentWorking.workingSubmittedAt || currentFullscreenWorking.workingSubmittedAt || null;
  const workingEvidence = [
    currentDoodle.workingSubmitted ? {
      source: 'question_doodle',
      image: currentDoodle.workingImage || '',
      strokes: currentDoodle.workingStrokes || [],
      submittedAt: currentDoodle.workingSubmittedAt || null,
      questionDimensions: currentDoodle.questionDimensions || null,
      viewportDimensions: currentDoodle.viewportDimensions || null,
      deviceType: currentDoodle.deviceType || null,
      timestamp: currentDoodle.timestamp || new Date().toISOString(),
    } : null,
    currentFullscreenWorking.workingSubmitted ? {
      source: 'fullscreen_working',
      image: currentFullscreenWorking.workingImage || '',
      strokes: currentFullscreenWorking.workingStrokes || [],
      submittedAt: currentFullscreenWorking.workingSubmittedAt || null,
      canvasDimensions: currentFullscreenWorking.canvasDimensions || null,
      viewportDimensions: currentFullscreenWorking.viewportDimensions || null,
      timestamp: currentFullscreenWorking.timestamp || new Date().toISOString(),
    } : null,
    currentWorking.workingSubmitted ? {
      source: 'inline_working',
      image: currentWorking.workingImage || '',
      strokes: currentWorking.workingStrokes || [],
      submittedAt: currentWorking.workingSubmittedAt || null,
      timestamp: currentWorking.timestamp || new Date().toISOString(),
    } : null,
  ].filter(Boolean);

  const check = async () => {
    if (busy || answer === '') return;
    if (!workingReady) return;
    setBusy(true); setErr('');
    try {
      const { data } = await mathpathAPI.attempt(sessionId, {
        questionId: q.questionId,
        answer,
        timeMs: Date.now() - startedAt,
        hintsUsed: 0,
        workingImage: primaryWorkingImage,
        workingStrokes: primaryWorkingStrokes,
        workingSubmitted: Boolean(primaryWorkingSubmitted),
        workingSubmittedAt: primaryWorkingSubmittedAt,
        workingNotNeeded: Boolean(currentWorking.workingNotNeeded),
        workingUploaded: Boolean(currentDoodle.workingSubmitted || currentWorking.workingSubmitted || currentFullscreenWorking.workingSubmitted),
        fullscreenWorkingImage: currentFullscreenWorking.workingImage || '',
        fullscreenWorkingStrokes: currentFullscreenWorking.workingStrokes || [],
        fullscreenWorkingSubmitted: Boolean(currentFullscreenWorking.workingSubmitted),
        fullscreenWorkingSubmittedAt: currentFullscreenWorking.workingSubmittedAt || null,
        workingEvidence,
        questionDimensions: currentDoodle.questionDimensions || null,
        viewportDimensions: currentDoodle.viewportDimensions || null,
        deviceType: currentDoodle.deviceType || null,
      });
      setResult(data);
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not check your answer. Please try again.');
    } finally { setBusy(false); }
  };

  const next = async () => {
    if (!isLast) { setIdx((i) => i + 1); setAnswer(''); setResult(null); setErr(''); return; }
    setBusy(true);
    let completion = null;
    try {
      const { data } = await mathpathAPI.complete(sessionId);
      completion = data?.summary || null;
    } catch (_) { /* noop */ }
    persistDomainSessionProgress({
      studentId,
      sessionType,
      currentSkillId: String(q.skillId || ''),
      weakSkillIds: Number.isFinite(Number(completion?.scorePct)) && Number(completion?.scorePct) < 80
        ? [{ skillId: String(q.skillId || ''), skillName: canonicalSkillName(q.skillId, q.skillName || '') }]
        : [],
    });
    navigate(`${resultsBase}/results/${sessionId}`, { replace: true, state: resultState });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-3 rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink-700">
        <p className="font-semibold">{sessionMeta.label}</p>
        <p className="text-xs text-ink-500">{sessionMeta.helper}</p>
      </div>
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono tabular-nums">Question {idx + 1} of {items.length}</span><span>{canonicalSkillName(q.skillId, q.skillName || '')}</span>
      </div>
      <ProgressBar value={idx + (result ? 1 : 0)} max={items.length} className="mb-6" />
      <Card className="flex min-h-[30rem] flex-col p-6">
        <div ref={questionSurfaceRef} className="relative">
          <div className="mb-6 text-lg leading-relaxed text-ink-900">
            {expressionQuestion ? (
              <FractionExpressionQuestion
                prompt={q.stem || q.prompt || ''}
                value={answer}
                onChange={setAnswer}
                disabled={!!result}
                onEnter={() => {
                  if (!result) {
                    if (!answer) return;
                    check();
                  }
                }}
              />
            ) : (
              <MathText text={q.stem} />
            )}
          </div>
          <VisualBlock visual={q.visual} />
          {(doodleMode || currentDoodle.workingSubmitted) && (
            <QuestionAnnotationOverlay
              key={`legacy-doodle-${q.questionId}`}
              questionId={q.questionId}
              targetRef={questionSurfaceRef}
              active={doodleMode}
              initialPayload={currentDoodle}
              onActivate={setDoodleMode}
              onChange={(payload) => setDoodleState((prev) => ({ ...prev, [q.questionId]: payload }))}
            />
          )}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            size="s"
            variant={doodleMode ? 'primary' : 'secondary'}
            icon={PencilLine}
            onClick={() => setDoodleMode((prev) => !prev)}
          >
            {doodleMode ? 'Exit Doodle' : 'Doodle'}
          </Button>
          <Button size="s" variant="secondary" icon={Maximize2} onClick={() => setFullscreenOpen(true)}>
            Open Working
          </Button>
        </div>
        <WorkingAttachmentPreview
          evidence={currentFullscreenWorking}
          onAddAnother={() => setFullscreenOpen(true)}
          onEdit={() => setFullscreenOpen(true)}
          onDelete={() => setFullscreenWorkingState((prev) => {
            const next = { ...prev };
            delete next[q.questionId];
            return next;
          })}
        />
        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => (
              <button key={`${i}-${c}`} disabled={!!result} onClick={() => setAnswer(c)} className={`rounded-xl border px-4 py-3 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
                <MathText text={c} />
              </button>
            ))}
          </div>
        ) : useFractionInput && !expressionQuestion ? (
          <AnswerInputRenderer
            question={q}
            value={answer}
            onChange={setAnswer}
            disabled={!!result}
            onEnter={() => {
              if (!result) {
                if (!answer) return;
                check();
              }
            }}
          />
        ) : (
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!result} className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg" />
        )}
        {result && (
          <div className={`mt-5 rounded-xl p-4 ${result.correct ? 'bg-success-100' : 'bg-error-100'}`}>
            <div className={`flex items-center gap-2 font-semibold ${result.correct ? 'text-success-700' : 'text-error-700'}`}>{result.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}{result.correct ? 'Correct' : 'Not quite'}</div>
          </div>
        )}
        {err && <p className="mt-3 text-sm text-error-700">{err}</p>}
        <WorkingCanvas
          key={`legacy-working-${q.questionId}`}
          questionId={q.questionId}
          required={workingRequirement.required}
          allowNoWorking={workingRequirement.allowNoWorking}
          submittedImage={currentWorking.workingImage || ''}
          submittedStrokes={currentWorking.workingStrokes || EMPTY_STROKES}
          initialSubmitted={Boolean(currentWorking.workingSubmitted)}
          initialWorkingNotNeeded={Boolean(currentWorking.workingNotNeeded)}
          onChange={(payload) => setWorkingState((prev) => ({ ...prev, [q.questionId]: payload }))}
          onSubmit={(payload) => setWorkingState((prev) => ({ ...prev, [q.questionId]: payload }))}
        />
        {!workingReady && (
          <p className="mt-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm font-semibold text-gold-800">
            This question needs working. Please save your working, doodle on the question, or upload a photo before submitting.
          </p>
        )}
        <div className="mt-auto pt-6">{!result ? <Button size="l" disabled={busy || !answer || !workingReady} onClick={check} className="w-full">Check answer</Button> : <Button size="l" icon={ArrowRight} onClick={next} className="w-full">{isLast ? sessionMeta.finishLabel : 'Next question'}</Button>}</div>
      </Card>
      <FullScreenWorkingMode
        open={fullscreenOpen}
        questionText={q.stem || q.prompt || ''}
        questionContent={(
          <div className="space-y-4 text-base">
            <MathText text={q.stem || q.prompt || ''} />
            <VisualBlock visual={q.visual} />
          </div>
        )}
        questionSnapshot={{
          questionId: q.questionId,
          skillId: q.skillId,
          hasVisual: Boolean(q.visual),
          visualType: q.visual?.type || '',
        }}
        initialStrokes={currentFullscreenWorking.workingStrokes || EMPTY_STROKES}
        onClose={() => setFullscreenOpen(false)}
        onSave={(payload) => {
          setFullscreenWorkingState((prev) => ({ ...prev, [q.questionId]: payload }));
          setFullscreenOpen(false);
        }}
      />
    </div>
  );
}

export default function PracticeSession() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMathPathRoute = location.pathname.startsWith('/student/mathpath/practice/');
  const hasLegacyItems = Boolean(location.state?.items?.length);
  const progressState = getMathPathDomainProgressState(user?._id || user?.id || user?.email || 'demo-student', 'fractions') || {};
  const resolvedIntent = resolvePracticeIntent({
    routeSessionId,
    locationState: location.state || {},
    progress: progressState,
  });
  const sessionType = resolvedIntent.sessionType;
  const storyModeEnabled = isFractionsStoryModeEnabled();
  const sessionMeta = SESSION_META[sessionType];

  if (sessionType === 'story') {
    if (!storyModeEnabled) {
      return (
        <Card className="mx-auto max-w-xl p-6">
          <p className="text-sm text-ink-700">Problem Solving Story is not enabled yet.</p>
          <Button className="mt-4" onClick={() => navigate('/student/mathpath', { replace: true })}>Back to MathPath</Button>
        </Card>
      );
    }
    return <FractionsStoryModeSession />;
  }

  // Compatibility shim: older non-framework sessions still navigate with pre-baked
  // `items` payload. Keep this path until all callers route through skillId/sessionType.
  if (!isMathPathRoute || hasLegacyItems) return <LegacyPracticeSession />;

  const studentId = user?._id || user?.id || user?.email || 'demo-student';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flowSession, setFlowSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [reflection, setReflection] = useState('');
  const [helpRequested, setHelpRequested] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [workingByQuestion, setWorkingByQuestion] = useState({});
  const [doodleByQuestion, setDoodleByQuestion] = useState({});
  const [fullscreenWorkingByQuestion, setFullscreenWorkingByQuestion] = useState({});
  const [fullscreenQuestionId, setFullscreenQuestionId] = useState(null);
  const [workingSession, setWorkingSession] = useState(null);
  const [workingCodeByQuestion, setWorkingCodeByQuestion] = useState({});
  const [doodleMode, setDoodleMode] = useState(false);
  const questionSurfaceRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const started = await startFractionPracticeFlow({
          studentId,
          domainId: 'fractions',
          sessionType,
          requestedSkillId: resolvedIntent.requestedSkillId,
          requestedQuestionFamilyId: location.state?.questionFamilyId || null,
          sessionLength:
            resolvedIntent.questionCount
            || (sessionType === 'warmup'
              ? 3
              : sessionType === 'diagnostic' || sessionType === 'mastery_check'
                ? 10
                : sessionType === 'remediation'
                  ? 5
                  : 6),
          weakSkillIds: Array.isArray(location.state?.weakSkillIds) ? location.state.weakSkillIds : [],
          recentMistakeTypes: Array.isArray(location.state?.recentMistakeTypes) ? location.state.recentMistakeTypes : [],
        });
        if (!mounted) return;
        setFlowSession(started);
        setQuestions(started.questions || []);
        setWorkingSession(null);
        setWorkingCodeByQuestion({});
        setWorkingByQuestion({});
        setFullscreenWorkingByQuestion({});
        setFullscreenQuestionId(null);
        if (!started.questions?.length) setError('No questions generated yet. Please try another skill.');
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Could not start practice session.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [studentId, routeSessionId, sessionType, resolvedIntent.requestedSkillId, resolvedIntent.questionCount, location.state]);

  useEffect(() => {
    if (summary || loading || !questions.length) return undefined;
    setQuestionStartedAt(Date.now());
    setElapsedSec(0);
    setDoodleMode(false);
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - questionStartedAt) / 1000)), 250);
    return () => clearInterval(t);
  }, [idx, summary, loading, questions.length, questionStartedAt]);

  useEffect(() => {
    if (!flowSession || !questions.length || workingSession) return undefined;
    let cancelled = false;
    const practiceSessionId = flowSession.practiceSessionId || routeSessionId;
    const questionRefs = questions.map((question) => {
      const requirement = resolveWorkingRequirement(question, sessionType);
      return {
        questionId: question.questionId,
        skillId: question.skillId || flowSession.targetSkillId || '',
        domainId: question.domainId || 'fractions',
        sessionId: practiceSessionId,
        workingRequired: requirement.required,
        workingReason: requirement.required ? `${sessionType}_required` : `${sessionType}_optional`,
      };
    });

    mathpathAPI.createWorkingSession({
      studentId,
      practiceSessionId,
      domainId: 'fractions',
      skillIds: [...new Set(questionRefs.map((ref) => ref.skillId).filter(Boolean))],
      questionRefs,
      inputMethod: 'paper',
    })
      .then(({ data }) => {
        if (cancelled) return;
        const session = data?.workingSession || null;
        setWorkingSession(session);
        const codeMap = {};
        (session?.questionWorkingMap || []).forEach((row) => {
          if (row.questionId && row.workingCode) codeMap[row.questionId] = row.workingCode;
        });
        setWorkingCodeByQuestion(codeMap);
      })
      .catch(() => {
        if (!cancelled) {
          setWorkingSession(null);
          setWorkingCodeByQuestion({});
        }
      });
    return () => { cancelled = true; };
  }, [flowSession, questions, routeSessionId, sessionType, studentId, workingSession]);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <Card className="mx-auto max-w-xl p-6">
        <p className="text-sm text-error-700">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/student/mathpath', { replace: true })}>Back to MathPath</Button>
      </Card>
    );
  }
  if (!questions.length) return <Spinner />;

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const answered = Boolean(feedback);
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.prompt || q.stem || ''));
  const workingRequirement = resolveWorkingRequirement(q, sessionType);
  const currentWorking = workingByQuestion[q.questionId] || {};
  const currentDoodle = doodleByQuestion[q.questionId] || EMPTY_WORKING_PAYLOAD;
  const currentFullscreenWorking = fullscreenWorkingByQuestion[q.questionId] || {};
  const workingReady = !workingRequirement.required
    || currentDoodle.workingSubmitted
    || currentWorking.workingSubmitted
    || currentWorking.workingNotNeeded
    || currentFullscreenWorking.workingSubmitted;
  const questionText = q.prompt || q.stem || '';
  const primaryWorkingImage = currentDoodle.workingImage || currentWorking.workingImage || currentFullscreenWorking.workingImage || '';
  const primaryWorkingStrokes = currentDoodle.workingStrokes?.length
    ? currentDoodle.workingStrokes
    : (currentWorking.workingStrokes || currentFullscreenWorking.workingStrokes || []);
  const primaryWorkingSubmitted = currentDoodle.workingSubmitted || currentWorking.workingSubmitted || currentFullscreenWorking.workingSubmitted;
  const primaryWorkingSubmittedAt = currentDoodle.workingSubmittedAt || currentWorking.workingSubmittedAt || currentFullscreenWorking.workingSubmittedAt || null;
  const workingEvidence = [
    currentDoodle.workingSubmitted ? {
      source: 'question_doodle',
      image: currentDoodle.workingImage || '',
      strokes: currentDoodle.workingStrokes || [],
      submittedAt: currentDoodle.workingSubmittedAt || null,
      questionDimensions: currentDoodle.questionDimensions || null,
      viewportDimensions: currentDoodle.viewportDimensions || null,
      deviceType: currentDoodle.deviceType || null,
      timestamp: currentDoodle.timestamp || new Date().toISOString(),
    } : null,
    currentWorking.workingSubmitted ? {
      source: 'inline_working',
      image: currentWorking.workingImage || '',
      strokes: currentWorking.workingStrokes || [],
      submittedAt: currentWorking.workingSubmittedAt || null,
    } : null,
    currentFullscreenWorking.workingSubmitted ? {
      source: 'fullscreen_working',
      image: currentFullscreenWorking.workingImage || '',
      strokes: currentFullscreenWorking.workingStrokes || [],
      submittedAt: currentFullscreenWorking.workingSubmittedAt || null,
      canvasDimensions: currentFullscreenWorking.canvasDimensions || null,
      viewportDimensions: currentFullscreenWorking.viewportDimensions || null,
    } : null,
  ].filter(Boolean);

  const onSubmitCurrent = () => {
    if (busy || answered) return;
    if (!answer || !reflection || !workingReady) return;
    const timeTaken = Math.max(1, Math.floor((Date.now() - questionStartedAt) / 1000));
    const answerCheck = checkFractionAnswer({
      studentAnswer: answer,
      correctAnswer: q.answer,
      acceptedAnswers: q.acceptedAnswers || [],
    });
    const current = {
      questionId: q.questionId,
      studentAnswer: answer,
      timeTaken,
      confidence: reflection,
      confidenceLevel: reflection,
      reflection,
      helpRequested,
      confidenceCalibration: calibrationFromReflection(answerCheck.correct, reflection),
      possibleMisconception: !answerCheck.correct && reflection === 'i_know_this',
      workingImage: primaryWorkingImage,
      workingStrokes: primaryWorkingStrokes,
      workingSubmitted: Boolean(primaryWorkingSubmitted),
      workingSubmittedAt: primaryWorkingSubmittedAt,
      workingNotNeeded: Boolean(currentWorking.workingNotNeeded),
      workingUploaded: Boolean(primaryWorkingSubmitted),
      fullscreenWorkingImage: currentFullscreenWorking.workingImage || '',
      fullscreenWorkingStrokes: currentFullscreenWorking.workingStrokes || [],
      fullscreenWorkingSubmitted: Boolean(currentFullscreenWorking.workingSubmitted),
      fullscreenWorkingSubmittedAt: currentFullscreenWorking.workingSubmittedAt || null,
      workingEvidence,
      workingCode: workingCodeByQuestion[q.questionId] || '',
      workingSessionId: workingSession?.workingSessionId || '',
      skipped: false,
      timestamp: new Date().toISOString(),
      attemptNumber: 1,
      _skipped: false,
      _correct: answerCheck.correct,
    };
    setResponses((prev) => [...prev, current]);
    setFeedback({
      correct: answerCheck.correct,
      skipped: false,
      message: getFeedback({ correct: answerCheck.correct, timeTaken, estimatedSeconds: q.estimatedSeconds, skipped: false }),
      correctAnswer: q.answer?.display || null,
    });
  };

  const onSkipCurrent = () => {
    if (busy || answered) return;
    const timeTaken = Math.max(1, Math.floor((Date.now() - questionStartedAt) / 1000));
    setResponses((prev) => [...prev, {
      questionId: q.questionId,
      studentAnswer: '',
      timeTaken,
      confidence: '',
      confidenceLevel: '',
      reflection: '',
      helpRequested,
      confidenceCalibration: 'skipped',
      possibleMisconception: false,
      workingImage: primaryWorkingImage,
      workingStrokes: primaryWorkingStrokes,
      workingSubmitted: Boolean(primaryWorkingSubmitted),
      workingSubmittedAt: primaryWorkingSubmittedAt,
      workingNotNeeded: Boolean(currentWorking.workingNotNeeded),
      workingUploaded: Boolean(primaryWorkingSubmitted),
      fullscreenWorkingImage: currentFullscreenWorking.workingImage || '',
      fullscreenWorkingStrokes: currentFullscreenWorking.workingStrokes || [],
      fullscreenWorkingSubmitted: Boolean(currentFullscreenWorking.workingSubmitted),
      fullscreenWorkingSubmittedAt: currentFullscreenWorking.workingSubmittedAt || null,
      workingEvidence,
      workingCode: workingCodeByQuestion[q.questionId] || '',
      workingSessionId: workingSession?.workingSessionId || '',
      skipped: true,
      timestamp: new Date().toISOString(),
      attemptNumber: 1,
      _skipped: true,
      _correct: false,
    }]);
    setFeedback({
      correct: false,
      skipped: true,
      message: getFeedback({ correct: false, skipped: true }),
      correctAnswer: q.answer?.display || null,
    });
  };

  const nextOrFinish = async () => {
    if (!answered) return;
    if (!isLast) {
      setIdx((i) => i + 1);
      setAnswer('');
      setReflection('');
      setHelpRequested(false);
      setFeedback(null);
      setQuestionStartedAt(Date.now());
      return;
    }

    setBusy(true);
    try {
      const payload = responses.map((r) => ({
        questionId: r.questionId,
        studentAnswer: r.studentAnswer,
        timeTaken: r.timeTaken,
        confidence: r.confidence,
        reflection: r.reflection || r.confidence || '',
        helpRequested: Boolean(r.helpRequested),
        confidenceCalibration: r.confidenceCalibration,
        possibleMisconception: r.possibleMisconception,
        workingImage: r.workingImage || '',
        workingStrokes: r.workingStrokes || [],
        workingSubmitted: Boolean(r.workingSubmitted),
        workingSubmittedAt: r.workingSubmittedAt || null,
        workingNotNeeded: Boolean(r.workingNotNeeded),
        workingUploaded: Boolean(r.workingUploaded),
        fullscreenWorkingImage: r.fullscreenWorkingImage || '',
        fullscreenWorkingStrokes: r.fullscreenWorkingStrokes || [],
        fullscreenWorkingSubmitted: Boolean(r.fullscreenWorkingSubmitted),
        fullscreenWorkingSubmittedAt: r.fullscreenWorkingSubmittedAt || null,
        workingEvidence: Array.isArray(r.workingEvidence) ? r.workingEvidence : [],
        workingCode: r.workingCode || '',
        workingSessionId: r.workingSessionId || workingSession?.workingSessionId || '',
        skipped: Boolean(r.skipped || r._skipped),
        timestamp: r.timestamp,
        attemptNumber: r.attemptNumber,
      }));
      const submitted = await submitFractionPracticeAttempt({
        practiceSessionId: flowSession.practiceSessionId || routeSessionId,
        studentId,
        sessionType,
        responses: payload,
      });
      const weakSkillRows = submitted.accuracySummary?.accuracyPercentage < 80
        ? [{ skillId: flowSession?.targetSkillId || q.skillId, skillName: canonicalSkillName(flowSession?.targetSkillId || q.skillId, '') }]
        : [];
      persistDomainSessionProgress({
        studentId,
        sessionType,
        currentSkillId: flowSession?.targetSkillId || q.skillId || null,
        weakSkillIds: weakSkillRows,
      });
      setSummary(submitted);
    } catch (e) {
      setError(e.message || 'Failed to submit session.');
    } finally {
      setBusy(false);
    }
  };

  if (summary) {
    const questionById = new Map((questions || []).map((qItem) => [qItem.questionId, qItem]));
    const reviewItems = (summary.results || []).map((resultItem) => {
      const question = questionById.get(resultItem.questionId) || {};
      return {
        questionId: resultItem.questionId,
        prompt: question.prompt || question.stem || '',
        skillId: resultItem.skillId || question.skillId,
        questionFamilyId: resultItem.questionFamilyId || question.questionFamilyId,
        difficulty: question.difficulty,
        studentAnswer: resultItem.studentAnswer,
        correctAnswer: resultItem.correctAnswer,
        correct: resultItem.correct,
        timeTaken: resultItem.timeTaken,
        confidence: resultItem.confidence,
        fluencyFlag: resultItem.fluencyFlag,
        solutionSteps: resultItem.solutionSteps || question.solutionSteps || [],
        workingRequired: Boolean(summary.questionWorkingSummary?.questionRefs?.find((qRef) => qRef.questionId === resultItem.questionId)?.workingRequired),
        workingUploaded: Boolean(resultItem.workingUploaded || resultItem.workingSubmitted || resultItem.fullscreenWorkingSubmitted),
      };
    });

    const fluencyLabel =
      summary.fluencySummary?.accurateButSlowCount > 0 ? 'Accurate but slow'
        : summary.fluencySummary?.fluentCount > 0 ? 'Fluent'
          : 'Review needed';
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-ink-900">{sessionMeta.label} Complete</h2>
          <div className="mt-4 space-y-2 text-sm text-ink-700">
            <p><span className="font-semibold">Accuracy:</span> {summary.accuracySummary?.accuracyPercentage ?? 0}%</p>
            <p><span className="font-semibold">Average time:</span> {summary.accuracySummary?.averageSeconds ?? 0}s</p>
            <p><span className="font-semibold">Fluency:</span> {fluencyLabel}</p>
            <p><span className="font-semibold">Next action:</span> {summary.nextRecommendedAction || 'Continue practice'}</p>
          </div>
          {summary.workingUploadRequired && (
            <div className="mt-5 rounded-xl border border-gold-300 bg-gold-100 p-4 text-sm text-gold-900">
              <p className="font-semibold">Please upload your working sheet for this session.</p>
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => navigate('/student/mathpath/working/upload', {
                  state: {
                    sessionType,
                    studentId,
                    practiceSessionId: flowSession?.practiceSessionId || routeSessionId,
                    workingSessionId: summary.workingSessionId || workingSession?.workingSessionId || flowSession?.workingSessionId || null,
                    totalQuestions: summary.questionWorkingSummary?.totalQuestions || questions.length,
                    questionRefs: summary.questionWorkingSummary?.questionRefs || [],
                    nextRecommendedAction: summary.nextRecommendedAction || 'Continue Practice',
                  },
                })}
              >
                Upload Working
              </Button>
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/student/mathpath/review', {
                state: {
                  source: 'practice',
                  reviewItems,
                  nextAction: summary.nextRecommendedAction,
                  primaryAction: '/student/mathpath',
                  backTo: '/student/mathpath',
                },
              })}
            >
              Review questions
            </Button>
            <Button onClick={() => navigate('/student/mathpath', { replace: true })}>Back to MathPath</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink-700">
        <p className="font-semibold">{sessionMeta.label}</p>
        <p className="text-xs text-ink-500">{sessionMeta.helper}</p>
      </div>
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono tabular-nums">Question {idx + 1} of {questions.length}</span>
        <span className="font-mono">{elapsedSec}s</span>
      </div>
      <ProgressBar value={idx + (answered ? 1 : 0)} max={questions.length} className="mb-6" />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <section className="min-w-0">
            <div ref={questionSurfaceRef} className="relative">
              <div className="mb-6 text-lg leading-relaxed text-ink-900">
                {expressionQuestion ? (
                  <FractionExpressionQuestion
                    prompt={q.prompt || q.stem || ''}
                    value={answer}
                    onChange={setAnswer}
                    disabled={answered}
                    onEnter={() => {
                      if (!answered) onSubmitCurrent();
                    }}
                  />
                ) : (
                  <MathText text={q.prompt || q.stem} />
                )}
              </div>
              <QuestionDiagram question={q} />
              <VisualBlock visual={q.visual} />
              {(doodleMode || currentDoodle.workingSubmitted) && (
                <QuestionAnnotationOverlay
                  key={`doodle-${q.questionId}`}
                  questionId={q.questionId}
                  targetRef={questionSurfaceRef}
                  active={doodleMode}
                  initialPayload={currentDoodle}
                  onActivate={setDoodleMode}
                  onChange={(payload) => setDoodleByQuestion((prev) => ({ ...prev, [q.questionId]: payload }))}
                />
              )}
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button size="s" variant={doodleMode ? 'primary' : 'secondary'} icon={PencilLine} onClick={() => setDoodleMode((prev) => !prev)}>
                {doodleMode ? 'Exit Doodle' : 'Doodle'}
              </Button>
              <Button size="s" variant="secondary" icon={Maximize2} onClick={() => setFullscreenQuestionId(q.questionId)}>
                Full-screen working
              </Button>
            </div>
            <WorkingAttachmentPreview
              evidence={currentFullscreenWorking}
              onAddAnother={() => setFullscreenQuestionId(q.questionId)}
              onEdit={() => setFullscreenQuestionId(q.questionId)}
              onDelete={() => setFullscreenWorkingByQuestion((prev) => {
                const next = { ...prev };
                delete next[q.questionId];
                return next;
              })}
            />
          </section>

          <aside className="min-w-0 rounded-xl bg-slate-50 p-3 sm:p-4">
            <WorkingCanvas
              key={`working-${q.questionId}`}
              questionId={q.questionId}
              workingCode={workingCodeByQuestion[q.questionId] || ''}
              required={workingRequirement.required}
              allowNoWorking={workingRequirement.allowNoWorking}
              submittedImage={currentWorking.workingImage || ''}
              submittedStrokes={currentWorking.workingStrokes || EMPTY_STROKES}
              initialSubmitted={Boolean(currentWorking.workingSubmitted)}
              initialWorkingNotNeeded={Boolean(currentWorking.workingNotNeeded)}
              onChange={(payload) => setWorkingByQuestion((prev) => ({ ...prev, [q.questionId]: payload }))}
              onSubmit={(payload) => setWorkingByQuestion((prev) => ({ ...prev, [q.questionId]: payload }))}
            />

            <div className="mt-4 rounded-xl bg-white p-3">
              <label className="mb-2 block text-sm font-semibold text-ink-700">Your answer</label>
              {q.type === 'mcq' ? (
                <div className="grid gap-2">
                  {choices.map((c, i) => (
                    <button key={`${i}-${c}`} disabled={answered} onClick={() => setAnswer(c)} className={`rounded-xl border px-4 py-3 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
                      <MathText text={c} />
                    </button>
                  ))}
                </div>
              ) : useFractionInput && !expressionQuestion ? (
                <AnswerInputRenderer
                  question={q}
                  value={answer}
                  onChange={setAnswer}
                  disabled={answered}
                  onEnter={() => {
                    if (!answered && reflection) onSubmitCurrent();
                  }}
                />
              ) : (
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={answered}
                  placeholder="Type your answer (e.g. 3/4)"
                  className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-lg text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                />
              )}
            </div>

            <div className="mt-4 rounded-xl bg-white p-3">
              <label className="mb-2 block text-sm font-semibold text-ink-700">How sure are you?</label>
              <div className="grid grid-cols-2 gap-2">
                {REFLECTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={answered}
                    onClick={() => setReflection(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm ${reflection === opt.value ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-hairline p-3">
                <p className="mb-2 text-sm font-semibold text-ink-700">Do you need help with this type of question?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => setHelpRequested(false)}
                    className={`rounded-lg border px-3 py-2 text-sm ${!helpRequested ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => setHelpRequested(true)}
                    className={`rounded-lg border px-3 py-2 text-sm ${helpRequested ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}
                  >
                    Yes, I need help
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 min-h-[72px]">
              {feedback && (
                <div className={`rounded-xl p-4 ${feedback.correct ? 'bg-success-100' : 'bg-error-100'}`}>
                  <div className={`flex items-center gap-2 font-semibold ${feedback.correct ? 'text-success-700' : 'text-error-700'}`}>
                    {feedback.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    {feedback.correct ? 'Correct' : feedback.skipped ? 'Skipped' : 'Review'}
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{feedback.message}</p>
                  {!feedback.correct && feedback.correctAnswer && (
                    <p className="mt-1 text-sm text-ink-700">Answer: <MathText text={feedback.correctAnswer} className="font-mono font-semibold" /></p>
                  )}
                </div>
              )}
            </div>

            {!workingReady && (
              <p className="mt-4 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm font-semibold text-gold-800">
                This question needs working. Please save your working, doodle on the question, or upload a photo before submitting.
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {!answered ? (
                <>
                  <Button variant="outlineLight" disabled={busy} onClick={onSkipCurrent}>Skip</Button>
                  <Button disabled={busy || !answer || !reflection || !workingReady} onClick={onSubmitCurrent}>Submit answer</Button>
                </>
              ) : (
                <Button className="sm:col-span-2" icon={ArrowRight} disabled={busy} onClick={nextOrFinish}>
                  {isLast ? sessionMeta.finishLabel : 'Next question'}
                </Button>
              )}
            </div>
          </aside>
        </div>
      </Card>
      <FullScreenWorkingMode
        open={fullscreenQuestionId === q.questionId}
        questionText={questionText}
        questionContent={(
          <div className="space-y-4 text-base">
            <MathText text={questionText} />
            <QuestionDiagram question={q} />
            <VisualBlock visual={q.visual} />
          </div>
        )}
        questionSnapshot={{
          questionId: q.questionId,
          skillId: q.skillId,
          hasDiagram: Boolean(q.diagramSpec || q.diagram || (q.visual?.type === 'svg' && q.visual?.payload?.type)),
          hasVisual: Boolean(q.visual),
          visualType: q.visual?.type || '',
        }}
        initialStrokes={currentFullscreenWorking.workingStrokes || EMPTY_STROKES}
        onClose={() => setFullscreenQuestionId(null)}
        onSave={(payload) => {
          setFullscreenWorkingByQuestion((prev) => ({ ...prev, [q.questionId]: payload }));
          setFullscreenQuestionId(null);
        }}
      />
    </div>
  );
}
