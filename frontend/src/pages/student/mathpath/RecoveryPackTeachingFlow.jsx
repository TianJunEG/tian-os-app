import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, ErrorState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';

const STAGE_LABELS = {
  what_learning: 'What you are learning',
  worked_example: 'Worked Example',
  visual_explanation: 'Visual Explanation',
  guided_practice: 'Try this with help',
  independent_practice: 'Now try on your own',
  mastery_check: 'Mastery Check',
  recheck_ready: 'Recheck Ready',
};

function normaliseAnswer(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function answerIsCorrect(answer = '', question = {}) {
  const expected = normaliseAnswer(question.expectedAnswer || '');
  if (!expected) return Boolean(String(answer || '').trim());
  return normaliseAnswer(answer) === expected;
}

function stageDone(pack, stageId) {
  return Boolean((pack?.assignment?.completedStages || []).includes(stageId)
    || (pack?.stages || []).find((stage) => stage.stageId === stageId)?.completed);
}

function VisualModelCard({ visual }) {
  const label = visual?.visualModel?.label || String(visual?.visualModelType || 'visual model').replace(/_/g, ' ');
  return (
    <div className="mt-3 rounded-2xl border border-line-soft bg-white p-4">
      <p className="text-sm font-semibold text-ink-800">{label}</p>
      {visual?.renderable ? (
        <div className="mt-3 grid gap-2">
          <div className="h-8 overflow-hidden rounded-full border border-emerald-border bg-emerald-tint">
            <div className="h-full w-2/3 bg-gold-border" />
          </div>
          <div className="flex justify-between text-xs font-semibold text-ink-500">
            <span>same whole</span>
            <span>equal parts</span>
            <span>check method</span>
          </div>
        </div>
      ) : (
        <p className="mt-2 rounded-xl bg-gold-tint px-3 py-2 text-sm text-gold-deep">{visual?.fallbackText}</p>
      )}
      <p className="mt-3 text-sm text-ink-700">{visual?.explanation}</p>
    </div>
  );
}

function QuestionCard({ question, stageId, onSubmit, disabled = false }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const answered = Boolean(question.progress?.answered);

  const submit = async () => {
    const correct = answerIsCorrect(answer, question);
    await onSubmit({ stageId, questionId: question.questionId, correct });
    setFeedback(correct ? 'Good. You can continue.' : 'Not quite. Check the model and try the next step carefully.');
    setAnswer('');
  };

  return (
    <div className="rounded-2xl border border-line-soft bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-ink-800">{question.prompt}</p>
        {answered && <Badge tone={question.progress?.correct ? 'success' : 'gold'}>{question.progress?.correct ? 'Done' : 'Tried'}</Badge>}
      </div>
      {question.scaffold && <p className="mt-2 rounded-xl bg-emerald-tint px-3 py-2 text-sm text-emerald-deep">{question.scaffold}</p>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={disabled}
          placeholder="Type your answer or first step"
          className="min-h-[48px] flex-1 rounded-xl border border-line-soft bg-surface-white px-3 text-base text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        />
        <Button onClick={submit} disabled={disabled || !answer.trim()}>Check</Button>
      </div>
      {feedback && <p className="mt-2 text-sm font-semibold text-emerald-deep">{feedback}</p>}
    </div>
  );
}

export default function RecoveryPackTeachingFlow() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await mathpathAPI.mathPathRecoveryPackTeachingFlow(assignmentId);
      setPack(data.recoveryPack);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load this Recovery Pack.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [assignmentId]);

  const markProgress = async ({ stageId, questionId = '', correct = true }) => {
    setBusy(`${stageId}:${questionId}`);
    setMessage('');
    try {
      const { data } = await mathpathAPI.updateMathPathRecoveryPackTeachingProgress(assignmentId, {
        stageId,
        questionId,
        correct,
      });
      setPack(data.recoveryPack);
      if (stageId === 'mastery_check' && data.recoveryPack?.recheckReady) {
        setMessage("Great, you're ready to check again.");
      }
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not save progress. Try again.');
    } finally {
      setBusy('');
    }
  };

  const runRecheck = async () => {
    setBusy('recheck');
    setMessage('');
    try {
      const { data } = await mathpathAPI.createAssignmentRecheck(assignmentId);
      if (data.diagnosticSessionId) {
        navigate(`/student/mathpath/diagnostic/session/${data.diagnosticSessionId}`);
        return;
      }
      setMessage(data.message || 'Recheck is not ready yet.');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Finish the Recovery Pack before recheck.');
    } finally {
      setBusy('');
    }
  };

  const progress = useMemo(() => {
    const stages = pack?.stages || [];
    const visible = stages.filter((stage) => stage.stageId !== 'recheck_ready');
    const done = visible.filter((stage) => stage.completed).length;
    return { done, total: visible.length || 1, percent: Math.round((done / (visible.length || 1)) * 100) };
  }, [pack]);

  if (loading) return <Spinner label="Loading Recovery Pack..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!pack) return <ErrorState message="Recovery Pack unavailable." onRetry={load} />;

  const assignment = pack.assignment || {};

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={assignment.title || 'Recovery Pack'}
        subtitle="A short guided lesson before you practise independently."
        action={<Badge tone={pack.recheckReady ? 'success' : 'navy'}>{pack.recheckReady ? 'Recheck ready' : 'In progress'}</Badge>}
      />

      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-800">Teaching flow progress</p>
            <p className="text-sm text-ink-500">{progress.done}/{progress.total} stages completed</p>
          </div>
          <span className="font-mono text-lg font-semibold text-emerald-deep">{progress.percent}%</span>
        </div>
        <ProgressBar value={progress.percent} className="mt-3" />
      </Card>

      {message && <Card className="mb-4 p-3 text-sm font-semibold text-emerald-deep">{message}</Card>}

      {pack.warnings?.length ? (
        <Card className="mb-4 p-4" tone="yellow">
          <p className="text-sm font-semibold text-gold-deep">Some practice questions are using safe fallbacks.</p>
          <p className="mt-1 text-sm text-gold-deep">The lesson still works, and Tian OS recorded which question records need review.</p>
        </Card>
      ) : null}

      <div className="space-y-4">
        <Card className="p-5" tone="lavender">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{STAGE_LABELS.what_learning}</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">Let’s learn why this happens.</h2>
              <p className="mt-2 text-sm text-ink-700">{pack.whatLearning?.explanation}</p>
              {pack.whatLearning?.skillLabels?.length ? (
                <p className="mt-2 text-sm font-semibold text-emerald-deep">{pack.whatLearning.skillLabels.join(', ')}</p>
              ) : null}
            </div>
            {stageDone(pack, 'what_learning') && <CheckCircle className="h-5 w-5 text-success-700" />}
          </div>
          {!stageDone(pack, 'what_learning') && (
            <Button className="mt-4" onClick={() => markProgress({ stageId: 'what_learning' })} disabled={busy.startsWith('what_learning')}>
              Start
            </Button>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{STAGE_LABELS.worked_example}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">{pack.workedExample?.title || 'Worked Example'}</h2>
          <div className="mt-4 grid gap-3">
            <p className="rounded-xl bg-tianRose px-3 py-2 text-sm text-ink-700"><span className="font-semibold">Common wrong method:</span> {pack.workedExample?.content?.incorrectMethod || 'A common shortcut gives the wrong relationship.'}</p>
            <p className="rounded-xl bg-gold-tint px-3 py-2 text-sm text-gold-deep"><span className="font-semibold">Why it does not work:</span> {pack.workedExample?.content?.whyIncorrect || 'The method does not match the fraction meaning.'}</p>
            <p className="rounded-xl bg-success-100 px-3 py-2 text-sm text-success-700"><span className="font-semibold">Correct method:</span> {pack.workedExample?.content?.correctMethod || 'Work step by step and keep the parts labelled.'}</p>
            <p className="rounded-xl bg-surface-white px-3 py-2 text-sm text-ink-700"><span className="font-semibold">Key takeaway:</span> {pack.workedExample?.content?.keyTakeaway || 'Use the model first, then calculate.'}</p>
          </div>
          {!stageDone(pack, 'worked_example') && (
            <Button className="mt-4" onClick={() => markProgress({ stageId: 'worked_example' })} disabled={busy.startsWith('worked_example')}>
              I understand this example
            </Button>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{STAGE_LABELS.visual_explanation}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">See the idea before calculating.</h2>
          <VisualModelCard visual={pack.visualExplanation} />
          {!stageDone(pack, 'visual_explanation') && (
            <Button className="mt-4" onClick={() => markProgress({ stageId: 'visual_explanation' })} disabled={busy.startsWith('visual_explanation')}>
              I have viewed the model
            </Button>
          )}
        </Card>

        <Card className="p-5" tone="sky">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{STAGE_LABELS.guided_practice}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">Try this with help.</h2>
          <div className="mt-4 space-y-3">
            {(pack.guidedPractice?.questions || []).map((question) => (
              <QuestionCard
                key={question.questionId}
                question={question}
                stageId="guided_practice"
                onSubmit={markProgress}
                disabled={busy.startsWith('guided_practice')}
              />
            ))}
          </div>
        </Card>

        <Card className="p-5" tone="mint">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{STAGE_LABELS.independent_practice}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">Now try on your own.</h2>
          <div className="mt-4 space-y-3">
            {(pack.independentPractice?.questions || []).map((question) => (
              <QuestionCard
                key={question.questionId}
                question={question}
                stageId="independent_practice"
                onSubmit={markProgress}
                disabled={busy.startsWith('independent_practice')}
              />
            ))}
          </div>
        </Card>

        <Card className="p-5" tone="yellow">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{STAGE_LABELS.mastery_check}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">Show that the skill is getting stronger.</h2>
          <div className="mt-4 space-y-3">
            {(pack.masteryCheck?.questions || []).map((question) => (
              <QuestionCard
                key={question.questionId}
                question={question}
                stageId="mastery_check"
                onSubmit={markProgress}
                disabled={busy.startsWith('mastery_check')}
              />
            ))}
          </div>
        </Card>

        <Card className="p-5" tone={pack.recheckReady ? 'mint' : 'paper'}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{STAGE_LABELS.recheck_ready}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">
            {pack.recheckReady ? "Great, you're ready to check again." : 'Finish the teaching flow to unlock recheck.'}
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            {pack.recheckReady
              ? 'This recheck will show what improved after your Recovery Pack.'
              : 'Complete the example, model, guided practice, independent practice, and mastery check first.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={RefreshCw} onClick={runRecheck} disabled={!pack.recheckReady || busy === 'recheck'}>
              Run Recheck
            </Button>
            <Button variant="secondary" icon={ArrowRight} onClick={() => navigate('/student/mathpath/assignments')}>
              Back to Recovery Packs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
