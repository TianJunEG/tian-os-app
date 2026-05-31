import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button, Card, ProgressBar } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';
import {
  buildFractionsStorySession,
  evaluateFractionsStorySession,
  getStoryFeedback,
  FRACTIONS_STORY_SUPPORTED_SKILLS,
} from '../../../mathpath/fractions/fractionStoryModeEngine';
import { setMathPathDomainProgressState, getMathPathDomainProgressState } from '../../../mathpath/state/mathPathDomainProgressState';

function StepBadge({ type }) {
  return <span className="rounded-full bg-navy-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.04em] text-navy-700">{String(type || '').replace(/_/g, ' ')}</span>;
}

export default function FractionsStoryModeSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.studentId || 'demo-student';
  const skillId = String(location.state?.skillId || 'F025').toUpperCase();
  const safeSkillId = FRACTIONS_STORY_SUPPORTED_SKILLS.has(skillId) ? skillId : 'F025';
  const story = useMemo(() => buildFractionsStorySession({ skillId: safeSkillId, studentId }), [safeSkillId, studentId]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState(null);
  const [backendSession, setBackendSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const step = story.steps[idx];
  const isLast = idx === story.steps.length - 1;
  const progressValue = result ? story.steps.length : idx + 1;

  const ensureBackendSession = async () => {
    if (backendSession?.sessionId) return backendSession;
    try {
      const { data } = await mathpathAPI.startSession({
        mode: 'story',
        feature: 'Fractions Story Mode',
        skillId: story.skillId,
        questionCount: 1,
      });
      const started = {
        sessionId: data?.session_id || null,
        questionId: data?.items?.[0]?.questionId || null,
      };
      setBackendSession(started);
      return started;
    } catch (_) {
      return null;
    }
  };

  const persistStoryToBackend = async () => {
    try {
      setSubmitting(true);
      const started = await ensureBackendSession();
      if (!started?.sessionId || !started?.questionId) return;
      await mathpathAPI.attempt(started.sessionId, {
        questionId: started.questionId,
        answer: story.answer?.value || '',
        timeMs: Math.max(1000, (responses.length || 1) * 45000),
        hintsUsed: 0,
      });
      await mathpathAPI.complete(started.sessionId);
    } finally {
      setSubmitting(false);
    }
  };

  const submitStep = () => {
    if (!step) return;
    setResponses((prev) => {
      const next = prev.filter((r) => r.stepIndex !== idx);
      next.push({ stepIndex: idx, type: step.type, answer });
      return next;
    });
    if (isLast) {
      const finalResponses = [...responses.filter((r) => r.stepIndex !== idx), { stepIndex: idx, type: step.type, answer }];
      const scored = evaluateFractionsStorySession({ story, responses: finalResponses });
      setResult(scored);
      const existing = getMathPathDomainProgressState(studentId, 'fractions') || {};
      const weak = scored.finalCorrect ? [] : [{ skillId: story.skillId, skillName: story.title }];
      setMathPathDomainProgressState(studentId, 'fractions', {
        ...existing,
        lastSessionAt: new Date().toISOString(),
        currentSkillId: story.skillId,
        weakSkills: weak,
      });
      persistStoryToBackend();
      return;
    }
    setIdx((v) => v + 1);
    setAnswer('');
  };

  if (result) {
    const feedback = getStoryFeedback(result);
    return (
      <div className="mx-auto max-w-xl px-3 pb-28 pt-3 sm:px-0">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-success-700">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Story Complete</h2>
          </div>
          <p className="text-sm text-ink-700">{feedback.message}</p>
          <div className="mt-4 space-y-1 text-sm text-ink-700">
            <p><span className="font-semibold">Skill:</span> {story.skillId} · {story.title}</p>
            <p><span className="font-semibold">Strategy used:</span> {result.strategyUsed || '—'}</p>
            <p><span className="font-semibold">Final answer:</span> {story.answer.display}</p>
            <p><span className="font-semibold">Accuracy:</span> {result.accuracy}%</p>
          </div>
          {result.mistakeTags?.length ? (
            <div className="mt-4 rounded-xl border border-gold-300 bg-gold-100 p-3 text-sm text-gold-900">
              <p className="font-semibold">Review focus</p>
              <p className="mt-1">{result.mistakeTags.join(', ')}</p>
            </div>
          ) : null}
          <div className="mt-5 rounded-xl border border-hairline bg-slate-50 p-3 text-sm text-ink-600">
            Reflection: Which step helped you most?
          </div>
          {submitting ? <p className="mt-2 text-xs text-ink-500">Saving story attempt…</p> : null}
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>Try another story</Button>
            <Button variant="secondary" onClick={() => navigate('/student/mathpath/path')}>Back to pathway</Button>
            <Button onClick={() => navigate('/student/mathpath/review', { state: { source: 'story', reviewItems: result.stepResults } })}>Review mistake</Button>
          </div>
        </Card>
      </div>
    );
  }

  const needsTextInput = !Array.isArray(step?.choices);
  return (
    <div className="mx-auto max-w-xl px-3 pb-28 pt-3 sm:px-0">
      <Card className="mb-3 p-4">
        <p className="text-sm font-semibold text-ink-700">Problem Solving Story</p>
        <p className="mt-1 text-xs text-ink-500">{story.skillId} · {story.title}</p>
      </Card>

      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span>Step {idx + 1} of {story.steps.length}</span>
        <StepBadge type={step?.type} />
      </div>
      <ProgressBar value={progressValue} max={story.steps.length} className="mb-4" />

      <Card className="p-5">
        {idx === 0 ? (
          <div className="mb-4 rounded-xl border border-navy-200 bg-navy-50 p-3 text-sm text-navy-800">{story.prompt}</div>
        ) : null}
        <p className="text-lg leading-relaxed text-ink-900">{step?.prompt}</p>

        {needsTextInput ? (
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            className="mt-4 h-12 w-full rounded-xl border border-hairline px-4 text-base"
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2">
            {(step?.choices || []).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setAnswer(choice)}
                className={`min-h-[44px] rounded-xl border px-4 py-3 text-left text-sm ${answer === choice ? 'border-navy-500 bg-navy-50' : 'border-hairline bg-white'}`}
              >
                {choice}
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-white/95 p-3 backdrop-blur sm:static sm:mt-3 sm:border-0 sm:bg-transparent sm:p-0">
        <Button className="h-12 w-full" icon={ArrowRight} disabled={!String(answer || '').trim()} onClick={submitStep}>
          {isLast ? 'Complete Story' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
