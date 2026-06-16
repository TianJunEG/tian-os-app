import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';

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

export default function NumberSensePracticeSession() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const targetSkillId = params.get('skill') || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
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
        const res = await mathpathAPI.startNumberSensePractice({ targetSkillId, questionCount: 6 });
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
      const res = await mathpathAPI.submitNumberSensePractice(session.practiceSessionId, buildSubmitPayload(allAnswers));
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
        <Button className="mt-4" onClick={() => navigate('/student/mathpath/number-sense')}>Back to Number Sense</Button>
      </div>
    );
  }

  if (result) {
    const mascotMessage = result.accuracyPercentage >= 80
      ? `${result.accuracyPercentage}% — Number Sense mastered — keep it up!`
      : result.accuracyPercentage >= 50
        ? `${result.accuracyPercentage}% — Good work on Number Sense! Review the skills below to level up.`
        : `${result.accuracyPercentage}% — Every practice builds your number sense skills!`;
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <PageHeader title="Practice complete" subtitle={`You scored ${result.correct}/${result.total} (${result.accuracyPercentage}%).`} />
        <MascotBubble name="talia" message={mascotMessage} size="sm" className="mb-2" />
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
          <Button onClick={() => navigate('/student/mathpath/number-sense')}>Back to Skill Map</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>Practise Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <PageHeader title="Number Sense Practice" subtitle={session?.targetSkillId ? `Skill ${session.targetSkillId}` : ''} />
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
