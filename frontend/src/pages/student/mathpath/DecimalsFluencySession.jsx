import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Timer, Zap } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../components/ui';

// Timed Decimals fluency drill. Same answer flow as practice but speed-focused:
// a per-question elapsed timer, and a result scored into a bronze→platinum band.
// Pure helpers are exported and unit-tested.

const BAND_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze', notReady: 'Keep practising' };

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────
export function buildFluencySubmitPayload(answers = []) {
  return {
    responses: answers
      .filter((a) => a && a.questionId != null && String(a.studentAnswer ?? '').trim() !== '')
      .map((a) => ({
        questionId: a.questionId,
        studentAnswer: String(a.studentAnswer),
        timeTaken: Number(a.timeTaken || 0),
      })),
  };
}

export function summariseFluencyResult(summary = {}) {
  return {
    band: summary.band || 'notReady',
    bandLabel: BAND_LABEL[summary.band] || BAND_LABEL.notReady,
    accuracy: summary.accuracy || 0,
    averageTime: summary.averageTime ?? null,
    total: summary.total || 0,
    correct: summary.correct || 0,
    goldSeconds: summary.benchmarks?.gold ?? null,
  };
}

function bandTone(band) {
  if (band === 'platinum' || band === 'gold') return 'gold';
  if (band === 'silver') return 'navy';
  if (band === 'bronze') return 'success';
  return 'error';
}

// ── Component ───────────────────────────────────────────────────────────────
export default function DecimalsFluencySession() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const skillId = params.get('skill') || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!skillId) throw new Error('No skill selected for the drill.');
        const res = await mathpathAPI.startDecimalsFluency({ skillId, count: 8 });
        const data = res?.data || {};
        if (!data.questions?.length) throw new Error('No drill questions returned.');
        if (active) { setSession(data); startedAt.current = Date.now(); }
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e.message || 'Could not start the drill.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [skillId]);

  const questions = session?.questions || [];
  const current = questions[index] || null;
  const isLast = index >= questions.length - 1;

  async function finish(allAnswers) {
    setSubmitting(true);
    try {
      const res = await mathpathAPI.submitDecimalsFluency(session.practiceSessionId, buildFluencySubmitPayload(allAnswers));
      setResult(summariseFluencyResult(res?.data || {}));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not submit the drill.');
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

  if (loading) return <div className="grid place-items-center py-20"><Spinner label="Loading your drill…" /></div>;

  if (error && !result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert tone="error">{error}</Alert>
        <Button className="mt-4" onClick={() => navigate('/student/mathpath/decimals')}>Back to Decimals</Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <PageHeader title="Drill complete" subtitle={`${result.correct}/${result.total} correct${result.averageTime != null ? ` · avg ${result.averageTime}s` : ''}.`} />
        <Card className="p-6 text-center">
          <Zap className="mx-auto h-8 w-8 text-gold-deep" />
          <p className="mt-2 text-2xl font-display font-semibold text-ink-900">{result.bandLabel}</p>
          <div className="mt-2 flex justify-center gap-2">
            <Badge tone={bandTone(result.band)}>{result.accuracy}% accurate</Badge>
            {result.goldSeconds != null && <Badge tone="neutral">gold ≤ {result.goldSeconds}s</Badge>}
          </div>
        </Card>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/student/mathpath/decimals')}>Back to Skill Map</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>Drill Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <PageHeader title="Speed Drill" subtitle={session?.skillId ? `Skill ${session.skillId} · answer quickly!` : ''} />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-semibold text-ink-500"><Timer className="h-4 w-4" /> {index + 1} / {questions.length}</span>
        <ProgressBar className="ml-4 flex-1" value={index} max={questions.length} />
      </div>

      <Card className="p-6">
        <p className="text-lg font-semibold text-ink-900">{current?.prompt}</p>
        {current?.type === 'mcq' ? (
          <div className="mt-5 grid gap-2">
            {(current.choices || []).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => { setDraft(choice); }}
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
        <Button icon={Zap} disabled={!draft.trim() || submitting} onClick={recordAndAdvance}>
          {submitting ? 'Scoring…' : isLast ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
