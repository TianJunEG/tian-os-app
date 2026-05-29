import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import RemediationPanel from '../../../components/mathpath/RemediationPanel';

const TYPE_LABEL = {
  concept_gap: 'Concept gap', calculation_error: 'Calculation', careless: 'Careless',
  method_error: 'Method', unknown: 'To review',
};

// Mistake-to-Mastery: recent mistakes with the worked solution, and a one-tap
// route into targeted practice on the same skill.
export default function MistakeReview() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [openHelp, setOpenHelp] = useState(null);

  useEffect(() => {
    (async () => {
      try { const { data } = await mathpathAPI.mistakes(); setMistakes(data.mistakes || []); }
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

  return (
    <>
      <PageHeader title="Mistake to mastery" subtitle="Review recent slips, then practise to fix them." />
      {mistakes.length === 0 ? (
        <EmptyState icon={PartyPopper} message="No mistakes to review right now. Keep practising to stay sharp." />
      ) : (
        <div className="space-y-4">
          {mistakes.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink-700">{m.skillName}</span>
                <Badge tone="neutral">{m.mistakeTypeLabel || TYPE_LABEL[m.mistakeType] || 'To review'}</Badge>
              </div>
              <div className="text-ink-900"><MathText text={m.questionStem} /></div>
              <div className="mt-2 text-sm">
                <span className="text-error-700">Your answer: <MathText text={m.studentAnswer} className="font-mono" /></span>
                <span className="mx-2 text-ink-300">·</span>
                <span className="text-success-700">Correct: <MathText text={m.correctAnswer} className="font-mono" /></span>
              </div>
              {m.workedSolution && <p className="mt-2 text-sm text-ink-500"><MathText text={m.workedSolution} /></p>}
              <div className="mt-4">
                <Button variant="secondary" size="s" icon={ArrowRight} onClick={() => setOpenHelp(openHelp === m.id ? null : m.id)}>
                  {openHelp === m.id ? 'Hide help' : 'Review steps'}
                </Button>
              </div>
              {openHelp === m.id && (
                <RemediationPanel
                  skillId={m.skillId}
                  recentAttempts={[{ correct: false, misconceptionTag: m.misconceptionTag }]}
                  onPractise={() => practiseSimilar(m.skillId)}
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
