import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Volume2 } from 'lucide-react';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../../components/ui';
import { MascotBubble } from '../../../../components/MascotAvatar';
import { MathText } from '../../../../components/ui/Fraction';
import FullScreenWorkingMode from '../../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../../components/learning/WorkingPreviewCard';
import ManipulativeDotArray, { parseDotStem, numericLine, toSpeakable, parseMoneyPrompt, ManipulativeCoinArray, parseCoinsDiagram, ManipulativeMoneyDiagram } from '../../../../components/learning/ManipulativeDotArray';
import { speak } from '../../../../utils/sound';
import { useAuth } from '../../../../context/AuthContext';
import { getMascotForModule } from '../../../../config/mascots';
import MathSymbolBar from '../components/MathSymbolBar';
import AnswerInputRenderer, { getAnswerInputType } from '../components/AnswerInputRenderer';
import {
  buildSubmitPayload,
  summarisePracticeResult,
  statusTone,
  mascotMessageFor,
  friendlySkillName,
  getDomainConfig,
  getDomainSymbols,
} from './core';

const MASCOT_KEY = getMascotForModule('mathpath')?.key || 'kylo';
const INACTIVITY_SECONDS = 120;

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'Solid', color: 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200' },
  { value: 'not_sure', label: "Not sure", color: 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200' },
  { value: 'i_need_practice', label: 'Shaky', color: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200' },
  { value: 'i_need_help', label: 'Need help', color: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200' },
];

const LP_REFLECTION_OPTIONS = [
  { value: 'i_know_this', emoji: '😊', label: 'I know it!' },
  { value: 'not_sure', emoji: '🤔', label: 'Not sure' },
  { value: 'i_need_practice', emoji: '😕', label: 'Need practice' },
  { value: 'i_need_help', emoji: '🙋', label: 'Need help' },
];

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
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);

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
        {(() => {
          const prompt = current?.prompt || '';
          const dotData = parseDotStem(prompt);
          const moneyData = domain === 'money' ? parseMoneyPrompt(prompt) : null;
          // Prefer the GENERATED coin/note diagram (reliable) over prompt parsing.
          // Shown at every level — it's the question's intended visual; the tap-to-
          // count hint just helps younger pupils.
          const coinTokens = domain === 'money' ? parseCoinsDiagram(current) : null;
          if (coinTokens) {
            return (
              <>
                <ManipulativeMoneyDiagram key={current?.questionId} tokens={coinTokens} />
                {isLPrimary ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                    <button
                      type="button"
                      aria-label="Read question"
                      onClick={() => speak(toSpeakable(prompt), { rate: 0.8, gender: 'female' })}
                      className="rounded-full p-1 text-ink-400 hover:text-emerald active:scale-90"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
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
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  <button
                    type="button"
                    aria-label="Read question"
                    onClick={() => speak(toSpeakable(prompt), { rate: 0.8, gender: 'female' })}
                    className="rounded-full p-1 text-ink-400 hover:text-emerald active:scale-90"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>
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
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-ink-900">{numericLine(prompt)}</p>
                  <button
                    type="button"
                    aria-label="Read question"
                    onClick={() => speak(toSpeakable(prompt), { rate: 0.8, gender: 'female' })}
                    className="rounded-full p-1 text-ink-400 hover:text-emerald active:scale-90"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>
              </>
            );
          }
          return <p className="text-xl font-semibold leading-relaxed text-ink-900 whitespace-pre-wrap"><MathText text={prompt} /></p>;
        })()}

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
          <div className="mt-5">
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
