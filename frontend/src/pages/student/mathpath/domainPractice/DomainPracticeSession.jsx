import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert, Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../../components/ui';
import { MascotBubble } from '../../../../components/MascotAvatar';
import { MathText } from '../../../../components/ui/Fraction';
import FullScreenWorkingMode from '../../../../components/learning/FullScreenWorkingMode';
import WorkingPreviewCard from '../../../../components/learning/WorkingPreviewCard';
import { getMascotForModule } from '../../../../config/mascots';
import MathSymbolBar from '../components/MathSymbolBar';
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

const REFLECTION_OPTIONS = [
  { value: 'i_know_this', label: 'Solid', color: 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200' },
  { value: 'not_sure', label: "Not sure", color: 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200' },
  { value: 'i_need_practice', label: 'Shaky', color: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200' },
  { value: 'i_need_help', label: 'Need help', color: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200' },
];

export default function DomainPracticeSession({ domain }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const targetSkillId = params.get('skill') || null;
  const config = getDomainConfig(domain);
  const label = config?.label || 'Maths';
  const backRoute = `/student/mathpath/${domain}`;
  const domainSymbols = getDomainSymbols(domain);

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
  const questionStartedAt = useRef(Date.now());

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
        }
      } catch (e) {
        if (active) setError(e?.response?.data?.error || e.message || 'Could not start practice.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [domain, targetSkillId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer — runs while answering, pauses during reflection and on the result screen
  useEffect(() => {
    if (loading || result || showReflection) return undefined;
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - questionStartedAt.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [loading, result, showReflection, index]);

  const questions = session?.questions || [];
  const current = questions[index] || null;
  const isLast = index >= questions.length - 1;
  const currentWorking = current?.questionId ? (workingByQuestion[current.questionId] || {}) : {};

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

  function submitAnswer() {
    if (!current || !draft.trim()) return;
    const answer = {
      questionId: current.questionId,
      studentAnswer: draft,
      timeTaken: Math.round((Date.now() - questionStartedAt.current) / 1000),
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
    if (isLast) {
      finish(nextAnswers);
    } else {
      setIndex((i) => i + 1);
      setElapsedSec(0);
      questionStartedAt.current = Date.now();
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
      <PageHeader title={`${label} Practice`} subtitle={targetName} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink-500">Question {index + 1} of {questions.length}</span>
        <ProgressBar className="flex-1" value={index} max={questions.length} />
        <span className="shrink-0 font-mono text-sm text-ink-400">{elapsedSec}s</span>
      </div>

      <Card className="p-6">
        <p className="text-xl font-semibold leading-relaxed text-ink-900"><MathText text={current?.prompt || ''} /></p>

        {current?.type === 'mcq' ? (
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
        ) : (
          <>
            <input
              type="text"
              inputMode="text"
              value={draft}
              disabled={showReflection}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim() && !showReflection) submitAnswer(); }}
              placeholder="Type your answer"
              className="mt-5 min-h-[3.25rem] w-full rounded-xl border border-ink-200 px-4 py-3 text-xl focus:border-navy-400 focus:outline-none disabled:bg-gray-50 disabled:opacity-70"
              autoFocus={!showReflection}
            />
            {domainSymbols.length > 0 && (
              <MathSymbolBar symbols={domainSymbols} value={draft} onChange={setDraft} disabled={showReflection} className="mt-3" />
            )}
          </>
        )}

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
      </Card>

      {showReflection ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
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
        </div>
      ) : (
        <div className="flex justify-end">
          <Button icon={isLast ? CheckCircle2 : ArrowRight} disabled={!draft.trim() || submitting} onClick={submitAnswer}>
            {submitting ? 'Submitting…' : isLast ? 'Finish' : 'Next'}
          </Button>
        </div>
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
    </div>
  );
}
