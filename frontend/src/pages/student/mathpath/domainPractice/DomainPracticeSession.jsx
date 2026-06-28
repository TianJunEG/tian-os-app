import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../../components/ui';
import { MascotBubble } from '../../../../components/MascotAvatar';
import { MathText } from '../../../../components/ui/Fraction';
import FullScreenWorkingMode from '../../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../../components/learning/WorkingPreviewCard';
import ManipulativeDotArray, { parseDotStem, numericLine, parseMoneyPrompt, ManipulativeCoinArray, parseCoinsDiagram, ManipulativeMoneyDiagram, parseCountDiagram, ManipulativeCountArray, parseCompareDiagram, ManipulativeCompareSets, parsePatternDiagram, ManipulativePatternStrip } from '../../../../components/learning/ManipulativeDotArray';
import { speak, isVoiceEnabled, setVoiceEnabled } from '../../../../utils/sound';
import { confettiBurst } from '../../../../utils/confetti';
import { useAuth } from '../../../../context/AuthContext';
import { getMascotForModule, getMascotVoice } from '../../../../config/mascots';
import MathSymbolBar from '../components/MathSymbolBar';
import AnswerInputRenderer, { getAnswerInputType } from '../components/AnswerInputRenderer';
import QuestionDiagram, { canRenderQuestionDiagram } from '../components/QuestionDiagram';
import { CONFIDENCE_OPTIONS, CONFIDENCE_OPTIONS_LP } from '../../../../mathpath/confidenceOptions';
import {
  buildSubmitPayload,
  summarisePracticeResult,
  statusTone,
  mascotMessageFor,
  friendlySkillName,
  getDomainConfig,
  getDomainSymbols,
  toSpeakable,
} from './core';

const MASCOT_KEY = getMascotForModule('mathpath')?.key || 'kylo';
const INACTIVITY_SECONDS = 120;

// Canonical confidence scale shared by every practice surface (see
// mathpath/confidenceOptions.js). Uses backend-mapped values so selections are
// never silently dropped from confidence analytics.
const REFLECTION_OPTIONS = CONFIDENCE_OPTIONS;
const LP_REFLECTION_OPTIONS = CONFIDENCE_OPTIONS_LP;

export default function DomainPracticeSession({ domain }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const targetSkillId = params.get('skill') || null;
  const config = getDomainConfig(domain);
  const label = config?.label || 'Maths';
  const backRoute = `/student/mathpath/${domain}`;
  const domainSymbols = getDomainSymbols(domain);

  const { user } = useAuth();
  const sl = String(user?.studentLevel || '').toLowerCase().trim();
  const isLPrimary = /k2|kindy|preschool/.test(sl) || /^p[123]$|^primary [123]$/.test(sl);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState([]);
  const [workingByQuestion, setWorkingByQuestion] = useState({});
  const [workingQuestionId, setWorkingQuestionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const celebratedRef = useRef(false);
  // Celebrate a strong finish (respects the student's confetti/fireworks choice).
  useEffect(() => {
    if (result && !celebratedRef.current && (result.accuracyPercentage ?? 0) >= 80) {
      celebratedRef.current = true;
      setTimeout(() => confettiBurst({ count: result.accuracyPercentage >= 100 ? 160 : 120, duration: 2000 }), 300);
    }
  }, [result]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => isVoiceEnabled());

  const questionStartedAt = useRef(Date.now());
  const lastActivityAt = useRef(Date.now());
  const inactivityPausedSec = useRef(0);
  const inactivityPausedAt = useRef(null);

  const resetActivity = useCallback(() => {
    lastActivityAt.current = Date.now();
    if (showInactivityAlert) {
      if (inactivityPausedAt.current) {
        inactivityPausedSec.current += Math.floor((Date.now() - inactivityPausedAt.current) / 1000);
        inactivityPausedAt.current = null;
      }
      setShowInactivityAlert(false);
    }
  }, [showInactivityAlert]);

  useEffect(() => {
    if (!config) {
      setError(`Unknown practice domain: ${domain}`);
      setLoading(false);
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        const res = await config.start({ targetSkillId, questionCount: 6 });
        const data = res?.data || {};
        if (!data.questions?.length) throw new Error('No questions returned.');
        if (active) {
          setSession(data);
          questionStartedAt.current = Date.now();
          lastActivityAt.current = Date.now();
        }
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e.message || 'Could not start practice.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [domain, targetSkillId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer — runs while answering, pauses during reflection, inactivity alert, and result screen
  useEffect(() => {
    if (loading || result || showReflection || showInactivityAlert) return undefined;
    const t = setInterval(() => {
      const activeSeconds = Math.floor((Date.now() - questionStartedAt.current) / 1000) - inactivityPausedSec.current;
      setElapsedSec(Math.max(0, activeSeconds));
    }, 250);
    return () => clearInterval(t);
  }, [loading, result, showReflection, showInactivityAlert, index]);

  // Inactivity watchdog — fires every 5s, shows alert after 2 min idle
  useEffect(() => {
    if (loading || result || showReflection || showInactivityAlert) return undefined;
    const t = setInterval(() => {
      const idleSec = (Date.now() - lastActivityAt.current) / 1000;
      if (idleSec >= INACTIVITY_SECONDS) {
        inactivityPausedAt.current = Date.now();
        setShowInactivityAlert(true);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [loading, result, showReflection, showInactivityAlert]);

  // Track activity via pointer and keyboard events on the document
  useEffect(() => {
    if (loading || result) return undefined;
    const handler = () => { lastActivityAt.current = Date.now(); };
    document.addEventListener('pointerdown', handler, { passive: true });
    document.addEventListener('keydown', handler, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('keydown', handler);
    };
  }, [loading, result]);

  const questions = session?.questions || [];
  const current = questions[index] || null;
  const isLast = index >= questions.length - 1;
  const currentWorking = current?.questionId ? (workingByQuestion[current.questionId] || {}) : {};

  // Auto-read question aloud for lower primary students.
  useEffect(() => {
    if (isLPrimary && current) {
      const readable = toSpeakable(current.prompt || '');
      if (readable) speak(readable, { rate: 0.8, gender: 'female' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.questionId]);

  async function finish(allAnswers) {
    setSubmitting(true);
    try {
      const res = await config.submit(session.practiceSessionId, buildSubmitPayload(allAnswers));
      setResult(summarisePracticeResult(res?.data || {}));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not submit practice.');
    } finally {
      setSubmitting(false);
    }
  }

  function submitAnswer(choiceOverride) {
    const studentAnswer = choiceOverride ?? draft;
    if (!current || !String(studentAnswer).trim()) return;
    if (choiceOverride) setDraft(choiceOverride);
    const answer = {
      questionId: current.questionId,
      studentAnswer: String(studentAnswer),
      timeTaken: Math.round((Date.now() - questionStartedAt.current) / 1000) - inactivityPausedSec.current,
      ...(currentWorking.workingSubmitted ? {
        workingSubmitted: true,
        workingImage: currentWorking.workingImage || '',
        workingStrokes: currentWorking.workingStrokes || [],
        workingMathObjects: currentWorking.workingMathObjects || [],
        workingSessionId: currentWorking.workingSessionId || session?.workingSessionId || session?.practiceSessionId || '',
        fullscreenWorkingSubmitted: true,
      } : {}),
    };
    setPendingAnswer(answer);
    setShowReflection(true);
  }

  function confirmReflection(reflectionValue) {
    const answer = { ...pendingAnswer, reflection: reflectionValue };
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setDraft('');
    setShowReflection(false);
    setPendingAnswer(null);
    inactivityPausedSec.current = 0;
    inactivityPausedAt.current = null;
    if (isLast) {
      finish(nextAnswers);
    } else {
      setIndex((i) => i + 1);
      setElapsedSec(0);
      questionStartedAt.current = Date.now();
      lastActivityAt.current = Date.now();
    }
  }

  // Read the current question aloud. Enables voice on first tap so the button
  // always produces audio (speak() is gated by the 'pslVoice' flag), then voices
  // the prompt with math symbols/LaTeX/emoji stripped to plain speech.
  function readPromptAloud() {
    if (!voiceOn) {
      setVoiceEnabled(true);
      setVoiceOn(true);
    }
    const spoken = toSpeakable(current?.prompt || '');
    if (spoken) speak(spoken, getMascotVoice(MASCOT_KEY));
  }

  if (loading) return <div className="grid place-items-center py-20"><Spinner label="Starting practice…" /></div>;

  if (error && !result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert tone="error">{error}</Alert>
        <Button className="mt-4" onClick={() => navigate(backRoute)}>Back to {label}</Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <PageHeader title="Practice complete" subtitle={`You scored ${result.correct}/${result.total} (${result.accuracyPercentage}%).`} />
        <MascotBubble name={MASCOT_KEY} message={mascotMessageFor(label, result.accuracyPercentage)} size="sm" voiced className="mb-2" />
        <Card className="p-5">
          <ProgressBar value={result.correct} max={result.total || 1} />
          <div className="mt-4 space-y-2">
            {result.skillRows.map((row) => (
              <div key={row.skillId} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink-700">{friendlySkillName(domain, row.skillId, row.skillId)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-ink-500">{row.accuracy}%</span>
                  <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                </span>
              </div>
            ))}
          </div>
        </Card>
        <div className="flex gap-3">
          <Button onClick={() => navigate(backRoute)}>Back to Skill Map</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>Practise Again</Button>
        </div>
      </div>
    );
  }

  const targetName = session?.targetSkillId ? friendlySkillName(domain, session.targetSkillId, '') : '';

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(backRoute)}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {label}
      </button>

      <PageHeader title={`${label} Practice`} subtitle={targetName} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink-500">Question {index + 1} of {questions.length}</span>
        <ProgressBar className="flex-1" value={index} max={questions.length} />
        <span className="shrink-0 font-mono text-sm text-ink-400">{elapsedSec}s</span>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            {(() => {
              const prompt = current?.prompt || '';
              const dotData = parseDotStem(prompt);
              const moneyData = domain === 'money' ? parseMoneyPrompt(prompt) : null;
              // Prefer the GENERATED coin/note diagram (reliable) over prompt parsing.
              // Shown at every level — it's the question's intended visual; the tap-to-
              // count hint just helps younger pupils.
              const coinTokens = domain === 'money' ? parseCoinsDiagram(current) : null;
              // K2 Early Numeracy visuals (tap-to-count / pattern strip).
              const countData = parseCountDiagram(current);
              const compareData = parseCompareDiagram(current);
              const patternData = parsePatternDiagram(current);
              if (coinTokens) {
                return (
                  <>
                    <ManipulativeMoneyDiagram key={current?.questionId} tokens={coinTokens} />
                    {isLPrimary ? (
                      <p className="text-xl font-bold text-ink-900">{prompt}</p>
                    ) : (
                      <p className="text-xl font-semibold leading-relaxed text-ink-900 whitespace-pre-wrap"><MathText text={prompt} /></p>
                    )}
                  </>
                );
              }
              if (isLPrimary && moneyData && moneyData.a <= 20 && moneyData.b <= 20) {
                return (
                  <>
                    <ManipulativeCoinArray
                      key={current?.questionId}
                      a={moneyData.a}
                      b={moneyData.b}
                      operator={moneyData.operator}
                    />
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  </>
                );
              }
              if (isLPrimary && patternData) {
                return (
                  <>
                    <ManipulativePatternStrip key={current?.questionId} items={patternData.items} />
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  </>
                );
              }
              if (isLPrimary && compareData) {
                return (
                  <>
                    <ManipulativeCompareSets key={current?.questionId} left={compareData.left} right={compareData.right} />
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  </>
                );
              }
              if (isLPrimary && countData) {
                return (
                  <>
                    <ManipulativeCountArray key={current?.questionId} emoji={countData.emoji} count={countData.count} />
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  </>
                );
              }
              if (isLPrimary && dotData) {
                return (
                  <>
                    <ManipulativeDotArray
                      key={current?.questionId}
                      a={dotData.a}
                      b={dotData.b}
                      operator={dotData.operator}
                    />
                    <p className="text-xl font-bold text-ink-900">{numericLine(prompt)}</p>
                  </>
                );
              }
              // Default: render the generator's diagram (geometry, area, circle,
              // triangle, angle, bar/line graph, table, bar-model…) when one can
              // actually be drawn, then the prompt. canRenderQuestionDiagram
              // guards so text-only questions never show an error box.
              return (
                <>
                  {canRenderQuestionDiagram(current) && <QuestionDiagram question={current} />}
                  <p className="text-xl font-semibold leading-relaxed text-ink-900 whitespace-pre-wrap"><MathText text={prompt} /></p>
                </>
              );
            })()}
          </div>
          <button
            type="button"
            onClick={readPromptAloud}
            disabled={showReflection}
            aria-label={voiceOn ? 'Read question aloud' : 'Turn on voice and read question aloud'}
            title="Read aloud"
            className="mt-0.5 shrink-0 rounded-full border border-ink-200 p-2 text-ink-500 transition hover:border-navy-300 hover:text-navy-600 disabled:opacity-50"
          >
            {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        {current?.type === 'mcq' ? (
          isLPrimary ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {(current.choices || []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={showReflection || submitting}
                  onClick={() => {
                    speak(choice, { rate: 0.85, gender: 'female' });
                    submitAnswer(choice);
                  }}
                  className="rounded-2xl border-2 border-line-soft bg-white py-5 text-center text-3xl font-bold text-ink-900 shadow-sm transition hover:border-emerald hover:bg-emerald-tint active:scale-95 disabled:opacity-40"
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {(current.choices || []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={showReflection}
                  onClick={() => setDraft(choice)}
                  className={`min-h-[3rem] rounded-xl border px-4 py-3 text-left text-lg transition ${draft === choice ? 'border-navy-400 bg-emerald-tint font-semibold text-emerald-deep' : 'border-ink-200 hover:border-navy-300'} disabled:opacity-50`}
                >
                  <MathText text={String(choice)} />
                </button>
              ))}
            </div>
          )
        ) : (
          <div
            className="mt-5"
            onFocus={(e) => {
              // On touch devices the soft keyboard slides up over the input; nudge
              // it into view (focus bubbles, so this fires for the inner <input>).
              if (e.target?.tagName === 'INPUT') {
                setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
              }
            }}
          >
            <AnswerInputRenderer
              question={current}
              value={draft}
              onChange={setDraft}
              disabled={showReflection}
              onEnter={() => { if (draft.trim() && !showReflection) submitAnswer(); }}
            />
            {domainSymbols.length > 0 && ['text', 'decimal', 'whole_number'].includes(getAnswerInputType(current)) && (
              <MathSymbolBar symbols={domainSymbols} value={draft} onChange={setDraft} disabled={showReflection} className="mt-3" />
            )}
          </div>
        )}

        {!isLPrimary && (
          <div className="mt-5">
            <WorkingPreviewCard
              workingImage={currentWorking.workingImage || ''}
              workingSubmitted={Boolean(currentWorking.workingSubmitted)}
              onOpen={() => setWorkingQuestionId(current?.questionId || null)}
              onRemove={currentWorking.workingSubmitted ? () => setWorkingByQuestion((prev) => {
                const next = { ...prev };
                delete next[current.questionId];
                return next;
              }) : undefined}
              openLabel="Open working"
            />
          </div>
        )}
      </Card>

      {/* Sticky action bar — on iPad/phone the soft keyboard covers the bottom of
          the viewport, so the Submit/Next button and the "How did that feel?"
          confidence buttons are pinned above it (with safe-area padding) so they
          stay reachable. On desktop it sits inline at the page bottom. */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-ink-100 bg-white/95 px-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {showReflection ? (
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            {isLPrimary ? (
              <>
                <p className="mb-3 text-center text-base font-semibold text-ink-600">How did that feel?</p>
                <div className="grid grid-cols-2 gap-3">
                  {LP_REFLECTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        speak(opt.label, { rate: 0.85, gender: 'female' });
                        confirmReflection(opt.value);
                      }}
                      className="flex flex-col items-center gap-2 rounded-2xl border-2 border-line-soft bg-surface-raised px-4 py-4 text-center transition hover:border-emerald hover:bg-emerald-tint active:scale-95"
                    >
                      <span className="text-4xl leading-none">{opt.emoji}</span>
                      <span className="text-sm font-bold text-ink-800">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm font-semibold text-ink-600">How did that feel?</p>
                <div className="grid grid-cols-2 gap-2">
                  {REFLECTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => confirmReflection(opt.value)}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${opt.color}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          (!isLPrimary || current?.type !== 'mcq') && (
            <div className="flex justify-end">
              <Button icon={isLast ? CheckCircle2 : ArrowRight} disabled={!draft.trim() || submitting} onClick={() => submitAnswer()}>
                {submitting ? 'Submitting…' : isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          )
        )}
      </div>

      <FullScreenWorkingMode
        open={Boolean(workingQuestionId)}
        questionId={workingQuestionId || current?.questionId || ''}
        questionText={current?.prompt || ''}
        initialStrokes={currentWorking.workingStrokes || []}
        initialMathObjects={currentWorking.workingMathObjects || []}
        onClose={() => setWorkingQuestionId(null)}
        onSave={(payload) => {
          const questionId = workingQuestionId || current?.questionId;
          if (!questionId) return;
          setWorkingByQuestion((prev) => ({
            ...prev,
            [questionId]: {
              ...payload,
              workingSessionId: session?.workingSessionId || session?.practiceSessionId || '',
              fullscreenWorkingSubmitted: Boolean(payload.workingSubmitted),
            },
          }));
          setWorkingQuestionId(null);
        }}
      />

      {/* Inactivity alert — modal overlay */}
      {showInactivityAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="mb-1 text-lg font-bold text-ink-900">Still there?</p>
            <p className="mb-5 text-sm text-ink-500">
              Your session has been paused after 2 minutes of inactivity. The timer is on hold.
            </p>
            <button
              type="button"
              onClick={resetActivity}
              className="w-full rounded-xl bg-emerald py-3 text-base font-semibold text-white transition hover:bg-emerald-deep"
            >
              Continue practice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
