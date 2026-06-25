import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Volume2, X } from 'lucide-react';
import { diagnosticsAPI } from '../../../services/api';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';
import { useAuth } from '../../../context/AuthContext';
import ManipulativeDotArray, { parseDotStem, numericLine, toSpeakable, parseMoneyPrompt, ManipulativeCoinArray, parseCoinsDiagram, ManipulativeMoneyDiagram } from '../../../components/learning/ManipulativeDotArray';
import { speak, setVoiceEnabled } from '../../../utils/sound';
import { getMascotVoice } from '../../../config/mascots';

// Generic adaptive diagnostic ("check-in") that serves every MathPath domain.
// Mirrors DecimalsDiagnosticSession but reads the domain from the :domainId
// route param, so a single route — /student/mathpath/:domainId/diagnostic —
// covers all 13 non-fractions domains. The backend /api/diagnostics runtime is
// already domain-generic (genericDiagnosticAdapterFactory), so the only
// per-domain concerns here are the URL segment, the canonical backend domainId,
// and display copy.

// URL segment → { backend canonical domainId, display label }. Segments that
// already equal their canonical id (circles, geometry, …) fall through to the
// derive() default. Underscore is the canonical persisted form (see the domain
// registry); the URL keeps the kebab/plural segment used by the practice routes.
const DOMAIN_CONFIG = {
  decimals: { domainId: 'decimals', label: 'Decimals' },
  percentages: { domainId: 'percentage', label: 'Percentage' },
  'ratio-rate': { domainId: 'ratio', label: 'Ratio & Rate' },
  'area-perimeter': { domainId: 'area_perimeter', label: 'Area & Perimeter' },
  'number-sense': { domainId: 'number_sense', label: 'Number Sense' },
  operations: { domainId: 'four_operations', label: 'Operations' },
  algebra: { domainId: 'algebra', label: 'Algebra' },
  circles: { domainId: 'circles', label: 'Circles' },
  geometry: { domainId: 'geometry', label: 'Geometry' },
  volume: { domainId: 'volume', label: 'Volume' },
  measurement: { domainId: 'measurement', label: 'Measurement' },
  money: { domainId: 'money', label: 'Money' },
  time: { domainId: 'time', label: 'Time' },
  statistics: { domainId: 'statistics', label: 'Statistics' },
};

function resolveDomain(segment) {
  const key = String(segment || '').toLowerCase();
  if (DOMAIN_CONFIG[key]) return { segment: key, ...DOMAIN_CONFIG[key] };
  // Fallback: underscore the segment for the backend, title-case it for display.
  const domainId = key.replace(/-/g, '_');
  const label = key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { segment: key, domainId, label };
}

export function summariseDiagnosticResult(result = {}) {
  return {
    readinessBand: result.readinessBand || 'developing',
    readinessScore: result.readinessScore || 0,
    questionsCorrect: result.questionsCorrect || 0,
    totalQuestions: result.totalQuestions || 0,
    weakSkills: (result.weakSkills || []).map((s) => ({ skillId: s.skillId, name: s.name || s.skillId })),
    masteredSkills: (result.masteredSkills || []).map((s) => ({ skillId: s.skillId, name: s.name || s.skillId })),
    recommendedStartingSkillId: result.recommendedStartingSkillId || result.recommendedStartingSkill?.skillId || '',
    recommendedStartingSkillName: result.recommendedStartingSkill?.name || result.recommendedStartingSkillId || '',
  };
}

export function buildAnswerBody({ question, draft, startedAtMs, nowMs }) {
  return {
    questionId: question?.questionId,
    studentAnswer: String(draft ?? ''),
    timeTakenMs: Math.max(0, Number(nowMs) - Number(startedAtMs)),
  };
}

function bandTone(band) {
  if (band === 'ready') return 'success';
  if (band === 'progressing') return 'gold';
  return 'navy';
}

export default function DomainDiagnosticSession() {
  const navigate = useNavigate();
  const { domainId: domainParam } = useParams();
  const domain = resolveDomain(domainParam);
  const { user } = useAuth();

  const sl = String(user?.studentLevel || '').toLowerCase().trim();
  const isLowerPrimary = /k2|kindy|preschool/.test(sl) || /^p[123]$|^primary [123]$/.test(sl);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState({ answeredCount: 0, estimatedQuestionCount: 8 });
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [encouragement, setEncouragement] = useState('');
  const [result, setResult] = useState(null);
  const startedAt = useRef(Date.now());

  // Read the current question aloud. Enables voice first so the Read button and
  // auto-narration are never silent (speak() is gated by the 'pslVoice' flag),
  // and is ungated so upper-primary students also get read-aloud support.
  const speakQuestion = useCallback((q) => {
    if (!q) return;
    setVoiceEnabled(true);
    const readable = toSpeakable(q.prompt || q.stem || '');
    if (readable) speak(readable, getMascotVoice('kylo'));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await diagnosticsAPI.startDiagnostic({ subjectId: 'math', domainId: domain.domainId, mode: 'core', purpose: 'baseline', studentLevel: user?.studentLevel || '' });
        const data = res?.data || {};
        if (!data.currentQuestion) throw new Error('No diagnostic question returned.');
        if (active) {
          setSessionId(data.sessionId);
          setQuestion(data.currentQuestion);
          setProgress(data.progress || { answeredCount: 0, estimatedQuestionCount: 8 });
          startedAt.current = Date.now();
        }
      } catch (e) {
        // Product decision: interrupted/exited check-ins RESET — they are never
        // resumed. The backend abandons any in-progress session on start, so a
        // fresh session is created here; we no longer resume on REPLAY_BLOCKED.
        if (active) setError(e?.response?.data?.error || e.message || 'Could not start the check-in.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain.domainId]);

  // Auto-read question aloud for lower primary students. The Read button (below)
  // is available to every student and explicitly enables voice on tap.
  useEffect(() => {
    if (question && isLowerPrimary) speakQuestion(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.questionId]);

  async function submitAnswer(choiceOverride) {
    const answer = choiceOverride ?? draft;
    if (!question || submitting || !String(answer).trim()) return;
    if (choiceOverride) setDraft(choiceOverride);
    setSubmitError('');
    setSubmitting(true);
    try {
      const body = buildAnswerBody({ question, draft: String(answer), startedAtMs: startedAt.current, nowMs: Date.now() });
      const res = await diagnosticsAPI.answerDiagnostic(sessionId, body);
      const data = res?.data || {};
      if (data.sessionComplete) {
        setResult(summariseDiagnosticResult(data.result || {}));
      } else {
        setQuestion(data.nextQuestion);
        setProgress(data.progress || progress);
        setEncouragement(data.supportiveCopy || '');
        setDraft('');
        startedAt.current = Date.now();
      }
    } catch (e) {
      // Keep the question and all in-progress answers on screen — surface a
      // dismissible inline error and let the Submit button serve as retry.
      setSubmitError(e?.response?.data?.error || e.message || 'Could not submit your answer.');
    } finally {
      setSubmitting(false);
    }
  }

  const estimated = progress.estimatedQuestionCount || 8;
  const backToMap = () => navigate(`/student/mathpath/${domain.segment}`);

  // Persistent in-page exit. Phones hide the activity-shell nav, so without this
  // a student can be trapped mid check-in. On exit we ABANDON the session
  // (progress is discarded), so the next entry starts a fresh session.
  const exitCheckIn = async () => {
    if (typeof window !== 'undefined' && !window.confirm("Exit the check-in? Your progress won't be saved.")) return;
    if (sessionId) {
      try {
        await diagnosticsAPI.abandonDiagnostic(sessionId);
      } catch (_) {
        // Best-effort — still navigate away even if the abandon call fails.
      }
    }
    navigate('/student/mathpath');
  };

  if (loading) return <div className="grid place-items-center py-20"><Spinner label="Setting up your check-in…" /></div>;

  // Full-screen failure is reserved for the START/LOAD phase — before there is a
  // live session/question to preserve. Mid-session submit failures are surfaced
  // inline (see submitError below) so the question and answers stay on screen.
  if (error && !result && (!sessionId || !question)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert tone="error">{error}</Alert>
        <Button className="mt-4" onClick={backToMap}>Back to {domain.label}</Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <PageHeader title="Check-in complete" subtitle={`You answered ${result.questionsCorrect}/${result.totalQuestions} correctly.`} />
        <MascotBubble
          name="kylo"
          message={result.readinessBand === 'ready'
            ? `Great job — you really know your ${domain.label.toLowerCase()}!`
            : result.readinessBand === 'progressing'
              ? 'Good start! I know just where to begin.'
              : "No worries — let's build up from here together!"}
          size="sm"
        />
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={bandTone(result.readinessBand)}>{result.readinessBand}</Badge>
            <span className="text-sm text-ink-500">Readiness {result.readinessScore}</span>
          </div>
          {result.weakSkills.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Focus next</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.weakSkills.map((s) => <Badge key={s.skillId} tone="error">{s.name}</Badge>)}
              </div>
            </div>
          )}
          {result.recommendedStartingSkillId && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-gold-tint2 p-3">
              <Sparkles className="h-5 w-5 text-gold-deep" />
              <p className="text-sm font-semibold text-ink-700">Recommended start: {result.recommendedStartingSkillName || result.recommendedStartingSkillId}</p>
            </div>
          )}
        </Card>
        <div className="flex gap-3">
          {result.recommendedStartingSkillId && (
            <Button icon={ArrowRight} onClick={() => navigate(`/student/mathpath/${domain.segment}/practice?skill=${result.recommendedStartingSkillId}`)}>Start Practising</Button>
          )}
          <Button variant="secondary" onClick={backToMap}>Back to Skill Map</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <PageHeader title={`${domain.label} Check-in`} subtitle="A short adaptive check to find your best starting point." />
      {progress.answeredCount === 0 && (
        <MascotBubble name="kylo" message="Just do your best — this helps me find the right starting point for you!" size="sm" className="mb-2" />
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-500">Question {Math.min(progress.answeredCount + 1, estimated)} of ~{estimated}</span>
        <ProgressBar className="ml-2 flex-1" value={progress.answeredCount} max={estimated} />
        <button
          type="button"
          aria-label="Read question aloud"
          onClick={() => question && speakQuestion(question)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700 transition hover:bg-sky-200 active:scale-95"
        >
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Exit the check-in"
          onClick={exitCheckIn}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-raised text-ink-500 transition hover:bg-error-100 hover:text-error-700 active:scale-95"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {encouragement && (
        <p className="text-sm font-medium text-emerald-deep">{encouragement}</p>
      )}

      <Card className="p-6 space-y-4">
        {(() => {
          const prompt = question?.prompt || '';
          const dotData = parseDotStem(prompt);
          const moneyData = domain.segment === 'money' ? parseMoneyPrompt(prompt) : null;
          // Prefer the GENERATED coin/note diagram over fragile prompt parsing.
          const coinTokens = domain.segment === 'money' ? parseCoinsDiagram(question) : null;
          if (coinTokens) {
            return (
              <>
                <ManipulativeMoneyDiagram key={question?.questionId} tokens={coinTokens} />
                <div className="flex items-center gap-2">
                  <p className={isLowerPrimary ? 'text-xl font-bold text-ink-900' : 'text-lg font-semibold text-ink-900 whitespace-pre-wrap'}>{prompt}</p>
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
          if (isLowerPrimary && moneyData && moneyData.a <= 20 && moneyData.b <= 20) {
            return (
              <>
                <ManipulativeCoinArray
                  key={question?.questionId}
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
          if (isLowerPrimary && dotData) {
            return (
              <>
                <ManipulativeDotArray
                  key={question?.questionId}
                  a={dotData.a}
                  b={dotData.b}
                  operator={dotData.operator}
                />
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-ink-900">{numericLine(prompt)}</p>
                  <button
                    type="button"
                    aria-label="Read question aloud"
                    onClick={() => question && speakQuestion(question)}
                    className="rounded-full p-1 text-ink-400 hover:text-emerald active:scale-90"
                  >
                    <Volume2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </>
            );
          }
          return <p className="text-lg font-semibold text-ink-900 whitespace-pre-wrap">{prompt}</p>;
        })()}

        {question?.type === 'mcq' && (question.choices || []).length > 0 ? (
          isLowerPrimary ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {(question.choices || []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    speak(choice, { rate: 0.85, gender: 'female' });
                    submitAnswer(choice);
                  }}
                  className="rounded-2xl border-2 border-line-soft bg-white py-5 text-center text-3xl font-bold text-ink-900 shadow-sm transition hover:border-emerald hover:bg-emerald-tint active:scale-95"
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-2">
              {(question.choices || []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setDraft(choice)}
                  className={`rounded-xl border px-4 py-3 text-left text-base transition ${draft === choice ? 'border-navy-400 bg-emerald-tint font-semibold text-emerald-deep' : 'border-ink-200 hover:border-navy-300'}`}
                >
                  {choice}
                </button>
              ))}
            </div>
          )
        ) : (
          <input
            type="text"
            inputMode="text"
            aria-label="Your answer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) submitAnswer(); }}
            placeholder="Type your answer"
            className="mt-5 w-full rounded-xl border border-ink-200 px-4 py-3 text-lg focus:border-navy-400 focus:outline-none"
            autoFocus
          />
        )}
      </Card>

      {submitError && (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Alert tone="error">{submitError} Your answer is still here — tap Submit to try again.</Alert>
          </div>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setSubmitError('')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500 transition hover:bg-error-100 hover:text-error-700 active:scale-95"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {(!isLowerPrimary || question?.type !== 'mcq' || (question.choices || []).length === 0) && (
        <div className="flex justify-end">
          <Button icon={CheckCircle2} disabled={!draft.trim() || submitting} onClick={() => submitAnswer()}>
            {submitting ? 'Checking…' : 'Submit'}
          </Button>
        </div>
      )}
    </div>
  );
}
