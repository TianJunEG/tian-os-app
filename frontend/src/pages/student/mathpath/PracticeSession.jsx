import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, HelpCircle, Lightbulb, Maximize2, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { learningTelemetryAPI, mathpathAPI } from '../../../services/api';
import { confettiBurst } from '../../../utils/confetti';
import { useAuth } from '../../../context/AuthContext';
import { Card, Button, ProgressBar, Spinner } from '../../../components/ui';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../design-os/studentVisualMode';
import { MathText } from '../../../components/ui/Fraction';
import { getUniversalSkillByFrameworkId } from '../../../mathpath/curriculum';
import {
  startFractionPracticeFlow,
  submitFractionPracticeAttempt,
} from '../../../mathpath/fractions/fractionPracticeFlow';
import { checkFractionAnswer } from '../../../mathpath/fractions/fractionQuestionGenerator';
import {
  isP1SkillId,
  startP1PracticeFlow,
  submitP1PracticeAttempt,
  checkP1AnswerForSession,
} from '../../../mathpath/primary/p1PracticeFlow';
import {
  isP3SkillId,
  startP3PracticeFlow,
  submitP3PracticeAttempt,
  checkP3AnswerForSession,
} from '../../../mathpath/primary/p3PracticeFlow';
import {
  isP2SkillId,
  startP2PracticeFlow,
  submitP2PracticeAttempt,
  checkP2AnswerForSession,
} from '../../../mathpath/primary/p2PracticeFlow';
import {
  isP4SkillId,
  startP4PracticeFlow,
  submitP4PracticeAttempt,
  checkP4AnswerForSession,
} from '../../../mathpath/primary/p4PracticeFlow';
import {
  isP5SkillId,
  startP5PracticeFlow,
  submitP5PracticeAttempt,
  checkP5AnswerForSession,
} from '../../../mathpath/primary/p5PracticeFlow';
import {
  isP6SkillId,
  startP6PracticeFlow,
  submitP6PracticeAttempt,
  checkP6AnswerForSession,
} from '../../../mathpath/primary/p6PracticeFlow';
import {
  getMathPathDomainProgressState,
  setMathPathDomainProgressState,
} from '../../../mathpath/state/mathPathDomainProgressState';
import { isFractionsStoryModeEnabled, FEATURE_FLAGS } from '../../../config/featureFlags';
import FractionsStoryModeSession from './FractionsStoryModeSession';
import { shouldUseFractionAnswerInput } from './components/FractionAnswerInput';
import QuestionDiagram, {
  DIAGRAM_LOAD_ERROR_MESSAGE,
  validateQuestionDiagram,
} from './components/QuestionDiagram';
import FractionExpressionQuestion, { extractFractionExpression } from './components/FractionExpressionQuestion';
import AnswerInputRenderer from './components/AnswerInputRenderer';
import QuestionZoomControls from './components/QuestionZoomControls';
import { resolveWorkingRequirement } from '../../../components/learning/WorkingCanvas';
import FullScreenWorkingMode from '../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../components/learning/WorkingPreviewCard';
import {
  hasWorkingDecision,
  resolveWorkingRequirementLevel,
} from '../../../components/learning/WorkingEvidenceDecision';
import SubmissionReviewModal from './components/SubmissionReviewModal';
import MascotAvatar, { MascotBubble } from '../../../components/MascotAvatar';

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'I know this' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'dont_know', label: "I don't know" },
  { value: 'i_need_help', label: 'I need help' },
];

// Self-explanation prompt (metacognition): after a correct answer the mascot
// asks "why did that work?" and the student taps a strategy. Explaining your
// reasoning is one of the strongest learning effects. Generic chips so it works
// across skills; the choice is logged as telemetry for later analysis.
const SELF_EXPLANATION_OPTIONS = [
  { value: 'step_by_step', label: 'I worked it out step by step' },
  { value: 'used_model', label: 'I used a picture or model' },
  { value: 'spotted_pattern', label: 'I spotted a pattern' },
  { value: 'checked_answer', label: 'I checked my answer' },
  { value: 'just_knew', label: 'I just knew it' },
];

function SelfExplanationPrompt({ skillId, questionId, sessionId, mascotKey = 'kylo' }) {
  const [chosen, setChosen] = useState(null);
  const choose = (value) => {
    setChosen(value);
    if (value === 'skipped') return;
    learningTelemetryAPI.recordEvent({
      eventType: 'self_explanation',
      skillId: skillId || '',
      questionId: questionId || '',
      sessionId: sessionId || '',
      reason: value,
    }).catch(() => { /* non-blocking */ });
  };
  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
      <MascotBubble
        name={mascotKey}
        size="sm"
        message={chosen && chosen !== 'skipped' ? 'Thanks — explaining it helps it stick! 🧠' : 'Nice! Why did that work?'}
      />
      {!chosen && (
        <div className="mt-2 flex flex-wrap gap-2">
          {SELF_EXPLANATION_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => choose(o.value)}
              className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => choose('skipped')}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-400 hover:text-ink-600"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}

function calibrationFromReflection(correct, reflection) {
  if (correct && reflection === 'i_know_this') return 'mastery_signal';
  if (correct && reflection === 'dont_know') return 'possible_guess';
  if (!correct && reflection === 'i_know_this') return 'overconfidence';
  if (!correct && reflection === 'not_sure') return 'student_aware_of_weakness';
  if (!correct && reflection === 'dont_know') return 'knowledge_gap';
  return correct ? 'low_confidence_correct' : 'needs_review';
}

function createClientAttemptId({ sessionId = '', questionId = '', attemptNumber = 1 } = {}) {
  const safeSession = String(sessionId || 'session').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeQuestion = String(questionId || 'question').replace(/[^a-zA-Z0-9_-]/g, '');
  return `attempt_${safeSession}_${safeQuestion}_${attemptNumber}_${Date.now().toString(36)}`;
}

function textFromMathObjects(objects = []) {
  return (Array.isArray(objects) ? objects : [])
    .map((object) => object?.text || object?.label || object?.value || '')
    .filter(Boolean)
    .join('\n');
}

function buildDigitalWorkingUploadPayload({ responses = [], questions = [], workingSessionId = '', sessionId = '' } = {}) {
  const questionById = new Map((questions || []).map((question) => [question.questionId, question]));
  const questionWorkings = (responses || [])
    .filter((response) => response.workingSubmitted || response.fullscreenWorkingSubmitted)
    .map((response) => {
      const question = questionById.get(response.questionId) || {};
      const workingMathObjects = response.fullscreenWorkingMathObjects?.length
        ? response.fullscreenWorkingMathObjects
        : response.workingMathObjects || [];
      return {
        questionId: response.questionId,
        skillId: response.skillId || question.skillId || '',
        sessionId,
        attemptId: response.attemptId || `${sessionId || workingSessionId}:${response.questionId}:${response.attemptNumber || 1}`,
        workingImage: response.fullscreenWorkingImage || response.workingImage || '',
        workingStrokes: response.fullscreenWorkingStrokes?.length
          ? response.fullscreenWorkingStrokes
          : response.workingStrokes || [],
        workingMathObjects,
        workingText: textFromMathObjects(workingMathObjects),
        answerGiven: response.studentAnswer || response.answer || '',
        correctAnswer: response.correctAnswer || question.answer?.display || '',
        answerCorrect: Boolean(response.answerCorrect ?? response.correct),
        confidenceLevel: response.confidenceLevel || response.confidence || response.reflection || '',
        prompt: question.prompt || question.stem || '',
        solutionSteps: question.solutionSteps || [],
        expectedStepCount: Array.isArray(question.solutionSteps) ? question.solutionSteps.length : null,
        questionFamilyId: response.questionFamilyId || question.questionFamilyId || '',
        submittedAt: response.fullscreenWorkingSubmittedAt || response.workingSubmittedAt || response.timestamp || new Date().toISOString(),
      };
    });
  return questionWorkings.length ? { questionWorkings } : null;
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

export function validatePracticeQuestionForDisplay(question = {}) {
  const diagramValidation = validateQuestionDiagram(question);
  if (!diagramValidation.ok) {
    return {
      ok: false,
      reason: 'missing_required_diagram',
      message: DIAGRAM_LOAD_ERROR_MESSAGE,
      diagramValidation,
    };
  }
  return { ok: true, reason: '', message: '', diagramValidation };
}

export function filterDisplayablePracticeQuestions(questions = []) {
  const skipped = [];
  const valid = [];

  (questions || []).forEach((question) => {
    const validation = validatePracticeQuestionForDisplay(question);
    if (validation.ok) {
      valid.push(question);
    } else {
      skipped.push({ question, validation });
    }
  });

  return { valid, skipped };
}

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
    if (/^F\d{3}$/.test(skillId)) return skillId;
    if (/^P1-(NUM|ADD|MON|MEA|GEO|EQG|DAT)-\d{2}$/.test(skillId)) return skillId;
    if (/^P2-(WN|AS|MD|MON|FR|ST|TM|GEO|WP)-\d{2}$/.test(skillId)) return skillId;
    if (/^P3-(WN|AS|MD|MON|MT|AP|ST|WP)-\d{2}$/.test(skillId)) return skillId;
    if (/^P4-(WN|FM|FO|FR|DEC|WP|ST)-\d{2}$/.test(skillId)) return skillId;
    if (/^P5-(WN|FR|DEC|PCT|RAT|GEO|AV|ST|WP)-\d{2}$/.test(skillId)) return skillId;
    if (/^P6-(ALG|AV)-\d{2}$/.test(skillId)) return skillId;
    return null;
  };
  const nextSkill = normalizeFrameworkSkillId(progress?.currentSkillId) || normalizeFrameworkSkillId(progress?.nextSkillId);
  const candidateWeak = Array.isArray(progress?.weakSkills)
    ? normalizeFrameworkSkillId(progress.weakSkills[0]?.skillId)
    : null;
  const skillFallback = nextSkill || candidateWeak || 'F001';

  if (normalized.startsWith('skill-')) {
    const skillId = String(routeSessionId || '').slice(6).toUpperCase();
    const resolvedSkillId = normalizeFrameworkSkillId(skillId);
    return {
      requestedSkillId: resolvedSkillId,
      sessionType: 'practice',
      questionCount: (isP1SkillId(resolvedSkillId) || isP2SkillId(resolvedSkillId) || isP3SkillId(resolvedSkillId) || isP4SkillId(resolvedSkillId) || isP5SkillId(resolvedSkillId) || isP6SkillId(resolvedSkillId)) ? 6 : 8,
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

function isPersistedPracticeSessionId(value = '') {
  return /^(?:frac|p1_|p2_|p3_|p4_|p5_|p6_)?practice_\d+_[a-z0-9]+$/i.test(String(value || ''));
}

function deriveDomainKey(skillId) {
  if (!skillId) return 'fractions';
  if (isP6SkillId(skillId)) return 'p6';
  if (isP5SkillId(skillId)) return 'p5';
  if (isP4SkillId(skillId)) return 'p4';
  if (isP3SkillId(skillId)) return 'p3';
  if (isP2SkillId(skillId)) return 'p2';
  if (isP1SkillId(skillId)) return 'p1';
  return 'fractions';
}
function persistDomainSessionProgress({ studentId, sessionType, currentSkillId, weakSkillIds = [], masteredSkillIds = [], fluentSkillIds = [] }) {
  if (!studentId) return;
  const existing = getMathPathDomainProgressState(studentId, deriveDomainKey(currentSkillId)) || {};
  const existingMastered = Array.isArray(existing.masteredSkillIds) ? existing.masteredSkillIds : [];
  const existingFluent = Array.isArray(existing.fluentSkillIds) ? existing.fluentSkillIds : [];
  setMathPathDomainProgressState(studentId, deriveDomainKey(currentSkillId), {
    ...existing,
    lastSessionAt: new Date().toISOString(),
    currentSkillId: currentSkillId || existing.currentSkillId || null,
    weakSkills: weakSkillIds,
    masteredSkillIds: [...new Set([...existingMastered, ...masteredSkillIds])],
    fluentSkillIds: [...new Set([...existingFluent, ...fluentSkillIds])],
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

const CORRECT_PRAISE_MESSAGES = [
  'Nailed it!',
  'Spot on — you really know this!',
  'Boom! That was perfect.',
  "You're getting stronger every time!",
  'Look at you go!',
  'That brain is on fire today!',
];

function stableMessageIndex(value = '') {
  const text = String(value || 'correct');
  let total = 0;
  for (let i = 0; i < text.length; i += 1) total += text.charCodeAt(i);
  return total % CORRECT_PRAISE_MESSAGES.length;
}

function getStreakMessage(streak = 0) {
  if (streak === 2) return '2 in a row — unstoppable!';
  if (streak >= 3) return `${streak} in a row! You're on fire!`;
  return '';
}

export function buildAnswerFeedback({
  correct,
  timeTaken,
  estimatedSeconds,
  skipped,
  streak = 0,
  questionId = '',
} = {}) {
  if (skipped) {
    return {
      correct: false,
      skipped: true,
      title: 'Skipped',
      message: "We'll come back to this.",
      streakMessage: '',
      showConfetti: false,
    };
  }

  if (!correct) {
    return {
      correct: false,
      skipped: false,
      title: 'Review',
      message: "Let's review this skill.",
      streakMessage: '',
      showConfetti: false,
    };
  }

  const seconds = Number(timeTaken);
  const targetSeconds = Number(estimatedSeconds || 20);
  const fastThreshold = Math.max(6, Math.min(12, targetSeconds * 0.6));
  const slowThreshold = Math.max(24, targetSeconds * 1.35);
  let message = CORRECT_PRAISE_MESSAGES[stableMessageIndex(questionId || `${streak}-${seconds || ''}`)];

  if (Number.isFinite(seconds) && seconds <= fastThreshold) {
    message = 'Lightning fast and correct!';
  } else if (Number.isFinite(seconds) && seconds >= slowThreshold) {
    message = "Correct! Take your time — accuracy wins.";
  }

  return {
    correct: true,
    skipped: false,
    title: 'Correct',
    message,
    streakMessage: getStreakMessage(streak),
    showConfetti: streak >= 3 && streak % 3 === 0,
  };
}

function speakText(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = String(text || '')
    .replace(/\$[^$]*\$/g, '')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1 over $2')
    .replace(/\\times/g, ' times ')
    .replace(/\\div/g, ' divided by ')
    .replace(/[\\{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return;
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.9;
  utterance.pitch = 1.35;
  window.speechSynthesis.speak(utterance);
}

function ReadAloudButton({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const handleClick = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else {
      speakText(text);
      setSpeaking(true);
      const check = setInterval(() => {
        if (!window.speechSynthesis?.speaking) { setSpeaking(false); clearInterval(check); }
      }, 200);
    }
  };
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition ${
        speaking
          ? 'border-orange-400 bg-orange-50 text-orange-600'
          : 'border-sky-200 bg-white text-sky-600 hover:border-sky-400 hover:bg-sky-50'
      }`}
      title={speaking ? 'Stop reading' : 'Read question aloud'}
    >
      {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      {speaking ? 'Stop' : 'Read aloud'}
    </button>
  );
}

function AnswerFeedbackCard({ feedback, correctAnswer, solutionSteps, onTryAgain }) {
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  if (!feedback) return null;
  const correct = Boolean(feedback.correct);
  const title = feedback.title || (correct ? 'Correct' : feedback.skipped ? 'Skipped' : 'Review');
  const hasSteps = !correct && Array.isArray(solutionSteps) && solutionSteps.length > 0;
  const allHintsUsed = hasSteps && hintsRevealed >= solutionSteps.length;
  const showAnswer = !correct && (feedback.retryExhausted || allHintsUsed || !hasSteps);
  return (
    <div className={`relative min-h-[92px] overflow-hidden rounded-xl border p-4 ${correct ? 'tian-correct-card border-success-200 bg-success-100' : 'border-error-200 bg-error-100'}`}>
      <style>{`
        @keyframes tian-feedback-in {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tian-check-pop {
          0% { transform: scale(0.7); }
          60% { transform: scale(1.16); }
          100% { transform: scale(1); }
        }
        @keyframes tian-sparkle {
          0% { opacity: 0; transform: translateY(4px) scale(0.5); }
          45% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-4px) scale(0.8); }
        }
        @keyframes tian-confetti {
          0% { opacity: 0; transform: translate(0, 0) scale(0.8); }
          35% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(1); }
        }
        @keyframes tian-hint-in {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .tian-correct-card { animation: tian-feedback-in 420ms ease-out both; }
        .tian-check-pop { animation: tian-check-pop 420ms ease-out both; }
        .tian-sparkle-dot { animation: tian-sparkle 820ms ease-out both; }
        .tian-confetti-dot { animation: tian-confetti 760ms ease-out both; }
        .tian-hint-step { animation: tian-hint-in 320ms ease-out both; }
      `}</style>
      {correct && (
        <>
          <span className="tian-sparkle-dot pointer-events-none absolute right-8 top-4 h-2 w-2 rounded-full bg-success-400" />
          <span className="tian-sparkle-dot pointer-events-none absolute right-14 top-8 h-1.5 w-1.5 rounded-full bg-gold-400 [animation-delay:120ms]" />
          <span className="tian-sparkle-dot pointer-events-none absolute right-5 top-10 h-1 w-1 rounded-full bg-navy-300 [animation-delay:210ms]" />
          {feedback.showConfetti && (
            <span aria-hidden="true" className="pointer-events-none absolute right-10 top-8">
              {[
                ['-18px', '-18px', 'bg-success-400'],
                ['14px', '-20px', 'bg-gold-400'],
                ['24px', '4px', 'bg-navy-300'],
                ['-10px', '18px', 'bg-success-300'],
                ['8px', '20px', 'bg-gold-300'],
              ].map(([x, y, color], index) => (
                <span
                  key={`${x}-${y}`}
                  className={`tian-confetti-dot absolute h-1.5 w-1.5 rounded-full ${color}`}
                  style={{ '--x': x, '--y': y, animationDelay: `${index * 55}ms` }}
                />
              ))}
            </span>
          )}
        </>
      )}
      <div className={`relative flex items-center gap-2 font-semibold ${correct ? 'text-success-700' : 'text-error-700'}`}>
        {correct ? <Check className="tian-check-pop h-5 w-5" /> : <X className="h-5 w-5" />}
        {title}
      </div>
      <p className="relative mt-1 text-sm text-ink-700">{feedback.message}</p>
      {feedback.streakMessage && (
        <p className="relative mt-2 text-sm font-semibold text-success-700">{feedback.streakMessage}</p>
      )}

      {/* Guided hints — progressive one-at-a-time reveal */}
      {hasSteps && !correct && (
        <div className="relative mt-3 space-y-2">
          {hintsRevealed > 0 && (
            <ol className="space-y-1.5 pl-0">
              {solutionSteps.slice(0, hintsRevealed).map((step, i) => (
                <li key={i} className="tian-hint-step flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-ink-700">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span><span className="font-semibold text-amber-700">Step {i + 1}:</span> <MathText text={step} /></span>
                </li>
              ))}
            </ol>
          )}
          <div className="flex flex-wrap gap-2">
            {!allHintsUsed && !feedback.retryExhausted && (
              <button
                type="button"
                onClick={() => setHintsRevealed((h) => h + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {hintsRevealed === 0 ? 'Need a hint?' : `Next hint (${hintsRevealed}/${solutionSteps.length})`}
              </button>
            )}
            {hintsRevealed > 0 && !allHintsUsed && !feedback.retryExhausted && onTryAgain && (
              <button
                type="button"
                onClick={onTryAgain}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {showAnswer && correctAnswer && (
        <div className="relative mt-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-teal-700">Answer:</span>{' '}
            <MathText text={correctAnswer} className="font-mono font-semibold" />
          </p>
        </div>
      )}

      {showAnswer && hasSteps && hintsRevealed < solutionSteps.length && (
        <div className="relative mt-2">
          <button
            type="button"
            onClick={() => setShowAllSteps((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {showAllSteps ? 'Hide steps' : 'Show full solution'}
          </button>
          {showAllSteps && (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-700">
              {solutionSteps.map((step, i) => (
                <li key={i}><MathText text={step} /></li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function labelForNextAction(action = '') {
  const labels = {
    continuePractice: 'Continue Practice',
    uploadWorking: 'Upload Working',
    reviewNeeded: 'Review Needed',
    advanceSkill: 'Continue Practice',
    scheduleRetention: 'Continue Practice',
  };
  const key = String(action || '').trim();
  if (!key) return 'Continue Practice';
  return labels[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase());
}

export function buildGeneratedFractionMistakePayloads({ practiceSessionId, results = [], questions = [] } = {}) {
  const questionById = new Map((questions || []).map((question) => [question.questionId, question]));
  return (results || [])
    .filter((result) => !result.correct)
    .map((result) => {
      const question = questionById.get(result.questionId) || {};
      return {
        sessionId: practiceSessionId,
        attemptId: result.attemptId || '',
        questionId: result.questionId,
        skillCode: result.skillId || question.skillId || '',
        questionText: question.prompt || question.stem || '',
        studentAnswer: result.studentAnswer ?? result.answer ?? '',
        correctAnswer: result.correctAnswer || question.answer?.display || '',
        confidence: result.confidence || result.reflection || '',
        timestamp: result.answeredAt || new Date().toISOString(),
        workedSolution: Array.isArray(result.solutionSteps) && result.solutionSteps.length
          ? result.solutionSteps.join(' ')
          : '',
        misconceptionTag: question.misconceptionTag || '',
        source: result.skipped ? 'diagnostic-skipped' : 'practice-incorrect',
        module: 'MathPath',
      };
    });
}

async function persistGeneratedFractionMistakes({ practiceSessionId, results = [], questions = [] }) {
  const mistakes = buildGeneratedFractionMistakePayloads({ practiceSessionId, results, questions });

  if (!mistakes.length) return;
  const { data } = await mathpathAPI.recordMistakes(mistakes);
  console.info('[mistakes] created', {
    sessionId: practiceSessionId,
    count: data?.created ?? mistakes.length,
  });
}

export function buildPracticeTelemetryEvents({ studentId = '', sessionType = 'practice', practiceSessionId = '', results = [] } = {}) {
  if (!studentId || !Array.isArray(results) || !results.length) return [];
  return results.flatMap((result) => {
    const confidence = result.confidence || result.confidenceLevel || result.reflection || '';
    const base = {
      studentId,
      domain: 'fractions',
      skillCode: result.skillId || '',
      questionId: result.questionId || '',
      sessionId: practiceSessionId || result.sessionId || '',
    };
    const answeredEvent = {
      ...base,
      eventType: result.skipped ? 'question_skipped' : 'question_answered',
      metadata: {
        sessionType,
        attemptId: result.attemptId || '',
        answerCorrect: Boolean(result.correct),
        confidence,
        timeTakenSeconds: result.timeTaken ?? result.timeTakenSeconds ?? null,
        workingSubmitted: Boolean(result.workingSubmitted || result.workingUploaded || result.fullscreenWorkingSubmitted),
        workingNotNeeded: Boolean(result.workingNotNeeded),
        skipped: Boolean(result.skipped),
      },
    };
    if (!confidence) return [answeredEvent];
    return [
      answeredEvent,
      {
        ...base,
        eventType: 'confidence_selected',
        metadata: { sessionType, confidence },
      },
    ];
  });
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
  const [correctStreak, setCorrectStreak] = useState(0);
  const [fullscreenWorkingState, setFullscreenWorkingState] = useState({});
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [reflection, setReflection] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const questionSurfaceRef = useRef(null);

  useEffect(() => { if (!items.length) navigate(homeBase, { replace: true }); }, [items, navigate, homeBase]);
  useEffect(() => { setStartedAt(Date.now()); }, [idx]);
  if (!items.length) return <Spinner />;

  const q = items[idx];
  const isLast = idx === items.length - 1;
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.stem || q.prompt || ''));
  const workingRequirementLevel = resolveWorkingRequirementLevel(q, sessionType);
  const currentFullscreenWorking = fullscreenWorkingState[q.questionId] || {};
  const workingReady = hasWorkingDecision(currentFullscreenWorking);
  const primaryWorkingImage = currentFullscreenWorking.workingImage || '';
  const primaryWorkingStrokes = currentFullscreenWorking.workingStrokes || [];
  const primaryWorkingMathObjects = currentFullscreenWorking.workingMathObjects || [];
  const primaryWorkingSubmitted = currentFullscreenWorking.workingSubmitted;
  const primaryWorkingSubmittedAt = currentFullscreenWorking.workingSubmittedAt || null;
  const workingEvidence = [
    currentFullscreenWorking.workingSubmitted ? {
      source: 'fullscreen_working',
      image: currentFullscreenWorking.workingImage || '',
      strokes: currentFullscreenWorking.workingStrokes || [],
      mathObjects: currentFullscreenWorking.workingMathObjects || [],
      submittedAt: currentFullscreenWorking.workingSubmittedAt || null,
      canvasDimensions: currentFullscreenWorking.canvasDimensions || null,
      viewportDimensions: currentFullscreenWorking.viewportDimensions || null,
      timestamp: currentFullscreenWorking.timestamp || new Date().toISOString(),
    } : null,
  ].filter(Boolean);

  const submitLegacyAnswer = async () => {
    if (busy || answer === '') return;
    if (!reflection || !workingReady) return;
    setBusy(true); setErr('');
    try {
      const timeTaken = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const { data } = await mathpathAPI.attempt(sessionId, {
        questionId: q.questionId,
        answer,
        answerCorrect: null,
        timeMs: timeTaken * 1000,
        hintsUsed: 0,
        workingImage: primaryWorkingImage,
        workingStrokes: primaryWorkingStrokes,
        workingMathObjects: primaryWorkingMathObjects,
        workingSubmitted: Boolean(primaryWorkingSubmitted),
        workingSubmittedAt: primaryWorkingSubmittedAt,
        workingNotNeeded: Boolean(currentFullscreenWorking.workingNotNeeded),
        workingRequirementLevel,
        workingUploaded: Boolean(currentFullscreenWorking.workingSubmitted),
        fullscreenWorkingImage: currentFullscreenWorking.workingImage || '',
        fullscreenWorkingStrokes: currentFullscreenWorking.workingStrokes || [],
        fullscreenWorkingMathObjects: currentFullscreenWorking.workingMathObjects || [],
        fullscreenWorkingSubmitted: Boolean(currentFullscreenWorking.workingSubmitted),
        fullscreenWorkingSubmittedAt: currentFullscreenWorking.workingSubmittedAt || null,
        workingEvidence,
        questionDimensions: null,
        viewportDimensions: currentFullscreenWorking.viewportDimensions || null,
        deviceType: null,
      });
      const nextStreak = data?.correct ? correctStreak + 1 : 0;
      setCorrectStreak(nextStreak);
      const answerFeedback = buildAnswerFeedback({
        correct: Boolean(data?.correct),
        timeTaken,
        estimatedSeconds: q.estimatedSeconds,
        skipped: false,
        streak: nextStreak,
        questionId: q.questionId,
      });
      setResult({ ...data, ...answerFeedback });
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not check your answer. Please try again.');
    } finally { setBusy(false); }
  };

  const openReviewModal = () => {
    if (!answer) return;
    setReviewModalOpen(true);
  };

  const confirmReview = () => {
    if (!reflection || !workingReady || busy) return;
    setReviewModalOpen(false);
    submitLegacyAnswer();
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
      // C3: practice accuracy never confers mastery — only a passing recheck
      // (written by the backend) does. Don't optimistically claim mastery here.
      masteredSkillIds: [],
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
      <ProgressBar value={idx + (result ? 1 : 0)} max={items.length} className="mb-4" />
      <Card className="flex min-h-[26rem] flex-col p-4">
        <div ref={questionSurfaceRef} className="relative">
            <div className="mb-4 text-lg leading-relaxed text-ink-900">
            {expressionQuestion ? (
              <FractionExpressionQuestion
                prompt={q.stem || q.prompt || ''}
                value={answer}
                onChange={setAnswer}
                disabled={!!result}
                onEnter={() => {
                  if (!result) {
                    if (!answer) return;
                    openReviewModal();
                  }
                }}
              />
            ) : (
              <MathText text={q.stem} />
            )}
          </div>
          <VisualBlock visual={q.visual} />
        </div>
            <div className="mb-3">
          <WorkingPreviewCard
            workingImage={currentFullscreenWorking.workingImage || ''}
            workingSubmitted={Boolean(currentFullscreenWorking.workingSubmitted)}
            onOpen={() => setFullscreenOpen(true)}
            onRemove={currentFullscreenWorking.workingSubmitted ? () => setFullscreenWorkingState((prev) => {
              const next = { ...prev };
              delete next[q.questionId];
              return next;
            }) : null}
          />
        </div>
        {q.type === 'mcq' ? (
          <div className="grid gap-2">
            {choices.map((c, i) => (
              <button key={`${i}-${c}`} disabled={!!result} onClick={() => setAnswer(c)} className={`rounded-xl border px-3 py-2 text-left ${answer === c ? 'border-navy-500 bg-navy-50' : 'border-hairline hover:bg-navy-50'}`}>
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
                    openReviewModal();
                  }
                }}
          />
        ) : (
          <AnswerInputRenderer
            question={q}
            value={answer}
            onChange={setAnswer}
            disabled={!!result}
            onEnter={() => {
              if (!result) {
                if (!answer) return;
                openReviewModal();
              }
            }}
          />
        )}
        {result && (
          <div className="mt-3">
            <AnswerFeedbackCard feedback={result} correctAnswer={result.correctAnswer || q.answer?.display || null} />
          </div>
        )}
        {FEATURE_FLAGS.selfExplanation && result?.correct && (
          <SelfExplanationPrompt
            key={q.questionId}
            skillId={q.skillId}
            questionId={q.questionId}
            sessionId={sessionId}
          />
        )}
        {err && <p className="mt-3 text-sm text-error-700">{err}</p>}
        <div className="mt-auto pt-4">{!result ? <Button size="l" disabled={busy || !answer} onClick={openReviewModal} className="w-full">Submit answer</Button> : <Button size="l" icon={ArrowRight} onClick={next} className="w-full">{isLast ? sessionMeta.finishLabel : 'Next question'}</Button>}</div>
      </Card>
      <FullScreenWorkingMode
        open={fullscreenOpen}
        questionId={q.questionId}
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
        initialMathObjects={currentFullscreenWorking.workingMathObjects || []}
        onClose={() => setFullscreenOpen(false)}
        onSave={(payload) => {
          setFullscreenWorkingState((prev) => ({
            ...prev,
            [q.questionId]: {
              ...payload,
              workingOnPaper: false,
              workingOnPaperAt: null,
              workingNotNeeded: false,
              workingNotNeededAt: null,
            },
          }));
          setFullscreenOpen(false);
        }}
      />
      <SubmissionReviewModal
        open={reviewModalOpen}
        title="Review this submission"
        reflection={reflection}
        reflectionOptions={REFLECTION_OPTIONS}
        onReflectionChange={(value) => { setReflection(value); setHelpRequested(value === 'i_need_help'); }}
        working={currentFullscreenWorking}
        workingRequirementLevel={workingRequirementLevel}
        onDeclareNotNeeded={(checked) => setFullscreenWorkingState((prev) => ({
          ...prev,
          [q.questionId]: {
            ...(prev[q.questionId] || {}),
            workingSubmitted: false,
            workingSubmittedAt: null,
            workingImage: '',
            workingStrokes: [],
            workingMathObjects: [],
            workingOnPaper: false,
            workingNotNeeded: checked,
            workingNotNeededAt: checked ? new Date().toISOString() : null,
          },
        }))}
        onDeclareOnPaper={(checked) => setFullscreenWorkingState((prev) => ({
          ...prev,
          [q.questionId]: {
            ...(prev[q.questionId] || {}),
            workingSubmitted: false,
            workingSubmittedAt: null,
            workingImage: '',
            workingStrokes: [],
            workingMathObjects: [],
            workingOnPaper: checked,
            workingOnPaperAt: checked ? new Date().toISOString() : null,
            workingNotNeeded: false,
            workingNotNeededAt: null,
          },
        }))}
        onOpenWorking={() => setFullscreenOpen(true)}
        confirmLabel="Check answer"
        onConfirm={confirmReview}
        onClose={() => setReviewModalOpen(false)}
        busy={busy}
        canSubmit={() => Boolean(reflection && workingReady)}
      />
    </div>
  );
}

export default function PracticeSession() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const isMathPathRoute = location.pathname.startsWith('/student/mathpath/practice/');
  const hasLegacyItems = Boolean(location.state?.items?.length);
  const authenticatedStudentId = user?._id || user?.id || user?.email || '';
  const requestedSkillId = location.state?.skillId || '';
  const progressDomainKey = deriveDomainKey(requestedSkillId);
  const progressState = authenticatedStudentId
    ? getMathPathDomainProgressState(authenticatedStudentId, progressDomainKey) || {}
    : {};
  const resolvedIntent = resolvePracticeIntent({
    routeSessionId,
    locationState: location.state || {},
    progress: progressState,
  });
  const locationQuestionFamilyId = location.state?.questionFamilyId || null;
  const locationAssignmentId = location.state?.assignmentId || '';
  const locationWeakSkillIds = Array.isArray(location.state?.weakSkillIds) ? location.state.weakSkillIds : [];
  const locationRecentMistakeTypes = Array.isArray(location.state?.recentMistakeTypes) ? location.state.recentMistakeTypes : [];
  const locationWeakSkillIdsKey = locationWeakSkillIds.join('|');
  const locationRecentMistakeTypesKey = locationRecentMistakeTypes.join('|');
  const sessionType = resolvedIntent.sessionType;
  const storyModeEnabled = isFractionsStoryModeEnabled();
  const sessionMeta = SESSION_META[sessionType];

  const studentId = authenticatedStudentId;
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
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [submissionReviewOpen, setSubmissionReviewOpen] = useState(false);
  const [fullscreenWorkingByQuestion, setFullscreenWorkingByQuestion] = useState({});
  const [fullscreenQuestionId, setFullscreenQuestionId] = useState(null);
  const [questionZoom, setQuestionZoom] = useState(1);
  const [workingSession, setWorkingSession] = useState(null);
  const [workingCodeByQuestion, setWorkingCodeByQuestion] = useState({});
  const questionSurfaceRef = useRef(null);
  const sessionStartingRef = useRef(false);

  const isMainFlowRender = isMathPathRoute && !hasLegacyItems && sessionType !== 'story';

  useEffect(() => {
    if (!isMainFlowRender) return undefined;
    // Guard against re-entry — the effect can re-fire before the first API
    // call completes (e.g. navigate changes routeSessionId in the deps).
    if (sessionStartingRef.current) return undefined;
    sessionStartingRef.current = true;
    let mounted = true;
    (async () => {
      try {
        let started = null;
        if (isPersistedPracticeSessionId(routeSessionId)) {
          const { data } = await mathpathAPI.getFractionPractice(routeSessionId);
          started = {
            practiceSessionId: data.practiceSessionId,
            studentId: data.studentId,
            domainId: data.domainId,
            targetSkillId: data.targetSkillId,
            targetQuestionFamilyIds: data.targetQuestionFamilyIds || [],
            sessionType: data.sessionType || sessionType,
            questions: data.questions || [],
            workingExpected: Boolean(data.workingExpected),
            workingSessionId: data.workingSessionId || null,
            assignmentId: data.assignmentId || locationAssignmentId,
            startedAt: data.startedAt,
          };
          if (data.status === 'completed' && data.summary?.results?.length) {
            if (!mounted) return;
            setQuestions(data.questions || []);
            setSummary(data.summary);
            setFlowSession(started);
            setLoading(false);
            return;
          }
        } else if (isP1SkillId(resolvedIntent.requestedSkillId) || isP2SkillId(resolvedIntent.requestedSkillId) || isP3SkillId(resolvedIntent.requestedSkillId) || isP4SkillId(resolvedIntent.requestedSkillId) || isP5SkillId(resolvedIntent.requestedSkillId) || isP6SkillId(resolvedIntent.requestedSkillId)) {
          // ── P1 / P3 domain (client-side generation) ────────────────
          const startFn = isP6SkillId(resolvedIntent.requestedSkillId)
            ? startP6PracticeFlow
            : isP5SkillId(resolvedIntent.requestedSkillId)
            ? startP5PracticeFlow
            : isP4SkillId(resolvedIntent.requestedSkillId)
            ? startP4PracticeFlow
            : isP2SkillId(resolvedIntent.requestedSkillId)
            ? startP2PracticeFlow
            : isP3SkillId(resolvedIntent.requestedSkillId)
            ? startP3PracticeFlow
            : startP1PracticeFlow;
          started = startFn({
            studentId,
            sessionType,
            requestedSkillId: resolvedIntent.requestedSkillId,
            requestedQuestionFamilyId: locationQuestionFamilyId,
            sessionLength:
              resolvedIntent.questionCount
              || (sessionType === 'warmup'
                ? 3
                : sessionType === 'diagnostic' || sessionType === 'mastery_check'
                  ? 10
                  : sessionType === 'remediation'
                    ? 5
                : 6),
            weakSkillIds: locationWeakSkillIds,
            recentMistakeTypes: locationRecentMistakeTypes,
          });
          // Persist the session to the backend so the submit route can find it.
          // Fire-and-forget — the student starts practicing immediately.
          const apiStart = isP6SkillId(resolvedIntent.requestedSkillId)
            ? mathpathAPI.startP6Practice
            : isP5SkillId(resolvedIntent.requestedSkillId)
              ? mathpathAPI.startP5Practice
            : isP4SkillId(resolvedIntent.requestedSkillId)
              ? mathpathAPI.startP4Practice
            : isP2SkillId(resolvedIntent.requestedSkillId)
              ? mathpathAPI.startP2Practice
            : isP3SkillId(resolvedIntent.requestedSkillId)
              ? mathpathAPI.startP3Practice
              : mathpathAPI.startP1Practice;
          apiStart({
            practiceSessionId: started.practiceSessionId,
            domainId: started.domainId || '',
            targetSkillId: started.targetSkillId || resolvedIntent.requestedSkillId,
            sessionType: started.sessionType || sessionType,
            sessionLabel: started.sessionLabel || 'Practice',
            questions: started.questions || [],
          }).catch((err) => console.warn('[session-start] backend persist failed', err));
        } else {
          // ── Fractions domain (API first, client fallback) ───────────
          try {
            const { data } = await mathpathAPI.startFractionPractice({
              sessionType,
              skillId: resolvedIntent.requestedSkillId,
              questionFamilyId: locationQuestionFamilyId,
              questionCount:
                resolvedIntent.questionCount
                || (sessionType === 'warmup'
                  ? 3
                  : sessionType === 'diagnostic' || sessionType === 'mastery_check'
                    ? 10
                    : sessionType === 'remediation'
                      ? 5
                  : 6),
              weakSkillIds: locationWeakSkillIds,
              recentMistakeTypes: locationRecentMistakeTypes,
              assignmentId: locationAssignmentId,
            });
            started = data;
            if (mounted && data?.practiceSessionId) {
              navigate(`/student/mathpath/practice/${data.practiceSessionId}`, {
                replace: true,
                state: {
                  ...location.state,
                  skillId: data.targetSkillId || resolvedIntent.requestedSkillId,
                  sessionType: data.sessionType || sessionType,
                  questionCount: data.questions?.length || resolvedIntent.questionCount,
                  assignmentId: data.assignmentId || locationAssignmentId,
                },
              });
            }
          } catch (apiError) {
            started = startFractionPracticeFlow({
              studentId,
              domainId: 'fractions',
              sessionType,
              requestedSkillId: resolvedIntent.requestedSkillId,
              requestedQuestionFamilyId: locationQuestionFamilyId,
              sessionLength:
                resolvedIntent.questionCount
                || (sessionType === 'warmup'
                  ? 3
                  : sessionType === 'diagnostic' || sessionType === 'mastery_check'
                    ? 10
                    : sessionType === 'remediation'
                      ? 5
                  : 6),
              weakSkillIds: locationWeakSkillIds,
              recentMistakeTypes: locationRecentMistakeTypes,
            });
          }
        }
        if (!mounted) return;
        setFlowSession(started);
        const { valid, skipped } = filterDisplayablePracticeQuestions(started.questions || []);
        if (skipped.length) {
          console.warn('[PracticeSession] skipped diagram question(s) that could not render', skipped.map(({ question, validation }) => ({
            questionId: question?.questionId,
            skillId: question?.skillId,
            prompt: question?.prompt || question?.stem,
            reason: validation.reason,
          })));
        }
        setQuestions(valid);
        setWorkingSession(null);
        setWorkingCodeByQuestion({});
        // Pre-populate workingNotNeeded for P1/P3 LOW-requirement questions so
        // students don't have to manually check the box for simple counting etc.
        const workingInit = {};
        valid.forEach((q) => {
          if ((isP1SkillId(q.skillId) || isP2SkillId(q.skillId) || isP3SkillId(q.skillId) || isP4SkillId(q.skillId) || isP5SkillId(q.skillId) || isP6SkillId(q.skillId)) && resolveWorkingRequirementLevel(q, sessionType) === 'LOW') {
            workingInit[q.questionId] = { workingNotNeeded: true, workingNotNeededAt: new Date().toISOString() };
          }
        });
        setFullscreenWorkingByQuestion(workingInit);
        setFullscreenQuestionId(null);
        if (!valid.length) setError(skipped.length ? DIAGRAM_LOAD_ERROR_MESSAGE : 'No questions generated yet. Please try another skill.');
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Could not start practice session.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; sessionStartingRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate is a stable
  // ref from react-router v6; including it caused re-entry loops that spammed
  // 1800+ duplicate sessions during the pilot.
  }, [
    isMainFlowRender,
    studentId,
    routeSessionId,
    sessionType,
    resolvedIntent.requestedSkillId,
    resolvedIntent.questionCount,
    locationQuestionFamilyId,
    locationAssignmentId,
    locationWeakSkillIdsKey,
    locationRecentMistakeTypesKey,
  ]);

  useEffect(() => {
    if (!isMainFlowRender) return;
    if (summary || loading || !questions.length) return;
    setQuestionStartedAt(Date.now());
    setElapsedSec(0);
  }, [isMainFlowRender, idx, summary, loading, questions.length]);

  useEffect(() => {
    if (!isMainFlowRender) return undefined;
    if (summary || loading || !questions.length) return undefined;
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - questionStartedAt) / 1000)), 250);
    return () => clearInterval(t);
  }, [isMainFlowRender, summary, loading, questions.length, questionStartedAt]);

  useEffect(() => {
    if (!isMainFlowRender) return undefined;
    if (!flowSession || !questions.length || workingSession) return undefined;
    let cancelled = false;
    const practiceSessionId = flowSession.practiceSessionId || routeSessionId;
    const questionRefs = questions.map((question) => {
      const requirement = resolveWorkingRequirement(question, sessionType);
      return {
        questionId: question.questionId,
        skillId: question.skillId || flowSession.targetSkillId || '',
        domainId: question.domainId || flowSession?.domainId || 'fractions',
        sessionId: practiceSessionId,
        prompt: question.prompt || question.stem || '',
        correctAnswer: question.answer?.display || '',
        solutionSteps: question.solutionSteps || [],
        expectedStepCount: Array.isArray(question.solutionSteps) ? question.solutionSteps.length : null,
        questionType: question.type || question.questionFamilyId || '',
        workingRequired: requirement.required,
        workingReason: requirement.required ? `${sessionType}_required` : `${sessionType}_optional`,
      };
    });

    mathpathAPI.createWorkingSession({
      studentId,
      practiceSessionId,
      domainId: flowSession?.domainId || 'fractions',
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
  }, [isMainFlowRender, flowSession, questions, routeSessionId, sessionType, studentId, workingSession]);

  // ── Conditional early returns (all hooks declared above) ──
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
  if (!isMathPathRoute || hasLegacyItems) return <LegacyPracticeSession />;

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
  const currentQuestionValidation = validatePracticeQuestionForDisplay(q);
  const isLast = idx === questions.length - 1;
  const answered = Boolean(feedback) && !retrying;
  const choices = q.type === 'mcq' ? [...new Set(q.choices || [])] : [];

  const handleTryAgain = () => {
    setAnswer('');
    setRetrying(true);
    setRetryCount((c) => c + 1);
  };
  const useFractionInput = shouldUseFractionAnswerInput(q);
  const expressionQuestion = useFractionInput && Boolean(extractFractionExpression(q.prompt || q.stem || ''));
  const workingRequirementLevel = resolveWorkingRequirementLevel(q, sessionType);
  const currentFullscreenWorking = fullscreenWorkingByQuestion[q.questionId] || {};
  const workingReady = hasWorkingDecision(currentFullscreenWorking);
  const questionText = q.prompt || q.stem || '';
  const primaryWorkingImage = currentFullscreenWorking.workingImage || '';
  const primaryWorkingStrokes = currentFullscreenWorking.workingStrokes || [];
  const primaryWorkingMathObjects = currentFullscreenWorking.workingMathObjects || [];
  const primaryWorkingSubmitted = currentFullscreenWorking.workingSubmitted;
  const primaryWorkingSubmittedAt = currentFullscreenWorking.workingSubmittedAt || null;
  const workingEvidence = [
    currentFullscreenWorking.workingSubmitted ? {
      source: 'fullscreen_working',
      image: currentFullscreenWorking.workingImage || '',
      strokes: currentFullscreenWorking.workingStrokes || [],
      mathObjects: currentFullscreenWorking.workingMathObjects || [],
      submittedAt: currentFullscreenWorking.workingSubmittedAt || null,
      canvasDimensions: currentFullscreenWorking.canvasDimensions || null,
      viewportDimensions: currentFullscreenWorking.viewportDimensions || null,
    } : null,
  ].filter(Boolean);

  const onSubmitCurrent = () => {
    if (busy || answered) return;
    if (!currentQuestionValidation.ok) return;

    // Retry path — student is re-submitting after using hints
    if (retrying && answer) {
      const retryCheck = (isP1SkillId(q.skillId) || isP2SkillId(q.skillId) || isP3SkillId(q.skillId) || isP4SkillId(q.skillId) || isP5SkillId(q.skillId) || isP6SkillId(q.skillId))
        ? (isP6SkillId(q.skillId)
          ? checkP6AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP5SkillId(q.skillId)
          ? checkP5AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP4SkillId(q.skillId)
          ? checkP4AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP2SkillId(q.skillId)
          ? checkP2AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP3SkillId(q.skillId)
          ? checkP3AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : checkP1AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q }))
        : checkFractionAnswer({
            studentAnswer: answer,
            correctAnswer: q.answer,
            acceptedAnswers: q.acceptedAnswers || [],
          });
      setRetrying(false);
      if (retryCheck.correct) {
        const nextStreak = correctStreak + 1;
        setCorrectStreak(nextStreak);
        setFeedback({
          correct: true,
          skipped: false,
          title: 'Got it!',
          message: 'You figured it out! That takes real grit.',
          streakMessage: '',
          showConfetti: false,
          correctAnswer: null,
        });
        confettiBurst({ count: 60, duration: 1200 });
      } else {
        setFeedback((prev) => ({
          ...prev,
          retryExhausted: true,
          message: "Not quite — let's review the full solution.",
        }));
      }
      return;
    }

    if (!answer || !reflection || !workingReady) return;
    const timeTaken = Math.max(1, Math.floor((Date.now() - questionStartedAt) / 1000));
    const answerCheck = (isP1SkillId(q.skillId) || isP2SkillId(q.skillId) || isP3SkillId(q.skillId) || isP4SkillId(q.skillId) || isP5SkillId(q.skillId) || isP6SkillId(q.skillId))
      ? (isP6SkillId(q.skillId)
          ? checkP6AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP5SkillId(q.skillId)
          ? checkP5AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP4SkillId(q.skillId)
          ? checkP4AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP2SkillId(q.skillId)
          ? checkP2AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
          : isP3SkillId(q.skillId)
        ? checkP3AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q })
        : checkP1AnswerForSession({ studentAnswer: answer, correctAnswer: q.answer, question: q }))
      : checkFractionAnswer({
          studentAnswer: answer,
          correctAnswer: q.answer,
          acceptedAnswers: q.acceptedAnswers || [],
        });
    const attemptId = createClientAttemptId({
      sessionId: flowSession.practiceSessionId || routeSessionId,
      questionId: q.questionId,
      attemptNumber: 1,
    });
    const current = {
      attemptId,
      questionId: q.questionId,
      answer,
      answerCorrect: answerCheck.correct,
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
      workingMathObjects: primaryWorkingMathObjects,
      workingSubmitted: Boolean(primaryWorkingSubmitted),
      workingSubmittedAt: primaryWorkingSubmittedAt,
      workingNotNeeded: Boolean(currentFullscreenWorking.workingNotNeeded),
      workingRequirementLevel,
      workingOnPaper: Boolean(currentFullscreenWorking.workingOnPaper),
      workingUploaded: Boolean(primaryWorkingSubmitted),
      fullscreenWorkingImage: currentFullscreenWorking.workingImage || '',
      fullscreenWorkingStrokes: currentFullscreenWorking.workingStrokes || [],
      fullscreenWorkingMathObjects: currentFullscreenWorking.workingMathObjects || [],
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
      hintsUsed: retryCount,
    };
    const nextStreak = answerCheck.correct ? correctStreak + 1 : 0;
    setCorrectStreak(nextStreak);
    setResponses((prev) => [...prev, current]);
    const answerFeedback = {
      ...buildAnswerFeedback({
        correct: answerCheck.correct,
        timeTaken,
        estimatedSeconds: q.estimatedSeconds,
        skipped: false,
        streak: nextStreak,
        questionId: q.questionId,
      }),
      correct: answerCheck.correct,
      skipped: false,
      correctAnswer: q.answer?.display || null,
    };
    setFeedback(answerFeedback);
    if (answerCheck.correct) {
      confettiBurst({ count: nextStreak >= 3 ? 160 : 80, duration: nextStreak >= 3 ? 2200 : 1400 });
    }
  };

  const openSubmissionReview = () => {
    if (!answer || !reflection) return;
    if (!currentQuestionValidation.ok) return;
    if (retrying) { onSubmitCurrent(); return; }
    if (workingReady) { onSubmitCurrent(); return; }
    setSubmissionReviewOpen(true);
  };

  const confirmSubmissionReview = () => {
    if (!answer || !reflection || !workingReady || busy || answered) return;
    setSubmissionReviewOpen(false);
    onSubmitCurrent();
  };

  const onSkipCurrent = () => {
    if (busy || answered) return;
    const timeTaken = Math.max(1, Math.floor((Date.now() - questionStartedAt) / 1000));
    const attemptId = createClientAttemptId({
      sessionId: flowSession.practiceSessionId || routeSessionId,
      questionId: q.questionId,
      attemptNumber: 1,
    });
    setCorrectStreak(0);
    setResponses((prev) => [...prev, {
      attemptId,
      questionId: q.questionId,
      answer: '',
      answerCorrect: false,
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
      workingMathObjects: primaryWorkingMathObjects,
      workingSubmitted: Boolean(primaryWorkingSubmitted),
      workingSubmittedAt: primaryWorkingSubmittedAt,
      workingNotNeeded: Boolean(currentFullscreenWorking.workingNotNeeded),
      workingRequirementLevel,
      workingOnPaper: Boolean(currentFullscreenWorking.workingOnPaper),
      workingUploaded: Boolean(primaryWorkingSubmitted),
      fullscreenWorkingImage: currentFullscreenWorking.workingImage || '',
      fullscreenWorkingStrokes: currentFullscreenWorking.workingStrokes || [],
      fullscreenWorkingMathObjects: currentFullscreenWorking.workingMathObjects || [],
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
      ...buildAnswerFeedback({ correct: false, skipped: true }),
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
      setRetryCount(0);
      setRetrying(false);
      setQuestionStartedAt(Date.now());
      return;
    }

    setBusy(true);
    try {
      const payload = responses.map((r) => ({
        attemptId: r.attemptId || '',
        questionId: r.questionId,
        skillId: questions.find((question) => question.questionId === r.questionId)?.skillId || flowSession?.targetSkillId || '',
        answer: r.answer ?? r.studentAnswer,
        answerCorrect: Boolean(r.answerCorrect ?? r._correct),
        studentAnswer: r.studentAnswer,
        timeTaken: r.timeTaken,
        confidence: r.confidence,
        reflection: r.reflection || r.confidence || '',
        helpRequested: Boolean(r.helpRequested),
        confidenceCalibration: r.confidenceCalibration,
        possibleMisconception: r.possibleMisconception,
        workingImage: r.workingImage || '',
        workingStrokes: r.workingStrokes || [],
        workingMathObjects: r.workingMathObjects || [],
        workingSubmitted: Boolean(r.workingSubmitted),
        workingSubmittedAt: r.workingSubmittedAt || null,
        workingNotNeeded: Boolean(r.workingNotNeeded),
        workingRequirementLevel: r.workingRequirementLevel || 'MEDIUM',
        workingOnPaper: Boolean(r.workingOnPaper),
        workingUploaded: Boolean(r.workingUploaded),
        fullscreenWorkingImage: r.fullscreenWorkingImage || '',
        fullscreenWorkingStrokes: r.fullscreenWorkingStrokes || [],
        fullscreenWorkingMathObjects: r.fullscreenWorkingMathObjects || [],
        fullscreenWorkingSubmitted: Boolean(r.fullscreenWorkingSubmitted),
        fullscreenWorkingSubmittedAt: r.fullscreenWorkingSubmittedAt || null,
        workingEvidence: Array.isArray(r.workingEvidence) ? r.workingEvidence : [],
        workingCode: r.workingCode || '',
        workingSessionId: r.workingSessionId || workingSession?.workingSessionId || '',
        skipped: Boolean(r.skipped || r._skipped),
        timestamp: r.timestamp,
        attemptNumber: r.attemptNumber,
      }));
      let submitted;
      const sessionSkillId = flowSession?.targetSkillId || questions[0]?.skillId;
      const isP1Session = isP1SkillId(sessionSkillId);
      const isP2Session = isP2SkillId(sessionSkillId);
      const isP3Session = isP3SkillId(sessionSkillId);
      const isP4Session = isP4SkillId(sessionSkillId);
      const isP5Session = isP5SkillId(sessionSkillId);
      const isP6Session = isP6SkillId(sessionSkillId);
      if (isP1Session || isP2Session || isP3Session || isP4Session || isP5Session || isP6Session) {
        const submitFn = isP6Session ? submitP6PracticeAttempt : isP5Session ? submitP5PracticeAttempt : isP4Session ? submitP4PracticeAttempt : isP2Session ? submitP2PracticeAttempt : isP3Session ? submitP3PracticeAttempt : submitP1PracticeAttempt;
        submitted = submitFn({
          practiceSessionId: flowSession.practiceSessionId || routeSessionId,
          studentId,
          sessionType,
          responses: payload,
        });
        try {
          const apiSubmit = isP6Session ? mathpathAPI.submitP6Practice : isP5Session ? mathpathAPI.submitP5Practice : isP4Session ? mathpathAPI.submitP4Practice : isP2Session ? mathpathAPI.submitP2Practice : isP3Session ? mathpathAPI.submitP3Practice : mathpathAPI.submitP1Practice;
          const { data: persisted } = await apiSubmit(
            flowSession.practiceSessionId || routeSessionId,
            { sessionType, responses: payload },
          );
          submitted = { ...submitted, ...persisted, persisted: true };
        } catch (persistErr) {
          console.error('[session-complete] primary practice backend persist failed — results saved locally', persistErr);
        }
      } else if (flowSession?.persisted || isPersistedPracticeSessionId(flowSession.practiceSessionId || routeSessionId)) {
        const { data } = await mathpathAPI.submitFractionPractice(flowSession.practiceSessionId || routeSessionId, {
          sessionType,
          responses: payload,
        });
        submitted = data;
      } else {
        // This session was generated client-side because the backend was
        // unavailable at start. Compute the result locally for display, then make
        // a best-effort attempt to persist it now in case the backend has
        // recovered — so attempts/skill-state evidence isn't silently lost.
        submitted = await submitFractionPracticeAttempt({
          practiceSessionId: flowSession.practiceSessionId || routeSessionId,
          studentId,
          sessionType,
          responses: payload,
        });
        try {
          await mathpathAPI.submitFractionPractice(flowSession.practiceSessionId || routeSessionId, {
            sessionType,
            responses: payload,
            questions,
            targetSkillId: flowSession?.targetSkillId || q.skillId || '',
            targetQuestionFamilyIds: flowSession?.targetQuestionFamilyIds || [],
            assignmentId: flowSession?.assignmentId || locationAssignmentId || '',
          });
          submitted = { ...submitted, persisted: true };
        } catch (persistErr) {
          // Backend still unreachable — keep the local result but mark the session
          // as unpersisted so pilot analytics can see degraded-mode evidence gaps.
          submitted = { ...submitted, persisted: false, evidenceMode: 'local_unpersisted' };
          Promise.resolve(
            learningTelemetryAPI.recordEvent({
              studentId,
              eventType: 'practice_session_unpersisted',
              domain: 'fractions',
              skillCode: flowSession?.targetSkillId || q.skillId || '',
              sessionId: flowSession.practiceSessionId || routeSessionId,
              timestamp: new Date().toISOString(),
              metadata: { sessionType, answered: Array.isArray(payload) ? payload.length : 0 },
            })
          ).catch((e) => console.warn("PracticeSession: fetch failed", e));
        }
      }
      try {
        await persistGeneratedFractionMistakes({
          practiceSessionId: flowSession.practiceSessionId || routeSessionId,
          results: submitted.results || [],
          questions,
        });
      } catch (err) {
        console.error('[mistakes] failed to create generated fraction mistakes', err);
      }
      const digitalWorking = buildDigitalWorkingUploadPayload({
        responses: submitted.results || payload,
        questions,
        workingSessionId: submitted.workingSessionId || workingSession?.workingSessionId || '',
        sessionId: flowSession.practiceSessionId || routeSessionId,
      });
      const analysisWorkingSessionId = submitted.workingSessionId || workingSession?.workingSessionId || '';
      if (analysisWorkingSessionId && digitalWorking) {
        const formData = new FormData();
        formData.append('digitalInkData', JSON.stringify(digitalWorking));
        await mathpathAPI.uploadWorking(analysisWorkingSessionId, formData).catch((err) => {
          console.error('[working-intelligence] automatic analysis upload failed', err);
        });
      }
      const telemetryEvents = buildPracticeTelemetryEvents({
        studentId,
        sessionType,
        practiceSessionId: flowSession.practiceSessionId || routeSessionId,
        results: submitted.results || [],
      });
      if (telemetryEvents.length) {
        Promise.allSettled(telemetryEvents.map((event) => learningTelemetryAPI.recordEvent(event))).catch((e) => console.warn("PracticeSession: fetch failed", e));
      }
      const weakSkillRows = submitted.accuracySummary?.accuracyPercentage < 80
        ? [{ skillId: flowSession?.targetSkillId || q.skillId, skillName: canonicalSkillName(flowSession?.targetSkillId || q.skillId, '') }]
        : [];
      persistDomainSessionProgress({
        studentId,
        sessionType,
        currentSkillId: flowSession?.targetSkillId || q.skillId || null,
        weakSkillIds: weakSkillRows,
        // C3: practice accuracy never confers mastery — only a passing recheck
        // (written by the backend) does. Don't optimistically claim mastery here.
        masteredSkillIds: [],
        fluentSkillIds: submitted.fluencySummary?.fluentCount > 0
          ? [flowSession?.targetSkillId || q.skillId].filter(Boolean)
          : [],
      });
      setSummary(submitted);
    } catch (e) {
      setError(e.message || 'Failed to submit session.');
    } finally {
      setBusy(false);
    }
  };

  const tryAnotherQuestion = () => {
    if (!isLast) {
      setIdx((i) => i + 1);
      setAnswer('');
      setReflection('');
      setHelpRequested(false);
      setFeedback(null);
      setRetryCount(0);
      setRetrying(false);
      setQuestionStartedAt(Date.now());
      return;
    }
    navigate('/student/mathpath', { replace: true });
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
      <div className={`mx-auto max-w-xl ${visualStyles.page}`}>
        <Card className={`p-6 ${visualStyles.accentCard}`}>
          <h2 className="text-xl font-semibold text-ink-900">{sessionMeta.label} Complete</h2>
          <div className="mt-4 space-y-2 text-sm text-ink-700">
            <p><span className="font-semibold">Accuracy:</span> {summary.accuracySummary?.accuracyPercentage ?? 0}%</p>
            <p><span className="font-semibold">Average time:</span> {summary.accuracySummary?.averageSeconds ?? 0}s</p>
            <p><span className="font-semibold">Fluency:</span> {fluencyLabel}</p>
            <p><span className="font-semibold">Next action:</span> {labelForNextAction(summary.nextRecommendedAction)}</p>
            {summary.questionWorkingSummary && (
              <p>
                <span className="font-semibold">Working:</span>{' '}
                {summary.questionWorkingSummary.workingSubmitted || 0} submitted · {summary.questionWorkingSummary.workingOnPaper || 0} on paper · {summary.questionWorkingSummary.workingNotNeeded || 0} not needed · {summary.questionWorkingSummary.missingWorking || 0} missing
              </p>
            )}
          </div>
          {summary.questionWorkingSummary?.allNoWorkingDeclarations && (
            <div className="mt-4 rounded-xl border border-success-200 bg-success-100 p-3 text-sm text-success-700">
              No working upload needed. You have declared working was not needed for these questions.
            </div>
          )}
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
    <div className={`mx-auto max-w-7xl ${visualStyles.page}`}>
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-sm text-ink-700 shadow-resting">
        <MascotAvatar name="kylo" size="sm" showRing={false} />
        <div>
          <p className="font-semibold">{sessionMeta.label}</p>
          <p className="text-xs text-ink-500">{sessionMeta.helper}</p>
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono tabular-nums">Question {idx + 1} of {questions.length}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono">{elapsedSec}s</span>
          <button
            type="button"
            onClick={() => {
              // Leaving mid-session never completes the session or counts toward
              // mastery — completion only happens when the student finishes. Confirm
              // only when there is in-progress work that would be lost.
              const exitTo = location.state?.homeBase || location.state?.backTo || '/student/mathpath';
              const hasProgress = responses.length > 0 || Boolean(answer);
              if (hasProgress && typeof window !== 'undefined'
                && !window.confirm("Exit practice? This session won't be saved and won't count yet. You can start again any time.")) {
                return;
              }
              navigate(exitTo, { replace: true });
            }}
            className="rounded-lg border border-hairline bg-white px-3 py-1 text-xs font-semibold text-ink-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          >
            Exit practice
          </button>
        </div>
      </div>
      <ProgressBar value={idx + (answered ? 1 : 0)} max={questions.length} className="mb-4" barClassName={visualStyles.progress} />

      <Card className={`notebook-bg overflow-hidden p-3 sm:p-4 xl:h-[calc(100vh-18rem)] xl:min-h-[30rem] ${visualStyles.accentCard}`}>
        <style>{`
          .notebook-bg {
            background-image:
              linear-gradient(to right, transparent 39px, #e8d5c4 39px, #e8d5c4 41px, transparent 41px),
              repeating-linear-gradient(transparent, transparent 31px, #e0dce8 31px, #e0dce8 32px);
            background-color: #fefcf9;
          }
        `}</style>
        {!currentQuestionValidation.ok ? (
          <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 text-sm text-ink-700">
            <p className="font-semibold text-navy-700">{DIAGRAM_LOAD_ERROR_MESSAGE}</p>
            <p className="mt-1 text-ink-500">This visual question needs a diagram before it can be answered.</p>
            <Button className="mt-4" onClick={tryAnotherQuestion}>
              Try another question
            </Button>
          </div>
        ) : (
          <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
          <section className="min-w-0 min-h-0 xl:overflow-y-auto xl:pr-1">
            <div className="mb-2 flex items-center justify-end gap-2">
              <ReadAloudButton text={q.prompt || q.stem || ''} />
              <QuestionZoomControls value={questionZoom} onChange={setQuestionZoom} />
            </div>
            <div ref={questionSurfaceRef} className="relative origin-top-left" style={{ zoom: questionZoom }}>
            <div className="mb-4 text-lg leading-relaxed text-ink-900">
                {expressionQuestion ? (
                  <FractionExpressionQuestion
                    prompt={q.prompt || q.stem || ''}
                    value={answer}
                    onChange={setAnswer}
                    disabled={answered}
                    onEnter={() => {
                      if (!answered) openSubmissionReview();
                    }}
                  />
                ) : (
                  <MathText text={q.prompt || q.stem} />
                )}
              </div>
              <QuestionDiagram question={q} />
              <VisualBlock visual={q.visual} />
            </div>

          </section>

          <aside className={`min-w-0 min-h-0 rounded-2xl p-2 sm:p-3 xl:h-full xl:overflow-y-auto ${visualStyles.softCard}`}>
            <div className="rounded-xl border border-hairline bg-white p-2 sm:p-3">
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
                    if (!answered) openSubmissionReview();
                  }}
                />
              ) : (
                <AnswerInputRenderer
                  question={q}
                  value={answer}
                  onChange={setAnswer}
                  disabled={answered}
                  onEnter={() => {
                    if (!answered) openSubmissionReview();
                  }}
                />
              )}
            </div>

            {!answered && answer && (
              <div className="mt-2 rounded-xl border border-hairline bg-white p-2">
                <p className="mb-1 text-xs font-semibold text-ink-600">How sure are you?</p>
                <div className="grid grid-cols-3 gap-1">
                  {REFLECTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={busy}
                      onClick={() => setReflection(opt.value)}
                      className={`rounded-lg border px-2 py-1.5 text-xs ${reflection === opt.value ? 'border-navy-500 bg-navy-50 font-semibold text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2">
              <AnswerFeedbackCard feedback={feedback} correctAnswer={feedback?.correctAnswer} solutionSteps={q.solutionSteps} onTryAgain={handleTryAgain} />
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {!answered ? (
                <>
                  <Button variant="outlineLight" disabled={busy} onClick={onSkipCurrent}>Skip</Button>
                  <Button disabled={busy || !answer || !reflection} onClick={openSubmissionReview}>Submit answer</Button>
                </>
              ) : (
                <Button className="sm:col-span-2" icon={ArrowRight} disabled={busy} onClick={nextOrFinish}>
                  {isLast ? sessionMeta.finishLabel : 'Next question'}
                </Button>
              )}
            </div>

            <div className="mt-2">
              <WorkingPreviewCard
                workingImage={currentFullscreenWorking.workingImage || ''}
                workingSubmitted={Boolean(currentFullscreenWorking.workingSubmitted)}
                onOpen={() => setFullscreenQuestionId(q.questionId)}
                onRemove={currentFullscreenWorking.workingSubmitted ? () => setFullscreenWorkingByQuestion((prev) => {
                  const next = { ...prev };
                  delete next[q.questionId];
                  return next;
                }) : null}
              />
            </div>
          </aside>
          </div>
        )}
      </Card>
      <FullScreenWorkingMode
        open={fullscreenQuestionId === q.questionId}
        questionId={q.questionId}
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
        initialMathObjects={currentFullscreenWorking.workingMathObjects || []}
        onClose={() => setFullscreenQuestionId(null)}
        onSave={(payload) => {
          setFullscreenWorkingByQuestion((prev) => ({
            ...prev,
            [q.questionId]: {
              ...payload,
              workingOnPaper: false,
              workingOnPaperAt: null,
              workingNotNeeded: false,
              workingNotNeededAt: null,
            },
          }));
          setFullscreenQuestionId(null);
        }}
      />
      <SubmissionReviewModal
        open={submissionReviewOpen}
        title="Before you submit"
        reflection={reflection}
        reflectionOptions={REFLECTION_OPTIONS}
        onReflectionChange={(value) => { setReflection(value); setHelpRequested(value === 'i_need_help'); }}
        working={currentFullscreenWorking}
        workingRequirementLevel={workingRequirementLevel}
        onDeclareNotNeeded={(checked) => setFullscreenWorkingByQuestion((prev) => ({
          ...prev,
          [q.questionId]: {
            ...(prev[q.questionId] || {}),
            workingSubmitted: false,
            workingSubmittedAt: null,
            workingImage: '',
            workingStrokes: [],
            workingMathObjects: [],
            workingOnPaper: false,
            workingNotNeeded: checked,
            workingNotNeededAt: checked ? new Date().toISOString() : null,
          },
        }))}
        onDeclareOnPaper={(checked) => setFullscreenWorkingByQuestion((prev) => ({
          ...prev,
          [q.questionId]: {
            ...(prev[q.questionId] || {}),
            workingSubmitted: false,
            workingSubmittedAt: null,
            workingImage: '',
            workingStrokes: [],
            workingMathObjects: [],
            workingOnPaper: checked,
            workingOnPaperAt: checked ? new Date().toISOString() : null,
            workingNotNeeded: false,
            workingNotNeededAt: null,
          },
        }))}
        onOpenWorking={() => setFullscreenQuestionId(q.questionId)}
        confirmLabel="Submit answer"
        onConfirm={confirmSubmissionReview}
        onClose={() => setSubmissionReviewOpen(false)}
        busy={busy}
        canSubmit={() => Boolean(answer && reflection && workingReady)}
      />
    </div>
  );
}
