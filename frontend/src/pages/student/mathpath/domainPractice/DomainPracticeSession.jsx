import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../../components/ui';
import { MascotBubble } from '../../../../components/MascotAvatar';
import { MathText } from '../../../../components/ui/Fraction';
import FullScreenWorkingMode from '../../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../../components/learning/WorkingPreviewCard';
import ManipulativeDotArray, { parseDotStem, numericLine, parseMoneyPrompt, ManipulativeCoinArray, parseCoinsDiagram, ManipulativeMoneyDiagram, parseCountDiagram, ManipulativeCountArray, parseCompareDiagram, ManipulativeCompareSets, parsePatternDiagram, ManipulativePatternStrip, parseShapeChoice, ShapeGlyph, parsePositionDiagram, ManipulativePositionStack, DragAnswerChips } from '../../../../components/learning/ManipulativeDotArray';
import { speak, isVoiceEnabled, setVoiceEnabled } from '../../../../utils/sound';
import { confettiBurst } from '../../../../utils/confetti';
import { studentProfileAPI } from '../../../../services/api';
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

// Lower = easier. Used to order a first-timer's questions easiest-first.
const DIFF_RANK = { easy: 0, simple: 0, foundational: 0, medium: 1, moderate: 1, hard: 2, challenging: 3, advanced: 3 };
function difficultyRank(q) {
  const d = q?.difficulty;
  if (typeof d === 'number' && Number.isFinite(d)) return d;
  return DIFF_RANK[String(d || '').toLowerCase().trim()] ?? 1;
}
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
  const [newAwards, setNewAwards] = useState([]);
  const awardsCheckedRef = useRef(false);
  // After a session, surface any award badges it just unlocked. Fetching
  // achievements runs the unlock sync server-side; "just unlocked" = within the
  // last ~2 min (i.e. earned by this session).
  useEffect(() => {
    if (!result || awardsCheckedRef.current) return undefined;
    awardsCheckedRef.current = true;
    let active = true;
    studentProfileAPI.achievements().then((r) => {
      if (!active) return;
      const list = r?.data?.achievements || r?.data || [];
      const cutoff = Date.now() - 120000;
      const fresh = Array.isArray(list)
        ? list.filter((a) => a.unlocked && a.unlockedAt && new Date(a.unlockedAt).getTime() >= cutoff)
        : [];
      if (fresh.length) {
        setNewAwards(fresh.map((a) => a.title));
        setTimeout(() => confettiBurst({ count: 170, duration: 2200 }), 600);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [result]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => isVoiceEnabled());
  // Live struggle safety net.
  const struggleStreakRef = useRef(0);
  const struggleQuestionRef = useRef(null);
  const [showStruggleHelp, setShowStruggleHelp] = useState(false);
  const [showStruggleSolution, setShowStruggleSolution] = useState(false);
  // Gentle first-time entry.
  const [showWarmup, setShowWarmup] = useState(false);

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
        // Gentle first-time entry: the very first time a student opens this skill,
        // order the questions easiest-first and show a low-pressure warm-up, so a
        // brand-new (or struggling) student gets early wins instead of hitting the
        // hardest questions cold and giving up.
        const seenKey = `tian:mp-seen:${user?.id || user?._id || 'anon'}:${domain}:${targetSkillId || 'mixed'}`;
        let firstTime = false;
        try { firstTime = !window.localStorage.getItem(seenKey); } catch { firstTime = false; }
        let sessionData = data;
        if (firstTime) {
          const ordered = [...data.questions].sort((a, b) => difficultyRank(a) - difficultyRank(b));
          sessionData = { ...data, questions: ordered };
          try { window.localStorage.setItem(seenKey, '1'); } catch { /* private mode — fine */ }
        }
        if (active) {
          setSession(sessionData);
          if (firstTime) setShowWarmup(true);
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
  // K2 pattern questions become a drag-or-tap activity: drag the missing piece
  // into the box on the pattern strip (tap still works as the a11y fallback).
  const lpPatternMcq = isLPrimary && current?.type === 'mcq' ? parsePatternDiagram(current) : null;
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
    const answeredQuestion = current;
    const answer = { ...pendingAnswer, reflection: reflectionValue };
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setDraft('');
    setShowReflection(false);
    setPendingAnswer(null);
    inactivityPausedSec.current = 0;
    inactivityPausedAt.current = null;
    // Track "I don't know" / "I need help" in a row — after 3, step in with an
    // encouraging way out before the student gives up.
    const struggled = reflectionValue === 'i_dont_know' || reflectionValue === 'i_need_help';
    struggleStreakRef.current = struggled ? struggleStreakRef.current + 1 : 0;
    if (isLast) {
      finish(nextAnswers);
    } else {
      setIndex((i) => i + 1);
      setElapsedSec(0);
      questionStartedAt.current = Date.now();
      lastActivityAt.current = Date.now();
      if (struggleStreakRef.current >= 3) {
        struggleStreakRef.current = 0;
        struggleQuestionRef.current = answeredQuestion;
        setShowStruggleSolution(false);
        setShowStruggleHelp(true);
      }
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
        {(result.accuracyPercentage === 100 || newAwards.length > 0) && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            {result.accuracyPercentage === 100 && (
              <p className="font-bold text-amber-700">🌟 All correct — perfect round!</p>
            )}
            {newAwards.map((title) => (
              <p key={title} className="text-sm font-semibold text-amber-700">🏅 New award unlocked: {title}</p>
            ))}
          </div>
        )}
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
              // K2 Early Numeracy visuals (tap-to-count / pattern / position).
              const countData = parseCountDiagram(current);
              const compareData = parseCompareDiagram(current);
              const patternData = parsePatternDiagram(current);
              const positionData = parsePositionDiagram(current);
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
              if (patternData) {
                return (
                  <>
                    <ManipulativePatternStrip key={current?.questionId} items={patternData.items} />
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  </>
                );
              }
              if (positionData) {
                return (
                  <>
                    <ManipulativePositionStack key={current?.questionId} top={positionData.top} bottom={positionData.bottom} />
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  </>
                );
              }
              if (compareData) {
                return (
                  <>
                    <ManipulativeCompareSets key={current?.questionId} left={compareData.left} right={compareData.right} />
                    <p className="text-xl font-bold text-ink-900">{prompt}</p>
                  </>
                );
              }
              if (countData) {
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
          lpPatternMcq ? (
            <DragAnswerChips
              key={current?.questionId}
              choices={current.choices || []}
              onAnswer={(value) => { speak(value, { rate: 0.85, gender: 'female' }); submitAnswer(value); }}
              disabled={showReflection || submitting}
            />
          ) : isLPrimary ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {(current.choices || []).map((choice) => {
                const shapeKind = parseShapeChoice(choice);
                return (
                  <button
                    key={choice}
                    type="button"
                    aria-label={shapeKind || String(choice)}
                    disabled={showReflection || submitting}
                    onClick={() => {
                      speak(shapeKind || choice, { rate: 0.85, gender: 'female' });
                      submitAnswer(choice);
                    }}
                    className="flex items-center justify-center rounded-2xl border-2 border-line-soft bg-white py-5 text-center text-3xl font-bold text-ink-900 shadow-sm transition hover:border-emerald hover:bg-emerald-tint active:scale-95 disabled:opacity-40"
                  >
                    {shapeKind ? <ShapeGlyph kind={shapeKind} /> : choice}
                  </button>
                );
              })}
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

      {/* Gentle first-time entry — a calm, encouraging start so a brand-new student
          isn't dropped straight into hard questions. Questions are already ordered
          easiest-first for this first session. */}
      {showWarmup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <MascotBubble
              name={MASCOT_KEY}
              message="New topic! We'll start with the easier ones and build up from there. It's okay not to know yet — just give each one a try, and I'll help if you get stuck."
              size="sm"
              voiced
              className="mb-4"
            />
            <Button className="w-full" onClick={() => setShowWarmup(false)}>Let&apos;s go</Button>
          </div>
        </div>
      )}

      {/* Struggle safety net — after repeated "I don't know", step in warmly with
          a worked example or an easy way to switch, so the student doesn't quit. */}
      {showStruggleHelp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <MascotBubble
              name={MASCOT_KEY}
              message="This part is tricky — and that's completely okay. Everyone learns at their own pace. What would help right now?"
              size="sm"
              voiced
              className="mb-3"
            />
            {showStruggleSolution && struggleQuestionRef.current && (
              <div className="mb-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
                <p className="mb-1 font-semibold text-ink-800">{struggleQuestionRef.current.prompt}</p>
                {Array.isArray(struggleQuestionRef.current.solutionSteps) && struggleQuestionRef.current.solutionSteps.length ? (
                  <ol className="list-decimal space-y-0.5 pl-5">
                    {struggleQuestionRef.current.solutionSteps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                ) : (
                  <p className="text-ink-500">{struggleQuestionRef.current.workedSolution || "Break it into smaller steps — you can do this."}</p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              {!showStruggleSolution && (
                <Button variant="secondary" onClick={() => setShowStruggleSolution(true)}>Show me how</Button>
              )}
              <Button variant="secondary" onClick={() => navigate('/student/mathpath')}>Try a different topic</Button>
              <Button onClick={() => { setShowStruggleHelp(false); setShowStruggleSolution(false); }}>Keep going</Button>
            </div>
          </div>
        </div>
      )}

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
