import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Dumbbell, AlertTriangle, Lightbulb, Wand2 } from 'lucide-react';
import { mathpathAPI, learningTelemetryAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState, CollapsibleSection, Textarea } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import RemediationPanel from '../../../components/mathpath/RemediationPanel';
import { getModelDrawingTrainerForMistake } from '../../../mathpath/fractions/fractionMistakeToMasteryEngine';

const StrokeReplayPlayer = lazy(() => import('../../../components/learning/StrokeReplayPlayer'));

const TYPE_LABEL = {
  concept_gap: 'Concept gap', calculation_error: 'Calculation error',
  careless: 'Careless slip', method_error: 'Method error', unknown: 'To review',
};
const SOURCE_LABEL = {
  'diagnostic-skipped': 'Diagnostic skipped',
  'diagnostic-incorrect': 'Diagnostic incorrect',
  'practice-incorrect': 'Practice incorrect',
  other: 'Other',
};
const LEARNING_STATUS_LABEL = {
  new: 'New',
  acknowledged: 'You found the mistake',
  corrected: 'You fixed the mistake',
  understood: 'You showed understanding',
  mastered: 'Mastered with evidence',
};

function hasCompleteReviewData(mistake = {}) {
  return Boolean(
    (mistake.questionStem || mistake.questionText)
    && String(mistake.studentAnswer ?? '').trim()
    && String(mistake.correctAnswer ?? '').trim()
    && (mistake.skillName || mistake.skillCode || mistake.skillId)
  );
}

function WorkingReviewCard({ mistake }) {
  const insight = mistake.workingInsight || mistake.workingAnalysisResult || null;
  const hasWorking = Boolean(mistake.workingId || mistake.workingPreviewImage || mistake.extractedWorkingText);
  if (!insight && !hasWorking) return null;
  const steps = Array.isArray(insight?.detectedSteps) ? insight.detectedSteps.filter((step) => step?.text).slice(0, 3) : [];
  return (
    <section className="rounded-3xl bg-sky-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald">Working Review</p>
      {mistake.workingPreviewImage && (
        <img src={mistake.workingPreviewImage} alt="Submitted working" className="mt-3 max-h-44 w-full rounded-2xl object-contain bg-white" />
      )}
      {!insight && hasWorking && (
        <p className="mt-3 rounded-2xl bg-white p-3 text-sm text-ink-700">Working saved. Analysis is still being prepared.</p>
      )}
      {insight?.detectedMethod && <p className="mt-3 text-sm font-semibold text-emerald-deep">Method spotted: {insight.detectedMethod}</p>}
      {(insight?.detectedIssue || insight?.studentExplanation) && (
        <p className="mt-2 text-sm leading-6 text-ink-700">{insight.studentExplanation || insight.detectedIssue}</p>
      )}
      {(mistake.extractedWorkingText || insight?.extractedWorkingText) && (
        <div className="mt-3 rounded-2xl bg-white p-3 text-sm text-ink-700">
          <p className="mb-1 font-semibold text-emerald-deep">Detected from your working</p>
          <MathText text={mistake.extractedWorkingText || insight.extractedWorkingText} />
        </div>
      )}
      {steps.length > 0 && (
        <div className="mt-3 space-y-1 text-sm text-ink-700">
          {steps.map((step) => <p key={step.stepNumber || step.text}><MathText text={step.text} /></p>)}
        </div>
      )}
    </section>
  );
}

// MathPath › Mistake-to-Mastery › single mistake. Loads from the list so it does
// not depend on a per-id API method.
export default function MistakeDetail() {
  const { mistakeId } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState(null);
  const [learningMessage, setLearningMessage] = useState('');
  const [learningBusy, setLearningBusy] = useState('');
  const [reflection, setReflection] = useState('');
  const [correctionAttempt, setCorrectionAttempt] = useState('');
  const [understandingAnswer, setUnderstandingAnswer] = useState('');

  const load = async () => {
    try {
      const { data } = await mathpathAPI.mistake(mistakeId);
      setM(data || null);
      learningTelemetryAPI.recordEvent({
        eventType: 'mistake_detail_viewed',
        skillCode: data?.skillId || data?.skillCode || '',
        domain: data?.module || data?.domainId || '',
        metadata: { mistakeId, learningStatus: data?.learningStatus || '' },
      }).catch(() => {});
    } catch (e) { setError(e.response?.data?.error || 'Could not load mistake.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [mistakeId]);

  const updateLearning = async (payload) => {
    setLearningBusy(payload.action);
    setLearningMessage('');
    try {
      const { data } = await mathpathAPI.updateMistakeLearning(mistakeId, { source: 'student', ...payload });
      setLearningMessage(data.message || 'Progress saved.');
      if (payload.action === 'correct') {
        learningTelemetryAPI.recordEvent({
          eventType: 'correction_attempted',
          skillCode: m?.skillId || m?.skillCode || '',
          domain: m?.module || m?.domainId || '',
          metadata: { mistakeId, correctionCorrect: data?.correctionCorrect ?? null },
        }).catch(() => {});
      }
      await load();
    } catch (err) {
      setLearningMessage(err?.response?.data?.error || 'Could not save mistake learning progress.');
    } finally {
      setLearningBusy('');
    }
  };
  const practise = async () => {
    if (starting) return; setStarting(true);
    try {
      const skillId = m.skillCode || m.skillId;
      const isFrameworkSkillId = /^F\d{3}$/i.test(String(skillId || ''));
      if (isFrameworkSkillId) {
        navigate('/student/mathpath/practice/recommended-pathway', {
          state: {
            skillId: String(skillId).toUpperCase(),
            questionCount: 5,
            sessionType: 'remediation',
            source: 'mistake-detail',
            backTo: '/student/mathpath/mistakes',
            homeBase: '/student/mathpath/mistakes',
            homeLabel: 'Back to mistake review',
          },
        });
        return;
      }
      const { data } = await mathpathAPI.startSession({ feature: 'Mistake-to-Mastery', skillId, questionCount: 5 });
      navigate(`/student/mathpath/practice/${data.session_id}`, {
        state: {
          items: data.items,
          resultsBase: '/student/mathpath',
          backTo: '/student/mathpath/mistakes',
          homeBase: '/student/mathpath/mistakes',
          homeLabel: 'Back to mistake review',
          mistakesBase: '/student/mathpath/mistakes',
        },
      });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setStarting(false); }
  };
  const modelTrainer = getModelDrawingTrainerForMistake({
    mistakeCode: m?.misconceptionTag,
    skillId: m?.skillId,
    misconceptionTag: m?.misconceptionTag,
  });

  if (loading) return <Spinner label="Loading mistake…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;
  if (!m) return <EmptyState icon={AlertTriangle} message="Mistake not found." />;
  if (!hasCompleteReviewData(m)) {
    return (
      <>
        <PageHeader title="Mistake detail" subtitle={m.skillName || m.skillCode || 'MathPath'} />
        <Card className="p-5 sm:p-6">
          <Badge tone="gold">Preparing review</Badge>
          <p className="mt-3 rounded-2xl bg-gold-100 p-3 text-sm text-gold-800">
            This review item is still being prepared. Complete question details are not available yet.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate('/student/mathpath/mistakes')}>Back to mistakes</Button>
          </div>
        </Card>
      </>
    );
  }

  const reviewed = m.status === 'reviewed' || m.status === 'resolved' || m.reviewed;
  const learningStatus = m.learningStatus || (reviewed ? 'acknowledged' : 'new');
  const correctionFlow = m.correctionFlow || {};
  const canCorrect = ['new', 'acknowledged'].includes(learningStatus);
  const canUnderstand = learningStatus === 'corrected';
  const canMaster = learningStatus === 'understood';

  return (
    <>
      <PageHeader title="Mistake detail" subtitle={`${m.topicName ? m.topicName + ' · ' : ''}${m.skillName}`} action={<Button variant="secondary" size="s" onClick={() => navigate(-1)}>← Back</Button>} />
      <Card className="p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge tone="neutral">{m.mistakeTypeLabel || TYPE_LABEL[m.mistakeType] || m.mistakeType}</Badge>
            <Badge tone="navy">{SOURCE_LABEL[m.source] || 'Source: ' + (m.source || 'other')}</Badge>
          </div>
          <Badge tone={learningStatus === 'mastered' ? 'success' : learningStatus === 'new' ? 'gold' : 'navy'}>
            {LEARNING_STATUS_LABEL[learningStatus] || 'Learning'}
          </Badge>
        </div>

        <div className="space-y-5">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-error-700">Mistake</p>
            <div className="mt-2 text-xl leading-8 text-ink-900"><MathText text={m.questionStem} /></div>
            <p className="mt-2 rounded-xl bg-error-100 px-3 py-2 text-base font-semibold text-error-700">
              Your answer: <MathText text={String(m.studentAnswer || '—')} className="font-mono" />
            </p>
          </section>
          <div className="rounded-xl bg-success-100 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-success-700">Correct Answer</div>
            <MathText text={String(m.correctAnswer)} className="text-lg font-semibold" />
          </div>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Why</p>
            <div className="mt-2 text-base leading-7 text-emerald-deep">
              {m.workedSolution ? <MathText text={m.workedSolution} /> : 'Review the method, then try a guided similar question.'}
            </div>
          </section>
          <WorkingReviewCard mistake={m} />
          {m.tutorExplanation?.strokes?.length > 0 && (
            <section className="rounded-3xl bg-emerald-tint p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald">
                  Tutor explanation
                </p>
                {m.tutorExplanation.recordedAt && (
                  <span className="text-[11px] text-ink-400">
                    {new Date(m.tutorExplanation.recordedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-600">
                Your tutor {m.tutorExplanation.hasAudio ? 'recorded' : 'drew'} this explanation to help you understand.
                Press play to watch{m.tutorExplanation.hasAudio ? ' and listen' : ''} step by step.
              </p>
              <div className="mt-3">
                <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-emerald-tint" />}>
                  <StrokeReplayPlayer
                    strokes={m.tutorExplanation.strokes}
                    background="ruled"
                    autoPlay={false}
                    audioSrc={m.explanationAudioUrl || undefined}
                  />
                </Suspense>
              </div>
            </section>
          )}
        </div>

        <section className="mt-5 rounded-3xl border border-line-soft bg-surface-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald">Mistake Learning</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-emerald-deep">Turn this mistake into evidence.</h2>
          <p className="mt-1 text-sm text-ink-600">
            A review only means you looked at the mistake. To show learning, fix it and explain the step.
          </p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-sm font-semibold text-ink-800">{correctionFlow.reflectionPrompt || 'What was the mistake?'}</p>
              <Textarea
                className="mt-2"
                value={reflection || m.reflection || ''}
                onChange={(event) => setReflection(event.target.value)}
                placeholder="Example: I used the wrong denominator first."
                disabled={!canCorrect}
              />
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-sm font-semibold text-ink-800">{correctionFlow.correctionPrompt || 'Write the corrected answer.'}</p>
              <input
                className="mt-2 min-h-[48px] w-full rounded-xl border border-line-soft bg-surface-white px-3 text-base text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40"
                value={correctionAttempt || m.correctionAttempt || ''}
                onChange={(event) => setCorrectionAttempt(event.target.value)}
                placeholder="Corrected answer"
                disabled={!canCorrect}
              />
              {canCorrect && (
                <Button
                  className="mt-3"
                  size="s"
                  onClick={() => updateLearning({
                    action: 'correct',
                    reflection: reflection || m.reflection || '',
                    correctionAttempt: correctionAttempt || m.correctionAttempt || '',
                  })}
                  disabled={learningBusy === 'correct'}
                >
                  Save correction
                </Button>
              )}
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-sm font-semibold text-ink-800">{correctionFlow.understandingPrompt || 'Why is the correct answer different?'}</p>
              <Textarea
                className="mt-2"
                value={understandingAnswer || m.understandingCheck?.answer || ''}
                onChange={(event) => setUnderstandingAnswer(event.target.value)}
                placeholder="Explain the step you will change next time."
                disabled={!canUnderstand}
              />
              {canUnderstand && (
                <Button
                  className="mt-3"
                  size="s"
                  onClick={() => updateLearning({
                    action: 'understand',
                    understandingAnswer: understandingAnswer || m.understandingCheck?.answer || '',
                  })}
                  disabled={learningBusy === 'understand'}
                >
                  Check understanding
                </Button>
              )}
            </div>
            <div className="rounded-2xl bg-success-100 p-3 text-sm text-success-700">
              <p className="font-semibold">Mastery evidence</p>
              <p className="mt-1">Mastery needs a successful correction, guided question, independent question, or recheck evidence.</p>
              {canMaster && (
                <Button
                  className="mt-3"
                  size="s"
                  onClick={() => updateLearning({
                    action: 'master',
                    masteryEvidence: {
                      evidenceType: 'successful_correction',
                      sourceId: mistakeId,
                      note: 'Student corrected and explained this mistake.',
                    },
                  })}
                  disabled={learningBusy === 'master'}
                >
                  Record mastery evidence
                </Button>
              )}
            </div>
          </div>
          {learningMessage && <p className="mt-3 text-sm font-semibold text-emerald-deep">{learningMessage}</p>}
        </section>

        <div className="mt-5 flex flex-wrap gap-2">
          {learningStatus === 'new' && (
            <Button
              variant="secondary"
              icon={Check}
              onClick={() => updateLearning({ action: 'acknowledge' })}
              disabled={learningBusy === 'acknowledge'}
            >
              I found the mistake
            </Button>
          )}
          {!showHelp && <Button variant="secondary" icon={Lightbulb} onClick={() => setShowHelp(true)}>Try Together</Button>}
          <Button icon={Dumbbell} disabled={starting} onClick={practise}>Try Again</Button>
          {modelTrainer?.href && (
            <Button icon={Wand2} variant="secondary" onClick={() => navigate(modelTrainer.href)}>
              Open model trainer
            </Button>
          )}
        </div>
      </Card>

      {showHelp && (
        <CollapsibleSection title="Remediation help" summary="Hints and model drawing pathways for this mistake." defaultOpen surface={false}>
          <RemediationPanel
            skillId={m.skillCode || m.skillId}
            recentAttempts={[{
              correct: false,
              misconceptionTag: m.misconceptionTag,
              workingAnalysisResult: m.workingInsight || m.workingAnalysisResult || null,
            }]}
            onPractise={practise}
          />
        </CollapsibleSection>
      )}
    </>
  );
}
