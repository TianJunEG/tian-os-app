import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Dumbbell, AlertTriangle } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';

const TYPE_LABEL = {
  concept_gap: 'Concept gap', calculation_error: 'Calculation error',
  careless: 'Careless slip', method_error: 'Method error', unknown: 'To review',
};

// MathPath › Mistake-to-Mastery › single mistake. Loads from the list so it does
// not depend on a per-id API method.
export default function MistakeDetail() {
  const { mistakeId } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
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

  const review = async () => { await mathpathAPI.reviewMistake(mistakeId, { source: 'student' }); load(); };
  const practise = async () => {
    if (starting) return; setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ feature: 'Mistake-to-Mastery', skillId: m.skillId, questionCount: 5 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items, backTo: '/student/mathpath/mistakes' } });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setStarting(false); }
  };

  if (loading) return <Spinner label="Loading mistake…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;
  if (!m) return <EmptyState icon={AlertTriangle} message="Mistake not found." />;

  const reviewed = m.status === 'reviewed' || m.status === 'resolved' || m.reviewed;

  return (
    <>
      <PageHeader title="Mistake detail" subtitle={`${m.topicName ? m.topicName + ' · ' : ''}${m.skillName}`} />
      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <Badge tone="neutral">{TYPE_LABEL[m.mistakeType] || m.mistakeType}</Badge>
          <Badge tone={reviewed ? 'success' : 'gold'}>{m.status === 'resolved' ? 'Resolved' : reviewed ? 'Reviewed' : 'New'}</Badge>
        </div>

        <div className="mb-4 text-xl text-ink-900"><MathText text={m.questionStem} /></div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-error-100 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-error-700">Your answer</div>
            <MathText text={String(m.studentAnswer || '—')} className="font-semibold" />
          </div>
          <div className="rounded-xl bg-success-100 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-success-700">Correct answer</div>
            <MathText text={String(m.correctAnswer)} className="font-semibold" />
          </div>
        </div>

        {m.workedSolution && (
          <div className="mb-4 rounded-xl bg-navy-050 p-4">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-navy-500">Worked solution</div>
            <div className="text-sm text-navy-800"><MathText text={m.workedSolution} /></div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!reviewed && <Button variant="secondary" icon={Check} onClick={review}>Mark as reviewed</Button>}
          <Button icon={Dumbbell} disabled={starting} onClick={practise}>Practise similar</Button>
        </div>
      </Card>
    </>
  );
}
