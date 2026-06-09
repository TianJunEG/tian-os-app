import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, PartyPopper, Wand2 } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import RemediationPanel from '../../../components/mathpath/RemediationPanel';
import { getModelDrawingTrainerForMistake } from '../../../mathpath/fractions/fractionMistakeToMasteryEngine';

const TYPE_LABEL = {
  concept_gap: 'Concept gap', calculation_error: 'Calculation', careless: 'Careless',
  method_error: 'Method', unknown: 'To review',
};
const LEARNING_STATUS_LABEL = {
  new: 'New',
  acknowledged: 'Student reviewed this mistake',
  corrected: 'Student successfully corrected this mistake',
  understood: 'Student showed understanding',
  mastered: 'Student demonstrated mastery',
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
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-500">Working Review</p>
      {mistake.workingPreviewImage && (
        <img src={mistake.workingPreviewImage} alt="Submitted working" className="mt-3 max-h-44 w-full rounded-2xl object-contain bg-white" />
      )}
      {!insight && hasWorking && (
        <p className="mt-3 rounded-2xl bg-white p-3 text-sm text-ink-700">Working saved. Analysis is still being prepared.</p>
      )}
      {insight?.detectedMethod && <p className="mt-3 text-sm font-semibold text-navy-800">Method spotted: {insight.detectedMethod}</p>}
      {(insight?.detectedIssue || insight?.studentExplanation) && (
        <p className="mt-2 text-sm leading-6 text-ink-700">{insight.studentExplanation || insight.detectedIssue}</p>
      )}
      {(mistake.extractedWorkingText || insight?.extractedWorkingText) && (
        <div className="mt-3 rounded-2xl bg-white p-3 text-sm text-ink-700">
          <p className="mb-1 font-semibold text-navy-700">Detected from your working</p>
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

// Mistake-to-Mastery: recent mistakes with the worked solution, and a one-tap
// route into targeted practice on the same skill.
export default function MistakeReview() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [openHelp, setOpenHelp] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await mathpathAPI.mistakes({ domain: 'fractions' });
        const loaded = data.mistakes || [];
        console.info('[mistakes] displayed', { view: 'review', count: loaded.length });
        setMistakes(loaded);
      }
      catch (err) { setError(err?.response?.data?.error || 'Could not load mistakes.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const practiseSimilar = async (skillId) => {
    if (starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ skillId, questionCount: 5, feature: 'Mistake-to-Mastery' });
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
    } catch (_) { setStarting(false); }
  };

  if (loading) return <Spinner label="Loading mistakes…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  return (
    <>
      <PageHeader title="Mistake to mastery" subtitle="Review recent slips, then practise to fix them." />
      {mistakes.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          message="No mistakes to review yet. Complete more practice and Tian OS will show questions to review here."
        >
          <Button to="/student/mathpath">Complete more practice</Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {mistakes.map((m) => (
            <Card key={m.id} className="p-5 sm:p-6">
              {!hasCompleteReviewData(m) ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-navy-700">{m.skillName || m.skillCode || 'MathPath'}</span>
                    <Badge tone="gold">Preparing review</Badge>
                  </div>
                  <p className="rounded-2xl bg-gold-100 p-3 text-sm text-gold-800">
                    This review item is still being prepared. Complete question details are not available yet.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="s" variant="secondary" onClick={() => navigate('/student/mathpath/mistakes')}>Back to mistakes</Button>
                  </div>
                </div>
              ) : (
              <>
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-navy-700">{m.skillName}</span>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge tone="neutral">{m.mistakeTypeLabel || TYPE_LABEL[m.mistakeType] || 'To review'}</Badge>
                  <Badge tone={m.learningStatus === 'mastered' ? 'success' : m.learningStatus === 'new' ? 'gold' : 'navy'}>
                    {LEARNING_STATUS_LABEL[m.learningStatus || 'new']}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-error-700">Mistake</p>
                  <div className="mt-2 text-xl leading-8 text-ink-900"><MathText text={m.questionStem} /></div>
                  <p className="mt-2 rounded-xl bg-error-100 px-3 py-2 text-base font-semibold text-error-700">
                    Your answer: <MathText text={m.studentAnswer || '-'} className="font-mono" />
                  </p>
                </section>
                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-success-700">Correct Answer</p>
                  <p className="mt-2 rounded-xl bg-success-100 px-3 py-2 text-base font-semibold text-success-700">
                    <MathText text={m.correctAnswer || '-'} className="font-mono" />
                  </p>
                </section>
                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Why</p>
                  {m.workedSolution ? (
                    <p className="mt-2 text-base leading-7 text-ink-700"><MathText text={m.workedSolution} /></p>
                  ) : (
                    <p className="mt-2 text-base leading-7 text-ink-600">Review the method, then try a similar question with guidance.</p>
                  )}
                </section>
                <WorkingReviewCard mistake={m} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" size="s" icon={ArrowRight} onClick={() => setOpenHelp(openHelp === m.id ? null : m.id)}>
                  {openHelp === m.id ? 'Hide Try Together' : 'Try Together'}
                </Button>
                <Button size="s" onClick={() => practiseSimilar(m.skillId)} disabled={starting}>Try Again</Button>
                {(() => {
                  const modelTrainer = getModelDrawingTrainerForMistake({
                    mistakeCode: m.misconceptionTag,
                    skillId: m.skillId,
                    misconceptionTag: m.misconceptionTag,
                  });
                  return modelTrainer?.href ? (
                    <Button
                      size="s"
                      variant="secondary"
                      icon={Wand2}
                      onClick={() => navigate(modelTrainer.href)}
                    >
                      Open model trainer
                    </Button>
                  ) : null;
                })()}
              </div>
              {openHelp === m.id && (
                <div className="mt-4 rounded-xl border border-hairline bg-navy-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-navy-700">Try Together</p>
                  <RemediationPanel
                    skillId={m.skillId}
                    recentAttempts={[{
                      correct: false,
                      misconceptionTag: m.misconceptionTag,
                      workingAnalysisResult: m.workingInsight || m.workingAnalysisResult || null,
                    }]}
                    onPractise={() => practiseSimilar(m.skillId)}
                  />
                </div>
              )}
              </>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
