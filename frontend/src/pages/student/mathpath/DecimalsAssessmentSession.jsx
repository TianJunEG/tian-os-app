import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../components/ui';

// Summative Decimals assessment — a mastery-gated mixed paper across mastered
// skills, graded server-side into an exam-readiness band. Same answer flow as
// practice but no per-question adaptivity. Pure helpers are exported + tested.

const BAND_LABEL = {
  exam_ready: 'Exam Ready',
  approaching_exam_ready: 'Approaching Ready',
  exam_risk: 'Needs More Practice',
};

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────
export function buildAssessmentPayload(answers = []) {
  return {
    responses: answers
      .filter((a) => a && a.questionId != null && String(a.studentAnswer ?? '').trim() !== '')
      .map((a) => ({ questionId: a.questionId, studentAnswer: String(a.studentAnswer) })),
  };
}

export function summariseAssessmentResult(summary = {}) {
  return {
    band: summary.band || 'exam_risk',
    bandLabel: BAND_LABEL[summary.band] || BAND_LABEL.exam_risk,
    accuracy: summary.accuracy || 0,
    total: summary.total || 0,
    correct: summary.correct || 0,
    weakSkillIds: summary.weakSkillIds || [],
  };
}

function bandTone(band) {
  if (band === 'exam_ready') return 'success';
  if (band === 'approaching_exam_ready') return 'gold';
  return 'error';
}

// ── Component ───────────────────────────────────────────────────────────────
export default function DecimalsAssessmentSession() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await mathpathAPI.startDecimalsAssessment({ count: 10 });
        const data = res?.data || {};
        if (!data.questions?.length) throw new Error('No assessment questions returned.');
        if (active) setSession(data);
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e.message || 'Could not start the assessment.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const questions = session?.questions || [];
  const current = questions[index] || null;
  const isLast = index >= questions.length - 1;

  async function finish(allAnswers) {
    setSubmitting(true);
    try {
      const res = await mathpathAPI.submitDecimalsAssessment(session.practiceSessionId, buildAssessmentPayload(allAnswers));
      setResult(summariseAssessmentResult(res?.data || {}));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not submit the assessment.');
    } finally {
      setSubmitting(false);
    }
  }

  function recordAndAdvance() {
    if (!current) return;
    const next = [...answers, { questionId: current.questionId, studentAnswer: draft }];
    setAnswers(next);
    setDraft('');
    if (isLast) finish(next);
    else setIndex((i) => i + 1);
  }

  if (loading) return <div className="grid place-items-center py-20"><Spinner label="Preparing your assessment…" /></div>;

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
        <PageHeader title="Assessment complete" subtitle={`${result.correct}/${result.total} correct (${result.accuracy}%).`} />
        <Card className="p-6 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-emerald" />
          <p className="mt-2 text-2xl font-display font-semibold text-ink-900">{result.bandLabel}</p>
          <div className="mt-2"><Badge tone={bandTone(result.band)}>{result.accuracy}% accurate</Badge></div>
          {result.weakSkillIds.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Revisit</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {result.weakSkillIds.map((id) => <Badge key={id} tone="error">{id}</Badge>)}
              </div>
            </div>
          )}
        </Card>
        <Button onClick={() => navigate('/student/mathpath/decimals')}>Back to Skill Map</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <PageHeader title="Decimals Assessment" subtitle="A mixed paper across the skills you've mastered." />
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-500">Question {index + 1} of {questions.length}</span>
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
        <Button icon={isLast ? CheckCircle2 : ArrowRight} disabled={!draft.trim() || submitting} onClick={recordAndAdvance}>
          {submitting ? 'Submitting…' : isLast ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
