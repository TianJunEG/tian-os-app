import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Dumbbell, AlertTriangle, Lightbulb, Wand2 } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState, CollapsibleSection } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import RemediationPanel from '../../../components/mathpath/RemediationPanel';
import { getModelDrawingTrainerForMistake } from '../../../mathpath/fractions/fractionMistakeToMasteryEngine';

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

  const load = async () => {
    try {
      const { data } = await mathpathAPI.mistakes({ status: 'all' });
      const found = (data.mistakes || []).find((x) => String(x.id) === String(mistakeId));
      setM(found || null);
    } catch (e) { setError(e.response?.data?.error || 'Could not load mistake.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [mistakeId]);

  const review = async () => { await mathpathAPI.reviewMistake(mistakeId, { source: 'student' }); setShowHelp(true); load(); };
  const practise = async () => {
    if (starting) return; setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ feature: 'Mistake-to-Mastery', skillId: m.skillId, questionCount: 5 });
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

  const reviewed = m.status === 'reviewed' || m.status === 'resolved' || m.reviewed;

  return (
    <>
      <PageHeader title="Mistake detail" subtitle={`${m.topicName ? m.topicName + ' · ' : ''}${m.skillName}`} />
      <Card className="p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{m.mistakeTypeLabel || TYPE_LABEL[m.mistakeType] || m.mistakeType}</Badge>
            <Badge tone="navy">{SOURCE_LABEL[m.source] || 'Source: ' + (m.source || 'other')}</Badge>
          </div>
          <Badge tone={reviewed ? 'success' : 'gold'}>{m.status === 'resolved' ? 'Resolved' : reviewed ? 'Reviewed' : 'New'}</Badge>
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
            <div className="mt-2 text-base leading-7 text-navy-800">
              {m.workedSolution ? <MathText text={m.workedSolution} /> : 'Review the method, then try a guided similar question.'}
            </div>
          </section>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!reviewed && <Button variant="secondary" icon={Check} onClick={review}>Mark as reviewed</Button>}
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
            skillId={m.skillId}
            recentAttempts={[{ correct: false, misconceptionTag: m.misconceptionTag }]}
            onPractise={practise}
          />
        </CollapsibleSection>
      )}
    </>
  );
}
