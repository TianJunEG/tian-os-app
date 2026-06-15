import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';

// Interactive Decimals practice session. Pulls a server-built question set
// (answers stripped) from /api/mathpath/decimals/practice/start, collects
// answers one question at a time, then submits for grading. The server owns
// correctness, so feedback is shown on the result screen. Pure helpers are
// exported and unit-tested; the component is thin orchestration over them.

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────
export function buildSubmitPayload(answers = []) {
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

export function summarisePracticeResult(summary = {}) {
  const acc = summary.accuracySummary || {};
  const perSkill = summary.perSkill || {};
  return {
    total: acc.total || 0,
    correct: acc.correct || 0,
    accuracyPercentage: acc.accuracyPercentage || 0,
    skillRows: Object.entries(perSkill).map(([skillId, s]) => ({
      skillId,
      accuracy: s.accuracy || 0,
      status: s.status || 'learning',
    })),
  };
}

function statusTone(status) {
  if (status === 'mastered') return 'gold';
  if (status === 'learning') return 'navy';
  return 'error';
}

// ── Component ───────────────────────────────────────────────────────────────
export default function DecimalsPracticeSession() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const targetSkillId = params.get('skill') || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null); // { practiceSessionId, questions }
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const questionStartedAt = useRef(Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await mathpathAPI.startDecimalsPractice({ targetSkillId, questionCount: 6 });
        const data = res?.data || {};
        if (!data.questions?.length) throw new Error('No questions returned.');
        if (active) {
          setSession(data);
          questionStartedAt.current = Date.now();
        }
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e.message || 'Could not start practice.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [targetSkillId]);

  const questions = session?.questions || [];
  const current = questions[index] || null;
  const isLast = index >= questions.length - 1;

  async function finish(allAnswers) {
    setSubmitting(true);
    try {
      const res = await mathpathAPI.submitDecimalsPractice(session.practiceSessionId, buildSubmitPayload(allAnswers));
      setResult(summarisePracticeResult(res?.data || {}));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not submit practice.');
    } finally {
      setSubmitting(false);
    }
  }

  function recordAndAdvance() {
    if (!current) return;
    const answer = {
      questionId: current.questionId,
      studentAnswer: draft,
      timeTaken: Math.round((Date.now() - questionStartedAt.current) / 1000),
    };
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setDraft('');
    if (isLast) {
      finish(nextAnswers);
    } else {
      setIndex((i) => i + 1);
      questionStartedAt.current = Date.now();
    }
  }

  if (loading) return <div className="grid place-items-center py-20"><Spinner label="Starting practice…" /></div>;

  if (error && !result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert tone="error">{error}</Alert>
        <Button className="mt-4" onClick={() => navigate('/student/mathpath/decimals')}>Back to Decimals</Button>
      </div>
    );
  }

  if (result) {
    const kyloMessage = result.accuracyPercentage >= 80
      ? `${result.accuracyPercentage}% — outstanding work on decimals!`
      : result.accuracyPercentage >= 50
        ? `${result.accuracyPercentage}% — solid effort! Review the skills below to level up.`
        : `${result.accuracyPercentage}% this round. Every practice makes you stronger!`;
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <PageHeader title="Practice complete" subtitle={`You scored ${result.correct}/${result.total} (${result.accuracyPercentage}%).`} />
        <MascotBubble name="kylo" message={kyloMessage} size="sm" className="mb-2" />
        <Card className="p-5">
          <ProgressBar value={result.correct} max={result.total || 1} />
          <div className="mt-4 space-y-2">
            {result.skillRows.map((row) => (
              <div key={row.skillId} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-700">{row.skillId}</span>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-ink-500">{row.accuracy}%</span>
                  <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                </span>
              </div>
            ))}
          </div>
        </Card>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/student/mathpath/decimals')}>Back to Skill Map</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>Practise Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <PageHeader title="Decimals Practice" subtitle={session?.targetSkillId ? `Skill ${session.targetSkillId}` : ''} />
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
                className={`rounded-xl border px-4 py-3 text-left text-base transition ${draft === choice ? 'border-navy-400 bg-navy-50 font-semibold text-navy-800' : 'border-ink-200 hover:border-navy-300'}`}
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
