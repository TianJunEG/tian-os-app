import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpenCheck, Timer, Volume2, VolumeX } from 'lucide-react';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../../components/ui';
import { getMascotForModule, getMascotVoice } from '../../../../config/mascots';
import { speak, isVoiceEnabled, setVoiceEnabled } from '../../../../utils/sound';
import { buildFluencySubmitPayload } from '../DecimalsFluencySession';
import { getDomainConfig, toSpeakable } from './core';

const MASCOT_KEY = getMascotForModule('mathpath')?.key || 'kylo';

// Spaced-repetition retention review for MathPath domains that have a
// /retention backend (percentages, ratio-rate, algebra, geometry, volume).
// Same question loop as DomainFluencySession; result maps to retained /
// needs_review / forgotten instead of a fluency band.

const STATUS_META = {
  retained: { label: 'Retained!', tone: 'success', detail: (days) => `Next review in ${days} day${days === 1 ? '' : 's'}.` },
  needs_review: { label: 'Needs another look', tone: 'gold', detail: () => 'Another short session will lock it in.' },
  forgotten: { label: 'Let\'s rebuild this', tone: 'error', detail: () => 'Head back to practice to strengthen the skill.' },
};

function retentionTone(status) {
  return STATUS_META[status]?.tone || 'neutral';
}

export default function DomainRetentionSession({ domain }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const skillId = params.get('skill') || null;
  const config = getDomainConfig(domain);
  const label = config?.label || 'Maths';
  const backRoute = `/student/mathpath/${domain}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [voiceOn, setVoiceOn] = useState(() => isVoiceEnabled());
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!config?.startRetention) {
      setError(`Retention reviews are not available for ${label} yet.`);
      setLoading(false);
      return undefined;
    }
    if (!skillId) {
      setError('No skill selected for this review.');
      setLoading(false);
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        const res = await config.startRetention({ skillId, count: 6 });
        const data = res?.data || {};
        if (!data.questions?.length) throw new Error('No review questions returned.');
        if (active) { setSession(data); startedAt.current = Date.now(); }
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e.message || 'Could not start the review.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [domain, skillId]); // eslint-disable-line react-hooks/exhaustive-deps

  const questions = session?.questions || [];
  const current = questions[index] || null;
  const isLast = index >= questions.length - 1;

  // Read the current question aloud. Enables voice on first tap so the button
  // always produces audio (speak() is gated by the voice flag), then voices the
  // prompt with math symbols/LaTeX/emoji stripped to plain speech.
  function readPromptAloud() {
    if (!voiceOn) {
      setVoiceEnabled(true);
      setVoiceOn(true);
    }
    const spoken = toSpeakable(current?.prompt || '');
    if (spoken) speak(spoken, getMascotVoice(MASCOT_KEY));
  }

  async function finish(allAnswers) {
    setSubmitting(true);
    try {
      const res = await config.submitRetention(session.practiceSessionId, buildFluencySubmitPayload(allAnswers));
      setResult(res?.data || {});
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not submit the review.');
    } finally {
      setSubmitting(false);
    }
  }

  function recordAndAdvance() {
    if (!current) return;
    const answer = {
      questionId: current.questionId,
      studentAnswer: draft,
      timeTaken: Math.round((Date.now() - startedAt.current) / 1000),
    };
    const next = [...answers, answer];
    setAnswers(next);
    setDraft('');
    if (isLast) finish(next);
    else { setIndex((i) => i + 1); startedAt.current = Date.now(); }
  }

  if (loading) return <div className="grid place-items-center py-20"><Spinner label="Loading your review…" /></div>;

  if (error && !result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert tone="error">{error}</Alert>
        <Button className="mt-4" onClick={() => navigate(backRoute)}>Back to {label}</Button>
      </div>
    );
  }

  if (result) {
    const status = result.retentionStatus || (result.retained ? 'retained' : 'needs_review');
    const meta = STATUS_META[status] || STATUS_META.needs_review;
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <PageHeader title="Review complete" subtitle={`${result.correct ?? '?'}/${result.total ?? '?'} correct · ${result.accuracy ?? 0}% accuracy.`} />
        <Card className="p-6 text-center">
          <BookOpenCheck className="mx-auto h-8 w-8 text-emerald" />
          <p className="mt-2 text-2xl font-display font-semibold text-ink-900">{meta.label}</p>
          <div className="mt-2 flex justify-center gap-2">
            <Badge tone={retentionTone(status)}>{result.accuracy ?? 0}% accurate</Badge>
            {result.nextIntervalDays != null && <Badge tone="neutral">next review in {result.nextIntervalDays}d</Badge>}
          </div>
          <p className="mt-3 text-sm text-ink-500">{meta.detail(result.nextIntervalDays)}</p>
        </Card>
        <div className="flex gap-3">
          <Button onClick={() => navigate(backRoute)}>Back to {label}</Button>
          {status !== 'retained' && (
            <Button variant="secondary" onClick={() => navigate(`${backRoute}/practice?skill=${skillId}`)}>Practice this skill</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <PageHeader title={`${label} Retention Review`} subtitle="Spaced review — keep this skill sharp." />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-semibold text-ink-500"><Timer className="h-4 w-4" /> {index + 1} / {questions.length}</span>
        <ProgressBar className="ml-4 flex-1" value={index} max={questions.length} />
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-semibold text-ink-900">{current?.prompt}</p>
          <button
            type="button"
            onClick={readPromptAloud}
            aria-label={voiceOn ? 'Read question aloud' : 'Turn on voice and read question aloud'}
            title="Read aloud"
            className="mt-0.5 shrink-0 rounded-full border border-ink-200 p-2 text-ink-500 transition hover:border-navy-300 hover:text-navy-600"
          >
            {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>
        {current?.type === 'mcq' ? (
          <div className="mt-5 grid gap-2">
            {(current.choices || []).map((choice) => (
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
        ) : (
          <input
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) recordAndAdvance(); }}
            placeholder="Type your answer"
            className="mt-5 w-full rounded-xl border border-ink-200 px-4 py-3 text-lg focus:border-navy-400 focus:outline-none"
            autoFocus
          />
        )}
      </Card>

      <div className="flex justify-end">
        <Button icon={BookOpenCheck} disabled={!draft.trim() || submitting} onClick={recordAndAdvance}>
          {submitting ? 'Scoring…' : isLast ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
